/* =====================================================================
   3D – Geometrie, Baugruppen, Explosion, Interaktion
   ===================================================================== */
(function(){
'use strict';
const NULLEL={addEventListener(){},appendChild(){},classList:{toggle(){},remove(){},add(){},contains(){return false;}},style:{},checked:false,textContent:'',innerHTML:'',hidden:true,value:0,dataset:{}};
function $s(id){ return document.getElementById(id)||NULLEL; }
if (!window.THREE) { document.getElementById('loading').textContent = '3D-Bibliothek konnte nicht geladen werden.'; return; }

/* ---------- Materialien ---------- */
const MAT = {
  steel:  new THREE.MeshStandardMaterial({color:0x9AA3AB, metalness:0.55, roughness:0.42}),
  steel2: new THREE.MeshStandardMaterial({color:0x7A838B, metalness:0.6, roughness:0.4}),
  alu:    new THREE.MeshStandardMaterial({color:0xC0C6CB, metalness:0.5, roughness:0.35}),
  rubber: new THREE.MeshStandardMaterial({color:0x1E2124, metalness:0.0, roughness:0.92}),
  rubber2:new THREE.MeshStandardMaterial({color:0x2B2F33, metalness:0.0, roughness:0.85}),
  motor:  new THREE.MeshStandardMaterial({color:0x2A2D31, metalness:0.4, roughness:0.5}),
  screw:  new THREE.MeshStandardMaterial({color:0x6F767D, metalness:0.75, roughness:0.32}),
  shield: new THREE.MeshStandardMaterial({color:0xC9C24F, metalness:0.15, roughness:0.5, transparent:true, opacity:0.5, side:THREE.DoubleSide, depthWrite:false}),
  blase:  new THREE.MeshStandardMaterial({color:0x1A1D20, metalness:0.05, roughness:0.9, side:THREE.DoubleSide}),
  traeger:new THREE.MeshStandardMaterial({color:0x8E979F, metalness:0.55, roughness:0.45, side:THREE.DoubleSide}),
  pipe:   new THREE.MeshStandardMaterial({color:0x8A9AA8, metalness:0.05, roughness:0.8, transparent:true, opacity:0.18, side:THREE.BackSide, depthWrite:false}),
  pipeOut:new THREE.MeshStandardMaterial({color:0x6E7E8C, metalness:0.05, roughness:0.8, transparent:true, opacity:0.10, side:THREE.FrontSide, depthWrite:false}),
  mortar: new THREE.MeshStandardMaterial({color:0xC7811A, metalness:0.0, roughness:0.9, transparent:true, opacity:0.85}),
  injBlase:new THREE.MeshStandardMaterial({color:0x2A2E32, metalness:0.05, roughness:0.85}),
};
const HIGHLIGHT = new THREE.Color(0xE8392E);

/* ---------- Geometrie-Helfer ---------- */
function box(w,h,d,mat){ return new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat); }
function cyl(r,h,mat,seg,rTop){ return new THREE.Mesh(new THREE.CylinderGeometry(rTop==null?r:rTop, r, h, seg||28), mat); }
function cylZ(r,h,mat,seg){ const m=cyl(r,h,mat,seg); m.rotation.x=Math.PI/2; return m; }
function cylX(r,h,mat,seg){ const m=cyl(r,h,mat,seg); m.rotation.z=Math.PI/2; return m; }
function at(m,x,y,z){ m.position.set(x,y,z); return m; }
function grp(){ return new THREE.Group(); }

/* Zylinderkopfschraube DIN 912: Kopf oben (y=0), Schaft nach -y */
function screwDIN912(d,len){
  const g=grp();
  const head=cyl(d*0.75, d, MAT.screw, 20); head.position.y=-d/2; g.add(head);
  const sock=cyl(d*0.33, d*0.35, MAT.rubber2, 6); sock.position.y=-d*0.15; g.add(sock);
  const shaft=cyl(d/2, len, MAT.screw, 14); shaft.position.y=-d-len/2; g.add(shaft);
  return g;
}
/* Senkschraube DIN 7991 */
function screwSenk(d,len){
  const g=grp();
  const head=new THREE.Mesh(new THREE.CylinderGeometry(d, d/2, d/2, 20), MAT.screw); head.position.y=-d/4; g.add(head);
  const shaft=cyl(d/2, len, MAT.screw, 14); shaft.position.y=-d/2-len/2; g.add(shaft);
  return g;
}
function nut(d){ return cyl(d*0.9, d*0.8, MAT.screw, 6); }
function washer(d){ return cyl(d, 1, MAT.screw, 20); }
function pin(d,len){ return cyl(d/2,len,MAT.alu,16); }

/* Rad DN70, Achse in X */
function wheel(){
  const g=grp();
  g.add(cylX(35, 12, MAT.rubber, 48));
  g.add(cylX(30, 12.6, MAT.rubber2, 48));
  g.add(cylX(4.5, 13.2, MAT.alu, 12));
  return g;
}
/* Bumper – Luftbalg (Lathe) */
function bumper(r,h){
  const g=grp();
  const pts=[]; const n=40; const rc=0.24*h;
  for(let i=0;i<=n;i++){ const t=i/n; const y=t*h; let w=1;
    if(y<rc) w=0.76+0.24*Math.sqrt(Math.max(0,1-Math.pow((rc-y)/rc,2)));
    else if(y>h-rc) w=0.76+0.24*Math.sqrt(Math.max(0,1-Math.pow((y-(h-rc))/rc,2)));
    pts.push(new THREE.Vector2(r*w,y)); }
  pts.unshift(new THREE.Vector2(0,0)); pts.push(new THREE.Vector2(0,h));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts,64), MAT.rubber));
  const groove=new THREE.Mesh(new THREE.TorusGeometry(r*1.0,1.6,8,64), MAT.rubber2); groove.rotation.x=Math.PI/2; groove.position.y=h*0.66; g.add(groove);
  const lipT=cyl(r*0.9,3,MAT.rubber2,64); lipT.position.y=h+1.5; g.add(lipT);
  const lipB=cyl(r*0.9,3,MAT.rubber2,64); lipB.position.y=-1.5; g.add(lipB);
  const plT=cyl(r*0.62,2,MAT.steel2,48); plT.position.y=h+4; g.add(plT);
  const plB=cyl(r*0.62,2,MAT.steel2,48); plB.position.y=-4; g.add(plB);
  [[0,0,7],[-16,0,3],[16,0,3]].forEach(o=>{ const hT=cyl(o[2],3,MAT.rubber2,16); hT.position.set(o[0],h+4.5,o[1]); g.add(hT); const hB=cyl(o[2],3,MAT.rubber2,16); hB.position.set(o[0],-4.5,o[1]); g.add(hB); });
  return g;
}
/* Feder (Helix) */
function spring(r,len,turns){
  const pts=[]; const n=turns*16;
  for(let i=0;i<=n;i++){ const a=i/16*Math.PI*2; pts.push(new THREE.Vector3(Math.cos(a)*r, Math.sin(a)*r, (i/n)*len)); }
  const curve=new THREE.CatmullRomCurve3(pts);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, n*2, 1.4, 6, false), MAT.screw);
}
/* Gebogenes Rohr entlang Punkten */
function tubeAlong(points, r){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],p[1],p[2])), false, 'catmullrom', 0.2);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 48, r, 18, false), MAT.steel);
}
/* Gebogene Schiene (Kreisringsektor, extrudiert in Z) */
function arcRail(rIn,rOut,halfDeg,depth,mat){
  const a=THREE.MathUtils.degToRad(halfDeg);
  const s=new THREE.Shape();
  s.absarc(0,0,rOut, Math.PI/2-a, Math.PI/2+a, false);
  s.absarc(0,0,rIn, Math.PI/2+a, Math.PI/2-a, true);
  const geo=new THREE.ExtrudeGeometry(s,{depth:depth, bevelEnabled:false, curveSegments:24});
  geo.translate(0,0,-depth/2);
  return new THREE.Mesh(geo,mat);
}

/* Zylinderschale mit ovaler Öffnung und gerundeten Ecken (dick, mit Rand).
   R = Außenradius, t = Dicke, len = Länge (Z), arcDeg = Umfangswinkel, hole=[a(quer),b(längs)] Halbachsen */
