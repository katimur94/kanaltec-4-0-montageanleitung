import * as THREE from 'three';

const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const clamp=x=>THREE.MathUtils.clamp(x,0,1);
const smooth=x=>(x=clamp(x))*x*(3-2*x);
const TAU=Math.PI*2, N=160, RADIAL=12;
const cutPlane=new THREE.Plane(V(0,0,-1),0);

// An illustrative breakout, not a measured defect from the assembly drawing.
// One contour defines both the missing pipe wall and the repair boundary.
export function breakoutContour(a){
 const wave=t=>1+.086*Math.sin(7*t+.3)+.05*Math.sin(13*t+1.2)+.04*Math.cos(23*t);
 const k=a/TAU*40,j=Math.floor(k),jag=THREE.MathUtils.lerp(wave(j/40*TAU),wave((j+1)/40*TAU),k-j);
 return [148*Math.cos(a)*jag,100*Math.sin(a)*jag];
}
function surfacePoint(R,x,arc,depth=0){return V(x,(R+depth)*Math.cos(arc/R),(R+depth)*Math.sin(arc/R));}
function geometry(positions,indices,uv){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);
 if(uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
function concreteTexture(){
 const size=128,data=new Uint8Array(size*size*4);let seed=9137;
 for(let i=0;i<size*size;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/4294967296;const x=i%size,y=Math.floor(i/size);const c=180+noise*40+15*Math.sin(x*.075)*Math.cos(y*.09);data.set([c,c,c,255],i*4);}
 const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.needsUpdate=true;return t;
}
export function damagedPipeGeometry(R,length,thickness){
 const nr=40,positions=[],uv=[],indices=[],stride=N+1,layerSize=(nr+1)*stride;
 for(let layer=0;layer<2;layer++)for(let j=0;j<=nr;j++)for(let i=0;i<=N;i++){
  const a=i/N*TAU,[hx,ha]=breakoutContour(a),dx=Math.cos(a),da=Math.sin(a);
  const edge=Math.min(length/2/Math.max(1e-9,Math.abs(dx)),Math.PI*R/Math.max(1e-9,Math.abs(da)));
  const s=j/nr,x=THREE.MathUtils.lerp(hx,dx*edge,s),arc=THREE.MathUtils.lerp(ha,da*edge,s);
  positions.push(...surfacePoint(R,x,arc,layer*thickness).toArray());uv.push(x/120,arc/120);
 }
 for(let l=0;l<2;l++)for(let j=0;j<nr;j++)for(let i=0;i<N;i++){
  const a=l*layerSize+j*stride+i,b=a+stride;
  if(l)indices.push(a,a+1,b,b,a+1,b+1);else indices.push(a,b,a+1,b,b+1,a+1);
 }
 for(const j of [0,nr])for(let i=0;i<N;i++){
  const angle=(i+.5)/N*TAU;
  // The unwrap seam is continuous pipe, not two overlapping end walls.
  if(j===nr&&length/2/Math.max(1e-9,Math.abs(Math.cos(angle)))>Math.PI*R/Math.max(1e-9,Math.abs(Math.sin(angle))))continue;
  const a=j*stride+i,b=a+layerSize;indices.push(a,a+1,b,b,a+1,b+1);
 }
 return geometry(positions,indices,uv);
}
function brokenBranch(R,top){
 const pos=[],uv=[],idx=[],rows=16,stride=N+1;
 for(let side=0;side<2;side++)for(let j=0;j<=rows;j++)for(let i=0;i<=N;i++){
  const a=i/N*TAU,k=a/TAU*40,bin=Math.floor(k),edge=t=>R+65+14*Math.sin(t*5+.6)+10*Math.cos(t*11),bottom=THREE.MathUtils.lerp(edge(bin/40*TAU),edge((bin+1)/40*TAU),k-bin),r=69+side*11;
  pos.push(r*Math.cos(a),THREE.MathUtils.lerp(bottom,top,j/rows),r*Math.sin(a));uv.push(a*2,(pos.at(-2)-R)/120);
 }
 const count=(rows+1)*stride;
 for(let s=0;s<2;s++)for(let j=0;j<rows;j++)for(let i=0;i<N;i++){const a=s*count+j*stride+i,b=a+stride;idx.push(a,b,a+1,b,b+1,a+1);}
 for(const j of [0,rows])for(let i=0;i<N;i++){const a=j*stride+i,b=a+count;idx.push(a,b,a+1,b,b+1,a+1);}
 return geometry(pos,idx,uv);
}
function makeMesh(g,m){const o=new THREE.Mesh(g,m);o.castShadow=o.receiveShadow=true;return o;}
function tube(curve,r,m,segments=96){return makeMesh(new THREE.TubeGeometry(curve,segments,r,10,false),m);}

export class RepairScene {
 constructor(R,branchTop,hosePoints,inletX){
  this.R=R;this.group=new THREE.Group();this.hoseGroup=new THREE.Group();this.inletX=inletX;
  this.texture=concreteTexture();
  this.concrete=new THREE.MeshStandardMaterial({color:'#858980',map:this.texture,bumpMap:this.texture,bumpScale:.42,roughness:.96,side:THREE.DoubleSide});
  this.cutConcrete=this.concrete.clone();this.cutConcrete.clippingPlanes=[cutPlane];
  const pg=damagedPipeGeometry(R,1350,18),bg=brokenBranch(R,branchTop);
  this.pipe=makeMesh(pg,this.cutConcrete);this.pipeFull=makeMesh(pg,this.concrete);
  this.branch=makeMesh(bg,this.cutConcrete);this.branchFull=makeMesh(bg,this.concrete);
  this.group.add(this.pipe,this.pipeFull,this.branch,this.branchFull);
  const capPositions=[],capIndices=[],capUV=[];
  const rect=(x0,x1,y0,y1)=>{const n=capPositions.length/3;capPositions.push(x0,y0,0,x1,y0,0,x1,y1,0,x0,y1,0);capUV.push(x0/120,y0/120,x1/120,y0/120,x1/120,y1/120,x0/120,y1/120);capIndices.push(n,n+1,n+2,n,n+2,n+3);};
  rect(-675,675,-R-18,-R);rect(-675,breakoutContour(Math.PI)[0],R,R+18);rect(breakoutContour(0)[0],675,R,R+18);
  for(const a of [0,Math.PI]){const sign=Math.cos(a),bottom=R+65+14*Math.sin(a*5+.6)+10*Math.cos(a*11);rect(Math.min(sign*69,sign*80),Math.max(sign*69,sign*80),bottom,branchTop);}
  const capMaterial=this.concrete.clone();capMaterial.bumpScale=.12;
  this.pipeCaps=makeMesh(geometry(capPositions,capIndices,capUV),capMaterial);this.pipeCaps.castShadow=this.pipeCaps.receiveShadow=false;this.group.add(this.pipeCaps);

  // A rough soil/socket cavity between the broken main and branch pipe.
  const wall=[],wi=[],wu=[];
  for(let row=0;row<=8;row++)for(let i=0;i<=N;i++){
   const a=i/N*TAU,h=row/8,p=this.point(a,1,h);
   wall.push(p.x+Math.cos(a)*1.3,p.y+.6,p.z+Math.sin(a)*1.3);
   wu.push(i/N*4,h*2);
  }
  for(let j=0;j<8;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+N+1;wi.push(a,b,a+1,b,b+1,a+1);}
  this.cavityMaterial=new THREE.MeshStandardMaterial({color:'#594b3b',map:this.texture,bumpMap:this.texture,bumpScale:2,roughness:1,side:THREE.DoubleSide});
  this.cavity=makeMesh(geometry(wall,wi,wu),this.cavityMaterial);this.group.add(this.cavity);
  // Fracture lines continue from the breakout into surrounding pipe concrete.
  this.cracks=new THREE.Group();const crackMat=new THREE.MeshBasicMaterial({color:'#343634',side:THREE.DoubleSide});
  for(const a of [.24,1.42,2.8,3.7,4.9,5.62]){
   const [x,s]=breakoutContour(a),pts=[];
   for(let j=0;j<9;j++){const k=j/8;pts.push(surfacePoint(R,x+Math.cos(a)*k*54+Math.sin(j*2.4)*2,s+Math.sin(a)*k*34,18.25));}
   this.cracks.add(tube(new THREE.CatmullRomCurve3(pts),.7,crackMat,30));
  }this.group.add(this.cracks);

  this.mortarMaterial=new THREE.MeshStandardMaterial({color:'#68695f',roughness:.48,side:THREE.DoubleSide});
  this.mortarGeometry=new THREE.BufferGeometry();
  this.mortarGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(2*(RADIAL+1)*(N+1)*3),3));
  this.mortarGeometry.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(2*(RADIAL+1)*(N+1)*2),2));
  this.mortar=makeMesh(this.mortarGeometry,this.mortarMaterial);this.mortar.frustumCulled=false;this.group.add(this.mortar);
  this.sectionGeometry=new THREE.BufferGeometry();this.sectionGeometry.setAttribute('position',this.mortarGeometry.attributes.position);this.sectionGeometry.setAttribute('uv',this.mortarGeometry.attributes.uv);
  // The exposed section face must not clip against its own coplanar plane.
  this.sectionMaterial=this.mortarMaterial.clone();
  this.section=makeMesh(this.sectionGeometry,this.sectionMaterial);this.section.castShadow=this.section.receiveShadow=false;this.section.frustumCulled=false;this.group.add(this.section);
  this.lastFill=-1;

  // Material travels inside the original hose. Draw range advances a continuous
  // front; suspended aggregate moves behind it, never ahead of it or outside it.
  this.feedCurve=new THREE.CatmullRomCurve3(hosePoints.map(p=>V(...p)));
  this.feedMaterial=new THREE.MeshStandardMaterial({color:'#8b8a79',roughness:.52});
  this.feedCore=tube(this.feedCurve,3.25,this.feedMaterial,240);this.feedCore.frustumCulled=false;this.hoseGroup.add(this.feedCore);
  this.flow=[];const grainMat=new THREE.MeshStandardMaterial({color:'#b0aa98',roughness:.7});
  for(let i=0;i<38;i++){const o=makeMesh(new THREE.SphereGeometry(.75,7,5),grainMat);this.hoseGroup.add(o);this.flow.push(o);}
  this.outletCurve=new THREE.CatmullRomCurve3([V(inletX,R-20,0),V(inletX,R-6,0),V(inletX,R+2,0),V(inletX-8,R+7,0)]);
  this.outlet=tube(this.outletCurve,3.4,this.feedMaterial,36);this.group.add(this.outlet);

  this.water=new THREE.Group();this.group.add(this.water);this.streams=[];this.drops=[];
  this.waterMaterial=new THREE.MeshPhysicalMaterial({color:'#73c5dc',transparent:true,opacity:.7,roughness:.12,metalness:.05,clearcoat:1,side:THREE.DoubleSide,depthWrite:false});
  const dropletGeo=new THREE.SphereGeometry(1,8,6);
  // Several paths visibly enter at the fractured edge and fall into the sewer.
  for(let i=0;i<7;i++){
   const a=(.10+i*.123)*TAU,[x,arc]=breakoutContour(a),edge=surfacePoint(R,x,arc,2);
   const start=this.point(a,1,.49+(i%3)*.08);
   const end=V(edge.x*.87,edge.y-45,edge.z*.83);
   const curve=new THREE.CatmullRomCurve3([start,V(edge.x,R+13,edge.z),edge,end]);
   const stream=tube(curve,1.5+(i%3)*.65,this.waterMaterial,40);this.water.add(stream);this.streams.push({mesh:stream,curve,angle:a});
   for(let j=0;j<9;j++){const d=makeMesh(dropletGeo,this.waterMaterial);this.water.add(d);this.drops.push({mesh:d,stream:i,phase:j/9});}
  }
  this.splash=new THREE.Group();this.water.add(this.splash);
  for(let i=0;i<7;i++){const o=makeMesh(new THREE.TorusGeometry(9, .65,5,36),this.waterMaterial);o.rotation.x=-Math.PI/2;this.splash.add(o);}
  this.setCut(true);this.update({time:0,fill:0,hoseFront:0,injecting:false,sealed:0,cured:false});
 }
 setCut(cut){
  this.cut=cut;this.section.visible=cut&&this.fill>.0001;
  this.pipeCaps.visible=cut;
  this.pipe.visible=this.branch.visible=cut;this.pipeFull.visible=this.branchFull.visible=!cut;
  for(const m of [this.cavityMaterial,this.mortarMaterial,this.waterMaterial])m.clippingPlanes=cut?[cutPlane]:null;
  this.cracks.traverse(o=>{if(o.isMesh)o.material.clippingPlanes=cut?[cutPlane]:null;});
 }
 point(a,q,h){
  const [x,arc]=breakoutContour(a),edge=surfacePoint(this.R,x,arc),r=THREE.MathUtils.lerp(35.8,48.2,smooth((h*105-6)/22));
  const bulge=6*Math.sin(h*Math.PI)*(1+.3*Math.sin(a*17));
  const ox=THREE.MathUtils.lerp(edge.x,80*Math.cos(a),h)+Math.cos(a)*bulge,oz=THREE.MathUtils.lerp(edge.z,80*Math.sin(a),h)+Math.sin(a)*bulge;
  const px=THREE.MathUtils.lerp(r*Math.cos(a),ox,q),pz=THREE.MathUtils.lerp(r*Math.sin(a),oz,q);
  const by=Math.sqrt(Math.max(0,(this.R-.75)**2-pz*pz));
  return V(px,THREE.MathUtils.lerp(by,this.R+96,h),pz);
 }
 arrival(a,q){const p=this.point(a,q,0);return Math.min(.24,Math.hypot(p.x-this.inletX,p.z)/240*.24);}
 fillGeometry(fill){
  if(fill===this.lastFill)return;this.lastFill=fill;
  const attr=this.mortarGeometry.attributes.position,uv=this.mortarGeometry.attributes.uv,stride=N+1,layer=(RADIAL+1)*stride,heights=[];
  for(let j=0;j<=RADIAL;j++)for(let i=0;i<=N;i++){
   const a=i/N*TAU,q=j/RADIAL,delay=this.arrival(a,q),h=clamp((fill-delay)/(1-delay)),p=this.point(a,q,h),b=this.point(a,q,0),k=j*stride+i;
   // A shallow uneven meniscus travels out from the actual inlet.
   if(h>0&&h<1)p.y+=.9*Math.sin(a*13+q*11)*Math.sin(h*Math.PI);
   attr.setXYZ(k,...b.toArray());attr.setXYZ(k+layer,...p.toArray());uv.setXY(k,b.x/35,b.z/35);uv.setXY(k+layer,p.x/35,p.z/35);heights[k]=h;
  }
  const idx=[];
  for(let j=0;j<RADIAL;j++)for(let i=0;i<N;i++){
   const a=j*stride+i,b=a+stride;if(Math.max(heights[a],heights[a+1],heights[b],heights[b+1])<=.00001)continue;
   idx.push(a,b,a+1,b,b+1,a+1,a+layer,a+1+layer,b+layer,b+layer,a+1+layer,b+1+layer);
  }
  for(const j of [0,RADIAL])for(let i=0;i<N;i++){const a=j*stride+i;if(Math.max(heights[a],heights[a+1])>0)idx.push(a,a+1,a+layer,a+layer,a+1,a+1+layer);}
  this.mortarGeometry.setIndex(idx);attr.needsUpdate=uv.needsUpdate=true;this.mortarGeometry.computeVertexNormals();this.mortarGeometry.computeBoundingSphere();
  const caps=[];for(const i of [0,N/2])for(let j=0;j<RADIAL;j++){const a=j*stride+i,b=a+stride;if(Math.max(heights[a],heights[b])>0)caps.push(a,b,a+layer,b,b+layer,a+layer);}
  this.sectionGeometry.setIndex(caps);this.sectionGeometry.computeVertexNormals();
 }
 update({time,fill,hoseFront,injecting,sealed,cured}){
  this.fill=fill;this.hoseFront=hoseFront;this.fillGeometry(fill);this.mortar.visible=fill>.0001;
  this.section.visible=this.cut&&this.mortar.visible;
  this.mortarMaterial.color.set(cured?'#91968b':'#68695f');this.mortarMaterial.roughness=cured?.91:.48;
  this.sectionMaterial.color.copy(this.mortarMaterial.color);this.sectionMaterial.roughness=this.mortarMaterial.roughness;
  this.feedCore.geometry.setDrawRange(0,Math.floor(hoseFront*240)*10*6);this.feedCore.visible=hoseFront>0;
  this.outlet.visible=injecting&&hoseFront>=1;
  for(let i=0;i<this.flow.length;i++){
   const u=((time*2.8+i/this.flow.length)%1+1)%1,o=this.flow[i];o.visible=injecting&&u<hoseFront-.012;
   const tangent=this.feedCurve.getTangentAt(u),radial=V(0,0,1).cross(tangent).normalize().applyAxisAngle(tangent,i*2.4);
   o.position.copy(this.feedCurve.getPointAt(u)).addScaledVector(radial,2.7);
  }
  this.waterActivity=1-smooth(fill/.86);this.water.visible=this.waterActivity>.001;
  this.waterMaterial.opacity=.68*this.waterActivity;
  for(let i=0;i<this.streams.length;i++){
   const s=this.streams[i],a=this.waterActivity; s.mesh.visible=a> .035+i*.025;
   // Once the shield seals, water is contained behind it; no falling water
   // passes through the shield into the channel below the closed mould.
   s.mesh.material.clippingPlanes=[...(this.pipe.visible?[cutPlane]:[]),...(sealed>.96?[new THREE.Plane(V(0,1,0),-this.R+22)]:[])];
  }
  for(const d of this.drops){
   const s=this.streams[d.stream],u=((time*2.4+d.phase)%1+1)%1,p=s.curve.getPoint(1);
   d.mesh.visible=sealed<.96&&this.waterActivity>.08&&(!this.pipe.visible||p.z<0);
   d.mesh.position.set(p.x+2*Math.sin(u*12+d.stream),p.y-u*u*(this.R*1.65+50),p.z);d.mesh.scale.set(1.8,3.3+u*2,1.8);
  }
  this.splash.children.forEach((o,i)=>{const u=((time*2+i*.143)%1+1)%1,p=this.streams[i].curve.getPoint(1);o.visible=sealed<.96&&this.waterActivity>.08&&(!this.pipe.visible||p.z<0);o.position.set(p.x,-Math.sqrt(Math.max(1,this.R*this.R-p.z*p.z))+2,p.z);o.scale.setScalar(.5+u*2);});
 }
 dispose(){this.texture.dispose();const materials=new Set();for(const root of [this.group,this.hoseGroup])root.traverse(o=>{if(o.isMesh)materials.add(o.material);});for(const m of materials)m.dispose();}
}
