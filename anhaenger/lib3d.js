import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const TAU = Math.PI * 2;

// ---------- procedural textures ----------
function canvas(w, h, draw) {const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c;}
function tex(c, {srgb = false, repeat = [1, 1], wrap = true} = {}) {const t = new THREE.CanvasTexture(c); if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;}
function hash(x, y) {let n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296;}
function vnoise(x, y, p) {const i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j, s = f * f * (3 - 2 * f), t = g * g * (3 - 2 * g), h = (a, b) => hash(((a % p) + p) % p, ((b % p) + p) % p); return (h(i, j) * (1 - s) + h(i + 1, j) * s) * (1 - t) + (h(i, j + 1) * (1 - s) + h(i + 1, j + 1) * s) * t;}
function fbm(x, y, p, o = 4) {let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) {s += a * vnoise(x * f, y * f, p * f); a *= .5; f *= 2;} return s / (1 - Math.pow(.5, o));}
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
// Normal map from a height function h(u,v) in [0,1]², tileable when h is.
function normalMap(w, h, fn, strength = 2) {
 const H = new Float32Array(w * h);
 for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) H[y * w + x] = fn(x / w, y / h, x, y);
 return canvas(w, h, g => {
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
   const l = H[y * w + (x + w - 1) % w], r = H[y * w + (x + 1) % w], u = H[((y + h - 1) % h) * w + x], d = H[((y + 1) % h) * w + x];
   let nx = (l - r) * strength, ny = (u - d) * strength, nz = 1; const k = 1 / Math.hypot(nx, ny, nz); nx *= k; ny *= k; nz *= k;
   const i = (y * w + x) * 4; img.data[i] = (nx * .5 + .5) * 255; img.data[i + 1] = (ny * .5 + .5) * 255; img.data[i + 2] = (nz * .5 + .5) * 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
 });
}
function grayMap(w, h, f) {return canvas(w, h, g => {const img = g.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {const v = Math.max(0, Math.min(255, f(x / w, y / h, x, y) * 255)), i = (y * w + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;} g.putImageData(img, 0, 0);});}
function rgbMap(w, h, f) {return canvas(w, h, g => {const img = g.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {const [r, gg, b] = f(x / w, y / h, x, y), i = (y * w + x) * 4; img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = 255;} g.putImageData(img, 0, 0);});}
const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

// Splatter / wear colour map: base colour with mortar splashes, streaks and darker grime.
export function splatMap(base, {spot = '#c9c5bb', dirt = '#3a352e', spots = 60, grime = .35, size = 512, streak = 0} = {}) {
 const B = hex(base), S = hex(spot), D = hex(dirt);
 seed = 11 + spots;
 const c = rgbMap(size, size, (u, v) => {const n = fbm(u * 6, v * 6, 6), m = fbm(u * 22 + 3, v * 22, 22); let col = mix(B, D, grime * Math.max(0, n - .45) * 1.6 + .08 * m); if (streak) col = mix(col, D, streak * Math.max(0, fbm(u * 40, v * 2, 40) - .5)); return col;});
 const g = c.getContext('2d');
 for (let i = 0; i < spots; i++) {
  const x = rnd() * size, y = rnd() * size, r = (rnd() ** 2) * size * .03 + 1.5;
  g.fillStyle = `rgba(${S[0]},${S[1]},${S[2]},${.55 + rnd() * .4})`; g.beginPath(); g.ellipse(x, y, r, r * (.6 + rnd() * .6), rnd() * 3, 0, TAU); g.fill();
  for (let k = 0; k < 5; k++) {g.beginPath(); g.arc(x + (rnd() - .5) * r * 5, y + (rnd() - .5) * r * 5, r * rnd() * .35 + .6, 0, TAU); g.fill();}
 }
 return tex(c, {srgb: true});
}

export function makeTextures() {
 const T = {};
 // Grooved aluminium floor ("Rillenboden"): grooves run along u (trailer length), 8 per 10 cm across v.
 T.floorN = tex(normalMap(8, 256, (u, v) => {const k = (v * 8) % 1; return k < .16 ? 0 : k < .26 ? (k - .16) / .1 : k < .74 ? 1 : k < .84 ? 1 - (k - .74) / .1 : 0;}, 5));
 T.floorR = tex(grayMap(512, 512, (u, v, x, y) => .34 + .22 * fbm(u * 8, v * 8, 8) + .05 * hash(x, y)));
 // Floor wear: whole floor in one tile; u = length (0 = rear), v = width. Mortar dust towards the rear, walking path in the aisle.
 seed = 3;
 {const c = rgbMap(1024, 512, (u, v) => {const aisle = Math.exp(-(((v - .5) / .16) ** 2)), rear = Math.max(0, 1 - u * 2.2); const n = fbm(u * 18, v * 9, 18), m = fbm(u * 60, v * 30, 60);
   let col = [236, 238, 238]; col = mix(col, [150, 146, 138], .22 * aisle * n + .1 * m); col = mix(col, [205, 199, 186], .55 * rear * Math.max(0, n - .35)); return col;});
  const g = c.getContext('2d'); for (let i = 0; i < 140; i++) {const x = rnd() ** 2 * 420, y = 60 + rnd() * 390, r = rnd() * 7 + 1; g.fillStyle = `rgba(214,208,196,${.35 + rnd() * .4})`; g.beginPath(); g.ellipse(x, y, r, r * .7, rnd() * 3, 0, TAU); g.fill();}
  T.floorDirt = tex(c, {srgb: true, wrap: false});}
 // Interior GRP lining: seams, screw holes, faint grime at the bottom (v = 0 bottom after flipY handling below).
 const wallTex = (w, h, len) => {seed = 5 + w; const c = rgbMap(w, h, (u, v) => {const bottom = Math.max(0, v - .78) / .22, n = fbm(u * len * 3, v * 6, Math.round(len * 3)); let col = [236, 237, 233]; col = mix(col, [201, 198, 190], .15 * n); col = mix(col, [120, 112, 100], .45 * bottom * bottom * (.5 + n)); return col;});
  const g = c.getContext('2d'); g.strokeStyle = 'rgba(150,152,150,.55)'; g.lineWidth = 2;
  for (let s = 1.25; s < len; s += 1.25) {const x = s / len * w; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke();}
  for (let i = 0; i < len * 40; i++) {const x = rnd() * w, y = rnd() * h * .92; g.fillStyle = `rgba(60,60,58,${.35 + rnd() * .4})`; g.beginPath(); g.arc(x, y, 1.3 + rnd() * 1.2, 0, TAU); g.fill();}
  for (let i = 0; i < len * 6; i++) {const x = rnd() * w, y = h * (.55 + rnd() * .4), r = rnd() * 5 + 1; g.fillStyle = `rgba(150,144,132,${.25 + rnd() * .3})`; g.beginPath(); g.ellipse(x, y, r, r * 1.6, 0, 0, TAU); g.fill();}
  return tex(c, {srgb: true, wrap: false});};
 T.wallLong = wallTex(2048, 832, 5.05); T.wallShort = wallTex(832, 812, 2.1);
 T.ceiling = tex(rgbMap(1024, 512, (u, v) => mix([242, 243, 240], [214, 212, 205], .25 * fbm(u * 10, v * 5, 10))), {srgb: true, wrap: false});
 T.wallN = tex(normalMap(256, 256, (u, v) => vnoise(u * 32, v * 32, 32) * .5 + vnoise(u * 8, v * 8, 8) * .5, 1.2));
 T.brushR = tex(grayMap(512, 512, (u, v, x, y) => .24 + .16 * vnoise(u * 2, v * 180, 180) + .05 * hash(x >> 2, y)));
 T.galvC = tex(grayMap(256, 256, (u, v) => {const c = vnoise(u * 10, v * 10, 10), d = vnoise(u * 23 + 5, v * 23, 23); return .76 + .16 * (c > .5 ? 1 : 0) * d + .08 * c;}), {srgb: true});
 T.treadN = tex(normalMap(512, 128, (u, v) => {const band = Math.abs(v - .5); const block = ((u * 72) % 1) < .55 ? 1 : 0; return band > .44 ? 1 : (band > .1 && band < .15) || (band > .3 && band < .34) ? 0 : block * .8 + .2;}, 6));
 T.hexN = tex(normalMap(256, 256, (u, v) => {const x = u * 20, y = v * 20 * 1.1547, r = Math.abs(((y % 2) + 2) % 2 - 1), q = Math.abs(((x + (Math.floor(y) % 2) * .5) % 1) - .5); return q < .18 && r > .3 ? 1 : 0;}, 3), {repeat: [7, 7]});
 T.plyEdge = tex(canvas(64, 256, (g, w, h) => {for (let y = 0; y < h; y++) {g.fillStyle = Math.floor(y / 12) % 2 ? '#d7b88a' : '#c9a574'; g.fillRect(0, y, w, 1);}}), {srgb: true});
 // Concrete yard: slab joints every tile (4 m), stains, fine aggregate.
 seed = 9;
 {const c = rgbMap(1024, 1024, (u, v, x, y) => {const n = fbm(u * 8, v * 8, 8), m = fbm(u * 40, v * 40, 40); let col = mix([168, 166, 160], [128, 126, 120], .5 * n + .25 * m); if (hash(x, y) > .993) col = mix(col, [205, 202, 195], .6); if (hash(x + 3, y) > .995) col = mix(col, [90, 88, 84], .5); return col;});
  const g = c.getContext('2d'); g.strokeStyle = 'rgba(70,70,68,.75)'; g.lineWidth = 3; g.strokeRect(1, 1, 1022, 1022);
  for (let i = 0; i < 8; i++) {const x = rnd() * 1024, y = rnd() * 1024, r = 40 + rnd() * 120; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(80,76,70,.18)'); gr.addColorStop(1, 'rgba(80,76,70,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);}
  T.concreteC = tex(c, {srgb: true});}
 T.concreteN = tex(normalMap(512, 512, (u, v, x, y) => fbm(u * 60, v * 60, 60) * .7 + hash(x, y) * .3, 1.4));
 T.rubberN = tex(normalMap(128, 128, (u, v, x, y) => hash(x, y) * .5 + vnoise(u * 12, v * 12, 12) * .5, 1));
 T.fabricN = tex(normalMap(128, 128, (u, v) => .5 + .25 * Math.sin(u * TAU * 32) * (Math.sin(v * TAU * 16) > 0 ? 1 : -1) + .25 * Math.sin(v * TAU * 32), 1.2));
 T.foamN = tex(normalMap(256, 256, (u, v, x, y) => (hash(x, y) > .9 ? 0 : 1) * .6 + fbm(u * 30, v * 30, 30) * .4, 2.5));
 // Aluminium tread plate ("Quintett") for steps and drawer fronts.
 T.treadPlateN = tex(normalMap(256, 256, (u, v) => {let h = 0; for (let k = 0; k < 5; k++) {const cx = ((u * 4 + (Math.floor(v * 4) % 2) * .5) % 1), cy = (v * 4) % 1, a = (Math.floor(v * 4) % 2) ? 1 : 0, lx = a ? cy : cx, ly = a ? cx : cy, off = (k - 2) * .16; const d = Math.abs(lx - .5 - off); if (d < .045 && Math.abs(ly - .5) < .3) h = 1 - d / .045;} return h;}, 3));
 T.perfA = tex(canvas(128, 128, (g, w) => {g.fillStyle = '#fff'; g.fillRect(0, 0, w, w); g.fillStyle = '#000'; for (let y = 8; y < w; y += 16) for (let x = 8 + (y / 16 % 2) * 8; x < w; x += 16) {g.beginPath(); g.arc(x, y, 4.5, 0, TAU); g.fill();}}));
 T.pegA = tex(canvas(128, 128, (g, w) => {g.fillStyle = '#fff'; g.fillRect(0, 0, w, w); g.fillStyle = '#000'; for (let y = 16; y < w; y += 32) for (let x = 16; x < w; x += 32) {g.beginPath(); g.roundRect(x - 3, y - 6, 6, 12, 3); g.fill();}}));
 T.railA = tex(canvas(256, 32, (g, w, h) => {g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#000'; for (let x = 0; x < w; x += 32) {g.beginPath(); g.roundRect(x + 5, 9, 22, 14, 7); g.fill();}}));
 return T;
}

// Label / plaque textures with text.
export function labelTexture(lines, {bg = '#eef2f4', fg = '#1d2d38', w = 512, h = 128, font = 'Barlow Condensed, Bahnschrift, Arial Narrow, sans-serif', weight = 600, band = null, align = 'center', pad = .06} = {}) {
 const c = canvas(w, h, (g) => {
  if (bg) {g.fillStyle = bg; g.fillRect(0, 0, w, h);} if (band) {g.fillStyle = band; g.fillRect(0, 0, w, h * .12); g.fillRect(0, h * .88, w, h * .12);}
  g.fillStyle = fg; g.textAlign = align; g.textBaseline = 'middle';
  const list = [].concat(lines), size = Math.min(h * .66 / list.length, w * .13);
  list.forEach((t, i) => {g.font = `${i ? 400 : weight} ${size * (i ? .74 : 1)}px ${font}`; g.fillText(t, align === 'left' ? w * pad : w / 2, h / 2 + (i - (list.length - 1) / 2) * size * 1.08);});
 });
 const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// ---------- materials ----------
export function makeMaterials(T) {
 const s = (color, o = {}) => new THREE.MeshStandardMaterial({color, roughness: .55, metalness: 0, ...o});
 const splat = (base, o, m = {}) => s('#ffffff', {map: splatMap(base, o), ...m});
 const M = {
  floor: s('#a7adb0', {map: T.floorDirt, metalness: .6, roughness: 1, roughnessMap: T.floorR, normalMap: T.floorN, normalScale: new THREE.Vector2(.9, .9)}),
  wallL: s('#ffffff', {map: T.wallLong, roughness: .62, normalMap: T.wallN, normalScale: new THREE.Vector2(.12, .12)}),
  wallS: s('#ffffff', {map: T.wallShort, roughness: .62, normalMap: T.wallN, normalScale: new THREE.Vector2(.12, .12)}),
  ceiling: s('#ffffff', {map: T.ceiling, roughness: .7}),
  grp: s('#f3f4f2', {roughness: .34, normalMap: T.wallN, normalScale: new THREE.Vector2(.08, .08)}),
  grpEdge: s('#dfe2e0', {roughness: .5}),
  alu: s('#c9ced2', {metalness: .85, roughness: .34}),
  aluMatte: s('#b8bdc1', {metalness: .75, roughness: .5}),
  aluDark: s('#8c9398', {metalness: .8, roughness: .42}),
  galv: s('#ffffff', {map: T.galvC, metalness: .78, roughness: .46}),
  steel: s('#6c747a', {metalness: .75, roughness: .42}),
  steelDark: s('#3e4448', {metalness: .6, roughness: .5}),
  stainless: s('#d6dadd', {metalness: .92, roughness: 1, roughnessMap: T.brushR}),
  black: s('#1d2023', {roughness: .5}),
  blackMatte: s('#25282b', {roughness: .85}),
  rubber: s('#1a1b1d', {roughness: .9, normalMap: T.rubberN, normalScale: new THREE.Vector2(.4, .4)}),
  tyre: s('#1b1c1e', {roughness: .88, normalMap: T.treadN, normalScale: new THREE.Vector2(1.2, 1.2), side: THREE.DoubleSide}),
  rim: s('#aeb3b6', {metalness: .8, roughness: .32, side: THREE.DoubleSide}),
  plastic: s('#9aa1a6', {roughness: .62}),
  plasticDark: s('#474e53', {roughness: .6}),
  plasticBlack: s('#2a2d30', {roughness: .55}),
  euro: s('#9ea4a8', {roughness: .6}),
  ply: s('#c9a574', {roughness: .75, map: T.plyEdge}),
  film: s('#4a3426', {roughness: .72, normalMap: T.hexN, normalScale: new THREE.Vector2(.45, .45)}),
  brass: s('#c29b4e', {metalness: .95, roughness: .32}),
  brassDirty: s('#9d7f45', {metalness: .8, roughness: .5}),
  copper: s('#b8703f', {metalness: .95, roughness: .35}),
  yellow: s('#e0b422', {roughness: .45}),
  compYellow: splat('#d9ae1f', {spot: '#8d7a3c', dirt: '#5a4a1e', spots: 18, grime: .45}),
  red: s('#b8231d', {roughness: .45}),
  signalRed: s('#c8201b', {roughness: .38}),
  redDark: s('#7e1a16', {roughness: .5}),
  blue: s('#245ea8', {roughness: .45}),
  blueLight: s('#6d8fcf', {roughness: .7}),
  orange: s('#e2621c', {roughness: .5}),
  green: s('#27784a', {roughness: .5}),
  stator: splat('#4d6b3a', {spot: '#b9b4a6', dirt: '#2d3322', spots: 40, grime: .5}),
  white: s('#f2f3f1', {roughness: .5}),
  cream: s('#e6dfcf', {roughness: .7}),
  hoseBlue: s('#5b8fd0', {roughness: .55}),
  hoseGrey: s('#aca79c', {roughness: .7}),
  hoseBlack: s('#1f2123', {roughness: .55}),
  hoseOrange: s('#e5541f', {roughness: .45}),
  hoseRed: s('#a8322a', {roughness: .5}),
  hoseClear: new THREE.MeshPhysicalMaterial({color: '#e6eeee', roughness: .18, transparent: true, opacity: .5, depthWrite: false}),
  tankPE: new THREE.MeshPhysicalMaterial({color: '#f1f2ec', roughness: .5, transparent: true, opacity: .72, depthWrite: false}),
  water: new THREE.MeshPhysicalMaterial({color: '#4f8fb8', roughness: .1, transparent: true, opacity: .55}),
  washWater: new THREE.MeshStandardMaterial({color: '#8d897c', roughness: .3, transparent: true, opacity: .92}),
  shieldRed: splat('#b8323c', {spot: '#cfc7b6', dirt: '#40221f', spots: 70, grime: .4}),
  shieldCream: splat('#d6cdb8', {spot: '#9d9587', dirt: '#5d564a', spots: 70, grime: .45}),
  sackPaper: s('#e3ddd0', {roughness: .92}),
  glassLens: new THREE.MeshPhysicalMaterial({color: '#dfe5e8', roughness: .06, transparent: true, opacity: .32, depthWrite: false}),
  ledOn: new THREE.MeshStandardMaterial({color: '#fbfaf4', emissive: '#fff8ea', emissiveIntensity: 2.4}),
  ledOff: s('#e9ecec', {roughness: .3}),
  tail: new THREE.MeshStandardMaterial({color: '#6e0a08', emissive: '#a3120d', emissiveIntensity: .3, roughness: .25}),
  amber: new THREE.MeshStandardMaterial({color: '#d17908', emissive: '#a95c05', emissiveIntensity: .25, roughness: .25}),
  whiteLens: s('#f0f0ea', {roughness: .15}),
  reflectorRed: s('#a8100c', {roughness: .2, metalness: .2}),
  reflectorAmber: s('#d88410', {roughness: .2, metalness: .2}),
  concrete: s('#ffffff', {map: T.concreteC, normalMap: T.concreteN, normalScale: new THREE.Vector2(.5, .5), roughness: .92}),
  cast: s('#3a3d40', {metalness: .5, roughness: .6}),
  cone: splat('#e0521d', {spot: '#6d6960', dirt: '#3d2a1f', spots: 25, grime: .3}),
  coneWhite: s('#eeeeea', {roughness: .3, metalness: .1}),
  gauge: s('#f6f6f2', {roughness: .3}),
  fabric: s('#434a51', {roughness: .9, normalMap: T.fabricN, normalScale: new THREE.Vector2(.5, .5), side: THREE.DoubleSide}),
  foam: s('#34383b', {roughness: .95, normalMap: T.foamN, normalScale: new THREE.Vector2(.8, .8)}),
  treadPlate: s('#c3c8cb', {metalness: .85, roughness: .38, normalMap: T.treadPlateN, normalScale: new THREE.Vector2(1, 1)}),
  strap: s('#d9661f', {roughness: .75}),
  strapBlue: s('#2f5da6', {roughness: .75}),
  tape: s('#9a9892', {roughness: .7}),
  paperBlue: s('#8fa6d6', {roughness: .95}),
  pe: s('#e9e6dd', {roughness: .55}),
  hopper: splat('#e3e1da', {spot: '#9f998c', dirt: '#5a554b', spots: 90, grime: .55, streak: .4}),
  bucket: splat('#a3a7a8', {spot: '#d9d4c8', dirt: '#4d4a44', spots: 110, grime: .6, streak: .3}, {metalness: .6, roughness: .55}),
  pumpBody: splat('#d7d4cc', {spot: '#aaa497', dirt: '#5e594f', spots: 60, grime: .5}),
  drum: splat('#2b2c2d', {spot: '#8e8a80', dirt: '#4b3b2d', spots: 80, grime: .6, streak: .2}, {metalness: .45, roughness: .6}),
  boxGrey: splat('#c9cbc9', {spot: '#9b968b', dirt: '#6c6860', spots: 30, grime: .5}),
  genBody: s('#9aa2a6', {roughness: .45, metalness: .2}),
  genDark: s('#3b4145', {roughness: .5, metalness: .2}),
  hdBlue: splat('#1f6fae', {spot: '#c9c2b4', dirt: '#1d2f3c', spots: 25, grime: .4}),
  cabinet: s('#d4d6d4', {roughness: .5}),
  socket: s('#e3e4df', {roughness: .45}),
  ceeRed: s('#b92a22', {roughness: .45}),
  ceeBlue: s('#2c5fae', {roughness: .45}),
  cable: s('#232527', {roughness: .6}),
  duct: s('#b9bcbc', {roughness: .55}),
  paBlue: s('#3f7fc9', {roughness: .35}),
 };
 return M;
}

// Darkens surfaces towards the floor (world y) with noise, like dust and mortar dirt on used equipment.
export function grime(material, {bottom = .76, top = 1.05, amount = .35} = {}) {
 const base = material.onBeforeCompile;
 material.onBeforeCompile = (sh, r) => {
  base?.(sh, r);
  sh.uniforms.gB = {value: bottom}; sh.uniforms.gT = {value: top}; sh.uniforms.gA = {value: amount};
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGW;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvGW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vGW; uniform float gB, gT, gA;
float gh(vec2 p){return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);}
float gn(vec2 p){vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(gh(i), gh(i + vec2(1, 0)), f.x), mix(gh(i + vec2(0, 1)), gh(i + vec2(1, 1)), f.x), f.y);}`)
   .replace('#include <color_fragment>', `#include <color_fragment>
{float band = 1. - smoothstep(gB, gT, vGW.y); float n = gn(vGW.xz * 7. + vGW.y * 3.) * .6 + gn(vGW.xz * 23.) * .4; diffuseColor.rgb *= 1. - gA * band * (.45 + .75 * n) * step(gB - .02, vGW.y);}`);
 };
 material.customProgramCacheKey = () => 'grime' + bottom + top + amount;
 material.needsUpdate = true;
 return material;
}

// ---------- geometry helpers ----------
const geoCache = new Map();
function cached(key, make) {if (!geoCache.has(key)) geoCache.set(key, make()); return geoCache.get(key);}
export function mesh(g, m, p, parent, rot) {const o = new THREE.Mesh(g, m); if (p) o.position.copy(p); if (rot) o.rotation.set(...rot); o.castShadow = o.receiveShadow = true; parent?.add(o); return o;}
export function box(w, h, d, m, p, parent, r = 0, rot) {return mesh(r ? cached(`rb${w},${h},${d},${r}`, () => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4))) : cached(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), m, p, parent, rot);}
export function plane(w, h, m, p, parent, rot) {const o = mesh(cached(`p${w},${h}`, () => new THREE.PlaneGeometry(w, h)), m, p, parent, rot); o.castShadow = false; return o;}
export function cyl(rt, rb, h, m, p, parent, axis = 'y', seg = 32, open = false) {
 const o = mesh(cached(`c${rt},${rb},${h},${seg},${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open)), m, p, parent);
 if (axis === 'x') o.rotation.z = Math.PI / 2; if (axis === 'z') o.rotation.x = Math.PI / 2; return o;
}
export function sphere(r, m, p, parent, seg = 20) {return mesh(cached(`s${r},${seg}`, () => new THREE.SphereGeometry(r, seg, seg * .7 | 0)), m, p, parent);}
export function torus(R, r, m, p, parent, axis = 'y', arc = TAU, seg = 48) {const o = mesh(cached(`t${R},${r},${arc},${seg}`, () => new THREE.TorusGeometry(R, r, 10, seg, arc)), m, p, parent); if (axis === 'y') o.rotation.x = Math.PI / 2; if (axis === 'x') o.rotation.y = Math.PI / 2; return o;}
export function lathe(points, m, p, parent, seg = 48) {return mesh(new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), seg), m, p, parent);}
export function tube(points, r, m, parent, seg = 64, radial = 10, closed = false) {return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed, 'catmullrom', .3), seg, r, radial, closed), m, null, parent);}
// Hose with end fittings: tube plus a short metal sleeve at both ends.
export function hose(points, r, m, parent, fit = null, seg = 64) {
 const o = tube(points, r, m, parent, seg, 10);
 if (fit) for (const [a, b] of [[points[0], points[1]], [points[points.length - 1], points[points.length - 2]]]) {const d = b.clone().sub(a).normalize(), c = cyl(r * 1.35, r * 1.35, r * 5, fit, a.clone().add(d.clone().multiplyScalar(r * 2.2)), parent, 'y', 12); c.quaternion.setFromUnitVectors(V(0, 1, 0), d);}
 return o;
}
// Helix coil (hose ring), axis along +y.
export function coil(R, turns, pitch, r, m, p, parent, axis = 'y') {
 const pts = []; for (let i = 0; i <= turns * 40; i++) {const a = i / 40 * TAU; pts.push(V(R * Math.cos(a), i / 40 * pitch, R * Math.sin(a)));}
 const o = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.ceil(turns * 60), r, 8), m, p, parent);
 if (axis === 'x') o.rotation.z = -Math.PI / 2; if (axis === 'z') o.rotation.x = Math.PI / 2; return o;
}
// Flat strap (lashing strap, tape) along a polyline.
export function strap(points, width, thick, m, parent, up = V(0, 1, 0)) {
 const g = new THREE.Group(); parent.add(g);
 for (let i = 0; i < points.length - 1; i++) {
  const a = points[i], b = points[i + 1], len = a.distanceTo(b); if (len < 1e-4) continue;
  const o = box(width, thick, len + thick, m, a.clone().add(b).multiplyScalar(.5), g);
  const z = b.clone().sub(a).normalize(), x = new THREE.Vector3().crossVectors(up, z); if (x.lengthSq() < 1e-6) x.set(1, 0, 0); x.normalize(); const y = new THREE.Vector3().crossVectors(z, x);
  o.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
 }
 return g;
}
// Hex bolt heads (normal = axis).
export function bolt(r, m, p, parent, axis = 'y') {return cyl(r, r, r * .7, m, p, parent, axis, 6);}
export function label(lines, w, h, p, parent, rot, opts = {}) {const o = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map: labelTexture(lines, {w: Math.round(512 * Math.min(2, w / h / 4 + .5)), h: 128, ...opts}), roughness: .5}), p, parent, rot); o.castShadow = false; o.userData.keep = true; return o;}
// 40 × 40 slotted aluminium system profile, unit length along z.
function profileGeometry() {
 const s = new THREE.Shape(), a = .02, slot = .004, w = .0041;
 s.moveTo(-a, -a);
 s.lineTo(-w, -a); s.lineTo(-w, -a + slot); s.lineTo(w, -a + slot); s.lineTo(w, -a); s.lineTo(a, -a);
 s.lineTo(a, -w); s.lineTo(a - slot, -w); s.lineTo(a - slot, w); s.lineTo(a, w); s.lineTo(a, a);
 s.lineTo(w, a); s.lineTo(w, a - slot); s.lineTo(-w, a - slot); s.lineTo(-w, a); s.lineTo(-a, a);
 s.lineTo(-a, w); s.lineTo(-a + slot, w); s.lineTo(-a + slot, -w); s.lineTo(-a, -w); s.lineTo(-a, -a);
 const g = new THREE.ExtrudeGeometry(s, {depth: 1, bevelEnabled: false}); g.translate(0, 0, -.5); return g;
}
export function profile(len, axis, p, m, parent, size = 1) {
 const o = mesh(cached('prof', profileGeometry), m, p, parent); o.scale.set(size, size, len);
 if (axis === 'x') o.rotation.y = Math.PI / 2; if (axis === 'y') o.rotation.x = Math.PI / 2; return o;
}
// Frame of profiles between the corners of an axis-aligned box. skip: list of edges to leave out ('x0', 'x1', 'z0', 'z1' bottom rails).
export function profileFrame(x0, x1, y0, y1, z0, z1, m, parent, {shelves = [], size = 1, skipBottom = []} = {}) {
 const t = .02 * size;
 for (const x of [x0 + t, x1 - t]) for (const z of [z0 + t, z1 - t]) profile(y1 - y0, 'y', V(x, (y0 + y1) / 2, z), m, parent, size);
 for (const y of [y0 + t, y1 - t, ...shelves]) {
  const bottom = y === y0 + t;
  for (const [z, k] of [[z0 + t, 'z0'], [z1 - t, 'z1']]) if (!(bottom && skipBottom.includes(k))) profile(x1 - x0 - 4 * t, 'x', V((x0 + x1) / 2, y, z), m, parent, size);
  for (const [x, k] of [[x0 + t, 'x0'], [x1 - t, 'x1']]) if (!(bottom && skipBottom.includes(k))) profile(z1 - z0 - 4 * t, 'z', V(x, y, (z0 + z1) / 2), m, parent, size);
 }
 for (const x of [x0 + t, x1 - t]) for (const z of [z0 + t, z1 - t]) {box(.045 * size, .01, .045 * size, m, V(x, y0 + .005, z), parent); box(.045 * size, .004, .045 * size, m, V(x, y1 + .002, z), parent);}
}

