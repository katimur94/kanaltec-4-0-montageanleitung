import * as THREE from 'three';
import {V, TAU, box, plane, cyl, sphere, torus, lathe, tube, hose, coil, strap, bolt, mesh, profile, profileFrame, labelTexture, label} from './lib3d.js';
import {BOX, RAMP, smooth, seg, beam} from './body.js';

// Equipment builders. Each builder gets its component group `g` (origin on the floor at the
// component position + mount height, axes = trailer axes) and a context with helpers:
//  ctx.w(x, y, z)  world x/z, y above floor  ->  local vector
//  ctx.toggle({...}) / ctx.drawer(id, group, dir, dist)  movable parts
//  ctx.sack(pos, rotY, parent)  mortar sack, ctx.mould(parent, pos, dn) placeholder mould
// Forms follow the photos of the existing DiTom system; sizes are planning values.
const {F, XR, W} = BOX;

// ---------- small reusable parts ----------
function faceGroup(parent, p, face) {const g = new THREE.Group(); g.position.copy(p); g.rotation.y = {'+z': 0, '-z': Math.PI, '+x': Math.PI / 2, '-x': -Math.PI / 2}[face] ?? 0; parent.add(g); return g;}
function gauge(M, r, p, parent, face = '+z', text = '0 · 5 · 10') {
 const g = faceGroup(parent, p, face);
 cyl(r, r, .022, M.steel, V(0, 0, 0), g, 'z', 24); const f = mesh(new THREE.CircleGeometry(r * .84, 24), new THREE.MeshStandardMaterial({map: labelTexture([text], {bg: '#f6f6f2', fg: '#333', w: 128, h: 128}), roughness: .3}), V(0, 0, .0115), g); f.castShadow = false;
 box(r * .85, .003, .002, M.red, V(r * .2, r * .15, .013), g, 0, [0, 0, .9]); return g;
}
export function schuko(M, p, parent, face = '+z') {const g = faceGroup(parent, p, face); box(.085, .085, .035, M.socket, V(0, 0, .0175), g, .01); box(.07, .07, .012, M.socket, V(0, .012, .04), g, .008, [-.35, 0, 0]); cyl(.02, .02, .004, M.plasticDark, V(0, -.005, .036), g, 'z', 16); return g;}
export function cee(M, p, parent, face = '+z', big = false) {const g = faceGroup(parent, p, face), s = big ? 1.25 : 1; box(.1 * s, .11 * s, .06, M.ceeRed, V(0, 0, .03), g, .012); box(.08 * s, .05, .04 * s, M.ceeRed, V(0, .055 * s, .07), g, .01, [-.5, 0, 0]); cyl(.03 * s, .03 * s, .02, M.plasticDark, V(0, -.01, .062), g, 'z', 20); return g;}
function socketBox(M, p, parent, face, items) {
 const g = faceGroup(parent, p, face), w = .1 * items.length + .04;
 box(w, .16, .05, M.socket, V(0, 0, .025), g, .012);
 items.forEach((k, i) => {const x = -w / 2 + .07 + i * .1; if (k === 's') {box(.075, .075, .014, M.socket, V(x, .0, .057), g, .006); box(.07, .07, .01, M.plastic, V(x, .014, .07), g, .006, [-.4, 0, 0]);} else {box(.08, .09, .02, M.ceeRed, V(x, 0, .06), g, .01); cyl(.026, .026, .012, M.plasticDark, V(x, -.005, .072), g, 'z', 16);}});
 return g;
}
function airOutlet(M, p, parent, face = '+z', lab = true) {
 const g = faceGroup(parent, p, face);
 box(.06, .11, .006, M.stainless, V(0, 0, .003), g); cyl(.011, .011, .05, M.brass, V(0, .02, .03), g, 'z', 12);
 box(.018, .03, .018, M.brass, V(0, .02, .06), g); box(.05, .01, .012, M.signalRed, V(.022, .04, .06), g, .004);
 cyl(.011, .011, .06, M.brass, V(0, -.02, .06), g, 'y', 12); cyl(.016, .016, .03, M.steel, V(0, -.06, .06), g, 'y', 14); cyl(.009, .009, .02, M.brass, V(0, -.085, .06), g, 'y', 10);
 if (lab) label(['Druckluft 6 bar'], .06, .018, V(0, .065, .007), g, null, {bg: '#1f5fae', fg: '#fff', w: 256, h: 76});
 return g;
}
function brassElbow(M, p, parent, rot) {
 const g = new THREE.Group(); g.position.copy(p); if (rot) g.rotation.set(...rot); parent.add(g);
 const pts = []; for (let i = 0; i <= 8; i++) {const a = i / 8 * Math.PI / 4; pts.push(V(.03 * Math.sin(a), 0, .03 - .03 * Math.cos(a)));}
 mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, .01, 10), M.brass, V(), g);
 cyl(.014, .014, .016, M.brass, V(0, 0, -.006), g, 'z', 6);
 const d = V(Math.sin(Math.PI / 4), 0, 1 - Math.cos(Math.PI / 4)); for (let k = 0; k < 3; k++) {const c = cyl(.011 - k * .001, .008, .012, M.brass, V(.03 * Math.sin(Math.PI / 4) + (k + 1) * .012 * .707, 0, .03 - .03 * Math.cos(Math.PI / 4) + (k + 1) * .012 * .707), g, 'y', 10); c.quaternion.setFromUnitVectors(V(0, 1, 0), V(.707, 0, .707)); void d;}
 return g;
}
function geka(M, p, parent, axis = 'y') {const g = new THREE.Group(); g.position.copy(p); parent.add(g); const o = cyl(.024, .024, .016, M.brass, V(), g, axis, 18); void o; for (const a of [0, Math.PI]) box(.012, .02, .012, M.brass, axis === 'y' ? V(.022 * Math.cos(a), .012, .022 * Math.sin(a)) : V(.022 * Math.cos(a), .022 * Math.sin(a), .012), g); cyl(.009, .009, .04, M.brass, axis === 'y' ? V(0, -.025, 0) : V(0, 0, -.025), g, axis, 10); return g;}
function spanner(M, p, parent, len = .2, rotY = 0) {const g = new THREE.Group(); g.position.copy(p); g.rotation.y = rotY; parent.add(g); box(.014, .004, len, M.stainless, V(), g, .002); cyl(.016, .016, .005, M.stainless, V(0, 0, len / 2), g, 'y', 6); torus(.013, .004, M.stainless, V(0, 0, -len / 2), g, 'y'); return g;}
function screwdriver(M, p, parent, col, rot) {const g = new THREE.Group(); g.position.copy(p); if (rot) g.rotation.set(...rot); parent.add(g); cyl(.012, .013, .09, col, V(0, .045, 0), g, 'y', 10); cyl(.003, .003, .12, M.steel, V(0, -.06, 0), g, 'y', 6); return g;}
function pliers(M, p, parent, rot) {const g = new THREE.Group(); g.position.copy(p); if (rot) g.rotation.set(...rot); parent.add(g); box(.018, .006, .07, M.steel, V(0, 0, .09), g, .003); for (const s of [-1, 1]) {const h = box(.014, .01, .11, M.signalRed, V(s * .012, 0, 0), g, .004); h.rotation.y = s * .12;} return g;}
function zipBag(M, p, parent, rotY = 0) {const g = new THREE.Group(); g.position.copy(p); g.rotation.y = rotY; parent.add(g); box(.1, .018, .14, M.hoseClear, V(0, .009, 0), g, .008); for (let i = 0; i < 5; i++) cyl(.006, .006, .012, i % 2 ? M.steel : M.brass, V(-.03 + (i % 3) * .03, .008, -.04 + Math.floor(i / 2) * .04), g, 'y', 6); box(.05, .002, .03, M.white, V(.02, .019, .04), g); return g;}
function steelPlate(M, p, parent, rotY = 0) {const g = new THREE.Group(); g.position.copy(p); g.rotation.y = rotY; parent.add(g); box(.1, .006, .075, M.boxGrey, V(), g, .002); for (const z of [-.028, .028]) for (const x of [-.03, 0, .03]) cyl(.0055, .0055, .008, M.blackMatte, V(x, .001, z), g, 'y', 8); return g;}
function peBlock(M, p, parent, rotY = 0) {const g = new THREE.Group(); g.position.copy(p); g.rotation.y = rotY; parent.add(g); box(.07, .05, .08, M.pe, V(0, .025, 0), g, .004); for (const x of [-.018, .018]) cyl(.006, .006, .052, M.blackMatte, V(x, .026, .0), g, 'y', 8); return g;}
// Euro box 600 × 400 × 220 (long side along x, grip hole towards -z) with contents.
function euroBox(M, parent, fill) {
 const g = new THREE.Group(); parent.add(g);
 box(.6, .012, .4, M.euro, V(0, .006, 0), g);
 for (const s of [-1, 1]) {box(.6, .21, .01, M.euro, V(0, .117, s * .195), g); box(.01, .21, .4, M.euro, V(s * .295, .117, 0), g);}
 for (const s of [-1, 1]) {box(.61, .012, .02, M.euro, V(0, .224, s * .2), g); box(.02, .012, .41, M.euro, V(s * .3, .224, 0), g);}
 box(.12, .03, .012, M.plasticDark, V(0, .18, -.204), g, .006);
 for (let i = 0; i < 5; i++) box(.004, .16, .003, M.plastic, V(-.24 + i * .12, .11, -.2015), g);
 fill?.(g);
 return g;
}

