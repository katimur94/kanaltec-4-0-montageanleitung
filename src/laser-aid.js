import * as THREE from 'three';
import {PHASE} from './data.js';

// Laser-Positionierhilfe (Prototyp-Vorschlag vom 08.10.2026, nicht Teil der
// DiTom-Stückliste): Hauptbox mit zwei Linienlasern (rot/grün) auf dem
// Zentralrohr hinter dem Schild, Messrad mit Drehgeber an der Rohrwand bei
// 4–5 Uhr. Die Schwinge des Messrads ist an der Stützplatte des Unterteils
// gelagert, weil sich das Zentralrohr beim Anpressen um bis zu ca. 80 mm hebt
// und ein dort gelagertes Rad den Wandkontakt verlieren würde. Die Laserlinie liegt quer am Scheitel. Ablauf beim Positionieren:
// über den Anschluss fahren, bis die rote Linie auf der Anschlussmitte steht,
// 2 s Stillstand nullt den Zähler (Doppelblitz), dann den festen Weg L zurück;
// Vorwarnung grün blinkend, Ziel dauerhaft grün. Maße sind Darstellungsannahmen.
export const laserSpec={
 x:-275,            // Laserlinie, lokal: 25 mm hinter der hinteren Schildkante (x=-250)
 boxX:-265,boxLen:80,boxW:100,boxH:48,
 wheelX:-110,wheelR:200/(2*Math.PI),wheelW:12,contact:40*Math.PI/180,
 warn:15,tol:3,     // grün blinkt ab Ziel −15 mm, Dauergrün ±3 mm
 forwardEnd:.40,zeroAt:.52,holdEnd:.58
};
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

function cylinderBetween(a,b,r,m){const d=b.clone().sub(a),o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,1,16),m);o.position.copy(a).add(b).multiplyScalar(.5);o.scale.y=Math.max(.001,d.length());o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());o.castShadow=o.receiveShadow=true;return o;}
function placeBetween(o,a,b){const d=b.clone().sub(a);o.position.copy(a).add(b).multiplyScalar(.5);o.scale.y=Math.max(.001,d.length());o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());}

