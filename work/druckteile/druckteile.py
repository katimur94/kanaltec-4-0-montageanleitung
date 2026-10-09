#!/usr/bin/env python3
"""DSS-Flex Laser-Positionierhilfe – Druckversion (D1) der Eigenbauteile.

Erzeugt aus der Bezugsgeometrie (work/druckteile/geo.json, aus src/laser-aid.js)
druckgerechte Volumenmodelle mit CadQuery:
  * STL/3MF/STEP je Bauteil in Druckausrichtung  -> Zeichnungen/Druckteile/
  * STEP der beiden Baugruppen in Einbaulage      -> Zeichnungen/Druckteile/STEP/
  * Netze in Einbaulage + parts.json für den 3D-Viewer (Explosionsansicht)
  * Kollisions-/Freigangsprüfung über Federweg −6…+12 mm für alle fünf DN

Koordinaten: x längs (negativ = nach hinten), y hoch, z quer (+ = Laserseite), mm.
Untere Baugruppe: y = 0 ist die Oberkante der Verlängerungsplatte.
Laserkopf: y = 0 ist die Achse des Zentralrohrs.

Aufruf:  python3 work/druckteile/druckteile.py [--view OUTDIR] [--check]
"""
import json, math, os, sys, argparse
import cadquery as cq
from cadquery import Vector as V

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
GEO = json.load(open(os.path.join(HERE, 'geo.json')))
S, H = GEO['heck'], GEO['laserHead']
REF = next(d for d in GEO['dn'] if d['dn'] == GEO['ref'])

# ---------------------------------------------------------------- Grundformen
def box(x0, x1, y0, y1, z0, z1):
    return cq.Solid.makeBox(abs(x1 - x0), abs(y1 - y0), abs(z1 - z0), V(min(x0, x1), min(y0, y1), min(z0, z1)))

def cyl(r, p, d, h):
    return cq.Solid.makeCylinder(r, h, V(*p), V(*d))

def cylz(r, x, y, z0, z1): return cyl(r, (x, y, min(z0, z1)), (0, 0, 1), abs(z1 - z0))
def cyly(r, x, z, y0, y1): return cyl(r, (x, min(y0, y1), z), (0, 1, 0), abs(y1 - y0))
def cylx(r, y, z, x0, x1): return cyl(r, (min(x0, x1), y, z), (1, 0, 0), abs(x1 - x0))

def cone(r1, r2, p, d, h):
    return cq.Solid.makeCone(r1, r2, h, V(*p), V(*d))

def prism(pts, vec):
    """Polygon (3D-Punkte in einer Ebene) entlang vec extrudieren."""
    w = cq.Wire.makePolygon([V(*p) for p in pts], close=True)
    return cq.Solid.extrudeLinear(cq.Face.makeFromWires(w), V(*vec))

def U(*s):
    s = [x for x in s if x is not None]
    out = s[0]
    if len(s) > 1:
        out = out.fuse(*s[1:])
    return out.clean()

def C(a, *s):
    return a.cut(*s).clean()

def fillet_edges(shape, r, pred):
    """Kanten füllen, die pred(edge) erfüllen (Mittelpunkt-Test)."""
    edges = [e for e in shape.Edges() if pred(e)]
    if not edges:
        return shape
    try:
        return shape.fillet(r, edges)
    except Exception as ex:
        print('  Hinweis: Rundung', r, 'nicht möglich:', ex)
        return shape

def vertical_y(e):
    a, b = e.startPoint(), e.endPoint()
    return abs(a.x - b.x) < 1e-6 and abs(a.z - b.z) < 1e-6 and abs(a.y - b.y) > 1e-3

def tangent_quad(c1, r1, c2, r2, z0, z1):
    """Außentangenten-Viereck zweier Kreise (Mittelpunkte auf der x-Achse) als z-Prisma."""
    (a, ay), (b, by) = c1, c2
    D = math.hypot(b - a, by - ay)
    ux, uy = (b - a) / D, (by - ay) / D
    sb = (r2 - r1) / D
    cb = math.sqrt(1 - sb * sb)
    # Normale senkrecht zu u, gekippt um beta
    nx_u, ny_u = -uy, ux
    up = (-sb * ux + cb * nx_u, -sb * uy + cb * ny_u)
    dn = (-sb * ux - cb * nx_u, -sb * uy - cb * ny_u)
    p = [(a + r1 * up[0], ay + r1 * up[1]), (b + r2 * up[0], by + r2 * up[1]),
         (b + r2 * dn[0], by + r2 * dn[1]), (a + r1 * dn[0], ay + r1 * dn[1])]
    return prism([(x, y, z0) for x, y in p], (0, 0, z1 - z0))

def disk(cx, cy, r, z0, z1): return cylz(r, cx, cy, z0, z1)

def screw(head_d, head_h, d, L, p, dirv, csk=False):
    """Schraube als Referenzteil: Kopf bei p, Schaft in Richtung dirv."""
    dx, dy, dz = dirv
    if csk:
        head = cone(head_d / 2, d / 2, p, dirv, head_h)
    else:
        head = cyl(head_d / 2, (p[0] - dx * head_h, p[1] - dy * head_h, p[2] - dz * head_h), dirv, head_h)
    shaft = cyl(d / 2 * 0.92, p, dirv, L)
    return U(head, shaft)

def nut(af, h, p, dirv):
    """Sechskantmutter (Referenz), p = Auflagefläche, Höhe in dirv."""
    r = af / math.sqrt(3)
    dx, dy, dz = dirv
    if abs(dy) > 0.5:  # vertikal
        pts = [(p[0] + r * math.cos(math.radians(30 + 60 * i)), p[1], p[2] + r * math.sin(math.radians(30 + 60 * i))) for i in range(6)]
    else:
        pts = [(p[0], p[1] + r * math.cos(math.radians(30 + 60 * i)), p[2] + r * math.sin(math.radians(30 + 60 * i))) for i in range(6)]
    n = prism(pts, (dx * h, dy * h, dz * h))
    return C(n, cyl(af * 0.28, p, dirv, h))

