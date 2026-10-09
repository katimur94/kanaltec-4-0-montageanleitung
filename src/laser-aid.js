import * as THREE from 'three';
import {PHASE} from './data.js';

// Laser-Positionierhilfe v3 (Prototyp-Vorschlag, nicht Teil der DiTom-Stückliste).
// Nach Nutzervorgaben vom 08./09.10.2026:
// - Unten nur eine kurze Verlängerung der Stützplatte mit gefedertem RAD DN70
//   (Schwinge, Druckfeder außen) und vergossenem Magnet-Drehgeber (AS5600).
//   Dort liegt alles dauerhaft im Abwasser: keine Elektronik-Box, kein Akku.
// - Die Laser sitzen als kleiner vergossener Laserkopf auf dem Zentralrohr,
//   über dem Wasser. Er hebt beim Anpressen mit an; in Längsrichtung bleibt die
//   Laserebene 15 mm hinter der hinteren Schildkante.
// - Spiralkabel: Messrad ↔ Laserkopf (dehnt sich beim Anpressen) und Laserkopf →
//   neue Steckdose an der Kabelbombe; von dort 4 freie Adern im Roboterkabel
//   (24 V, 0 V, RS-485 A/B) zum Bedienkasten im Fahrzeug.
// - Nullen per Knopf NULL am Bedienkasten, Restweg in mm auf der Anzeige.
// Ablauf: über den Anschluss, bis die rote Linie auf der Anschlussmitte steht,
// NULL drücken (Doppelblitz), festen Weg L zurück; grün blinkend, dann grün.
// Alle Maße sind Konstruktionsvorschläge bzw. Darstellungsannahmen.
export const laserSpec={
 x:-265,            // Laserebene, lokal: 15 mm hinter der hinteren Schildkante (x=-250)
 warn:15,tol:3,     // grün blinkt ab Ziel −15 mm, Dauergrün ±3 mm
 forwardEnd:.40,zeroAt:.52,holdEnd:.58
};
// Untere Baugruppe (Unterteil-Koordinaten: x längs, y hoch, z quer), gleich für alle DN.
export const heck={
 plate:{x0:-68,x1:-192,w:105,t:7,corner:6,notch:{x0:-128,z0:-45,z1:-16}},
 strap:{x0:-108,x1:-28,w:80,t:6,bolts:[[-48,-25],[-48,25],[-88,-25],[-88,25]]},
 block:{x0:-106,x1:-124,z0:-52,z1:-10,h:24,pivotH:12,base:4,slot:[-44,-16]},
 fork:{pivotX:-115,axleX:-170,armZ:[-41,-19],armT:4,armH:12,seat:{x0:-139,x1:-151,z0:-53,t:3}},
 wheel:{r:35,w:12,z:-30},
 spring:{x:-145,z:-47,od:12,wire:1,free:34,coils:8},
 bracket:{x0:-108,x1:-152,z0:-53,z1:-41,t:5,web:{x1:-118}},
 anchor:{x:-130,z:-47,h:3}   // Zugentlastung des Spiralkabels auf dem Federwinkel
};
// Laserkopf auf dem Zentralrohr (y relativ zur Rohrachse, die beim Anpressen um lift mitgeht).
export const laserHead={
 tubeR:10.6,x0:-252,x1:-292,w:44,y0:11,y1:50,corner:6,
 lasers:[{z:-9,color:'red'},{z:9,color:'green'}],laserR:6,laserL:30,
 clamps:[-258,-286],clampW:6,clampR:15,
 gland:{side:{x:-282,z:-25},rear:{x:-295,y:30}}
};
export const tubeTravelY=-70.56;
// Spiralkabel Messrad ↔ Laserkopf: 4 × 0,25 mm² PUR, Ruhelänge ca. 100 mm, Arbeitsbereich bis 400 mm.
export const spiralSpec={rest:100,min:100,max:400};
// Bohrungen der Verlängerungsplatte [x, z, Ø]: Lasche M6, Lagerbock M5/M4 (Senkschrauben von unten).
export const plateHoles=[[-88,-25,6.6],[-88,25,6.6],[-115,-48,5.5],[-115,-13,4.5]];
// Lichtfächer der Linienlaser: halber Öffnungswinkel am Scheitel (vom Rohrmittelpunkt aus).
export const laserFan={half:.62};
export function heckGeometry(R,bottom){
 const S=heck,top=bottom+3.5,pivot=V(S.fork.pivotX,top+S.block.pivotH,S.wheel.z);
 // Radmitte so, dass die äußere Radkante (|z| + Breite/2) gerade auf der gekrümmten Sohle liegt.
 const ze=Math.abs(S.wheel.z)+S.wheel.w/2,axle=V(S.fork.axleX,-(Math.sqrt(R*R-ze*ze)-S.wheel.r)-.2,S.wheel.z),contactY=axle.y-S.wheel.r;
 const bracketY=top+44;
 return{top,pivot,axle,contactY,bracketY,armAngle:Math.atan2(axle.y-pivot.y,axle.x-pivot.x),anchor:V(S.anchor.x,bracketY+S.bracket.t+S.anchor.h,S.anchor.z)};
}
// Spiralkabel-Endpunkte für eine Rohrachsen-Höhe (lift): unten Zugentlastung am Federwinkel, oben Seitenverschraubung am Laserkopf.
export function spiralEnds(R,bottom,lift){const g=heckGeometry(R,bottom),H=laserHead;return{a:g.anchor,b:V(H.gland.side.x,lift+H.y0+8,H.gland.side.z)};}
const clamp=THREE.MathUtils.clamp,smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);