function shell(R,t,len,arcDeg,hole,mat,corner,hz){
  corner = corner==null?45:corner; hz = hz||0;
  const half=THREE.MathUtils.degToRad(arcDeg/2);
  const W=half*R, L=len/2;
  const nu=Math.max(48, Math.round(W/6)), nv=Math.max(40, Math.round(L/6));
  const a=hole?hole[0]:0, b=hole?hole[1]:0;
  const S=[], Z=[], flagHole=[], flagCorner=[];
  for(let j=0;j<=nv;j++){
    for(let i=0;i<=nu;i++){
      let s=-W+2*W*i/nu, z=-L+2*L*j/nv;
      let fh=false, fc=0;
      const zh=z-hz;
      if (hole && (s*s)/(a*a)+(zh*zh)/(b*b) < 1){ fh=true; const k=1/Math.sqrt((s*s)/(a*a)+(zh*zh)/(b*b)); if(isFinite(k)){ s*=k; z=hz+zh*k; } else { s=a; } }
      const cs=Math.sign(s)||1, cz=Math.sign(z)||1;
      const cx=cs*(W-corner), cz0=cz*(L-corner);
      if (Math.abs(s)>W-corner && Math.abs(z)>L-corner){
        const dx=s-cx, dz=z-cz0, d=Math.hypot(dx,dz);
        if (d>corner){ fc=cs*10+cz; s=cx+dx/d*corner; z=cz0+dz/d*corner; }
      }
      S.push(s); Z.push(z); flagHole.push(fh); flagCorner.push(fc);
    }
  }
  const idx=[];
  const id=(i,j)=>j*(nu+1)+i;
  for(let j=0;j<nv;j++) for(let i=0;i<nu;i++){
    const A=id(i,j),B=id(i+1,j),C=id(i+1,j+1),D=id(i,j+1);
    const tri=(p,q,r)=>{
      if (flagHole[p]&&flagHole[q]&&flagHole[r]) return;
      if (flagCorner[p]&&flagCorner[p]===flagCorner[q]&&flagCorner[q]===flagCorner[r]) return;
      idx.push(p,q,r);
    };
    tri(A,D,C); tri(A,C,B);
  }
  const mk=(r,flip)=>{
    const pos=new Float32Array(S.length*3);
    for(let k=0;k<S.length;k++){ const th=S[k]/R; pos[k*3]=r*Math.sin(th); pos[k*3+1]=r*Math.cos(th); pos[k*3+2]=Z[k]; }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos,3));
    g.setIndex(flip? idx.slice().reverse() : idx.slice());
    g.computeVertexNormals();
    return g;
  };
  const outer=mk(R,false), inner=mk(R-t,true);
  // Rand: Kanten, die nur in einem Dreieck vorkommen
  const cnt=new Map();
  for(let k=0;k<idx.length;k+=3){ const tr=[idx[k],idx[k+1],idx[k+2]]; for(let e=0;e<3;e++){ const p=tr[e],q=tr[(e+1)%3]; const key=p<q?p+'_'+q:q+'_'+p; cnt.set(key,(cnt.get(key)||0)+1); } }
  const rim=[]; const po=outer.attributes.position.array, pi=inner.attributes.position.array;
  for(let k=0;k<idx.length;k+=3){ const tr=[idx[k],idx[k+1],idx[k+2]]; for(let e=0;e<3;e++){ const p=tr[e],q=tr[(e+1)%3]; const key=p<q?p+'_'+q:q+'_'+p; if(cnt.get(key)===1){
    rim.push(po[p*3],po[p*3+1],po[p*3+2], pi[p*3],pi[p*3+1],pi[p*3+2], pi[q*3],pi[q*3+1],pi[q*3+2]);
    rim.push(po[p*3],po[p*3+1],po[p*3+2], pi[q*3],pi[q*3+1],pi[q*3+2], po[q*3],po[q*3+1],po[q*3+2]);
  } } }
  const rg=new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(rim),3)); rg.computeVertexNormals();
  const g=grp(); g.add(new THREE.Mesh(outer,mat)); g.add(new THREE.Mesh(inner,mat)); g.add(new THREE.Mesh(rg,mat));
  return g;
}

