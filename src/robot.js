import * as THREE from 'three';

const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const TAU=Math.PI*2;
const material=(color,metalness=.65,roughness=.34)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
function mesh(g,m,p=V()){const o=new THREE.Mesh(g,m);o.position.copy(p);o.castShadow=o.receiveShadow=true;return o;}
function box(x,y,z,m,p=V()){return mesh(new THREE.BoxGeometry(x,y,z),m,p);}
function cylinder(r,length,m,p=V(),axis='x',segments=48){const o=mesh(new THREE.CylinderGeometry(r,r,length,segments),m,p);if(axis==='x')o.rotation.z=Math.PI/2;else if(axis==='z')o.rotation.x=Math.PI/2;return o;}
function tube(points,r,m){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,r,8,false),m);}
function plate(w,h,d,m,holes=[]){const s=new THREE.Shape();s.moveTo(-w/2,-h/2);s.lineTo(w/2,-h/2);s.lineTo(w/2,h/2);s.lineTo(-w/2,h/2);s.closePath();for(const[x,y,r]of holes){const p=new THREE.Path();p.absarc(x,y,r,0,TAU,true);s.holes.push(p);}const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:24});g.translate(0,0,-d/2);return mesh(g,m);}
function link(length,width,depth,m){const r=width/2,s=new THREE.Shape();s.moveTo(0,r);s.lineTo(length,r);s.absarc(length,0,r,Math.PI/2,-Math.PI/2,true);s.lineTo(0,-r);s.absarc(0,0,r,-Math.PI/2,Math.PI/2,true);const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:16});g.translate(0,0,-depth/2);return mesh(g,m);}
function placeLink(o,a,b){o.position.copy(a);o.rotation.z=Math.atan2(b.y-a.y,b.x-a.x);}

