import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {Sky} from 'three/examples/jsm/objects/Sky.js';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/examples/jsm/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {RectAreaLightUniformsLib} from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {V, makeTextures, makeMaterials, grime, mergeStatic, labelTexture, mesh, tube} from './lib3d.js';
import {builders, makeMould} from './equipment.js';
import {buildBody, BOX, RAMP, smooth} from './body.js';
import {trailer, components, routes, toggleLabels} from './data.js';

// Realistic 3D model of the DSS-Flex rehabilitation trailer (no site, no towing vehicle).
const {L, W, H, F, XR, XF, ZO, TOP, DOOR} = BOX;
// Floor footprints for walking collisions (world x0, x1, z0, z1).
const FOOT = {gen: [1.2, 2.53, -1.06, -.27], elec: [2.2, 2.53, -.3, .48], comp: [1.76, 2.48, .49, 1.06], safety: [1.36, 1.77, .6, 1.06], drawer: [.29, 1.16, -1.06, -.4],
 tankL: [-.98, .32, -1.06, -.45], bench: [-.98, .51, .4, 1.06], pumpset: [-1.66, -1.02, -1.06, -.48], drum: [-2.46, -1.7, -1.06, -.33], mixer: [-2.47, -.97, .34, 1.06]};
// Badge anchors for components spread over the trailer (world x, height above floor, z).
const ANCHOR = {air: [1.75, 1.5, .95], ext: [-.33, -.3, -1.12], pumpset: [-1.34, .35, -.77], hd: [-1.34, .9, -.77], manifold: [-2.22, 1.62, -1.0], vac: [2.12, .3, .6], quick: [-2.36, 1.8, .9],
 hoses: [-1.64, 1.9, .98], paddle: [-1.34, 1.7, .88], bags: [-.33, 1.25, -.75], elec: [2.45, 1.75, .1], legs: [XR + .22, -.3, .6], ramps: [XR + .06, 1.0, .7], awning: [XR - .12, H + .2, 0], access: [.95, 1.0, ZO + .03]};