// Merge static children per material to keep draw calls low. Subtrees flagged userData.dynamic
// (drawers, doors, anything animated) are merged separately inside themselves.
export function mergeStatic(group) {
 group.updateMatrixWorld(true);
 const inv = new THREE.Matrix4().copy(group.matrixWorld).invert(), buckets = new Map(), remove = [], dyn = [];
 const visit = (o) => {
  for (const c of [...o.children]) {
   if (c.userData.dynamic) {dyn.push(c); continue;}
   if (c.isMesh && !c.userData.keep && !(Array.isArray(c.material) || c.material.transparent) && c.visible) {
    const g = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    g.morphAttributes = {};
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, c.matrixWorld));
    if (c.matrixWorld.determinant() < 0) {const p = g.attributes.position; for (let i = 0; i < p.count; i += 3) {for (const a of Object.values(g.attributes)) {const s = a.itemSize; for (let k = 0; k < s; k++) {const t = a.array[(i + 1) * s + k]; a.array[(i + 1) * s + k] = a.array[(i + 2) * s + k]; a.array[(i + 2) * s + k] = t;}}}}
    const key = c.material.uuid + (c.castShadow ? 's' : 'n'); if (!buckets.has(key)) buckets.set(key, {m: c.material, list: [], shadow: c.castShadow}); buckets.get(key).list.push(g); remove.push(c);
   }
   visit(c);
  }
 };
 visit(group);
 const removeSet = new Set(remove);
 for (const o of remove) {for (const k of [...o.children]) if (!removeSet.has(k)) o.parent?.attach(k); o.parent?.remove(o);}
 // Drop now-empty helper groups (keep those still holding meshes or dynamic parts).
 const prune = (o) => {for (const c of [...o.children]) {prune(c); if (!c.isMesh && !c.userData.dynamic && !c.userData.keep && c.children.length === 0 && c.type === 'Group') o.remove(c);}};
 prune(group);
 for (const {m, list, shadow} of buckets.values()) {const merged = mergeGeometries(list, false); if (!merged) continue; const o = new THREE.Mesh(merged, m); o.castShadow = shadow; o.receiveShadow = true; group.add(o); list.forEach(g => g.dispose());}
 for (const d of dyn) mergeStatic(d);
}
