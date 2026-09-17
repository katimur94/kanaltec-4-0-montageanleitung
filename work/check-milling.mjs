import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Viewer} from '../src/model.js';
import {families,PHASE} from '../src/data.js';
import {millingSpec,millingState,millingTarget} from '../src/milling.js';
import {damagedPipeGeometry,brokenBranch,breakoutContour,branchBottom,packedBranchGeometry,branchProfile} from '../src/repair.js';
import {passage} from '../src/bladder.js';
import {makeCutter} from '../src/cutter.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<.002,`${a} != ${b}`);
const v=Object.create(Viewer.prototype);
const standalone=makeCutter(),bodyBounds=new THREE.Box3().setFromObject(standalone.housing),bodySize=bodyBounds.getSize(new THREE.Vector3());
assert.ok(bodySize.x>bodySize.y*1.5,'IBAK reference: motor housing lies lengthwise, not a vertical column');
assert.ok(standalone.camera.position.x>bodyBounds.max.x,'FrontCam sits in front of the motor');
assert.ok(standalone.disk.position.y>bodyBounds.max.y&&standalone.disk.position.x>0,'Spindle is above the motor, offset from the rear attachment');
standalone.group.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.bumpMap?.dispose();o.material.dispose();}});
Object.assign(v,{model:new THREE.Group(),context:new THREE.Group(),floor:new THREE.Object3D(),parts:[],group:'all',mode:'explore',explode:0,targetExplode:0,selected:null,faint:false,camera:new THREE.PerspectiveCamera(34,1.5,1,15000)});
v.controls={target:new THREE.Vector3(),update(){v.camera.lookAt(this.target);}};
const pose=t=>{v.time=t;v.updateParts();v.processPose();v.model.updateMatrixWorld(true);};
for(const family of families){
 v.build(family.id);v.mode='process';const R=family.id/2;
 for(const t of [0,.3,.55,.8,1,1.3,1.6,1.85,2,2.3,2.8,3.5,7.95,9.99,.55]){
  pose(t);
  const [a,b,c,d]=v.robot.armPoints;near(a.distanceTo(b),v.robot.armLength);near(c.distanceTo(d),v.robot.armLength);
  for(const point of [a,b,c,d])near(point.z,0);
  for(const {o} of v.robot.links){const direction=new THREE.Vector3(1,0,0).applyQuaternion(o.quaternion);near(direction.z,0);}
  if(t<2.55){
   const fork=v.robot.cutter.group.localToWorld(new THREE.Vector3(-43,0,0));
   near(fork.distanceTo(v.robot.front.localToWorld(b.clone())),0);
   assert.equal(v.robot.cutter.group.parent,v.robot.front,'Cutter rotates with the front module');
  }
  if(t<2.55){assert.ok(v.parts.every(p=>!p.node.visible),'No mould during cutting');assert.ok(v.robot.cutter.group.visible);}
  else assert.ok(!v.robot.cutter.group.visible,'No cutter during mould operation');
  assert.ok(v.robot.group.position.toArray().every(Number.isFinite));
  for(const o of [v.pipe,v.branch])assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));
  if(t>=.18&&t<=.9||t>=1.12&&t<=1.88){
   const target=millingTarget(R,millingState(t),breakoutContour,branchBottom,passage.radius);
   near(v.robot.cutter.disk.getWorldPosition(new THREE.Vector3()).distanceTo(target.point),0);
  }
 }
 pose(.55);const before=Array.from(v.pipe.geometry.attributes.position.array),tool=v.robot.cutter.disk.getWorldPosition(new THREE.Vector3());
 pose(9.99);pose(.55);assert.deepEqual(Array.from(v.pipe.geometry.attributes.position.array),before,'Backward seek restores partially milled pipe');
 v.setSections({pipe:!v.sections.pipe,shield:true,hideRobot:true});pose(.55);
 assert.deepEqual(Array.from(v.pipe.geometry.attributes.position.array),before,'View cuts do not change removal');
 near(tool.distanceTo(v.robot.cutter.disk.getWorldPosition(new THREE.Vector3())),0);
 assert.ok(!v.robot.group.visible,'Robot toggle hides cutter and robot');v.setSections({hideRobot:false});
 const pipe=damagedPipeGeometry(R,4600,18,1),pa=pipe.attributes.position;
 near(Math.hypot(pa.getY(161),pa.getZ(161)),R+millingSpec.depth);
 const branch=brokenBranch(R,R+300,1),ba=branch.attributes.position;
 near(Math.hypot(ba.getX(322),ba.getZ(322)),passage.radius+millingSpec.grooveDepth);
 near((ba.getY(322)+ba.getY(483))/2-(R+millingSpec.branchEdge),50);
 for(let i=0;i<=160;i++)near((ba.getY(322+i)+ba.getY(483+i))/2,R+millingSpec.branchEdge+50);
 const healed=packedBranchGeometry(R,1).attributes.position;
 for(let i=0;i<41*161;i++)near(Math.hypot(healed.getX(i),healed.getZ(i)),passage.radius);
 near(healed.getY(40*161),branchProfile(R,0)[5]);
 for(const [row,height,depth] of [[12,1,millingSpec.relief],[13,1,millingSpec.grooveDepth],[24,3,millingSpec.grooveDepth],[25,3,millingSpec.relief]]){
  const k=41*161+row*161;near(healed.getY(k),branchProfile(R,0)[height]);near(Math.hypot(healed.getX(k),healed.getZ(k)),passage.radius+depth);
 }
 v.repair.setMilling(1,1,.99);assert.ok(v.repair.millingProgress.fill<1,'Nearly full must not use the final geometry cache key');
 v.repair.setMilling(1,1,1);near(v.repair.packedBranch.geometry.attributes.position.getY(40*161),branchProfile(R,0)[5]);
 const complete=Array.from(v.repair.packedBranch.geometry.attributes.position.array);
 v.repair.setMilling(1,1,.91);v.repair.setMilling(1,1,.999);v.repair.setMilling(1,1,1);
 assert.deepEqual(Array.from(v.repair.packedBranch.geometry.attributes.position.array),complete,'Final filling closes the rim after every near-complete or backward seek');
 assert.ok(healed.getY(40*161)>R+millingSpec.branchEdge+50+millingSpec.depth/2,'Mortar extends past the whole groove');
 for(let i=0;i<=160;i++){const x=pa.getX(2*161+i),arc=Math.atan2(pa.getZ(2*161+i),pa.getY(2*161+i))*R;near(Math.hypot(x,arc),millingSpec.outerRadius);}
 pose(0);assert.ok(v.repair.projection.visible&&v.repair.roots.visible);const initial=Array.from(v.repair.projection.geometry.attributes.position.array);
 assert.ok(new THREE.Box3().setFromObject(v.repair.projection).min.y<R,'Initial lateral projects into main sewer');
 pose(.45);assert.ok(!v.repair.projection.visible&&!v.repair.roots.visible,'Projection and roots removed before circular milling');
 pose(7.52);assert.ok(!v.repair.packedBranch.visible,'No isolated mortar above the unfilled cavity');pose(7.8);assert.ok(v.repair.packedBranch.visible&&v.repair.lastFill===1,'Branch wall fills only after cavity is full');pose(9.99);assert.ok(v.repair.packedBranch.visible);pose(0);assert.deepEqual(Array.from(v.repair.projection.geometry.attributes.position.array),initial);assert.ok(v.repair.roots.visible&&!v.repair.packedBranch.visible);
 pose(0);assert.ok(!v.repair.ground.grout.visible,'No ground grout before injection');
 pose(7.52);const groundEarly=Array.from(v.repair.ground.grout.geometry.attributes.position.array);
 pose(9.99);const ground=v.repair.ground,ga=ground.grout.geometry.attributes.position;
 assert.equal(ground.lastFill,1,'Ground injection finishes completely');
 let spread=0,depth=0;
 for(let i=0;i<ga.count;i++){
  const radial=Math.hypot(ga.getX(i),ga.getZ(i));spread=Math.max(spread,radial);depth=Math.max(depth,ga.getY(i)-R);
  assert.ok(radial>=passage.radius+passage.wall-.001,'Ground grout remains outside the lateral wall');
  assert.ok(Math.hypot(ga.getY(i),ga.getZ(i))>R,'No ground grout intrudes into main sewer');
 }
 assert.ok(spread>millingSpec.outerRadius+60&&depth>200,'Final ground body extends well beyond the milled pipe patch');
 const groundFull=Array.from(ga.array);v.setSections({pipe:false});assert.deepEqual(Array.from(ga.array),groundFull,'Cutaway only changes visibility');
 assert.ok(!ground.groutSection.visible&&!ground.soilSection.visible&&!ground.stones.visible,'No cut faces in full view');v.setSections({pipe:true});
 assert.ok(ground.groutSection.visible&&ground.soilSection.visible,'Cutaway exposes soil and deep grout together');
 pose(7.52);assert.deepEqual(Array.from(ground.grout.geometry.attributes.position.array),groundEarly,'Reverse seeking restores the same expanding ground body');
 pose(0);assert.ok(!ground.grout.visible&&!ground.groutSection.visible,'Reverse seek removes injected ground material');
 assert.equal(PHASE.POSITION,3);console.log(`DN ${family.id}: cutter contact, fixed links, groove, deep ground filling and reverse seeking passed.`);
 pipe.dispose();branch.dispose();
}
v.clear();
