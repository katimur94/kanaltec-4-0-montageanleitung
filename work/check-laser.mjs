import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Viewer} from '../src/model.js';
import {families,PHASE} from '../src/data.js';
import {laserSpec,laserTravel,laserState} from '../src/laser-aid.js';

// Laser-Positionierhilfe: über den Anschluss bis die rote Linie auf der
// Anschlussmitte steht, Halt und Nullen (Doppelblitz), Rückweg L bis Grün.
// Hardware bleibt im Rohr, das Messrad an der Rohrwand; Rücksprünge stimmen.
const near=(a,b,m,e=.01)=>assert.ok(Math.abs(a-b)<=e,`${m}: ${a} != ${b}`);
const v=Object.create(Viewer.prototype);
Object.assign(v,{scene:new THREE.Scene(),model:new THREE.Group(),context:new THREE.Group(),floor:new THREE.Object3D(),parts:[],group:'all',mode:'explore',explode:0,targetExplode:0,selected:null,faint:false,camera:new THREE.PerspectiveCamera(34,1.5,1,15000)});
v.controls={target:new THREE.Vector3(),update(){},addEventListener(){},maxDistance:5000};
v.renderer={domElement:{toDataURL:()=>''},render(){}};
v.resetPose();
for(const f of families)for(const kind of ['open','closure']){
 v.repairOptions={kind,milling:kind==='open',infiltration:true,infiltrationLevel:.85,cavity:'large',sewerWater:33};v.laserAid=true;v.build(f.id);
 v.mode='process';v.context.visible=true;v.sections={pipe:true,shield:false,holder:false};
 const R=v.radius+12,wo=v.workOffset,L=v.laserTarget();
 const pose=(t,clock=1.3)=>{v.time=t+PHASE.POSITION;v.ambientClock=clock;v.updateParts();v.processPose();v.model.updateMatrixWorld(true);};
 pose(0);near(v.model.position.x,wo-430,'Start of positioning continues from the tool change');assert.equal(v.laserStatus.state,'start','Red start line during approach');assert.ok(v.laserStatus.red&&!v.laserStatus.green,'Only the red laser is on');
 assert.ok(v.laser.group.visible&&v.laser.beam.visible,'Laser device and beam are shown');
 pose(laserSpec.forwardEnd+.05);near(v.model.position.x+laserSpec.x,0,'Red line stands on the connection centre after overshooting');
 pose(laserSpec.zeroAt+.005);assert.equal(v.laserStatus.state,'zero','Standstill zeroes the counter');assert.ok(!v.laserStatus.red,'Double flash: line briefly off');
 pose(laserSpec.zeroAt+.015);assert.ok(v.laserStatus.red,'Double flash: line on between flashes');
 let last=-1,seenWarn=false;
 for(let k=0;k<=200;k++){const ff=laserSpec.holdEnd+(1-laserSpec.holdEnd)*k/200;pose(Math.min(ff,.99999));const s=v.laserStatus;assert.ok(s.d>=last-1e-9,'Reverse travel grows monotonically');last=s.d;if(s.state==='warn')seenWarn=true;if(s.state==='target')assert.ok(seenWarn,'Green blinks before solid green');assert.notEqual(s.state,'over','Animation never overshoots the target');}
 pose(.99999);near(v.model.position.x,wo,'Positioning ends exactly at the working position',.02);assert.equal(v.laserStatus.state,'target','Solid green at the target');assert.ok(v.laserStatus.green&&!v.laserStatus.red,'Only the green laser is on');
 near(v.laserStatus.L,L,'Travel L equals laser line to target');near(L,-laserSpec.x-wo,'L follows the mould target');
 // Warn state blinks with the clock.
 const warnF=(()=>{for(let k=0;k<=400;k++){const ff=laserSpec.holdEnd+(1-laserSpec.holdEnd)*k/400;const s=laserState(PHASE.POSITION+ff,wo,0);if(s.state==='warn')return ff;}return null;})();
 assert.ok(warnF!=null,'A warn phase exists');assert.notEqual(laserState(PHASE.POSITION+warnF,wo,0).green,laserState(PHASE.POSITION+warnF,wo,.13).green,'Warn state blinks');
 // Hardware in the pipe and wheel on the wall for travel and pressed lift.
 for(const t of [.3,.99,1.5,1.999]){
  pose(t);const lift=v.upperLift,w=v.laser.wheel.position;
  near(Math.hypot(w.y,w.z)+v.laser.wr,R,`Wheel touches the pipe wall (lift ${lift.toFixed(1)})`,.05);
  assert.ok(w.z<0,'Wheel runs on the uncut far wall');
  const water=v.repair.flowWater?.y??-1e9;assert.ok(w.y-v.laser.wr>water,'Wheel runs above the dry-weather flow');
  const box=new THREE.Box3().setFromObject(v.laser.upper),shell=new THREE.Box3();
  for(const c of [box.min,box.max])for(const z of [box.min.z,box.max.z])assert.ok(Math.hypot(c.y,z)<R,'Main box stays inside the pipe');
  for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])assert.ok(Math.hypot(y-lift,z)<v.radius-10,'Main box stays clear below the shield carrier');
  assert.ok(v.model.position.x+laserSpec.x<v.model.position.x-250,'Laser plane lies behind the rear shield edge');
  near(new THREE.Box3().setFromObject(v.laser.line).getCenter(new THREE.Vector3()).x,v.model.position.x+laserSpec.x,'Laser line lies on the crown at the laser plane',.6);
 }
 pose(2.5);assert.ok(!v.laser.beam.visible,'Laser is not needed after pressing');
 pose(.8);const a=v.model.position.x,ang=v.laser.spin.rotation.y;pose(.2);pose(.8);near(v.model.position.x,a,'Seeking backward reproduces the travel');near(v.laser.spin.rotation.y,ang,'Measuring wheel angle follows the travel');
 // Classic positioning unchanged without the laser aid.
 v.laserAid=false;pose(.5);near(v.model.position.x,wo-430*(1-.5),'Without laser aid the original approach is kept');assert.ok(!v.laser.group.visible,'Laser hardware hidden when switched off');v.laserAid=true;
 v.mode='explore';v.resetPose();assert.ok(!v.laser.group.visible,'Not part of the DiTom assembly views');
 console.log(`${f.label} · ${kind}: overshoot, zero flash, reverse ${L.toFixed(0)} mm to green, wheel contact and seeking OK`);
}
assert.equal(laserTravel(0,0).x,-430);console.log('Laser positioning aid passed.');