export function createTrailer(stage, {onSelect, onToggle, onView, logo, logoRatio = .34}) {
 const canvas = stage.querySelector('canvas');
 const renderer = new THREE.WebGLRenderer({canvas, antialias: false, powerPreference: 'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
 renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
 renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .92;
 RectAreaLightUniformsLib.init();
 const scene = new THREE.Scene();
 const persp = new THREE.PerspectiveCamera(36, 1, .03, 200);
 const ortho = new THREE.OrthographicCamera(-4, 4, 3, -3, .1, 60);
 let camera = persp;
 const controls = new OrbitControls(persp, canvas); controls.enableDamping = true; controls.dampingFactor = .08; controls.maxPolarAngle = Math.PI * .495; controls.minDistance = .5; controls.maxDistance = 26; controls.screenSpacePanning = true;

 // ---------- daylight from a physical sky ----------
 const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - 36), THREE.MathUtils.degToRad(125));
 {const sky = new Sky(); sky.scale.setScalar(1000); const u = sky.material.uniforms; u.turbidity.value = 5; u.rayleigh.value = 1.3; u.mieCoefficient.value = .004; u.mieDirectionalG.value = .78; u.sunPosition.value.copy(sunDir);
  const sc = new THREE.Scene(); sc.add(sky); const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(sc, 0, .1, 1000).texture; pm.dispose(); sky.geometry.dispose(); sky.material.dispose();}
 const skyBg = scene.environment;
 const hemi = new THREE.HemisphereLight('#dfe8f2', '#5b564c', .2); scene.add(hemi);
 const sun = new THREE.DirectionalLight('#fff1dc', 2.4); sun.position.copy(sunDir).multiplyScalar(22).add(V(-1, 0, 0)); sun.target.position.set(-1, 0, 0); scene.add(sun.target);
 sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, {left: -8, right: 8, top: 7, bottom: -7, near: 2, far: 50}); sun.shadow.bias = -.0002; sun.shadow.normalBias = .02; sun.shadow.radius = 3; scene.add(sun);
 for (const z of [-.42, .42]) {const l = new THREE.RectAreaLight('#fff5e6', 3.2, L - .5, .12); l.position.set(0, F + H - .04, z); l.rotation.x = -Math.PI / 2; scene.add(l);}
 const fill = new THREE.PointLight('#fff2de', .6, 6, 1.6); fill.position.set(-.4, F + H - .35, 0); scene.add(fill);
 const spots = []; for (const z of [-.85, .85]) {const s = new THREE.SpotLight('#fff4e2', 0, 10, .9, .6, 1.4); s.position.set(XR - .3, TOP + .02, z); s.target.position.set(XR - 2.6, 0, z * .4); scene.add(s, s.target); spots.push(s);}

 // ---------- materials, ground ----------
 const Tx = makeTextures(), M = makeMaterials(Tx);
 for (const k of ['alu', 'aluMatte', 'cabinet', 'euro', 'white', 'plastic', 'boxGrey', 'steelDark', 'plasticDark']) grime(M[k], {bottom: F, top: F + .32, amount: .32});
 const ground = mesh(new THREE.PlaneGeometry(220, 220), M.concrete, null, scene); ground.rotation.x = -Math.PI / 2; ground.castShadow = false; M.concrete.map.repeat.set(55, 55); M.concrete.normalMap.repeat.set(160, 160);
 const bg = {light: new THREE.Color('#e6ebee'), dark: new THREE.Color('#151d24')};
 // light theme: blurred physical sky as background, ground fades into the hazy horizon
 scene.background = skyBg; scene.backgroundBlurriness = .3; scene.backgroundIntensity = .62; scene.fog = new THREE.Fog(bg.light, 26, 100);

 // ---------- toggles ----------
 const toggles = new Map(), pending = [];
 function addToggle(def) {const t = {requires: [], dependents: [], dur: 1, t: 0, target: 0, apply: () => {}, ...def}; toggles.set(def.id, t); if (def.handle) {def.handle.userData.dynamic = true; pending.push([def.handle, def.comp, def.id]);} return t;}
 const pickable = (obj, comp, toggle) => pending.push([obj, comp, toggle]);

 // ---------- trailer body ----------
 let logoTex = null;
 if (logo) {logoTex = new THREE.Texture(logo); logoTex.colorSpace = THREE.SRGBColorSpace; logoTex.anisotropy = 8; logoTex.needsUpdate = true;}
 const body = buildBody(M, {addToggle, pickable, logo: logoTex, logoRatio});
 scene.add(body.root);

 // ---------- equipment ----------
 const byId = new Map(), pickables = [], anchors = new Map(), live = {};
 const sackTex = labelTexture(['VERPRESSMÖRTEL', '25 kg · schwindarm'], {bg: '#e5dfd2', fg: '#8e1c16', w: 512, h: 256, band: '#b52019'});
 const sackMat = new THREE.MeshStandardMaterial({map: sackTex, roughness: .9});
 const sackGeo = (() => {const g = new THREE.BoxGeometry(.6, .11, .4, 8, 2, 6), p = g.attributes.position; for (let i = 0; i < p.count; i++) {const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = (1 - (Math.abs(x) / .3) ** 6) * (1 - (Math.abs(z) / .2) ** 6); p.setY(i, y * (.45 + .55 * k)); p.setZ(i, z * (.93 + .07 * k)); p.setX(i, x * (.97 + .03 * k));} g.computeVertexNormals(); return g;})();
 const sack = (p, rot, parent) => {const o = mesh(sackGeo, [M.sackPaper, M.sackPaper, sackMat, M.sackPaper, M.sackPaper, M.sackPaper], p, parent); o.rotation.y = rot; o.userData.keep = true; return o;};
 const mould = makeMould(M);
 for (const c of components) {
  const b = c.id === 'tankL' || c.id === 'tankR' ? builders.tank : builders[c.id];
  if (!b) continue;
  const g = new THREE.Group(); g.position.set(c.x, F + (c.mount || 0), c.z); scene.add(g);
  const ctx = {
   T: Tx, sack, aisle: c.z < 0 ? 1 : -1, origin: g.position.clone(),
   w: (x, y, z) => V(x - c.x, y - (c.mount || 0), z - c.z),
   mould: (parent, p, dn) => {const m = mould(parent, p, dn); m.userData.dynamic = true; return m;},
   toggle: d => addToggle({comp: c.id, ...d}),
   drawer: (id, grp, dir, dist, o = {}) => {
    grp.userData.dynamic = true; const base = grp.position.clone(), dl = o.delay || 0; for (const e of o.extra || []) pending.push([e, c.id, id]);
    return addToggle({id, comp: c.id, handle: grp, dur: o.dur || .9, apply: t => {o.pre?.(t); grp.position.copy(base).addScaledVector(dir, dist * smooth(Math.min(1, Math.max(0, (t - dl) / (1 - dl)))));}});
   },
  };
  const res = b(g, M, ctx);
  if (c.id === 'tankL') live.waterL = res; if (c.id === 'tankR') live.waterR = res; if (c.id === 'bags') live.sacks = res; if (c.id === 'settle') live.wash = res; if (c.id === 'mixer') live.mixer = res;
  g.updateMatrixWorld(true); mergeStatic(g); byId.set(c.id, g);
 }
 for (const k of ['chassis', 'body', 'awning']) mergeStatic(body.groups[k]);
 for (const r of body.ramps) mergeStatic(r.g);
 // tag meshes with component id and toggle for picking
 const tag = (obj, comp, toggle) => obj.traverse(o => {if (o.isMesh) {if (comp) o.userData.componentId = comp; if (toggle) o.userData.toggle = toggle;}});
 for (const [id, g] of byId) tag(g, id);
 tag(body.root, 'chassis'); tag(body.groups.awning, 'awning'); for (const o of body.ext) tag(o, 'ext');
 for (const [obj, comp, t] of pending) tag(obj, comp, t);
 scene.traverse(o => {if (o.isMesh && o.userData.componentId) pickables.push(o); if (o.isMesh) for (const m of [].concat(o.material)) if (m.isMeshStandardMaterial && m.envMapIntensity === 1) m.envMapIntensity = .55;});
 for (const t of toggles.values()) for (const r of t.requires) toggles.get(r)?.dependents.push(t.id);
 for (const t of toggles.values()) {t.apply(0); t.frame?.(0);}
 const occluders = []; for (const o of [body.walls.left, body.walls.right, body.walls.front, body.walls.roof, body.doors.doorL.hinge, body.doors.doorR.hinge]) o.traverse(m => {if (m.isMesh && !m.material.transparent) occluders.push(m);});
 for (const c of components) {
  if (ANCHOR[c.id]) {const [x, y, z] = ANCHOR[c.id]; anchors.set(c.id, V(x, F + y, z)); continue;}
  const g = byId.get(c.id); if (!g) continue;
  const bb = new THREE.Box3().setFromObject(g); anchors.set(c.id, bb.getCenter(V()).setY(Math.min(bb.max.y + .06, F + H - .06)));
 }

 // ---------- media routes (overlay) ----------
 const routeGroup = new THREE.Group(); routeGroup.visible = false; scene.add(routeGroup);
 const rMat = Object.fromEntries(routes.map(r => [r.kind, new THREE.MeshBasicMaterial({color: r.color})]));
 const route = (kind, pts, r = .016) => {const o = tube(pts.map(p => V(p[0], F + p[1], p[2])), r, rMat[kind], routeGroup, pts.length * 24, 8); o.castShadow = o.receiveShadow = false;};
 route('water', [[-.33, .06, -.48], [-.33, .02, -.2], [-.3, .02, .2], [-.24, .06, .48]], .022);
 route('water', [[-.85, .08, -.46], [-1.0, .06, -.5], [-1.1, .3, -.97], [-1.24, .38, -.9], [-1.34, .38, -.77]]);
 route('water', [[-1.36, .55, -.77], [-1.2, .65, -.6], [-1.2, 1.0, -.7], [-1.3, 1.7, -.6]]);
 route('water', [[-1.4, .6, -.95], [-1.0, 1.9, -1.0], [-.95, 1.97, 0], [-1.1, 1.9, 1.0], [-1.64, 1.45, 1.0]]);
 route('air', [[2.3, 1.56, .66], [1.9, 1.76, .5], [1.74, 1.5, .92], [1.72, 1.85, .97], [1.0, 1.88, 1.03], [-2.42, 1.88, 1.03], [-2.47, 1.97, 0], [-2.42, 1.88, -1.03], [-2.25, 1.7, -1.0], [-2.1, 1.0, -.98], [-2.08, .6, -.98]]);
 route('air', [[2.2, .3, .72], [2.36, 1.0, 1.0], [2.3, 1.93, 1.0], [-2.45, 1.94, .95], [-2.47, 1.99, -.6], [-2.2, 1.75, -1.0]], .011);
 route('mortar', [[-2.4, .16, .7], [-2.7, .2, .7], [-3.1, -.3, .7]], .02);
 route('power', [[2.43, .9, -.4], [2.5, 1.2, -.28], [2.5, 1.95, -.2], [2.5, 2.0, .9], [1.5, 2.0, 1.02], [-2.4, 2.0, 1.02]], .012);
 route('power', [[2.5, 2.0, -.2], [2.5, 2.0, -1.0], [-2.4, 2.0, -1.02]], .012);
 route('power', [[.15, 2.0, 1.02], [.15, 1.25, 1.02]], .009); route('power', [[-1.64, 2.0, 1.02], [-1.64, 1.15, 1.02]], .009); route('power', [[-2.41, 2.0, 1.02], [-2.41, 1.3, 1.02]], .009);
 route('power', [[-1.34, 2.0, -1.02], [-1.3, .8, -1.0]], .009); route('power', [[2.53, .3, .75], [2.45, .3, .6], [2.45, 1.0, .3]], .009);

 // ---------- dimensions ----------
 const dimGroup = new THREE.Group(); dimGroup.visible = false; scene.add(dimGroup);
 const dimMat = new THREE.LineBasicMaterial({color: '#3aa0e8'}), dimLabels = [];
 const dim = (a, b, text, off) => {dimGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), dimMat)); for (const p of [a, b]) dimGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([p.clone().sub(off), p.clone().add(off)]), dimMat)); dimLabels.push({p: a.clone().add(b).multiplyScalar(.5), text});};
 const f2 = n => n.toFixed(2).replace('.', ',');
 dim(V(XR, .02, ZO + .5), V(XF, .02, ZO + .5), `Aufbau ${f2(XF - XR)} m`, V(0, 0, .12));
 dim(V(XR, .02, ZO + .95), V(trailer.couplingX + .06, .02, ZO + .95), `Gesamtlänge ${f2(trailer.couplingX + .06 - XR)} m`, V(0, 0, .12));
 dim(V(XF + .5, .02, -ZO), V(XF + .5, .02, ZO), `Breite ${f2(2 * ZO)} m`, V(.12, 0, 0));
 dim(V(XF + .35, 0, -ZO - .15), V(XF + .35, TOP + .08, -ZO - .15), `Höhe ${f2(TOP + .08)} m`, V(.12, 0, 0));
 dim(V(-L / 2, F + .02, 0), V(L / 2, F + .02, 0), `innen ${f2(L)} × ${f2(W)} × ${f2(H)} m`, V(0, .08, 0));
 dim(V(XR - .1, .02, -1.5), V(XR - .1 - body.awning.P, .02, -1.5), `Markise ${f2(body.awning.P)} m`, V(.12, 0, 0));

 // ---------- overlay: badges, dimension labels, tooltip ----------
 const overlay = stage.querySelector('.overlay');
 const badges = components.map(c => {const b = document.createElement('button'); b.type = 'button'; b.className = 'hot'; b.textContent = c.n; b.title = c.title; b.addEventListener('click', e => {e.stopPropagation(); onSelect?.(c.id, true);}); overlay.appendChild(b); return {b, id: c.id};});
 const dimEls = dimLabels.map(d => {const s = document.createElement('span'); s.className = 'dimlabel'; s.textContent = d.text; overlay.appendChild(s); return {s, p: d.p};});
 const tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true; overlay.appendChild(tip);

 // ---------- selection outline & focus ----------
 const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({color: '#e8424c', transparent: true, depthTest: false}));
 outline.renderOrder = 20; outline.visible = false; scene.add(outline);
 let selected = null;
 const state = {view: 'cut', roof: false, wall: false, numbers: true, routes: false, dims: false};
 function boundsOf(id) {
  const obj = id === 'chassis' ? body.groups.chassis : id === 'awning' ? body.groups.awning : byId.get(id);
  if (obj) return new THREE.Box3().setFromObject(obj);
  const a = anchors.get(id); return a ? new THREE.Box3().setFromCenterAndSize(a, V(.5, .5, .5)) : null;
 }
 function select(id, focus = false) {
  selected = id || null; const bb = selected && boundsOf(selected); outline.visible = !!bb; if (!bb) return;
  const s = bb.getSize(V()), c = bb.getCenter(V()); outline.position.copy(c); outline.scale.set(s.x + .04, s.y + .04, s.z + .04);
  if (focus && !walker.on) focusOn(id, c, s);
 }
 // Close-up camera per component: [camera x, y above floor, z] -> [target x, y above floor, z] (world, from the aisle).
 const CAM = {
  gen: [[.2, 1.55, .25], [1.86, .5, -.5]], elec: [[.5, 1.7, -.2], [2.5, 1.2, .1]], comp: [[.3, 1.8, -.25], [2.12, 1.1, .75]], vac: [[.8, 1.1, .05], [2.12, .22, .72]],
  air: [[.35, 1.7, -.1], [1.75, 1.4, .95]], drawer: [[-.75, 1.6, .28], [.72, .25, -.65]], saddle: [[-.7, 1.7, .25], [.72, 1.0, -.8]], bladders: [[.9, 1.2, .25], [-.33, 1.72, -.66]],
  hoses: [[-.1, 1.6, -.3], [-1.66, 1.45, .95]], drum: [[-.55, 1.7, .25], [-2.08, .55, -.66]], manifold: [[-.9, 1.55, .15], [-2.22, 1.5, -.95]],
  tankL: [[1.05, 1.35, .25], [-.33, .3, -.75]], tankR: [[1.2, 1.0, -.2], [-.235, .28, .75]], pumpset: [[-2.3, 1.15, .12], [-1.34, .3, -.77]], hd: [[-.3, 1.5, .2], [-1.34, .8, -.77]],
  reel: [[-.1, 1.15, .25], [-1.34, 1.72, -.66]], mixer: [[-.3, 1.5, -.2], [-1.84, .45, .7]], paddle: [[-.3, 1.45, -.25], [-1.34, 1.35, .9]], bags: [[1.0, 1.7, .25], [-.33, .95, -.75]],
  settle: [[-.2, 1.2, -.05], [-1.2, .3, .7]], bench: [[1.3, 1.8, -.25], [-.235, .9, .75]], quick: [[-.75, 1.55, -.15], [-2.36, 1.4, .9]], safety: [[.1, 1.5, -.15], [1.58, .8, .86]],
 };
 function focusOn(id, c, s) {
  if (camera !== persp) {camera = persp; controls.object = persp; controls.enableRotate = true;}
  if (id === 'chassis') {flyTo(V(5.2, 2.6, 6.2), V(.2, .6, 0)); return;}
  const a = anchors.get(id) || c, inside = Math.abs(a.x) < L / 2 && Math.abs(a.z) < W / 2 + .05 && a.y > F - .05;
  if (!inside || !CAM[id]) {const d = Math.max(3.4, s.length() * 1.6); flyTo(a.clone().add(V(-.55 * d, .4 * d, .75 * d * (a.z < -.1 ? -1 : 1))), a); return;}
  state.view = 'cut'; state.roof = false; state.wall = false; apply(); onView?.('cut');
  if (id === 'gen' && toggles.get('genDoor').target === 0) toggle('genDoor', true);
  const [[px, py, pz], [tx, ty, tz]] = CAM[id];
  flyTo(V(px, F + py, pz), V(tx, F + ty, tz), 950, 56);
 }

 // ---------- options / views ----------
 function apply() {body.walls.roof.visible = state.roof; body.walls.right.visible = state.wall; routeGroup.visible = state.routes; dimGroup.visible = state.dims;}
 const views = {
  cut: {pos: [2.6, 5.6, 7.4], target: [-.25, 1.05, -.1], roof: false, wall: false},
  exterior: {pos: [6.4, 3.0, 6.9], target: [.2, 1.25, 0], roof: true, wall: true, states: {}},
  work: {pos: [-9.6, 3.6, 5.6], target: [-2.9, 1.1, .2], roof: true, wall: true, states: {doorL: 1, doorR: 1, side: 1, awning: 1, legs: 1, mixer: 1, genFlap: 1}},
  plan: {roof: false, wall: true},
 };
 let fly = null;
 function flyTo(pos, target, dur = 950, fov = 36) {fly = {from: {p: persp.position.clone(), t: controls.target.clone(), f: persp.fov}, to: {p: pos, t: target, f: fov}, t0: performance.now(), dur};}
 function viewPose(v) {const t = V(...v.target), f = Math.min(2.6, Math.max(1, 1.12 / Math.max(.2, persp.aspect))); return [t.clone().add(V(...v.pos).sub(t).multiplyScalar(f)), t];}
 function setStates(st) {for (const [id, tg] of toggles) {if (id === 'ramps' && !st.ramps) {if (!st.mixer) tg.target = 0; continue;} tg.target = st[id] ? 1 : 0;} onToggle?.();}
 function setView(name) {
  exitWalk(); state.view = name; const v = views[name];
  if (name === 'plan') {camera = ortho; controls.object = ortho; controls.enableRotate = false; ortho.position.set(-.4, 25, .0001); controls.target.set(-.4, 0, 0); ortho.zoom = 1; fitOrtho(); controls.update(); state.roof = false; state.wall = true;}
  else {camera = persp; controls.object = persp; controls.enableRotate = true; if (v) {state.roof = v.roof; state.wall = v.wall; if (v.states) setStates(v.states); const [p, t] = viewPose(v); flyTo(p, t);}}
  apply(); return {...state};
 }
 function setOption(key, value) {state[key] = value; apply(); return {...state};}
 function fitOrtho() {const r = stage.clientWidth / Math.max(1, stage.clientHeight), h = 3.9; ortho.left = -h * r; ortho.right = h * r; ortho.top = h; ortho.bottom = -h; ortho.updateProjectionMatrix();}

 // ---------- load (water, sacks, waste water) ----------
 function setLoad({water = 300, bags = 10, wash = 0}) {
  const per = water / 2;
  for (const m of [live.waterL, live.waterR]) {if (!m) continue; const h = Math.max(.001, m.userData.h * per / 300); m.scale.y = h; m.position.y = m.userData.base + h / 2; m.visible = per > 1;}
  const s = live.waterR?.userData.sight; if (s) {const h = .4 * water / 600; s.scale.y = Math.max(.001, h); s.position.y = h / 2; s.visible = water > 1;}
  (live.sacks || []).forEach((o, i) => o.visible = i < bags);
  if (live.wash) {const h = Math.max(.001, live.wash.userData.h * wash / 80); live.wash.scale.y = h; live.wash.position.y = live.wash.userData.base + h / 2; live.wash.visible = wash > 1;}
 }

 // ---------- walking ----------
 const walker = {on: false, x: .95, z: 3.3, yaw: 0, pitch: -.12, eye: 1.62, y: 1.62, keys: new Set(), stick: {x: 0, y: 0}};
 const T = id => toggles.get(id)?.t ?? 0;
 function floorAt(x, z) {
  if (Math.abs(x) < L / 2 + .02 && Math.abs(z) < W / 2 + .02) return F;
  if (T('side') > .95 && x > DOOR.x0 - .05 && x < DOOR.x1 + .05 && z > W / 2 && z < ZO + .6) return z < ZO + .05 ? F : z < ZO + .28 ? .44 : .18;
  if (x < XR + .02 && x > XR - .3 && z > -.36 && z < .16) return .47;
  if (T('ramps') > .99 && x < XR && x > XR - RAMP.run) for (const rz of RAMP.z) if (Math.abs(z - rz) < .15) return F * (1 - (XR - x) / RAMP.run);
  return 0;
 }
 function blocked(x, z) {
  const r = .2, inBox = x > XR - .05 && x < XF + .05 && Math.abs(z) < ZO + .05;
  if (inBox) {
   const throughSide = z > 0 && x > DOOR.x0 + .12 && x < DOOR.x1 - .12 && T('side') > .9;
   const throughRear = x < -L / 2 + r && ((z < 0 && T('doorL') > .9) || (z > 0 && T('doorR') > .9)) && Math.abs(z) < W / 2 - .05;
   if (Math.abs(z) > W / 2 - r && !throughSide) return true;
   if (x > L / 2 - r) return true;
   if (x < -L / 2 + r && !throughRear) return true;
   for (const [id, [x0, x1, z0, z1]] of Object.entries(FOOT)) {let a = z0, b = z1; if (id === 'drawer') b += .5 * T('drawer'); if (id === 'bench' && ['bench-1', 'bench-2', 'bench-3'].some(k => T(k) > .1)) a -= .4; if (x > x0 - r && x < x1 + r && z > a - r && z < b + r) return true;}
   return false;
  }
  if (x > XF && x < trailer.couplingX + .15 && Math.abs(z) < .8) return true;
  if (x > XR - .3 && x < XF + .3 && Math.abs(z) < ZO + .3 && !(z > ZO && x > DOOR.x0 + .1 && x < DOOR.x1 - .1 && T('side') > .9) && !(x < XR && Math.abs(z) < W / 2)) return true;
  const mx = live.mixer?.worldX?.(); if (mx !== undefined && T('mixer') > .3 && Math.abs(x - mx) < .6 && Math.abs(z - .7) < .5) return true;
  if (T('awning') > .95) for (const s of [-1, 1]) {const lx = XR - .18 - body.awning.P, lz = s * (body.awning.AW / 2 - .12); if (Math.hypot(x - lx, z - lz) < .25) return true;}
  return false;
 }
 function enterWalk() {
  state.view = 'walk'; state.roof = true; state.wall = true; apply(); toggles.get('side').target = 1; onToggle?.();
  camera = persp; controls.object = persp; controls.enabled = false; Object.assign(walker, {on: true, x: .95, z: 3.3, yaw: 0, pitch: -.12, y: walker.eye}); persp.fov = 68; persp.updateProjectionMatrix();
  stage.classList.add('walking');
 }
 function exitWalk() {if (!walker.on) return; walker.on = false; controls.enabled = true; persp.fov = 36; persp.updateProjectionMatrix(); stage.classList.remove('walking');}
 let look = null;
 canvas.addEventListener('pointerdown', e => {if (walker.on) {look = {x: e.clientX, y: e.clientY, id: e.pointerId}; canvas.setPointerCapture(e.pointerId);}});
 canvas.addEventListener('pointermove', e => {if (!look || e.pointerId !== look.id) return; walker.yaw -= (e.clientX - look.x) * .004; walker.pitch = Math.max(-1.2, Math.min(1.1, walker.pitch - (e.clientY - look.y) * .004)); look.x = e.clientX; look.y = e.clientY;});
 canvas.addEventListener('pointerup', () => look = null);
 addEventListener('keydown', e => {if (!walker.on) return; if (e.key === 'Escape') {setView('cut'); onView?.('cut'); return;} walker.keys.add(e.key.toLowerCase()); if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) e.preventDefault();});
 addEventListener('keyup', e => walker.keys.delete(e.key.toLowerCase()));
 function stepWalk(dt) {
  const k = walker.keys, f = (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0) - walker.stick.y, s = (k.has('d') ? 1 : 0) - (k.has('a') ? 1 : 0) + walker.stick.x;
  walker.yaw += ((k.has('q') || k.has('arrowleft') ? 1 : 0) - (k.has('e') || k.has('arrowright') ? 1 : 0)) * dt * 1.6;
  const speed = 1.3 * dt, fx = -Math.sin(walker.yaw), fz = -Math.cos(walker.yaw), rx = -fz, rz = fx;
  const nx = walker.x + (fx * f + rx * s) * speed, nz = walker.z + (fz * f + rz * s) * speed;
  if (!blocked(nx, walker.z)) walker.x = nx; if (!blocked(walker.x, nz)) walker.z = nz;
  walker.y += (floorAt(walker.x, walker.z) + walker.eye - walker.y) * Math.min(1, dt * 7);
  persp.position.set(walker.x, walker.y, walker.z); persp.rotation.set(walker.pitch, walker.yaw, 0, 'YXZ');
 }

 // ---------- picking, hover, toggles ----------
 const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
 const visible = o => {for (let p = o; p; p = p.parent) if (!p.visible) return false; return true;};
 function pick(cx, cy) {const r = canvas.getBoundingClientRect(); ptr.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1); ray.setFromCamera(ptr, camera); for (const h of ray.intersectObjects(pickables, false)) if (visible(h.object)) return h.object; return null;}
 let down = null;
 canvas.addEventListener('pointerdown', e => down = [e.clientX, e.clientY]);
 canvas.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
  const o = pick(e.clientX, e.clientY);
  if (o?.userData.toggle) toggle(o.userData.toggle);
  onSelect?.(o ? o.userData.componentId : null, false);
 });
 let hoverReq = null;
 canvas.addEventListener('pointermove', e => {hoverReq = [e.clientX, e.clientY];});
 canvas.addEventListener('pointerleave', () => {hoverReq = null; tip.hidden = true; canvas.style.cursor = '';});
 function hover() {
  if (!hoverReq || look || fly) return; const [x, y] = hoverReq; hoverReq = null;
  const o = pick(x, y), r = canvas.getBoundingClientRect();
  if (!o) {tip.hidden = true; canvas.style.cursor = walker.on ? 'grab' : ''; return;}
  const tg = o.userData.toggle && toggles.get(o.userData.toggle), comp = components.find(c => c.id === o.userData.componentId);
  tip.textContent = tg ? `${toggleLabels[tg.id] || tg.id} · ${tg.target ? 'schließen' : 'öffnen'}` : comp ? `${comp.n} ${comp.title}` : 'Tandem-Kofferanhänger';
  tip.classList.toggle('act', !!tg); tip.hidden = false; tip.style.transform = `translate(${x - r.left + 14}px, ${y - r.top + 16}px)`; canvas.style.cursor = 'pointer';
 }
 function toggle(id, on) {const t = toggles.get(id); if (!t) return; t.target = on === undefined ? 1 - t.target : on ? 1 : 0; onToggle?.();}
 function stepToggles(dt) {
  for (const t of toggles.values()) {
   if (t.t !== t.target) {
    const up = t.target > t.t, wait = up ? t.requires.filter(r => toggles.get(r).t < 1) : t.dependents.filter(d => toggles.get(d).t > 0);
    if (wait.length) {let changed = false; for (const w of wait) {const o = toggles.get(w), want = up ? 1 : 0; if (o.target !== want) {o.target = want; changed = true;}} if (changed) onToggle?.();}
    else {t.t = Math.min(1, Math.max(0, t.t + (up ? 1 : -1) * dt / t.dur)); t.apply(t.t); if (t.t === t.target) onToggle?.();}
   }
   t.frame?.(t.t);
  }
 }

 // ---------- post-processing ----------
 const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, {type: THREE.HalfFloatType, samples: 4}));
 const renderPass = new RenderPass(scene, camera); composer.addPass(renderPass);
 const gtao = new GTAOPass(scene, camera, 1, 1); gtao.blendIntensity = .9; gtao.updateGtaoMaterial({radius: .3, distanceExponent: 1.5, thickness: .5, scale: 1.0, samples: 16}); gtao.updatePdMaterial({lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 5, rings: 2, samples: 16}); composer.addPass(gtao);
 composer.addPass(new OutputPass());
 let quality = true; const autoQ = {n: 0, sum: 0};
 function resize() {const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); persp.aspect = w / h; persp.updateProjectionMatrix(); fitOrtho();}
 new ResizeObserver(resize).observe(stage); resize();

 // ---------- loop ----------
 const tmp = V(), occRay = new THREE.Raycaster(); let last = performance.now(), tick = 0;
 function project(p) {tmp.copy(p).project(camera); return {x: (tmp.x * .5 + .5) * stage.clientWidth, y: (-tmp.y * .5 + .5) * stage.clientHeight, ok: tmp.z < 1 && Math.abs(tmp.x) < 1.02 && Math.abs(tmp.y) < 1.02};}
 function hidden(p) {const d = p.clone().sub(camera.position), len = d.length(); occRay.set(camera.position, d.normalize()); occRay.far = len - .05; for (const h of occRay.intersectObjects(occluders, false)) if (visible(h.object)) return true; return false;}
 let running = true, film = false, filmCam = null, filmNow = 0;
 // One simulation + render step (used by the live loop and by the film renderer with a fixed dt).
 function step(dt, now) {
  if (!film && quality && autoQ.n < 150) {autoQ.n++; if (autoQ.n > 40) autoQ.sum += dt; if (autoQ.n === 150 && autoQ.sum / 110 > 1 / 24) {quality = false; renderer.setPixelRatio(1); resize();}}
  if (fly && !film) {const u = Math.min(1, (now - fly.t0) / fly.dur), e = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; persp.position.lerpVectors(fly.from.p, fly.to.p, e); controls.target.lerpVectors(fly.from.t, fly.to.t, e); persp.fov = fly.from.f + (fly.to.f - fly.from.f) * e; persp.updateProjectionMatrix(); if (u >= 1) fly = null;}
  stepToggles(dt);
  const lightsOn = T('awning') > .5 || T('doorL') > .5 || T('doorR') > .5; for (const l of body.workLights) l.material = lightsOn ? M.ledOn : M.ledOff; for (const s of spots) s.intensity = lightsOn ? 9 : 0;
  if (film && filmCam) {camera = persp; persp.position.set(...filmCam.p); persp.up.set(0, 1, 0); persp.lookAt(V(...filmCam.t)); if (persp.fov !== filmCam.fov) {persp.fov = filmCam.fov; persp.updateProjectionMatrix();}}
  else if (walker.on) stepWalk(dt); else controls.update();
  if (!film) hover();
  renderPass.camera = camera; gtao.camera = camera; gtao.enabled = quality && camera === persp;
  if (selected && !film) {outline.material.opacity = .5 + .4 * Math.sin(now / 240); if (tick % 6 === 0 && ['mixer', 'awning', 'ramps', 'drawer', 'bench', 'comp', 'legs', 'access'].includes(selected)) select(selected);}
  composer.render();
  const nums = state.numbers && !walker.on && !film, occl = tick++ % 4 === 0;
  if (live.mixer) anchors.get('mixer')?.set(live.mixer.worldX(), F + live.mixer.pump.position.y + 1.0, .7);
  for (const h of badges) {const a = anchors.get(h.id); if (!a) {h.b.hidden = true; continue;} const p = project(a); if (occl) h.occ = nums && p.ok && camera === persp && hidden(a); const on = nums && p.ok && !h.occ; h.b.hidden = !on; if (on) h.b.style.transform = `translate(${p.x}px,${p.y}px) translate(-50%,-50%)`; h.b.classList.toggle('on', h.id === selected);}
  for (const d of dimEls) {const p = project(d.p), on = state.dims && p.ok && !walker.on && !film; d.s.hidden = !on; if (on) d.s.style.transform = `translate(${p.x}px,${p.y}px) translate(-50%,-120%)`;}
 }
 function frame(now) {
  if (!running || film) {requestAnimationFrame(frame); last = now; return;}
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  step(dt, now);
  requestAnimationFrame(frame);
 }
 apply(); {const [p, t] = viewPose(views.cut); persp.position.copy(p); controls.target.copy(t);} controls.update();
 requestAnimationFrame(frame);

 // Replace the placeholder moulds in the pull-out with the real DSS-Flex models (mm, x = long axis).
 function setMoulds(models) {
  const holders = []; scene.traverse(o => {if (o.userData.mould && models[o.userData.mould]) holders.push(o);});
  for (const o of holders) {
   o.clear(); const m = models[o.userData.mould].clone(true); m.scale.setScalar(.001); m.rotation.y = Math.PI / 2; o.add(m);
   o.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(o.matrixWorld).invert(), bb = new THREE.Box3().setFromObject(m).applyMatrix4(inv), c = bb.getCenter(V());
   m.position.set(-c.x, -bb.min.y, -c.z); o.updateMatrixWorld(true); mergeStatic(o);
   o.traverse(k => {if (k.isMesh) {k.castShadow = k.receiveShadow = true; k.userData.componentId = 'drawer'; k.userData.toggle = 'drawer'; pickables.push(k);}});
  }
 }

 return {
  setView, setOption, select, setLoad, enterWalk, exitWalk, toggle, setStates, setMoulds,
  get state() {return {...state};},
  get camera() {return {p: persp.position.toArray().map(v => +v.toFixed(3)), t: controls.target.toArray().map(v => +v.toFixed(3))};},
  get toggles() {return Object.fromEntries([...toggles].map(([id, t]) => [id, t.target]));},
  setPaused: p => {running = !p;},
  // Film rendering: deterministic frames with a scripted camera (no UI, no hover, no badges).
  filmStart: () => {film = true; exitWalk(); selected = null; outline.visible = false; tip.hidden = true; quality = true; renderer.setPixelRatio(1); resize(); state.numbers = false;},
  filmFrame: (dt, cam) => {filmCam = cam; filmNow += dt * 1000; step(dt, filmNow);},
  setStick: (x, y) => {walker.stick.x = x; walker.stick.y = y;},
  turn: a => {walker.yaw += a;}, resetWalk: () => Object.assign(walker, {x: .95, z: 3.3, yaw: 0, pitch: -.12}),
  setTheme: dark => {scene.background = dark ? bg.dark : skyBg; scene.fog.color.copy(dark ? bg.dark : bg.light); hemi.intensity = dark ? .12 : .2;},
 };
}