// Fahrweg während PHASE.POSITION (f = 0..1). Ziel ist x = workOffset; die
// Laserlinie steht nach dem Überfahren genau über der Anschlussmitte (Welt-x 0).
export function laserTravel(f,workOffset=0){
 const start=workOffset-430,over=-laserSpec.x,L=over-workOffset;
 if(f<laserSpec.forwardEnd)return{x:start+(over-start)*smooth(f/laserSpec.forwardEnd),d:null,zeroed:false,L};
 if(f<laserSpec.holdEnd)return{x:over,d:f>=laserSpec.zeroAt?0:null,zeroed:f>=laserSpec.zeroAt,L};
 const p=(f-laserSpec.holdEnd)/(1-laserSpec.holdEnd),d=L*(1-Math.pow(1-p,2.2));
 return{x:over-d,d,zeroed:true,L};
}

// Anzeige wie in der Firmware: rot, Doppelblitz nach NULL, grün blinkend,
// grün, rot schnell blinkend bei Überfahren. clock = Sekunden für das Blinken.
export function laserState(time,workOffset=0,clock=0){
 const stage=Math.floor(time),f=time-stage,L=-laserSpec.x-workOffset;
 if(stage<PHASE.POSITION||stage>PHASE.BUMPER)return{visible:false,state:'off',d:null,L,red:false,green:false};
 if(stage===PHASE.BUMPER)return{visible:true,state:'target',d:L,L,red:false,green:true};
 const tr=laserTravel(f,workOffset);
 if(f>=laserSpec.zeroAt&&f<laserSpec.zeroAt+.04){const k=Math.floor((f-laserSpec.zeroAt)/.01);return{visible:true,state:'zero',d:0,L,red:k===1||k===3,green:false};}
 if(!tr.zeroed)return{visible:true,state:'start',d:null,L,red:true,green:false};
 const d=tr.d,state=d>L+laserSpec.tol?'over':d>=L-laserSpec.tol?'target':d>=L-laserSpec.warn?'warn':'red';
 const blink=((clock*4)%1+1)%1<.5,fast=((clock*6.25)%1+1)%1<.5;
 return{visible:true,state,d,L,red:state==='red'||(state==='over'&&fast),green:state==='target'||(state==='warn'&&blink)};
}