# ------------------------------------------------------------ Bezugsgeometrie
P = REF['pivot']                     # [-115, 12]
A = REF['axle']                      # [-170, 6.40]
L = math.hypot(A[0] - P[0], A[1] - P[1])
WZ = S['wheel']['z']                 # -30
ARM_Z = S['fork']['armZ']            # [-41, -19]
ARM_T = S['fork']['armT']            # 4
ZO0, ZO1 = ARM_Z[0] - ARM_T / 2, ARM_Z[0] + ARM_T / 2   # Außenarm  -43 … -39
ZI0, ZI1 = ARM_Z[1] - ARM_T / 2, ARM_Z[1] + ARM_T / 2   # Innenarm  -21 … -17
SPRING_X, SPRING_Z = S['spring']['x'], S['spring']['z']
BRACKET_Y = 44.0                     # Unterkante Federwinkel (heckGeometry: top + 44)

def alpha_for(axle_y):
    """Drehwinkel der Schwinge (Grad), lokales −x zeigt von der Drehachse zur Radachse."""
    return math.degrees(math.asin((P[1] - axle_y) / L))

ALPHA0 = alpha_for(A[1])

def to_world(u, v, a=ALPHA0):
    ca, sa = math.cos(math.radians(a)), math.sin(math.radians(a))
    return P[0] + u * ca - v * sa, P[1] + u * sa + v * ca

SEAT_V = 9.0                         # Federauflage (Grund der Senkung) über der Armmitte, wie im Modell
SEAT_U = (SPRING_X - P[0] + SEAT_V * math.sin(math.radians(ALPHA0))) / math.cos(math.radians(ALPHA0))

# ------------------------------------------------------- Druck-Zugaben (mm)
REAM_PIVOT = 7.8      # Ø8 H7 nach dem Druck aufreiben
REAM_BUSH = 9.8       # Ø10 H7 für Gleitlager GFM-0810-10
REAM_BRG = 11.8       # Ø12 H7 für MF128
M3_CLR, M4_CLR, M6_CLR = 3.4, 4.5, 6.6
INSERT_M3 = 4.0       # Bohrung für Gewindeeinsatz M3 (Länge 5,7)
M2_PILOT = 1.7

PARTS = {}            # name -> dict(solid=Shape (Einbaulage), print=Shape, meta=...)
REFS = {}             # Referenzteile (nicht gedruckt) in Einbaulage

def part(key, solid, group, **meta):
    PARTS[key] = dict(solid=solid, group=group, **meta)

def ref(key, solid, group, **meta):
    REFS[key] = dict(solid=solid, group=group, **meta)

# ============================================================================
# Untere Baugruppe
# ============================================================================
PL = S['plate']
X0, X1, HW, T = PL['x0'], PL['x1'], PL['w'] / 2, PL['t']
NOTCH_X0, NOTCH_Z0, NOTCH_Z1 = PL['notch']['x0'], PL['notch']['z0'], PL['notch']['z1']
OUTER_CUT_X = -140.0   # Druckversion: Außenstreifen hinter x −140 entfällt (Platz für Drehgebergehäuse)

HOLES_A = [(-88, -25), (-88, 25)]                                  # M6 + Mutter oben
HOLES_D = [(-112, -48), (-121, -48), (-112, -12), (-121, -12)]     # M3 Senk von unten -> Einsatz Lagerbock
HOLES_WF = [(-130, -48.75), (-130, -9)]                            # Abstreifer vorn, M3 + Mutter oben
HOLES_WR = [(-210, -11), (-210, -3)]                               # Abstreifer hinten, M3 + Mutter oben

def make_plate():
    p = box(X0, X1, -T, 0, -HW, HW)
    p = C(p, box(NOTCH_X0, X1 - 1, -T - 1, 1, NOTCH_Z0, NOTCH_Z1))
    p = C(p, box(OUTER_CUT_X, X1 - 1, -T - 1, 1, -HW - 1, NOTCH_Z1))
    # Ecken runden: hintere Außenecke (+z), Innenecken der Ausschnitte
    def pick(e):
        if not vertical_y(e):
            return False
        x, z = e.startPoint().x, e.startPoint().z
        return (abs(x - X1) < .01 and abs(z - HW) < .01) or (abs(x - X1) < .01 and abs(z - NOTCH_Z1) < .01) \
            or (abs(x - OUTER_CUT_X) < .01 and abs(z + HW) < .01)
    p = fillet_edges(p, 6, pick)
    def pick_in(e):
        if not vertical_y(e):
            return False
        x, z = e.startPoint().x, e.startPoint().z
        return (abs(x - NOTCH_X0) < .01 and abs(z - NOTCH_Z1) < .01) or (abs(x - NOTCH_X0) < .01 and abs(z - NOTCH_Z0) < .01) \
            or (abs(x - OUTER_CUT_X) < .01 and abs(z - NOTCH_Z0) < .01)
    p = fillet_edges(p, 2, pick_in)
    cuts = []
    for x, z in HOLES_A:
        cuts.append(cyly(M6_CLR / 2, x, z, -T - 1, 1))
    for x, z in HOLES_WF + HOLES_WR:
        cuts.append(cyly(M3_CLR / 2, x, z, -T - 1, 1))
    for x, z in HOLES_D:   # Senkung 90° von unten für ISO 10642 M3
        cuts.append(cyly(M3_CLR / 2, x, z, -T - 1, 1))
        cuts.append(cone(3.45, 1.7, (x, -T - .001, z), (0, 1, 0), 1.75))
    return C(p, *cuts)

part('platte', make_plate(), 'messrad', pos='1', name='Verlängerungsplatte', qty=1,
     mat='Prototyp PETG/ASA · Serie Alu 7 mm (STEP lasern/wasserstrahlen)',
     orient='flach, Unterseite (mit Senkungen) aufs Bett', post='—',
     printrot=[('x', 90)], explode=[0, 0, 0], color='#9aa5ae')

ST = S['strap']
def make_strap():
    s = box(ST['x0'], ST['x1'], -T - ST['t'], -T, -ST['w'] / 2, ST['w'] / 2)
    s = fillet_edges(s, 4, vertical_y)
    return C(s, *[cyly(M6_CLR / 2, x, z, -T - ST['t'] - 1, -T + 1) for x, z in ST['bolts']])