/* ---------- Szene ---------- */
const canvas=document.getElementById('c');
const viewerEl=document.getElementById('viewer');
const renderer=new THREE.WebGLRenderer({canvas, antialias:true, alpha:false, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
renderer.outputEncoding=THREE.sRGBEncoding; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(38, 1, 5, 20000);
const controls=new THREE.OrbitControls(camera, canvas);
controls.enableDamping=true; controls.dampingFactor=0.14; controls.rotateSpeed=0.8; controls.zoomSpeed=0.9; controls.screenSpacePanning=true; controls.maxDistance=8000; controls.minDistance=120;
scene.add(new THREE.HemisphereLight(0xffffff, 0x4a5560, 0.55));
const key=new THREE.DirectionalLight(0xffffff, 0.75); key.position.set(500,900,600); scene.add(key);
const fill=new THREE.DirectionalLight(0xdfe8ff, 0.28); fill.position.set(-600,300,-400); scene.add(fill);
const rim=new THREE.DirectionalLight(0xffffff, 0.18); rim.position.set(0,-400,-800); scene.add(rim);
let grid=null;

function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function applyTheme(){
  scene.background=new THREE.Color(cssVar('--scene'));
  if(grid){ scene.remove(grid); grid.geometry.dispose(); }
  grid=new THREE.GridHelper(3000, 30, new THREE.Color(cssVar('--grid')), new THREE.Color(cssVar('--grid2')));
  grid.position.y=state.gridY; grid.material.transparent=true; grid.material.opacity=0.7;
  scene.add(grid);
}

/* ---------- Zustand ---------- */
const state={ dn:'DN300', bg:'gesamt', explode:0, parts:[], byKey:{}, bgGroups:{}, root:null, gridY:-200,
  selected:null, isolate:null, stepMode:false, stepIdx:0, ghost:true, transp:true, labels:true, autoRot:false, pipe:false, steps:null, bom:null, hoverKey:null };

/* Teil registrieren: obj = Group/Mesh; home = Position; expl = Explosionsversatz (bei 100 %) */
function part(bg,key,obj,home,expl){
  obj.position.set(home[0],home[1],home[2]);
  obj.userData.partKey=key;
  obj.traverse(o=>{ if(o.isMesh){ o.userData.partKey=key; } });
  const p={key,bg,obj,home:new THREE.Vector3(home[0],home[1],home[2]),expl:new THREE.Vector3(expl?expl[0]:0,expl?expl[1]:0,expl?expl[2]:0)};
  state.parts.push(p); state.byKey[key]=p; state.bgGroups[bg].add(obj);
  return p;
}
/* Mehrere Einzelteile (z. B. 4 Schrauben) unter einem Schlüssel */
function multi(bg,key,items,expl){
  const g=grp();
  items.forEach(it=>{ it.obj.position.set(it.p[0],it.p[1],it.p[2]); it.obj.userData.home=it.obj.position.clone(); if(it.r){ it.obj.rotation.set(it.r[0],it.r[1],it.r[2]); } g.add(it.obj); });
  return part(bg,key,g,[0,0,0],expl);
}
/* Schraube radial (Kopf außen) auf einem Kreis um die Rohrachse setzen */
function radialScrew(d,len,r,xs,y0,z,outward){
  const phi=Math.asin(Math.max(-1,Math.min(1,xs/r)));
  const s=screwDIN912(d,len); const rz=outward? Math.PI-phi : -phi;
  return {obj:s, p:[r*Math.sin(phi), y0+r*Math.cos(phi), z], r:[0,0,rz]};
}

/* ---------- Baugruppen aufbauen ---------- */
function build(dn){
  if(state.root){ scene.remove(state.root); state.root.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
  state.parts=[]; state.byKey={}; state.bgGroups={};
  const c=DN_CFG[dn]; const R=c.R;
  const root=grp(); state.root=root; scene.add(root);
  ['unterteil','zentral','halte','schalung'].forEach(k=>{ const g=grp(); g.userData.bgKey=k; state.bgGroups[k]=g; root.add(g); });
  const B=state.bgGroups;
  B.unterteil.userData.expl=new THREE.Vector3(0,-150,0);
  B.zentral.userData.expl=new THREE.Vector3(0,0,0);
  B.halte.userData.expl=new THREE.Vector3(0,110,0);
  B.schalung.userData.expl=new THREE.Vector3(0,260,0);

  /* Achsen: Y oben, Z = Rohrachse; +Z = Seite von Einbauhilfe, Stuetzrad und Motor (wie in den Zeichnungen),
     -Z = Zentralrohr, Klappvorrichtung und Werkzeugaufnahme (Roboterseite).
     Masse aus den Seitenansichten der Zeichnungen (Bezug Bumper D=200, Laufscheibe D=78). */
  const di=DN_LIST.indexOf(dn);                 // 0..4
  const shellTop=231+35*di;                     // Oberkante Schild ueber der Zentralrohrachse
  const arcDeg=[175,170,165,160,157][di];
  const shellLen=548, corner=33+4.5*di;
  const holeA=62, holeB=52-3*di;                // Halbachsen der Oeffnung (quer als Bogenlaenge, laengs)

  /* ===== Unterteil ===== */
  const A=0;                                     // Zentralrohrachse (relativ); axisY wird spaeter absolut gesetzt
  const plateBottom=-166-50*di;                  // Unterkante Stuetzplatte
  const plateTop=plateBottom+10;
  part('unterteil','stuetzplatte', box(90,10,218,MAT.steel), [0,plateBottom+5,47], [0,-40,0]);
  let y=plateTop;
  const d100=[], d50=[]; const dstkScrews=[];
  c.spacers.forEach((h,i)=>{
    const m=grp(); m.add(box(86,h,86, i%2?MAT.steel2:MAT.steel));
    [[-16,0],[16,0]].forEach(o=>m.add(at(cyl(4.5,h+0.5,MAT.rubber2,12),o[0],0,o[1])));
    (h===100?d100:d50).push({obj:m,p:[0,y+h/2,0]});
    if(i>0){ dstkScrews.push({obj:screwDIN912(8,50),p:[-30,y+h+0.5,0]}); dstkScrews.push({obj:screwDIN912(8,50),p:[30,y+h+0.5,0]}); }
    y+=h;
  });
  if(d100.length) multi('unterteil','dstueck100',d100,[0,-70,0]);
  if(d50.length) multi('unterteil','dstueck50',d50,[0,-110,0]);
  if(dstkScrews.length) multi('unterteil','s_dstk',dstkScrews,[0,-110,90]);
  const bumperH=120; const bumpR=100;
  const bumperBottom=y+4;
  part('unterteil','bumper', bumper(bumpR,bumperH), [0,bumperBottom,0], [0,60,0]);
  state.bumperH=bumperH;
  const bl = dn==='DN300'?16: dn==='DN350-400'?65:120;
  multi('unterteil','s_bumper',[{obj:screwDIN912(8,bl),p:[-16,plateBottom-0.5,0],r:[Math.PI,0,0]},{obj:screwDIN912(8,bl),p:[16,plateBottom-0.5,0],r:[Math.PI,0,0]}],[0,-90,0]);
  // Radhalterung am +Z-Ende der Stuetzplatte: Distanzstueck (47 lang) buendig am Plattenende, Gabel 117 lang, Laufscheibe D78
  part('unterteil','distanz_rad', box(40,20,47,MAT.steel2), [0,plateTop+10,132.5], [0,30,60]);
  { const fork=grp(); fork.add(at(box(40,20,71,MAT.steel),0,0,-23)); fork.add(at(box(7,20,46,MAT.steel),-16.5,0,35.5)); fork.add(at(box(7,20,46,MAT.steel),16.5,0,35.5));
    part('unterteil','radhalterung', fork, [0,plateTop+30,174], [0,60,90]); }
  part('unterteil','rad_u', wheel(), [0,plateTop+30,209], [0,20,150]);
  multi('unterteil','s_radh',[{obj:screwDIN912(6,40),p:[-12,plateTop+40.5,118]},{obj:screwDIN912(6,40),p:[12,plateTop+40.5,118]},{obj:screwDIN912(6,40),p:[0,plateTop+40.5,146]}],[0,110,80]);
  { const s=screwDIN912(8,40); s.rotation.z=Math.PI/2; part('unterteil','s_achse_u', s, [-28,plateTop+30,209], [-60,20,150]); }
  { const n=nut(8); n.rotation.z=Math.PI/2; part('unterteil','n_achse_u', n, [24,plateTop+30,209], [60,20,150]); }

  /* ===== Zentraleinheit (Oberwagen) ===== */
  const gpY=bumperBottom+bumperH+4;              // Oberkante Bumper-Anschlussplatte
  { const gp=grp(); gp.add(cyl(57,9,MAT.steel,56)); [[-15,0],[15,0]].forEach(o=>gp.add(at(cyl(5,9.6,MAT.rubber2,12),o[0],0,o[1])));
    for(let i=0;i<6;i++){ const a=i*Math.PI/3+Math.PI/6; gp.add(at(cyl(2.5,9.6,MAT.rubber2,8),Math.cos(a)*44,0,Math.sin(a)*44)); }
    part('zentral','grundplatte', gp, [0,gpY+4.5,0], [0,-70,0]); }
  const gkY=gpY+9;                               // Unterkante Grundkoerper
  const axisY=gkY+19.5;                          // Zentralrohrachse (absolut)
  { const gk=grp(); gk.add(box(46,39,120,MAT.steel)); gk.add(at(cylZ(14,121,MAT.rubber2,28),0,0,0)); gk.add(at(box(48,18,2,MAT.rubber2),0,10.5,0));
    gk.add(at(cylX(5,47,MAT.rubber2,12),0,0,40)); const cn=nut(8); cn.rotation.z=Math.PI/2; cn.position.set(-27,0,40); gk.add(cn);
    part('zentral','grundkoerper', gk, [0,axisY,0], [0,0,0]); }
  const gkTop=axisY+19.5;
  multi('zentral','s_grundplatte',[{obj:screwDIN912(8,16),p:[0,gkTop-7.5,-14]},{obj:screwDIN912(8,16),p:[0,gkTop-7.5,14]}],[0,90,0]);
  { const zr=grp(); zr.add(cylZ(13,336,MAT.steel,32)); zr.add(at(cylX(2.5,27,MAT.rubber2,8),0,0,-150)); zr.add(at(cyl(2.5,27,MAT.rubber2,8),0,0,140));
    part('zentral','zentralrohr', zr, [0,axisY,-188], [0,-60,-120]); }
  multi('zentral','s_k14',[[-12,-42],[12,-42],[-12,42],[12,42]].map(o=>({obj:screwDIN912(5,12),p:[o[0],axisY-20.5,o[1]],r:[Math.PI,0,0]})),[0,-70,0]);
  multi('zentral','w_k19',[[-12,-42],[12,-42],[-12,42],[12,42]].map(o=>({obj:washer(5.5),p:[o[0],axisY-19.5,o[1]]})),[0,-50,0]);
  // Klappvorrichtung am -Z-Ende: Teil1 (Block), Teil3 (Oberteil mit Gelenkauge), Teil2 (Gelenkplatte), Werkzeugaufnahme
  { const k1=grp(); k1.add(box(46,46,30,MAT.steel2)); k1.add(at(cylZ(14,31,MAT.rubber2,24),0,0,0));
    part('zentral','klapp1', k1, [0,axisY,-331], [0,-70,-160]); }
  { const k3=grp(); k3.add(box(46,18,30,MAT.steel)); k3.add(at(box(20,18,14,MAT.steel),0,0,-22)); k3.add(at(cylX(4,47,MAT.rubber2,10),0,0,-22));
    part('zentral','klapp3', k3, [0,axisY+32,-331], [0,60,-160]); }
  { const p=pin(6,60); p.rotation.z=Math.PI/2; part('zentral','stift', p, [0,axisY+32,-353], [90,60,-220]); }
  { const k2=grp(); k2.add(box(46,88,10,MAT.steel)); k2.add(at(box(12,8,10,MAT.steel),0,44,-5)); k2.add(at(box(6,40,10.5,MAT.rubber2),-14,-6,0)); k2.add(at(box(6,40,10.5,MAT.rubber2),14,-6,0));
    part('zentral','klapp2', k2, [0,axisY-2,-351], [0,-90,-260]); }
  { const wza=grp(); wza.add(box(46,70,20,MAT.steel2)); wza.add(at(cylZ(8,20,MAT.steel),0,0,-20)); wza.add(at(cylZ(7,2,MAT.rubber2,16),0,18,-10.5)); wza.add(at(cylZ(7,2,MAT.rubber2,16),0,-20,-10.5));
    part('zentral','werkzeugaufnahme', wza, [0,axisY,-366], [0,0,-380]); }
  multi('zentral','s_wza',[{obj:screwDIN912(8,20),p:[0,axisY+18,-376.5],r:[Math.PI/2,0,0]},{obj:screwDIN912(8,20),p:[0,axisY-20,-376.5],r:[Math.PI/2,0,0]}],[0,0,-480]);
  multi('zentral','s_k22',[[-16,28],[16,28],[-16,-30],[16,-30]].map(o=>({obj:screwDIN912(5,16),p:[o[0],axisY+o[1],-376.5],r:[Math.PI/2,0,0]})),[0,0,-430]);
  multi('zentral','s_k15',[{obj:screwDIN912(6,20),p:[-14,axisY+41.5,-331]},{obj:screwDIN912(6,20),p:[14,axisY+41.5,-331]}],[0,110,-160]);
  { const s=screwDIN912(6,30); s.rotation.z=Math.PI/2; part('zentral','s_k16', s, [-23.5,axisY-10,-331], [-90,-30,-160]); }
  multi('zentral','n_k17',[{obj:nut(6),p:[-29,axisY-10,-331],r:[0,0,Math.PI/2]},{obj:nut(6),p:[29,axisY-10,-331],r:[0,0,Math.PI/2]}],[0,-40,-160]);
  { const s=screwDIN912(6,50); s.rotation.z=Math.PI/2; part('zentral','s_k24', s, [-27,axisY-24,-351], [-110,-60,-260]); }
  // Federpaket unten: M6x90 durch Teil1 (von +Z) und Teil2, Feder im Spalt und unter der Sicherungsmutter
  { const s=screwDIN912(6,90); s.rotation.x=Math.PI/2; part('zentral','s_k20', s, [0,axisY-38,-315.5], [0,-120,-160]); }
  multi('zentral','feder',[{obj:spring(5,11,4),p:[0,axisY-38,-388]},{obj:spring(5,11,4),p:[0,axisY-38,-377]}],[0,-120,-260]);
  { const n=nut(6); n.rotation.x=Math.PI/2; part('zentral','n_k21', n, [0,axisY-38,-392], [0,-120,-340]); }
  // Einbauhilfe am +Z-Ende: Rohr D25, 184 gerade, dann 29 Grad nach oben, Gabelende mit Laufscheibe D78
  { const eh=grp(); eh.add(tubeAlong([[0,axisY,20],[0,axisY,230],[0,axisY+3,250],[0,axisY+40,315],[0,axisY+47,328]],12.5)); eh.add(at(box(6,30,34,MAT.steel),8,axisY+50,336));
    part('zentral','einbauhilfe', eh, [0,0,0], [0,-40,160]); }
  part('zentral','rad_z', wheel(), [-3,axisY+52,340], [0,40,260]);
  part('zentral','s_rad_z', screwDIN912(8,35), [0,gkTop+0.5,48], [0,90,120]);
  part('zentral','n_rad_z', nut(8), [0,axisY-22.5,48], [0,-60,120]);

  /* ===== Halteeinheit ===== */
  const zc=-10;                                    // Mitte Schildhalterung laengs
  const hb=gkTop+9;                                // Oberkante Grundplatte Teil1
  part('halte','teil1', box(92,9,100,MAT.steel), [0,gkTop+4.5,zc], [0,-70,0]);
  multi('halte','s_senk',[[-22,-40],[22,-40],[-22,40],[22,40]].map(o=>({obj:screwSenk(5,12),p:[o[0],hb+0.3,zc+o[1]]})),[0,60,0]);
  const yC=axisY+shellTop-R;                       // Mitte des Schildkreises (= Rohrmitte)
  const rodRel=Math.sqrt((R-18)*(R-18)-50*50)-35;  // Tragstangenachse relativ Schildmitte: Huelse liegt 35 unter dem Traeger
  const yR=yC+rodRel;                              // Achse Tragstangen (absolut)
  const pt=yR-18;                                  // Oberkante Stehplatten
  const H2=Math.max(30, pt-hb);
  multi('halte','teil2',[{obj:box(8,H2,100,MAT.steel),p:[-50,hb+H2/2,zc]},{obj:box(8,H2,100,MAT.steel),p:[50,hb+H2/2,zc]}],[0,0,0]);
  state.byKey['teil2'].obj.children.forEach((ch,i)=>{ ch.userData.explDir=new THREE.Vector3(i===0?-130:130,0,0); });
  multi('halte','s_bef',[-1,1].flatMap(sx=>[-37,-12,12,37].map(z=>({obj:screwDIN912(6,20),p:[sx*54.5,hb-4.5,zc+z],r:[0,0,-sx*Math.PI/2]}))),[0,0,0]);
  state.byKey['s_bef'].obj.children.forEach((ch,i)=>{ ch.userData.explDir=new THREE.Vector3(i<4?-200:200,0,0); });
  // Teil3: Flachleiste 80 lang mit 4 Loechern, Rundstab D16 von z=-120 bis +100 (darauf die Rohrhuelsen der Schalungsaufnahme)
  const rodMk=()=>{ const g=grp(); g.add(at(box(26,8,80,MAT.steel2),0,4,zc)); [-40,-28,28,40].forEach(o=>g.add(at(cyl(2.5,8.5,MAT.rubber2,8),0,4,zc+o)));
    g.add(at(cylZ(8,220,MAT.alu,24),0,18,-10)); g.add(at(cylZ(8.5,3,MAT.steel2,24),0,18,-118.5)); g.add(at(cylZ(8.5,3,MAT.steel2,24),0,18,98.5)); return g; };
  multi('halte','teil3',[{obj:rodMk(),p:[-50,pt,0]},{obj:rodMk(),p:[50,pt,0]}],[0,0,0]);
  state.byKey['teil3'].obj.children.forEach((ch,i)=>{ ch.userData.explDir=new THREE.Vector3(i===0?-70:70,90,0); });
  multi('halte','s_teil2',[-1,1].flatMap(sx=>[-30,30].map(z=>({obj:screwDIN912(6,16),p:[sx*50,pt+8.5,zc+z]}))),[0,0,0]);
  state.byKey['s_teil2'].obj.children.forEach((ch,i)=>{ ch.userData.explDir=new THREE.Vector3(i<2?-70:70,160,0); });
  const yB=yR-45;                                  // Achse Blasenwelle (unterhalb der Tragstangen, zwischen den Platten)
  const yG=yR-60;                                  // Mitte Gehaeuse / Bolzen
  // Blasenwelle: Vierkantstab 30x30x170 (z -100..70), Mittelbohrung bei z=10 (unter der Schildoeffnung), Bund, Zapfen, Endzapfen
  { const w=grp(); w.add(at(box(30,30,170,MAT.steel),0,0,-15)); w.add(at(cyl(8.5,31,MAT.rubber2,20),0,0,10)); w.add(at(cyl(11,2,MAT.steel2,24),0,15.5,10));
    w.add(at(cylZ(17,4,MAT.alu,24),0,0,72)); w.add(at(cylZ(14,38,MAT.alu,24),0,0,93)); w.add(at(cylZ(9,14,MAT.alu,20),0,0,119)); w.add(at(cylZ(3,15,MAT.rubber2,10),0,0,119));
    part('halte','welle', w, [0,yB,0], [0,110,0]); }
  // Befestigung Blaseneinheit 1: Klemmbloecke 40x34x28 - auf dem Zapfen der Welle und am hinteren Ende der rechten Tragstange
  const blk=(rb)=>{ const g=grp(); g.add(box(40,34,28,MAT.steel2)); g.add(at(cylZ(rb,29,MAT.rubber2,20),0,0,0)); g.add(at(cyl(2.5,10,MAT.rubber2,8),-20,8,0)); g.add(at(cyl(2.5,10,MAT.rubber2,8),-20,-8,0)); return g; };
  multi('halte','bef1',[{obj:blk(15),p:[0,yB,88]},{obj:blk(8.5),p:[50,yR,-100]}],[0,0,0]);
  state.byKey['bef1'].obj.children.forEach((ch,i)=>{ ch.userData.explDir=new THREE.Vector3(i===0?0:90,70,i===0?60:-60); });
  // Befestigung Blaseneinheit 2: Bolzen D20 mit Querbohrungen, in Bohrungen der Stehplatten, tragen das Gehaeuse
  const pinMk=()=>{ const g=grp(); g.add(cylZ(10,117,MAT.alu,20)); g.add(at(cylX(2.4,22,MAT.rubber2,8),0,0,26)); g.add(at(cylX(2.4,22,MAT.rubber2,8),0,0,51)); g.add(at(cylZ(10.5,3,MAT.steel2,20),0,0,-45)); return g; };
  multi('halte','bef2',[{obj:pinMk(),p:[-50,yG,88.5]},{obj:pinMk(),p:[50,yG,88.5]}],[0,0,0]);
  state.byKey['bef2'].obj.children.forEach((ch,i)=>{ ch.userData.explDir=new THREE.Vector3(i===0?-60:60,0,120); });
  // Gehaeuse 67x67x60 (z 92..152): Bohrung fuer den Wellenzapfen oben, grosse Bohrung zum Deckel, Seitenloecher fuer die langen Schrauben
  { const geh=grp(); geh.add(box(67,67,60,MAT.steel)); geh.add(at(cylZ(22,61,MAT.rubber2,28),0,-12,0)); geh.add(at(cylZ(15,4,MAT.steel2,24),0,15,-29));
    [[5,-7],[-5,-7],[5,18],[-5,18]].forEach(o=>geh.add(at(cylX(2.5,68,MAT.rubber2,8),0,o[0],o[1])));
    part('halte','gehaeuse', geh, [0,yG,122], [0,0,120]); }
  const tl = dn==='DN300'?45:65;
  multi('halte','s_teil1',[{obj:screwDIN912(6,tl),p:[-62,yG+5,115],r:[0,0,Math.PI/2]},{obj:screwDIN912(6,tl),p:[-62,yG-5,140],r:[0,0,Math.PI/2]},{obj:screwDIN912(6,tl),p:[62,yG+5,115],r:[0,0,-Math.PI/2]},{obj:screwDIN912(6,tl),p:[62,yG-5,140],r:[0,0,-Math.PI/2]}],[0,0,0]);
  state.byKey['s_teil1'].obj.children.forEach((ch,i)=>{ ch.userData.explDir=new THREE.Vector3(i<2?-150:150,0,120); });
  { const dk=grp(); dk.add(box(67,67,12,MAT.steel2)); dk.add(at(cylZ(12,13,MAT.rubber2,24),0,-12,0));
    part('halte','deckel', dk, [0,yG,158], [0,0,220]); }
  multi('halte','s_deckel',[[-25,-25],[25,-25],[-25,25],[25,25]].map(o=>({obj:screwDIN912(5,12),p:[o[0],yG+o[1],164.5],r:[Math.PI/2,0,0]})),[0,0,300]);
  { const mot=grp(); mot.add(at(cylZ(30,5,MAT.steel2,36),0,0,2.5)); mot.add(at(cylZ(24,115,MAT.motor,36),0,0,62.5)); const cap=new THREE.Mesh(new THREE.SphereGeometry(24,28,18),MAT.motor); cap.scale.set(1,1,0.55); cap.position.z=120; mot.add(cap); mot.add(at(cylZ(11,3,MAT.steel2,20),0,0,133)); mot.add(at(cylZ(5,12,MAT.alu,12),0,0,-6));
    part('halte','motor', mot, [0,yG-12,164], [0,0,340]); }
  multi('halte','s_motor',[0,1,2,3].map(i=>{ const a=Math.PI/4+i*Math.PI/2; return {obj:screwDIN912(4,16),p:[Math.cos(a)*20,yG-12+Math.sin(a)*20,169.5],r:[Math.PI/2,0,0]}; }),[0,0,410]);

  /* ===== Schalung: zwei Aufnahmen (Rohrhuelse auf der Tragstange, an beiden Enden ein Halbring-Buegel, dessen Enden
     mit Laschen am Traeger anliegen), Fuesse Pos2 (untere Laschen), drei Schalen ===== */
  const zS=14, zH=10;                              // Schildmitte / Oeffnung laengs
  const rr=R-19;
  const rIn=R-18;                                  // Innenradius Schalungstraeger
  const dT=Math.sqrt(50*50+rodRel*rodRel);          // Radius der Huelsenachse um die Rohrmitte
  const phiT=Math.atan2(50,rodRel);                // Winkel der Huelse von der Senkrechten
  // Buegelmittelpunkt C liegt auf der Traeger-Innenflaeche ueber der Huelse; lokales Koordinatensystem: +Y nach innen, +X zum Scheitel (fuer sx=+1)
  const bracketFrame=(sx)=>{ const phi=sx*phiT; return {cx:rIn*Math.sin(phi), cy:rIn*Math.cos(phi), th:Math.PI-phi}; };
  const L2W=(fr,lx,ly)=>[fr.cx+Math.cos(fr.th)*lx-Math.sin(fr.th)*ly, fr.cy+Math.sin(fr.th)*lx+Math.cos(fr.th)*ly];
  const padMk=(mat)=>{ const g=grp(); g.add(box(20,4,20,mat)); g.add(at(cyl(2.5,5,MAT.rubber2,8),0,0,0)); return g; };
  const aufnMk=(sx)=>{ const g=grp(); const fr=bracketFrame(sx);
    // Rohrhuelse D20 x 172 auf der Tragstange (Achse bei x=+-50, rodRel)
    g.add(at(cylZ(10,172,MAT.steel,28),sx*50,rodRel,zH+10));
    g.add(at(cylZ(9,4,MAT.rubber2,28),sx*50,rodRel,zH+96)); g.add(at(cylZ(9,4,MAT.rubber2,28),sx*50,rodRel,zH-76));
    [-76,76].forEach(dz=>{ const z=zH+dz;
      const ring=arcRail(30,36,90,20,MAT.steel2);  // Halbring R30/36, 20 breit: von der Traegerflaeche nach innen um die Huelse
      ring.rotation.z=fr.th; ring.position.set(fr.cx,fr.cy,z); g.add(ring);
      const p=L2W(fr,sx*33,2); const pad=padMk(MAT.steel2); pad.rotation.z=fr.th; pad.position.set(p[0],p[1],z); g.add(pad); // obere Lasche
    });
    return g; };
  { const a=grp(); a.add(aufnMk(-1)); a.add(aufnMk(1)); part('schalung','aufnahme1', a, [0,yC,0], [0,60,0]); }
  // Pos2: vier Fuesse = untere Laschen der Buegel
  { const items=[]; [-1,1].forEach(sx=>{ const fr=bracketFrame(sx); [-76,76].forEach(dz=>{ const p=L2W(fr,-sx*33,2); const pad=padMk(MAT.steel); items.push({obj:pad,p:[p[0],yC+p[1],zH+dz],r:[0,0,fr.th]}); }); });
    multi('schalung','aufnahme2',items,[0,0,0]);
    state.byKey['aufnahme2'].obj.children.forEach((ch,i)=>{ ch.userData.explDir=new THREE.Vector3(i<2?-70:70,-40,0); }); }
  // 8x M5x10: je Lasche eine, von innen durch das Pad in den Traeger (Schaft nach aussen = lokal -Y)
  { const items=[]; [-1,1].forEach(sx=>{ const fr=bracketFrame(sx); [-76,76].forEach(dz=>{ [sx*33,-sx*33].forEach(lx=>{ const p=L2W(fr,lx,8.5); items.push({obj:screwDIN912(5,10),p:[p[0],yC+p[1],zH+dz],r:[0,0,fr.th]}); }); }); });
    multi('schalung','s_aufn',items,[0,-60,0]); }
  // 2x M5x30: je Huelse eine, von aussen radial durch die Huelse in die Tragstange
  multi('schalung','s_aufn2',[-1,1].map(sx=>radialScrew(5,30,dT+11.5,(dT+11.5)*Math.sin(sx*phiT),yC,zH+10,false)),[0,90,0]);
  const hz=zH-zS;                                  // Oeffnung relativ zur Schildmitte
  part('schalung','traeger', shell(R-15,3,shellLen-40,arcDeg-6,[holeA+4,holeB+4],MAT.traeger,corner,hz), [0,yC,zS], [0,100,0]);
  part('schalung','blase',   shell(R-10.5,4,shellLen-20,arcDeg-3,[holeA+2,holeB+2],MAT.blase,corner+2,hz), [0,yC,zS], [0,190,0]);
  part('schalung','schild',  shell(R-2,3,shellLen,arcDeg,[holeA,holeB],MAT.shield,corner+4,hz), [0,yC,zS], [0,280,0]);
  state.byKey['schild'].obj.traverse(o=>{ if(o.isMesh) o.renderOrder=10; });
  state.pipeCenterY=yC; state.plateBottom=plateBottom; state.holeZ=zH;
  const hy=yB-18; // Rohrkontext: Injektionsblase startet an der Oberkante der Blasenwelle (hy+33)

  /* Rohrkontext (Hauptkanal + Stutzen + Injektionsblase + Mörtel) */
  const ctx=grp(); ctx.name='pipectx';
  const pipeLen=1400;
  const yP=state.pipeCenterY, zHole=state.holeZ;
  const pIn=cylZ(R,pipeLen,MAT.pipe,64); pIn.position.y=yP; ctx.add(pIn);
  const pOut=cylZ(R+12,pipeLen,MAT.pipeOut,64); pOut.position.y=yP; ctx.add(pOut);
  const stutzR=75; const stutz=cyl(stutzR,320,MAT.pipe,40); stutz.position.set(0,yP+R+160,zHole); ctx.add(stutz);
  const stutzO=cyl(stutzR+10,320,MAT.pipeOut,40); stutzO.position.set(0,yP+R+160,zHole); ctx.add(stutzO);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(stutzR+8, 9, 12, 40), MAT.mortar); ring.rotation.x=Math.PI/2; ring.position.set(0,yP+R+2,zHole); ring.name='mortar'; ring.visible=false; ctx.add(ring);
  const inj=new THREE.Mesh(new THREE.SphereGeometry(1,24,16), MAT.injBlase); inj.name='inj'; inj.scale.set(stutzR-14,20,stutzR-14); inj.position.set(0,yP+R-10,zHole); inj.visible=false; ctx.add(inj);
  const roll=cylZ(26,64,MAT.injBlase,28); roll.name='roll'; roll.position.set(0,yB,zHole); roll.visible=false; ctx.add(roll);
  const stem=cyl(12,1,MAT.injBlase,16); stem.geometry.translate(0,0.5,0); stem.name='stem'; stem.position.set(0,yB,zHole); stem.visible=false; ctx.add(stem);
  const stemBase=yB, stemH=(yP+R)-yB; state.yB=yB;
  state.pressUp=Math.max(0,(yP-R+3)-state.plateBottom);
  state.stemBase=stemBase; state.stemH=stemH; state.ctxStutzR=stutzR;
  ctx.visible=state.pipe; root.add(ctx); state.ctx=ctx;

  state.gridY=state.plateBottom-30; state.axisY=axisY; state.R=R;
  applyTheme();
  scene.updateMatrixWorld(true);
  state.parts.forEach(p=>{ p.box=new THREE.Box3().setFromObject(p.obj); p.center=p.box.getCenter(new THREE.Vector3()).sub(p.obj.position); });
  uniqueMaterials();
  state.bom=bomFor(dn); state.steps=stepsFor(dn);
  buildBOM(); buildStepList(); buildInfo();
  applyVisibility(); applyExplode(); applyTransp();
  fitView(true);
}

/* ---------- Sichtbarkeit / Explosion / Highlight ---------- */
const GHOST_OPACITY=0.08;
function setGhost(obj,on){
  obj.traverse(o=>{ if(!o.isMesh) return; if(!o.userData.mat0){ o.userData.mat0=o.material; o.userData.matG=o.material.clone(); o.userData.matG.transparent=true; o.userData.matG.opacity=GHOST_OPACITY; o.userData.matG.depthWrite=false; }
    o.material = on ? o.userData.matG : o.userData.mat0; });
}
function bgOf(p){ return p.bg; }
function visibleKeysForStep(){
  if(!state.stepMode) return null;
  const list=state.steps[state.bg]; const set=new Set();
  for(let i=0;i<=state.stepIdx && i<list.length;i++){
    const st=list[i];
    if(st.p) st.p.forEach(k=>set.add(k));
    if(st.bg) state.parts.filter(p=>p.bg===st.bg).forEach(p=>set.add(p.key));
  }
  return set;
}
function applyVisibility(){
  const stepSet=visibleKeysForStep();
  const list=state.steps?state.steps[state.bg]:null;
  const newest=new Set(); if(stepSet && list && list[state.stepIdx]){ const st=list[state.stepIdx]; if(st.p) st.p.forEach(k=>newest.add(k)); if(st.bg) state.parts.filter(p=>p.bg===st.bg).forEach(p=>newest.add(p.key)); }
  state.parts.forEach(p=>{
    let vis=true, ghost=false;
    if(state.bg!=='gesamt' && p.bg!==state.bg){ if(state.ghost){ ghost=true; } else { vis=false; } }
    if(state.isolate){ vis = (p.key===state.isolate); ghost=false; }
    else if(stepSet){ if(!stepSet.has(p.key) && !ghost) vis=false; }
    p.obj.visible=vis; if(vis) setGhost(p.obj, ghost);
    p.ghost=ghost; p.newest = stepSet ? newest.has(p.key) : false;
  });
  Object.keys(state.bgGroups).forEach(k=>{ state.bgGroups[k].visible = true; });
  if(state.ctx) state.ctx.visible=state.pipe;
  updateHighlight();
  updateBOMState();
}
function applyExplode(){
  const t=state.explode;
  const gesamt = state.bg==='gesamt';
  state.parts.forEach(p=>{
    const k = gesamt ? 0.55 : 1;
    p.obj.position.copy(p.home).addScaledVector(p.expl, t*k);
    // Kinder mit eigener Richtung (z. B. zwei Stehplatten)
    p.obj.children.forEach(ch=>{ if(ch.userData.explDir){ if(!ch.userData.home) ch.userData.home=ch.position.clone(); ch.position.copy(ch.userData.home).addScaledVector(ch.userData.explDir, t*k); } });
  });
  Object.keys(state.bgGroups).forEach(k=>{ const g=state.bgGroups[k]; g.position.copy(gesamt? g.userData.expl.clone().multiplyScalar(t) : new THREE.Vector3()); });
  const up = (state.pipe && state.pressUp) ? state.pressUp*(1-t) : 0;
  const hP = state.bumperH-up;                                  // Bumperhoehe in Anpressstellung
  const kp = (state.kp==null)?1:state.kp;                          // 0 = Anfahren (entlueftet), 1 = angepresst
  const dl = state.pipe ? Math.min(30,Math.max(0,hP-8))*(1-kp)*(1-t) : 0; // Absenkung des Oberbaus beim Anfahren
  state.dl=dl;
  state.parts.forEach(p=>{ if(p.bg!=='unterteil') return; if(p.key==='bumper'){ const sc=Math.max(0.05,(hP-dl)/state.bumperH); p.obj.scale.set(1,sc,1); p.obj.position.y+=up; } else { p.obj.position.y+=up; } });
  ['zentral','halte','schalung'].forEach(k=>{ state.bgGroups[k].position.y-=dl; });
}
function applyTransp(){
  const p=state.byKey['schild']; if(!p) return;
  p.obj.traverse(o=>{ if(!o.isMesh) return; [o.material,o.userData.mat0].forEach(m=>{ if(m && m!==o.userData.matG){ m.transparent=true; m.opacity=state.transp?0.5:1; m.depthWrite=!state.transp; m.needsUpdate=true; } }); });
}
function updateHighlight(){
  state.parts.forEach(p=>{
    const sel = p.key===state.selected || p.key===state.hoverKey;
    p.obj.traverse(o=>{ if(!o.isMesh) return; if(p.newest && !sel){ o.material.emissive && o.material.emissive.set(0x3a5fb0); o.material.emissiveIntensity=0.35; }
      else { if(o.material.emissive){ o.material.emissive.set(sel?HIGHLIGHT:0x000000); o.material.emissiveIntensity = sel?0.55:1; } } });
  });
}
/* Materialien pro Teil eindeutig machen (für Emissive-Highlight) */
function uniqueMaterials(){
  state.parts.forEach(p=>{ p.obj.traverse(o=>{ if(o.isMesh){ o.material=o.material.clone(); o.userData.mat0=null; o.userData.matG=null; } }); });
}

/* ---------- Kamera ---------- */
function visibleBox(){
  const b=new THREE.Box3(); let any=false;
  state.parts.forEach(p=>{ if(p.obj.visible && !p.ghost){ b.expandByObject(p.obj); any=true; } });
  if(!any) state.parts.forEach(p=>{ if(p.obj.visible){ b.expandByObject(p.obj); } });
  return b;
}
function fitView(reset){
  const b=visibleBox(); if(b.isEmpty()) return;
  const size=b.getSize(new THREE.Vector3()), center=b.getCenter(new THREE.Vector3());
  const maxDim=Math.max(size.x,size.y,size.z);
  const aspect=camera.aspect; const fov=THREE.MathUtils.degToRad(camera.fov);
  let dist=maxDim/2/Math.tan(fov/2); if(aspect<1) dist/=aspect; dist*=1.25;
  controls.target.copy(center);
  if(reset){ const dir=new THREE.Vector3(-1,0.62,1).normalize(); camera.position.copy(center).addScaledVector(dir,dist); }
  else { const dir=camera.position.clone().sub(controls.target).normalize(); camera.position.copy(center).addScaledVector(dir,dist); }
  camera.near=Math.max(1,dist/100); camera.far=dist*40; camera.updateProjectionMatrix(); controls.update();
}
function focusPart(key){
  const p=state.byKey[key]; if(!p) return;
  const b=new THREE.Box3().setFromObject(p.obj); const c=b.getCenter(new THREE.Vector3()); const s=b.getSize(new THREE.Vector3()).length();
  const dir=camera.position.clone().sub(controls.target).normalize();
  animateCamera(c, c.clone().addScaledVector(dir, Math.max(160, s*1.9)));
}
let camAnim=null;
function animateCamera(target,pos){ camAnim={t0:performance.now(), dur:600, p0:camera.position.clone(), t0v:controls.target.clone(), p1:pos, t1:target}; }

/* ---------- Picking ---------- */
const ray=new THREE.Raycaster(); const ptr=new THREE.Vector2();
let downPos=null;
function pickAt(x,y){
  const r=canvas.getBoundingClientRect(); ptr.x=((x-r.left)/r.width)*2-1; ptr.y=-((y-r.top)/r.height)*2+1;
  ray.setFromCamera(ptr,camera);
  const meshes=[]; state.parts.forEach(p=>{ if(p.obj.visible && !p.ghost) p.obj.traverse(o=>{ if(o.isMesh) meshes.push(o); }); });
  const hits=ray.intersectObjects(meshes,false);
  for(const h of hits){ const k=h.object.userData.partKey; if(k) return k; }
  return null;
}
canvas.addEventListener('pointerdown',e=>{ downPos=[e.clientX,e.clientY]; });
canvas.addEventListener('pointerup',e=>{
  if(!downPos) return; const dx=e.clientX-downPos[0], dy=e.clientY-downPos[1]; downPos=null;
  if(Math.hypot(dx,dy)>6) return;
  const k=pickAt(e.clientX,e.clientY);
  selectPart(k, false);
});
canvas.addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse') return;
  const k=pickAt(e.clientX,e.clientY);
  if(k!==state.hoverKey){ state.hoverKey=k; canvas.style.cursor=k?'pointer':(state.mode==='pan'?'move':''); updateHighlight(); }
});

