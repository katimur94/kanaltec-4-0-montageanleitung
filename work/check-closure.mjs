import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Viewer} from '../src/model.js';
import {families} from '../src/data.js';
import {ports} from '../src/bladder.js';
import {soilCavityRadius} from '../src/ground-grout.js';

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
 assert.ok(rayAt(v.shieldPart.node,0,f.id/2+30).length,'Real shield geometry closes central aperture');
 for(const x of [ports.sensorX,ports.inletX])assert.equal(rayAt(v.shieldPart.node,x,f.id/2+30).length,0,'Functional ports remain open');
 const signature=()=>[...v.repair.mortarGeometry.attributes.position.array,v.upperLift,v.sealAir,v.shaftPart.node.rotation.x,v.repair.waterActivity];
 pose(6.61);const partial=signature();pose(8.999);
 assert.equal(v.repair.water.visible,false,'No renewed infiltration after cure/removal');
 assert.ok(rayAt(v.repair.innerSkin,0,f.id/2+2).length,'Finished inner face has no central hole');
 if(kind==='pipe'){
  assert.equal(v.repair.branch.visible||v.repair.branchFull.visible||v.repair.branchMortar.visible,false,'No fictitious branch at pipe hole');
  const ray=new THREE.Raycaster(new THREE.Vector3(0,f.id/2+280,0),new THREE.Vector3(0,-1,0),.001,260);
  assert.ok(ray.intersectObject(v.repair.ground.grout).length,'Filled ground has no axial branch bore');
 }else assert.ok(rayAt(v.repair.branchMortar,0,f.id/2+90).length,'Solid plug closes the abandoned branch');
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
 console.log(`${f.label}: ${kind}, closed shield/plug, water, cuts and seeking OK`);
}
v.repairOptions={kind:'open',infiltration:true,cavity:'large'};v.build(400);pose(5.99);
assert.equal(v.winding.group.visible,true,'Original bladder returns when changing application');
assert.equal(rayAt(v.shieldPart.node,0,230).length,0,'Original central aperture returns');
v.clear();console.log('Closed-mould regression passed.');
