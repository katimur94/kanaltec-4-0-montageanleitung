import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
const mat=(color,metalness=.7,roughness=.3)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
function mesh(geometry,material,p=V()){const o=new THREE.Mesh(geometry,material);o.position.copy(p);o.castShadow=o.receiveShadow=true;return o;}
function cyl(r,l,m,p=V(),axis='x',segments=48){const o=mesh(new THREE.CylinderGeometry(r,r,l,segments),m,p);if(axis==='x')o.rotation.z=Math.PI/2;else if(axis==='z')o.rotation.x=Math.PI/2;return o;}
function ring(r,t,m,p=V(),axis='x'){const o=mesh(new THREE.TorusGeometry(r,t,8,64),m,p);if(axis==='x')o.rotation.y=Math.PI/2;else if(axis==='y')o.rotation.x=Math.PI/2;return o;}
function plate(w,h,d,m,holes=[],bevel=.7){const r=Math.min(4,w/6,h/6),x=-w/2,y=-h/2,s=new THREE.Shape();s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);for(const[a,b,c]of holes){const p=new THREE.Path();p.absarc(a,b,c,0,TAU,true);s.holes.push(p);}const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2,curveSegments:Math.min(w,h)<15?3:12});g.translate(0,0,-d/2);return mesh(g,m);}
function box(w,h,d,m,p=V(),bevel=.7){const o=plate(w,h,d,m,[],bevel);o.position.copy(p);return o;}
function tube(points,r,m,n=80){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),n,r,8,false),m);}
function rod(a,b,r,m){const d=b.clone().sub(a),o=cyl(r,d.length(),m,a.clone().add(b).multiplyScalar(.5),'y');o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return o;}
function bolt(r,m,black,p,axis='z'){const g=new THREE.Group();g.position.copy(p);g.add(cyl(r,2.4,m,V(),'z',24),cyl(r*.53,2.55,black,V(),'z',6));if(axis==='x')g.rotation.y=Math.PI/2;else if(axis==='y')g.rotation.x=Math.PI/2;return g;}
function bake(group){group.updateMatrixWorld(true);const batches=new Map(),inv=group.matrixWorld.clone().invert();group.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(inv.clone().multiply(o.matrixWorld));for(const key of Object.keys(g.attributes))if(!['position','normal','uv'].includes(key))g.deleteAttribute(key);const a=batches.get(o.material)||[];a.push(g);batches.set(o.material,a);o.geometry.dispose();});group.clear();for(const[m,list]of batches){const g=mergeGeometries(list,false);list.forEach(x=>x.dispose());if(g)group.add(mesh(g,m));}}
function rubber(color){const m=mat(color,.02,.87),a=new Uint8Array(64*64*4);let s=17;for(let i=0;i<4096;i++){s=(Math.imul(s,1664525)+1013904223)>>>0;const c=115+(s>>>27);a.set([c,c,c,255],i*4);}const t=new THREE.DataTexture(a,64,64);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(5,3);t.needsUpdate=true;m.bumpMap=t;m.bumpScale=.22;return m;}

