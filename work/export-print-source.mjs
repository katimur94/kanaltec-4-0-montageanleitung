// Static print snapshots from the same source model; rendering cuts become real cuts later.
import * as THREE from 'three';
import {Viewer,setPrintGeometryMode} from '../src/model.js';
import {mkdir,writeFile} from 'node:fs/promises';
const detail=process.argv.includes('--detail');if(detail)setPrintGeometryMode(true);
const out=detail?'work/qa/print-detail-source':'work/qa/print-source';await mkdir(out,{recursive:true});
const v=Object.create(Viewer.prototype);
Object.assign(v,{model:new THREE.Group(),context:new THREE.Group(),floor:new THREE.Object3D(),parts:[],group:'all',mode:'explore',explode:0,targetExplode:0,selected:null,faint:false,camera:new THREE.PerspectiveCamera(34,1.5,1,15000)});
v.controls={target:new THREE.Vector3(),update(){v.camera.lookAt(this.target);}};
const under=(o,parent)=>{for(let a=o;a;a=a.parent)if(a===parent)return true;return false;};
function color(o){
 if(under(o,v.winding.group))return 8;
 if(under(o,v.inlet))return 4;
 if(o===v.feed)return 2;
 const c=o.material?.color;if(!c)return 2;
 const rgb=c.clone().convertLinearToSRGB(),{r,g,b}=rgb;
 if(r>.35&&g>.28&&b<Math.min(r,g)*.8)return 4;
 if(b>r*1.25&&b>.35)return 5;
 if(Math.max(r,g,b)<.52)return 3;
 return 2;
}
 for(const kind of ['01-Roboter-und-Schalung','02-Nur-Schalung','03-Rohrsanierung-Schnitt']){
 const selected=process.argv.slice(2).find(a=>!a.startsWith('--'));if(selected&&selected!==kind)continue;
 v.build(400);v.mode='process';v.time=kind.startsWith('03')?6.999:2.999;v.updateParts();v.processPose();
 const scene=kind.startsWith('03'),solo=kind.startsWith('02');
 v.model.updateMatrixWorld(true);v.context.updateMatrixWorld(true);
 const records=[],chunks=[];let offset=0;
 function add(o,material,clip=false){
  if(o?.isInstancedMesh){for(let i=0;i<o.count;i++){const matrix=new THREE.Matrix4();o.getMatrixAt(i,matrix);add({isMesh:true,geometry:o.geometry,material:o.material,matrixWorld:o.matrixWorld.clone().multiply(matrix),name:'Bodenklumpen'},material,clip);}return;}
  if(!o?.isMesh){if(o?.isObject3D)o.traverseVisible(child=>{if(child.isMesh)add(child,material,clip);});return;}
  const g=o.geometry,p=g.attributes.position,idx=g.index;const end=Math.min(idx?idx.count:p.count,g.drawRange.start+g.drawRange.count),start=g.drawRange.start;
  if(end-start<3)return;const data=new Float32Array(Math.floor((end-start)/3)*9),point=new THREE.Vector3();let n=0;
  for(let i=start;i<end-2;i+=3)for(let j=0;j<3;j++){point.fromBufferAttribute(p,idx?idx.getX(i+j):i+j).applyMatrix4(o.matrixWorld);data[n++]=point.x;data[n++]=point.y;data[n++]=point.z;}
  if(!data.every(Number.isFinite))throw Error('Nonfinite print geometry');
  records.push({offset,count:data.length/9,material,clip,name:o.name||g.type});chunks.push(Buffer.from(data.buffer));offset+=data.byteLength;
 }
 v.model.traverseVisible(o=>{if(!o.isMesh||under(o,v.repair.hoseGroup)||solo&&under(o,v.robot.group))return;
  const shield=v.parts.some(p=>['shield','mat','carrier'].includes(p.key)&&under(o,p.node));add(o,color(o),scene&&shield);
 });
 if(scene){
  for(const [o,m]of [[v.repair.pipeFull,6],[v.repair.branchFull,6],[v.repair.ground.soil,7],[v.repair.ground.grout,9],[v.repair.mortar,9],[v.repair.branchMortar,9],[v.repair.innerSkin,9]])add(o,m,true);
  v.repair.ground.clods.traverseVisible(o=>{if(o.isMesh)add(o,7,true);});
 }
 const bounds=solo?[-405,350,-240,500,-240,240]:[-1820,420,-240,scene?v.branchTop+10:500,-310,310];
 await writeFile(`${out}/${kind}.bin`,Buffer.concat(chunks));await writeFile(`${out}/${kind}.json`,JSON.stringify({kind,units:'mm',variantDN:400,time:v.time,bounds,records}));
 console.log(kind,records.length,'meshes',Math.round(offset/1048576)+' MB');
}