part('lasche', make_strap(), 'messrad', pos='2', name='Verbindungslasche', qty=1,
     mat='Prototyp PETG/ASA · Serie Edelstahl 6 mm (STEP)',
     orient='flach aufs Bett', post='—', printrot=[('x', 90)], explode=[0, -45, 0], color='#7d8a94')

# --- Lagerbock (Gabelkopf) -------------------------------------------------
BK = dict(x0=-104.0, x1=-124.0, z0=-52.0, z1=-8.0, base=4.0, h=24.0, slot=(-44.0, -16.0))
def make_block():
    b = box(BK['x0'], BK['x1'], 0, BK['base'], BK['z0'], BK['z1'])
    b = U(b, box(BK['x0'], BK['x1'], BK['base'] - .01, BK['h'], BK['z0'], BK['slot'][0]),
          box(BK['x0'], BK['x1'], BK['base'] - .01, BK['h'], BK['slot'][1], BK['z1']))
    # Freischnitt hinter der Drehachse: Schwinge darf beim Ausfedern tiefer
    b = C(b, box(-112, BK['x1'] - 1, -1, BK['base'] + 1, BK['slot'][0], BK['slot'][1]))
    b = fillet_edges(b, 1.5, lambda e: vertical_y(e) and abs(e.startPoint().y) < .01)
    cuts = [cylz(REAM_PIVOT / 2, P[0], P[1], BK['z0'] - 1, BK['z1'] + 1)]
    for x, z in HOLES_D:
        cuts.append(cyly(INSERT_M3 / 2, x, z, -1, 6.5))
    for x in (-109, -119):
        cuts.append(cyly(INSERT_M3 / 2, x, -48, BK['h'] - 9, BK['h'] + 1))
    return C(b, *cuts)

part('lagerbock', make_block(), 'messrad', pos='3', name='Lagerbock (Gabelkopf)', qty=1,
     mat='PETG/ASA oder PA12 (SLS/MJF)', orient='stehend, Grundplatte aufs Bett',
     post='Bohrung Ø8 auf 8 H7 reiben · 6 Gewindeeinsätze M3 einschmelzen (4 unten, 2 oben)',
     printrot=[('x', 90)], explode=[0, 30, 0], color='#c98b2b')

# --- Federwinkel mit Federführung und Kabelbinder-Schlitzen --------------------
BR = dict(x0=-106.0, x1=-145.0, web=-122.0, z0=-53.0, z1=-41.0, t=5.0)
PAD_R = 9.0
SEAT_DEPTH = 1.5
def make_bracket():
    y0, y1 = BRACKET_Y, BRACKET_Y + BR['t']
    web = box(BR['x0'], BR['web'], 24, y0 + .01, BR['z0'], BR['z1'])
    arm = box(BR['x0'], SPRING_X, y0, y1, BR['z0'], BR['z1'])
    pad = cyly(PAD_R, SPRING_X, SPRING_Z, y0 - SEAT_DEPTH, y1)
    b = U(web, arm, pad)
    b = fillet_edges(b, 1.5, lambda e: vertical_y(e) and e.startPoint().y > y0 - 2 and abs(e.startPoint().x - BR['x0']) < .01)
    cuts = [cyly(13.8 / 2, SPRING_X, SPRING_Z, y0 - SEAT_DEPTH - 1, y0)]   # Federsenkung
    for x in (-109, -119):
        cuts.append(cyly(M3_CLR / 2, x, -48, 23, y1 + 1))
        cuts.append(cyly(6.6 / 2, x, -48, y1 - 3.4, y1 + 1))             # Kopfsenkung DIN 912
    for z in (-50.5, -43.5):                                             # Kabelbinder 4 × 2
        cuts.append(box(-128, -132, y0 - 1, y1 + 1, z - 1, z + 1))
    b = C(b, *cuts)
    b = U(b, cyly(4.5, SPRING_X, SPRING_Z, y0 - 4, y0 + .01))  # Zentrierzapfen Ø9
    return b

part('federwinkel', make_bracket(), 'messrad', pos='4', name='Federwinkel mit Zugentlastung', qty=1,
     mat='PETG/ASA oder PA12', orient='kopfüber, Oberseite aufs Bett (Zapfen zeigt nach oben)',
     post='—', printrot=[('x', -90)], explode=[0, 75, 0], color='#c98b2b')

# --- Schwinge: zwei flach gedruckte Arme ------------------------------------
R_HUB, R_EYE, U_FLAT = 7.0, 11.0, -20.0
U_EAR = -L - 17.5    # Lasche für die Gehäuseschrauben hinter dem Auge (nur Außenarm)
XB = (-17.5, -9.5)   # Querriegel
def arm_profile(z0, z1, ear=False, seat=False):
    s = [disk(0, 0, R_HUB, z0, z1), disk(U_FLAT, 0, R_HUB, z0, z1), disk(-L, 0, R_EYE, z0, z1),
         tangent_quad((0, 0), R_HUB, (U_FLAT, 0), R_HUB, z0, z1),
         tangent_quad((U_FLAT, 0), R_HUB, (-L, 0), R_EYE, z0, z1)]
    if ear:
        s += [disk(U_EAR, 0, 7, z0, z1), tangent_quad((-L, 0), R_EYE, (U_EAR, 0), 7, z0, z1)]
    if seat:
        s.append(box(SEAT_U - 7.2, SEAT_U + 7.2, 0, SEAT_V + 1.2, z0, z1))
    return U(*s)