/* ---------- Auswahl / Teilkarte ---------- */
function bomEntry(key){ for(const bg of ['unterteil','zentral','halte','schalung']){ const e=state.bom[bg].find(r=>r[3]===key); if(e) return {bg,e}; } return null; }
function selectPart(key, fromList){
  state.selected=key; updateHighlight(); updateBOMState();
  const card=document.getElementById('partcard');
  if(!key){ card.classList.remove('on'); return; }
  const be=bomEntry(key); if(!be){ card.classList.remove('on'); return; }
  const [pos,name,qty,k,din]=be.e;
  document.getElementById('pc-pos').textContent=pos;
  document.getElementById('pc-name').textContent=name.replace(/_/g,' ');
  document.getElementById('pc-bg').textContent=BG[be.bg].short;
  document.getElementById('pc-qty').textContent='Menge '+qty;
  document.getElementById('pc-din').textContent=din?'Normteil':'Bauteil';
  document.getElementById('pc-desc').textContent = DESC[key] || (din?DESC.screw:'');
  document.getElementById('pc-iso').classList.toggle('on', state.isolate===key);
  card.classList.add('on');
  if(!fromList && window.innerWidth>1000){ const row=document.querySelector('tr[data-key="'+key+'"]'); if(row) row.scrollIntoView({block:'nearest',behavior:'smooth'}); }
}
document.getElementById('pc-close').addEventListener('click',()=>{ state.isolate=null; selectPart(null); applyVisibility(); });
document.getElementById('pc-iso').addEventListener('click',()=>{ state.isolate = state.isolate===state.selected ? null : state.selected; document.getElementById('pc-iso').classList.toggle('on', !!state.isolate); applyVisibility(); fitView(false); });
document.getElementById('pc-focus').addEventListener('click',()=>{ if(state.selected) focusPart(state.selected); });

