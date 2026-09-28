import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Viewer} from '../src/model.js';
import {families} from '../src/data.js';
import {insertionStages,shaftProfile,floorAt,inLadder} from '../src/manhole.js';

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
// Optional: DN=400 node work/check-insertion.mjs checks one size only.
for(const f of families.filter(f=>!process.env.DN||String(f.id)===process.env.DN)){
 v.build(f.id);v.setSections({pipe:true,shield:false,holder:false});v.setMode('insert');
 const s=v.manhole.spec;
 const pose=t=>{v.setInsert(t);v.updateParts();v.insertionPose();return v.insertState;};
 let prev=null,worst={shaft:0,floor:0,pipe:0,ladder:0,cable:0};
 for(let t=0;t<=end;t=Math.round((t+.02)*1000)/1000){
  const k=pose(t);
  assert.ok(k.hinge>=-1e-6&&k.hinge<=Math.PI/2+1e-6,`DN ${f.id} t=${t}: hinge only opens nose-up (${k.hinge})`);
  // Hanging freely above the shaft the cantilevered mould would fold down; the hinge blocks that.
  if((k.stage===1&&k.f>.9)||(k.stage===2&&k.f<.3))assert.ok(k.hinge<.2,`DN ${f.id} t=${t}: hinge nearly closed while hanging freely (${k.hinge})`);
  if(prev){const jump=k.W.distanceTo(prev.W);assert.ok(jump<260,`DN ${f.id} t=${t}: continuous pin path (${jump.toFixed(1)} mm)`);assert.ok(Math.abs(k.thetaF-prev.thetaF)<.35&&Math.abs(k.thetaR-prev.thetaR)<.35,`DN ${f.id} t=${t}: continuous rotation`);}
  prev=k;
  // The yoke never cuts into the robot: robot and yoke differ at most by the stop.
  assert.ok(Math.abs(k.thetaR-k.yoke)<=v.manhole.spec.yokeStop+.02,`DN ${f.id} t=${t}: yoke rests on the robot, not inside it`);
  // Landing and laying down open the hinge only as far as the shaft needs, far from 90°.
  if(k.stage===3||k.stage===4){assert.ok(k.hinge<45*Math.PI/180,`DN ${f.id} t=${t}: hinge opens only partly while landing (${k.hinge})`);worst.hinge=Math.max(worst.hinge||0,k.hinge);}
  // Clearance below the frame: tipping, lowering, folding, driving in.
  // The cable never enters shaft wall, climbing irons, channel or pipe wall.
  for(const p of v.manhole.cablePoints){if(p.y>s.G-20)continue;const wall=Math.sqrt(Math.max(0,s.Rm**2-p.z*p.z));let e;if(p.y<s.Rp&&Math.abs(p.x)>wall-40)e=Math.hypot(p.y,p.z)-(s.Rp-7);else{const {cz,r}=shaftProfile(s,p.y);e=Math.hypot(p.x,p.z-cz)-(r-7);}worst.cable=Math.max(worst.cable,e,inLadder(s,p)?1:0);}
  if(k.stage>=1){
   for(const p of sample()){
    if(p.y>s.G-110||p.y<s.base)continue;
    const wall=Math.sqrt(Math.max(0,s.Rm**2-p.z**2));
    // At the far wall a point is fine inside the pipe mouth or inside the shaft.
    if(p.x>wall-2){const {cx,cz,r}=shaftProfile(s,p.y),e=Math.min(Math.hypot(p.y,p.z)-s.Rp,Math.hypot(p.x-cx,p.z-cz)-r);if(e>worst.pipe){worst.pipe=e;worst.pipeAt=`t=${t} (${p.toArray().map(Math.round)})`;}}
    else if(p.x<-wall-2){const e=-wall-p.x;if(e>worst.shaft){worst.shaft=e;worst.at=`t=${t} (${p.toArray().map(Math.round)})`;}}
    else{const {cx,cz,r}=shaftProfile(s,p.y);{const e=Math.hypot(p.x-cx,p.z-cz)-r;if(e>worst.shaft){worst.shaft=e;worst.at=`t=${t} (${p.toArray().map(Math.round)})`;}}{const e=floorAt(s,p.x,p.z)-p.y;if(e>worst.floor){worst.floor=e;worst.floorAt=`t=${t} (${p.toArray().map(Math.round)})`;}}if(inLadder(s,p,-12)){worst.ladder++;worst.ladderAt=`t=${t} (${p.toArray().map(Math.round)})`;}}
   }
  }
 }
 assert.ok(worst.shaft<8,`DN ${f.id}: unit stays inside the shaft (${worst.shaft.toFixed(1)} mm at ${worst.at})`);
 assert.ok(worst.floor<8,`DN ${f.id}: unit stays above channel and bench (${worst.floor.toFixed(1)} mm at ${worst.floorAt})`);
 assert.equal(worst.ladder,0,`DN ${f.id}: unit passes beside the climbing irons (${worst.ladderAt})`);
 assert.ok(worst.cable<=.5,`DN ${f.id}: cable stays inside the shaft (${worst.cable.toFixed(1)} mm)`);
 assert.ok(worst.pipe<8,`DN ${f.id}: unit fits the target pipe (${worst.pipe.toFixed(1)} mm at ${worst.pipeAt})`);
 // Deterministic seeking and the final state equals the in-pipe transport pose.
 const a=pose(3.5),wa=a.W.clone();pose(0.2);pose(5.5);const b=pose(3.5);assert.ok(b.W.distanceTo(wa)<1e-6&&b.thetaF===a.thetaF,'Direct seeking reproduces the pose');
 const last=pose(end);assert.ok(Math.abs(last.thetaF)<1e-9&&Math.abs(last.thetaR)<1e-9,'Unit ends straight in the pipe');
 assert.ok(Math.abs(last.W.y-v.insertGeo.pin.y)<3,`Mould rests on the invert like in the pipe (${(last.W.y-v.insertGeo.pin.y).toFixed(2)})`);
 let open=0;for(let t=3;t<5;t+=.1)open=Math.max(open,pose(t).hinge);assert.ok(open>.1,'Hinge opens when channel and pipe push the mould up');
 v.setMode('explore');v.releaseInsert();v.resetPose();
 console.log(`${f.label}: hinge direction, continuity, seeking and clearance OK (shaft ${worst.shaft.toFixed(1)}, floor ${worst.floor.toFixed(1)}, pipe ${worst.pipe.toFixed(1)} mm, hinge max ${(worst.hinge*180/Math.PI).toFixed(0)}°)`);
}