def make_arm_outer():
    a = arm_profile(ZO0, ZO1, ear=True, seat=True)
    tab = box(SEAT_U - 7.2, SEAT_U + 7.2, SEAT_V - 9, SEAT_V + 1.2, SPRING_Z - 7.5, ZO0 + .01)
    a = U(a, tab)
    cuts = [cylz(REAM_BUSH / 2, 0, 0, ZO0 - 1, ZO1 + 1),                         # Gleitlager
            cylz(REAM_BRG / 2, -L, 0, ZO0 + .5, ZO1 + 1),                        # MF128 von innen
            cylz(7.1, -L, 0, ZO1 - .9, ZO1 + 1),                                 # Bund 13,6 × 0,8 versenkt
            cylz(4.5, -L, 0, ZO0 - 1, ZO1 + 1),
            cyly(13.8 / 2, SEAT_U, SPRING_Z, SEAT_V, SEAT_V + 2)]               # Federsenkung 1,2
    for v in (-3.5, 3.5):                                                        # Querriegel, Senk M3
        cuts.append(cylz(M3_CLR / 2, XB[0] / 2 + XB[1] / 2, v, ZO0 - 1, ZO1 + 1))
        cuts.append(cone(3.45, 1.7, (XB[0] / 2 + XB[1] / 2, v, ZO0 - .001), (0, 0, 1), 1.75))
    for v in (-4, 4):                                                            # Gehäuse M2
        cuts.append(cylz(M2_PILOT / 2, U_EAR, v, ZO0 - 1, ZO1 + 1))
    return C(a, *cuts)

def make_arm_inner():
    a = arm_profile(ZI0, ZI1)
    boss = cylz(R_HUB, 0, 0, ZO1, ZI0 + .01)
    bar = box(XB[0], XB[1], -R_HUB, R_HUB, ZO1, ZI0 + .01)
    a = U(a, boss, bar)
    cuts = [cylz(REAM_BUSH / 2, 0, 0, ZI1 - 10, ZI1 + 1),
            cylz(REAM_BUSH / 2, 0, 0, ZO1 - 1, ZO1 + 6),
            cylz(4.3, 0, 0, ZO1, ZI1),
            cylz(REAM_BRG / 2, -L, 0, ZI0 - 1, ZI0 + 3.5),
            cylz(7.1, -L, 0, ZI0 - 1, ZI0 + .9),
            cylz(4.5, -L, 0, ZI0, ZI1 + 1)]
    for v in (-3.5, 3.5):
        cuts.append(cylz(INSERT_M3 / 2, (XB[0] + XB[1]) / 2, v, ZO1 - 1, ZO1 + 8))
    return C(a, *cuts)

def rocker_place(shape, a=ALPHA0):
    return shape.rotate(V(0, 0, 0), V(0, 0, 1), a).translate(V(P[0], P[1], 0))

ARM_O_LOCAL, ARM_I_LOCAL = make_arm_outer(), make_arm_inner()
part('schwinge_aussen', rocker_place(ARM_O_LOCAL), 'messrad', pos='5a', name='Schwinge Außenarm mit Federteller', qty=1,
     mat='PETG/ASA oder PA12', orient='flach, Innenseite aufs Bett (Federteller zeigt nach oben)',
     post='Ø10 auf 10 H7, Lagersitz auf 12 H7 reiben', local=ARM_O_LOCAL, rocker=True,
     printrot=[('y', 180)], explode=[0, 10, -40], color='#2f7fb8')
part('schwinge_innen', rocker_place(ARM_I_LOCAL), 'messrad', pos='5b', name='Schwinge Innenarm mit Nabe und Querriegel', qty=1,
     mat='PETG/ASA oder PA12', orient='flach, Außenseite aufs Bett (Nabe und Riegel nach oben)',
     post='Ø10 auf 10 H7, Lagersitz auf 12 H7 reiben · 2 Gewindeeinsätze M3 in den Riegel',
     local=ARM_I_LOCAL, rocker=True, printrot=[('y', 180)], explode=[0, 10, 40], color='#3c93cf')

def make_ring():
    # Körper Ø13, an der Lagerseite 0,3 mm Ansatz Ø10: drückt nur auf den Innenring
    r = U(cylz(5.0, -L, 0, ZO1, ZO1 + .31), cylz(6.5, -L, 0, ZO1 + .3, ZO1 + 3))
    return C(r, cylz(4.15, -L, 0, ZO1 - 1, ZO1 + 4))
RING_L = make_ring()
part('distanzring_1', rocker_place(RING_L), 'messrad', pos='5c', name='Distanzring 11/8,3 × 3', qty=2,
     mat='PETG/ASA oder PA12', orient='flach', post='Länge an die Radnabe anpassen (Rad 12 breit → 3 mm)',
     local=RING_L, rocker=True, printrot=[('y', 180)], explode=[0, 0, -22], color='#3c93cf', dup='distanzring')
RING2_L = RING_L.mirror('XY', V(0, 0, (ZO1 + ZI0) / 2))
part('distanzring_2', rocker_place(RING2_L), 'messrad', pos='5c', name='Distanzring 11/8,3 × 3', qty=0,
     mat='', orient='', post='', local=RING2_L, rocker=True, printrot=[], explode=[0, 0, 22], color='#3c93cf', hidden_print=True)

# --- Drehgebergehäuse (AS5600, vergossen) ------------------------------------
POCKET = dict(u0=-L - 12, u1=-L + 11, v=12.0)
def make_sensor():
    z0, z1 = ZO0, ZO0 - 10           # -43 … -53
    hb = box(U_EAR - 3.5, -L + 13, -15, 15, z1, z0)
    hb = fillet_edges(hb, 3, lambda e: (lambda a, b: abs(a.x - b.x) < 1e-6 and abs(a.y - b.y) < 1e-6)(e.startPoint(), e.endPoint()))
    cuts = [box(POCKET['u0'], POCKET['u1'], -POCKET['v'], POCKET['v'], z1 - 1, z0 - .8),   # Tasche, Boden 0,8
            box(-L - 2.25, -L + 2.25, 11, 16, z1 - 1, z0 - 3)]                         # Kabelausgang oben
    for v in (-4, 4):
        cuts.append(cylz(1.25, U_EAR, v, z1 - 1, z0 + 1))
        cuts.append(cylz(2.2, U_EAR, v, z1 - 1, z1 + 3))
    return C(hb, *cuts)
SENSOR_L = make_sensor()
part('drehgebergehaeuse', rocker_place(SENSOR_L), 'messrad', pos='8', name='Drehgebergehäuse AS5600 (wird vergossen)', qty=1,
     mat='PETG/ASA (kein Metall: Magnetfeld)', orient='Boden (0,8 mm) aufs Bett, offen nach oben',
     post='Platine Chip voran einlegen, Kabel durch, mit Gießharz vergießen',
     local=SENSOR_L, rocker=True, printrot=[('y', 180)], explode=[0, 0, -75], color='#3a3f45')