/* ---------- Stückliste (Panel) ---------- */
function buildBOM(){
  const wrap=document.getElementById('bomlist'); wrap.innerHTML='';
  document.getElementById('bomtitle').textContent=state.dn;
  const order = state.bg==='gesamt' ? ['unterteil','zentral','halte','schalung'] : [state.bg];
  let n=0;
  order.forEach(bg=>{
    const g=document.createElement('div'); g.className='bomgroup';
    const h=document.createElement('h3'); h.textContent=BG[bg].label; g.appendChild(h);
    const t=document.createElement('table'); t.className='bom';
    state.bom[bg].forEach(r=>{
      const [pos,name,qty,key,din]=r; n++;
      const tr=document.createElement('tr'); if(key) tr.dataset.key=key; else tr.classList.add('hidden-part');
      const nm=name.replace(/_/g,' ');
      tr.innerHTML='<td><span class="balloon">'+pos+'</span></td><td><span class="nm">'+nm+(din?'':'<small>'+(DESC[key]||'')+'</small>')+'</span></td><td>'+qty+'×</td>';
      if(key) tr.addEventListener('click',()=>{ selectPart(key,true); if(state.stepMode){ /* im Schrittmodus nur markieren */ } });
      t.appendChild(tr);
    });
    g.appendChild(t); wrap.appendChild(g);
  });
  document.getElementById('bomcount').textContent=n+' Positionen';
  updateBOMState();
}
function updateBOMState(){
  document.querySelectorAll('tr[data-key]').forEach(tr=>{
    const k=tr.dataset.key; tr.classList.toggle('sel', k===state.selected);
    const p=state.byKey[k]; tr.classList.toggle('hidden-part', !!p && (!p.obj.visible || p.ghost));
  });
}
function buildStepList(){
  const wrap=$s('steplist'); wrap.innerHTML='';
  const list=state.steps[state.bg];
  list.forEach((st,i)=>{
    const d=document.createElement('div'); d.className='step'; d.dataset.i=i;
    d.innerHTML='<span class="n">'+(i+1)+'</span><div><b>'+st.t+'</b><span>'+st.s+'</span>'+(st.p?'<div class="plist">'+st.p.filter(k=>state.byKey[k]).map(k=>'<i>'+(bomEntry(k)?bomEntry(k).e[0]:'')+'</i>').join('')+'</div>':'')+'</div>';
    d.addEventListener('click',()=>{ state.stepIdx=i; if(!state.stepMode){ state.stepMode=true; $s('stepmode').checked=true; } applyStep(); });
    wrap.appendChild(d);
  });
  applyStepUI();
}
function applyStep(){
  $s('stepbar').classList.toggle('on', state.stepMode);
  if(state.stepMode){ state.explode=0; document.getElementById('explode').value=0; document.getElementById('explodeval').textContent='0 %'; state.isolate=null; }
  applyVisibility(); applyExplode(); applyStepUI();
}
function applyStepUI(){
  document.body.classList.toggle('stepping', !!state.stepMode);
  { const bt=document.getElementById('ex-together'), ba=document.getElementById('ex-apart'); if(bt&&ba){ bt.classList.toggle('on',state.explode<0.02); ba.classList.toggle('on',state.explode>0.98); } }
  $s('stepbar').classList.toggle('on', !!state.stepMode);
  const list=state.steps[state.bg]; const i=state.stepIdx;
  document.querySelectorAll('.step').forEach(el=>{ const j=+el.dataset.i; el.classList.toggle('on', state.stepMode && j===i); el.classList.toggle('done', state.stepMode && j<i); });
  if(list[i]){ $s('steptitle').textContent=(i+1)+'. '+list[i].t; $s('stepsub').textContent=list[i].s; $s('stepnum').textContent=(i+1)+'/'+list.length; }
}
$s('stepprev').addEventListener('click',()=>{ state.stepIdx=Math.max(0,state.stepIdx-1); applyStep(); });
$s('stepnext').addEventListener('click',()=>{ state.stepIdx=Math.min(state.steps[state.bg].length-1,state.stepIdx+1); applyStep(); });
$s('stepmode').addEventListener('change',e=>{ state.stepMode=e.target.checked; state.stepIdx=0; applyStep(); });
document.getElementById('ghost').addEventListener('change',e=>{ state.ghost=e.target.checked; applyVisibility(); });
document.getElementById('transp').addEventListener('change',e=>{ state.transp=e.target.checked; applyTransp(); });

