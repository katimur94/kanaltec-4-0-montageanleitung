import * as THREE from 'three';

// User-described assembly: threaded bladder foot in the single flat shaft face.
// Dimensions and elastic folds are reconstructed, not manufacturing dimensions.
export const ports={opening:40,tip:36,inletX:-66,inletRadius:7,sensorX:70,sensorRadius:9};
export const bladderMount={flat:6.5,seat:7.1,radius:35,capHeight:6,threadBottom:-2.5,threadTop:6.4};
// Each collapsed wall is about 3 mm: two walls form a 6 mm folded bladder.
export const windingSpec={turns:3,wall:3,folded:6,layerGap:.3};
const clamp=THREE.MathUtils.clamp,lerp=THREE.MathUtils.lerp;
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const flat=bladderMount.flat,rootHeight=bladderMount.seat+bladderMount.capHeight,initialAngle=windingSpec.turns*2*Math.PI,layerPitch=(windingSpec.folded+windingSpec.layerGap)/(2*Math.PI),rows=576,columns=48;
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
function indexedSurface(n,m){
 const g=new THREE.BufferGeometry(),indices=[];
 g.setAttribute('position',new THREE.BufferAttribute(new Float32Array((n+1)*(m+1)*3),3));
 g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array((n+1)*(m+1)*2),2));
 for(let i=0;i<n;i++)for(let j=0;j<m;j++){const a=i*(m+1)+j,b=a+m+1;indices.push(a,b,a+1,b,b+1,a+1);}
 g.setIndex(indices);return g;
}
function contactRadius(a){const c=Math.cos(a);return (c>flat/17?flat/c:17)+(rootHeight-flat)+layerPitch*a;}
function coilPoint(a,angle){const r=contactRadius(a),phase=a-angle;return V(0,r*Math.cos(phase),r*Math.sin(phase));}
function woundLength(angle){let length=0,previous=coilPoint(0,angle);const n=Math.max(1,Math.ceil(angle*100));for(let i=1;i<=n;i++){const p=coilPoint(angle*i/n,angle);length+=p.distanceTo(previous);previous=p;}return length;}
// Derive insertion travel from the material in three complete turns. Keeping
// the former 145 mm stroke would leave material wrapped or stretch the bladder.
const travel=woundLength(initialAngle)-contactRadius(initialAngle)+rootHeight;
function windingState(extension){
 if(extension===0)return {angle:initialAngle,stored:woundLength(initialAngle),end:contactRadius(initialAngle)};
 const excess=travel*(1-extension);if(excess<1e-8)return {angle:0,stored:0,end:rootHeight};
 let lo=0,hi=initialAngle;for(let i=0;i<32;i++){const mid=(lo+hi)/2;if(woundLength(mid)-contactRadius(mid)+rootHeight<excess)lo=mid;else hi=mid;}
 const angle=(lo+hi)/2;return {angle,stored:woundLength(angle),end:contactRadius(angle)};
}
const windingTable=Array.from({length:601},(_,i)=>windingState(i/600));
function poseAt(extension){const x=extension*600,i=Math.floor(x),a=windingTable[i],b=windingTable[Math.min(600,i+1)],f=x-i;return {angle:lerp(a.angle,b.angle,f),stored:lerp(a.stored,b.stored,f),end:lerp(a.end,b.end,f)};}

function rubberRibs(){
 const data=new Uint8Array(4*64*4);for(let y=0;y<64;y++)for(let x=0;x<4;x++){const c=Math.round(lerp(150,240,smooth(Math.sin(y/64*Math.PI)**2))),i=(y*4+x)*4;data.set([c,c,c,255],i);}
 const texture=new THREE.DataTexture(data,4,64,THREE.RGBAFormat);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}
