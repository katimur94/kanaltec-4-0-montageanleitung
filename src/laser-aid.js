import * as THREE from 'three';
import {PHASE} from './data.js';

// Laser-Positionierhilfe als Heckmodul (Prototyp-Vorschlag, nicht Teil der
// DiTom-Stückliste). Nach Nutzervorgabe vom 08.10.2026 komplett am Unterteil:
// Die Stützplatte wird nach hinten verlängert (Verbindungslasche unten), hinten
// sitzt wie vorne ein RAD DN70 – hier in einer gefederten Schwinge, damit Muffen
// und Versätze das Rad nicht beschädigen. Im Rad ein Magnet, am Gabelarm ein
// vergossener Magnet-Drehgeber (AS5600). Auf der Verlängerung: flaches
// Messgehäuse (Akku, ESP32) und ein Laserturm mit zwei Linienlasern rot/grün.
// Das Unterteil hebt sich beim Anpressen nicht – Laser und Rad bleiben ruhig.
// Die Laserlinie liegt quer am Scheitel. Ablauf beim Positionieren:
// über den Anschluss fahren, bis die rote Linie auf der Anschlussmitte steht,
// 2 s Stillstand nullt den Zähler (Doppelblitz), dann den festen Weg L zurück;
// Vorwarnung grün blinkend, Ziel dauerhaft grün. Maße sind Darstellungsannahmen.
export const laserSpec={
 x:-265,            // Laserlinie, lokal: 15 mm hinter der hinteren Schildkante (x=-250)
 warn:15,tol:3,     // grün blinkt ab Ziel −15 mm, Dauergrün ±3 mm
 forwardEnd:.40,zeroAt:.52,holdEnd:.58
};
// Maße des Heckmoduls in mm (Unterteil-Koordinaten: x längs, y hoch, z quer).
// Gleich für alle DN; nur die Höhe der Radachse folgt der Rohrsohle.
export const heck={
 plate:{x0:-68,x1:-292,w:105,t:7,corner:6,notch:{x0:-228,z0:-45,z1:-16}},
 strap:{x0:-108,x1:-28,w:80,t:6,bolts:[[-48,-25],[-48,25],[-88,-25],[-88,25]]},
 housing:{x0:-95,x1:-202,w:96,h:28,lid:3},
 channel:{x0:-202,x1:-250,z0:18,z1:42,h:12},
 tower:{x0:-250,x1:-282,z0:14,z1:46,h:46,laserZ:[22,38]},
 block:{x0:-206,x1:-224,z0:-52,z1:-10,h:24,pivotH:12,base:4,slot:[-44,-16]},
 fork:{pivotX:-215,axleX:-270,armZ:[-41,-19],armT:4,armH:12,seat:{x0:-239,x1:-251,z0:-53,t:3}},
 wheel:{r:35,w:12,z:-30},
 spring:{x:-245,z:-47,od:12,wire:1,free:34,coils:8},
 bracket:{x0:-208,x1:-252,z0:-53,z1:-41,t:5,web:{x1:-218}}
};
// Bohrungen der Verlängerungsplatte [x, z, Ø]: Lasche M6, Gehäuse/Turm M5 und
// Lagerbock M5/M4 jeweils von unten (Senkschrauben). Der Ø ist der Kernloch-/Durchgangs-Ø im Modell.
export const plateHoles=[[-88,-25,6.6],[-88,25,6.6],[-150,-38,5.5],[-150,38,5.5],[-195,-38,5.5],[-195,38,5.5],[-256,30,5.5],[-276,30,5.5],[-215,-48,5.5],[-215,-13,4.5]];
// Lichtfächer der Linienlaser (halber Öffnungswinkel am Scheitel, vom Rohrmittelpunkt
// gemessen) und das beim Positionieren abgesenkte Zentralrohr in der Laserebene.
export const laserFan={half:.62,tube:{y:-70.56,r:10.6}};
// Sichtbare Winkelbereiche [a0, a1] der Linie am Scheitel für einen Laser bei z = zL.
export function laserVisible(R,top,zL,y0=top+heck.tower.h){
 const {half,tube}=laserFan,N=600,out=[];let cur=null;
 for(let i=0;i<=N;i++){const a=-half+2*half*i/N,cz=R*Math.sin(a),cy=R*Math.cos(a),dz=cz-zL,dy=cy-y0;
  const t=Math.min(1,Math.max(0,(-zL*dz+(tube.y-y0)*dy)/(dz*dz+dy*dy))),ok=Math.hypot(zL+t*dz,y0+t*dy-tube.y)>tube.r;
  if(ok){if(!cur){cur=[a,a];out.push(cur);}cur[1]=a;}else cur=null;}
 return out;
}
export function heckGeometry(R,bottom){
 const S=heck,top=bottom+3.5,pivot=V(S.fork.pivotX,top+S.block.pivotH,S.wheel.z);
 // Radmitte so, dass das Rad die gekrümmte Sohle gerade berührt (radialer Kontakt).
 // Die äußere Radkante (|z| + Breite/2) liegt auf der Sohle, die innere knapp darüber.
 const ze=Math.abs(S.wheel.z)+S.wheel.w/2,axle=V(S.fork.axleX,-(Math.sqrt(R*R-ze*ze)-S.wheel.r)-.2,S.wheel.z),contactY=axle.y-S.wheel.r;
 const bracketY=top+44;
 return{top,pivot,axle,contactY,bracketY,armAngle:Math.atan2(axle.y-pivot.y,axle.x-pivot.x),towerTop:top+S.tower.h,housingTop:top+S.housing.h};
}
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