// Photo reconstruction, not an additional DiTom BOM group. Envelope and layout
// are cross-checked against IBAK's MicroGator brochure; unmeasured details,
// wheel kits and the tool receiver are illustrative. There is no cutting head.
export class Robot {
 constructor(pipeRadius,anchor){
  this.group=new THREE.Group();this.group.name='IBAK-Roboter';this.anchor=anchor.clone();this.group.position.copy(anchor);
  this.m={steel:material('#aab5bf',.83,.3),dark:material('#20262c',.45,.4),rim:material('#8f9ba6',.86,.25),tire:material('#4b211b',.04,.84),black:material('#0b1117',.08,.52),blue:material('#087eb7',.08,.38),yellow:material('#e4b917',.1,.45),glass:material('#07171c',.4,.12)};
  const m=this.m;this.wheelRadius=pipeRadius<180?58:68;this.track=pipeRadius<180?66:84;
  this.wheelY=-Math.sqrt(pipeRadius**2-(this.track+16)**2)+this.wheelRadius+1-anchor.y;
  this.bodyY=Math.max(this.wheelY+anchor.y+12,-145)-anchor.y;
  const y=this.bodyY;this.chassis=new THREE.Group();this.group.add(this.chassis);
  this.chassis.add(cylinder(62,566,m.dark,V(-710,y,0)));
  for(const[x,len,r]of [[-992,42,64],[-420,74,67],[-906,16,65],[-511,16,65]])this.chassis.add(cylinder(r,len,m.steel,V(x,y,0)));
  this.chassis.add(cylinder(48,72,m.dark,V(-1048,y,0)),cylinder(41,12,m.steel,V(-1083,y,0)),cylinder(26,30,m.black,V(-1100,y,0)));
  // Two long removable black covers, folded metal rails and visible fasteners.
  for(const x of [-813,-609]){
   const top=plate(187,68,5,m.dark,[[-82,-24,2.5],[-82,24,2.5],[82,-24,2.5],[82,24,2.5]]);top.rotation.x=-Math.PI/2;top.position.set(x,y+62,0);this.chassis.add(top);
   for(const z of [-34,34])this.chassis.add(box(184,8,4,m.steel,V(x,y+58,z)));
   for(const dx of [-82,82])for(const z of [-24,24])this.chassis.add(cylinder(3.3,2,m.rim,V(x+dx,y+65,z),'y',12));
  }
  for(const side of [-1,1]){
   this.chassis.add(box(457,22,6,m.steel,V(-706,y-18,side*62)));
   const sidePanel=plate(125,48,3,m.dark,[[-49,-16,2.5],[49,-16,2.5],[-49,16,2.5],[49,16,2.5]]);sidePanel.position.set(-704,y,side*64);this.chassis.add(sidePanel);
   for(const x of [-950,-540]){
    const low=Math.min(y-15,this.wheelY),high=Math.max(y-15,this.wheelY);
    this.chassis.add(box(42,Math.max(22,high-low+22),17,m.steel,V(x,(low+high)/2,side*(this.track-17))));
   }
  }
  for(const x of [-950,-540])this.chassis.add(cylinder(18,2*this.track+9,m.dark,V(x,this.wheelY,0),'z'));
  this.wheels=[];for(const x of [-950,-540])for(const side of [-1,1]){
   const w=this.makeWheel(side);w.position.set(x,this.wheelY,side*this.track);this.wheels.push(w);this.chassis.add(w);
  }
  // Camera and its LED window sit above the front pivot, as in the photos.
  this.cameraHead=new THREE.Group();this.cameraHead.position.set(-363,y+42,0);this.cameraHead.rotation.z=-.12;
  const dome=mesh(new THREE.SphereGeometry(39,40,24),m.black);dome.scale.set(.95,1,1);this.cameraHead.add(dome);
  const face=plate(52,56,5,m.dark);face.rotation.y=Math.PI/2;face.position.x=31;this.cameraHead.add(face);
  this.cameraHead.add(cylinder(12,4,m.steel,V(35,-3,0)),cylinder(9.8,4.4,m.glass,V(37,-3,0)));
  this.ledMaterial=new THREE.MeshStandardMaterial({color:'#ffffe6',emissive:'#ffffcf',emissiveIntensity:2.5,roughness:.15});
  for(const z of [-14,14])for(const yy of [-20,18])this.cameraHead.add(cylinder(6,4,m.steel,V(35,yy,z)),cylinder(4.5,4.4,this.ledMaterial,V(37,yy,z)));
  const band=mesh(new THREE.TorusGeometry(39.8,1.6,8,64),m.steel);band.rotation.y=Math.PI/2;this.cameraHead.add(band);
  this.cameraHead.add(box(35,6,65,m.steel,V(0,39,0)));this.chassis.add(this.cameraHead);
  const coil=[];for(let i=0;i<=320;i++){const a=i/320*TAU*6;coil.push(V(-470+i/320*107,y+62+14*Math.cos(a),14*Math.sin(a)));}this.chassis.add(tube(coil,3.1,m.black));
  // Front yoke, articulated arm and a receiver gripping the existing T adapter.
  this.pivot=V(-300,y+5,0);this.armLengths=[235,90];this.links=[];
  this.chassis.add(box(95,31,73,m.dark,V(-354,y+3,0)),cylinder(21,103,m.steel,this.pivot,'z'));
  for(const side of [-1,1])for(let k=0;k<2;k++){const o=link(this.armLengths[k],k?31:28,11,k?m.dark:m.black);this.group.add(o);this.links.push({o,side,k});}
  this.joints=[];for(let i=0;i<3;i++)for(const side of [-1,1]){const g=new THREE.Group();g.add(cylinder(12,7,m.steel,V(),'z'),cylinder(6,8,m.dark,V(),'z',12),cylinder(3,9,m.rim,V(),'z',6));this.group.add(g);this.joints.push({g,i,side});}
  this.actuatorBody=cylinder(12,128,m.dark);this.actuatorRod=cylinder(6,1,m.steel);this.group.add(this.actuatorBody,this.actuatorRod);
  this.receiver=new THREE.Group();this.receiver.name='Werkzeugaufnahme ohne Fräskopf';this.group.add(this.receiver);
  const back=plate(58,88,28,m.dark,[[0,-24,8.2],[0,24,8.2]]);back.rotation.y=Math.PI/2;back.position.x=-28;this.receiver.add(back);
  for(const side of [-1,1]){
   this.receiver.add(box(26,88,13,m.steel,V(-16,0,side*22.5)),box(4,88,19,m.dark,V(-6,0,side*19.5)));
   for(const yy of [-34,34])this.receiver.add(cylinder(4,4,m.rim,V(-4,yy,side*23),'x',12));
  }
  this.receiver.add(cylinder(14,91,m.steel,V(-43,0,0),'z'));
  this.coupling=new THREE.Object3D();this.coupling.position.set(-12,0,0);this.receiver.add(this.coupling);
  this.lines=[];for(const[side,mm]of [[-1,m.blue],[1,m.yellow]]){const o=tube([V(-1080,y+37,side*38),V(-950,y+60,side*45),V(-570,y+59,side*45),V(-355,y+48,side*55),V(-170,20,side*50),V(-20,18,side*33)],3.1,mm);this.group.add(o);this.lines.push({o,side});}
  this.tail=tube([V(-1114,y,0),V(-1190,y-10,-8),V(-1290,this.wheelY-this.wheelRadius+8,-10)],7,m.black);this.chassis.add(this.tail);
  this.pose(0,0);
 }
 makeWheel(side){
  const m=this.m,r=this.wheelRadius,g=new THREE.Group();g.add(cylinder(r-5,27,m.tire,V(),'z'),cylinder(r-12,29,m.rim,V(),'z'),cylinder(r-23,30,m.dark,V(),'z'),cylinder(23,31,m.steel,V(),'z'));
  for(let i=0;i<26;i++){const a=i/26*TAU,o=box(8,10,30,m.tire,V((r-4)*Math.cos(a),(r-4)*Math.sin(a),0));o.rotation.z=a;g.add(o);}
  for(let i=0;i<6;i++){const a=i/6*TAU;g.add(cylinder(3.4,2,m.rim,V(17*Math.cos(a),17*Math.sin(a),side*16),'z',12));}
  return g;
 }
 pose(lift,travel){
  for(const w of this.wheels)w.rotation.z=-travel/this.wheelRadius;
  if(this.lastLift===lift)return;this.lastLift=lift;this.receiver.position.y=lift;
  const a=this.pivot.clone(),e=V(-43,lift,0),d=e.clone().sub(a),length=d.length(),u=d.clone().divideScalar(length),[l1,l2]=this.armLengths;
  const along=(l1*l1-l2*l2+length*length)/(2*length),height=Math.sqrt(Math.max(0,l1*l1-along*along));
  const elbow=a.clone().addScaledVector(u,along).addScaledVector(V(-u.y,u.x,0),height);this.armPoints=[a,elbow,e];
  for(const{o,side,k}of this.links){const start=this.armPoints[k].clone(),end=this.armPoints[k+1].clone();start.z=end.z=side*40;placeLink(o,start,end);}
  for(const{g,i,side}of this.joints){g.position.copy(this.armPoints[i]);g.position.z=side*49;}
  const from=a.clone().add(V(-30,-32,0)),to=e.clone().add(V(0,-32,0)),axis=to.clone().sub(from).normalize(),distance=from.distanceTo(to);
  this.actuatorBody.position.copy(from).addScaledVector(axis,64);
  // Both cylinder geometries have their long dimension on local Y.
  this.actuatorBody.quaternion.setFromUnitVectors(V(0,1,0),axis);
  this.actuatorRod.scale.y=distance-105;this.actuatorRod.position.copy(from).addScaledVector(axis,105+(distance-105)/2);this.actuatorRod.quaternion.setFromUnitVectors(V(0,1,0),axis);
  for(const{o,side}of this.lines){o.geometry.dispose();o.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-1080,this.bodyY+37,side*38),V(-950,this.bodyY+60,side*45),V(-570,this.bodyY+59,side*45),V(-355,this.bodyY+48,side*55),elbow.clone().add(V(-20,20,side*54)),V(-20,lift+18,side*33)]),64,3.1,8,false);}
 }
 dispose(){const materials=new Set();this.group.traverse(o=>{if(o.isMesh)materials.add(o.material);});for(const m of materials)m.dispose();}
}
