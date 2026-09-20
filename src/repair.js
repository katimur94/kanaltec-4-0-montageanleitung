import * as THREE from 'three';
import {passage} from './bladder.js';
import {surfaceTextures,mouldSurface} from './repair-surface.js';
import {millingSpec,repairFootprint} from './milling.js';
import {GroundGrout,soilCavityRadius} from './ground-grout.js';

const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const clamp=x=>THREE.MathUtils.clamp(x,0,1);
const smooth=x=>(x=clamp(x))*x*(3-2*x);
const TAU=Math.PI*2, N=160, RADIAL=12;
const cutPlane=new THREE.Plane(V(0,0,-1),0);

// An illustrative breakout, not a measured defect from the assembly drawing.
// One contour defines both the missing pipe wall and the repair boundary.
export function breakoutContour(a){
 const wave=t=>1+.13*Math.cos(t-.4)+.10*Math.sin(3*t+.8)+.045*Math.sin(9*t+1.2)+.027*Math.cos(17*t);
 const k=a/TAU*40,j=Math.floor(k),jag=THREE.MathUtils.lerp(wave(j/40*TAU),wave((j+1)/40*TAU),k-j);
 return [96*Math.cos(a)*jag,48*Math.sin(a)*jag];
}
function surfacePoint(R,x,arc,depth=0){return V(x,(R+depth)*Math.cos(arc/R),(R+depth)*Math.sin(arc/R));}
export function branchBottom(R,a){const k=a/TAU*40,bin=Math.floor(k),edge=t=>R+millingSpec.branchEdge+3*Math.sin(t*5+.6)+2*Math.cos(t*11);return THREE.MathUtils.lerp(edge(bin/40*TAU),edge((bin+1)/40*TAU),k-bin);}
function geometry(positions,indices,uv){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);
 if(uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
function concreteTexture(){
 const size=128,data=new Uint8Array(size*size*4);let seed=9137;
 for(let i=0;i<size*size;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/4294967296;const x=i%size,y=Math.floor(i/size);const c=180+noise*40+15*Math.sin(x*.075)*Math.cos(y*.09);data.set([c,c,c,255],i*4);}
 const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.needsUpdate=true;return t;
}
export function damagedPipeGeometry(R,length,thickness,progress=0,fill=0){
 const nr=43,positions=[],uv=[],indices=[],colors=[],stride=N+1,layerSize=(nr+1)*stride;
 for(let layer=0;layer<2;layer++)for(let j=0;j<=nr;j++)for(let i=0;i<=N;i++){
  const a=i/N*TAU,[hx,ha]=breakoutContour(a),dx=Math.cos(a),da=Math.sin(a);
  const edge=Math.min(length/2/Math.max(1e-9,Math.abs(dx)),Math.PI*R/Math.max(1e-9,Math.abs(da)));
  const w=millingSpec.width,cut=i/N<=progress&&progress>0;
  const [outerX,outerArc]=repairFootprint(R,a),t=Math.max(0,(j-3)/(nr-3));
  const x=j<2?hx:THREE.MathUtils.lerp(outerX,dx*edge,t),arc=j<2?ha:THREE.MathUtils.lerp(outerArc,da*edge,t);
  const floor=!layer&&j<=2,depth=layer?thickness:floor&&cut?(fill>.99?.08:millingSpec.depth*(1-fill)):0;
  positions.push(...surfacePoint(R,x,arc,depth).toArray());uv.push(x/120,arc/120);
  const c=new THREE.Color(floor&&cut?(fill>.99?'#666764':'#b18d70'):'#422b21');colors.push(c.r,c.g,c.b);
 }
 for(let l=0;l<2;l++)for(let j=0;j<nr;j++)for(let i=0;i<N;i++){
  // The finished casting supplies this face. Keeping the coarse pipe triangles
  // underneath it causes their curved chords to show through the fine skin.
  if(!l&&j<3&&fill>.99&&progress>0&&i/N<=progress)continue;
  const a=l*layerSize+j*stride+i,b=a+stride;
  if(l)indices.push(a,a+1,b,b,a+1,b+1);else indices.push(a,b,a+1,b,b+1,a+1);
 }
 for(const j of [0,nr])for(let i=0;i<N;i++){
  const angle=(i+.5)/N*TAU;
  // The unwrap seam is continuous pipe, not two overlapping end walls.
  if(j===nr&&length/2/Math.max(1e-9,Math.abs(Math.cos(angle)))>Math.PI*R/Math.max(1e-9,Math.abs(Math.sin(angle))))continue;
  const a=j*stride+i,b=a+layerSize;indices.push(a,a+1,b,b,a+1,b+1);
 }
 const result=geometry(positions,indices,uv);result.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));return result;
}
// The branch bore stays intact: there is no internal milling or mortar sleeve.
export function brokenBranch(R,top){
 const pos=[],uv=[],idx=[],colors=[],stride=N+1;
 for(let side=0;side<2;side++)for(let j=0;j<2;j++)for(let i=0;i<=N;i++){
  const a=i/N*TAU,y=j?top:branchBottom(R,a),r=passage.radius+side*passage.wall;
  pos.push(r*Math.cos(a),y,r*Math.sin(a));uv.push(a*2,(y-R)/120);
  const c=new THREE.Color('#422b21');colors.push(c.r,c.g,c.b);
 }
 for(let side=0;side<2;side++)for(let i=0;i<N;i++){const a=side*2*stride+i,b=a+stride;idx.push(a,b,a+1,b,b+1,a+1);}
 for(const j of [0,1])for(let i=0;i<N;i++){const a=j*stride+i,b=a+2*stride;idx.push(a,b,a+1,b,b+1,a+1);}
 const result=geometry(pos,idx,uv);result.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));return result;
}
// Smooth mortar lining in the existing gap around the inflated bladder.
// No groove or wall removal. The lower rim overlaps the filled defect by 1 mm.
export function branchMortarGeometry(R,top,fill){
 const pos=[],uv=[],idx=[],caps=[],stride=N+1,rows=24;
 for(let side=0;side<2;side++)for(let j=0;j<=rows;j++)for(let i=0;i<=N;i++){
  const a=i/N*TAU,base=branchBottom(R,a)-1;
  const y=THREE.MathUtils.lerp(base,top,clamp(fill)*j/rows);
  const r=side?passage.radius:passage.mouldRadius;
  pos.push(r*Math.cos(a),y,r*Math.sin(a));uv.push(a*2,(y-R)/60);
 }
 const count=(rows+1)*stride;
 for(let side=0;side<2;side++)for(let j=0;j<rows;j++)for(let i=0;i<N;i++){
  const a=side*count+j*stride+i,b=a+stride;idx.push(a,b,a+1,b,b+1,a+1);
 }
 for(const j of [0,rows])for(let i=0;i<N;i++){const a=j*stride+i,b=a+count;idx.push(a,b,a+1,b,b+1,a+1);}
 for(const i of [0,N/2])for(let j=0;j<rows;j++){const a=j*stride+i,b=a+stride;caps.push(a,b,a+count,b,b+count,a+count);}
 const result=geometry(pos,idx,uv);result.userData.sectionIndices=caps;return result;
}
export function projectingBranchGeometry(R,trim){
 const pos=[],uv=[],idx=[],stride=N+1;
 for(let side=0;side<2;side++)for(let j=0;j<2;j++)for(let i=0;i<=N;i++){
  const a=i/N*TAU,top=branchBottom(R,a),r=passage.radius+side*passage.wall;
  const original=R-36+7*Math.sin(a*3)+3*Math.cos(a*7),cutHeight=R-36+trim*60;
  const bottom=trim>=1?top:Math.min(top,Math.max(original,cutHeight));
  pos.push(r*Math.cos(a),j?top:bottom,r*Math.sin(a));uv.push(a*2,(pos.at(-2)-R)/70);
 }
 for(let side=0;side<2;side++)for(let i=0;i<N;i++){const a=side*2*stride+i,b=a+stride;idx.push(a,b,a+1,b,b+1,a+1);}
 for(const j of [0,1])for(let i=0;i<N;i++){const a=j*stride+i,b=a+2*stride;idx.push(a,b,a+1,b,b+1,a+1);}
 return geometry(pos,idx,uv);
}
function makeMesh(g,m){const o=new THREE.Mesh(g,m);o.castShadow=o.receiveShadow=true;return o;}
function tube(curve,r,m,segments=96){return makeMesh(new THREE.TubeGeometry(curve,segments,r,10,false),m);}
function waterCurve(points){const c=new THREE.CurvePath();for(let i=1;i<points.length;i++)if(points[i].distanceToSquared(points[i-1])>1e-8)c.add(new THREE.LineCurve3(points[i-1],points[i]));return c;}
function rivuletGeometry(curve,segments,radius){
 const g=new THREE.TubeGeometry(curve,segments,radius,8,false),p=g.attributes.position;
 for(let j=0;j<=segments;j++){
  const u=j/segments,c=curve.getPointAt(u),width=(.55+.22*Math.sin(u*37)+.16*Math.sin(u*83))*(1-.32*u);
  for(let k=0;k<=8;k++){const i=j*9+k;p.setXYZ(i,c.x+(p.getX(i)-c.x)*width,c.y+(p.getY(i)-c.y)*width,c.z+(p.getZ(i)-c.z)*width);}
 }
 g.computeVertexNormals();return g;
}