// Anzeige wie in der Firmware: rot, Doppelblitz beim Nullen, grün blinkend,
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
 return s.state==='start'?'Rot · Linie auf die Anschlussmitte fahren':s.state==='zero'?'Doppelblitz · Messrad genullt, jetzt zurückfahren':s.state==='red'?`Rot · zurückfahren, noch ${rest} mm`:s.state==='warn'?`Grün blinkt · noch ${rest} mm, langsam`:s.state==='target'?'Grün · Schildöffnung mittig unter dem Anschluss':'Rot blinkt · zu weit, wieder vor';
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
  // R: Rohrinnenradius (Viewer.radius + 12), bottom: Höhe der Stützplatte (Mitte).
  this.R=R;this.bottom=bottom;this.group=new THREE.Group();this.group.name='Laser-Positionierhilfe · Heckmodul';
  const S=heck,G=this.geo=heckGeometry(R,bottom),top=G.top;
  const metal=new THREE.MeshStandardMaterial({color:'#adb7bf',metalness:.7,roughness:.32});
  const anod=new THREE.MeshStandardMaterial({color:'#4f5a62',metalness:.55,roughness:.38});
  const darkMetal=new THREE.MeshStandardMaterial({color:'#6c7a83',metalness:.7,roughness:.32});
  const bolt=new THREE.MeshStandardMaterial({color:'#75818c',metalness:.8,roughness:.22});
  const rubber=new THREE.MeshStandardMaterial({color:'#191e23',metalness:.02,roughness:.66});
  const glass=new THREE.MeshStandardMaterial({color:'#bfe3f5',metalness:0,roughness:.05,transparent:true,opacity:.35,depthWrite:false});
  const potting=new THREE.MeshStandardMaterial({color:'#20262b',metalness:.1,roughness:.5});
  this.materials={metal,anod,darkMetal,bolt,rubber,glass,potting};
  this.parts={};const add=(key,o)=>{const g=new THREE.Group();g.name=key;g.add(o);this.group.add(g);this.parts[key]=g;return g;};
  // 1 Verlängerungsplatte mit offenem Radausschnitt, 2 Verbindungslasche unten.
  const p=S.plate,shape=new THREE.Shape(),n=p.notch,r=p.corner,hw=p.w/2;
  shape.moveTo(p.x0,hw);shape.lineTo(p.x1+r,hw);shape.quadraticCurveTo(p.x1,hw,p.x1,hw-r);
  shape.lineTo(p.x1,-n.z1+0);shape.lineTo(n.x0,-n.z1);shape.lineTo(n.x0,-n.z0);shape.lineTo(p.x1,-n.z0);
  shape.lineTo(p.x1,-hw+r);shape.quadraticCurveTo(p.x1,-hw,p.x1+r,-hw);shape.lineTo(p.x0,-hw);shape.lineTo(p.x0,hw);
  const holes=plateHoles.map(([x,z,d])=>[x,z,d/2]);
  add('plate',slab(shape,bottom-p.t/2,p.t,metal,holes));
  const st=S.strap,strap=add('strap',slab(rounded(st.x0,st.x1,-st.w/2,st.w/2,4),bottom-p.t/2-st.t,st.t,darkMetal));
  for(const [x,z] of st.bolts)strap.add(screwHead(V(x,bottom-p.t/2-st.t-2.5,z),bolt));
  // 3 Messgehäuse (Alu, eloxiert) mit Deckel, Ladebuchse und Status-LED.
  const h=S.housing,hous=new THREE.Group();
  hous.add(slab(rounded(h.x0,h.x1,-h.w/2,h.w/2,8),top,h.h-h.lid,anod));
  hous.add(slab(rounded(h.x0-1,h.x1+1,-h.w/2-1,h.w/2+1,9),top+h.h-h.lid,h.lid,darkMetal));
  for(const [x,z] of [[h.x0-8,-h.w/2+8],[h.x0-8,h.w/2-8],[h.x1+8,-h.w/2+8],[h.x1+8,h.w/2-8]])hous.add(cyl(3,1.2,bolt,V(x,top+h.h+.6,z)));
  hous.add(cyl(5,6,potting,V(h.x0-20,top+12,-h.w/2-2),'z'));
  const led=new THREE.Mesh(new THREE.CircleGeometry(2.4,16),new THREE.MeshBasicMaterial({color:'#2ee66a',toneMapped:false}));led.rotation.x=-Math.PI/2;led.position.set(h.x0-16,top+h.h+.05,0);hous.add(led);
  add('housing',hous);
  // 4 Kabelkanal zum Laserturm, 5 Laserturm mit Glasfenster und zwei Lasern.
  const c=S.channel;add('channel',slab(rounded(c.x0,c.x1,c.z0,c.z1,3),top,c.h,anod));
  const tw=S.tower,tower=new THREE.Group();
  tower.add(slab(rounded(tw.x0,tw.x1,tw.z0,tw.z1,5),top,tw.h-2,anod));
  tower.add(slab(rounded(tw.x0-1,tw.x1+1,tw.z0-1,tw.z1+1,6),top+tw.h-2,2,glass));
  this.lens=[];for(const [z,color] of [[tw.laserZ[0],'#ff3a2a'],[tw.laserZ[1],'#2ee66a']]){
   tower.add(cyl(6,30,metal,V(laserSpec.x,top+tw.h-17,z)));
   const lens=new THREE.Mesh(new THREE.CircleGeometry(4.2,24),new THREE.MeshBasicMaterial({color,toneMapped:false}));lens.rotation.x=-Math.PI/2;lens.position.set(laserSpec.x,top+tw.h-1.6,z);tower.add(lens);this.lens.push(lens);}
  add('tower',tower);
  // 6 Lagerbock, 7 Federwinkel, 8 Schwinge (Gabel), 9 RAD DN70, 10 Druckfeder, 11 Drehgeberkopf.
  // Lagerbock als Gabelkopf: Boden 4 mm, zwei Wangen, Schlitz für die Schwinge.
  const b=S.block,bk=new THREE.Group();bk.add(slab(rounded(b.x0,b.x1,b.z0,b.z1,2),top,b.base,metal),slab(rounded(b.x0,b.x1,b.z0,b.slot[0],1.5),top+b.base,b.h-b.base,metal),slab(rounded(b.x0,b.x1,b.slot[1],b.z1,1.5),top+b.base,b.h-b.base,metal));const block=add('block',bk);
  block.add(cyl(4,b.z1-b.z0+10,bolt,G.pivot.clone(),'z',16));
  const k=S.bracket,br=add('bracket',slab(rounded(k.x0,k.x1,k.z0,k.z1,2),G.bracketY,k.t,metal));br.add(boxAt(k.x0,k.web.x1,top+b.h,G.bracketY,k.z0,k.z1,metal));
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
  // Druckfeder zwischen Schwinge und Federwinkel (Federweg für Muffen und Versätze).
  this.springGroup=add('spring',new THREE.Group());
  this.cable=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshStandardMaterial({color:'#15191c',roughness:.7}));this.group.add(this.cable);
  // ---- Laserlinie quer am Scheitel und Lichtfächer vom Laserturm ----
  // Das abgesenkte Zentralrohr steht in der Laserebene und wirft je nach DN eine
  // Schattenlücke auf den Scheitel; Linie und Fächer werden dort unterbrochen.
  const half=laserFan.half,zF=(tw.z0+tw.z1)/2,vis=laserVisible(R,top,zF);
  this.lineMaterial=new THREE.MeshBasicMaterial({color:'#ff3a2a',toneMapped:false});
  this.glowMaterial=new THREE.MeshBasicMaterial({color:'#ff3a2a',toneMapped:false,transparent:true,opacity:.28,depthWrite:false,blending:THREE.AdditiveBlending});
  this.beam=new THREE.Group();this.lines=[];
  for(const [a0,a1] of vis){if(a1-a0<.01)continue;const arc=[],k=Math.max(4,Math.ceil((a1-a0)/(2*half)*48));for(let i=0;i<=k;i++){const a=a0+(a1-a0)*i/k;arc.push(V(laserSpec.x,(R-.8)*Math.cos(a),(R-.8)*Math.sin(a)));}
   const curve=new THREE.CatmullRomCurve3(arc),line=new THREE.Mesh(new THREE.TubeGeometry(curve,2*k,2,8,false),this.lineMaterial),glow=new THREE.Mesh(new THREE.TubeGeometry(curve,2*k,7,8,false),this.glowMaterial);
   this.lines.push(line);this.beam.add(line,glow);}
  this.line=this.lines[0];this.visibleArcs=vis;
  this.fanMaterial=new THREE.MeshBasicMaterial({color:'#ff3a2a',toneMapped:false,transparent:true,opacity:.05,depthWrite:false,side:THREE.FrontSide,blending:THREE.AdditiveBlending});
  const fanGeo=new THREE.BufferGeometry(),nf=96,pos=new Float32Array((nf+2)*3),idx=[],seen=a=>vis.some(([a0,a1])=>a>=a0-1e-9&&a<=a1+1e-9);
  pos.set([laserSpec.x,G.towerTop,zF],0);for(let i=0;i<=nf;i++){const a=-half+2*half*i/nf;pos.set([laserSpec.x,(R-1.2)*Math.cos(a),(R-1.2)*Math.sin(a)],(i+1)*3);if(i<nf&&seen(a)&&seen(-half+2*half*(i+1)/nf))idx.push(0,i+1,i+2);}
  fanGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));fanGeo.setIndex(idx);
  this.fan=new THREE.Mesh(fanGeo,this.fanMaterial);this.fan.frustumCulled=false;
  this.beam.add(this.fan);this.group.add(this.beam);
  this.explode=0;this.deflection=0;this.poseKey=null;this.state={visible:false};this.layout();
 }
 // Federweg: positiv = Rad nach oben eingefedert (z. B. an einer Muffe).
 layout(){
  const S=heck,G=this.geo,key=[this.explode,this.deflection].join(',');if(key===this.poseKey)return;this.poseKey=key;
  const e=this.explode,off={plate:[0,0,0],strap:[0,-90,0],housing:[0,95,0],channel:[0,60,0],tower:[0,150,0],block:[0,45,0],bracket:[0,140,0],fork:[-70,30,0],wheel:[-150,0,0],sensor:[-150,0,-70],spring:[0,95,0]};
  for(const [k,g] of Object.entries(this.parts))g.position.set(...(off[k]||[0,0,0]).map(v=>v*e));
  // Schwinge um den Lagerbolzen, Rad folgt dem Federweg.
  const len=G.pivot.distanceTo(G.axle),dy=clamp(G.axle.y+this.deflection-G.pivot.y,-.9*len,.9*len),dx=-Math.sqrt(len*len-dy*dy);
  const axle=V(G.pivot.x+dx,G.pivot.y+dy,S.wheel.z);this.forkGroup.rotation.set(0,0,Math.atan2(dy,dx));
  this.wheel.position.copy(axle);this.parts.sensor.children[0].children[0].position.set(axle.x,axle.y,S.fork.armZ[0]-S.fork.armT/2-4.5);
  // Feder außen neben dem Rad: vom Federteller der Schwinge bis unter den Federwinkel.
  const sx=S.spring.x,t=(G.pivot.x-sx)/(G.pivot.x-axle.x),armTop=G.pivot.y+(axle.y-G.pivot.y)*t+S.fork.armH/2+S.fork.seat.t,y1=G.bracketY,pts=[];
  for(let i=0;i<=160;i++){const u=i/160,a=u*Math.PI*2*8;pts.push(V(sx+S.spring.od/2*Math.cos(a),armTop+(y1-armTop)*u,S.spring.z+S.spring.od/2*Math.sin(a)));}
  const sg=this.springGroup;sg.clear();sg.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),240,S.spring.wire/2,6,false),this.materials.bolt));
  // Kabel vom Drehgeberkopf am Gabelarm entlang ins Messgehäuse.
  // Außen an Wange und Federwinkel vorbei, durch die Rückwand ins Gehäuse.
  const sp=axle.clone();sp.z=S.fork.armZ[0]-S.fork.armT/2-8;const mid=V(G.pivot.x,G.pivot.y+4,-56),ex=V(S.housing.x1+3,G.top+8,-42);
  this.cable.geometry.dispose();this.cable.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([sp,V((sp.x+mid.x)/2,G.pivot.y+6,-56),mid,V(S.block.x0+2,G.top+8,-54),ex]),64,2,6,false);
  this.cable.visible=e===0;this.cable.position.set(0,0,0);
  this.armTop=armTop;this.axle=axle;
 }
 setExplode(e){this.explode=e;this.layout();}
 setDeflection(d){this.deflection=d;this.layout();}
 setCut(cut){const planes=cut?[new THREE.Plane(V(0,0,-1),0)]:null;for(const m of [this.lineMaterial,this.glowMaterial,this.fanMaterial]){m.clippingPlanes=planes;m.needsUpdate=true;}}
 // lift wird nicht mehr gebraucht: das Heckmodul sitzt am Unterteil.
 pose(lift,travel,state){
  this.state=state;this.layout();
  this.spin.rotation.z=-travel/this.wr;
  const on=state.visible&&(state.red||state.green)&&this.explode===0,color=state.green?'#2ee66a':'#ff3a2a';
  this.beam.visible=on;
  if(on)for(const m of [this.lineMaterial,this.glowMaterial,this.fanMaterial])m.color.set(color);
  this.lens[0].material.color.set(state.visible&&state.red?'#ff3a2a':'#5a1d18');
  this.lens[1].material.color.set(state.visible&&state.green?'#2ee66a':'#173f22');
 }
}