# --- Sohlenabstreifer --------------------------------------------------------
WP = S['wiper']
def make_wiper(x, z0, z1, holes):
    y0, y1 = -T - 6, -T
    b = box(x - 4, x + 4, y0, y1, z0, z1)
    b = fillet_edges(b, 1, lambda e: (lambda a, c: abs(a.x - c.x) < 1e-6 and abs(a.y - c.y) < 1e-6)(e.startPoint(), e.endPoint()))
    lz0, lz1 = WZ - WP['lip']['w'] / 2 - .5, WZ + WP['lip']['w'] / 2 + .5
    cuts = [box(x - 1.65, x + 1.65, y0 - 1, y0 + 4, lz0, lz1)]                  # Schlitz für Lippe 3 mm
    for z in (WZ - 4, WZ + 4):
        cuts.append(cylx(M3_CLR / 2, y0 + 2, z, x - 5, x + 5))
    for hz in holes:
        cuts.append(cyly(M3_CLR / 2, x, hz, y0 - 1, y1 + 1))
        cuts.append(cyly(3.3, x, hz, y0 - 1, y0 + 3))
    return C(b, *cuts)

part('abstreifer_vorn', make_wiper(-130, -51, -2, [z for _, z in HOLES_WF]), 'messrad', pos='24a', name='Sohlenabstreifer vorn (Leiste)', qty=1,
     mat='PETG/ASA oder PA12', orient='auf der Seite liegend', post='Lippe NBR 16 × 3 einstecken, 2 × M3 quer klemmen',
     printrot=[('y', -90)], explode=[0, -32, 0], color='#5d6872')
part('abstreifer_hinten', make_wiper(-210, -38, 0, [z for _, z in HOLES_WR]), 'messrad', pos='24b', name='Sohlenabstreifer hinten (Leiste)', qty=1,
     mat='PETG/ASA oder PA12', orient='auf der Seite liegend', post='wie vorn',
     printrot=[('y', -90)], explode=[0, -32, 0], color='#5d6872')

# --- Referenzteile untere Baugruppe ------------------------------------------
def make_wheel():
    r, w = S['wheel']['r'], S['wheel']['w']
    t = C(cylz(r, -L, 0, WZ - w / 2, WZ + w / 2), cylz(15, -L, 0, WZ - w / 2 - 1, WZ + w / 2 + 1))
    hub = C(cylz(15, -L, 0, WZ - w / 2, WZ + w / 2), cylz(4, -L, 0, WZ - 9, WZ + 9))
    grooves = [box(-L - .5, -L + .5, r - 1.2, r + 1, WZ - w / 2 + .8, WZ + w / 2 - .8).rotate(V(-L, 0, 0), V(-L, 0, 1), i * 360 / 32) for i in range(32)]
    return C(t, *grooves), hub
WHEEL_L, HUB_L = make_wheel()
ref('rad', rocker_place(WHEEL_L), 'messrad', name='Messrad 200 mm Umfang (Kaufteil)', local=WHEEL_L, rocker=True, explode=[-35, -40, 0], color='#1d2227')
ref('radnabe', rocker_place(HUB_L), 'messrad', name='Radnabe', local=HUB_L, rocker=True, explode=[-35, -40, 0], color='#8a959e')
AXLE_L = cylz(4, -L, 0, ZO0 + .5, ZI1 + .5)
ref('radwelle', rocker_place(AXLE_L), 'messrad', name='Radwelle Ø8 × 26 mit Magnet', local=AXLE_L, rocker=True, explode=[0, 0, 60], color='#c3ccd3')
MAG_L = cylz(3, -L, 0, ZO0 + .5, ZO0 + 3)
ref('magnet', rocker_place(MAG_L), 'messrad', name='Magnet Ø6 × 2,5', local=MAG_L, rocker=True, explode=[0, 0, 60], color='#b0302a')
def brg(z_face, sign):
    # MF128: Gesamtbreite 3,5 inkl. Bund 13,6 × 0,8; Bund liegt versenkt (0,1 unter der Armfläche)
    zf = z_face + sign * .1
    outer = C(U(cylz(6, -L, 0, zf, zf + sign * 3.5), cylz(6.8, -L, 0, zf, zf + sign * .8)), cylz(5.2, -L, 0, zf - 1, zf + sign * 5))
    inner = C(cylz(4.75, -L, 0, zf, zf + sign * 3.5), cylz(4, -L, 0, zf - 1, zf + sign * 5))
    return U(outer, inner)
B1, B2 = brg(ZO1, -1), brg(ZI0, 1)
ref('lager_1', rocker_place(B1), 'messrad', name='Kugellager MF128', local=B1, rocker=True, explode=[0, 0, -12], color='#c3ccd3')
ref('lager_2', rocker_place(B2), 'messrad', name='Kugellager MF128', local=B2, rocker=True, explode=[0, 0, 12], color='#c3ccd3')
def bush(z_face, sign):
    s = C(cylz(5, 0, 0, z_face, z_face + sign * 9), cylz(4, 0, 0, z_face - 1, z_face + sign * 11))
    f = C(cylz(7.5, 0, 0, z_face, z_face - sign * 1), cylz(4, 0, 0, z_face - 2, z_face + 2))
    return U(s, f)
G1, G2 = bush(ZO0, 1), bush(ZI1, -1)
ref('gleitlager_1', rocker_place(G1), 'messrad', name='Gleitlager GFM-0810-10', local=G1, rocker=True, explode=[0, 10, -30], color='#e0d6b0')
ref('gleitlager_2', rocker_place(G2), 'messrad', name='Gleitlager GFM-0810-10', local=G2, rocker=True, explode=[0, 10, 30], color='#e0d6b0')
ref('lagerbolzen', cylz(4, P[0], P[1], BK['z0'] - 1, BK['z1'] + 1), 'messrad', name='Lagerbolzen Ø8 × 46 mit 2 Sicherungsringen',
    explode=[0, 30, 75], color='#c3ccd3')
# Schrauben
scr = []
for x, z in HOLES_D:
    scr.append(screw(6.7, 1.7, 3, 10, (x, -T, z), (0, 1, 0), csk=True))
