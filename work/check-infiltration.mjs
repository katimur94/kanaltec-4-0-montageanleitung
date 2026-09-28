import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Viewer} from '../src/model.js';
import {families,PHASE} from '../src/data.js';
import {infiltrationLevels} from '../src/infiltration.js';

// Infiltration levels: jets end on the outer shield surface or the invert,
// wall films and jets stop once the shield is pressed, nothing returns after
// filling, and direct seeking restores the same jet paths. Display behaviour,
// not a hydraulic simulation.
const v=Object.create(Viewer.prototype);
Object.assign(v,{scene:new THREE.Scene(),model:new THREE.Group(),context:new THREE.Group(),floor:new THREE.Object3D(),parts:[],group:'all',mode:'explore',explode:0,targetExplode:0,selected:null,faint:false,camera:new THREE.PerspectiveCamera(34,1.5,1,15000)});
v.controls={target:new THREE.Vector3(),update(){},maxDistance:5000};
v.resetPose();
for(const f of families)for(const level of Object.keys(infiltrationLevels)){
 v.repairOptions={kind:'open',infiltration:true,infiltrationLevel:level,cavity:'large',sewerWater:33};v.build(f.id);
 v.mode='process';v.context.visible=true;v.sections={pipe:true,shield:false,holder:false};
 const pose=(t,clock=1.3)=>{v.time=t+PHASE.POSITION;v.ambientClock=clock;v.updateParts();v.processPose();};
 const x=v.repair.extras,spec=infiltrationLevels[level];
 assert.equal(x.jets.length,spec.jets,'Jet count follows the level');assert.equal(x.filmRuns.length,spec.films,'Wall films follow the level');
 pose(0);assert.ok(v.repair.water.visible&&(spec.films===0||x.films.visible),'Water and wall films run before the shield arrives');
 const R=v.radius+12;
 for(const t of [0,.5,.8,.99,1.5]){
  pose(t);const s={x:v.model.position.x,lift:v.upperLift,seal:v.sealAir};
  for(const j of x.jets)for(const p of j.points){
   const dy=p.y-s.lift,inside=Math.abs(p.x-s.x)<=248&&Math.abs(Math.atan2(p.z,dy))<=1.12&&Math.hypot(dy,p.z)<R-10+3*s.seal+1.5-.6;
   assert.ok(!inside,`DN ${f.id} ${level} t=${t}: jet never passes through the shield`);
   assert.ok(Math.hypot(p.y,p.z)<=R+.5,'Jet stays inside the pipe');
  }
 }
 pose(.99);const before=x.jets.map(j=>j.points.map(p=>p.toArray()));
 pose(1.999);assert.ok(!x.films.visible&&x.jets.every(j=>!j.mesh.visible),'Pressed shield seals wall films and jets');
 pose(4.95);assert.equal(v.repair.water.visible,false,'Filled defect: no infiltration');assert.ok(!x.films.visible&&!x.grains.visible,'No films or grains after filling');
 pose(6.99);assert.ok(!x.films.visible&&x.jets.every(j=>!j.mesh.visible),'Nothing returns after removal');
 pose(.99);assert.deepEqual(x.jets.map(j=>j.points.map(p=>p.toArray())),before,'Backward seeking restores jet paths');
 v.repairOptions={kind:'open',infiltration:true,infiltrationLevel:'flow',cavity:'large',sewerWater:33};
 console.log(`${f.label} · ${spec.label}: films, jets, grains, sealing and seeking OK`);
}
