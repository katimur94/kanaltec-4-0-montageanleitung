import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Viewer} from '../src/model.js';
import {families,PHASE} from '../src/data.js';
import {levelSpec} from '../src/infiltration.js';

// Infiltration intensity 0…1: dry at zero, more paths, films and a waterfall
// with rising values; water enters over one flank only. The waterfall ends on
// the outer shield surface, wall or invert, stops when the shield is pressed
// and never returns after filling; seeking restores the same paths.
// Display behaviour, not a hydraulic simulation.
const v=Object.create(Viewer.prototype);
Object.assign(v,{scene:new THREE.Scene(),model:new THREE.Group(),context:new THREE.Group(),floor:new THREE.Object3D(),parts:[],group:'all',mode:'explore',explode:0,targetExplode:0,selected:null,faint:false,camera:new THREE.PerspectiveCamera(34,1.5,1,15000)});
v.controls={target:new THREE.Vector3(),update(){},addEventListener(){},maxDistance:5000};
v.resetPose();
for(const f of families)for(const I of [0,.2,.5,.85,1]){
 v.repairOptions={kind:'open',infiltration:true,infiltrationLevel:I,cavity:'large',sewerWater:33};v.build(f.id);
 v.mode='process';v.context.visible=true;v.sections={pipe:true,shield:false,holder:false};
 const pose=(t,clock=1.3)=>{v.time=t+PHASE.POSITION;v.ambientClock=clock;v.updateParts();v.processPose();};
 const x=v.repair.extras,spec=levelSpec(I);
 pose(0);
 if(I===0){assert.equal(v.repair.water.visible,false,'Zero intensity: dry');assert.ok(!x.films.visible,'No films when dry');console.log(`${f.label} · 0: dry OK`);continue;}
 assert.equal(v.repair.streams.filter(s=>s.enabled).length,spec.streams,'Active paths follow the intensity');
 assert.ok(v.repair.streams.filter(s=>s.enabled).every(s=>s.edge.z>0),'Water enters over one flank only');
 assert.equal(x.filmRuns.length,spec.films,'Wall films follow the intensity');assert.equal(!!x.fall,spec.waterfall>0,'Waterfall from the upper intensities');
 const R=v.radius+12;
 for(const t of [0,.5,.8,.99,1.5]){
  pose(t);const s={x:v.model.position.x,lift:v.upperLift,seal:v.sealAir};
  for(const p of x.fallPoints||[]){
   const dy=p.y-s.lift,inside=Math.abs(p.x-s.x)<=248&&Math.abs(Math.atan2(p.z,dy))<=1.12&&Math.hypot(dy,p.z)<R-10+3*s.seal+2-.6;
   assert.ok(!inside,`DN ${f.id} I=${I} t=${t}: waterfall never passes through the shield`);
   assert.ok(Math.hypot(p.y,p.z)<=R+.5,'Waterfall stays inside the pipe');
  }
 }
 pose(.99);const before=(x.fallPoints||[]).map(p=>p.toArray());
 pose(1.999);assert.ok(!x.films.visible&&!(x.fall?.visible),'Pressed shield seals wall films and waterfall');
 pose(4.95);assert.equal(v.repair.water.visible,false,'Filled defect: no infiltration');assert.ok(!x.films.visible&&!x.grains.visible,'No films or grains after filling');
 pose(6.99);assert.ok(!x.films.visible&&!(x.fall?.visible),'Nothing returns after removal');
 pose(.99);assert.deepEqual((x.fallPoints||[]).map(p=>p.toArray()),before,'Backward seeking restores the waterfall');
 console.log(`${f.label} · ${I}: one-sided paths, films, waterfall, sealing and seeking OK`);
}