// The shield is 500 mm long, has rounded developed corners (38 mm), and is
// curved through +/-1.13 rad. Use its physical outline even in a cutaway view.
export function shieldWaterPath(R,start,edge,shield){
 const r=R-12,outer=R-10+3*(shield?.seal||0),dx=Math.abs(edge.x-(shield?.x||0)),corner=38;
 const arc=r*1.13-(dx>250-corner?corner-Math.sqrt(Math.max(0,corner**2-(dx-250+corner)**2)):0);
 const angle=arc/r,covered=!!shield&&dx<=250&&Math.abs(edge.z)<outer*Math.sin(angle);
 if(!covered){const end=edge.clone().add(V(0,-32,0));return{caught:false,incoming:waterCurve([start,V(edge.x,edge.y+10,edge.z),edge,end]),runoff:null,lip:end};}
 const side=edge.z<0?-1:1,wet=outer+2.3,impactAngle=Math.asin(edge.z/wet),impact=V(edge.x,shield.lift+wet*Math.cos(impactAngle),edge.z);
 const incoming=new THREE.CubicBezierCurve3(start,V((start.x+edge.x)/2,start.y,edge.z),V(edge.x,Math.max(edge.y+10,impact.y+18),edge.z),impact),points=[impact];
 for(let i=1;i<=48;i++){const a=THREE.MathUtils.lerp(impactAngle,side*angle,i/48);points.push(V(edge.x,shield.lift+wet*Math.cos(a),wet*Math.sin(a)));}
 const lip=points.at(-1).clone().add(V(0,-3,side*3));points.push(lip);
 return{caught:true,incoming,runoff:waterCurve(points),lip,impact,side,edgeAngle:angle};
}