export class LaserAid{
 constructor(R,bottom){
  // R: Rohrinnenradius (Viewer.radius + 12), bottom: Höhe der Stützplatte.
  this.R=R;this.bottom=bottom;this.group=new THREE.Group();this.group.name='Laser-Positionierhilfe';
  const S=laserSpec;
  const body=new THREE.MeshStandardMaterial({color:'#39444c',metalness:.2,roughness:.55});
  const lid=new THREE.MeshStandardMaterial({color:'#cfe3ee',metalness:0,roughness:.08,transparent:true,opacity:.32,depthWrite:false});
  const steel=new THREE.MeshStandardMaterial({color:'#b8c2c8',metalness:.85,roughness:.28});
  const alu=new THREE.MeshStandardMaterial({color:'#c9cfd2',metalness:.7,roughness:.35});
  const rubber=new THREE.MeshStandardMaterial({color:'#1b1f22',metalness:0,roughness:.75});
  this.materials={body,lid,steel,alu,rubber};
  // ---- Hauptbox auf dem Zentralrohr (hebt sich mit der oberen Baugruppe) ----
  this.upper=new THREE.Group();this.group.add(this.upper);
  const tubeTop=10.6,h=S.boxH;
  const shell=new THREE.Mesh(new THREE.BoxGeometry(S.boxLen,h-6,S.boxW),body);shell.position.set(S.boxX,tubeTop+(h-6)/2,0);
  const cover=new THREE.Mesh(new THREE.BoxGeometry(S.boxLen+2,6,S.boxW+2),lid);cover.position.set(S.boxX,tubeTop+h-3,0);
  this.upper.add(shell,cover);shell.castShadow=shell.receiveShadow=true;
  for(const dx of [-24,24]){const ring=new THREE.Mesh(new THREE.TorusGeometry(11.8,1.3,8,40),steel);ring.rotation.y=Math.PI/2;ring.position.set(S.boxX+dx,0,0);this.upper.add(ring);}
  const gland=new THREE.Mesh(new THREE.CylinderGeometry(6,6,9,20),new THREE.MeshStandardMaterial({color:'#2b3238',roughness:.6}));gland.rotation.z=Math.PI/2;gland.position.set(S.boxX+S.boxLen/2+4,tubeTop+16,-30);this.upper.add(gland);
  this.glandPoint=V(S.boxX+S.boxLen/2+8,tubeTop+16,-30);
  // Zwei Linienlaser nebeneinander quer zur Rohrachse, Strahl senkrecht nach oben.
  this.emitterY=tubeTop+h+1;this.lens=[];
  for(const [z,color] of [[-11,'#ff3a2a'],[11,'#2ee66a']]){
   const can=new THREE.Mesh(new THREE.CylinderGeometry(6,6,30,24),alu);can.position.set(S.x,tubeTop+h-15,z);this.upper.add(can);
   const lens=new THREE.Mesh(new THREE.CircleGeometry(4.2,24),new THREE.MeshBasicMaterial({color,toneMapped:false}));lens.rotation.x=-Math.PI/2;lens.position.set(S.x,tubeTop+h+.4,z);this.upper.add(lens);this.lens.push(lens);
  }
  // ---- Laserlinie quer am Scheitel und Lichtfächer ----
  const half=.62,arc=[];for(let i=0;i<=48;i++){const a=-half+2*half*i/48;arc.push(V(S.x,(R-.8)*Math.cos(a),(R-.8)*Math.sin(a)));}
  const curve=new THREE.CatmullRomCurve3(arc);
  this.lineMaterial=new THREE.MeshBasicMaterial({color:'#ff3a2a',toneMapped:false});
  this.glowMaterial=new THREE.MeshBasicMaterial({color:'#ff3a2a',toneMapped:false,transparent:true,opacity:.28,depthWrite:false,blending:THREE.AdditiveBlending});
  this.line=new THREE.Mesh(new THREE.TubeGeometry(curve,96,2,8,false),this.lineMaterial);
  this.glow=new THREE.Mesh(new THREE.TubeGeometry(curve,96,7,8,false),this.glowMaterial);
  this.fanMaterial=new THREE.MeshBasicMaterial({color:'#ff3a2a',toneMapped:false,transparent:true,opacity:.05,depthWrite:false,side:THREE.FrontSide,blending:THREE.AdditiveBlending});
  const fanGeo=new THREE.BufferGeometry(),n=24,pos=new Float32Array((n+2)*3),idx=[];
  for(let i=0;i<n;i++)idx.push(0,i+1,i+2);fanGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));fanGeo.setIndex(idx);
  this.fan=new THREE.Mesh(fanGeo,this.fanMaterial);this.fan.frustumCulled=false;this.fanCount=n;this.fanHalf=half;
  this.beam=new THREE.Group();this.beam.add(this.line,this.glow,this.fan);this.group.add(this.beam);
  // ---- Messrad an der Rohrwand (Schwinge mit Zugfeder) ----
  this.wr=S.wheelR;
  const rc=R-this.wr,phi=S.contact;this.rc=rc;
  // Lager auf einem Winkel an der hinteren Kante der Stützplatte (hebt sich nicht).
  this.pivot=V(-72,bottom+14,-40);this.contactCentre=V(S.wheelX,-rc*Math.sin(phi),-rc*Math.cos(phi));
  const bracket=new THREE.Mesh(new THREE.BoxGeometry(18,22,30),alu);bracket.position.set(-72,bottom+9,-40);bracket.castShadow=true;
  this.wheel=new THREE.Group();
  const tread=new THREE.Mesh(new THREE.CylinderGeometry(this.wr,this.wr,S.wheelW,40),rubber);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(this.wr*.72,this.wr*.72,S.wheelW+1,40),alu);
  const marks=new THREE.Group();for(let i=0;i<4;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(this.wr*1.3,S.wheelW+1.6,2.4),new THREE.MeshStandardMaterial({color:'#e9b23b',roughness:.5}));m.rotation.y=i*Math.PI/4;marks.add(m);}
  this.spin=new THREE.Group();this.spin.add(tread,hub,marks);this.wheel.add(this.spin);
  this.encoder=new THREE.Mesh(new THREE.BoxGeometry(38,30,40),body);
  this.arm=cylinderBetween(V(),V(0,1,0),3.2,alu);
  this.spring=new THREE.Mesh(new THREE.BufferGeometry(),steel);
  this.cable=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshStandardMaterial({color:'#15191c',roughness:.7}));
  this.pivotPin=new THREE.Mesh(new THREE.CylinderGeometry(4,4,10,16),steel);this.pivotPin.rotation.x=Math.PI/2;
  this.group.add(this.wheel,this.encoder,this.arm,this.spring,this.cable,this.pivotPin,bracket);
  for(const o of [tread,hub,this.encoder])o.castShadow=o.receiveShadow=true;
  this.poseKey=null;this.state={visible:false};
 }
 setCut(cut){const planes=cut?[new THREE.Plane(V(0,0,-1),0)]:null;for(const m of [this.lineMaterial,this.glowMaterial,this.fanMaterial]){m.clippingPlanes=planes;m.needsUpdate=true;}}
 // lift: Hub der oberen Baugruppe, travel: Fahrweg (model.position.x) für das Rad.
 pose(lift,travel,state){
  const S=laserSpec;this.upper.position.y=lift;this.state=state;
  const key=lift.toFixed(3);
  if(this.poseKey!==key){
   this.poseKey=key;
   // Schwinge: Lager an der Stützplatte, Zugfeder drückt das Rad an die Wand.
   const C=this.contactCentre.clone(),n=V(0,C.y,C.z).normalize(),axle=V(0,-n.z,n.y);if(axle.y<0)axle.negate();
   this.wheel.position.copy(C);this.wheel.quaternion.setFromUnitVectors(V(0,1,0),axle);
   const box=C.clone().addScaledVector(axle,S.wheelW/2+21);this.encoder.position.copy(box);this.encoder.quaternion.copy(this.wheel.quaternion);
   const pivot=this.pivot.clone();this.pivotPin.position.copy(pivot);
   placeBetween(this.arm,pivot,box);
   // Zugfeder vom Arm zum Zentralrohr.
   const s0=pivot.clone().lerp(box,.55),s1=V(-72,this.bottom+16,-6),dir=s1.clone().sub(s0),len=dir.length();dir.normalize();
   const side=V(1,0,0).cross(dir).normalize();if(side.lengthSq()<.1)side.set(0,1,0);const up=dir.clone().cross(side).normalize(),pts=[s0.clone()];
   for(let i=0;i<=120;i++){const t=i/120,an=t*Math.PI*2*11,c=s0.clone().addScaledVector(dir,len*(.12+.76*t));pts.push(c.addScaledVector(side,2.6*Math.cos(an)).addScaledVector(up,2.6*Math.sin(an)));}pts.push(s1.clone());
   this.spring.geometry.dispose();this.spring.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),180,.55,5,false);
   // Kabel vom Drehgeber zur Kabelverschraubung der Hauptbox.
   const g=this.glandPoint.clone();g.y+=lift;const mid=box.clone().lerp(g,.5);mid.y=Math.min(box.y,g.y)-6;
   this.cable.geometry.dispose();this.cable.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([box.clone().add(V(-6,0,0)),mid,g]),40,2.2,6,false);
   // Lichtfächer vom Laser zur Scheitellinie.
   const p=this.fan.geometry.attributes.position;p.setXYZ(0,S.x,this.emitterY+lift,0);
   for(let i=0;i<=this.fanCount;i++){const an=-this.fanHalf+2*this.fanHalf*i/this.fanCount;p.setXYZ(i+1,S.x,(this.R-1.2)*Math.cos(an),(this.R-1.2)*Math.sin(an));}
   p.needsUpdate=true;this.fan.geometry.computeBoundingSphere();
  }
  this.spin.rotation.y=-travel/this.wr;
  const on=state.visible&&(state.red||state.green),color=state.green?'#2ee66a':'#ff3a2a';
  this.beam.visible=on;
  if(on)for(const m of [this.lineMaterial,this.glowMaterial,this.fanMaterial])m.color.set(color);
  this.lens[0].material.color.set(state.visible&&state.red?'#ff3a2a':'#5a1d18');
  this.lens[1].material.color.set(state.visible&&state.green?'#2ee66a':'#173f22');
 }
}
