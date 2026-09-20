import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Viewer} from '../src/model.js';
import {families,PHASE,stages} from '../src/data.js';
import {millingSpec,millingState,millingTarget,repairFootprint} from '../src/milling.js';
import {damagedPipeGeometry,brokenBranch,breakoutContour,branchBottom} from '../src/repair.js';
import {passage} from '../src/bladder.js';
import {makeCutter} from '../src/cutter.js';
assert.equal(stages.length,9,'Nine phases after removing internal milling');
assert.equal(stages[1].title,'Zur Schalung wechseln','Freifräsen is followed directly by tool change');
assert.ok(!stages.some(stage=>/Nut/i.test(stage.title)),'No groove phase remains');
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
 for(const t of [0,.3,.55,.8,.9,1,1.3,1.54,1.55,1.8,2,2.5,6.95,8.99,.55]){
  pose(t);
  const [a,b,c,d]=v.robot.armPoints;near(a.distanceTo(b),v.robot.armLength);near(c.distanceTo(d),v.robot.armLength);
  for(const point of [a,b,c,d])near(point.z,0);
  for(const {o} of v.robot.links){const direction=new THREE.Vector3(1,0,0).applyQuaternion(o.quaternion);near(direction.z,0);}
  if(t<PHASE.CHANGE+.55){
   const fork=v.robot.cutter.group.localToWorld(new THREE.Vector3(-43,0,0));
   near(fork.distanceTo(v.robot.front.localToWorld(b.clone())),0);
   assert.equal(v.robot.cutter.group.parent,v.robot.front,'Cutter rotates with the front module');
  }
  if(t<PHASE.CHANGE+.55){assert.ok(v.parts.every(p=>!p.node.visible),'No mould during cutting');assert.ok(v.robot.cutter.group.visible);}
  else assert.ok(!v.robot.cutter.group.visible,'No cutter during mould operation');
  assert.ok(v.robot.group.position.toArray().every(Number.isFinite));
  for(const o of [v.pipe,v.branch])assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));
  if(t>=.18&&t<=.9){
   const target=millingTarget(R,millingState(t),breakoutContour,branchBottom,passage.radius);
   near(v.robot.cutter.disk.getWorldPosition(new THREE.Vector3()).distanceTo(target.point),0);
  }
 }
 pose(.55);const before=Array.from(v.pipe.geometry.attributes.position.array),tool=v.robot.cutter.disk.getWorldPosition(new THREE.Vector3());
 pose(PHASE.REMOVE+.99);pose(.55);assert.deepEqual(Array.from(v.pipe.geometry.attributes.position.array),before,'Backward seek restores partially milled pipe');
 v.setSections({pipe:!v.sections.pipe,shield:true,hideRobot:true});pose(.55);
 assert.deepEqual(Array.from(v.pipe.geometry.attributes.position.array),before,'View cuts do not change removal');
 near(tool.distanceTo(v.robot.cutter.disk.getWorldPosition(new THREE.Vector3())),0);
 assert.ok(!v.robot.group.visible,'Robot toggle hides cutter and robot');v.setSections({hideRobot:false});
 const pipe=damagedPipeGeometry(R,4600,18,1),pa=pipe.attributes.position;
 near(Math.hypot(pa.getY(161),pa.getZ(161)),R+millingSpec.depth);
 const branch=brokenBranch(R,R+300),ba=branch.attributes.position;
 for(let i=0;i<2*161;i++)near(Math.hypot(ba.getX(i),ba.getZ(i)),passage.radius);
 // A forward and backward timeline jump must never cut a hidden ring in the bore.
 const initialBore=Array.from(v.branch.geometry.attributes.position.array);
 for(const t of [.95,1.3,2.5,PHASE.MORTAR+.99,PHASE.REMOVE+.99,.55]){
  pose(t);assert.deepEqual(Array.from(v.branch.geometry.attributes.position.array),initialBore,'Branch bore remains unchanged without internal milling');
 }
 v.repair.setMilling(1,.99);assert.ok(v.repair.millingProgress.fill<1,'Nearly full must not use final cache key');
 v.repair.setMilling(1,1);const complete=Array.from(v.pipe.geometry.attributes.position.array);
 v.repair.setMilling(1,.91);v.repair.setMilling(1,.999);v.repair.setMilling(1,1);
 assert.deepEqual(Array.from(v.pipe.geometry.attributes.position.array),complete,'Final pipe repair restores after backward seeking');
 for(let i=0;i<=160;i++){
  const a=i/160*Math.PI*2,[expectedX,expectedArc]=repairFootprint(R,a),x=pa.getX(2*161+i),arc=Math.atan2(pa.getZ(2*161+i),pa.getY(2*161+i))*R;
  near(x,expectedX);near(arc,expectedArc);
  assert.ok(Math.abs(x)<230&&Math.abs(arc)<(R-12)*.84,'Finished patch stays within the oval shield with lateral sealing margin');
  const [hx,ha]=breakoutContour(a);assert.ok(((hx-2.3275)/121.4125)**2+(ha/67)**2<.98,'Shorter oval encloses the whole broken edge');
 }
 const castBounds=new THREE.Box3().setFromObject(v.repair.innerSkin),castSize=castBounds.getSize(new THREE.Vector3());
 assert.ok(castSize.x>castSize.z*1.8,'Shorter casting retains its oval shape');
 assert.ok(castSize.x<244&&castSize.z<135,'Only the longitudinal size is shortened');
 near(repairFootprint(R,0)[0]-82.15,(165*1.002-82.15)/2);
 near(-73.5-repairFootprint(R,Math.PI)[0],(-73.5+165*.998)/2);
 near(repairFootprint(R,Math.PI/2)[1],67*(1+.003*Math.sin(11*Math.PI/2)+.002*Math.cos(17*Math.PI/2)));
 assert.ok(castBounds.min.y>R*.69,'Casting remains localized at the crown, not half of the main pipe');
 assert.ok(Math.abs(breakoutContour(0)[0]+breakoutContour(Math.PI)[0])>20,'Breakout is asymmetric');
 assert.ok(new Set(v.repair.streams.map(s=>s.radius)).size>=5,'Different seepage strengths instead of identical jets');
 pose(0);assert.ok(v.repair.projection.visible&&v.repair.roots.visible);const initial=Array.from(v.repair.projection.geometry.attributes.position.array);
 assert.ok(new THREE.Box3().setFromObject(v.repair.projection).min.y<R,'Initial lateral projects into main sewer');
 pose(.45);assert.ok(!v.repair.projection.visible&&!v.repair.roots.visible,'Projection and roots removed before circular milling');
 pose(PHASE.REMOVE+.99);assert.ok(v.repair.mortar.visible&&v.repair.innerSkin.visible);pose(0);assert.deepEqual(Array.from(v.repair.projection.geometry.attributes.position.array),initial);assert.ok(v.repair.roots.visible&&!v.repair.mortar.visible);
 // Mortar rises in the intact branch only after the defect has filled.
 pose(PHASE.MORTAR+.52);assert.ok(!v.repair.branchMortar.visible,'No isolated mortar before the cavity fills');
 pose(PHASE.MORTAR+.75);assert.ok(v.repair.branchMortar.visible&&v.repair.lastFill===1,'Rising lining joins a filled defect');
 const intermediate=Array.from(v.repair.branchMortar.geometry.attributes.position.array);
 const intermediateTop=new THREE.Box3().setFromObject(v.repair.branchMortar).max.y;
 pose(PHASE.MORTAR+.95);
 const shieldY=v.winding.shieldTop+v.winding.group.position.y;
 const bladderTop=v.winding.tip.getWorldPosition(new THREE.Vector3()).y+7;
 const lining=v.repair.branchMortar.geometry.attributes.position;
 near(new THREE.Box3().setFromObject(v.repair.branchMortar).max.y,(shieldY+bladderTop)/2);
 assert.ok(intermediateTop<v.repair.branchFillTop,'Lining grows upwards progressively');
 for(let i=0;i<lining.count;i++){
  const r=Math.hypot(lining.getX(i),lining.getZ(i));
  assert.ok(r>=passage.mouldRadius-.001&&r<=passage.radius+.001,'Mortar occupies only the existing gap outside the bladder');
 }
 for(let i=0;i<=160;i++)near(lining.getY(i),branchBottom(R,i/160*Math.PI*2)-1);
 const finalLining=Array.from(lining.array);
 v.setSections({pipe:false,hideBladder:true});assert.deepEqual(Array.from(lining.array),finalLining,'View settings do not change the lining');
 assert.ok(!v.repair.branchMortarSection.visible);v.setSections({pipe:true,hideBladder:false});assert.ok(v.repair.branchMortarSection.visible);
 pose(PHASE.REMOVE+.99);assert.deepEqual(Array.from(v.repair.branchMortar.geometry.attributes.position.array),finalLining,'Cured lining stays after removal');
 pose(PHASE.MORTAR+.75);assert.deepEqual(Array.from(v.repair.branchMortar.geometry.attributes.position.array),intermediate,'Backward seek restores intermediate lining');
 pose(0);assert.ok(!v.repair.branchMortar.visible&&!v.repair.branchMortarSection.visible,'Rewind removes the lining');
 pose(0);assert.ok(!v.repair.ground.grout.visible,'No ground grout before injection');
 const soil=v.repair.ground.soil.geometry.attributes.position,top=[];
 for(let i=0;i<=128;i++)top.push(soil.getY((73+72)*129+i));
 assert.ok(Math.max(...top)-Math.min(...top)>35,'Soil top is uneven instead of a flat box lid');
 assert.ok(v.repair.ground.clods.count>300,'Soil exterior has actual granular relief');
 v.repair.ground.group.updateMatrixWorld(true);
 const voidRay=new THREE.Raycaster(new THREE.Vector3(80,R+60,50),new THREE.Vector3(0,0,-1),.001,50.1);
 assert.equal(voidRay.intersectObject(v.repair.ground.soilSection).length,0,'Cut soil leaves an actual washed-out void beside the branch');
 pose(PHASE.MORTAR+.52);const groundEarly=Array.from(v.repair.ground.grout.geometry.attributes.position.array);
 pose(PHASE.REMOVE+.99);const ground=v.repair.ground,ga=ground.grout.geometry.attributes.position;
 assert.equal(ground.lastFill,1,'Ground injection finishes completely');
 ground.group.updateMatrixWorld(true);
 assert.ok(voidRay.intersectObject(ground.groutSection).length>0,'Injection subsequently fills the previously empty bedding cavity');
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
 pose(PHASE.MORTAR+.52);assert.deepEqual(Array.from(ground.grout.geometry.attributes.position.array),groundEarly,'Reverse seeking restores the same expanding ground body');
 pose(0);assert.ok(!ground.grout.visible&&!ground.groutSection.visible,'Reverse seek removes injected ground material');
 assert.equal(PHASE.POSITION,2);console.log(`DN ${family.id}: cutter contact, fixed links, intact branch bore, deep ground filling and reverse seeking passed.`);
 pipe.dispose();branch.dispose();
}
v.clear();