export function laserText(s){
 if(!s?.visible)return'Aus · nur beim Positionieren benötigt';
 const rest=s.d==null?null:Math.max(0,Math.round(s.L-s.d));
 return s.state==='start'?'Rot · Linie auf die Anschlussmitte fahren, dann NULL drücken':s.state==='zero'?'NULL gedrückt · Doppelblitz, jetzt zurückfahren':s.state==='red'?`Rot · zurückfahren, noch ${rest} mm`:s.state==='warn'?`Grün blinkt · noch ${rest} mm, langsam`:s.state==='target'?'Grün · Schildöffnung mittig unter dem Anschluss':'Rot blinkt · zu weit, wieder vor';
}

function cylinderBetween(a,b,r,m){const d=b.clone().sub(a),o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,1,16),m);placeBetween(o,a,b);o.castShadow=o.receiveShadow=true;return o;}
function placeBetween(o,a,b){const d=b.clone().sub(a);o.position.copy(a).add(b).multiplyScalar(.5);o.scale.y=Math.max(.001,d.length());o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());}
function rounded(x0,x1,z0,z1,r){const s=new THREE.Shape(),a=Math.min(x0,x1),b=Math.max(x0,x1),c=Math.min(z0,z1),d=Math.max(z0,z1);r=Math.min(r,(b-a)/2,(d-c)/2);
 // Shape-y = −z, damit nach rotateX(−90°) die Shape-Ebene in x/z liegt.
 s.moveTo(a+r,-c);s.lineTo(b-r,-c);s.quadraticCurveTo(b,-c,b,-c-r);s.lineTo(b,-d+r);s.quadraticCurveTo(b,-d,b-r,-d);s.lineTo(a+r,-d);s.quadraticCurveTo(a,-d,a,-d+r);s.lineTo(a,-c-r);s.quadraticCurveTo(a,-c,a+r,-c);return s;}
function slab(shape,y0,h,m,holes=[]){for(const [x,z,r] of holes){const p=new THREE.Path();p.absarc(x,-z,r,0,Math.PI*2,true);shape.holes.push(p);}
 const g=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,curveSegments:10});g.rotateX(-Math.PI/2);g.translate(0,y0,0);const o=new THREE.Mesh(g,m);o.castShadow=o.receiveShadow=true;return o;}
function boxAt(x0,x1,y0,y1,z0,z1,m){const o=new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1-x0),Math.abs(y1-y0),Math.abs(z1-z0)),m);o.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);o.castShadow=o.receiveShadow=true;return o;}
function cyl(r,len,m,p,axis='y',seg=24){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,seg),m);if(axis==='x')o.rotation.z=Math.PI/2;if(axis==='z')o.rotation.x=Math.PI/2;o.position.copy(p);o.castShadow=o.receiveShadow=true;return o;}
function screwHead(p,m,axis='y'){const g=new THREE.Group();g.add(cyl(4.6,5,m,V(),axis,16));g.position.copy(p);return g;}