// IBAK brochure pp.16–17 specifies attachment ranges, not a dimensioned wheel
// matrix. Dimensions below are photo-derived model parameters, NOT IBAK setup
// specifications. The T66/T76/PANORAMO wheel chart must not be applied here.
export const robotConfigurations={
 300:{kit:'base',label:'Grundfahrwagen · PUR-Profilräder',range:'DN 200–300',radius:68,width:28,track:92,tread:'pur'},
 400:{kit:'medium',label:'Fahrwagenzusatz DN 350–600 · schmale Spur',range:'DN 350–600',radius:96,width:48,track:112,tread:'pneumatic'},
 500:{kit:'medium',label:'Fahrwagenzusatz DN 350–600 · mittlere Spur',range:'DN 350–600',radius:106,width:54,track:145,tread:'pneumatic'},
 600:{kit:'medium',label:'Fahrwagenzusatz DN 350–600 · breite Spur',range:'DN 350–600',radius:112,width:60,track:178,tread:'pneumatic'},
 700:{kit:'large',label:'Fahrwagenzusatz DN 600–800 · großer Radsatz',range:'DN 600–800',radius:148,width:76,track:215,tread:'pneumatic'}
};
export class Robot{
 constructor(pipeRadius,anchor){
  this.config=robotConfigurations[Math.round(pipeRadius*2)]||robotConfigurations[400];this.anchor=anchor.clone();this.pipeRadius=pipeRadius;this.group=new THREE.Group();this.group.name='IBAK MicroGator';this.group.position.copy(anchor);
  this.m={steel:mat('#b1bdc6',.82,.28),polished:mat('#d1d6d8',.87,.22),dark:mat('#252c32',.58,.34),black:mat('#11171b',.16,.5),rim:mat('#bdc6cc',.87,.24),pur:rubber('#703c2a'),tire:rubber('#24292a'),blue:mat('#087eb2',.12,.36),yellow:mat('#d3a719',.12,.4),glass:mat('#061b24',.7,.12),gasket:mat('#050809',.03,.72),brass:mat('#ba9d5f',.72,.3)};
  this.ledMaterial=new THREE.MeshStandardMaterial({color:'#edf7e9',emissive:'#dceee1',emissiveIntensity:1.5,roughness:.2});this.wheelRadius=this.config.radius;this.track=this.config.track;this.bodyY=-18-anchor.y;
  this.carrier=new THREE.Group();this.group.add(this.carrier);
  this.chassis=new THREE.Group();this.chassis.name='Fahrwagengehäuse';this.carrier.add(this.chassis);this.wheels=[];
  for(const x of [-940,-575])for(const side of [-1,1]){const w=this.makeWheel(side);w.position.set(x,0,side*this.track);this.wheels.push(w);}
  // Solve contact over all tread corners and sidewalls for every wheel angle.
  let wheelWorldY=-Infinity;for(const w of this.wheels){w.updateMatrixWorld(true);w.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){const p=V().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld),radial=Math.hypot(p.x-w.position.x,p.y);wheelWorldY=Math.max(wheelWorldY,-Math.sqrt(pipeRadius**2-p.z**2)+radial);}});}
  this.wheelY=wheelWorldY+.65-anchor.y;this.axleDrop=this.bodyY-this.wheelY;for(const w of this.wheels){w.position.y=this.wheelY;this.carrier.add(w);}
  this.buildChassis();this.buildExtension();bake(this.chassis);this.buildCamera();this.buildArm();this.lines=[];
  for(const[side,m]of [[-1,this.m.blue],[1,this.m.yellow]]){const o=tube([V(-1235,this.bodyY,side*30),V(-970,this.bodyY+65,side*40),V(-20,18,side*33)],2.7,m);this.group.add(o);this.lines.push({o,side});}this.pose(0,0);
 }
 makeWheel(side){
  const g=new THREE.Group(),m=this.m,r=this.wheelRadius,w=this.config.width,pur=this.config.tread==='pur',t=pur?m.pur:m.tire;g.name='Antriebsrad';
  const profile=pur?[[r*.48,-w/2],[r-6,-w/2],[r-3,-w*.34],[r-3,w*.34],[r-6,w/2],[r*.48,w/2],[r*.48,-w/2]]:[[r*.43,-w*.46],[r*.68,-w*.53],[r*.85,-w*.43],[r-5,-w*.27],[r-3,0],[r-5,w*.27],[r*.85,w*.43],[r*.68,w*.53],[r*.43,w*.46],[r*.43,-w*.46]];
  const tire=mesh(new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),96),t);tire.rotation.x=Math.PI/2;g.add(tire);const rim=pur?r*.73:r*.5;
  g.add(cyl(rim,w-12,m.rim,V(),'z'),cyl(18,w+6,m.dark,V(),'z'),cyl(12,w+7,m.steel,V(),'z'));
  for(const s of [-1,1]){
   const section=[[17,w/2+1],[rim*.48,w/2-5],[rim*.82,w/2-4],[rim-3,w/2+.8],[rim,w/2+.8],[rim,w/2-5],[17,w/2-5]].map(([r,z])=>new THREE.Vector2(r,s*z));if(s<0)section.reverse();
   const dish=mesh(new THREE.LatheGeometry(section,64),m.polished);dish.rotation.x=Math.PI/2;g.add(dish,ring(rim-2,1.2,m.polished,V(0,0,s*(w/2+.8)),'z'),ring(17,.8,m.gasket,V(0,0,s*(w/2+3)),'z'));
   for(let i=0;i<3;i++){const a=i*TAU/3+Math.PI/2;g.add(bolt(3.5,m.polished,m.gasket,V(rim*.6*Math.cos(a),rim*.6*Math.sin(a),s*(w/2-2))));}
   if(!pur)g.add(cyl(2.4,10,m.brass,V(rim*.72,0,s*(w/2+2)),'z',12),cyl(3,4,m.black,V(rim*.72,0,s*(w/2+7)),'z',12));
  }
  if(pur){for(let i=0;i<30;i++){const a=i*TAU/30,o=box(7,9,w-1,t,V((r-3)*Math.cos(a),(r-3)*Math.sin(a),0),.45);o.rotation.z=a;g.add(o);}}
  else{for(let row=0;row<4;row++)for(let i=0;i<40;i++){const a=(i+(row%2)*.5)*TAU/40,z=(row-1.5)*w*.19,rr=r-3-Math.abs(row-1.5)*1.5,o=box(7,r*.078,w*.23,t,V(rr*Math.cos(a),rr*Math.sin(a),z),.9);o.rotation.set(0,(row<2?1:-1)*.28,a);g.add(o);}for(const s of [-1,1])g.add(ring(r*.79,.45,m.black,V(0,0,s*w*.46),'z'));}
  bake(g);return g;
 }
 buildChassis(){
  const g=this.chassis,m=this.m,y=this.bodyY;g.add(box(490,82,102,m.dark,V(-747,y-4,0),2));
  for(const side of [-1,1]){
   const p=plate(472,70,7,m.steel,[[-213,-19,3],[213,-19,3],[-213,19,3],[213,19,3]]);p.position.set(-747,y-5,side*55);g.add(p);const mid=plate(197,59,3,m.polished,[[-88,-21,2.8],[-88,21,2.8],[88,-21,2.8],[88,21,2.8]]);mid.position.set(-750,y-6,side*60);g.add(mid);
   for(const x of [-960,-845,-658,-534])for(const dy of [-23,17])g.add(bolt(3.5,m.polished,m.gasket,V(x,y+dy,side*64)));
   for(const x of [-940,-575]){g.add(cyl(32,21,m.polished,V(x,y,side*64),'z'),cyl(25,9,m.dark,V(x,y,side*78),'z'));for(let i=0;i<6;i++){const a=i*TAU/6;g.add(bolt(3,m.steel,m.gasket,V(x+27*Math.cos(a),y+27*Math.sin(a),side*76)));}}
   g.add(box(448,8,8,m.polished,V(-750,y-44,side*49)),box(447,4,5,m.steel,V(-749,y+50,side*49)));
  }
  g.add(box(434,26,95,m.black,V(-749,y+47,0),4));
  for(const x of [-950,-825,-675,-545]){const p=plate(29,100,5,m.dark,[[-7,-38,2.6],[7,38,2.6]]);p.rotation.x=-Math.PI/2;p.position.set(x,y+63,0);g.add(p);for(const z of [-38,38])g.add(bolt(3,m.steel,m.gasket,V(x,y+66,z),'y'));}
  const hook=plate(37,61,8,m.dark,[[0,10,9]],1);hook.position.set(-870,y+76,0);hook.rotation.z=-.32;g.add(hook,cyl(9,21,m.steel,V(-872,y+55,0),'z'));
  // 150 mm front body envelope and discrete rotary seals.
  for(const[x,l,r,ma]of [[-462,62,74,m.steel],[-420,21,75,m.polished],[-397,23,70,m.dark],[-376,17,68,m.steel]])g.add(cyl(r,l,ma,V(x,y,0)));
  for(const x of [-487,-445,-431,-410,-389])g.add(ring(x===-389?69:74.7,.65,m.gasket,V(x,y,0)));
  for(let i=0;i<12;i++){const a=i*TAU/12;g.add(bolt(3,m.polished,m.gasket,V(-366,y+58*Math.cos(a),58*Math.sin(a)),'x'));}
  for(const side of [-1,1])g.add(box(96,90,17,m.steel,V(-1050,y,side*47),3));
  g.add(box(82,24,111,m.polished,V(-1050,y+44,0)),box(82,24,111,m.polished,V(-1050,y-44,0)),cyl(18,109,m.dark,V(-1060,y,0),'z'));
  for(const side of [-1,1])g.add(bolt(13,m.steel,m.gasket,V(-1060,y,side*58)),ring(19,1,m.dark,V(-1060,y,side*56),'z'));
  for(const[x,l,r,ma]of [[-1124,65,46,m.polished],[-1199,97,43,m.steel],[-1260,30,24,m.dark],[-1284,33,16,m.gasket]])g.add(cyl(r,l,ma,V(x,y,0)));
  for(const x of [-1100,-1147,-1160,-1238])g.add(ring(44,.8,m.gasket,V(x,y,0)));for(let i=0;i<6;i++){const a=i*TAU/6;g.add(bolt(3,m.steel,m.gasket,V(-1248,y+33*Math.cos(a),33*Math.sin(a)),'x'));}
  for(const x of [-1290,-1298,-1306,-1314])g.add(ring(12,1.5,m.black,V(x,y,0)));g.add(tube([V(-1300,y,0),V(-1375,y-8,-5),V(-1430,this.wheelY-this.wheelRadius+20,-5)],7,m.black));
 }
 buildExtension(){
  const m=this.m,y=this.bodyY,wy=this.wheelY,drop=y-wy,e=new THREE.Group();e.name=this.config.label;this.extension=e;this.chassis.add(e);
  for(const side of [-1,1])for(const x of [-940,-575]){
   if(this.config.kit==='base'){e.add(cyl(23,this.track-75,m.polished,V(x,wy,side*(75+(this.track-75)/2)),'z'),cyl(29,9,m.dark,V(x,wy,side*78),'z'));continue;}
   const p=plate(88,drop+72,22,m.dark,[[0,drop/2,15],[0,-drop/2,17]],2);p.position.set(x,(y+wy)/2,side*87);e.add(p);const cover=plate(73,drop+59,3,m.black,[[0,drop/2,12],[0,-drop/2,14]],.5);cover.position.set(x,(y+wy)/2,side*101);e.add(cover);
   for(const yy of [y,wy]){e.add(cyl(30,8,m.steel,V(x,yy,side*105),'z'),ring(25,1,m.gasket,V(x,yy,side*110),'z'));for(const dx of [-28,28])e.add(bolt(3.8,m.steel,m.gasket,V(x+dx,yy,side*105)));}
   e.add(box(78,17,36,m.steel,V(x,y+37,side*88),1.5),rod(V(x-24,y+47,side*94),V(x+24,y+47,side*94),3,m.polished),cyl(21,this.track-103,m.polished,V(x,wy,side*(103+(this.track-103)/2)),'z'));
   for(let d=113;d<this.track-15;d+=17)e.add(ring(22,.7,m.dark,V(x,wy,side*d),'z'));e.add(cyl(27,10,m.steel,V(x,wy,side*(this.track-this.config.width/2-6)),'z'));
  }
  if(this.config.kit!=='base')for(const side of [-1,1]){e.add(box(367,19,22,m.steel,V(-757,(y+wy)/2-15,side*88),1.2));for(const x of [-921,-595])e.add(bolt(4,m.steel,m.gasket,V(x,(y+wy)/2-15,side*102)));}
  if(this.config.kit==='large'){for(const x of [-940,-575]){e.add(cyl(16,2*this.track-50,m.steel,V(x,wy,0),'z'));for(const side of [-1,1])e.add(rod(V(x-35,y-25,side*80),V(x+25,wy+24,side*(this.track-40)),8,m.steel));}for(const side of [-1,1])e.add(box(440,38,28,m.dark,V(-757,wy+35,side*(this.track-48)),2));}
 }
 buildCamera(){
  // CutterCam reference: two transverse drums, not a longitudinal bullet camera.
  // Front optics sit on the curved pan/tilt drum beneath a stepped metal bridge.
  const m=this.m,y=this.bodyY,g=new THREE.Group();this.cameraHead=g;g.name='CutterCam · Schwenkkopf, vier LED und Reinigung';g.position.set(-306,y+36,0);this.carrier.add(g);
  g.add(cyl(28,61,m.black,V(-39,0,0),'z'),cyl(25,67,m.dark,V(-39,0,0),'z'));
  for(const z of [-32,32])g.add(ring(23,.7,m.gasket,V(-39,0,z),'z'),bolt(5,m.steel,m.gasket,V(-39,0,z)));
  const bridgeShape=new THREE.Shape();bridgeShape.moveTo(-61,-22);bridgeShape.lineTo(-22,-22);bridgeShape.lineTo(-14,-34);bridgeShape.lineTo(13,-34);bridgeShape.quadraticCurveTo(20,-34,20,-27);bridgeShape.lineTo(20,27);bridgeShape.quadraticCurveTo(20,34,13,34);bridgeShape.lineTo(-14,34);bridgeShape.lineTo(-22,22);bridgeShape.lineTo(-61,22);bridgeShape.closePath();
  for(const[x,z,r]of [[-37,0,4.5],[-14,0,3.3],[7,-14,4],[7,14,4]]){const h=new THREE.Path();h.absarc(x,z,r,0,TAU,true);bridgeShape.holes.push(h);}
  const bridgeGeo=new THREE.ExtrudeGeometry(bridgeShape,{depth:7,bevelEnabled:true,bevelSize:.7,bevelThickness:.7,bevelSegments:2,curveSegments:16});bridgeGeo.rotateX(-Math.PI/2);g.add(mesh(bridgeGeo,m.steel,V(0,32,0)),box(19,7,25,m.dark,V(-61,34,0)));
  for(const side of [-1,1]){
   g.add(cyl(5,63,m.polished,V(-17,29,side*30)),cyl(7,13,m.dark,V(-50,29,side*30)),cyl(3.6,8,m.brass,V(-42,29,side*34),'z',12));
   g.add(tube([V(-52,27,side*32),V(-48,36,side*37),V(-36,32,side*39),V(-30,16,side*35),V(-11,10,side*34)],1.7,m.blue,40));
  }
  // Low cradle belongs to the rotating front module, with no elevated stalk.
  g.add(box(63,9,56,m.steel,V(-30,-29,0),1),box(37,13,44,m.dark,V(-42,-39,0),2));bake(g);
  const drum=new THREE.Group();drum.position.x=18;g.add(drum);this.cameraDrum=drum;
  const profile=[[0,-35],[27,-35],[33,-33],[37,-28],[38,-20],[38,20],[37,28],[33,33],[27,35],[0,35]].map(([r,z])=>new THREE.Vector2(r,z));
  const shell=mesh(new THREE.LatheGeometry(profile,96),m.black);shell.rotation.x=Math.PI/2;drum.add(shell);
  for(const side of [-1,1]){drum.add(cyl(27,1.8,m.dark,V(0,0,side*35),'z'),ring(26,.65,m.gasket,V(0,0,side*36),'z'),cyl(9,3,m.dark,V(0,0,side*36),'z'));for(const a of [.5,2.6,4.5])drum.add(bolt(2.4,m.steel,m.gasket,V(22*Math.cos(a),22*Math.sin(a),side*36)));drum.add(ring(38,.4,m.gasket,V(0,0,side*21),'z'));}
  const bezel=plate(25,14,1.6,m.gasket,[],1);bezel.rotation.y=Math.PI/2;bezel.position.set(38,0,0);const window=plate(20,9,1,m.glass,[],.5);window.rotation.y=Math.PI/2;window.position.set(39,0,0);drum.add(bezel,window);
  this.cameraLEDs=[];
  for(const yy of [-16,16])for(const z of [-10,10]){const x=Math.sqrt(38**2-yy**2),normal=V(x,yy,0).normalize(),led=new THREE.Group();led.position.set(x,yy,z);led.quaternion.setFromUnitVectors(V(1,0,0),normal);led.add(cyl(4.4,2,m.steel),cyl(3.3,2.2,this.ledMaterial,V(1,0,0)));drum.add(led);this.cameraLEDs.push(led.position.clone());}
  for(const yy of [-8,8])for(const z of [-18,18])drum.add(bolt(1.9,m.steel,m.gasket,V(37,yy,z),'x'));
  drum.add(tube([V(-12,5,-33),V(10,0,-38),V(30,-1,-31),V(39,-1,-19)],1.6,m.black,40),box(3,17,4,m.dark,V(40,-1,-16),.5));bake(drum);
  this.cameraEye=new THREE.Object3D();this.cameraEye.position.set(40,0,0);drum.add(this.cameraEye);
  const coil=[];for(let i=0;i<=420;i++){const t=i/420,a=t*TAU*7;coil.push(V(-401+t*74,y+49+13*Math.cos(a),-43+10*Math.sin(a)));}this.carrier.add(tube(coil,2.2,m.black,220));
 }
 buildArm(){
  // Long side rockers and parallel lower guides, with the fourth/tool-tilt axis
  // at the nose. No serial elbow. Unmeasured linkage sizes follow the photos.
  const m=this.m,y=this.bodyY;this.pivot=V(-334,y-7,0);this.armLength=Math.hypot(291,this.pivot.y);this.axisSpacing=44;this.links=[];this.joints=[];
  const root=new THREE.Group();root.name='Drehmodul · seitliche Hubachsen';
  for(const side of [-1,1]){const cheek=plate(64,91,15,m.steel,[[-10,21,10],[-10,-23,9]],3);cheek.position.set(-324,y-28,side*49);root.add(cheek,cyl(19,17,m.dark,V(-334,y-7,side*53),'z'),cyl(15,17,m.dark,V(-334,y-51,side*53),'z'));for(const yy of [y-7,y-51])root.add(bolt(7,m.polished,m.gasket,V(-334,yy,side*63)));}
  root.add(box(57,11,94,m.steel,V(-333,y-70,0),2));bake(root);this.carrier.add(root);
  for(const side of [-1,1]){
   const l=this.armLength,g=new THREE.Group();g.name='Durchgehende seitliche Hubschwinge';
   const s=new THREE.Shape();s.moveTo(0,-19);s.bezierCurveTo(-26,-19,-26,19,0,19);s.lineTo(38,15);s.lineTo(l-46,12);s.lineTo(l-16,18);s.bezierCurveTo(l+24,26,l+28,-24,l-12,-20);s.lineTo(l-48,-13);s.lineTo(43,-12);s.closePath();
   for(const x of [0,l]){const h=new THREE.Path();h.absarc(x,0,8.5,0,TAU,true);s.holes.push(h);}
   const geometry=new THREE.ExtrudeGeometry(s,{depth:12,bevelEnabled:true,bevelSize:1.2,bevelThickness:1.2,bevelSegments:3,curveSegments:24});geometry.translate(0,0,-6);g.add(mesh(geometry,m.dark));
   for(const x of [0,l]){g.add(cyl(14,15,m.steel,V(x,0,0),'z'),ring(11,.9,m.gasket,V(x,0,side*8),'z'),bolt(7,m.polished,m.gasket,V(x,0,side*10)));}
   for(const x of [39,l-38])g.add(bolt(2.6,m.steel,m.gasket,V(x,0,side*7)));
   bake(g);this.group.add(g);this.links.push({o:g,side,lower:false});
   const lower=new THREE.Group();lower.name='Parallele untere Führung';lower.add(cyl(8.5,l-32,m.polished,V(l/2,0,0)),cyl(11,18,m.steel,V(26,0,0)),cyl(11,18,m.steel,V(l-26,0,0)));
   for(const x of [0,l])lower.add(box(27,23,14,m.steel,V(x,0,0),2),cyl(9,20,m.dark,V(x,0,0),'z'),bolt(5,m.polished,m.gasket,V(x,0,side*12)));
   bake(lower);this.group.add(lower);this.links.push({o:lower,side,lower:true});
  }
  this.actuators=[];for(const side of [-1,1]){const body=cyl(10,125,m.steel),shaft=cyl(5,1,m.polished),capA=cyl(12,12,m.dark),capB=cyl(11,7,m.dark);this.group.add(body,shaft,capA,capB);this.actuators.push({body,shaft,capA,capB,side});}
  this.receiver=new THREE.Group();this.receiver.name='Vierte Achse · Werkzeugaufnahme mit Klappvorrichtung';this.group.add(this.receiver);
  const back=plate(58,88,28,m.dark,[[0,-24,8.2],[0,24,8.2]],1);back.rotation.y=Math.PI/2;back.position.x=-28;this.receiver.add(back);
  for(const side of [-1,1]){const cheek=plate(37,67,11,m.steel,[[0,22,7],[0,-22,7]],2);cheek.position.set(-43,-22,side*44);this.receiver.add(cheek,box(26,88,13,m.steel,V(-16,0,side*22.5)),box(4,88,19,m.dark,V(-6,0,side*19.5)));for(const yy of [-34,34])this.receiver.add(bolt(4,m.polished,m.gasket,V(-4,yy,side*23),'x'));}
  this.receiver.add(cyl(14,107,m.steel,V(-43,0,0),'z'),cyl(10,94,m.steel,V(-43,-44,0),'z'));
  // Dedicated tilt-drive housing on the front transverse axis.
  this.receiver.add(cyl(22,12,m.dark,V(-43,0,-64),'z'),ring(19,.7,m.gasket,V(-43,0,-71),'z'));
  for(let i=0;i<6;i++){const a=i*TAU/6;this.receiver.add(bolt(2.4,m.steel,m.gasket,V(-43+16*Math.cos(a),16*Math.sin(a),-71)));}
  bake(this.receiver);this.coupling=new THREE.Object3D();this.coupling.position.set(-12,0,0);this.receiver.add(this.coupling);
 }
 pose(lift,travel){
  // Keeping the shield at the connection requires a small longitudinal rolling
  // compensation as the fixed-length rockers swing. The chassis never rises.
  const dy=lift-this.pivot.y,dx=291-Math.sqrt(this.armLength**2-dy**2);
  this.carrier.position.x=dx;for(const w of this.wheels)w.rotation.z=-(travel+dx)/this.wheelRadius;
  if(this.lastLift===lift)return;this.lastLift=lift;this.receiver.position.y=lift;
  const a=this.pivot.clone().add(V(dx,0,0)),e=V(-43,lift,0),lowerA=a.clone().add(V(0,-this.axisSpacing,0)),lowerE=e.clone().add(V(0,-this.axisSpacing,0));this.armPoints=[a,e,lowerA,lowerE];
  for(const{o,side,lower}of this.links){const from=lower?lowerA:a,to=lower?lowerE:e;o.position.copy(from);o.position.z=side*(lower?38:49);o.rotation.z=Math.atan2(to.y-from.y,to.x-from.x);}
  for(const{body,shaft,capA,capB,side}of this.actuators){const from=lowerA.clone().add(V(10,4,side*21)),to=e.clone().add(V(-17,-17,side*21)),axis=to.clone().sub(from).normalize(),distance=from.distanceTo(to),q=new THREE.Quaternion().setFromUnitVectors(V(0,1,0),axis);body.position.copy(from).addScaledVector(axis,62.5);body.quaternion.copy(q);shaft.scale.y=distance-113;shaft.position.copy(from).addScaledVector(axis,113+(distance-113)/2);shaft.quaternion.copy(q);capA.position.copy(from);capA.quaternion.copy(q);capB.position.copy(from).addScaledVector(axis,123);capB.quaternion.copy(q);}
  this.cameraDrum.rotation.z=Math.atan2(this.pipeRadius-65+lift-(this.anchor.y+this.bodyY+36),630);
  for(const{o,side}of this.lines){o.geometry.dispose();o.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-1235+dx,this.bodyY+20,side*30),V(-1080+dx,this.bodyY+45,side*39),V(-970+dx,this.bodyY+68,side*38),V(-535+dx,this.bodyY+68,side*43),V(-350+dx,this.bodyY+46,side*64),a.clone().lerp(e,.62).add(V(0,24,side*65)),V(-20,lift+18,side*33)]),96,2.7,10,false);}
 }
 dispose(){const materials=new Set(),textures=new Set();this.group.traverse(o=>{if(o.isMesh){materials.add(o.material);if(o.material.bumpMap)textures.add(o.material.bumpMap);}});textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());}
}