export const builders = {
 // ---------------- 01 generator in its compartment ----------------
 gen(g, M, ctx) {
  const X = .6625, Z = .385, HT = 1.12;
  // partitions: rear (x = -X) and aisle side (z = +Z) with a louvred door; top plate with a shelf
  box(.03, HT, 2 * Z, M.white, V(-X + .015, HT / 2, 0), g);
  const dx0 = -.5, dx1 = .45, dy0 = .06, dy1 = 1.02;
  box(dx0 + X, HT, .03, M.white, V((-X + dx0) / 2, HT / 2, Z - .015), g);
  box(X - dx1, HT, .03, M.white, V((dx1 + X) / 2, HT / 2, Z - .015), g);
  box(dx1 - dx0, HT - dy1, .03, M.white, V((dx0 + dx1) / 2, (dy1 + HT) / 2, Z - .015), g);
  box(dx1 - dx0, dy0, .03, M.white, V((dx0 + dx1) / 2, dy0 / 2, Z - .015), g);
  box(2 * X, .025, 2 * Z + .02, M.film, V(0, HT + .012, .01), g); box(2 * X, .03, .02, M.aluMatte, V(0, HT + .01, Z + .02), g);
  for (const x of [-X + .03, X - .03]) box(.03, HT, .03, M.aluMatte, V(x, HT / 2, Z), g);
  // louvred door (hinged at the front edge, swings into the aisle)
  const door = new THREE.Group(); door.position.set(dx1, dy0, Z + .005); g.add(door);
  const dw = dx1 - dx0 - .01, dh = dy1 - dy0 - .01;
  box(dw, dh, .025, M.white, V(-dw / 2, dh / 2, 0), door);
  for (const [y0, n] of [[.12, 5], [.62, 5]]) for (let i = 0; i < n; i++) box(dw - .2, .014, .02, M.plasticDark, V(-dw / 2, y0 + i * .05, .012), door, 0, [-.6, 0, 0]);
  box(.05, .12, .03, M.plasticBlack, V(-dw + .06, .5, .02), door, .01);
  for (const y of [.12, dh - .12]) box(.03, .07, .03, M.galv, V(0, y, .01), door);
  label(['Aggregat', 'nur mit Gehörschutz'], .22, .07, V(-dw / 2, .46, .014), door, null, {bg: '#1f6fae', fg: '#fff', w: 384, h: 120});
  ctx.toggle({id: 'genDoor', handle: door, dur: 1.1, apply: t => {door.rotation.y = 1.85 * smooth(t);}});
  // generator: silent canopy on a skid frame with rubber mounts
  const G = new THREE.Group(); G.position.set(.03, 0, -.03); g.add(G);
  for (const z of [-.24, .24]) {box(1.12, .05, .06, M.steelDark, V(0, .06, z), G); for (const x of [-.45, .45]) cyl(.03, .035, .035, M.rubber, V(x, .0175, z), G, 'y', 12);}
  box(1.1, .1, .62, M.genDark, V(0, .135, 0), G, .02);
  box(1.1, .66, .62, M.genBody, V(0, .5, 0), G, .045);
  box(1.06, .02, .58, M.genDark, V(0, .835, 0), G, .01);
  // control panel facing the aisle (+z)
  const P = new THREE.Group(); P.position.set(.22, .5, .312); G.add(P);
  box(.44, .36, .01, M.genDark, V(), P, .01);
  box(.12, .05, .004, M.blackMatte, V(-.12, .11, .007), P); label(['12,0 kVA  0 h'], .1, .03, V(-.12, .11, .0095), P, null, {bg: '#10261a', fg: '#7dff9a', w: 256, h: 76});
  cyl(.018, .018, .01, M.steel, V(.02, .11, .008), P, 'z', 12); box(.06, .06, .004, M.yellow, V(.14, .11, .006), P); cyl(.02, .024, .03, M.signalRed, V(.14, .11, .018), P, 'z', 16);
  cee(M, V(-.13, -.07, .005), P, '+z', true); cee(M, V(0, -.07, .005), P, '+z');
  for (const x of [.1, .17]) {box(.055, .06, .02, M.ceeBlue, V(x, -.07, .014), P, .008);}
  for (let i = 0; i < 4; i++) box(.018, .04, .012, M.black, V(-.16 + i * .03, .03, .01), P);
  label(['12 kVA · 400 / 230 V · Diesel'], .3, .03, V(0, .16, .0065), P, null, {bg: '#2c3337', fg: '#e8eef1', w: 512, h: 52});
  // intake louvre on the -z side (behind the service flap), exhaust outlet at the front
  for (let i = 0; i < 8; i++) box(.5, .012, .012, M.genDark, V(-.1, .3 + i * .045, -.312), G);
  for (const x of [-.4, .2]) box(.04, .03, .02, M.plasticBlack, V(x, .62, -.315), G, .006);
  cyl(.03, .03, .05, M.plasticBlack, V(-.35, .86, -.15), G, 'y', 16); box(.06, .06, .02, M.steel, V(0, .86, 0), G); torus(.03, .008, M.steel, V(0, .9, 0), G, 'x');
  tube([V(.55, .25, -.15), V(.62, .2, -.15), V(.62, .02, -.15), V(.62, -.1, -.1)], .022, M.stainless, G, 20);
  box(.02, .5, .5, M.genDark, V(.555, .5, 0), G); for (let i = 0; i < 8; i++) box(.02, .012, .46, M.blackMatte, V(.567, .3 + i * .05, 0), G);
  // supply cable up to the distribution board
  tube([V(.1, .45, .33), V(.35, .3, .36), V(.62, .5, .36), V(.64, 1.08, .3), V(.64, 1.18, .3)], .012, M.cable, g, 30);
  // small-parts cabinets and spare boxes on the compartment top
  for (let k = 0; k < 2; k++) {const c = new THREE.Group(); c.position.set(-.35 + k * .4, HT + .025, -.2); g.add(c); box(.3, .26, .2, M.plasticDark, V(0, .13, 0), c, .01); for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) {box(.085, .07, .01, M.glassLens, V(-.095 + q * .095, .05 + r * .08, .1), c, .004); box(.03, .01, .01, M.plasticBlack, V(-.095 + q * .095, .035 + r * .08, .108), c);}}
  {const cs = new THREE.Group(); cs.position.set(.35, HT + .025, -.18); g.add(cs); box(.42, .14, .32, M.blue, V(0, .07, 0), cs, .015); box(.43, .02, .33, M.plasticDark, V(0, .14, 0), cs, .01); box(.12, .02, .03, M.plasticBlack, V(0, .16, .1), cs, .01);}
  strap([ctx.w(1.3, 1.45, -1.045), ctx.w(1.35, HT + .2, -.9), ctx.w(1.95, HT + .2, -.9), ctx.w(2.1, 1.45, -1.045)], .025, .003, M.strap, g);
 },

 // ---------------- 02 distribution board, sockets, auxiliary battery (front wall, faces -x) ----------------
 elec(g, M, ctx) {
  const F0 = new THREE.Group(); F0.rotation.y = -Math.PI / 2; g.add(F0); // local +z = into the room (-x world)
  // cabinet with smoked door, DIN rail with breakers
  const C = new THREE.Group(); C.position.set(-.02, 1.42, 0); F0.add(C);
  box(.44, .56, .16, M.cabinet, V(0, 0, .08), C, .015);
  box(.38, .5, .01, M.glassLens, V(0, 0, .164), C);
  box(.36, .025, .02, M.steel, V(0, .08, .12), C); box(.36, .025, .02, M.steel, V(0, -.1, .12), C);
  for (let i = 0; i < 12; i++) {const x = -.165 + i * .03; box(.026, .075, .04, i < 2 ? M.cabinet : M.white, V(x, .08, .14), C); box(.01, .018, .012, i < 2 ? M.blue : M.black, V(x, .085, .162), C);}
  for (let i = 0; i < 10; i++) {const x = -.15 + i * .033; box(.03, .075, .04, M.white, V(x, -.1, .14), C); box(.01, .018, .012, M.black, V(x, -.095, .162), C);}
  box(.02, .04, .02, M.plasticDark, V(.2, 0, .17), C); label(['Unterverteilung · FI je Kreis'], .3, .03, V(0, .245, .166), C, null, {bg: '#f4f4f0', fg: '#1d2d38', w: 512, h: 52});
  // changeover switch mains / generator
  const S = new THREE.Group(); S.position.set(.31, 1.42, 0); F0.add(S); box(.14, .18, .09, M.cabinet, V(0, 0, .045), S, .012); cyl(.035, .035, .02, M.plasticBlack, V(0, .01, .1), S, 'z', 20); box(.09, .02, .025, M.signalRed, V(0, .01, .115), S, .006, [0, 0, .5]);
  label(['NETZ  0  AGGREGAT'], .12, .02, V(0, -.06, .092), S, null, {bg: '#f4f4f0', fg: '#222', w: 384, h: 64});
  // socket combination below
  socketBox(M, V(-.02, 1.0, 0), F0, '+z', ['c', 'c', 's', 's']);
  // ducts: vertical to the ceiling duct, horizontal along the top of the front wall
  box(.06, .5, .04, M.duct, V(-.02, 1.95, .02), F0); box(2.0, .06, .04, M.duct, V(.04, 2.0, .02), F0);
  // auxiliary battery + charger/inverter on the floor
  const B = new THREE.Group(); B.position.set(.12, 0, .16); F0.add(B);
  box(.48, .24, .28, M.plasticBlack, V(0, .12, 0), B, .02); box(.48, .02, .28, M.plasticDark, V(0, .245, 0), B, .01);
  cyl(.018, .018, .03, M.signalRed, V(-.16, .26, -.05), B, 'y', 12); cyl(.018, .018, .03, M.blackMatte, V(.16, .26, -.05), B, 'y', 12);
  for (const x of [-.24, .24]) box(.02, .05, .1, M.plasticDark, V(x, .2, 0), B);
  label(['LiFePO4 · 24 V · 5 kWh'], .3, .045, V(0, .13, .141), B, null, {bg: '#2e363b', fg: '#e8eef1', w: 512, h: 76});
  const I = new THREE.Group(); I.position.set(.14, .55, 0); F0.add(I); box(.32, .2, .1, M.cabinet, V(0, 0, .05), I, .012); for (let i = 0; i < 9; i++) box(.004, .16, .02, M.plasticDark, V(-.12 + i * .03, 0, .105), I);
  label(['Lader / Wechselrichter'], .18, .025, V(0, .08, .102), I, null, {bg: '#e8ecee', fg: '#222', w: 384, h: 52});
  tube([V(.14, .45, .05), V(.14, .3, .08), V(.12, .26, .14)], .008, M.cable, F0, 12);
  // diesel jerrycan for the generator
  const J = new THREE.Group(); J.position.set(-.27, 0, .19); F0.add(J); box(.17, .46, .34, M.plasticBlack, V(0, .23, 0), J, .03); for (const z of [-.08, .02]) box(.03, .05, .05, M.plasticBlack, V(0, .5, z), J, .01); cyl(.025, .025, .04, M.plasticBlack, V(0, .48, .12), J, 'y', 12);
  label(['DIESEL'], .12, .04, V(.086, .25, 0), J, [0, Math.PI / 2, 0], {bg: '#f2d21b', fg: '#111', w: 256, h: 84});
 },

 // ---------------- 03 compressor rack with Euro boxes (opens to -z) ----------------
 comp(g, M, ctx) {
  const w = .7, d = .55, h = 2.0;
  profileFrame(-w / 2, w / 2, 0, h, -d / 2, d / 2, M.alu, g, {shelves: [.36, 1.19]});
  box(w - .06, .02, d - .05, M.film, V(0, 1.21, 0), g); box(w - .06, .012, d - .05, M.blackMatte, V(0, .372, 0), g);
  box(.015, h - .02, d, M.ply, V(-w / 2 - .008, h / 2, 0), g); // plywood side panel towards the door
  // guide rails for three Euro boxes
  const levels = [.4, .66, .92];
  for (const y of levels) for (const s of [-1, 1]) box(.02, .015, d - .06, M.aluDark, V(s * (w / 2 - .045), y - .008, 0), g);
  const contents = [
   b => {for (let i = 0; i < 4; i++) {const r = cyl(.04 + i * .004, .04 + i * .004, .3, M.rubber, V(-.18 + i * .12, .06, .02), b, 'x', 16); r.rotation.y = (i - 1.5) * .2;} for (const x of [.15, .22]) torus(.035, .012, M.tape, V(x, .03, -.1), b, 'y');},
   b => {for (let i = 0; i < 3; i++) coil(.1, 3, .018, .007, M.hoseClear, V(-.15 + i * .14, .015, 0), b); for (let i = 0; i < 6; i++) torus(.018, .003, M.steel, V(.2 + (i % 2) * .04, .02, -.1 + i * .03), b, 'y');},
   b => {for (let i = 0; i < 5; i++) spanner(M, V(-.2 + i * .05, .02, 0), b, .18 + i * .02, .1); const w2 = new THREE.Group(); w2.position.set(.15, .03, 0); b.add(w2); box(.03, .02, .3, M.signalRed, V(0, 0, .05), w2, .006); box(.05, .025, .08, M.steel, V(0, .005, -.12), w2, .006); const hm = new THREE.Group(); hm.position.set(.22, .025, .05); b.add(hm); box(.025, .025, .28, M.ply, V(), hm, .008); box(.04, .035, .09, M.steelDark, V(0, 0, .15), hm, .006);},
  ];
  const bars = [];
  levels.forEach((y, i) => {
   const id = 'box-' + (i + 1), grp = new THREE.Group(); grp.position.set(0, y, .005); g.add(grp);
   const eb = euroBox(M, grp, contents[i]); void eb;
   label([['Ersatzblasen', 'Opferschläuche', 'Werkzeug'][i]], .14, .03, V(-.18, .19, -.203), grp, [0, Math.PI, 0], {bg: '#f4f4ef', fg: '#1d2d38', w: 384, h: 84});
   // swivelling locking bar on the front-left post
   const bar = new THREE.Group(); bar.position.set(-w / 2 + .02, y + .14, -d / 2 - .02); bar.userData.dynamic = true; g.add(bar); box(.04, .03, .03, M.plasticBlack, V(), bar, .008); box(.62, .03, .018, M.plasticBlack, V(.31, 0, -.01), bar, .008); bars.push(bar);
   ctx.drawer(id, grp, V(0, 0, -1), .34, {dur: 1.0, delay: .3, pre: t => {bar.rotation.z = -1.45 * smooth(seg(t, 0, .35));}, extra: [bar]});
  });
  // compressor (yellow tube frame, 50 l tank, V-twin pump head, wheels, gauges, clear hose)
  const c = new THREE.Group(); c.position.set(0, 1.225, .0); g.add(c);
  cyl(.14, .14, .5, M.compYellow, V(0, .19, .04), c, 'x', 32); for (const s of [-1, 1]) sphere(.14, M.compYellow, V(s * .25, .19, .04), c).scale.set(.32, 1, 1);
  for (const s of [-1, 1]) {tube([V(s * .22, .02, -.18), V(s * .22, .55, -.18), V(s * .2, .66, -.12), V(s * .2, .66, .16)], .012, M.compYellow, c, 24); tube([V(s * .22, .02, -.18), V(s * .22, .02, .2)], .012, M.compYellow, c, 8);}
  tube([V(-.2, .66, -.12), V(0, .7, -.12), V(.2, .66, -.12)], .012, M.compYellow, c, 12);
  for (const s of [-1, 1]) {const wh = cyl(.07, .07, .045, M.rubber, V(.2, .07, s * .19), c, 'z', 20); void wh; cyl(.03, .03, .05, M.plasticDark, V(.2, .07, s * .19), c, 'z', 12);} for (const s of [-1, 1]) cyl(.02, .025, .04, M.rubber, V(-.2, .02, s * .15), c, 'y', 10);
  box(.22, .12, .16, M.black, V(-.02, .39, .04), c, .02);
  for (const s of [-1, 1]) {const cy = new THREE.Group(); cy.position.set(-.02 + s * .06, .47, .04); cy.rotation.z = -s * .45; c.add(cy); cyl(.045, .045, .12, M.aluDark, V(0, .06, 0), cy, 'y', 20); for (let i = 0; i < 6; i++) cyl(.058, .058, .006, M.aluDark, V(0, .02 + i * .018, 0), cy, 'y', 20); box(.1, .02, .1, M.black, V(0, .13, 0), cy, .01); cyl(.035, .035, .03, M.black, V(0, .16, .05), cy, 'z', 16);}
  cyl(.075, .075, .22, M.black, V(-.15, .39, .04), c, 'x', 24); for (let i = 0; i < 8; i++) box(.2, .006, .008, M.plasticDark, V(-.15, .45, -.01 + i * .015), c);
  box(.08, .07, .06, M.black, V(.12, .4, -.07), c, .01); cyl(.015, .015, .02, M.signalRed, V(.12, .45, -.07), c, 'y', 12);
  gauge(M, .03, V(.07, .36, -.11), c, '-z'); gauge(M, .03, V(.15, .36, -.11), c, '-z'); cyl(.012, .012, .06, M.brass, V(.2, .33, -.11), c, 'y', 8);
  tube([V(.2, .3, -.12), V(.25, .5, -.2), V(.12, .75, -.22), V(-.1, .7, -.18), V(-.26, .45, -.2), V(-.32, .3, -.24)], .012, M.hoseClear, c, 40);
  label(['10 bar · 50 l'], .12, .03, V(0, .19, .185), c, null, {bg: '#e8e2c8', fg: '#333', w: 256, h: 64});
  // tools on the plywood side panel, sprays on a wire shelf
  const P = new THREE.Group(); P.position.set(-w / 2 - .016, 0, 0); P.rotation.y = -Math.PI / 2; g.add(P);
  for (const [x, y] of [[-.19, 1.64], [-.05, 1.64]]) box(.012, .06, .03, M.steel, V(x, y, .02), P);
  box(.05, .32, .02, M.ply, V(-.19, 1.45, .04), P); box(.14, .05, .04, M.plasticDark, V(-.19, 1.28, .04), P); for (let i = 0; i < 10; i++) box(.004, .04, .006, M.plasticBlack, V(-.24 + i * .011, 1.24, .04), P);
  box(.03, .28, .025, M.ply, V(-.05, 1.48, .035), P); box(.1, .04, .04, M.steelDark, V(-.05, 1.33, .035), P, .006);
 },

 // ---------------- 04 vacuum pump (bottom compartment of the rack) ----------------
 vac(g, M) {
  box(.56, .04, .42, M.plasticBlack, V(0, .02, 0), g, .01);
  const st = new THREE.Group(); st.position.set(0, .04, 0); g.add(st);
  for (const x of [-.12, .12]) for (const z of [-.08, .08]) box(.025, .16, .025, M.galv, V(x, .08, z), st);
  box(.28, .02, .2, M.galv, V(0, .165, 0), st);
  const p = new THREE.Group(); p.position.set(0, .2, 0); st.add(p);
  cyl(.07, .07, .2, M.black, V(-.06, 0, 0), p, 'x', 24); for (let i = 0; i < 10; i++) box(.18, .006, .008, M.plasticDark, V(-.06, .066, -.045 + i * .01), p);
  cyl(.072, .072, .03, M.plasticBlack, V(-.175, 0, 0), p, 'x', 24); for (let i = 0; i < 6; i++) torus(.015 + i * .01, .002, M.plasticDark, V(-.192, 0, 0), p, 'x');
  cyl(.075, .075, .1, M.steel, V(.1, 0, 0), p, 'x', 24); box(.06, .05, .05, M.black, V(-.06, .09, 0), p, .008);
  cyl(.035, .035, .08, M.blackMatte, V(.1, .1, 0), p, 'y', 16); gauge(M, .025, V(.16, .06, -.04), p, '-z', '-1 · 0');
  tube([V(.1, .14, 0), V(.12, .3, .05), V(.2, .5, .24), V(.24, .9, .26), V(.24, 1.9, .26)], .009, M.hoseBlack, g, 40);
  tube([V(-.2, .1, -.1), V(-.25, .3, -.2), V(-.27, .8, -.24), V(-.27, 1.9, -.24)], .006, M.cable, g, 30);
 },

 // ---------------- 05 compressed air ring main with wall outlets ----------------
 air(g, M, ctx) {
  const Y = 1.88, Z = 1.035;
  // maintenance unit (filter + regulator) with gauge and drain
  const fr = new THREE.Group(); fr.position.copy(ctx.w(1.753, 1.45, .95)); fr.rotation.y = -Math.PI / 2; g.add(fr);
  box(.16, .05, .012, M.steel, V(0, .12, .006), fr);
  cyl(.022, .022, .07, M.steelDark, V(-.04, .08, .04), fr, 'y', 16); cyl(.02, .016, .08, M.glassLens, V(-.04, .0, .04), fr, 'y', 16); cyl(.004, .004, .03, M.brass, V(-.04, -.05, .04), fr, 'y', 6);
  box(.05, .06, .05, M.steelDark, V(.03, .1, .04), fr, .008); cyl(.02, .02, .04, M.blue, V(.03, .15, .04), fr, 'y', 16); gauge(M, .022, V(.03, .1, .07), fr, '+z', '0 · 6 · 10');
  airOutlet(M, V(0, -.3, 0), fr, '+z');
  hose([ctx.w(2.32, 1.56, .66), ctx.w(2.2, 1.78, .44), ctx.w(1.9, 1.76, .5), ctx.w(1.76, 1.62, .72), ctx.w(1.735, 1.53, .9)], .01, M.hoseClear, g, M.brass, 40);
  // blue PA ring main along the right wall, across the rear ceiling, down the left wall to the manifold
  const pts = [ctx.w(1.735, 1.56, .95), ctx.w(1.72, Y - .05, .97), ctx.w(1.6, Y, Z), ctx.w(.4, Y, Z), ctx.w(-1.0, Y, Z), ctx.w(-2.42, Y, Z), ctx.w(-2.47, 1.97, .7), ctx.w(-2.47, 1.97, -.7), ctx.w(-2.42, Y, -Z), ctx.w(-2.3, 1.78, -Z)];
  tube(pts, .008, M.paBlue, g, 160, 8);
  for (let x = 1.4; x > -2.4; x -= .45) box(.03, .02, .02, M.plasticBlack, ctx.w(x, Y, Z + .005), g);
  // drops to outlets: bench (x .40), mixing place (x -1.05), rear post (x -2.42, spiral hose)
  for (const [x, y] of [[.40, 1.22], [-1.04, 1.28], [-2.43, 1.34]]) {tube([ctx.w(x, Y, Z), ctx.w(x, y + .1, Z)], .008, M.paBlue, g, 8, 8); airOutlet(M, ctx.w(x, y, 1.05), g, '-z', x > -2);}
  // spiral hose with blow gun hanging at the rear post
  const sp = [], x0 = -2.43; for (let i = 0; i <= 260; i++) {const a = i / 20 * TAU, y = 1.2 - i * .0028; sp.push(ctx.w(x0 + .05 * Math.cos(a), y, 1.0 + .05 * Math.sin(a)));}
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sp), 520, .005, 6), M.hoseBlue, V(), g);
  const gun = new THREE.Group(); gun.position.copy(ctx.w(-2.43, .44, 1.0)); g.add(gun); box(.03, .1, .03, M.signalRed, V(0, 0, 0), gun, .008); cyl(.006, .006, .12, M.steel, V(0, -.1, 0), gun, 'y', 8);
  // vacuum line along the ceiling duct to the manifold (black)
  tube([ctx.w(2.36, 1.9, 1.01), ctx.w(1.6, 1.94, 1.01), ctx.w(-2.4, 1.94, 1.01), ctx.w(-2.49, 1.99, .6), ctx.w(-2.49, 1.99, -.6), ctx.w(-2.4, 1.94, -1.01), ctx.w(-2.15, 1.8, -1.01)], .006, M.hoseBlack, g, 160, 6);
 },

 // ---------------- 06 heavy-duty pull-out with two moulds ----------------
 drawer(g, M, ctx) {
  const Lx = .85, D = .62;
  box(Lx, .04, D, M.galv, V(0, .02, 0), g); for (const x of [-Lx / 2 + .02, Lx / 2 - .02]) {box(.04, .1, D, M.galv, V(x, .07, 0), g); box(.012, .05, D - .02, M.steelDark, V(x + (x < 0 ? .026 : -.026), .09, 0), g);}
  for (const x of [-.35, .35]) for (const z of [-.25, .25]) bolt(.008, M.steel, V(x, .042, z), g);
  const tray = new THREE.Group(); tray.position.set(0, 0, 0); g.add(tray);
  box(Lx - .1, .012, D - .04, M.aluMatte, V(0, .07, 0), tray);
  for (const s of [-1, 1]) box(Lx - .1, .08, .012, M.aluMatte, V(0, .11, s * (D / 2 - .026)), tray);
  for (const s of [-1, 1]) {box(.012, .08, D - .04, M.aluMatte, V(s * (Lx / 2 - .056), .11, 0), tray); box(.01, .03, D - .04, M.steel, V(s * (Lx / 2 - .036), .09, 0), tray);}
  // front plate with handle bar, red latch and plate
  const front = new THREE.Group(); front.position.set(0, 0, D / 2 - .01); tray.add(front);
  box(Lx - .02, .24, .015, M.treadPlate, V(0, .13, 0), front, .006);
  cyl(.012, .012, .5, M.stainless, V(0, .21, .045), front, 'x', 12); for (const x of [-.25, .25]) box(.02, .02, .04, M.stainless, V(x, .21, .025), front, .005);
  box(.06, .03, .03, M.signalRed, V(.3, .2, .02), front, .008);
  label(['DSS-Flex Schalungen DN 300 · DN 400', 'Vollauszug · max. 200 kg'], .34, .06, V(-.1, .1, .009), front, null, {bg: '#e9eef0', fg: '#1d2d38', w: 768, h: 136});
  // foam beds and two moulds (long axis along z)
  box(Lx - .14, .05, D - .1, M.foam, V(0, .101, 0), tray);
  ctx.mould(tray, V(-.2, .126, -.01), 300); ctx.mould(tray, V(.18, .126, -.01), 400);
  strap([V(-.36, .13, .12), V(-.2, .44, .12), V(.18, .5, .12), V(.36, .13, .12)], .035, .003, M.strap, tray);
  ctx.drawer('drawer', tray, V(0, 0, 1), .5, {dur: 1.3});
 },

 // ---------------- 07 wall saddle with nested shields ----------------
 saddle(g, M) {
  box(.14, .56, .012, M.steelDark, V(0, -.05, .006), g); for (const y of [-.28, .18]) for (const x of [-.045, .045]) bolt(.008, M.steel, V(x, y, .014), g, 'z');
  box(.05, .6, .05, M.steelDark, V(0, -.05, .037), g);
  box(.05, .05, .56, M.steelDark, V(0, 0, .3), g); box(.06, .012, .54, M.rubber, V(0, .031, .31), g); box(.05, .12, .012, M.steelDark, V(0, .05, .58), g);
  beam(V(0, -.3, .04), V(0, -.02, .3), .04, .03, M.steelDark, g);
  const mats = [M.shieldRed, M.shieldRed, M.shieldCream, M.shieldCream], rr = [.23, .26, .29, .32], a = .95;
  rr.forEach((r, i) => {
   const top = .045 + i * .012, sh = new THREE.Group(); sh.position.set(0, top - r, .32); g.add(sh);
   const s = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .5, 48, 1, true, -a, 2 * a), mats[i]); s.material.side = THREE.DoubleSide; s.rotation.x = -Math.PI / 2; s.castShadow = s.receiveShadow = true; sh.add(s);
   for (const k of [-1, 1]) {const e = cyl(.006, .006, .5, M.rubber, V(k * r * Math.sin(a), r * Math.cos(a), 0), sh, 'z', 8); void e;}
   for (const z of [-.12, .12]) box(.08, .02, .05, M.steel, V(0, r - .014, z), sh);
  });
  const band = new THREE.Mesh(new THREE.CylinderGeometry(.33, .33, .04, 48, 1, true, -a - .05, 2 * a + .1), M.strap); band.material = M.strap; band.rotation.x = -Math.PI / 2; band.position.set(0, .045 + 3 * .012 + .006 - .33, .5); g.add(band);
 },

 // ---------------- 08 bladder holder under the ceiling ----------------
 bladders(g, M) {
  box(.95, .021, .4, M.ply, V(0, -.011, 0), g); box(.95, .002, .4, M.film, V(0, -.022, 0), g);
  for (const [x, z] of [[-.44, -.17], [.44, -.17], [-.44, .17], [.44, .17]]) bolt(.009, M.steel, V(x, -.024, z), g);
  [[.033, .54], [.038, .58], [.043, .62], [.048, .66], [.055, .68]].forEach(([r, l], i) => {
   const x = -.36 + i * .18, b = new THREE.Group(); b.position.set(x, -.03, (i % 2 ? .06 : -.04)); b.rotation.z = (i - 2) * .02; b.rotation.x = (i % 2 ? -1 : 1) * .025; g.add(b);
   box(.03, .05, .03, M.galv, V(0, -.02, 0), b); torus(r * 1.08, .006, M.galv, V(0, -.06, 0), b, 'y');
   cyl(r * .55, r * .55, .05, M.steel, V(0, -.07, 0), b, 'y', 14);
   const m = i === 4 ? M.hoseGrey : M.rubber;
   lathe([[r * .5, 0], [r, -.03], [r * 1.04, -l * .35], [r * .98, -l * .7], [r, -l + .04], [r * .7, -l], [0, -l - .005]], m, V(0, -.09, 0), b, 28);
   for (const t of [.12, .45, .78]) torus(r * 1.05, .0045, M.tape, V(0, -.09 - l * t, 0), b, 'y');
  });
 },

 // ---------------- 09 hose saddles with supply lines (right wall above the mixing place) ----------------
 hoses(g, M, ctx) {
  const hanger = (x, list, seed) => {
   const h = new THREE.Group(); h.position.set(x, 0, 0); g.add(h);
   const sh = new THREE.Shape(); sh.moveTo(-.12, 0); sh.lineTo(.12, 0); sh.lineTo(0, -.2); sh.closePath();
   const pl = mesh(new THREE.ExtrudeGeometry(sh, {depth: .012, bevelEnabled: false}), M.plasticDark, V(0, -.02, .002), h); void pl;
   const arch = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .13, 32, 1, true, -Math.PI / 2, Math.PI), M.plasticDark); arch.material.side = THREE.DoubleSide; arch.rotation.x = -Math.PI / 2; arch.position.set(0, -.14, .075); arch.castShadow = true; h.add(arch);
   for (const z of [.012, .138]) {const rim = new THREE.Mesh(new THREE.TorusGeometry(.17, .008, 8, 32, Math.PI), M.plasticDark); rim.position.set(0, -.14, z); h.add(rim);}
   box(.05, .16, .13, M.plasticDark, V(0, -.22, .075), h, .01);
   let rs = seed;
   const rnd = () => (rs = (rs * 9301 + 49297) % 233280) / 233280;
   for (let i = 0; i < 16; i++) {
    const m = list[i % list.length], r = m === M.hoseBlue ? .008 : .0065, len = .78 + rnd() * .12, wd = .13 + rnd() * .04, z = .03 + rnd() * .08;
    const pts = []; for (let k = 0; k <= 26; k++) {const a = k / 26; const ang = Math.PI * (1 - a); let px, py;
     if (a < .15) {const q = a / .15; px = -.17 * Math.cos(Math.PI * (1 - q * .5)) * (1 - q) - wd * q; py = .02 + .16 * Math.sin(Math.PI * (1 - q * .5)) * (1 - q) - .14 * q;}
     else if (a > .85) {const q = (1 - a) / .15; px = .17 * Math.cos(Math.PI * (q * .5)) * (1 - q) + wd * q; py = .02 + .16 * Math.sin(Math.PI * (q * .5)) * (1 - q) - .14 * q;}
     else {const q = (a - .15) / .7; px = -wd * Math.cos(q * Math.PI); py = -.14 - len * Math.sin(q * Math.PI) * (1 - .2 * Math.sin(q * Math.PI));}
     void ang; pts.push(V(px + (rnd() - .5) * .01, py, z + .006 * Math.sin(k + i)));}
    tube(pts, r, m, h, 60, 6);
   }
   for (const y of [-.45, -.7]) for (const s of [-1, 1]) {const t = cyl(.05, .05, .03, M.tape, V(s * .14, y, .08), h, 'y', 12); t.scale.set(.6, 1, 1.2);}
   for (let i = 0; i < 3; i++) {const c = geka(M, V(-.06 + i * .06, -.98 - i * .02, .1), h, 'y'); void c;}
   return h;
  };
  hanger(-.40, [M.hoseBlue, M.hoseGrey, M.hoseGrey], 7);
  hanger(.28, [M.hoseGrey, M.hoseBlue, M.hoseGrey, M.hoseGrey], 13);
  const hand = (t, p) => {const o = label([t], .16, .07, p, g, null, {bg: null, fg: '#26292b', w: 256, h: 112, font: 'Segoe Print, Comic Sans MS, cursive', weight: 700}); o.material.transparent = true; o.material.alphaTest = .05; return o;};
  hand('400', V(-.16, -.05, .003)); hand('500', V(.52, -.05, .003));
  g.rotation.y = Math.PI; // wall is at +z of the trailer: turn so that "local +z" points into the room
 },

 // ---------------- 10 supply drum ----------------
 drum(g, M) {
  const R = .46, Wd = .2, d = new THREE.Group(); d.position.set(0, .54, 0); g.add(d);
  const flange = () => {const s = new THREE.Shape(); s.absarc(0, 0, R, 0, TAU); for (let i = 0; i < 6; i++) {const a = i / 6 * TAU + .3, h = new THREE.Path(); h.absarc(Math.cos(a) * .29, Math.sin(a) * .29, .09, 0, TAU, true); s.holes.push(h);} const hub = new THREE.Path(); hub.absarc(0, 0, .045, 0, TAU, true); s.holes.push(hub); const geo = new THREE.ExtrudeGeometry(s, {depth: .01, bevelEnabled: true, bevelThickness: .003, bevelSize: .003, bevelSegments: 1, curveSegments: 40}); geo.translate(0, 0, -.005); return geo;};
  const fg = flange(); for (const z of [-Wd, Wd]) mesh(fg, M.drum, V(0, 0, z), d);
  cyl(.2, .2, 2 * Wd, M.drum, V(), d, 'z', 40);
  for (let i = 0; i < 6; i++) {const a = i / 6 * TAU; for (const z of [-Wd - .012, Wd + .012]) bolt(.01, M.steel, V(Math.cos(a) * .12, Math.sin(a) * .12, z), d, 'z');}
  const colors = [M.hoseGrey, M.hoseGrey, M.hoseBlue, M.hoseGrey, M.hoseBlack, M.hoseGrey];
  for (let layer = 0; layer < 5; layer++) for (let i = 0; i < 9; i++) torus(.214 + layer * .03, .014, colors[(i * 2 + layer) % 6], V(0, 0, -Wd + .03 + i * .043), d, 'z', 40);
  // bundle end over the top towards the door, coupling block on the floor
  tube([V(-.05, .37, -.1), V(-.25, .38, -.12), V(-.4, .1, -.12), V(-.42, -.35, -.1), V(-.36, -.52, -.08)], .02, M.hoseGrey, d, 40);
  const cb = new THREE.Group(); cb.position.set(-.34, .03, -.1); g.add(cb); box(.12, .06, .38, M.boxGrey, V(0, .03, 0), cb, .008); for (let i = 0; i < 4; i++) cyl(.01, .01, .04, M.brass, V(-.04, .06, -.14 + i * .09), cb, 'x', 8);
  // A-frames with pillow blocks, base rails, crank, lock pin, rotary union
  for (const s of [-1, 1]) {
   beam(V(-.32, 0, s * .27), V(0, .56, s * .27), .045, .045, M.steelDark, g); beam(V(.32, 0, s * .27), V(0, .56, s * .27), .045, .045, M.steelDark, g);
   box(.72, .045, .06, M.steelDark, V(0, .022, s * .27), g); box(.1, .06, .08, M.steelDark, V(0, .56, s * .27), g, .01);
   for (const x of [-.3, .3]) bolt(.009, M.steel, V(x, .046, s * .27), g);
  }
  box(.05, .04, .54, M.steelDark, V(-.3, .02, 0), g); box(.05, .04, .54, M.steelDark, V(.3, .02, 0), g);
  cyl(.025, .025, .64, M.steel, V(0, .54, 0), g, 'z', 16);
  const cr = new THREE.Group(); cr.position.set(0, .54, .32); g.add(cr); box(.2, .03, .02, M.steelDark, V(.1, 0, 0), cr, .008); cyl(.012, .012, .1, M.plasticBlack, V(.2, 0, .05), cr, 'z', 10); cr.rotation.z = -1.1;
  cyl(.012, .012, .1, M.steel, V(.26, .72, -.24), g, 'z', 10); torus(.02, .004, M.steel, V(.26, .72, -.3), g, 'z');
  const ru = new THREE.Group(); ru.position.set(0, .54, -.33); g.add(ru); box(.1, .1, .08, M.brassDirty, V(), ru, .01); for (let i = 0; i < 4; i++) cyl(.009, .009, .05, M.brass, V(-.03 + i * .02, .065, 0), ru, 'y', 8);
 },

 // ---------------- 11 air manifold box (left wall, items towards +z) ----------------
 manifold(g, M, ctx) {
  box(.42, .3, .15, M.boxGrey, V(0, 0, .077), g, .012); box(.43, .02, .16, M.boxGrey, V(0, .155, .08), g, .006);
  box(.04, .04, .01, M.steel, V(0, .1, .156), g); cyl(.008, .008, .012, M.blackMatte, V(0, .1, .163), g, 'z', 4);
  for (const x of [-.18, .18]) box(.03, .36, .012, M.steelDark, V(x, 0, .006), g);
  // main valve, regulator, T-pieces and four couplings with colour rings and labels
  cyl(.014, .014, .1, M.brassDirty, V(-.16, -.2, .07), g, 'y', 12); box(.06, .012, .02, M.signalRed, V(-.14, -.2, .09), g, .004);
  cyl(.012, .012, .3, M.brass, V(.0, -.2, .07), g, 'x', 12);
  const reg = new THREE.Group(); reg.position.set(.08, -.28, .08); g.add(reg); box(.05, .06, .05, M.steelDark, V(), reg, .008); cyl(.022, .022, .03, M.blue, V(0, -.045, 0), reg, 'y', 18); gauge(M, .024, V(0, .01, .03), reg, '+z', '0 · 2 · 4');
  const ring = [M.yellow, M.green, M.signalRed, M.blue], names = ['1 Bumper', '2 Dichtblase', '3 Anschlussblase', 'Vakuum'], hoseM = [M.hoseBlue, M.hoseClear, M.hoseBlue, M.hoseBlack];
  const ru = ctx.w(-2.08, .54, -.66 - .33);
  for (let i = 0; i < 4; i++) {const x = -.15 + i * .1; cyl(.012, .012, .08, M.brass, V(x, -.19, .12), g, 'y', 10); torus(.015, .005, ring[i], V(x, -.23, .12), g, 'y'); cyl(.01, .01, .03, M.steel, V(x, -.26, .12), g, 'y', 10);
   label([names[i]], .09, .02, V(x, -.12, .155), g, null, {bg: '#f4f4ef', fg: '#1d2d38', w: 256, h: 58});
   hose([V(x, -.28, .12), V(x, -.5, .16), V(x * .5 + ru.x * .5, (-.5 + ru.y) * .6, .2), V(ru.x - .03 + i * .02, ru.y + .12, ru.z + .02)], .006, hoseM[i], g, M.brass, 40);}
 },

 // ---------------- 12/13 water tanks ----------------
 tank(g, M, ctx) {
  const side = ctx.aisle, w = 1.2, h = .46, d = .54;
  box(w + .08, .06, d + .06, M.galv, V(0, .03, 0), g); for (const s of [-1, 1]) {box(w + .08, .08, .012, M.galv, V(0, .06, s * (d / 2 + .03)), g); box(.012, .08, d + .06, M.galv, V(s * (w / 2 + .04), .06, 0), g);}
  const shell = box(w, h, d, M.tankPE, V(0, .06 + h / 2, 0), g, .06); shell.castShadow = false;
  for (const y of [.15, .29, .41]) {const r = box(w + .012, .025, d + .012, M.tankPE, V(0, .06 + y, 0), g, .02); r.castShadow = false;}
  for (const x of [-.3, .3]) {const r = box(.03, h - .04, d + .012, M.tankPE, V(x, .06 + h / 2, 0), g, .015); r.castShadow = false;}
  cyl(.12, .12, .035, M.plasticBlack, V(.34, .06 + h + .015, 0), g, 'y', 32); for (let i = 0; i < 12; i++) {const a = i / 12 * TAU; box(.012, .03, .02, M.plasticBlack, V(.34 + .12 * Math.cos(a), .06 + h + .015, .12 * Math.sin(a)), g, 0, [0, -a, 0]);}
  cyl(.018, .018, .05, M.plasticDark, V(-.45, .06 + h + .025, side * .18), g, 'y', 12);
  const vx = -.52; cyl(.02, .02, .06, M.brass, V(vx, .1, side * (d / 2 + .03)), g, 'z', 12); box(.02, .02, .02, M.brass, V(vx, .1, side * (d / 2 + .065)), g); box(.07, .012, .018, M.blue, V(vx + .03, .12, side * (d / 2 + .065)), g, .004);
  cyl(.018, .018, .12, M.brass, V(vx, .04, side * (d / 2 + .065)), g, 'y', 10);
  for (const x of [-.32, .32]) strap([V(x, .07, side * (d / 2 + .035)), V(x, .06 + h + .012, side * (d / 2 - .02)), V(x, .06 + h + .012, -side * (d / 2 - .02)), V(x, .45, -side * (d / 2 + .02))], .035, .003, M.strap, g);
  const water = box(w - .04, 1, d - .04, M.water, V(0, 0, 0), g, .04); water.castShadow = false; water.userData.keep = true; water.userData.h = h - .06; water.userData.base = .08;
  if (side < 0) {
   const sight = new THREE.Group(); sight.position.set(.46, .08, side * (d / 2 + .02)); g.add(sight);
   cyl(.012, .012, .4, M.glassLens, V(0, .2, 0), sight, 'y', 12); for (const y of [0, .4]) box(.03, .02, .03, M.brass, V(0, y, 0), sight);
   const lvl = cyl(.009, .009, 1, M.water, V(0, 0, 0), sight, 'y', 10); lvl.userData.keep = true; water.userData.sight = lvl;
   label(['600 l', '300', '0'], .035, .4, V(-.035, .2, -.004), sight, [0, Math.PI, 0], {bg: '#f4f6f5', fg: '#223', w: 64, h: 512});
  } else label(['Wassertank 300 l'], .2, .04, V(0, .45, side * (d / 2 + .004)), g, [0, side > 0 ? 0 : Math.PI, 0], {bg: '#eef3f6', fg: '#123a5a', w: 384, h: 76});
  if (side > 0) tube([ctx.w(-.33, .35, -1.03), ctx.w(-.33, .5, -1.0), ctx.w(-.33, .6, -.92)], .02, M.plasticBlack, g, 12, 8);
  return water;
 },

 // ---------------- 19 mortar shelf over the left tank ----------------
 bags(g, M, ctx) {
  const y = .62, X = .64, Z = .28;
  for (const x of [-X, X]) for (const z of [-Z, Z]) box(.03, y + .06, .03, M.galv, V(x, (y + .06) / 2, z), g);
  for (const x of [-X, X]) box(.03, .03, 2 * Z, M.galv, V(x, y, 0), g); for (const z of [-Z, Z]) box(2 * X, .03, .03, M.galv, V(0, y, z), g);
  for (let i = 0; i < 21; i++) box(.006, .012, 2 * Z, M.galv, V(-X + .03 + i * .061, y + .012, 0), g);
  box(2 * X, .06, .012, M.galv, V(0, y + .045, -Z), g);
  const list = [];
  for (let i = 0; i < 10; i++) {const layer = Math.floor(i / 2), k = i % 2; list.push(ctx.sack(V(-.31 + k * .62, y + .08 + layer * .115, (layer % 2 ? .015 : -.01)), (layer % 2 ? .03 : -.02) + (k ? .02 : 0), g));}
  for (const x of [-.35, .35]) strap([V(x, y + .04, Z + .015), V(x, y + .66, Z - .02), V(x, y + .66, -Z + .02), V(x, y + .04, -Z - .015)], .035, .003, M.strap, g);
  return list;
 },

 // ---------------- 14 pump set on the lower level of the equipment stand ----------------
 pumpset(g, M, ctx) {
  profileFrame(-.31, .31, 0, .56, -.28, .28, M.alu, g, {shelves: []});
  box(.64, .025, .58, M.film, V(0, .572, 0), g);
  box(.56, .05, .48, M.plasticBlack, V(0, .025, 0), g, .01); box(.54, .004, .46, M.blackMatte, V(0, .052, 0), g);
  const st = new THREE.Group(); st.position.set(.02, .05, 0); g.add(st);
  for (const x of [-.1, .1]) for (const z of [-.07, .07]) box(.022, .16, .022, M.galv, V(x, .08, z), st);
  box(.24, .015, .18, M.galv, V(0, .16, 0), st); box(.22, .006, .12, M.ply, V(0, .005, 0), st);
  const p = new THREE.Group(); p.position.set(0, .25, 0); st.add(p);
  cyl(.065, .065, .15, M.stainless, V(-.07, 0, 0), p, 'x', 24); cyl(.07, .07, .02, M.aluDark, V(.015, 0, 0), p, 'x', 24);
  cyl(.066, .066, .18, M.black, V(.12, 0, 0), p, 'x', 24); for (let i = 0; i < 8; i++) box(.16, .006, .01, M.plasticBlack, V(.12, .062, -.04 + i * .011), p);
  cyl(.068, .068, .03, M.plasticBlack, V(.225, 0, 0), p, 'x', 24); box(.07, .05, .07, M.black, V(.1, .085, 0), p, .01); label(['0,9 kW'], .05, .02, V(.1, .085, .036), p, null, {bg: '#e7c21e', fg: '#111', w: 128, h: 52});
  cyl(.022, .022, .06, M.brass, V(-.07, .08, 0), p, 'y', 12);
  const pc = new THREE.Group(); pc.position.set(-.07, .16, 0); p.add(pc); box(.09, .1, .07, M.blue, V(), pc, .012); gauge(M, .026, V(0, .01, .036), pc, '+z', '0 · 4 · 8'); box(.02, .012, .02, M.signalRed, V(.025, -.035, .036), pc);
  const X = new THREE.Group(); X.position.set(-.07, .25, 0); p.add(X); box(.05, .05, .05, M.brass, V(), X, .008); for (const [a, b] of [[V(-.04, 0, 0), 'x'], [V(.04, 0, 0), 'x'], [V(0, 0, .04), 'z'], [V(0, .04, 0), 'y']]) cyl(.016, .016, .04, M.brass, a, X, b, 10);
  cyl(.016, .016, .22, M.brass, V(0, .15, 0), X, 'y', 10); box(.03, .03, .03, M.brass, V(0, .2, 0), X); box(.06, .012, .015, M.signalRed, V(.03, .215, 0), X, .004);
  // hoses: suction via filter (blue), to HD (orange), to the mixing tap (red, up into the duct)
  const fw = new THREE.Group(); fw.position.set(-.24, .3, -.2); g.add(fw); cyl(.045, .045, .03, M.blue, V(0, .13, 0), fw, 'y', 18); cyl(.04, .04, .2, M.glassLens, V(0, .01, 0), fw, 'y', 18); cyl(.028, .028, .19, M.white, V(0, .01, 0), fw, 'y', 14);
  hose([V(-.3, .02, .25), V(-.28, .05, .1), V(-.24, .12, -.1), V(-.24, .18, -.2)], .012, M.hoseBlue, g, M.brass, 24);
  hose([V(-.24, .46, -.2), V(-.2, .5, -.05), V(-.12, .34, 0), V(-.09, .3, 0)], .012, M.hoseBlue, g, M.brass, 24);
  hose([V(-.09, .3 + .25, .04), V(-.02, .52, .12), V(.1, .5, .2), V(.18, .62, .18), V(.2, .7, .12)], .011, M.hoseOrange, g, M.brass, 30);
  tube([V(-.07, .52, 0), V(-.2, .66, -.2), ctx.w(-1.62, 1.1, -1.02), ctx.w(-1.9, 1.86, -1.025), ctx.w(-2.4, 1.93, -1.02), ctx.w(-2.47, 1.99, -.5), ctx.w(-2.47, 1.99, .5), ctx.w(-2.4, 1.93, 1.02), ctx.w(-1.9, 1.86, 1.025), ctx.w(-1.66, 1.6, 1.02), ctx.w(-1.64, 1.5, 1.02)], .01, M.hoseRed, g, 140, 8);
  tube([V(.26, .25, .05), V(.3, .3, .2), V(.3, .5, .27), V(.28, .52, .28)], .006, M.cable, g, 20);
 },

 // ---------------- 15 pressure washer on the upper level ----------------
 hd(g, M, ctx) {
  const u = new THREE.Group(); u.position.set(0, .02, .02); g.add(u);
  box(.5, .3, .34, M.hdBlue, V(0, .15, 0), u, .03); box(.5, .05, .34, M.plasticBlack, V(0, .325, 0), u, .02);
  lathe([[.0, 0], [.03, 0], [.1, .09], [.105, .1], [.095, .1], [0, .01]], M.orange, V(-.12, .35, -.05), u, 24);
  tube([V(-.12, .35, -.05), V(-.12, .33, -.05)], .012, M.orange, u, 4);
  for (const s of [-1, 1]) cyl(.012, .012, .1, M.plasticBlack, V(s * .2, .38, .12), u, 'y', 8); cyl(.012, .012, .4, M.plasticBlack, V(0, .43, .12), u, 'x', 8);
  const cp = new THREE.Group(); cp.position.set(.1, .18, .171); u.add(cp); box(.2, .14, .006, M.plasticDark, V(), cp, .01); cyl(.03, .03, .025, M.plasticBlack, V(-.05, 0, .012), cp, 'z', 18); box(.01, .03, .01, M.white, V(-.05, .015, .026), cp); gauge(M, .025, V(.05, .02, .004), cp, '+z', '0 · 100 · 200');
  label(['200 bar · 400 V'], .12, .025, V(0, -.05, .0035), cp, null, {bg: '#1a3550', fg: '#fff', w: 384, h: 76});
  cyl(.014, .014, .05, M.brass, V(.22, .1, .18), u, 'z', 10);
  // HP hose up to the ceiling reel, lance and gun on the left wall
  const reel = ctx.w(-1.34, 1.71, -.5);
  tube([V(.22, .1, .21), V(.28, .25, .26), V(.25, .7, .24), V(reel.x, reel.y - .3, reel.z), reel], .008, M.hoseBlack, g, 60, 8);
  const lh = new THREE.Group(); lh.position.copy(ctx.w(-1.5, 1.2, -1.05)); g.add(lh);
  for (const x of [-.35, .35]) {box(.03, .08, .02, M.steelDark, V(x, 0, .01), lh); box(.03, .02, .07, M.steelDark, V(x, -.03, .045), lh);}
  const gun = new THREE.Group(); gun.position.set(.45, .0, .07); lh.add(gun); box(.16, .04, .05, M.plasticBlack, V(0, 0, 0), gun, .012); box(.03, .08, .02, M.plasticDark, V(-.03, -.05, 0), gun, .006);
  cyl(.008, .008, .9, M.stainless, V(-.53, -.01, 0), gun, 'x', 8); cyl(.014, .014, .05, M.brass, V(-.99, -.01, 0), gun, 'x', 10);
 },

 // ---------------- 16 stainless hose reel under the ceiling ----------------
 reel(g, M) {
  box(.42, .012, .3, M.stainless, V(0, -.006, 0), g); for (const x of [-.18, .18]) for (const z of [-.12, .12]) bolt(.009, M.steel, V(x, -.014, z), g);
  box(.012, .36, .24, M.stainless, V(.13, -.19, 0), g); box(.2, .012, .24, M.stainless, V(.06, -.02, 0), g);
  const d = new THREE.Group(); d.position.set(0, -.34, 0); g.add(d);
  for (const z of [-.13, .13]) {cyl(.28, .28, .008, M.stainless, V(0, 0, z), d, 'z', 56); torus(.28, .007, M.stainless, V(0, 0, z), d, 'z');}
  cyl(.1, .1, .02, M.stainless, V(0, 0, -.15), d, 'z', 32); cyl(.06, .06, .03, M.stainless, V(0, 0, .15), d, 'z', 24);
  for (let l = 0; l < 3; l++) for (let i = 0; i < 7; i++) torus(.14 + l * .022, .011, M.hoseBlack, V(0, 0, -.1 + i * .033), d, 'z', 36);
  cyl(.03, .03, .3, M.steel, V(), d, 'z', 16);
  const arm = new THREE.Group(); arm.position.set(-.05, -.02, .0); d.add(arm); beam(V(0, 0, 0), V(-.22, -.24, 0), .03, .012, M.stainless, arm); for (const y of [-.22, -.26]) cyl(.012, .012, .06, M.plasticDark, V(-.22, y, 0), arm, 'z', 10);
  tube([V(-.18, -.2, 0), V(-.2, -.25, 0), V(-.22, -.3, 0), V(-.25, -.45, .02), V(-.28, -.62, .04)], .011, M.hoseBlack, d, 30); sphere(.03, M.blackMatte, V(-.28, -.63, .04), d);
 },

 // ---------------- 17 mixing pump on wheels (+ the mixing place frame) ----------------
 mixer(g, M, ctx) {
  // mixing place: profile frame 1.49 × 0.70 with worktop, open at the rear (x0) for rolling out
  const x0 = -2.47 - (-1.77), x1 = -.98 - (-1.77), z0 = -.35, z1 = .35, H = .95;
  profileFrame(x0, x1, 0, H - .03, z0, z1, M.alu, g, {skipBottom: ['x0', 'z0']});
  for (const z of [z0 + .02, z1 - .02]) profile(H - .03, 'y', V(.395, (H - .03) / 2, z), M.alu, g);
  box(x1 - x0 + .03, .027, z1 - z0 + .03, M.ply, V((x0 + x1) / 2, H, 0), g); box(x1 - x0 + .02, .004, z1 - z0 + .02, M.film, V((x0 + x1) / 2, H + .015, 0), g);
  box(x1 - x0, .04, .015, M.aluMatte, V((x0 + x1) / 2, H + .03, z0 - .01), g);
  label(['Mischplatz · Pumpe gesichert fahren'], .3, .035, V(.0, H - .06, z0 - .014), g, [0, Math.PI, 0], {bg: '#f4f4ef', fg: '#1d2d38', w: 512, h: 60});
  // tap for dosing water (fed by the red line from the pump set) and CEE 16 A + Schuko
  const tap = new THREE.Group(); tap.position.copy(ctx.w(-1.64, 1.42, 1.05)); tap.rotation.y = Math.PI; g.add(tap);
  box(.06, .12, .01, M.stainless, V(0, 0, .005), tap); cyl(.012, .012, .08, M.brass, V(0, 0, .045), tap, 'z', 10); box(.05, .012, .015, M.signalRed, V(.02, .02, .06), tap, .004); cyl(.01, .01, .06, M.brass, V(0, -.03, .085), tap, 'y', 10);
  tube([V(0, -.06, .085), V(.05, -.2, .12), V(.1, -.26, .2)], .009, M.hoseClear, tap, 16);
  socketBox(M, ctx.w(-1.64, 1.12, 1.05), g, '-z', ['c', 's']);
  // the pump itself (dynamic group)
  const P = new THREE.Group(); g.add(P);
  const frame = M.steelDark;
  for (const s of [-1, 1]) {tube([V(-.3, .1, s * .19), V(.3, .1, s * .19), V(.36, .14, s * .19), V(.4, .5, s * .17), V(.43, .76, s * .15), V(.4, .8, s * .12)], .014, frame, P, 30); cyl(.018, .018, .1, M.rubber, V(.41, .79, s * .12), P, 'z', 10);}
  for (const x of [-.26, .1, .34]) cyl(.012, .012, .38, frame, V(x, .1, 0), P, 'z', 10);
  const wheels = [];
  for (const s of [-1, 1]) {const wh = new THREE.Group(); wh.position.set(.28, .13, s * .27); wh.userData.dynamic = true; P.add(wh); cyl(.13, .13, .07, M.rubber, V(), wh, 'z', 28); cyl(.075, .075, .074, M.rim, V(), wh, 'z', 18); cyl(.02, .02, .08, M.steel, V(), wh, 'z', 10); for (let i = 0; i < 5; i++) {const a = i / 5 * TAU; box(.01, .03, .075, M.plasticDark, V(.11 * Math.cos(a), .11 * Math.sin(a), 0), wh, 0, [0, 0, a]);} wheels.push(wh);}
  cyl(.012, .012, .6, M.steel, V(.28, .13, 0), P, 'z', 8);
  box(.1, .08, .3, frame, V(-.25, .04, 0), P); box(.12, .012, .32, M.rubber, V(-.25, .006, 0), P);
  // gearbox + pump housing, motor with fan cover and terminal box, switch box
  box(.3, .2, .26, M.pumpBody, V(-.03, .2, 0), P, .03);
  cyl(.085, .085, .28, M.pumpBody, V(.2, .24, 0), P, 'x', 24); cyl(.088, .088, .05, M.blackMatte, V(.34, .24, 0), P, 'x', 24); for (let i = 0; i < 5; i++) torus(.02 + i * .014, .002, M.plasticDark, V(.366, .24, 0), P, 'x');
  for (let i = 0; i < 8; i++) box(.24, .006, .01, M.pumpBody, V(.2, .32, -.05 + i * .014), P);
  box(.08, .06, .08, M.pumpBody, V(.2, .35, .0), P, .01);
  const sb = new THREE.Group(); sb.position.set(.42, .62, .17); P.add(sb); box(.1, .14, .07, M.cabinet, V(), sb, .012); cyl(.018, .018, .02, M.green, V(0, .03, .04), sb, 'z', 14); cyl(.018, .018, .02, M.signalRed, V(0, -.03, .04), sb, 'z', 14);
  // hopper with the metal mixing bucket inside
  lathe([[.07, 0], [.09, .02], [.26, .42], [.285, .47], [.29, .5], [.275, .5], [.255, .45], [.08, .04], [0, .04]], M.hopper, V(-.03, .3, 0), P, 48);
  torus(.285, .012, M.hopper, V(-.03, .79, 0), P, 'y');
  lathe([[0, 0], [.15, 0], [.17, .36], [.178, .37], [.16, .37], [.145, .02], [0, .02]], M.bucket, V(-.03, .46, 0), P, 40);
  tube([V(-.2, .8, 0), V(-.1, .95, 0), V(.04, .95, 0), V(.14, .8, 0)], .004, M.steel, P, 16);
  // screw pump: flange, green stator with tie rods, pressure gauge, brass Geka
  cyl(.07, .07, .03, M.steel, V(-.2, .16, 0), P, 'x', 20);
  cyl(.047, .047, .33, M.stator, V(-.37, .16, 0), P, 'x', 24);
  for (const [y, z] of [[.05, .05], [-.05, -.05], [.05, -.05], [-.05, .05]]) cyl(.006, .006, .36, M.steel, V(-.37, .16 + y * .9, z * .9), P, 'x', 8);
  cyl(.06, .06, .025, M.steel, V(-.54, .16, 0), P, 'x', 20);
  cyl(.03, .03, .05, M.steel, V(-.57, .16, 0), P, 'x', 16); const pg = new THREE.Group(); pg.position.set(-.57, .2, 0); P.add(pg); cyl(.025, .025, .04, M.steel, V(0, .02, 0), pg, 'y', 14); gauge(M, .03, V(0, .07, 0), pg, '-x', '0 · 25 · 50');
  const gk = geka(M, V(-.62, .16, 0), P, 'y'); gk.rotation.z = Math.PI / 2;
  // cable with CEE plug and water hose coiled on the handles
  coil(.07, 4, .012, .006, M.cable, V(.4, .5, -.21), P, 'z'); coil(.07, 3, .014, .007, M.hoseClear, V(.4, .5, .21), P, 'z');
  label(['Mischpumpe 230 V'], .14, .03, V(-.03, .2, .131), P, null, {bg: '#2e363b', fg: '#fff', w: 384, h: 76});
  // lashing strap (only while parked)
  const lash = strap([ctx.w(-1.6, .45, 1.045), V(.1, .45, .25), V(.1, .45, -.25), ctx.w(-1.6, .45, .37)], .035, .003, M.strap, g); lash.userData.dynamic = true;
  // roll-out along the ramps: support points follow floor, ramp and ground
  const xs = ctx.origin.x, zs = ctx.origin.z, xe = XR - RAMP.run - .58;
  const hAt = x => x >= XR - .02 ? F : x <= XR - RAMP.run ? 0 : F * (1 - (XR - x) / RAMP.run);
  let last = 0;
  ctx.toggle({id: 'mixer', handle: P, dur: 4.5, requires: ['ramps', 'legs'], apply: t => {
   const u = smooth(t), xo = xs + (xe - xs) * u, ya = hAt(xo - .25), yb = hAt(xo + .28), pitch = Math.atan2(yb - ya, .53);
   P.position.set(xo - xs, ya + (yb - ya) * (.25 / .53) - F, 0); P.rotation.z = pitch;
   for (const wh of wheels) wh.rotation.z -= ((xo - xs) - last) / .13; last = xo - xs;
   lash.visible = t < .02;
  }});
  P.userData.dynamic = true;
  return {pump: P, worldX: () => xs + P.position.x};
 },

 // ---------------- 18 paddle mixer hanging in the saddle ----------------
 paddle(g, M) {
  const P = new THREE.Group(); P.position.set(0, 0, -.17); P.rotation.z = .05; g.add(P);
  cyl(.045, .05, .26, M.plasticDark, V(0, -.05, 0), P, 'y', 20); cyl(.052, .052, .06, M.signalRed, V(0, .1, 0), P, 'y', 20);
  for (const s of [-1, 1]) tube([V(s * .05, .12, 0), V(s * .16, .16, 0), V(s * .19, .05, 0), V(s * .14, -.05, 0), V(s * .05, -.05, 0)], .013, M.plasticBlack, P, 24);
  box(.012, .03, .02, M.plasticBlack, V(.1, .15, 0), P);
  cyl(.009, .009, .48, M.steel, V(0, -.42, 0), P, 'y', 10);
  const wh = []; for (let i = 0; i <= 40; i++) {const a = i / 40 * TAU * 1.5; wh.push(V(.065 * Math.cos(a), -.62 - i / 40 * .12, .065 * Math.sin(a)));} tube(wh, .006, M.steel, P, 60, 6);
  const wh2 = []; for (let i = 0; i <= 40; i++) {const a = i / 40 * TAU * 1.5 + Math.PI; wh2.push(V(.065 * Math.cos(a), -.62 - i / 40 * .12, .065 * Math.sin(a)));} tube(wh2, .006, M.steel, P, 60, 6);
  torus(.066, .006, M.steel, V(0, -.74, 0), P, 'y');
  tube([V(0, -.15, .03), V(.05, -.35, .06), V(.03, -.5, .08), V(-.02, -.55, .05)], .006, M.cable, P, 20);
 },

 // ---------------- 20 settling container at the front of the mixing place ----------------
 settle(g, M) {
  const w = .34, d = .44, h = .4;
  const shell = box(w, h, d, M.tankPE, V(0, h / 2 + .01, 0), g, .03); shell.castShadow = false;
  box(.012, h - .06, d - .04, M.plastic, V(.03, h / 2, 0), g);
  box(w + .01, .02, d / 2, M.plastic, V(0, h + .02, .11), g, .006); box(w + .01, .02, d / 2, M.plastic, V(-.02, h + .08, -.11), g, .006, [.0, 0, .0]).rotation.x = -.6;
  for (const s of [-1, 1]) box(.1, .025, .03, M.plasticDark, V(0, h - .06, s * (d / 2 + .012)), g, .008);
  cyl(.016, .016, .05, M.brass, V(-w / 2 - .02, .05, .1), g, 'x', 12); box(.012, .05, .015, M.signalRed, V(-w / 2 - .045, .07, .1), g);
  label(['Waschwasser', 'Absetzbehälter'], .2, .06, V(0, .25, -d / 2 - .004), g, [0, Math.PI, 0], {bg: '#f2f2ec', fg: '#333', w: 384, h: 110});
  const w2 = box(w - .04, 1, d - .04, M.washWater, V(), g, .02); w2.castShadow = false; w2.userData.keep = true; w2.userData.h = h - .08; w2.userData.base = .03;
  return w2;
 },

 // ---------------- 21 workbench with three drawers ----------------
 bench(g, M, ctx) {
  const w = 1.47, d = .62, h = .95, X = w / 2;
  profileFrame(-X, X, .52, h - .03, -d / 2, d / 2, M.alu, g, {});
  for (const x of [-X + .02, X - .02]) for (const z of [-d / 2 + .02, d / 2 - .02]) profile(.52, 'y', V(x, .26, z), M.alu, g);
  box(w + .03, .027, d + .03, M.ply, V(0, h, 0), g); box(w + .02, .004, d + .02, M.film, V(0, h + .015, 0), g); box(w + .04, .03, .015, M.aluMatte, V(0, h + .005, -d / 2 - .02), g);
  // drawer cabinet
  box(w - .04, .01, d - .06, M.cabinet, V(0, .555, .01), g); box(w - .04, .36, .01, M.cabinet, V(0, .74, d / 2 - .04), g);
  const cont = [
   b => {for (let i = 0; i < 6; i++) brassElbow(M, V(-.15 + (i % 3) * .1, .03, -.12 + Math.floor(i / 3) * .12), b, [0, i * .9, 0]); for (let i = 0; i < 3; i++) geka(M, V(.13, .02, -.14 + i * .09), b, 'y'); coil(.05, 6, .012, .005, M.black, V(-.1, .01, .14), b); for (let i = 0; i < 5; i++) torus(.02, .003, M.steel, V(.16, .012, .1 + i * .012), b, 'y');},
   b => {for (let i = 0; i < 5; i++) steelPlate(M, V(-.13 + (i % 2) * .12, .012 + Math.floor(i / 2) * .008, -.14 + i * .06), b, i * .3); for (let i = 0; i < 3; i++) peBlock(M, V(.12, .005, -.14 + i * .11), b, i * .4); zipBag(M, V(-.05, .02, .16), b, .2);},
   b => {const tr = new THREE.Group(); tr.position.set(-.05, .005, -.05); b.add(tr); box(.3, .05, .22, M.blue, V(0, .025, 0), tr, .006); for (let i = 0; i < 3; i++) box(.004, .045, .21, M.blueLight, V(-.075 + i * .075, .03, 0), tr); for (let i = 0; i < 12; i++) cyl(.008, .008, .014, i % 3 ? M.brass : M.steel, V(-.12 + (i % 4) * .075, .04, -.06 + Math.floor(i / 4) * .06), tr, 'y', 6); for (let i = 0; i < 3; i++) zipBag(M, V(-.12 + i * .11, .06, .16), b, (i - 1) * .3); box(.1, .03, .07, M.glassLens, V(.15, .02, -.1), b, .005);},
  ];
  const titles = ['Messing · Kupplungen', 'Schildaufnahmen', 'Kleinteile'];
  for (let i = 0; i < 3; i++) {
   const x = -X + .03 + (w - .06) / 6 * (2 * i + 1), dw = (w - .06) / 3 - .012, dr = new THREE.Group(); dr.position.set(x, 0, 0); g.add(dr);
   box(dw - .02, .008, d - .12, M.cabinet, V(0, .585, .02), dr); for (const s of [-1, 1]) {box(.008, .26, d - .12, M.cabinet, V(s * (dw / 2 - .014), .7, .02), dr); } box(dw - .02, .26, .008, M.cabinet, V(0, .7, d / 2 - .07), dr);
   box(dw, .33, .018, M.cabinet, V(0, .735, -d / 2 + .04), dr, .006); box(dw - .06, .02, .03, M.aluMatte, V(0, .88, -d / 2 + .025), dr, .006);
   label([titles[i]], .16, .03, V(0, .8, -d / 2 + .03), dr, [0, Math.PI, 0], {bg: '#f4f4ef', fg: '#1d2d38', w: 384, h: 72});
   const inner = new THREE.Group(); inner.position.set(0, .59, .02); dr.add(inner); cont[i](inner);
   ctx.drawer('bench-' + (i + 1), dr, V(0, 0, -1), .42, {dur: .9});
  }
  // vice at the rear end
  const v = new THREE.Group(); v.position.set(-X + .12, h + .017, -.16); g.add(v);
  cyl(.07, .07, .03, M.blue, V(0, .015, 0), v, 'y', 20); box(.2, .07, .1, M.blue, V(0, .065, 0), v, .012); box(.07, .1, .11, M.blue, V(.06, .13, 0), v, .012); box(.07, .1, .11, M.blue, V(-.02, .13, 0), v, .012);
  for (const x of [.025, .015]) box(.008, .05, .1, M.steelDark, V(x, .17, 0), v); cyl(.01, .01, .3, M.steel, V(-.12, .1, 0), v, 'x', 10); cyl(.006, .006, .16, M.steel, V(-.27, .1, 0), v, 'z', 8);
  // pegboard with tools, sockets, sacrificial hose roll (back wall = right wall, items face -z)
  const back = new THREE.Group(); back.position.copy(ctx.w(-.40, 0, 1.049)); back.rotation.y = Math.PI; g.add(back);
  const pb = new THREE.MeshStandardMaterial({color: '#8d9599', metalness: .5, roughness: .45, alphaMap: ctx.T.pegA, alphaTest: .5, side: THREE.DoubleSide}); ctx.T.pegA.repeat.set(20, 11);
  const board = mesh(new THREE.PlaneGeometry(1.0, .55), pb, V(0, 1.38, .02), back); board.userData.keep = true; board.castShadow = false;
  for (const s of [-1, 1]) box(1.0, .02, .02, M.steelDark, V(0, 1.38 + s * .285, .012), back);
  for (let i = 0; i < 5; i++) {const sp = spanner(M, V(-.4 + i * .05, 1.44, .035), back, .16 + i * .02); sp.rotation.set(Math.PI / 2, 0, 0);}
  for (let i = 0; i < 4; i++) screwdriver(M, V(-.1 + i * .045, 1.48, .04), back, [M.signalRed, M.yellow, M.signalRed, M.blue][i]);
  for (const x of [.14, .22]) pliers(M, V(x, 1.42, .04), back, [Math.PI / 2, 0, 0]);
  {const hs = new THREE.Group(); hs.position.set(.36, 1.46, .04); back.add(hs); box(.3, .02, .012, M.signalRed, V(0, .06, 0), hs); box(.012, .08, .012, M.signalRed, V(-.15, .02, 0), hs); box(.3, .002, .012, M.steel, V(0, -.02, 0), hs);}
  {const tm = new THREE.Group(); tm.position.set(-.3, 1.25, .045); back.add(tm); box(.07, .07, .04, M.yellow, V(), tm, .015);}
  socketBox(M, V(-.56, 1.2, 0), back, '+z', ['s', 's']);
  const roll = new THREE.Group(); roll.position.set(-.62, 1.56, 0); back.add(roll); box(.03, .2, .03, M.steelDark, V(0, .04, .015), roll); cyl(.012, .012, .14, M.steel, V(0, 0, .09), roll, 'z', 8); coil(.12, 3, .03, .012, M.hoseClear, V(0, 0, .14), roll, 'z');
 },

 // ---------------- 22 quick access at the rear right post ----------------
 quick(g, M, ctx) {
  const W0 = new THREE.Group(); W0.rotation.y = Math.PI; g.add(W0); // local +z points into the room
  // paper towel roll on a blue wall holder
  const pr = new THREE.Group(); pr.position.set(0, 1.72, 0); W0.add(pr);
  box(.03, .34, .02, M.blue, V(-.12, 0, .01), pr); tube([V(-.12, .15, .02), V(-.12, .17, .2), V(-.12, .12, .33)], .012, M.blue, pr, 12);
  cyl(.13, .13, .27, M.paperBlue, V(0, 0, .17), pr, 'z', 36); cyl(.03, .03, .275, M.cream, V(0, 0, .17), pr, 'z', 16); cyl(.012, .012, .34, M.blue, V(0, 0, .17), pr, 'z', 8);
  box(.28, .02, .34, M.blue, V(0, .15, .17), pr, .006, [.25, 0, 0]);
  // first aid box, CEE socket with cable
  box(.3, .16, .1, M.blue, V(.0, 1.96, .05), W0, .03); box(.1, .02, .02, M.signalRed, V(0, 1.87, .1), W0);
  cee(M, V(.05, 1.28, 0), W0, '+z'); tube([V(.05, 1.22, .07), V(.06, 1.0, .08), V(.02, .6, .06)], .007, M.cable, W0, 16);
  // on the worktop: cable reel and grease bucket with sprays
  const top = F0 => F0;
  const kr = new THREE.Group(); kr.position.copy(ctx.w(-2.22, .98, .58)); kr.rotation.y = .3; g.add(kr); void top;
  for (const z of [-.1, .1]) cyl(.15, .15, .02, M.signalRed, V(0, .17, z), kr, 'z', 32); cyl(.09, .09, .2, M.cable, V(0, .17, 0), kr, 'z', 24);
  tube([V(-.16, 0, .12), V(-.16, .36, .12), V(.16, .36, .12), V(.16, 0, .12)], .012, M.signalRed, kr, 16); tube([V(-.16, 0, -.12), V(-.16, .36, -.12), V(.16, .36, -.12), V(.16, 0, -.12)], .012, M.signalRed, kr, 16);
  for (const [y, c] of [[.2, M.ceeBlue], [.14, M.ceeBlue]]) cyl(.022, .022, .03, c, V(.03, y, .115), kr, 'z', 14);
  const bk = new THREE.Group(); bk.position.copy(ctx.w(-1.5, .98, .55)); g.add(bk);
  lathe([[0, 0], [.1, 0], [.115, .24], [.12, .245], [.108, .245], [.095, .01], [0, .01]], M.signalRed, V(), bk, 32);
  for (let i = 0; i < 3; i++) {cyl(.03, .03, .2, [M.blue, M.white, M.yellow][i], V(-.04 + i * .04, .12, (i - 1) * .03), bk, 'y', 14); cyl(.012, .012, .03, M.plasticBlack, V(-.04 + i * .04, .235, (i - 1) * .03), bk, 'y', 8);}
  label(['FETT'], .08, .03, V(0, .12, .112), bk, null, {bg: '#b8231d', fg: '#fff', w: 128, h: 48});
 },

 // ---------------- 23 safety & traffic equipment next to the side door ----------------
 safety(g, M, ctx) {
  // six cones on rubber bases
  const cn = new THREE.Group(); cn.position.set(-.04, 0, -.1); g.add(cn);
  for (let i = 0; i < 6; i++) {const b = new THREE.Shape(); for (let k = 0; k < 8; k++) {const a = k / 8 * TAU + Math.PI / 8; k ? b.lineTo(.2 * Math.cos(a), .2 * Math.sin(a)) : b.moveTo(.2 * Math.cos(a), .2 * Math.sin(a));} b.closePath(); const bg = mesh(new THREE.ExtrudeGeometry(b, {depth: .028, bevelEnabled: false}), M.rubber, V(0, i * .03, 0), cn); bg.rotation.x = -Math.PI / 2;}
  for (let i = 0; i < 6; i++) {lathe([[.14, 0], [.03, .7], [.024, .72], [0, .72]], M.cone, V(0, .18 + i * .025, 0), cn, 32); if (i === 5) {cyl(.062, .09, .12, M.coneWhite, V(0, .18 + i * .025 + .38, 0), cn, 'y', 32, true); cyl(.042, .06, .1, M.coneWhite, V(0, .18 + i * .025 + .56, 0), cn, 'y', 32, true);}}
  // two barrier boards upright against the wall with strap
  const stripes = labelTexture([''], {bg: '#f3f3ef', w: 512, h: 128}); {const c = stripes.image.getContext('2d'); c.fillStyle = '#cf1f18'; for (let i = -2; i < 10; i++) {c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64 + 32, 0); c.lineTo(i * 64 + 32 - 128, 128); c.lineTo(i * 64 - 128, 128); c.fill();} stripes.needsUpdate = true;}
  const bm = new THREE.MeshStandardMaterial({map: stripes, roughness: .35});
  for (let i = 0; i < 2; i++) box(.25, 1.0, .02, [M.white, M.white, M.white, M.white, bm, bm], V(-.02, .52, .165 - i * .025), g, 0, [0, 0, .02 * i]);
  strap([ctx.w(1.45, .45, 1.045), V(-.02, .45, .12), V(.12, .45, .12), ctx.w(1.72, .45, 1.045)], .025, .003, M.strap, g);
  // warning lamps on a small shelf, first aid kit, eye wash
  box(.3, .015, .12, M.aluMatte, V(-.02, 1.2, .12), g);
  for (const x of [-.1, .06]) {const wl = new THREE.Group(); wl.position.set(x, 1.21, .12); g.add(wl); box(.1, .1, .05, M.plasticBlack, V(0, .05, 0), wl, .01); cyl(.045, .045, .03, M.amber, V(0, .08, .03), wl, 'z', 20);}
  box(.32, .2, .09, M.white, V(-.02, 1.55, .13), g, .03); box(.32, .05, .092, M.orange, V(-.02, 1.49, .13), g, .01); box(.07, .02, .01, M.green, V(-.02, 1.6, .176), g); box(.02, .07, .01, M.green, V(-.02, 1.6, .176), g);
  const ew = new THREE.Group(); ew.position.set(.1, 1.3, .15); g.add(ew); box(.14, .2, .04, M.green, V(0, 0, 0), ew, .01); for (const x of [-.035, .035]) {cyl(.03, .03, .14, M.white, V(x, .0, .045), ew, 'y', 14); cyl(.02, .02, .03, M.green, V(x, .085, .045), ew, 'y', 10);}
  // 6 kg extinguisher on the plywood side of the compressor rack
  const ex = new THREE.Group(); ex.position.copy(ctx.w(1.76, .68, .72)); g.add(ex);
  box(.012, .3, .08, M.steelDark, V(0, .05, 0), ex); cyl(.08, .08, .46, M.signalRed, V(-.09, 0, 0), ex, 'y', 28); sphere(.08, M.signalRed, V(-.09, .23, 0), ex).scale.y = .45;
  box(.05, .06, .05, M.black, V(-.09, .3, 0), ex, .01); box(.1, .015, .02, M.black, V(-.13, .34, 0), ex, .005); tube([V(-.07, .3, .02), V(-.02, .16, .09), V(-.05, -.1, .1)], .009, M.black, ex, 16);
  label(['ABC 6 kg'], .08, .08, V(-.09, .02, .081), ex, null, {bg: '#f1f1ec', fg: '#b8231d', w: 128, h: 128});
 },
};

// Simplified stored DSS-Flex mould (placeholder until the real model from the kit viewer is inserted).
export function makeMould(M) {
 return (parent, p, dn) => {
  const g = new THREE.Group(); g.position.copy(p); g.userData.mould = dn; parent.add(g);
  const R = dn / 2000 - .012, len = .5, a = 1.05;
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(R, R, len, 40, 1, true, -a, 2 * a), M.compYellow); sh.material.side = THREE.DoubleSide; sh.rotation.x = -Math.PI / 2; sh.position.y = .3 - R; sh.castShadow = true; g.add(sh);
  box(.1, .05, len * .6, M.aluMatte, V(0, .2, 0), g, .01); box(.06, .12, .06, M.aluDark, V(0, .12, 0), g, .008); box(.16, .03, .12, M.aluMatte, V(0, .03, 0), g, .008);
  return g;
 };
}