export class LaserAid{
 constructor(R,bottom){
  // R: Rohrinnenradius, bottom: Höhe der Stützplatte (Mitte).
  this.R=R;this.bottom=bottom;this.group=new THREE.Group();this.group.name='Laser-Positionierhilfe';
  const S=heck,G=this.geo=heckGeometry(R,bottom),top=G.top,H=laserHead;
  const metal=new THREE.MeshStandardMaterial({color:'#adb7bf',metalness:.7,roughness:.32});
  const anod=new THREE.MeshStandardMaterial({color:'#4f5a62',metalness:.55,roughness:.38});
  const darkMetal=new THREE.MeshStandardMaterial({color:'#6c7a83',metalness:.7,roughness:.32});
  const bolt=new THREE.MeshStandardMaterial({color:'#75818c',metalness:.8,roughness:.22});
  const rubber=new THREE.MeshStandardMaterial({color:'#191e23',metalness:.02,roughness:.66});
  const glass=new THREE.MeshStandardMaterial({color:'#bfe3f5',metalness:0,roughness:.05,transparent:true,opacity:.35,depthWrite:false});
  const potting=new THREE.MeshStandardMaterial({color:'#20262b',metalness:.1,roughness:.5});
  const cableMat=new THREE.MeshStandardMaterial({color:'#15191c',roughness:.7});
  this.materials={metal,anod,darkMetal,bolt,rubber,glass,potting,cable:cableMat};
  this.parts={};const add=(key,o)=>{const g=new THREE.Group();g.name=key;g.add(o);this.group.add(g);this.parts[key]=g;return g;};
  // 1 Verlängerungsplatte mit offenem Radausschnitt, 2 Verbindungslasche unten.
  const p=S.plate,shape=new THREE.Shape(),n=p.notch,r=p.corner,hw=p.w/2;
  shape.moveTo(p.x0,hw);shape.lineTo(p.x1+r,hw);shape.quadraticCurveTo(p.x1,hw,p.x1,hw-r);
  shape.lineTo(p.x1,-n.z1);shape.lineTo(n.x0,-n.z1);shape.lineTo(n.x0,-n.z0);shape.lineTo(p.x1,-n.z0);
  shape.lineTo(p.x1,-hw+r);shape.quadraticCurveTo(p.x1,-hw,p.x1+r,-hw);shape.lineTo(p.x0,-hw);shape.lineTo(p.x0,hw);
  add('plate',slab(shape,bottom-p.t/2,p.t,metal,plateHoles.map(([x,z,d])=>[x,z,d/2])));
  const st=S.strap,strap=add('strap',slab(rounded(st.x0,st.x1,-st.w/2,st.w/2,4),bottom-p.t/2-st.t,st.t,darkMetal));
  for(const [x,z] of st.bolts)strap.add(screwHead(V(x,bottom-p.t/2-st.t-2.5,z),bolt));
  // 6 Lagerbock (Gabelkopf), 7 Federwinkel mit Zugentlastung, 8 Schwinge, 9 RAD DN70, 10 Feder, 11 Drehgeberkopf.
  const b=S.block,bk=new THREE.Group();bk.add(slab(rounded(b.x0,b.x1,b.z0,b.z1,2),top,b.base,metal),slab(rounded(b.x0,b.x1,b.z0,b.slot[0],1.5),top+b.base,b.h-b.base,metal),slab(rounded(b.x0,b.x1,b.slot[1],b.z1,1.5),top+b.base,b.h-b.base,metal));const block=add('block',bk);
  block.add(cyl(4,b.z1-b.z0+10,bolt,G.pivot.clone(),'z',16));
  const k=S.bracket,br=add('bracket',slab(rounded(k.x0,k.x1,k.z0,k.z1,2),G.bracketY,k.t,metal));br.add(boxAt(k.x0,k.web.x1,top+b.h,G.bracketY,k.z0,k.z1,metal));
  br.add(boxAt(S.anchor.x-5,S.anchor.x+5,G.bracketY+k.t,G.bracketY+k.t+S.anchor.h,k.z0+1,k.z1-1,darkMetal));
  const fork=new THREE.Group();fork.position.copy(G.pivot);
  const len=G.pivot.distanceTo(G.axle);
  for(const z of S.fork.armZ){const arm=boxAt(-6,len+8,-S.fork.armH/2,S.fork.armH/2,-S.fork.armT/2,S.fork.armT/2,metal);arm.position.z=z-S.wheel.z;fork.add(arm);}
  fork.add(boxAt(-6,6,-S.fork.armH/2,S.fork.armH/2,S.fork.armZ[0]-S.wheel.z,S.fork.armZ[1]-S.wheel.z,metal));
  // Federteller außen am Gabelarm (Schwinge liegt um ~180° gedreht: lokal −y = oben).
  const se=S.fork.seat;fork.add(boxAt(S.fork.pivotX-se.x0,S.fork.pivotX-se.x1,-S.fork.armH/2-se.t,-S.fork.armH/2,se.z0-S.wheel.z,S.fork.armZ[0]-S.fork.armT/2-S.wheel.z,metal));
  this.forkGroup=fork;add('fork',fork);
  const wheel=new THREE.Group();wheel.position.copy(G.axle);
  this.spin=new THREE.Group();wheel.add(this.spin);
  this.spin.add(cyl(S.wheel.r,S.wheel.w,rubber,V(),'z',40),cyl(11,S.wheel.w+1,darkMetal,V(),'z',24),cyl(3,S.wheel.w+1.4,new THREE.MeshStandardMaterial({color:'#c6302a',roughness:.5}),V(0,7,0),'z',12));
  wheel.add(cyl(4,S.fork.armZ[1]-S.fork.armZ[0]+S.fork.armT,bolt,V(),'z',16));
  this.wheel=wheel;add('wheel',wheel);this.wr=S.wheel.r;
  const sensor=new THREE.Group();sensor.add(cyl(8,9,potting,V(G.axle.x,G.axle.y,S.fork.armZ[0]-S.fork.armT/2-4.5),'z',24));add('sensor',sensor);
  this.springGroup=add('spring',new THREE.Group());
  // ---- Laserkopf auf dem Zentralrohr (hebt mit dem Rohr) ----
  const hd=new THREE.Group();hd.name='Laserkopf';
  hd.add(slab(rounded(H.x0,H.x1,-H.w/2,H.w/2,H.corner),H.y0,H.y1-H.y0-2,anod));
  hd.add(slab(rounded(H.x0-.5,H.x1+.5,-H.w/2-.5,H.w/2+.5,H.corner+.5),H.y1-2,2,glass));
  for(const cx of H.clamps){const ring=new THREE.Mesh(new THREE.CylinderGeometry(H.clampR,H.clampR,H.clampW,32,1,true),darkMetal);ring.rotation.z=Math.PI/2;ring.position.set(cx,0,0);hd.add(ring);
   const inner=new THREE.Mesh(new THREE.CylinderGeometry(H.tubeR+.3,H.tubeR+.3,H.clampW,32,1,true),darkMetal);inner.material=darkMetal.clone();inner.material.side=THREE.BackSide;inner.rotation.z=Math.PI/2;inner.position.set(cx,0,0);hd.add(inner);
   hd.add(boxAt(cx-H.clampW/2,cx+H.clampW/2,-H.clampR-5,-H.clampR+1,-6,6,darkMetal),cyl(2.6,12,bolt,V(cx,-H.clampR-2,0),'z',12));}
  this.lens=[];for(const l of H.lasers){
   const lens=new THREE.Mesh(new THREE.CircleGeometry(4.2,24),new THREE.MeshBasicMaterial({color:l.color==='red'?'#ff3a2a':'#2ee66a',toneMapped:false}));lens.rotation.x=-Math.PI/2;lens.position.set(laserSpec.x,H.y1-1.6,l.z);hd.add(lens);this.lens.push(lens);}
  hd.add(cyl(4,6,potting,V(H.gland.side.x,H.y0+8,-H.w/2-3),'z',16),cyl(4,6,potting,V(H.x1-3,H.gland.rear.y,0),'x',16));
  this.head=hd;add('head',hd);
  // ---- Spiralkabel (Geometrie in layout/pose) ----
  this.spiral=new THREE.Mesh(new THREE.BufferGeometry(),cableMat);this.spiral.name='Spiralkabel Messrad ↔ Laserkopf';this.group.add(this.spiral);
  this.feedSpiral=new THREE.Mesh(new THREE.BufferGeometry(),cableMat);this.feedSpiral.name='Spiralkabel Laserkopf → Kabelbombe';this.group.add(this.feedSpiral);
  this.sensorCable=new THREE.Mesh(new THREE.BufferGeometry(),cableMat);this.sensorCable.name='Sensorkabel';this.group.add(this.sensorCable);
  // ---- Laserlinie quer am Scheitel und Lichtfächer vom Laserkopf ----
  const half=laserFan.half,arc=[];for(let i=0;i<=48;i++){const a=-half+2*half*i/48;arc.push(V(laserSpec.x,(R-.8)*Math.cos(a),(R-.8)*Math.sin(a)));}
  const curve=new THREE.CatmullRomCurve3(arc);
  this.lineMaterial=new THREE.MeshBasicMaterial({color:'#ff3a2a',toneMapped:false});
  this.glowMaterial=new THREE.MeshBasicMaterial({color:'#ff3a2a',toneMapped:false,transparent:true,opacity:.28,depthWrite:false,blending:THREE.AdditiveBlending});
  this.line=new THREE.Mesh(new THREE.TubeGeometry(curve,96,2,8,false),this.lineMaterial);
  this.glow=new THREE.Mesh(new THREE.TubeGeometry(curve,96,7,8,false),this.glowMaterial);
  this.fanMaterial=new THREE.MeshBasicMaterial({color:'#ff3a2a',toneMapped:false,transparent:true,opacity:.05,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
  const fanGeo=new THREE.BufferGeometry(),nf=48,pos=new Float32Array((nf+2)*3),idx=[];
  for(let i=0;i<nf;i++)idx.push(0,i+1,i+2);fanGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));fanGeo.setIndex(idx);
  for(let i=0;i<=nf;i++){const a=-half+2*half*i/nf;pos.set([laserSpec.x,(R-1.2)*Math.cos(a),(R-1.2)*Math.sin(a)],(i+1)*3);}
  this.fanPos=pos;this.fan=new THREE.Mesh(fanGeo,this.fanMaterial);this.fan.frustumCulled=false;
  this.beam=new THREE.Group();this.beam.add(this.line,this.glow,this.fan);this.group.add(this.beam);
  this.explode=0;this.deflection=0;this.lift=tubeTravelY;this.poseKey=null;this.state={visible:false};this.layout();
 }
 // Federweg positiv = Rad nach oben eingefedert (z. B. an einer Muffe); lift = Höhe der Rohrachse.
 layout(){
  const S=heck,G=this.geo,H=laserHead,key=[this.explode,this.deflection,this.lift].join(',');if(key===this.poseKey)return;this.poseKey=key;
  const e=this.explode,off={plate:[0,0,0],strap:[0,-90,0],block:[0,45,0],bracket:[0,130,0],fork:[-60,30,0],wheel:[-130,0,0],sensor:[-130,0,-70],spring:[0,90,0],head:[-20,120,0]};
  for(const [k,g] of Object.entries(this.parts))g.position.set(...(off[k]||[0,0,0]).map(v=>v*e));
  this.parts.head.position.y+=this.lift;
  const len=G.pivot.distanceTo(G.axle),dy=clamp(G.axle.y+this.deflection-G.pivot.y,-.9*len,.9*len),dx=-Math.sqrt(len*len-dy*dy);
  const axle=V(G.pivot.x+dx,G.pivot.y+dy,S.wheel.z);this.forkGroup.rotation.set(0,0,Math.atan2(dy,dx));
  this.wheel.position.copy(axle);this.parts.sensor.children[0].children[0].position.set(axle.x,axle.y,S.fork.armZ[0]-S.fork.armT/2-4.5);
  // Feder außen neben dem Rad: vom Federteller der Schwinge bis unter den Federwinkel.
  const sx=S.spring.x,t=(G.pivot.x-sx)/(G.pivot.x-axle.x),armTop=G.pivot.y+(axle.y-G.pivot.y)*t+S.fork.armH/2+S.fork.seat.t,y1=G.bracketY,pts=[];
  for(let i=0;i<=160;i++){const u=i/160,a=u*Math.PI*2*S.spring.coils;pts.push(V(sx+S.spring.od/2*Math.cos(a),armTop+(y1-armTop)*u,S.spring.z+S.spring.od/2*Math.sin(a)));}
  const sg=this.springGroup;sg.clear();sg.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),240,S.spring.wire/2,6,false),this.materials.bolt));
  const cables=e===0;this.spiral.visible=this.feedSpiral.visible=this.sensorCable.visible=cables;
  if(cables){
   // Sensorkabel: vom Drehgeberkopf außen am Arm entlang zur Zugentlastung auf dem Federwinkel.
   const sp=axle.clone();sp.z=S.fork.armZ[0]-S.fork.armT/2-8;const an=G.anchor.clone();
   this.sensorCable.geometry.dispose();this.sensorCable.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([sp,V(sp.x+8,sp.y+10,-55),V(an.x-10,an.y+2,-55),an]),48,2,6,false);
   // Spiralkabel Messrad ↔ Laserkopf: gleiche Windungszahl, Steigung wächst mit dem Abstand.
   const {a,b}=spiralEnds(this.R,this.bottom,this.lift);const axis=b.clone().sub(a),L=axis.length(),dir=axis.clone().normalize();
   const u=V(0,0,1).cross(dir).normalize(),w=dir.clone().cross(u).normalize(),turns=22,rad=5,sp2=[];
   for(let i=0;i<=turns*16;i++){const q=i/(turns*16),ang=q*turns*Math.PI*2,end=Math.min(1,Math.min(q,1-q)*12);sp2.push(a.clone().addScaledVector(dir,q*L).addScaledVector(u,rad*end*Math.cos(ang)).addScaledVector(w,rad*end*Math.sin(ang)));}
   this.spiral.geometry.dispose();this.spiral.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sp2),turns*24,1.6,6,false);this.spiralLength=L;
   // Spiralkabel Laserkopf → Kabelbombe: hinten am Kopf, ein Stück nach hinten, weiter am Roboter entlang.
   const r0=V(H.x1-6,this.lift+H.gland.rear.y,0),r1=V(-372,this.lift+44,4),fp=[];const fd=r1.clone().sub(r0),fl=fd.length();fd.normalize();const fu=V(0,1,0).cross(fd).normalize().cross(fd).normalize(),fw=fd.clone().cross(fu);
   for(let i=0;i<=10*16;i++){const q=i/160,ang=q*10*Math.PI*2,end=Math.min(1,Math.min(q,1-q)*10);fp.push(r0.clone().addScaledVector(fd,q*fl).addScaledVector(fu,5*end*Math.cos(ang)).addScaledVector(fw,5*end*Math.sin(ang)));}
   this.feedSpiral.geometry.dispose();this.feedSpiral.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fp),240,1.6,6,false);
  }
  // Laserfächer beginnt auf dem Laserkopf.
  this.fanPos.set([laserSpec.x,this.lift+H.y1,0],0);this.fan.geometry.attributes.position.needsUpdate=true;
  this.armTop=armTop;this.axle=axle;
 }
 setExplode(e){this.explode=e;this.layout();}
 setDeflection(d){this.deflection=d;this.layout();}
 setLift(l){this.lift=l;this.layout();}
 setCut(cut){const planes=cut?[new THREE.Plane(V(0,0,-1),0)]:null;for(const m of [this.lineMaterial,this.glowMaterial,this.fanMaterial]){m.clippingPlanes=planes;m.needsUpdate=true;}}
 // lift: Höhe der Rohrachse (Laserkopf und Spiralkabel gehen mit), travel: Fahrweg fürs Messrad.
 pose(lift,travel,state){
  this.state=state;this.lift=lift;this.layout();
  this.spin.rotation.z=-travel/this.wr;
  const on=state.visible&&(state.red||state.green)&&this.explode===0,color=state.green?'#2ee66a':'#ff3a2a';
  this.beam.visible=on;
  if(on)for(const m of [this.lineMaterial,this.glowMaterial,this.fanMaterial])m.color.set(color);
  this.lens[0].material.color.set(state.visible&&state.red?'#ff3a2a':'#5a1d18');
  this.lens[1].material.color.set(state.visible&&state.green?'#2ee66a':'#173f22');
 }
}