export class BladderMechanism {
 constructor(radius,shaftY){
  this.radius=radius;this.shaftY=shaftY;this.group=new THREE.Group();
  this.initialAngle=windingTable[0].angle;
  this.travel=travel;this.spec=windingSpec;
  this.totalLength=radius+1.5+travel-shaftY-rootHeight;
  const ribs=rubberRibs();this.material=new THREE.MeshStandardMaterial({color:'#30383b',roughness:.8,metalness:0,side:THREE.DoubleSide,map:ribs,bumpMap:ribs,bumpScale:.16});
  this.coilGeometry=indexedSurface(rows,columns);this.coil=new THREE.Mesh(this.coilGeometry,this.material);this.group.add(this.coil);
  this.bodyGeometry=indexedSurface(112,columns);this.body=new THREE.Mesh(this.bodyGeometry,this.material);this.group.add(this.body);
  const profile=[[0,0],[33,0],[36,1.5],[36,5.5],[34,7],[0,7]].map(p=>new THREE.Vector2(...p));
  this.tip=new THREE.Mesh(new THREE.LatheGeometry(profile,64),new THREE.MeshStandardMaterial({color:'#111619',roughness:.78,metalness:.03}));this.group.add(this.tip);
  this.attachment=new THREE.Group();this.attachment.position.y=shaftY;this.group.add(this.attachment);
  const metal=new THREE.MeshStandardMaterial({color:'#a4b1b7',metalness:.8,roughness:.3});
  const cylinder=(r,h,y,sides=48)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,sides),metal);m.position.y=y;this.attachment.add(m);return m;};
  // Male thread recessed in shaft: no exposed air fitting, hex collar or neck.
  cylinder(7.05,bladderMount.threadTop-bladderMount.threadBottom,(bladderMount.threadTop+bladderMount.threadBottom)/2);
  const threadPoints=[];for(let i=0;i<=240;i++){const t=i/240,a=t*Math.PI*16;threadPoints.push(V(7.18*Math.cos(a),-2.25+t*8.4,7.18*Math.sin(a)));}
  this.attachment.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(threadPoints),240,.18,5,false),metal));
  // User: the shaft-side end is a rigid, flat-ended disc, approximately Ø70.
  // Only the central male thread enters the shaft; the broad face stays flat.
  this.rigidFoot=new THREE.Mesh(new THREE.CylinderGeometry(bladderMount.radius,bladderMount.radius,bladderMount.capHeight,64),new THREE.MeshStandardMaterial({color:'#20292c',roughness:.78}));this.rigidFoot.position.y=bladderMount.seat+bladderMount.capHeight/2;this.attachment.add(this.rigidFoot);
  this.attachment.userData.mount=bladderMount;
  this.seams=[];for(const section of ['coil','body'])for(const side of [-1,1]){
   const n=section==='coil'?rows:112,g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array((n+1)*3),3));
   const line=new THREE.Line(g,new THREE.LineBasicMaterial({color:'#73888c',transparent:true,opacity:.6}));this.group.add(line);this.seams.push({section,side,line});
  }
  this.group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});this.update(0,0);
 }
 update(extension,inflation=0){
  extension=clamp(extension,0,1);inflation=extension===1?clamp(inflation,0,1):0;
  if(extension===this.extension&&inflation===this.inflation)return this.shaftAngle;
  this.extension=extension;this.inflation=inflation;
  const state=poseAt(extension),angle=state.angle;
  this.shaftAngle=-angle;this.remainingTurns=angle/(2*Math.PI);
  this.storedLength=state.stored;this.deployedLength=this.totalLength-state.stored;
  this.fullyUnwound=extension===1;this.attachment.rotation.x=this.shaftAngle;
  const tipY=this.radius+1.5+travel*extension,baseY=this.shaftY+state.end;
  const cp=this.coilGeometry.attributes.position,cu=this.coilGeometry.attributes.uv;this.coil.visible=!this.fullyUnwound;
  for(let i=0;i<=rows;i++){
   const t=i/rows,a=t*angle,centre=coilPoint(a,angle);centre.y+=this.shaftY;
   const materialDistance=state.stored*t,flare=smooth(materialDistance/22);
   const rx=lerp(bladderMount.radius,55,flare),rz=lerp(bladderMount.radius,windingSpec.folded/2,flare);
   const before=coilPoint(Math.max(0,a-.001),angle),after=coilPoint(Math.min(angle,a+.001),angle),tangent=after.sub(before).normalize();
   tangent.lerp(V(0,Math.cos(-angle),Math.sin(-angle)),1-smooth(t/.08));
   tangent.lerp(V(0,1,0),smooth((t-.86)/.14)).normalize();const normal=V(0,-tangent.z,tangent.y);
   for(let j=0;j<=columns;j++){const u=j/columns*Math.PI*2,k=i*(columns+1)+j;cp.setXYZ(k,rx*Math.cos(u),centre.y+normal.y*rz*Math.sin(u),centre.z+normal.z*rz*Math.sin(u));cu.setXY(k,j/columns,materialDistance/2.2);}
  }
  cp.needsUpdate=cu.needsUpdate=true;this.coilGeometry.computeVertexNormals();this.coilGeometry.computeBoundingSphere();
  const bp=this.bodyGeometry.attributes.position,bu=this.bodyGeometry.attributes.uv;
  for(let i=0;i<=112;i++){
   const s=i/112,y=lerp(baseY,tipY,s),distance=state.stored+(y-baseY),flare=smooth(distance/22);
   const peel=smooth((y-baseY)/14),passage=smooth((y-(this.radius-38))/28)*peel,head=smooth((y-(tipY-23))/23)*peel;
   const swell=inflation*smooth((y-this.radius-7)/22)*smooth((tipY-y)/20),roundRadius=35.5+12.5*swell;
   const flatX=lerp(55,29,passage),flatZ=lerp(windingSpec.folded/2,3.8,passage),round=Math.max(head,inflation);
   const rx=lerp(bladderMount.radius,lerp(flatX,roundRadius,round),flare),rz=lerp(bladderMount.radius,lerp(flatZ,roundRadius,round),flare);
   for(let j=0;j<=columns;j++){const u=j/columns*Math.PI*2,pleat=(1-inflation)*(1-head)*passage*.8*Math.cos(u*6)*Math.sin(u),k=i*(columns+1)+j;bp.setXYZ(k,rx*Math.cos(u),y,rz*Math.sin(u)+pleat);bu.setXY(k,j/columns,distance/2.2);}
  }
  bp.needsUpdate=bu.needsUpdate=true;this.bodyGeometry.computeVertexNormals();this.bodyGeometry.computeBoundingSphere();
  for(const seam of this.seams){const positions=seam.section==='coil'?cp:bp,n=seam.section==='coil'?rows:112,out=seam.line.geometry.attributes.position,j=seam.side===1?0:columns/2;seam.line.visible=seam.section!=='coil'||this.coil.visible;for(let i=0;i<=n;i++){const k=i*(columns+1)+j;out.setXYZ(i,positions.getX(k)+seam.side*.12,positions.getY(k),positions.getZ(k));}out.needsUpdate=true;seam.line.geometry.computeBoundingSphere();}
  this.tip.position.set(0,tipY,0);return this.shaftAngle;
 }
}
