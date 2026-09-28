import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Viewer} from '../src/model.js';
import {families} from '../src/data.js';
import {insertionStages,shaftProfile,floorAt} from '../src/manhole.js';

// Insertion through the manhole: hinge only opens nose-up relative to the robot
// (the moving leaf blocks the other direction), poses are continuous and
// seekable, and the unit stays inside shaft, channel and pipe. Clearance
// tolerances are display tolerances, not a collision certification.
const v=Object.create(Viewer.prototype);
Object.assign(v,{scene:new THREE.Scene(),model:new THREE.Group(),context:new THREE.Group(),floor:new THREE.Object3D(),parts:[],group:'all',mode:'explore',explode:0,targetExplode:0,selected:null,faint:false,camera:new THREE.PerspectiveCamera(34,1.5,1,15000)});
v.controls={target:new THREE.Vector3(),update(){v.camera.lookAt(this.target);},maxDistance:5000};
v.scene.add(v.model);
v.resetPose();
const end=insertionStages.length-.001;
const sample=()=>{v.model.updateMatrixWorld(true);const pts=[],p=new THREE.Vector3();v.model.traverseVisible(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position,step=Math.max(1,Math.floor(a.count/120));for(let i=0;i<a.count;i+=step){p.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);if(!o.material.clippingPlanes?.some(c=>c.distanceToPoint(p)<0))pts.push(p.clone());}});return pts;};
for(const f of families){
 v.build(f.id);v.setSections({pipe:true,shield:false,holder:false});v.setMode('insert');
 const s=v.manhole.spec;
 const pose=t=>{v.setInsert(t);v.updateParts();v.insertionPose();return v.insertState;};
 let prev=null,worst={shaft:0,floor:0,pipe:0};
 for(let t=0;t<=end;t=Math.round((t+.02)*1000)/1000){
  const k=pose(t);
  assert.ok(k.hinge>=-1e-6&&k.hinge<=Math.PI/2+1e-6,`DN ${f.id} t=${t}: hinge only opens nose-up (${k.hinge})`);
  if(k.stage<=2)assert.ok(Math.abs(k.hinge)<1e-6,'Hinge stays locked while tipping and lowering');
  if(prev){const jump=k.W.distanceTo(prev.W);assert.ok(jump<60,`DN ${f.id} t=${t}: continuous pin path (${jump.toFixed(1)} mm)`);assert.ok(Math.abs(k.thetaF-prev.thetaF)<.1&&Math.abs(k.thetaR-prev.thetaR)<.1,`DN ${f.id} t=${t}: continuous rotation`);}
  prev=k;
  // Clearance below the frame: tipping, lowering, folding, driving in.
  if(k.stage>=1){
   for(const p of sample()){
    if(p.y>s.G-110||p.y<s.base)continue;
    const wall=Math.sqrt(Math.max(0,s.Rm**2-p.z**2));
    if(p.x>wall-2)worst.pipe=Math.max(worst.pipe,Math.hypot(p.y,p.z)-s.Rp);
    else if(p.x<-wall-2)worst.shaft=Math.max(worst.shaft,-wall-p.x);
    else{const {cx,r}=shaftProfile(s,p.y);worst.shaft=Math.max(worst.shaft,Math.hypot(p.x-cx,p.z)-r);worst.floor=Math.max(worst.floor,floorAt(s,p.x,p.z)-p.y);}
   }
  }
 }
 assert.ok(worst.shaft<8,`DN ${f.id}: unit stays inside the shaft (${worst.shaft.toFixed(1)} mm)`);
 assert.ok(worst.floor<8,`DN ${f.id}: unit stays above channel and bench (${worst.floor.toFixed(1)} mm)`);
 assert.ok(worst.pipe<8,`DN ${f.id}: unit fits the target pipe (${worst.pipe.toFixed(1)} mm)`);
 // Deterministic seeking and the final state equals the in-pipe transport pose.
 const a=pose(3.5),wa=a.W.clone();pose(0.2);pose(5.5);const b=pose(3.5);assert.ok(b.W.distanceTo(wa)<1e-6&&b.thetaF===a.thetaF,'Direct seeking reproduces the pose');
 const last=pose(end);assert.ok(Math.abs(last.thetaF)<1e-9&&Math.abs(last.thetaR)<1e-9,'Unit ends straight in the pipe');
 assert.ok(Math.abs(last.W.y-v.insertGeo.pin.y)<3,`Mould rests on the invert like in the pipe (${(last.W.y-v.insertGeo.pin.y).toFixed(2)})`);
 const mid=pose(3.6);assert.ok(mid.hinge>.3,'Hinge opens while the mould folds into the pipe');
 v.setMode('explore');v.releaseInsert();v.resetPose();
 console.log(`${f.label}: hinge direction, continuity, seeking and clearance OK (shaft ${worst.shaft.toFixed(1)}, floor ${worst.floor.toFixed(1)}, pipe ${worst.pipe.toFixed(1)} mm)`);
}