function buildInfo(){
  const c=DN_CFG[state.dn];
  document.getElementById('info-dn').textContent='Baugröße '+state.dn;
  const kv=[['Rohrradius (Modell)',c.R+' mm'],['Schalungsschild',c.shells[0].replace(/_/g,' ')],['Blase',c.shells[1].replace(/_/g,' ')],['Schalungsträger',c.shells[2].replace(/_/g,' ')],['Distanzstücke',c.spacers.length?c.spacers.map(v=>v+' mm').join(' + '):'keine'],['Schildhalterung Teil 2',c.teil2.replace(/_/g,' ')],['Schrauben Teil 1',c.screwTeil1]];
  document.getElementById('info-kv').innerHTML=kv.map(r=>'<dt>'+r[0]+'</dt><dd>'+r[1]+'</dd>').join('');
}

/* ---------- Segmente (DN, Baugruppe) ---------- */
const dnseg=document.getElementById('dnseg');
DN_LIST.forEach(dn=>{ const b=document.createElement('button'); b.type='button'; b.textContent=dn; b.dataset.dn=dn; b.setAttribute('role','tab'); b.addEventListener('click',()=>setDN(dn)); dnseg.appendChild(b); });
const bgseg=document.getElementById('bgseg');
Object.keys(BG).forEach(k=>{ const b=document.createElement('button'); b.type='button'; b.textContent=BG[k].short; b.dataset.bg=k; b.setAttribute('role','tab'); b.addEventListener('click',()=>setBG(k)); bgseg.appendChild(b); });
function syncSeg(){
  dnseg.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.dn===state.dn));
  bgseg.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.bg===state.bg));
}
function setDN(dn){ state.dn=dn; state.selected=null; state.isolate=null; state.stepIdx=0; document.getElementById('partcard').classList.remove('on'); build(dn); syncSeg(); applyStepUI(); }
function setBG(k){ state.bg=k; state.selected=null; state.isolate=null; state.stepIdx=0; document.getElementById('partcard').classList.remove('on'); buildBOM(); buildStepList(); applyVisibility(); applyExplode(); applyStepUI(); syncSeg(); fitView(false); }

