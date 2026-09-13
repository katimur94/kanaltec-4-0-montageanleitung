import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Robot} from '../src/robot.js';
import {families} from '../src/data.js';
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<.001,`${message}: ${a} vs ${b}`);
for(const family of families){
 const R=family.id/2,anchor=new THREE.Vector3(-370,-20,0),r=new Robot(R,anchor);
 assert.equal(r.wheels.length,4,'Two axles, four driven wheels');
 let chassisY;
 for(const lift of [-70.56,-45,0,8]){
  r.pose(lift,-430);r.group.updateMatrixWorld(true);
  const mount=r.coupling.getWorldPosition(new THREE.Vector3());
  near(mount.x,-382,'Receiver meets the rear face of the existing T adapter');near(mount.y,-20+lift,'Receiver follows the mould lift');near(mount.z,0,'Receiver remains centred');
  const wheelY=r.wheels[0].getWorldPosition(new THREE.Vector3()).y;
  if(chassisY===undefined)chassisY=wheelY;near(wheelY,chassisY,'Crawler stays on the channel while the mould lifts');
  for(let i=0;i<2;i++)near(r.armPoints[i].distanceTo(r.armPoints[i+1]),r.armLengths[i],'Articulated arm keeps constant link lengths');
 }
 r.pose(8,-330);r.group.updateMatrixWorld(true);near(r.wheels[0].rotation.z,330/r.wheelRadius,'Wheels rotate with travel');
 // Vertex check includes the tooth corners and the outside wheel sidewall.
 let maximum=0;
 for(const w of r.wheels)w.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){const p=new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);maximum=Math.max(maximum,Math.hypot(p.y,p.z));}});
 assert.ok(maximum<=R+.2,`Wheel envelope stays inside DN ${family.id}: ${maximum}`);
 assert.ok(maximum>R-3,'Wheel tread reaches the pipe wall');
 console.log(`DN ${family.id}: four wheels, coupled receiver, fixed chassis height, articulated lift and rolling motion passed.`);
 r.dispose();r.group.traverse(o=>{if(o.isMesh)o.geometry.dispose();});
}
