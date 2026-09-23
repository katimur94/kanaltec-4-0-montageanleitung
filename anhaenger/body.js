import * as THREE from 'three';
import {V, TAU, box, plane, cyl, sphere, lathe, tube, bolt, mesh, torus, labelTexture} from './lib3d.js';
import {trailer} from './data.js';

// Tandem box trailer: chassis, GRP box, doors, step, awning, support legs, ramps, lights, decals.
// Movable parts register toggles (id, apply(t)); t = 0 driving position, t = 1 working position.
const L = trailer.inner.length, W = trailer.inner.width, H = trailer.inner.height, F = trailer.floorY, T = .04;
export const BOX = {L, W, H, F, T, XR: -L / 2 - T, XF: L / 2 + T, ZO: W / 2 + T, TOP: F + H + T, DOOR: trailer.door, R: trailer.wheelR};
const {XR, XF, ZO, TOP, DOOR, R} = BOX;
export const RAMP = {len: 2.0, z: [.5, .9]};
RAMP.run = Math.sqrt(RAMP.len ** 2 - F ** 2); RAMP.angle = Math.atan2(F, RAMP.run);
export const smooth = t => t * t * (3 - 2 * t);
export const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));

// Thin sheet following a 2D path in the xy-plane, extruded along z (fenders, chocks).
function sheet(points, thick, depth, m, parent, z = 0) {
 const s = new THREE.Shape(), n = points.length, off = [];
 for (let i = 0; i < n; i++) {const a = points[Math.max(0, i - 1)], b = points[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; off.push([points[i][0] - dy / l * thick, points[i][1] + dx / l * thick]);}
 s.moveTo(...points[0]); for (let i = 1; i < n; i++) s.lineTo(...points[i]); for (let i = n - 1; i >= 0; i--) s.lineTo(...off[i]); s.closePath();
 const g = new THREE.ExtrudeGeometry(s, {depth, bevelEnabled: false, curveSegments: 4}); g.translate(0, 0, -depth / 2);
 return mesh(g, m, V(0, 0, z), parent);
}
// Box between two points (beams, struts).
export function beam(a, b, w, h, m, parent, r = 0) {const o = box(w, h, a.distanceTo(b), m, a.clone().add(b).multiplyScalar(.5), parent, r); o.quaternion.setFromUnitVectors(V(0, 0, 1), b.clone().sub(a).normalize()); return o;}
function cProfile(h, w, t) {const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(w, 0); s.lineTo(w, t); s.lineTo(t, t); s.lineTo(t, h - t); s.lineTo(w, h - t); s.lineTo(w, h); s.lineTo(0, h); s.closePath(); const g = new THREE.ExtrudeGeometry(s, {depth: 1, bevelEnabled: false}); g.translate(0, 0, -.5); return g;}
// Rounded aluminium corner profile (quarter round in the +x/-z quadrant), unit length along +y.
function cornerGeo() {const s = new THREE.Shape(), r = .032; s.moveTo(0, 0); s.lineTo(r, 0); s.absarc(0, 0, r, 0, Math.PI / 2, false); s.closePath(); const g = new THREE.ExtrudeGeometry(s, {depth: 1, bevelEnabled: false, curveSegments: 10}); g.rotateX(-Math.PI / 2); return g;}

export function buildBody(M, ctx) {
 const root = new THREE.Group();
 const out = {root, doors: {}, groups: {}, ext: []};
 const chassis = new THREE.Group(); root.add(chassis); out.groups.chassis = chassis;

 // ---------- chassis ----------
 const cg = cProfile(.12, .055, .006);
 for (const s of [-1, 1]) {const r = mesh(cg, M.galv, V(-.05, F - .16, s * .60), chassis); r.rotation.y = s * Math.PI / 2; r.scale.z = L - .15;}
 for (let x = XR + .12; x < XF - .05; x += .55) box(.08, .05, 2 * ZO - .04, M.galv, V(x, F - .065, 0), chassis);
 for (const s of [-1, 1]) box(L + 2 * T + .02, .09, .035, M.galv, V(0, F - .075, s * (ZO + .004)), chassis);
 box(.035, .09, 2 * ZO + .04, M.galv, V(XF + .004, F - .075, 0), chassis);
 box(.06, .1, 2 * ZO + .04, M.galv, V(XR - .01, F - .07, 0), chassis);
 for (const z of [-.85, .85]) box(.05, .09, .14, M.rubber, V(XR - .06, F - .1, z), chassis, .01);
 // V drawbar, overrun device with anti-sway coupling, handbrake, breakaway cable, 13-pin plug
 const cx = trailer.couplingX, ch = .47;
 for (const s of [-1, 1]) beam(V(2.3, F - .12, s * .60), V(cx - .62, ch, s * .075), .07, .1, M.galv, chassis);
 box(.22, .11, .21, M.galv, V(cx - .62, ch, 0), chassis, .01);
 box(.42, .085, .1, M.galv, V(cx - .34, ch + .02, 0), chassis, .012);
 {const bell = []; for (let i = 0; i <= 10; i++) bell.push([i % 2 ? .05 : .04, i * .016]); const b = lathe(bell, M.rubber, V(cx - .26, ch + .02, 0), chassis, 20); b.rotation.z = -Math.PI / 2;}
 cyl(.033, .033, .12, M.galv, V(cx - .07, ch + .02, 0), chassis, 'x', 16);
 {const hd = new THREE.Group(); hd.position.set(cx, ch + .03, 0); chassis.add(hd);
  box(.2, .07, .09, M.plasticDark, V(-.03, .01, 0), hd, .02); sphere(.052, M.steelDark, V(.04, -.01, 0), hd).scale.set(1.2, .85, 1);
  const lev = new THREE.Group(); lev.position.set(-.07, .06, 0); lev.rotation.z = .12; hd.add(lev); box(.2, .025, .05, M.plasticBlack, V(-.05, .015, 0), lev, .01); box(.06, .03, .055, M.signalRed, V(-.14, .02, 0), lev, .01);}
 {const hb = new THREE.Group(); hb.position.set(cx - .43, ch + .07, .075); hb.rotation.z = .35; chassis.add(hb); box(.36, .03, .022, M.plasticBlack, V(.16, 0, 0), hb, .01); cyl(.012, .012, .2, M.steel, V(.12, -.04, 0), hb, 'x', 10); box(.05, .035, .03, M.signalRed, V(.33, 0, 0), hb, .01);}
 tube([V(cx - .12, ch + .06, -.06), V(cx - .05, ch - .05, -.1), V(cx + .02, ch - .04, -.06), V(cx + .01, ch - .01, -.02)], .003, M.steel, chassis, 16);
 tube([V(1.9, F - .1, -.5), V(cx - 1, .5, -.2), V(cx - .5, ch, -.12), V(cx - .25, ch - .06, -.16), V(cx - .06, ch - .08, -.12)], .007, M.cable, chassis, 30);
 {const pl = new THREE.Group(); pl.position.set(cx - .06, ch - .08, -.12); chassis.add(pl); cyl(.024, .028, .07, M.plasticBlack, V(), pl, 'x', 16); box(.03, .05, .05, M.plasticDark, V(-.05, 0, 0), pl, .006);}
 // drawbar box with lid and latches
 {const db = new THREE.Group(); db.position.set(2.95, .57, 0); chassis.add(db);
  box(.56, .28, .46, M.plasticBlack, V(0, .15, 0), db, .025); box(.58, .04, .48, M.plasticDark, V(0, .3, 0), db, .02);
  for (const z of [-.12, .12]) box(.04, .05, .03, M.steel, V(.29, .24, z), db); box(.36, .01, .01, M.steel, V(0, .32, 0), db);}
 // jockey wheel with clamp and crank (beside the drawbar near the coupling)
 {const jw = new THREE.Group(); jw.position.set(cx - .52, 0, -.17); chassis.add(jw);
  cyl(.03, .03, .5, M.galv, V(0, .42, 0), jw, 'y', 16); cyl(.024, .024, .24, M.galv, V(0, .15, 0), jw, 'y', 16); cyl(.012, .012, .12, M.galv, V(0, .72, 0), jw);
  tube([V(0, .78, 0), V(.07, .8, 0), V(.12, .78, .02)], .008, M.steel, jw, 8); cyl(.012, .012, .06, M.plasticBlack, V(.12, .75, .02), jw);
  box(.1, .09, .1, M.galv, V(0, .47, 0), jw); tube([V(.05, .47, .05), V(.12, .5, .09), V(.16, .52, .1)], .01, M.galv, jw, 8);
  box(.07, .12, .02, M.galv, V(0, .07, .045), jw); box(.07, .12, .02, M.galv, V(0, .07, -.045), jw);
  cyl(.095, .095, .06, M.rubber, V(0, .095, 0), jw, 'z', 28); cyl(.05, .05, .065, M.plasticDark, V(0, .095, 0), jw, 'z', 18);}
 // torsion axles, trailing arms, hubs, wheels, fenders, mudflaps
 const tyreGeo = new THREE.LatheGeometry([[.2, -.092], [.25, -.095], [R - .025, -.088], [R - .006, -.07], [R, -.045], [R, .045], [R - .006, .07], [R - .025, .088], [.25, .095], [.2, .092]].map(([r, y]) => new THREE.Vector2(r, y)), 64); tyreGeo.rotateX(Math.PI / 2);
 const rimGeo = new THREE.LatheGeometry([[0, .055], [.07, .055], [.09, .045], [.165, .04], [.19, .062], [.195, .062], [.195, -.06], [.185, -.06], [.17, -.02], [0, -.02]].map(([r, y]) => new THREE.Vector2(r, y)), 48); rimGeo.rotateX(Math.PI / 2);
 for (const x of trailer.axleX) {
  box(.1, .1, 1.44, M.galv, V(x + .2, F - .22, 0), chassis, .01);
  for (const s of [-1, 1]) {
   beam(V(x + .2, F - .22, s * .72), V(x, R, s * .72), .07, .06, M.galv, chassis, .01);
   const w = new THREE.Group(); w.position.set(x, R, s * .83); chassis.add(w);
   mesh(tyreGeo, M.tyre, V(), w); const rim = mesh(rimGeo, M.rim, V(), w); rim.scale.z = s;
   cyl(.06, .06, .05, M.steelDark, V(0, 0, -s * .06), w, 'z', 20); cyl(.035, .035, .03, M.galv, V(0, 0, s * .07), w, 'z', 16);
   for (let i = 0; i < 5; i++) {const a = i / 5 * TAU; bolt(.011, M.steel, V(.058 * Math.cos(a), .058 * Math.sin(a), s * .062), w, 'z');}
   for (let i = 0; i < 8; i++) {const a = i / 8 * TAU + .2; cyl(.02, .02, .006, M.blackMatte, V(.13 * Math.cos(a), .13 * Math.sin(a), s * .043), w, 'z', 12);}
  }
 }
 const fx0 = trailer.axleX[1] - .44, fx1 = trailer.axleX[0] + .44;
 for (const s of [-1, 1]) {
  sheet([[fx0, .38], [fx0 + .1, .55], [fx0 + .26, .625], [fx1 - .26, .625], [fx1 - .1, .55], [fx1, .38]], .006, .25, M.plasticBlack, chassis, s * .83);
  box(.012, .22, .24, M.rubber, V(fx0 - .005, .28, s * .83), chassis);
  for (const x of [fx0 + .3, fx1 - .3]) box(.03, .05, .03, M.galv, V(x, .655, s * .83), chassis);
 }
 for (const x of [-1.25, -1.45]) {const c = new THREE.Group(); c.position.set(x, F - .22, -.5); chassis.add(c); sheet([[-.09, 0], [.09, 0], [.02, .11], [-.09, .11]], .003, .12, M.plasticDark, c); box(.02, .04, .14, M.galv, V(.1, .06, 0), c);}
 // underrun bar, lamps, triangle reflectors, number plate
 box(.08, .08, 2.0, M.galv, V(XR - .06, .42, 0), chassis, .008);
 for (const s of [-1, 1]) beam(V(XR - .06, .46, s * .6), V(XR + .12, F - .16, s * .6), .05, .05, M.galv, chassis);
 for (const s of [-1, 1]) {
  const lamp = new THREE.Group(); lamp.position.set(XR - .11, .42, s * .8); chassis.add(lamp);
  box(.05, .12, .34, M.plasticBlack, V(), lamp, .012);
  box(.008, .09, .1, M.tail, V(-.026, 0, s * -.1), lamp, .004); box(.008, .09, .08, M.amber, V(-.026, 0, s * -.005), lamp, .004); box(.008, .09, .08, s > 0 ? M.whiteLens : M.tail, V(-.026, 0, s * .085), lamp, .004);
  const tri = new THREE.Shape(); tri.moveTo(-.075, 0); tri.lineTo(.075, 0); tri.lineTo(0, .13); tri.closePath(); tri.holes.push(new THREE.Path([new THREE.Vector2(-.045, .018), new THREE.Vector2(0, .1), new THREE.Vector2(.045, .018)]));
  const tr = mesh(new THREE.ExtrudeGeometry(tri, {depth: .008, bevelEnabled: false}), M.reflectorRed, V(XR - .1, .47, s * .5), chassis); tr.rotation.y = -Math.PI / 2;
 }
 box(.012, .12, .52, M.white, V(XR - .107, .36, 0), chassis);
 {const pt = labelTexture(['DS·FX 400'], {bg: '#f4f4ef', fg: '#141414', w: 512, h: 118, weight: 700}); const p = plane(.5, .11, new THREE.MeshStandardMaterial({map: pt, roughness: .4}), V(XR - .114, .36, 0), chassis, [0, -Math.PI / 2, 0]); p.userData.keep = true;
  box(.04, .03, .12, M.plasticBlack, V(XR - .1, .44, 0), chassis);}
 // fixed rear step on the underrun bar (left of the ramps)
 {const rs = new THREE.Group(); rs.position.set(XR - .09, .47, -.1); chassis.add(rs); box(.22, .02, .5, M.treadPlate, V(-.1, 0, 0), rs); for (const z of [-.24, .24]) box(.22, .05, .02, M.aluMatte, V(-.1, -.02, z), rs);}
 // generator exhaust under the floor (front left)
 tube([V(2.3, F - .05, -.72), V(2.3, F - .22, -.72), V(2.25, F - .3, -.8), V(2.1, F - .32, -.95)], .025, M.stainless, chassis, 20);

 // ---------- box body ----------
 const body = new THREE.Group(); root.add(body); out.groups.body = body;
 const walls = {left: new THREE.Group(), right: new THREE.Group(), front: new THREE.Group(), roof: new THREE.Group()};
 for (const k in walls) {walls[k].userData.dynamic = true; body.add(walls[k]);} out.walls = walls;
 {const fl = new THREE.Mesh(new THREE.PlaneGeometry(L, W), M.floor); fl.rotation.x = -Math.PI / 2; fl.position.y = F; fl.receiveShadow = true; fl.userData.keep = true; body.add(fl);
  M.floor.normalMap.repeat.set(L * 2, W * 10); M.floor.roughnessMap.repeat.set(3, 1.2);
  box(L + 2 * T, .04, W + 2 * T, M.steelDark, V(0, F - .021, 0), body);
  box(.06, .012, W, M.treadPlate, V(-L / 2 + .03, F + .006, 0), body);}
 const wallMat = (inner, idx) => {const a = [M.grp, M.grp, M.grpEdge, M.grpEdge, M.grp, M.grp]; a[idx] = inner; return a;};
 const piece = (x0, x1, y0, y1, z, idx, parent) => box(x1 - x0, y1 - y0, T, wallMat(M.wallL, idx), V((x0 + x1) / 2, (y0 + y1) / 2, z), parent);
 // left wall with the generator service opening
 const FL = {x0: 1.33, x1: 2.33, y0: F + .12, y1: F + .92}; out.flapOpening = FL;
 piece(XR, FL.x0, F, TOP - T, -W / 2 - T / 2, 4, walls.left); piece(FL.x1, XF, F, TOP - T, -W / 2 - T / 2, 4, walls.left);
 piece(FL.x0, FL.x1, F, FL.y0, -W / 2 - T / 2, 4, walls.left); piece(FL.x0, FL.x1, FL.y1, TOP - T, -W / 2 - T / 2, 4, walls.left);
 // right wall with side door opening
 piece(XR, DOOR.x0, F, TOP - T, W / 2 + T / 2, 5, walls.right); piece(DOOR.x1, XF, F, TOP - T, W / 2 + T / 2, 5, walls.right);
 piece(DOOR.x0, DOOR.x1, F + DOOR.h, TOP - T, W / 2 + T / 2, 5, walls.right);
 box(T, TOP - T - F, W + 2 * T, wallMat(M.wallS, 1), V(L / 2 + T / 2, (F + TOP - T) / 2, 0), walls.front);
 box(L + 2 * T, T, W + 2 * T, [M.grpEdge, M.grpEdge, M.grp, M.ceiling, M.grpEdge, M.grpEdge], V(0, TOP - T / 2, 0), walls.roof);
 // corner profiles, roof edge profiles, rub rails
 const cgeo = cornerGeo();
 for (const [x, z, ry, parent] of [[XF, ZO, -Math.PI / 2, walls.front], [XF, -ZO, 0, walls.front], [XR, ZO, Math.PI, walls.right], [XR, -ZO, Math.PI / 2, walls.left]]) {const c = mesh(cgeo, M.alu, V(x - Math.sign(x) * .012, F - .02, z - Math.sign(z) * .012), parent); c.rotation.y = ry; c.scale.y = TOP - F + .02;}
 for (const s of [-1, 1]) cyl(.024, .024, L + 2 * T + .01, M.alu, V(0, TOP - .005, s * (ZO - .005)), walls.roof, 'x', 12);
 cyl(.024, .024, W + 2 * T, M.alu, V(XF - .005, TOP - .005, 0), walls.roof, 'z', 12);
 for (const s of [-1, 1]) {const wg = s < 0 ? walls.left : walls.right; box(L + 2 * T - .1, .05, .018, M.aluMatte, V(0, F + .06, s * (ZO + .009)), wg); for (let x = XR + .2; x < XF; x += .45) if (s < 0 || x < DOOR.x0 - .05 || x > DOOR.x1 + .05) bolt(.006, M.steel, V(x, F + .06, s * (ZO + .019)), wg, 'z');}
 // roof vents and amber beacon
 for (const x of [-1.1, 1.0]) {const v = new THREE.Group(); v.position.set(x, TOP, 0); walls.roof.add(v); box(.44, .04, .44, M.plastic, V(0, .02, 0), v, .015); box(.36, .07, .36, M.white, V(0, .07, 0), v, .03); for (let i = 0; i < 5; i++) box(.38, .006, .01, M.plasticDark, V(0, .045, -.16 + i * .08), v);}
 {const b = new THREE.Group(); b.position.set(XF - .35, TOP, 0); walls.roof.add(b); b.userData.dynamic = true; out.ext.push(b); box(.2, .03, .12, M.plasticBlack, V(0, .015, 0), b, .01); cyl(.075, .085, .045, M.plasticBlack, V(0, .05, 0), b, 'y', 28); cyl(.066, .072, .11, M.amber, V(0, .125, 0), b, 'y', 28); sphere(.066, M.amber, V(0, .18, 0), b).scale.y = .35;}
 // rear portal, header, seals, door buffers on the side walls
 for (const s of [-1, 1]) {box(.06, TOP - F, .055, M.galv, V(XR + .01, (TOP + F) / 2, s * (W / 2 + .008)), body); box(.012, TOP - F - .1, .02, M.rubber, V(XR - .024, (TOP + F) / 2, s * (W / 2 - .02)), body);}
 box(.06, .07, 2 * ZO, M.galv, V(XR + .01, TOP - .035, 0), body);
 for (const s of [-1, 1]) for (const y of [.5, 1.5]) box(.07, .04, .025, M.rubber, V(XR + 1.0, F + y, s * (ZO + .012)), s < 0 ? walls.left : walls.right, .008);
 // marker lamps and side reflectors
 for (const s of [-1, 1]) {box(.03, .05, .09, M.tail, V(XR - .018, TOP - .1, s * (ZO - .1)), body, .01); box(.03, .05, .09, M.whiteLens, V(XF + .018, TOP - .1, s * (ZO - .1)), walls.front, .01);}
 for (const x of [-2.1, -.35, 1.6]) for (const s of [-1, 1]) {if (s > 0 && x > DOOR.x0 - .15 && x < DOOR.x1 + .15) continue; const wg = s < 0 ? walls.left : walls.right; box(.08, .035, .014, M.amber, V(x, F + .15, s * (ZO + .007)), wg, .006); box(.06, .1, .006, M.reflectorAmber, V(x + .12, F + .15, s * (ZO + .004)), wg);}

 // ---------- DiTom decals ----------
 if (ctx.logo) {
  const logo = ctx.logo, ratio = ctx.logoRatio || .34;
  const lm = new THREE.MeshStandardMaterial({map: logo, transparent: true, alphaTest: .02, roughness: .32, metalness: .05, polygonOffset: true, polygonOffsetFactor: -2});
  const decal = (w, p, rotY, parent) => {const o = plane(w, w * ratio, lm, p, parent, [0, rotY, 0]); o.userData.keep = true; o.renderOrder = 2; return o;};
  const tm = new THREE.MeshStandardMaterial({map: labelTexture(['DSS-Flex Sanierungstechnik', 'www.ditom-kanaltechnik.de'], {bg: null, fg: '#223746', w: 1024, h: 200, weight: 600}), transparent: true, alphaTest: .02, roughness: .4, polygonOffset: true, polygonOffsetFactor: -2});
  const claim = (w, p, rotY, parent) => {const o = plane(w, w * .195, tm, p, parent, [0, rotY, 0]); o.userData.keep = true; o.renderOrder = 2; return o;};
  decal(2.2, V(-.2, F + 1.48, -ZO - .004), Math.PI, walls.left); claim(1.85, V(-.2, F + 1.0, -ZO - .004), Math.PI, walls.left);
  decal(1.85, V(-.45, F + 1.45, ZO + .004), 0, walls.right); claim(1.6, V(-.45, F + 1.0, ZO + .004), 0, walls.right);
  decal(1.0, V(XF + .004, F + 1.55, .35), Math.PI / 2, walls.front);
  out.decal = decal;
 }

 // ---------- rear doors (270° against the side walls) ----------
 const stripes = labelTexture([''], {bg: '#f3f3ef', w: 256, h: 256}); {const c = stripes.image.getContext('2d'); c.fillStyle = '#cf1f18'; for (let i = -4; i < 8; i++) {c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64 + 32, 0); c.lineTo(i * 64 + 288, 256); c.lineTo(i * 64 + 256, 256); c.fill();} stripes.needsUpdate = true;}
 const stripeMat = new THREE.MeshStandardMaterial({map: stripes, roughness: .3, polygonOffset: true, polygonOffsetFactor: -2});
 const DH = TOP - F - .03, DW = ZO - .006;
 for (const s of [-1, 1]) {
  const id = s < 0 ? 'doorL' : 'doorR';
  const hinge = new THREE.Group(); hinge.position.set(XR - .02, F + .005, s * (ZO + .045)); hinge.userData.dynamic = true; body.add(hinge);
  const zc = -s * (.045 + DW / 2);
  box(.04, DH, DW, [M.wallS, M.grp, M.grpEdge, M.grpEdge, M.grpEdge, M.grpEdge], V(-.02, DH / 2, zc), hinge);
  const st = plane(DW - .06, .42, stripeMat, V(-.041, .3, zc), hinge, [0, -Math.PI / 2, 0]); st.userData.keep = true;
  for (const y of [.22, .78, 1.34, 1.9]) {box(.03, .07, .12, M.galv, V(-.035, y, -s * .09), hinge, .008); cyl(.013, .013, .09, M.galv, V(0, y, 0), hinge, 'y', 10); box(.02, .06, .05, M.galv, V(.005, y, s * .02), hinge);}
  const bz = -s * (.045 + DW - .16);
  cyl(.014, .014, DH - .12, M.galv, V(-.058, DH / 2, bz), hinge, 'y', 12);
  for (const y of [.1, .52, 1.25, DH - .1]) box(.03, .05, .06, M.galv, V(-.05, y, bz), hinge, .006);
  box(.03, .045, .07, M.galv, V(-.048, 1.02, bz + s * .03), hinge, .006); box(.022, .34, .03, M.galv, V(-.07, .88, bz + s * .045), hinge, .008);
  box(.02, .04, .05, M.plasticBlack, V(-.052, .96, bz + s * .1), hinge, .006);
  if (out.decal && s < 0) out.decal(.72, V(-.042, 1.55, zc), -Math.PI / 2, hinge);
  box(.02, .3, .2, M.plasticDark, V(.012, 1.1, -s * .6), hinge, .01);
  out.doors[id] = {hinge, s};
  ctx.addToggle({id, comp: 'chassis', handle: hinge, dur: 1.5, apply: t => {hinge.rotation.y = s * 1.5 * Math.PI * smooth(t);}});
 }

 // ---------- side door with folding step ----------
 {const dw = DOOR.x1 - DOOR.x0 - .01, dh = DOOR.h - .01;
  const hinge = new THREE.Group(); hinge.position.set(DOOR.x1 - .004, F + .005, ZO + .002); hinge.userData.dynamic = true; walls.right.add(hinge);
  box(dw, dh, T, [M.grpEdge, M.grpEdge, M.grpEdge, M.grpEdge, M.grp, M.wallS], V(-dw / 2, dh / 2, -T / 2), hinge);
  for (const y of [.18, .95, 1.7]) {box(.05, .09, .035, M.galv, V(.012, y, .01), hinge, .008); cyl(.012, .012, .1, M.galv, V(.03, y, .02), hinge, 'y', 10);}
  const lock = new THREE.Group(); lock.position.set(-dw + .07, 1.05, .004); hinge.add(lock); box(.07, .2, .02, M.plasticBlack, V(), lock, .01); box(.03, .12, .03, M.aluMatte, V(0, 0, .015), lock, .008); cyl(.01, .01, .01, M.brass, V(0, -.07, .012), lock, 'z', 12);
  box(.03, .06, .03, M.plasticBlack, V(-dw + .07, 1.05, -T - .01), hinge, .008);
  cyl(.008, .008, .3, M.galv, V(-dw + .3, 1.6, .02), hinge, 'x', 8);
  out.doors.side = {hinge};
  cyl(.014, .014, .9, M.stainless, V(DOOR.x0 - .09, F + 1.0, W / 2 - .06), walls.right, 'y', 12); for (const y of [.55, 1.45]) box(.03, .03, .05, M.stainless, V(DOOR.x0 - .09, F + y, W / 2 - .03), walls.right);
  box(DOOR.x1 - DOOR.x0, .012, .09, M.treadPlate, V((DOOR.x0 + DOOR.x1) / 2, F + .006, W / 2 - .01), body);
  // step in its deployed geometry around the pivot; stowed = folded in under the floor
  const step = new THREE.Group(); step.position.set((DOOR.x0 + DOOR.x1) / 2, F - .1, ZO + .01); step.userData.dynamic = true; walls.right.add(step);
  for (const x of [-.34, .34]) beam(V(x, 0, 0), V(x, -.58, .44), .03, .045, M.aluMatte, step);
  box(.7, .02, .2, M.treadPlate, V(0, -.22, .17), step); box(.7, .02, .2, M.treadPlate, V(0, -.48, .37), step);
  box(.72, .04, .04, M.aluMatte, V(0, 0, 0), step);
  out.step = step;
  ctx.addToggle({id: 'side', comp: 'access', handle: hinge, dur: 1.3, apply: t => {hinge.rotation.y = 1.72 * smooth(seg(t, 0, .7)); step.rotation.x = (1 - smooth(seg(t, .45, 1))) * Math.PI / 2;}});
  ctx.pickable(step, 'access', 'side');}

 // ---------- generator service flap (left wall, hinged at the top, opens outwards) ----------
 {const flap = new THREE.Group(); flap.position.set((FL.x0 + FL.x1) / 2, FL.y1, -ZO - .002); flap.userData.dynamic = true; walls.left.add(flap);
  const fw = FL.x1 - FL.x0 - .01, fh = FL.y1 - FL.y0 - .01;
  box(fw, fh, .035, [M.grpEdge, M.grpEdge, M.grpEdge, M.grpEdge, M.wallS, M.grp], V(0, -fh / 2, .018), flap);
  box(fw - .14, .62, .006, M.blackMatte, V(0, -.4, -.003), flap);
  for (let i = 0; i < 9; i++) box(fw - .16, .012, .045, M.plasticBlack, V(0, -.13 - i * .066, -.012), flap, 0, [.6, 0, 0]);
  for (const x of [-fw / 2 + .08, fw / 2 - .08]) box(.06, .05, .03, M.plasticBlack, V(x, -fh + .05, -.02), flap, .01);
  cyl(.012, .012, fw - .1, M.galv, V(0, .005, -.01), flap, 'x', 10);
  const struts = []; for (const x of [-fw / 2 + .05, fw / 2 - .05]) {const s = cyl(.008, .008, 1, M.steel, V(), walls.left, 'y', 8); s.userData.keep = true; struts.push({s, x});}
  ctx.addToggle({id: 'genFlap', comp: 'gen', handle: flap, dur: 1.1, apply: t => {
   flap.rotation.x = 1.25 * smooth(t);
   for (const {s, x} of struts) {const a = V(flap.position.x + x, FL.y0 + .15, -ZO + .005), local = V(x, -.55, -.02).applyEuler(flap.rotation).add(flap.position); s.visible = t > .05; s.position.copy(a).add(local).multiplyScalar(.5); s.scale.set(1, a.distanceTo(local), 1); s.quaternion.setFromUnitVectors(V(0, 1, 0), local.clone().sub(a).normalize());}
  }});
  out.flap = flap;}
 // front louvre (generator air out) and CEE 32 A inlet
 {const lv = new THREE.Group(); lv.position.set(XF + .002, F + .52, -.66); walls.front.add(lv); box(.012, .5, .56, M.plasticBlack, V(), lv, .01); for (let i = 0; i < 8; i++) box(.02, .012, .5, M.blackMatte, V(.006, -.2 + i * .057, 0), lv, 0, [0, 0, .5]);
  const ce = new THREE.Group(); ce.position.set(XF + .02, F + .3, .75); walls.front.add(ce); ce.userData.dynamic = true; out.ext.push(ce); box(.03, .18, .15, M.socket, V(), ce, .01); box(.02, .11, .11, M.ceeRed, V(.02, -.01, 0), ce, .02); cyl(.034, .034, .03, M.ceeRed, V(.035, -.01, 0), ce, 'x', 20);
  const lab = labelTexture(['Einspeisung CEE 32 A'], {bg: '#f2f2ee', fg: '#222', w: 384, h: 64}); const lp = plane(.15, .025, new THREE.MeshStandardMaterial({map: lab}), V(.017, .105, 0), ce, [0, Math.PI / 2, 0]); lp.userData.keep = true;}
 // water fill coupling (Storz C) with cap, chain and vent on the left side
 {const wf = new THREE.Group(); wf.position.set(-.33, F + .35, -ZO - .005); walls.left.add(wf); wf.userData.dynamic = true; out.ext.push(wf);
  box(.22, .22, .006, M.stainless, V(), wf); cyl(.04, .045, .06, M.aluMatte, V(0, 0, -.03), wf, 'z', 24); cyl(.047, .047, .02, M.aluMatte, V(0, 0, -.068), wf, 'z', 24); for (const a of [0, Math.PI]) box(.035, .012, .02, M.aluMatte, V(.046 * Math.cos(a), .046 * Math.sin(a), -.068), wf);
  tube([V(.06, -.06, -.07), V(.1, -.12, -.06), V(.08, -.16, -.02)], .002, M.steel, wf, 12);
  tube([V(.34, .12, -.01), V(.34, .26, -.02), V(.37, .31, -.05), V(.42, .31, -.06)], .012, M.plasticBlack, wf, 16);
  const lab = labelTexture(['WASSER 600 l', 'kein Trinkwasser'], {bg: '#eef3f6', fg: '#123a5a', w: 384, h: 110}); const lp = plane(.2, .057, new THREE.MeshStandardMaterial({map: lab}), V(0, .15, -.004), wf, [0, Math.PI, 0]); lp.userData.keep = true;}
 // exterior socket box (rear left) and LED work lights
 {const sb = new THREE.Group(); sb.position.set(XR - .04, F - .24, -.78); sb.rotation.y = -Math.PI / 2; chassis.add(sb); sb.userData.dynamic = true; out.ext.push(sb); box(.24, .16, .06, M.socket, V(0, 0, .03), sb, .01); cyl(.03, .03, .03, M.ceeBlue, V(-.05, 0, .07), sb, 'z', 18); box(.07, .07, .02, M.socket, V(.06, 0, .07), sb, .01); box(.04, .12, .04, M.galv, V(0, .12, .02), sb);}
 out.workLights = [];
 // work light above the side door (the rear lights sit on the awning cassette)
 for (const [p, dir, parent] of [[V(DOOR.x0 - .12, TOP - .12, ZO + .02), V(0, -.8, 1), walls.right]]) {
  const wl = new THREE.Group(); wl.position.copy(p); parent.add(wl); wl.userData.dynamic = true; out.ext.push(wl); box(.05, .03, .05, M.galv, V(), wl);
  const hd = new THREE.Group(); hd.position.copy(dir.clone().normalize().multiplyScalar(.07)); hd.quaternion.setFromUnitVectors(V(0, 0, 1), dir.clone().normalize()); wl.add(hd);
  box(.14, .1, .05, M.plasticBlack, V(), hd, .012); const lens = box(.12, .08, .006, M.ledOff, V(0, 0, .027), hd); lens.userData.keep = true; lens.castShadow = false; out.workLights.push(lens);
  for (let i = 0; i < 5; i++) box(.004, .08, .02, M.plasticBlack, V(-.05 + i * .025, 0, -.034), hd);
 }

 // ---------- support legs at the rear ----------
 {const legs = [];
  for (const s of [-1, 1]) {const lg = new THREE.Group(); lg.position.set(XR + .22, F - .17, s * .60); lg.userData.dynamic = true; chassis.add(lg);
   box(.08, .06, .1, M.galv, V(0, .02, 0), lg); box(.06, .42, .06, M.galv, V(0, -.21, 0), lg);
   const inner = new THREE.Group(); inner.userData.dynamic = true; lg.add(inner); box(.045, .4, .045, M.steel, V(0, -.34, 0), inner); box(.16, .012, .16, M.galv, V(0, -.546, 0), inner);
   tube([V(0, -.06, s * .035), V(0, -.06, s * .12), V(.07, -.06, s * .15)], .008, M.steel, lg, 8); cyl(.012, .012, .05, M.plasticBlack, V(.07, -.06, s * .18), lg, 'z', 8);
   legs.push({lg, inner});}
  const reach = (F - .17) - .552;
  ctx.addToggle({id: 'legs', comp: 'legs', handle: legs[0].lg, dur: 1.5, apply: t => {const a = smooth(seg(t, 0, .55)), e = smooth(seg(t, .5, 1)); for (const {lg, inner} of legs) {lg.rotation.z = (1 - a) * Math.PI / 2; inner.position.y = -e * Math.max(0, reach);}}});
  for (const {lg} of legs) ctx.pickable(lg, 'legs', 'legs');}

 // ---------- rear awning ----------
 {const aw = new THREE.Group(); root.add(aw); out.groups.awning = aw;
  const AW = 2.6, P = 3.0, ang = .13, y0 = TOP + .06, x0 = XR - .1;
  box(.17, .15, AW, M.white, V(x0 - .02, y0, 0), aw, .03);
  for (const z of [-.95, 0, .95]) box(.17, .07, .07, M.galv, V(x0 + .09, TOP - .005, z), aw);
  for (const s of [-1, 1]) box(.18, .16, .012, M.aluMatte, V(x0 - .02, y0, s * (AW / 2 + .006)), aw);
  cyl(.022, .022, .04, M.steel, V(x0 - .02, y0 - .05, AW / 2 + .03), aw, 'z', 12); torus(.014, .004, M.steel, V(x0 - .02, y0 - .09, AW / 2 + .05), aw, 'z');
  for (const s of [-1, 1]) {const wl = new THREE.Group(); wl.position.set(x0 - .11, y0 - .02, s * .85); aw.add(wl); wl.userData.dynamic = true; out.ext.push(wl); box(.03, .05, .05, M.galv, V(.0, 0, 0), wl);
   const hd = new THREE.Group(); hd.position.set(-.05, -.02, 0); hd.quaternion.setFromUnitVectors(V(0, 0, 1), V(-1, -.9, 0).normalize()); wl.add(hd); box(.14, .1, .05, M.plasticBlack, V(), hd, .012); const lens = box(.12, .08, .006, M.ledOff, V(0, 0, .027), hd); lens.userData.keep = true; lens.castShadow = false; out.workLights.push(lens);}
  const dyn = new THREE.Group(); dyn.userData.dynamic = true; aw.add(dyn);
  const fabric = mesh(new THREE.PlaneGeometry(1, AW - .06), M.fabric, V(), dyn); fabric.userData.keep = true;
  const bar = new THREE.Group(); dyn.add(bar); box(.07, .09, AW, M.white, V(), bar, .02);
  const valTex = labelTexture(['DiTom · DSS-Flex Sanierung'], {bg: '#3c434a', fg: '#f1f1ec', w: 1024, h: 88, weight: 600});
  const val = mesh(new THREE.PlaneGeometry(AW - .02, .2), new THREE.MeshStandardMaterial({map: valTex, roughness: .85, side: THREE.DoubleSide}), V(-.037, -.13, 0), bar, [0, -Math.PI / 2, 0]); val.userData.keep = true;
  const arms = [], legsA = [], SEG = 1.62;
  for (const s of [-1, 1]) {arms.push({s, a1: box(.05, .035, 1, M.aluMatte, V(), dyn, .01), a2: box(.045, .03, 1, M.aluMatte, V(), dyn, .01), el: cyl(.03, .03, .05, M.aluDark, V(), dyn, 'y', 12)});
   const leg = new THREE.Group(); bar.add(leg); leg.position.set(0, -.045, s * (AW / 2 - .12)); const pole = cyl(.018, .018, 1, M.aluMatte, V(0, -.5, 0), leg, 'y', 10); const foot = box(.14, .012, .14, M.galv, V(), bar); legsA.push({leg, pole, foot, s});}
  const setArm = (a, p, q) => {const d = q.clone().sub(p); a.position.copy(p).addScaledVector(d, .5); a.scale.z = d.length(); a.quaternion.setFromUnitVectors(V(0, 0, 1), d.normalize());};
  const qFab = new THREE.Quaternion();
  ctx.addToggle({id: 'awning', comp: 'awning', handle: aw, dur: 2.6, apply: t => {
   const e = P * smooth(seg(t, 0, .8)), fx = x0 - .08 - e, fy = y0 - .03 - e * Math.tan(ang);
   dyn.visible = e > .03;
   const a = V(x0 - .08, y0 + .01, 0), b = V(fx, fy + .03, 0);
   fabric.position.copy(a).add(b).multiplyScalar(.5); fabric.scale.set(a.distanceTo(b), 1, 1);
   qFab.setFromAxisAngle(V(0, 0, 1), ang).multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -Math.PI / 2)); fabric.quaternion.copy(qFab);
   bar.position.set(fx, fy, 0);
   for (const {s, a1, a2, el} of arms) {const S = V(x0 - .06, y0 - .04, s * (AW / 2 - .2)), Fb = V(fx + .03, fy - .02, s * (AW / 2 - .2)), d = S.distanceTo(Fb), E = S.clone().add(Fb).multiplyScalar(.5).add(V(0, 0, -s * Math.sqrt(Math.max(0, SEG * SEG - d * d / 4)))); setArm(a1, S, E); setArm(a2, E, Fb); el.position.copy(E);}
   const u = smooth(seg(t, .8, 1)), len = Math.max(.02, (fy - .045) * u);
   for (const {leg, pole, foot, s} of legsA) {pole.scale.y = len; pole.position.y = -len / 2; leg.visible = u > .02; foot.visible = u > .95; foot.position.set(0, -fy + .006, s * (AW / 2 - .12));}
  }});
  dyn.traverse(o => {if (o.isMesh) o.userData.keep = true;});
  out.awning = {x0, P, AW, y0};}

 // ---------- folding ramps, stored inside the right rear door ----------
 {const ramps = [], half = RAMP.len / 2;
  const make = () => {const g = new THREE.Group(); g.userData.dynamic = true; root.add(g);
   const h1 = new THREE.Group(), h2 = new THREE.Group(); h2.userData.dynamic = true; g.add(h1); g.add(h2);
   for (const h of [h1, h2]) {for (const z of [-.13, .13]) box(half, .06, .02, M.aluMatte, V(half / 2, .03, z), h); for (let i = 0; i < 9; i++) box(.03, .014, .24, M.treadPlate, V(.06 + i * .11, .056, 0), h);}
   box(.08, .012, .26, M.aluDark, V(-.03, .06, 0), h1); box(.03, .05, .26, M.aluDark, V(-.06, .03, 0), h1);
   return {g, h2};};
  RAMP.z.forEach((z, i) => ramps.push({...make(), z, i}));
  const door = out.doors.doorR.hinge, m4 = new THREE.Matrix4(), p = V(), q = new THREE.Quaternion(), sc = V();
  const dq = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), Math.PI).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), -RAMP.angle));
  ctx.addToggle({id: 'ramps', comp: 'ramps', handle: ramps[0].g, dur: 1.8, requires: ['doorR'], apply: () => {}, frame: t => {
   door.updateWorldMatrix(true, false);
   for (const r of ramps) {
    m4.multiplyMatrices(door.matrixWorld, new THREE.Matrix4().compose(V(.12, .32, -(.28 + r.i * .34)), new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), Math.PI / 2), V(1, 1, 1))); m4.decompose(p, q, sc);
    const u = smooth(seg(t, 0, .75)), f = smooth(seg(t, .55, 1));
    r.g.position.lerpVectors(p, V(XR - .03, F + .005, r.z), u); r.g.quaternion.copy(q).slerp(dq, u);
    r.h2.rotation.z = Math.PI * (1 - f); r.h2.position.set(half, .14 * (1 - f), 0);
   }
  }});
  for (const r of ramps) ctx.pickable(r.g, 'ramps', 'ramps');
  out.ramps = ramps;}

 // ---------- interior fit-out: airline rails, cable ducts, ceiling lamps ----------
 for (const y of [.45, 1.45]) for (const s of [-1, 1]) {const wg = s < 0 ? walls.left : walls.right; const r = box(L - .04, .03, .012, M.aluMatte, V(0, F + y, s * (W / 2 - .006)), wg); r.castShadow = false;}
 for (const s of [-1, 1]) {const wg = s < 0 ? walls.left : walls.right; box(L - .1, .06, .045, M.duct, V(0, TOP - T - .03, s * (W / 2 - .025)), wg); box(L - .1, .004, .04, M.plasticDark, V(0, TOP - T - .062, s * (W / 2 - .025)), wg);}
 out.lamps = [];
 for (const x of [1.5, .4, -.7, -1.8]) {const lp = new THREE.Group(); lp.position.set(x, TOP - T, 0); walls.roof.add(lp); cyl(.15, .15, .03, M.white, V(0, -.015, 0), lp, 'y', 32); const d = cyl(.13, .13, .012, M.ledOn, V(0, -.034, 0), lp, 'y', 32); d.castShadow = false;}
 return out;
}
