import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Viewer,setPrintGeometryMode} from '../src/model.js';
function build(detail){
 setPrintGeometryMode(detail);
 const v=Object.create(Viewer.prototype);
 Object.assign(v,{model:new THREE.Group(),context:new THREE.Group(),floor:new THREE.Object3D(),parts:[],group:'all',mode:'explore',explode:0,targetExplode:0,selected:null,faint:false,camera:new THREE.PerspectiveCamera(34,1.5,1,15000)});
 v.controls={target:new THREE.Vector3(),update(){v.camera.lookAt(this.target);}};
 v.build(400);return v;
}
const normal=build(false),detail=build(true);
assert.equal(normal.parts.length,detail.parts.length);
for(const key of ['shield','mat','carrier']){
 const a=normal.parts.find(p=>p.key===key).node,b=detail.parts.find(p=>p.key===key).node;
 const ba=new THREE.Box3().setFromObject(a),bb=new THREE.Box3().setFromObject(b);
 assert.ok(ba.min.distanceTo(bb.min)<1&&ba.max.distanceTo(bb.max)<1,`${key}: source dimensions drifted`);
 b.traverse(o=>{
  if(!o.isMesh)return;
  const g=o.geometry,index=g.index;assert.ok(index,`${key}: indexed print surface required`);
  const edges=new Map(),vertices=new Map(),canonical=[],faces=new Set(),position=g.attributes.position;
  for(let i=0;i<position.count;i++){const k=[position.getX(i),position.getY(i),position.getZ(i)].map(x=>Math.round(x*1000)).join(':');if(!vertices.has(k))vertices.set(k,vertices.size);canonical.push(vertices.get(k));}
  for(let i=0;i<index.count;i+=3){const ids=[canonical[index.getX(i)],canonical[index.getX(i+1)],canonical[index.getX(i+2)]];if(new Set(ids).size<3)continue;const face=[...ids].sort((a,b)=>a-b).join(':');if(faces.has(face))continue;faces.add(face);for(let j=0;j<3;j++){const x=ids[j],y=ids[(j+1)%3],k=x<y?`${x}:${y}`:`${y}:${x}`;edges.set(k,(edges.get(k)||0)+1);}}
  assert.ok([...edges.values()].every(n=>n===2),`${key}: open or nonconforming triangle boundary`);
 });
}
setPrintGeometryMode(false);
console.log('DN 400 print shells: closed conforming edges, original bounds and part count preserved.');
