import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Robot,robotConfigurations} from '../src/robot.js';
import {families} from '../src/data.js';
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<.001,`${message}: ${a} vs ${b}`);
for(const family of families){
 const R=family.id/2,anchor=new THREE.Vector3(-370,-20,0),r=new Robot(R,anchor);
 assert.equal(r.wheels.length,4,'Two axles, four driven wheels');
 assert.equal(r.config.kit,family.id===300?'base':family.id<=600?'medium':'large','DN selects base, 350–600 or 600–800 attachment');
 assert.equal(r.config,robotConfigurations[family.id],'Selected setup matches displayed DN');
 let chassisY;
 for(const lift of [-70.56,-45,0,8]){
  r.pose(lift,-430);r.group.updateMatrixWorld(true);
  const mount=r.coupling.getWorldPosition(new THREE.Vector3());
  near(mount.x,-382,'Receiver meets the rear face of the existing T adapter');near(mount.y,-20+lift,'Receiver follows the mould lift');near(mount.z,0,'Receiver remains centred');
  const wheelY=r.wheels[0].getWorldPosition(new THREE.Vector3()).y;
  if(chassisY===undefined)chassisY=wheelY;near(wheelY,chassisY,'Crawler stays on the channel while the mould lifts');
  const [a,b,c,d]=r.armPoints;
  near(a.distanceTo(b),r.armLength,'Side rocker keeps its length');near(c.distanceTo(d),r.armLength,'Lower guide keeps its length');
  near(a.distanceTo(c),r.axisSpacing,'Rear transverse axes remain separated');near(b.distanceTo(d),r.axisSpacing,'Nose axes remain separated');
  near(b.clone().sub(a).angleTo(d.clone().sub(c)),0,'Lower guides remain parallel to the side rockers');
  near(b.x,-43,'Tool tilt axis stays at the receiver');near(b.y,lift,'Front axis follows mould height');
  near(a.x,r.pivot.x+r.carrier.position.x,'Rear axis remains on the crawler');near(a.y,r.pivot.y,'Rear axis stays at fixed height');
  assert.equal(r.cameraLEDs.length,4,'CutterCam has four LED windows');
  const optical=r.cameraEye.getWorldPosition(new THREE.Vector3());assert.ok(optical.x<a.x+anchor.x+160&&optical.x>a.x+anchor.x,'Camera sits behind the long arm, inside the front cradle');
 }
 r.pose(8,-330);r.group.updateMatrixWorld(true);near(r.wheels[0].rotation.z,(330-r.carrier.position.x)/r.wheelRadius,'Wheels rotate with travel and linkage compensation');
 // Vertex check includes tooth corners and sidewalls. The constructor solves
 // the rotational envelope, so every rolling angle stays inside the pipe.
 let maximum=0;
 for(const w of r.wheels)w.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){const p=new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);maximum=Math.max(maximum,Math.hypot(p.y,p.z));}});
 assert.ok(maximum<=R+.2,`Wheel envelope stays inside DN ${family.id}: ${maximum}`);
 assert.ok(maximum>R-3,'Wheel tread reaches the pipe wall');
 let bodyEnvelope=0,draws=0;
 r.group.traverseVisible(o=>{if(!o.isMesh)return;draws++;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){const p=new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);bodyEnvelope=Math.max(bodyEnvelope,Math.hypot(p.y,p.z));}});
 assert.ok(bodyEnvelope<=R+.2,`Robot, attachment and hoses fit DN ${family.id}: ${bodyEnvelope}`);
 assert.ok(draws<120,'Repeated static details are batched for interactive performance');
 const tyre=r.wheels[0].children.find(o=>o.material===(r.config.tread==='pur'?r.m.pur:r.m.tire));
 assert.ok(tyre,'PUR or pneumatic tyre matches selected setup');
 // Left/right cutting uses the longitudinal rotary joint behind CutterCam.
 // A fixed lift pose must remain identical in the module's own lift plane.
 r.pose(-45,0,0,0);r.group.updateMatrixWorld(true);
 const localLinks=r.links.map(({o})=>({p:o.position.clone(),q:o.quaternion.clone()}));
 const cameraLocal=r.front.worldToLocal(r.cameraEye.getWorldPosition(new THREE.Vector3()));
 const wheel=r.wheels[0].getWorldPosition(new THREE.Vector3());
 assert.ok(r.rotationAxis.x<r.cameraHead.position.x,'Rotary axis origin is behind CutterCam');
 for(const roll of [-.65,-.2,.2,.65,0]){
  r.pose(-45,0,roll,0);r.group.updateMatrixWorld(true);
  near(r.wheels[0].getWorldPosition(new THREE.Vector3()).distanceTo(wheel),0,'Rolling module does not sway the crawler');
  for(let i=0;i<r.links.length;i++){
   near(r.links[i].o.position.distanceTo(localLinks[i].p),0,'No lateral translation at lift links');
   near(r.links[i].o.quaternion.angleTo(localLinks[i].q),0,'No lateral arm joint');
  }
  const expected=cameraLocal.clone().sub(r.rotationAxis).applyAxisAngle(new THREE.Vector3(1,0,0),roll).add(r.rotationAxis).add(anchor);
  near(r.cameraEye.getWorldPosition(new THREE.Vector3()).distanceTo(expected),0,'Camera follows the same rotary axis as the arm assembly');
 }
 console.log(`DN ${family.id}: four wheels, coupled receiver, fixed chassis height, articulated lift and rolling motion passed.`);
 r.dispose();r.group.traverse(o=>{if(o.isMesh)o.geometry.dispose();});
}