/* ---------- Explosion / Buttons ---------- */
const ex=document.getElementById('explode');
ex.addEventListener('input',()=>{ state.explode=ex.value/100; document.getElementById('explodeval').textContent=ex.value+' %'; if(state.stepMode && state.explode>0){ state.stepMode=false; $s('stepmode').checked=false; $s('stepbar').classList.remove('on'); applyVisibility(); applyStepUI(); } applyExplode(); });
document.getElementById('btn-reset').addEventListener('click',()=>{ state.isolate=null; selectPart(null); applyVisibility(); fitView(true); });
document.getElementById('btn-rot').addEventListener('click',e=>{ state.autoRot=!state.autoRot; controls.autoRotate=state.autoRot; controls.autoRotateSpeed=1.2; e.currentTarget.classList.toggle('on',state.autoRot); });
document.getElementById('btn-pipe').addEventListener('click',e=>{ state.pipe=!state.pipe; e.currentTarget.classList.toggle('on',state.pipe); if(state.ctx) state.ctx.visible=state.pipe; applyExplode(); startPipeDemo(); });
document.getElementById('btn-labels').addEventListener('click',e=>{ state.labels=!state.labels; e.currentTarget.classList.toggle('on',state.labels); });
if(window.innerWidth<=1000){ state.labels=false; document.getElementById('btn-labels').classList.remove('on'); } else { document.getElementById('btn-labels').classList.add('on'); }
document.getElementById('btn-fs').addEventListener('click',()=>{ const el=viewerEl; if(document.fullscreenElement){ document.exitFullscreen(); } else if(el.requestFullscreen){ el.requestFullscreen(); } });

/* Demo-Ablauf mit Rohr: Injektionsblase fährt aus, Mörtelring erscheint */
let demoT0=0;
function startPipeDemo(){ demoT0=performance.now(); }
function updateDemo(now){
  if(!state.pipe || !state.ctx){ if(state.ctx){ const w=state.byKey['welle']; if(w) w.obj.rotation.z=0; const r=state.ctx.getObjectByName('roll'); if(r) r.visible=false; } const cap=document.getElementById('democap'); if(cap) cap.hidden=true; if(state.kp!==1){ state.kp=1; applyExplode(); } return; }
  const inj=state.ctx.getObjectByName('inj'), stem=state.ctx.getObjectByName('stem'), mortar=state.ctx.getObjectByName('mortar'), roll=state.ctx.getObjectByName('roll'), welle=state.byKey['welle'];
  const t=((now-demoT0)/1000)%19; // 19-s-Schleife
  const ease=x=>x<0?0:x>1?1:x*x*(3-2*x);
  const R=state.R, axisY=state.pipeCenterY;
  // 0-2 Anfahren (Bumper entlueftet) | 2-4.5 Bumper aufblasen, Schild anpressen | 4.5-7.5 Blase ausfahren | 7.5-11.5 Moertel | 11.5-14 Aushaerten | 14-16.5 Blase einfahren | 16.5-19 Bumper entlueften
  const kp = t<2?0 : t<4.5?ease((t-2)/2.5) : t<16.5?1 : 1-ease((t-16.5)/2.5);
  if(kp!==state.kp){ state.kp=kp; applyExplode(); }
  const cap=document.getElementById('democap');
  if(cap){ const ph = t<2?'1 · Anfahren zur Schadstelle – Bumper entlüftet, Schalung hat Abstand zur Rohrwand' : t<4.5?'2 · Bumper aufblasen – Schalungsschild wird an die Rohrwand gepresst' : t<7.5?'3 · Welle dreht, Luft dazu – Injektionsblase fährt in den Anschluss' : t<11.5?'4 · Mörtel verpressen – Drucksensor meldet die Verfüllung' : t<14?'5 · Aushärten' : t<16.5?'6 · Injektionsblase einfahren' : '7 · Bumper entlüften – weiterfahren'; if(cap.textContent!==ph) cap.textContent=ph; cap.hidden=false; }
  const k = t<4.5?0 : t<7.5?ease((t-4.5)/3) : t<14?1 : t<16.5?1-ease((t-14)/2.5) : 0;
  // Blase ist um die Welle gewickelt: Rolle wird beim Ausfahren duenner, Welle dreht sich, Schlauch waechst durch die Oeffnung in den Stutzen
  roll.visible=true; const rR=26-14*k; roll.scale.set(rR/26,rR/26,1); roll.position.y=state.yB-(state.dl||0);
  welle.obj.rotation.z=-k*Math.PI*4;
  const wallY=axisY+R, base=state.yB-(state.dl||0)+rR, total=(wallY-base)+140;
  stem.visible=k>0.02; stem.position.y=base; stem.scale.y=Math.max(0.01,total*k);
  const tip=base+total*k; const kk=Math.max(0,Math.min(1,(tip-wallY)/140));
  inj.visible=kk>0.02; const rs=(state.ctxStutzR||75)-14;
  inj.scale.set(rs*(0.35+0.65*kk), 22+90*kk, rs*(0.35+0.65*kk));
  inj.position.y = wallY + 30 + 60*kk;
  const m = t<7.5?0 : t<11.5?ease((t-7.5)/4) : t<16.5?1 : 1-ease((t-16.5)/1.5);
  mortar.visible = m>0.02; mortar.material.opacity = 0.85*m;
}