for i, x in enumerate((-109, -119)):
    scr.append(screw(5.5, 3, 3, 30, (x, BRACKET_Y + BR['t'] - 3.4, -48), (0, -1, 0)))
for x, z in HOLES_A:
    scr.append(screw(10.5, 3.3, 6, 20, (x, -T - ST['t'], z), (0, 1, 0)))
    scr.append(nut(10, 6, (x, 0, z), (0, 1, 0)))
for x, z in HOLES_WF + HOLES_WR:
    scr.append(screw(5.5, 3, 3, 16, (x, -T - 3, z), (0, 1, 0)))
    scr.append(nut(5.5, 4, (x, 0, z), (0, 1, 0)))
ref('schrauben_unten', U(*scr), 'messrad', name='Schrauben/Muttern A2', explode=[0, 0, 0], color='#8f9aa3', follow='platte')
rsc = [screw(6.7, 1.7, 3, 12, ((XB[0] + XB[1]) / 2, v, ZO0), (0, 0, 1), csk=True) for v in (-3.5, 3.5)]
rsc += [screw(3.8, 1.6, 2, 10, (U_EAR, v, ZO0 - 10 + 3), (0, 0, 1)) for v in (-4, 4)]
RSC_L = U(*rsc)
ref('schrauben_schwinge', rocker_place(RSC_L), 'messrad', name='Schrauben Schwinge/Gehäuse', local=RSC_L, rocker=True, explode=[0, 10, -40], color='#8f9aa3')
ref('stuetzplatte', box(-8, X0, -T, 0, -HW, HW), 'messrad', name='Bestehende Stützplatte (Ausschnitt)', explode=[0, 0, 0], color='#d8dde1', ghost=True)

# Feder (Schraubenlinie) zwischen Federteller und Federwinkel
def make_spring(y0, y1):
    od, wire, n = S['spring']['od'], S['spring']['wire'], S['spring']['coils']
    rm = (od - wire) / 2
    h = y1 - y0
    helix = cq.Wire.makeHelix(h / n, h, rm, center=V(SPRING_X, y0, SPRING_Z), dir=V(0, 1, 0))
    start = helix.startPoint()
    tang = helix.tangentAt(0)
    circ = cq.Wire.makeCircle(wire / 2, start, tang)
    return cq.Solid.sweep(circ, [], helix, makeSolid=True, isFrenet=True)

def seat_world(a=ALPHA0):
    return to_world(SEAT_U, SEAT_V, a)[1]

ref('feder', make_spring(seat_world(), BRACKET_Y), 'messrad', name='Druckfeder 1,4 × 13 × 35', explode=[0, 52, 0], color='#c3ccd3')

# ============================================================================
# Laserkopf
# ============================================================================
LX0, LX1, LW = H['x0'], H['x1'], H['w'] / 2        # -252 … -292, ±22
LY0, LY1 = H['y0'], H['y1']                         # 11 … 50
WALL, FLOOR = 3.0, 2.4
LASER_X = GEO['laserX']                             # -265
RED_Z, GRN_Z = H['lasers'][0]['z'], H['lasers'][1]['z']
CLAMPS = H['clamps']                                # -258, -286
CLAMP_W, TUBE_R, RING_R = 8.0, 10.7, 14.5
EAR_Z = 18.2
GLAND_SIDE = (H['gland']['side']['x'], 30.0)       # Druckversion: Seitenverschraubung auf y 30 (über den Einsatz-Domen)
GLAND_REAR_Y = H['gland']['rear']['y']

def make_head():
    xa, xb = max(LX0, LX1), min(LX0, LX1)
    outer = box(xa, xb, LY0, LY1, -LW, LW)
    outer = fillet_edges(outer, H['corner'], vertical_y)
    inner = box(xa - WALL, xb + WALL, LY0 + FLOOR, LY1 + 1, -LW + WALL, LW - WALL)
    inner = fillet_edges(inner, H['corner'] - WALL, vertical_y)
    rebate = box(xa - 1.2, xb + 1.2, LY1 - 2, LY1 + 1, -LW + 1.2, LW - 1.2)
    rebate = fillet_edges(rebate, H['corner'] - 1.2, vertical_y)
    h = C(outer, inner, rebate)
    top = LY1 - 2
    # Laseraufnahmen (stehen auf dem Boden, reichen bis unters Fenster)
    red = C(cyly(6.5, LASER_X, RED_Z, LY0 + FLOOR - .01, top), cyly(4.65, LASER_X, RED_Z, top - 20.5, top + 1),
            cyly(2.5, LASER_X, RED_Z, LY0 + FLOOR + 3, top), box(LASER_X - 3, LASER_X + 3, LY0 + FLOOR + 3, LY0 + FLOOR + 10, RED_Z, RED_Z + 8))
    grn = C(cyly(8.0, LASER_X, GRN_Z, LY0 + FLOOR - .01, top), cyly(6.2, LASER_X, GRN_Z, LY0 + FLOOR, top + 1),
            box(LASER_X - 3.5, LASER_X + 3.5, LY0 + FLOOR, LY0 + FLOOR + 8, GRN_Z - 9, GRN_Z))
    # Einsatz-Dome für die Schellenschrauben (Einsatz von unten durch den Boden)
    domes = [cyly(3.6, cx, s * EAR_Z, LY0 + FLOOR - .01, LY0 + 9) for cx in CLAMPS for s in (-1, 1)]
    h = U(h, red, grn, *domes)
    h = C(h, cyly(6.2, LASER_X, GRN_Z, LY0 + FLOOR, top + 1), cyly(4.65, LASER_X, RED_Z, top - 20.5, top + 1))
    cuts = [cyly(INSERT_M3 / 2, cx, s * EAR_Z, LY0 - 1, LY0 + 9.5) for cx in CLAMPS for s in (-1, 1)]
    cuts.append(cylz(4.15, GLAND_SIDE[0], GLAND_SIDE[1], -LW - 1, -LW + WALL + 1))          # M8 seitlich
    cuts.append(cylx(4.15, GLAND_REAR_Y, 0, xb - 1, xb + WALL + 1))                          # M8 hinten
    return C(h, *cuts)