export class RepairScene {
 constructor(R,branchTop,hosePoints,inletX,pipeLength=1350,branchFillTop=R){
  this.branchFillTop=branchFillTop;this.branchFill=0;this.R=R;this.pipeLength=pipeLength;this.branchTop=branchTop;this.group=new THREE.Group();this.hoseGroup=new THREE.Group();this.inletX=inletX;
  this.texture=concreteTexture();
  this.pipeTextures=surfaceTextures('pipe');this.mortarTextures=surfaceTextures('mortar');
  this.ground=new GroundGrout(R,this.pipeTextures,this.mortarTextures);this.group.add(this.ground.group);
  this.concrete=new THREE.MeshStandardMaterial({color:'#422b21',...this.pipeTextures,bumpScale:.12,roughness:1,metalness:0,envMapIntensity:.18,side:THREE.DoubleSide});
  this.concrete.vertexColors=true;this.concrete.color.set('#ffffff');this.cutConcrete=this.concrete.clone();this.cutConcrete.clippingPlanes=[cutPlane];
  const pg=damagedPipeGeometry(R,pipeLength,18),bg=brokenBranch(R,branchTop);
  this.pipe=makeMesh(pg,this.cutConcrete);this.pipeFull=makeMesh(pg,this.concrete);
  this.branch=makeMesh(bg,this.cutConcrete);this.branchFull=makeMesh(bg,this.concrete);
  this.group.add(this.pipe,this.pipeFull,this.branch,this.branchFull);
  this.projectionMaterial=this.concrete.clone();this.projectionMaterial.vertexColors=false;this.projectionMaterial.color.set('#5d3725');
  this.projection=makeMesh(projectingBranchGeometry(R,0),this.projectionMaterial);this.group.add(this.projection);
  this.roots=new THREE.Group();this.group.add(this.roots);this.rootStrands=[];
  this.rootMaterial=new THREE.MeshStandardMaterial({color:'#796044',roughness:1});
  for(let k=0;k<9;k++){
   const a=.35+k*.67,rootRadius=58+(k%3)*12;
   const start=V(rootRadius*Math.cos(a),R+25,rootRadius*Math.sin(a));
   const end=V((27+k%3*8)*Math.cos(a+.5),R-62-k%4*12,(32+k%2*11)*Math.sin(a+.5));
   const curve=new THREE.CatmullRomCurve3([start,V(start.x*.83,R+6,start.z*.85),V(end.x+9*Math.sin(k),R-23,end.z+8),end]);
   const main=tube(curve,1.5+k%3*.45,this.rootMaterial,48);this.roots.add(main);this.rootStrands.push(main);
   for(let j=0;j<3;j++){
    const u=.36+j*.2,p=curve.getPoint(u),twig=new THREE.CatmullRomCurve3([p,p.clone().add(V(8*Math.cos(a+j),-9,8*Math.sin(a+j))),p.clone().add(V(13*Math.cos(a+j),-22,15*Math.sin(a+j)))]);
    const o=tube(twig,.5+j*.17,this.rootMaterial,20);o.userData.rootStart=u;this.roots.add(o);this.rootStrands.push(o);
   }
  }
  const capPositions=[],capIndices=[],capUV=[];
  const rect=(x0,x1,y0,y1)=>{const n=capPositions.length/3;capPositions.push(x0,y0,0,x1,y0,0,x1,y1,0,x0,y1,0);capUV.push(x0/120,y0/120,x1/120,y0/120,x1/120,y1/120,x0/120,y1/120);capIndices.push(n,n+1,n+2,n,n+2,n+3);};
  rect(-pipeLength/2,pipeLength/2,-R-18,-R);rect(-pipeLength/2,breakoutContour(Math.PI)[0],R,R+18);rect(breakoutContour(0)[0],pipeLength/2,R,R+18);
  for(const a of [0,Math.PI]){const sign=Math.cos(a),bottom=R+65+14*Math.sin(a*5+.6)+10*Math.cos(a*11);rect(Math.min(sign*passage.radius,sign*(passage.radius+passage.wall)),Math.max(sign*passage.radius,sign*(passage.radius+passage.wall)),bottom,branchTop);}
  const capMaterial=this.concrete.clone();capMaterial.color.set('#6b4632');capMaterial.roughness=1;capMaterial.bumpScale=.3;
  this.pipeCaps=makeMesh(geometry(capPositions,capIndices,capUV),capMaterial);this.pipeCaps.castShadow=this.pipeCaps.receiveShadow=false;this.group.add(this.pipeCaps);

  // A rough soil/socket cavity between the broken main and branch pipe.
  const wall=[],wi=[],wu=[],wc=[],cavityRows=24;
  for(let row=0;row<=cavityRows;row++)for(let i=0;i<=N;i++){
   const a=i/N*TAU,h=row/cavityRows,p=this.point(a,1,h);
   wall.push(p.x+Math.cos(a)*1.3,p.y+.6,p.z+Math.sin(a)*1.3);
   wu.push(i/N*4,h*2);
   const wet=.64+.16*Math.sin(a*3+h*5)+.08*Math.sin(a*13-h*11);
   wc.push(wet,wet*.89,wet*.73);
  }
  for(let j=0;j<cavityRows;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+N+1;wi.push(a,b,a+1,b,b+1,a+1);}
  this.cavityMaterial=new THREE.MeshStandardMaterial({color:'#665849',map:this.texture,bumpMap:this.texture,bumpScale:2.8,roughness:.79,vertexColors:true,side:THREE.DoubleSide});
  const cavityGeo=geometry(wall,wi,wu);cavityGeo.setAttribute('color',new THREE.Float32BufferAttribute(wc,3));
  this.cavity=makeMesh(cavityGeo,this.cavityMaterial);this.group.add(this.cavity);
  // Fracture lines continue from the breakout into surrounding pipe concrete.
  this.cracks=new THREE.Group();const crackMat=new THREE.MeshBasicMaterial({color:'#343634',side:THREE.DoubleSide});
  for(const a of [.24,1.42,2.8,3.7,4.9,5.62]){
   const [x,s]=breakoutContour(a),pts=[];
   for(let j=0;j<9;j++){const k=j/8;pts.push(surfacePoint(R,x+Math.cos(a)*k*54+Math.sin(j*2.4)*2,s+Math.sin(a)*k*34,18.25));}
   this.cracks.add(tube(new THREE.CatmullRomCurve3(pts),.7,crackMat,30));
  }this.group.add(this.cracks);

  this.mortarMaterial=new THREE.MeshStandardMaterial({color:'#444743',roughness:.75,side:THREE.DoubleSide});
  this.skinMaterial=new THREE.MeshStandardMaterial({color:'#555652',...this.mortarTextures,bumpScale:.16,roughness:.95,envMapIntensity:.35,vertexColors:true,side:THREE.DoubleSide});
  this.innerSkin=mouldSurface(R,a=>repairFootprint(R,a),this.skinMaterial);this.group.add(this.innerSkin);
  this.mortarGeometry=new THREE.BufferGeometry();
  this.mortarGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(2*(RADIAL+1)*(N+1)*3),3));
  this.mortarGeometry.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(2*(RADIAL+1)*(N+1)*2),2));
  this.mortar=makeMesh(this.mortarGeometry,this.mortarMaterial);this.mortar.frustumCulled=false;this.group.add(this.mortar);
  this.sectionGeometry=new THREE.BufferGeometry();this.sectionGeometry.setAttribute('position',this.mortarGeometry.attributes.position);this.sectionGeometry.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(this.mortarGeometry.attributes.uv.array.length),2));
  // The exposed section face must not clip against its own coplanar plane.
  this.sectionMaterial=new THREE.MeshStandardMaterial({color:'#65695f',...this.mortarTextures,bumpScale:.08,roughness:.95,side:THREE.DoubleSide});
  this.section=makeMesh(this.sectionGeometry,this.sectionMaterial);this.section.castShadow=this.section.receiveShadow=false;this.section.frustumCulled=false;this.group.add(this.section);
  this.branchMortarMaterial=new THREE.MeshStandardMaterial({color:'#666764',...this.mortarTextures,bumpScale:.08,roughness:.9,side:THREE.DoubleSide});
  this.branchMortar=makeMesh(branchMortarGeometry(R,branchFillTop,0),this.branchMortarMaterial);
  this.branchMortarSection=makeMesh(this.branchMortar.geometry.clone(),this.sectionMaterial);
  this.group.add(this.branchMortar,this.branchMortarSection);this.lastBranchFill=-1;
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

  this.water=new THREE.Group();this.group.add(this.water);this.streams=[];this.drops=[];this.waterTraces=[];
  this.waterMaterial=new THREE.MeshPhysicalMaterial({color:'#c4d0cc',transparent:true,opacity:.3,roughness:.1,metalness:0,clearcoat:1,side:THREE.DoubleSide,depthWrite:false});
  this.runoffMaterial=this.waterMaterial.clone();
  this.dampMaterial=new THREE.MeshStandardMaterial({color:'#211b13',transparent:true,opacity:.28,roughness:.34,depthWrite:false,side:THREE.DoubleSide});
  this.damp=new THREE.Group();this.group.add(this.damp);
  const dropletGeo=new THREE.SphereGeometry(1,8,6);
  // Several paths visibly enter at the fractured edge and fall into the sewer.
  for(let i=0;i<7;i++){
   const a=[.055,.102,.21,.44,.58,.627,.83][i]*TAU,[x,arc]=breakoutContour(a),edge=surfacePoint(R,x,arc,2);
   const start=this.point(a,1,.49+(i%3)*.08);
   const stain=[],stainUV=[],stainIndex=[],side=arc<0?-1:1;
   for(let j=0;j<=24;j++){
    const u=j/24,s=arc+side*(24+32*(i%3))*u,cx=x+3*Math.sin(u*8+i),width=(2+3*Math.sin(Math.PI*u))*(1-u*.85);
    for(const sign of [-1,1]){stain.push(...surfacePoint(R,cx+sign*width,s,-.12).toArray());stainUV.push(sign,u);}
    if(j<24){const k=j*2;stainIndex.push(k,k+1,k+2,k+1,k+3,k+2);}
   }
   this.damp.add(makeMesh(geometry(stain,stainIndex,stainUV),this.dampMaterial));
   const path=shieldWaterPath(R,start,edge,null),radius=[.42,.85,.3,.58,.98,.36,.52][i];
   const stream=tube(path.incoming,radius,this.waterMaterial,64),runoff=tube(path.incoming,radius,this.runoffMaterial,96);
   this.water.add(stream,runoff);this.streams.push({mesh:stream,runoffMesh:runoff,start,edge,radius,path,curve:path.incoming,angle:a});
   for(let j=0;j<5;j++){const d=makeMesh(dropletGeo,this.runoffMaterial);this.water.add(d);this.drops.push({mesh:d,stream:i,phase:(j*.217+i*.137+j*j*.031)%1});}
   for(let j=0;j<3;j++){const d=makeMesh(dropletGeo,this.runoffMaterial);d.scale.setScalar(1.65);this.water.add(d);this.waterTraces.push({mesh:d,stream:i,phase:j/3});}
  }
  this.splash=new THREE.Group();this.water.add(this.splash);
  for(let i=0;i<7;i++){const o=makeMesh(new THREE.TorusGeometry(6,.45,5,36),this.runoffMaterial);this.splash.add(o);}
  this.water.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=false;});
  this.setMilling(0,0,0);this.setCut(true);this.update({time:0,fill:0,hoseFront:0,injecting:false,sealed:0,cured:false});
 }
 setMilling(outer,fill=0,trim=1){
  // Reserve the terminal cache key for an actually complete fill. Rounding
  // .99 to 1 used to freeze a short sleeve, leaving a visible unfilled rim.
  const o=Math.floor(outer*N)/N,f=Math.floor(clamp(fill)*40)/40,key=[o,f,trim].join(',');
  if(key===this.millingKey)return;this.millingKey=key;this.millingProgress={outer:o,fill:f,trim};
  this.projection.geometry.dispose();this.projection.geometry=projectingBranchGeometry(this.R,trim);this.projection.visible=trim<1;
  this.roots.visible=trim<1;
  for(const root of this.rootStrands){const start=root.userData.rootStart||0,remain=clamp(1-trim*1.25);root.visible=remain>start;root.geometry.setDrawRange(0,Math.floor(root.geometry.index.count*(start?1:remain)/60)*60);}
  for(const [a,c,g] of [[this.pipe,this.pipeFull,damagedPipeGeometry(this.R,this.pipeLength,18,o,f)],[this.branch,this.branchFull,brokenBranch(this.R,this.branchTop)]]){a.geometry.dispose();a.geometry=c.geometry=g;}
  const pos=[],idx=[],uv=[],R=this.R;
  const rect=(x0,x1,y0,y1)=>{const k=pos.length/3;pos.push(x0,y0,0,x1,y0,0,x1,y1,0,x0,y1,0);uv.push(x0/120,y0/120,x1/120,y0/120,x1/120,y1/120,x0/120,y1/120);idx.push(k,k+1,k+2,k,k+2,k+3);};
  rect(-this.pipeLength/2,this.pipeLength/2,-R-18,-R);
  for(const a of [0,Math.PI]){
   const sign=Math.cos(a),edge=breakoutContour(a)[0],end=repairFootprint(R,a)[0];
   const depth=o>0&&a/TAU<=o?millingSpec.depth*(1-f):0;
   rect(Math.min(edge,end),Math.max(edge,end),R+depth,R+18);
   rect(Math.min(end,sign*this.pipeLength/2),Math.max(end,sign*this.pipeLength/2),R,R+18);
   const x0=sign*passage.radius,x1=sign*(passage.radius+passage.wall);
   rect(Math.min(x0,x1),Math.max(x0,x1),branchBottom(R,a),this.branchTop);
  }
  this.pipeCaps.geometry.dispose();this.pipeCaps.geometry=geometry(pos,idx,uv);
 }
 setFeedPoints(points){
  this.feedCurve=new THREE.CatmullRomCurve3(points.map(p=>p.clone()));this.feedCore.geometry.dispose();this.feedCore.geometry=new THREE.TubeGeometry(this.feedCurve,240,3.25,10,false);
 }
 setCut(cut){
  this.ground.setCut(cut,cutPlane);
  this.cut=cut;this.section.visible=cut&&this.fill>.0001;this.branchMortarSection.visible=cut&&this.branchFill>0;
  this.pipeCaps.visible=cut;
  this.pipe.visible=this.branch.visible=cut;this.pipeFull.visible=this.branchFull.visible=!cut;
  for(const m of [this.cavityMaterial,this.mortarMaterial,this.skinMaterial,this.branchMortarMaterial,this.projectionMaterial,this.rootMaterial,this.dampMaterial])m.clippingPlanes=cut?[cutPlane]:null;
  // A display cut removes pipe geometry, not half of the water hitting the
  // intact shield. Keep both lateral paths visible; real surfaces still occlude.
  this.waterMaterial.clippingPlanes=this.runoffMaterial.clippingPlanes=null;
  this.cracks.traverse(o=>{if(o.isMesh)o.material.clippingPlanes=cut?[cutPlane]:null;});
 }
 point(a,q,h){
  const [x,arc]=breakoutContour(a),edge=surfacePoint(this.R,x,arc),r=passage.radius;
  // One-sided washout with shelves and coarse fracture facets, not a cone.
  const bulge=Math.sin(h*Math.PI)*(18+12*Math.cos(a-.7)+5*Math.sin(a*3+h*8)+3*Math.sin(a*11-h*15));
  const outerRadius=soilCavityRadius(a,0);
  const ox=THREE.MathUtils.lerp(edge.x,outerRadius*Math.cos(a),h)+Math.cos(a)*bulge,oz=THREE.MathUtils.lerp(edge.z,outerRadius*Math.sin(a),h)+Math.sin(a)*bulge;
  const px=THREE.MathUtils.lerp(r*Math.cos(a),ox,q),pz=THREE.MathUtils.lerp(r*Math.sin(a),oz,q);
  const by=Math.sqrt(Math.max(0,this.R**2-pz*pz));
  return V(px,THREE.MathUtils.lerp(by,branchBottom(this.R,a),h),pz);
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
   if(fill<1)idx.push(a,b,a+1,b,b+1,a+1);
   if(fill<1)idx.push(a+layer,a+1+layer,b+layer,b+layer,a+1+layer,b+1+layer);
  }
  for(const j of [0,RADIAL])for(let i=0;i<N;i++){const a=j*stride+i;if(Math.max(heights[a],heights[a+1])>0)idx.push(a,a+1,a+layer,a+layer,a+1,a+1+layer);}
  this.mortarGeometry.setIndex(idx);attr.needsUpdate=uv.needsUpdate=true;this.mortarGeometry.computeVertexNormals();this.mortarGeometry.computeBoundingSphere();
  const sectionUV=this.sectionGeometry.attributes.uv;for(let i=0;i<attr.count;i++)sectionUV.setXY(i,attr.getX(i)/80,attr.getY(i)/80);sectionUV.needsUpdate=true;
  const caps=[];for(const i of [0,N/2])for(let j=0;j<RADIAL;j++){const a=j*stride+i,b=a+stride;if(Math.max(heights[a],heights[b])>0)caps.push(a,b,a+layer,b,b+layer,a+layer);}
  this.sectionGeometry.setIndex(caps);this.sectionGeometry.computeVertexNormals();
 }
 updateBranchMortar(fill){
  this.branchFill=clamp((fill-.62)/.38);
  this.branchMortar.visible=this.branchFill>0;this.branchMortarSection.visible=this.cut&&this.branchMortar.visible;
  if(this.branchFill===this.lastBranchFill)return;
  this.lastBranchFill=this.branchFill;
  this.branchMortar.geometry.dispose();this.branchMortarSection.geometry.dispose();
  this.branchMortar.geometry=branchMortarGeometry(this.R,this.branchFillTop,this.branchFill);
  this.branchMortarSection.geometry=this.branchMortar.geometry.clone();
  this.branchMortarSection.geometry.setIndex(this.branchMortar.geometry.userData.sectionIndices);
 }
 update({time,fill,hoseFront,injecting,sealed,cured,shield=null}){
  this.ground.update(fill,cured);this.updateBranchMortar(fill);
  this.fill=fill;this.hoseFront=hoseFront;this.fillGeometry(clamp(fill/.62));this.mortar.visible=fill>.0001;
  this.innerSkin.visible=fill>=.62;
  this.section.visible=this.cut&&this.mortar.visible;
  this.mortarMaterial.color.set(cured?'#666764':'#444642');this.mortarMaterial.roughness=cured?.96:.68;
  this.skinMaterial.color.copy(this.mortarMaterial.color);
  this.branchMortarMaterial.color.copy(this.mortarMaterial.color);this.branchMortarMaterial.roughness=cured?.95:.68;
  this.sectionMaterial.color.copy(this.mortarMaterial.color);this.sectionMaterial.roughness=this.mortarMaterial.roughness;
  this.feedCore.geometry.setDrawRange(0,Math.floor(hoseFront*240)*10*6);this.feedCore.visible=hoseFront>0;
  this.outlet.visible=injecting&&hoseFront>=1;
  for(let i=0;i<this.flow.length;i++){
   const u=((time*2.8+i/this.flow.length)%1+1)%1,o=this.flow[i];o.visible=injecting&&u<hoseFront-.012;
   const tangent=this.feedCurve.getTangentAt(u),radial=V(0,0,1).cross(tangent).normalize().applyAxisAngle(tangent,i*2.4);
   o.position.copy(this.feedCurve.getPointAt(u)).addScaledVector(radial,2.7);
  }
  this.waterActivity=1-smooth(fill/.86);this.water.visible=this.waterActivity>.001;
  this.damp.visible=fill<.62;
  this.waterMaterial.opacity=.30*this.waterActivity;
  const runoffStrength=1-smooth(((shield?.press||0)-.9)/.1);this.runoffMaterial.opacity=.38*this.waterActivity*runoffStrength;
  const poseKey=shield?[shield.x,shield.lift,shield.seal].join(','):'no-shield';
  if(poseKey!==this.waterPoseKey){
   this.waterPoseKey=poseKey;
   for(const s of this.streams){s.path=shieldWaterPath(this.R,s.start,s.edge,shield);s.curve=s.path.incoming;s.mesh.geometry.dispose();s.mesh.geometry=rivuletGeometry(s.curve,64,s.radius);if(s.path.runoff){s.runoffMesh.geometry.dispose();s.runoffMesh.geometry=rivuletGeometry(s.path.runoff,96,s.radius);}}
  }
  for(let i=0;i<this.streams.length;i++){
   const s=this.streams[i],a=this.waterActivity; s.mesh.visible=a> .035+i*.025;
   s.runoffMesh.visible=s.mesh.visible&&s.path.caught&&runoffStrength>.001;
  }
  for(const d of this.drops){
   const s=this.streams[d.stream],u=((time*2.4+d.phase)%1+1)%1,p=s.path.lip;
   d.mesh.visible=runoffStrength>.001&&this.waterActivity>.08&&u<.68+(d.stream%3)*.1;
   const z=p.z+.55*Math.sin(u*12+d.stream),bottom=-Math.sqrt(Math.max(1,this.R**2-z**2));
   d.mesh.position.set(p.x+.5*Math.sin(u*9),THREE.MathUtils.lerp(p.y,bottom+6,u*u),z);d.mesh.scale.set(s.radius*.9,s.radius*(1.4+u*2.3),s.radius*.9);
  }
  for(const d of this.waterTraces){const s=this.streams[d.stream];d.mesh.visible=s.runoffMesh.visible;if(d.mesh.visible)d.mesh.position.copy(s.path.runoff.getPointAt(((time*2+d.phase)%1+1)%1));}
  this.splash.children.forEach((o,i)=>{const u=((time*2+i*.143)%1+1)%1,p=this.streams[i].path.lip,bottom=-Math.sqrt(Math.max(1,this.R**2-p.z**2)),normal=V(0,-bottom,-p.z).normalize();o.visible=runoffStrength>.001&&this.waterActivity>.08;o.position.set(p.x,bottom,p.z);o.position.addScaledVector(normal,1.4);o.quaternion.setFromUnitVectors(V(0,0,1),normal);o.scale.setScalar(.35+u*.9);});
 }
 dispose(){this.texture.dispose();for(const pack of [this.pipeTextures,this.mortarTextures])for(const t of Object.values(pack))t.dispose();const materials=new Set();for(const root of [this.group,this.hoseGroup])root.traverse(o=>{if(o.isMesh)materials.add(o.material);});for(const m of materials)m.dispose();}
}
