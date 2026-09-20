import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Viewer} from '../src/model.js';
import {families} from '../src/data.js';
import {ports} from '../src/bladder.js';
import {soilCavityRadius} from '../src/ground-grout.js';
import {stagesForRepair,processTimeFor} from '../src/closure.js';
import {repairFootprint} from '../src/milling.js';
import {breakoutContour} from '../src/repair.js';

const v=Object.create(Viewer.prototype);
Object.assign(v,{model:new THREE.Group(),context:new THREE.Group(),floor:new THREE.Object3D(),parts:[],group:'all',mode:'process',explode:0,targetExplode:0,selected:null,faint:false,camera:new THREE.PerspectiveCamera(34,1.5,1,15000)});
v.controls={target:new THREE.Vector3(),update(){v.camera.lookAt(this.target);}};
const pose=t=>{v.setProcess(t);v.updateParts();v.processPose();v.model.updateMatrixWorld(true);v.context.updateMatrixWorld(true);};
const rayAt=(object,x,y,z=0)=>new THREE.Raycaster(new THREE.Vector3(x,y,z),new THREE.Vector3(0,-1,0),.001,900).intersectObject(object,true);
for(const f of families)for(const kind of ['closure','pipe']){
 v.repairOptions={kind,infiltration:true,cavity:'large'};v.build(f.id);
 pose(5.99);
 assert.equal(v.winding.group.visible,false,'No bladder assembly');
 assert.equal(v.shaftPart.node.rotation.x,0,'Bare shaft remains still');
 assert.ok(rayAt(v.shieldPart.node,v.workOffset,f.id/2+30).length,'Real shield geometry closes central aperture');
 for(const x of [ports.sensorX,ports.inletX])assert.equal(rayAt(v.shieldPart.node,x+v.workOffset,f.id/2+30).length,0,'Functional ports remain open');
 assert.ok(Math.abs(v.inlet.getWorldPosition(new THREE.Vector3()).x)<1e-8,'Inlet centred below the defect');
 assert.equal(v.repair.inletX,0,'Mortar enters at defect centre');
 const marks=v.repair.innerSkin.children.filter(o=>o.userData.imprint).map(o=>o.userData.imprint);
 assert.equal(marks.find(p=>p.key==='inlet').x,0,'Inlet imprint stays under physical inlet');
 assert.equal(marks.find(p=>p.key==='sensor').x,ports.sensorX+v.workOffset,'Sensor imprint follows assembly positioning');
 const outline=Array.from({length:160},(_,i)=>repairFootprint(f.id/2,i/160*Math.PI*2,true));
 const xs=outline.map(p=>p[0]),arcs=outline.map(p=>p[1]);
 const cx=(Math.max(...xs)+Math.min(...xs))/2,rx=(Math.max(...xs)-Math.min(...xs))/2,rz=Math.max(...arcs);
 const inside=(x,arc)=>((x-cx)/rx)**2+(arc/rz)**2;
 for(let i=0;i<160;i++){
  const a=i/160*Math.PI*2,[x,z]=breakoutContour(a);assert.ok(inside(x,z)<1,'Casting surrounds the full defect');
  const [px,arc]=repairFootprint(f.id/2,a,true);assert.ok(Math.abs(px-v.workOffset)<250&&Math.abs(arc)<v.radius*1.13,'Casting remains inside positioned shield');
  for(const mark of marks){const mx=mark.x+mark.r*Math.cos(a),mz=mark.z+mark.r*Math.sin(a);assert.ok(inside(mx,v.radius*Math.asin(mz/v.radius))<.95,'Full imprint remains inside the rounded casting');}
 }
 const castSize=new THREE.Box3().setFromObject(v.repair.innerSkin).getSize(new THREE.Vector3());
 assert.ok(castSize.x/castSize.z>1.1&&castSize.x/castSize.z<1.3,'Finished casting is round with only a slight oval, for every DN');
 const signature=()=>[...v.repair.mortarGeometry.attributes.position.array,v.upperLift,v.sealAir,v.shaftPart.node.rotation.x,v.repair.waterActivity];
 pose(6.61);const partial=signature();pose(8.999);
 assert.equal(v.repair.water.visible,false,'No renewed infiltration after cure/removal');
 assert.ok(rayAt(v.repair.innerSkin,0,f.id/2+2).length,'Finished inner face has no central hole');
 if(kind==='pipe'){
  assert.equal(v.repair.branch.visible||v.repair.branchFull.visible||v.repair.branchMortar.visible,false,'No fictitious branch at pipe hole');
  const ray=new THREE.Raycaster(new THREE.Vector3(0,f.id/2+280,0),new THREE.Vector3(0,-1,0),.001,260);
  assert.ok(ray.intersectObject(v.repair.ground.grout).length,'Filled ground has no axial branch bore');
 }else{
  assert.ok(rayAt(v.repair.branchMortar,0,v.branchTop+20).length,'Solid plug closes the abandoned branch');
  const p=v.repair.branchMortar.geometry.attributes.position;let maxY=-Infinity;for(let i=0;i<p.count;i++)maxY=Math.max(maxY,p.getY(i));
  assert.ok(Math.abs((maxY-(f.id/2+12))/(v.branchTop-(f.id/2+12))-.95)<1e-5,'Branch is almost completely filled');
 }
 pose(6.61);assert.deepEqual(signature(),partial,'Seeking backwards restores exact partial fill');
 for(const t of [2.1,2.7,3.5,3.99,4.99,8.8,2.7]){
  pose(t);const before=signature();
  v.setSections({pipe:false,shield:true,hideBladder:false});pose(t);
  assert.deepEqual(signature(),before,'Display cuts cannot change the physical pose or water');
  assert.equal(v.winding.group.visible,false,'Display settings never restore the absent bladder');
  v.setSections({pipe:true,shield:false});
 }
 pose(2.7);assert.ok(v.repair.waterActivity>0,'Wet defect shows infiltration');
 v.repair.options.infiltration=false;pose(2.7);assert.equal(v.repair.waterActivity,0,'Dry defect has no water');
 assert.equal(v.repair.damp.visible,false,'Dry defect has no wet marks');
 assert.ok(soilCavityRadius(0,0,{kind,cavity:'large'})>soilCavityRadius(0,0,{kind,cavity:'local'})+70,'Large cavity changes actual geometry');
 v.repairOptions.milling=false;v.repair.options.milling=false;
 for(const t of [0,2.6,4.9,6.61,8.999,2.6]){
  pose(t);assert.equal(v.robot.cutter.group.visible,false,'Direct process never mounts cutter');
  assert.equal(v.repair.millingProgress.outer,0,'Direct process never mills pipe wall');
  assert.equal(v.repair.projection.visible||v.repair.roots.visible,false,'No protrusion in direct process');
 }
 const direct=stagesForRepair(kind,false);assert.deepEqual(direct.map(s=>s.phase),[2,3,4,5,6,7,8]);
 assert.equal(processTimeFor(direct,0),2);assert.equal(processTimeFor(direct,4.5),6.5);assert.ok(Math.abs(processTimeFor(direct,6.999)-8.999)<1e-10);
 console.log(`${f.label}: ${kind}, closed shield/plug, water, cuts and seeking OK`);
}
v.repairOptions={kind:'open',infiltration:true,cavity:'large'};v.build(400);pose(5.99);
assert.equal(v.winding.group.visible,true,'Original bladder returns when changing application');
assert.equal(rayAt(v.shieldPart.node,0,230).length,0,'Original central aperture returns');
v.clear();console.log('Closed-mould regression passed.');