def make_clamp_top(cx):
    b = box(cx - CLAMP_W / 2, cx + CLAMP_W / 2, .5, LY0, -LW, LW)
    b = C(b, cylx(TUBE_R, 0, 0, cx - 10, cx + 10))
    b = C(b, *[cyly(M3_CLR / 2, cx, s * EAR_Z, -1, LY0 + 1) for s in (-1, 1)])
    return b

def make_clamp_bot(cx):
    ring = cylx(RING_R, 0, 0, cx - CLAMP_W / 2, cx + CLAMP_W / 2)
    ears = box(cx - CLAMP_W / 2, cx + CLAMP_W / 2, -5.5, -.5, -LW, LW)
    b = U(C(ring, box(cx - 10, cx + 10, -.5, 20, -20, 20)), ears)
    b = C(b, cylx(TUBE_R, 0, 0, cx - 10, cx + 10), box(cx - 10, cx + 10, -RING_R - 1, -RING_R + 1, -20, 20))
    b = C(b, *[cyly(M3_CLR / 2, cx, s * EAR_Z, -7, 0) for s in (-1, 1)])
    return b

part('laserkopf', make_head(), 'laser', pos='13', name='Laserkopf-Gehäuse (wird vergossen)', qty=1,
     mat='ASA oder PETG, schwarz', orient='stehend, Boden aufs Bett',
     post='4 Gewindeeinsätze M3 von unten · Laser ausrichten (Linie quer), vergießen, Fenster einkleben',
     printrot=[('x', 90)], explode=[0, 42, 0], color='#3a3f45')
for i, cx in enumerate(CLAMPS):
    part(f'schelle_oben_{i+1}', make_clamp_top(cx), 'laser', pos='14a', name='Rohrschelle Oberteil', qty=2 if i == 0 else 0,
         mat='PETG/ASA oder PA12', orient='kopfüber, Oberseite aufs Bett', post='—',
         printrot=[('x', -90)], explode=[0, 16, 0], color='#5d6872', hidden_print=(i > 0), dup='schelle_oben')
    part(f'schelle_unten_{i+1}', make_clamp_bot(cx), 'laser', pos='14b', name='Rohrschelle Unterteil', qty=2 if i == 0 else 0,
         mat='PETG/ASA oder PA12', orient='Ohren aufs Bett (Bogen oben)', post='—',
         printrot=[('x', -90)], explode=[0, -28, 0], color='#5d6872', hidden_print=(i > 0), dup='schelle_unten')

ref('zentralrohr', C(cylx(10.6, 0, 0, -240, -305), cylx(8.4, 0, 0, -241, -306)), 'laser', name='Zentralrohr Ø21,2 (Bestand)', explode=[0, 0, 0], color='#d8dde1', ghost=True)
ref('laser_rot', cyly(4.5, LASER_X, RED_Z, LY1 - 2 - 20, LY1 - 2), 'laser', name='Linienlaser rot Ø9 × 20', explode=[0, 78, 0], color='#c0392b')
ref('laser_gruen', cyly(6, LASER_X, GRN_Z, LY1 - 2 - 30, LY1 - 2), 'laser', name='Linienlaser grün Ø12 × 30', explode=[0, 78, 0], color='#27ae60')
win = box(max(LX0, LX1) - 1.3, min(LX0, LX1) + 1.3, LY1 - 2, LY1, -LW + 1.3, LW - 1.3)
ref('fenster', fillet_edges(win, H['corner'] - 1.3, vertical_y), 'laser', name='Fenster PMMA 2 mm', explode=[0, 98, 0], color='#bfe3f5', ghost=True)
lsc = []
for cx in CLAMPS:
    for s in (-1, 1):
        lsc.append(screw(5.5, 3, 3, 25, (cx, -5.5, s * EAR_Z), (0, 1, 0)))
ref('schrauben_kopf', U(*lsc), 'laser', name='4 × M3 × 25 DIN 912', explode=[0, -46, 0], color='#8f9aa3')
gl = [cylz(5.5, GLAND_SIDE[0], GLAND_SIDE[1], -LW - 9, -LW), cylx(5.5, GLAND_REAR_Y, 0, min(LX0, LX1) - 9, min(LX0, LX1))]
ref('verschraubungen', U(*gl), 'laser', name='Kabelverschraubungen M8', explode=[0, 42, 0], color='#2a2f33')

# ============================================================================
# Druckausrichtung, Export
# ============================================================================
def print_orient(shape, rots):
    s = shape
    for ax, ang in rots:
        axis = {'x': V(1, 0, 0), 'y': V(0, 1, 0), 'z': V(0, 0, 1)}[ax]
        s = s.rotate(V(0, 0, 0), axis, ang)
    bb = s.BoundingBox()
    return s.translate(V(-(bb.xmin + bb.xmax) / 2, -(bb.ymin + bb.ymax) / 2, -bb.zmin))

FILE_NAMES = {
    'platte': '01_Verlaengerungsplatte', 'lasche': '02_Verbindungslasche', 'lagerbock': '03_Lagerbock',
    'federwinkel': '04_Federwinkel', 'schwinge_aussen': '05a_Schwinge_Aussenarm', 'schwinge_innen': '05b_Schwinge_Innenarm',
    'distanzring_1': '05c_Distanzring_2x', 'drehgebergehaeuse': '08_Drehgebergehaeuse',
    'laserkopf': '13_Laserkopf_Gehaeuse', 'schelle_oben_1': '14a_Rohrschelle_Oberteil_2x',
    'schelle_unten_1': '14b_Rohrschelle_Unterteil_2x', 'abstreifer_vorn': '24a_Abstreifer_vorn',
    'abstreifer_hinten': '24b_Abstreifer_hinten'}