/* ---------- Beschriftungen (Positionsnummern) ---------- */
const labelsEl=document.getElementById('labels'); const labelPool=new Map();
const tmpV=new THREE.Vector3();
function updateLabels(){
  const show=state.labels; const r=canvas.getBoundingClientRect();
  const used=new Set();
  if(show){
    state.parts.forEach(p=>{
      if(!p.obj.visible || p.ghost) return;
      const be=bomEntry(p.key); if(!be) return;
      const din=be.e[4]; if(din && !(state.selected===p.key) && state.explode<0.35 && !state.stepMode) return;
      if(din && state.bg==='gesamt' && state.selected!==p.key) return;
      p.obj.updateMatrixWorld();
      tmpV.copy(p.center).applyMatrix4(p.obj.matrixWorld);
      // Kinder mit Versatz: Mittelpunkt neu bestimmen bei Explosion
      tmpV.project(camera);
      if(tmpV.z>1) return;
      const x=(tmpV.x+1)/2*r.width, y=(1-tmpV.y)/2*r.height;
      if(x<-20||y<-20||x>r.width+20||y>r.height+20) return;
      let el=labelPool.get(p.key);
      if(!el){ el=document.createElement('div'); el.className='balloon'; el.textContent=be.e[0]; el.addEventListener('click',()=>selectPart(p.key,false)); labelsEl.appendChild(el); labelPool.set(p.key,el); }
      el.style.transform='translate(-50%,-50%) translate('+x.toFixed(1)+'px,'+(y-14).toFixed(1)+'px)';
      el.classList.toggle('sel', p.key===state.selected);
      el.classList.toggle('dim', !!state.selected && p.key!==state.selected);
      el.style.display=''; used.add(p.key);
    });
  }
  labelPool.forEach((el,k)=>{ if(!used.has(k)) el.style.display='none'; });
}

/* ---------- Resize / Loop ---------- */
function resize(){
  const w=viewerEl.clientWidth, h=viewerEl.clientHeight;
  if(canvas.width!==Math.floor(w*renderer.getPixelRatio()) || canvas.height!==Math.floor(h*renderer.getPixelRatio())){ renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
}
window.addEventListener('resize',()=>{ resize(); });
new ResizeObserver(()=>resize()).observe(viewerEl);
let hintTimer=setTimeout(()=>document.getElementById('hint').classList.add('gone'),6000);
canvas.addEventListener('pointerdown',()=>{ document.getElementById('hint').classList.add('gone'); },{once:true});

function loop(now){
  requestAnimationFrame(loop);
  resize();
  if(camAnim){ const k=Math.min(1,(now-camAnim.t0)/camAnim.dur); const e=k*k*(3-2*k); camera.position.lerpVectors(camAnim.p0,camAnim.p1,e); controls.target.lerpVectors(camAnim.t0v,camAnim.t1,e); if(k>=1) camAnim=null; }
  controls.update();
  if(exAnim){ const k=Math.min(1,(now-exAnim.t0)/550); const e=k*k*(3-2*k); state.explode=exAnim.from+(exAnim.target-exAnim.from)*e; const v=Math.round(state.explode*100); ex.value=v; document.getElementById('explodeval').textContent=v+' %'; applyExplode(); syncExplodeBtns(); if(k>=1) exAnim=null; }
  updateDemo(now);
  renderer.render(scene,camera);
  updateLabels();
}

/* ---------- Theme ---------- */
const root=document.documentElement;
function currentTheme(){ const s=root.getAttribute('data-theme'); if(s) return s; return window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'; }
document.getElementById('themebtn').addEventListener('click',()=>{ const next=currentTheme()==='dark'?'light':'dark'; root.setAttribute('data-theme',next); try{ localStorage.setItem('kt40-theme',next); }catch(e){} applyTheme(); });
try{ const t=localStorage.getItem('kt40-theme'); if(t) root.setAttribute('data-theme',t); }catch(e){}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>applyTheme());

/* ---------- Tabs ---------- */
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x===b));
  document.querySelectorAll('.tabpane').forEach(p=>p.classList.toggle('on',p.id==='tab-'+b.dataset.tab));
}));

/* ---------- Einfache Bedienung ---------- */
const exBtnT=document.getElementById('ex-together'), exBtnA=document.getElementById('ex-apart');
function syncExplodeBtns(){ exBtnT.classList.toggle('on',state.explode<0.02); exBtnA.classList.toggle('on',state.explode>0.98); }
let exAnim=null;
function animateExplode(target){ exAnim={from:state.explode,target,t0:performance.now()}; }
function leaveStepMode(){ if(!state.stepMode) return; state.stepMode=false; $s('stepmode').checked=false; applyVisibility(); applyStepUI(); }
function enterStepMode(){ state.stepMode=true; state.stepIdx=0; $s('stepmode').checked=true; state.isolate=null; selectPart(null); applyStep(); }
exBtnT.addEventListener('click',()=>{ leaveStepMode(); animateExplode(0); });
exBtnA.addEventListener('click',()=>{ leaveStepMode(); animateExplode(1); });
ex.addEventListener('input',syncExplodeBtns);
$s('stepstart').addEventListener('click',()=>{ enterStepMode(); });
$s('stepstop').addEventListener('click',()=>{ leaveStepMode(); });
document.getElementById('btn-reset2').addEventListener('click',()=>{ document.getElementById('btn-reset').click(); });
/* Drehen / Verschieben umschalten (linke Maustaste bzw. ein Finger) */
function setMode(m){ state.mode=m; const pan=(m==='pan'); controls.mouseButtons.LEFT = pan?THREE.MOUSE.PAN:THREE.MOUSE.ROTATE; controls.touches.ONE = pan?THREE.TOUCH.PAN:THREE.TOUCH.ROTATE; document.getElementById('mode-rot').classList.toggle('on',!pan); document.getElementById('mode-pan').classList.toggle('on',pan); canvas.style.cursor = pan?'move':''; }
document.getElementById('mode-rot').addEventListener('click',()=>setMode('rot'));
document.getElementById('mode-pan').addEventListener('click',()=>setMode('pan'));
controls.mouseButtons.RIGHT=THREE.MOUSE.PAN; controls.mouseButtons.MIDDLE=THREE.MOUSE.DOLLY; controls.touches.TWO=THREE.TOUCH.DOLLY_PAN; controls.panSpeed=1.0; controls.keyPanSpeed=12;
if(controls.listenToKeyEvents){ controls.listenToKeyEvents(window); }
const helpEl=document.getElementById('help');
const isTouch=window.matchMedia('(pointer:coarse)').matches;
document.getElementById('help-touch').hidden=!isTouch; document.getElementById('help-mouse').hidden=isTouch;
document.getElementById('hint').textContent = isTouch ? 'Ein Finger = drehen · Zwei Finger = zoomen/verschieben · Teil antippen = Info' : 'Ziehen = drehen · Mausrad = zoomen · Rechte Taste = verschieben · Klick = Info';
function showHelp(){ helpEl.classList.add('on'); }
function hideHelp(){ helpEl.classList.remove('on'); try{ localStorage.setItem('kt40-help','1'); }catch(e){} }
document.getElementById('helpbtn').addEventListener('click',showHelp);
document.getElementById('help-close').addEventListener('click',hideHelp);
helpEl.addEventListener('click',e=>{ if(e.target===helpEl) hideHelp(); });
try{ if(!localStorage.getItem('kt40-help')) showHelp(); }catch(e){ showHelp(); }

/* ---------- Start ---------- */
resize(); if(location.hash==="#debug") window.__kt40={state,camera,controls,fitView,applyExplode,applyVisibility,renderer};
build(state.dn); syncSeg();
document.getElementById('loading').style.display='none';
requestAnimationFrame(loop);
})();