def export_all(outdir):
    stl, step, tmf = (os.path.join(outdir, d) for d in ('STL', 'STEP', '3MF'))
    for d in (stl, step, tmf):
        os.makedirs(d, exist_ok=True)
    rows = []
    for key, p in PARTS.items():
        if p.get('hidden_print'):
            continue
        src = p.get('local', p['solid'])
        rots = p['printrot']
        ps = print_orient(src, rots)
        fn = FILE_NAMES[key]
        cq.exporters.export(ps, os.path.join(stl, fn + '.stl'), tolerance=0.02, angularTolerance=0.1)
        cq.exporters.export(ps, os.path.join(step, fn + '.step'))
        cq.exporters.export(ps, os.path.join(tmf, fn + '.3mf'), tolerance=0.02, angularTolerance=0.1)
        bb = ps.BoundingBox()
        rows.append(dict(key=key, file=fn, pos=p['pos'], name=p['name'], qty=p['qty'], mat=p['mat'], orient=p['orient'],
                         post=p['post'], size=[round(bb.xlen, 1), round(bb.ylen, 1), round(bb.zlen, 1)],
                         volume=round(ps.Volume() / 1000, 1)))
    # Baugruppen in Einbaulage
    for grp, fn in (('messrad', 'Baugruppe_Messrad'), ('laser', 'Baugruppe_Laserkopf')):
        asm = cq.Assembly(name=fn)
        for key, p in list(PARTS.items()) + list(REFS.items()):
            if p['group'] == grp:
                col = p.get('color', '#888888')
                rgb = tuple(int(col[i:i + 2], 16) / 255 for i in (1, 3, 5))
                asm.add(p['solid'], name=key, color=cq.Color(*rgb))
        asm.save(os.path.join(step, fn + '.step'))
    return rows

def export_view(outdir):
    os.makedirs(outdir, exist_ok=True)
    items = []
    for kind, table in (('print', PARTS), ('ref', REFS)):
        for key, p in table.items():
            fn = f'{key}.stl'
            cq.exporters.export(p['solid'], os.path.join(outdir, fn), tolerance=0.05, angularTolerance=0.2)
            items.append(dict(key=key, file=fn, kind=kind, group=p['group'], name=p['name'], pos=p.get('pos', ''),
                              color=p.get('color', '#888'), explode=p.get('explode', [0, 0, 0]), ghost=p.get('ghost', False),
                              rocker=bool(p.get('rocker'))))
    json.dump(dict(items=items, laserX=LASER_X, pivot=P, axle=A, L=L, alpha0=ALPHA0, seatU=SEAT_U, seatV=SEAT_V,
                   springTop=BRACKET_Y, deflection=[-6, 12]),
              open(os.path.join(outdir, 'parts.json'), 'w'), ensure_ascii=False, indent=1)

# ============================================================================
# Prüfung: Kollisionen über den Federweg, Freigang zur Sohle, Federlänge
# ============================================================================
def check():
    static = {k: p['solid'] for k, p in PARTS.items() if p['group'] == 'messrad' and not p.get('rocker')}
    static['schrauben_unten'] = REFS['schrauben_unten']['solid']
    moving = {k: p['local'] for k, p in PARTS.items() if p.get('rocker')}
    moving.update({k: r['local'] for k, r in REFS.items() if r.get('rocker') and k not in ('magnet',)})
    report, worst = [], 0.0
    alphas = []
    for d in GEO['dn']:
        for defl in (-6, 0, 6, 12):
            alphas.append((d['dn'], defl, alpha_for(d['axle'][1] + defl)))
    for dn, defl, a in alphas:
        placed = {k: rocker_place(s, a) for k, s in moving.items()}
        for mk, ms in placed.items():
            for sk, ss in static.items():
                v = ms.intersect(ss).Volume()
                if v > 0.05:
                    report.append(f'KOLLISION DN{dn} Federweg {defl:+} mm: {mk} ↔ {sk}: {v:.2f} mm³')
        # Federlänge (Grund Senkung Schwinge → Grund Senkung Federwinkel)
        ls = BRACKET_Y - to_world(SEAT_U, SEAT_V, a)[1]
        if not (S['spring']['coils'] + 2) * S['spring']['wire'] + 1 < ls < S['spring']['free']:
            report.append(f'FEDER DN{dn} {defl:+}: Länge {ls:.1f} mm außerhalb')
    # Freigang zur Sohle (alles außer Rad und Lippen) je DN bei Federweg −6 / 0
    clear = []
    for d in GEO['dn']:
        R, top = d['R'], d['top']
        for defl in (-6, 0):
            a = alpha_for(d['axle'][1] + defl)
            mins = []
            for k, p in list(PARTS.items()) + list(REFS.items()):
                if p['group'] != 'messrad' or k in ('rad', 'radnabe', 'stuetzplatte', 'feder'):
                    continue
                s = rocker_place(p['local'], a) if p.get('rocker') else p['solid']
                verts = s.tessellate(0.2)[0]
                m = min(R - math.hypot(v.y + top, v.z) for v in verts)
                mins.append((m, k))
            m, k = min(mins)
            clear.append(f'DN{d["dn"]} Federweg {defl:+}: kleinster Abstand zur Sohle {m:.1f} mm ({k})')
    # Schwinge ↔ Rad: Querriegel/Nabe dürfen das Rad nicht berühren (alles bewegt sich mit, einmal prüfen)
    for k in ('schwinge_aussen', 'schwinge_innen', 'distanzring_1', 'distanzring_2', 'drehgebergehaeuse'):
        v = PARTS[k]['local'].intersect(WHEEL_L).Volume()
        if v > 0.05:
            report.append(f'KOLLISION Rad ↔ {k}: {v:.2f} mm³')
    seat0 = to_world(SEAT_U, SEAT_V)[1]
    return report, clear, dict(alpha0=ALPHA0, L=L, seat_u=SEAT_U, seat_y=seat0, spring_len=BRACKET_Y - seat0)

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=os.path.join(ROOT, 'Zeichnungen', 'Druckteile'))
    ap.add_argument('--view')
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--no-export', action='store_true')
    a = ap.parse_args()
    if a.check:
        rep, clear, info = check()
        print(json.dumps(info, indent=1))
        print('\n'.join(clear))
        print('\n'.join(rep) if rep else 'Keine Kollisionen.')
    if not a.no_export:
        rows = export_all(a.out)
        json.dump(rows, open(os.path.join(a.out, 'teile.json'), 'w'), ensure_ascii=False, indent=1)
        print(f'{len(rows)} Druckteile exportiert nach {a.out}')
    if a.view:
        export_view(a.view)
        print('Viewer-Netze:', a.view)
