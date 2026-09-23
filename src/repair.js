import * as THREE from 'three';
import {passage,ports} from './bladder.js';
import {surfaceTextures,mouldSurface} from './repair-surface.js';
import {millingSpec,repairFootprint} from './milling.js';
import {GroundGrout,soilCavityRadius} from './ground-grout.js';
import {injectionSpec} from './injection-fitting.js';
import {RootSystem} from './roots.js';
import {MillingDebris} from './debris.js';

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
 return [80*Math.cos(a)*jag,48*Math.sin(a)*jag];
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
export function damagedPipeGeometry(R,length,thickness,progress=0,fill=0,closed=false){
 const nr=43,positions=[],uv=[],indices=[],colors=[],stride=N+1,layerSize=(nr+1)*stride;
 for(let layer=0;layer<2;layer++)for(let j=0;j<=nr;j++)for(let i=0;i<=N;i++){
  const a=i/N*TAU,[hx,ha]=breakoutContour(a),dx=Math.cos(a),da=Math.sin(a);
  const edge=Math.min(length/2/Math.max(1e-9,Math.abs(dx)),Math.PI*R/Math.max(1e-9,Math.abs(da)));
  const w=millingSpec.width,cut=i/N<=progress&&progress>0;
  const [outerX,outerArc]=repairFootprint(R,a,closed),t=Math.max(0,(j-3)/(nr-3));
  const x=j<2?hx:THREE.MathUtils.lerp(outerX,dx*edge,t),arc=j<2?ha:THREE.MathUtils.lerp(outerArc,da*edge,t);
  const floor=!layer&&j<=2,depth=layer?thickness:floor&&cut?(fill>.99?.08:millingSpec.depth*(1-fill)):0;
  positions.push(...surfacePoint(R,x,arc,depth).toArray());uv.push(x/120,arc/120);
  const c=new THREE.Color(floor&&cut?(fill>.99?'#666764':'#b18d70'):'#422b21');colors.push(c.r,c.g,c.b);
 }
 for(let l=0;l<2;l++)for(let j=0;j<nr;j++)for(let i=0;i<N;i++){
  // The finished casting supplies this face. Keeping the coarse pipe triangles
  // underneath it causes their curved chords to show through the fine skin.
  if(!l&&j<3&&fill>.99&&progress>0&&i/N<=progress)continue;
  if(!l&&j<3&&closed&&fill>=.625)continue; // Casting replaces the displayed face even without milling.
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
export function branchMortarGeometry(R,top,fill,closed=false){
 const pos=[],uv=[],idx=[],caps=[],stride=N+1,rows=24;
 for(let side=0;side<2;side++)for(let j=0;j<=rows;j++)for(let i=0;i<=N;i++){
  const a=i/N*TAU,base=closed?R+12:branchBottom(R,a)-1;
  const y=THREE.MathUtils.lerp(base,top,clamp(fill)*j/rows);
  const r=side?passage.radius:closed?0:passage.mouldRadius;
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
function projectingPipeGeometry(R,trim){
 const positions=[],indices=[];
 for(const a of [.3,1.8,3.2,4.8]){
  const edge=t=>{const [x,arc]=breakoutContour(t);return surfacePoint(R,x,arc);};
  const left=edge(a-.18),right=edge(a+.18),back=edge(a).add(V(0,12,0)),tip=edge(a).multiplyScalar(1);
  tip.x*=.76;tip.z*=.76;tip.y=THREE.MathUtils.lerp(R-32,R+12,trim);
  const k=positions.length/3;positions.push(...left.toArray(),...right.toArray(),...back.toArray(),...tip.toArray());
  indices.push(k,k+1,k+2,k,k+3,k+1,k+1,k+3,k+2,k+2,k+3,k);
 }
 return geometry(positions,indices);
}
function tube(curve,r,m,segments=96){return makeMesh(new THREE.TubeGeometry(curve,segments,r,10,false),m);}
// Mortar squeezed out between shield and old wall: an irregular, feathered
// film with a slight ridge around the casting (user correction 23.09.2026:
// the result must not look like a perfectly clean ellipse). Illustrative.
export function smearGeometry(R,contour,cx=0){
 const pos=[],col=[],uv=[],idx=[],rows=8,stride=N+1;
 for(let j=0;j<=rows;j++)for(let i=0;i<=N;i++){
  const a=i/N*TAU,u=j/rows,[x,arc]=contour(a),dx=x-cx,len=Math.hypot(dx,arc);
  const reach=6+13*(.5+.5*Math.sin(a*4+1.3))*(.6+.4*Math.sin(a*11+.2))+12*Math.max(0,Math.sin(a*7+2.2))**3+8*Math.max(0,Math.sin(a*3+4))**2;
  const k=(len-2+(reach+2)*u)/len,px=cx+dx*k,pa=arc*k,ridge=1.2*Math.exp(-(((u-.08)/.12)**2))+.35*(1-u);
  pos.push(...surfacePoint(R,px,pa,-ridge).toArray());uv.push(px/80,pa/80);
  const patch=.5+.5*(.5+.5*Math.sin(a*23+u*9))*(.5+.5*Math.cos(a*9-u*5)),alpha=.72*Math.pow(1-u,1.4)*patch;
  col.push(1,1,1,THREE.MathUtils.clamp(alpha,0,1));
 }
 for(let j=0;j<rows;j++)for(let i=0;i<N;i++){const a=j*stride+i,b=a+stride;idx.push(a,b,a+1,b,b+1,a+1);}
 const g=geometry(pos,idx,uv);g.setAttribute('color',new THREE.Float32BufferAttribute(col,4));return g;
}
// Tileable ripple normals for flowing sewage, streaked along the flow (x).
let flowNormalCache=null;
function flowNormalTexture(){
 if(flowNormalCache){const c=flowNormalCache.clone();c.needsUpdate=true;return c;}
 const size=256,height=new Float32Array(size*size),data=new Uint8Array(size*size*4);let seed=77;
 const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const waves=Array.from({length:28},(_,k)=>({fx:Math.round(1+rnd()*(k<8?3:9)),fz:Math.round((rnd()*2-1)*(k<8?8:22)),a:(k<8?1:.35)*(.5+rnd()),p:rnd()*TAU}));
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){let h=0;for(const w of waves)h+=w.a*Math.sin(TAU*(w.fx*x+w.fz*y)/size+w.p);height[y*size+x]=h;}
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const hx=height[y*size+(x+1)%size]-height[y*size+(x+size-1)%size],hy=height[((y+1)%size)*size+x]-height[((y+size-1)%size)*size+x];
  const n=V(-hx*.6,-hy*.6,1).normalize();data.set([Math.round((n.x*.5+.5)*255),Math.round((n.y*.5+.5)*255),Math.round((n.z*.5+.5)*255),255],(y*size+x)*4);
 }
 const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;
 flowNormalCache=t;return t.clone();
}
const G=9810; // mm/s²
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
 constructor(R,branchTop,hosePoints,inletX,pipeLength=1350,branchFillTop=R,options={}){
  this.options=options;this.closed=!!options.kind&&options.kind!=='open';this.hasBranch=options.kind!=='pipe';
  if(this.closed)branchFillTop=THREE.MathUtils.lerp(R+12,branchTop,.95); // Almost full, illustrative proportion.
  this.branchFillTop=branchFillTop;this.branchFill=0;this.R=R;this.pipeLength=pipeLength;this.branchTop=branchTop;this.group=new THREE.Group();this.hoseGroup=new THREE.Group();this.inletX=inletX;
  this.texture=concreteTexture();
  this.pipeTextures=surfaceTextures('pipe');this.mortarTextures=surfaceTextures('mortar');
  this.soilTextures=surfaceTextures('soil');this.ground=new GroundGrout(R,this.soilTextures,this.mortarTextures,options);this.group.add(this.ground.group);
  this.concrete=new THREE.MeshStandardMaterial({color:'#422b21',...this.pipeTextures,bumpScale:.12,roughness:1,metalness:0,envMapIntensity:.18,side:THREE.DoubleSide});
  this.concrete.vertexColors=true;this.concrete.color.set('#ffffff');this.cutConcrete=this.concrete.clone();this.cutConcrete.clippingPlanes=[cutPlane];
  const pg=damagedPipeGeometry(R,pipeLength,18,0,0,this.closed),bg=brokenBranch(R,branchTop);
  this.pipe=makeMesh(pg,this.cutConcrete);this.pipeFull=makeMesh(pg,this.concrete);
  this.branch=makeMesh(bg,this.cutConcrete);this.branchFull=makeMesh(bg,this.concrete);
  this.group.add(this.pipe,this.pipeFull,this.branch,this.branchFull);
  this.projectionMaterial=this.concrete.clone();this.projectionMaterial.vertexColors=false;this.projectionMaterial.color.set('#5d3725');
  this.projection=makeMesh(projectingBranchGeometry(R,0),this.projectionMaterial);this.group.add(this.projection);
  // Branching root mat in the sewer plus the roots in the soil that feed it.
  // The sewer part is milled away from below; the soil roots stay embedded.
  this.roots=new THREE.Group();this.group.add(this.roots);
  // Radius of the broken edge around the branch axis for a direction phi.
  const edge=phi=>{const [x,arc]=breakoutContour(Math.atan2(80*Math.sin(phi),48*Math.cos(phi)));return Math.hypot(x,arc);};
  this.rootSystem=new RootSystem(R,{branchRadius:passage.radius,branchWall:passage.wall,edge});
  this.roots.add(this.rootSystem.group);this.soilRoots=this.rootSystem.soilGroup;this.group.add(this.soilRoots);
  this.rootMaterial=this.rootSystem.material;this.debris=new MillingDebris(R);this.group.add(this.debris.group);
  const capPositions=[],capIndices=[],capUV=[];
  const rect=(x0,x1,y0,y1)=>{const n=capPositions.length/3;capPositions.push(x0,y0,0,x1,y0,0,x1,y1,0,x0,y1,0);capUV.push(x0/120,y0/120,x1/120,y0/120,x1/120,y1/120,x0/120,y1/120);capIndices.push(n,n+1,n+2,n,n+2,n+3);};
  rect(-pipeLength/2,pipeLength/2,-R-18,-R);rect(-pipeLength/2,breakoutContour(Math.PI)[0],R,R+18);rect(breakoutContour(0)[0],pipeLength/2,R,R+18);
  for(const a of [0,Math.PI]){const sign=Math.cos(a),bottom=R+65+14*Math.sin(a*5+.6)+10*Math.cos(a*11);rect(Math.min(sign*passage.radius,sign*(passage.radius+passage.wall)),Math.max(sign*passage.radius,sign*(passage.radius+passage.wall)),bottom,branchTop);}
  // Section faces carry no vertex colours: without this the clay cut rendered
  // black with only a metallic-looking sheen.
  const capMaterial=this.concrete.clone();capMaterial.vertexColors=false;capMaterial.color.set('#6b4632');capMaterial.roughness=1;capMaterial.bumpScale=.3;capMaterial.envMapIntensity=.12;
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
  // Washed-out soil: dark, damp and grainy rather than a light stone surface.
  this.cavityMaterial=new THREE.MeshStandardMaterial({color:'#6b5642',...this.soilTextures,bumpScale:2.2,roughness:.82,envMapIntensity:.35,vertexColors:true,side:THREE.DoubleSide});
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
  this.innerSkin=mouldSurface(R,a=>repairFootprint(R,a,this.closed),this.skinMaterial,this.closed,this.closed?-ports.inletX:0);this.group.add(this.innerSkin);
  this.smearMaterial=new THREE.MeshStandardMaterial({color:'#555652',...this.mortarTextures,bumpScale:.2,roughness:.95,envMapIntensity:.3,vertexColors:true,transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
  this.smear=makeMesh(smearGeometry(R,a=>repairFootprint(R,a,this.closed),this.closed?40:2),this.smearMaterial);this.smear.castShadow=false;this.group.add(this.smear);
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
  if(this.closed)this.branchMortarSection.castShadow=this.branchMortarSection.receiveShadow=false;
  this.group.add(this.branchMortar,this.branchMortarSection);this.lastBranchFill=-1;
  this.lastFill=-1;

  // Material travels inside the original hose. Draw range advances a continuous
  // front; suspended aggregate moves behind it, never ahead of it or outside it.
  this.feedCurve=new THREE.CatmullRomCurve3(hosePoints.map(p=>V(...p)));
  this.feedMaterial=new THREE.MeshStandardMaterial({color:'#8b8a79',roughness:.52});
  this.feedCore=tube(this.feedCurve,injectionSpec.coreRadius,this.feedMaterial,240);this.feedCore.frustumCulled=false;this.hoseGroup.add(this.feedCore);
  this.flow=[];const grainMat=new THREE.MeshStandardMaterial({color:'#b0aa98',roughness:.7});
  for(let i=0;i<38;i++){const o=makeMesh(new THREE.SphereGeometry(.75,7,5),grainMat);this.hoseGroup.add(o);this.flow.push(o);}
  this.outletCurve=new THREE.CatmullRomCurve3([V(inletX,R-20,0),V(inletX,R-6,0),V(inletX,R+2,0),V(inletX-8,R+7,0)]);
  this.outlet=tube(this.outletCurve,injectionSpec.coreRadius,this.feedMaterial,36);this.group.add(this.outlet);

  // Exposure time for the visible fall streak of drops (film sets its shutter).
  this.streakTime=.012;
  this.water=new THREE.Group();this.group.add(this.water);this.streams=[];this.drops=[];this.waterTraces=[];this.pendants=[];this.splashDrops=[];
  // Clear, glossy water: visible through highlights and reflections, not paint.
  this.waterMaterial=new THREE.MeshPhysicalMaterial({color:'#9fb0af',transparent:true,opacity:.4,roughness:.22,metalness:0,ior:1.33,specularIntensity:.55,envMapIntensity:.7,side:THREE.DoubleSide,depthWrite:false});
  this.runoffMaterial=this.waterMaterial.clone();this.dropMaterial=this.waterMaterial.clone();this.dropMaterial.roughness=.05;
  // Wet streaks are darker and glossy; a faint halo marks older seepage.
  this.dampMaterial=new THREE.MeshPhysicalMaterial({color:'#140d08',transparent:true,opacity:.62,roughness:.12,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.5,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
  this.haloMaterial=this.dampMaterial.clone();this.haloMaterial.opacity=.3;this.haloMaterial.roughness=.4;
  // Lime sinter from long-lasting infiltration: crusts and small stalactites.
  this.sinterMaterial=new THREE.MeshStandardMaterial({color:'#d3cab1',...this.mortarTextures,bumpScale:.6,roughness:.9,envMapIntensity:.5,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
  this.damp=new THREE.Group();this.group.add(this.damp);this.sinter=new THREE.Group();this.group.add(this.sinter);
  const dropletGeo=new THREE.SphereGeometry(1,12,10),stalactite=new THREE.ConeGeometry(1,1,7,1,false);stalactite.translate(0,-.5,0);
  const strip=(x,arc,side,length,width,wander,depth,seed)=>{
   const pos=[],uv=[],idx=[];
   for(let j=0;j<=36;j++){
    const u=j/36,s=arc+side*length*u,cx=x+wander*Math.sin(u*7+seed)+.4*wander*Math.sin(u*19+seed*2),w=width*(.55+.45*Math.sin(Math.PI*Math.min(1,u*1.6)))*(1-u*.8)*(1+.25*Math.sin(u*23+seed));
    for(const sign of [-1,1]){pos.push(...surfacePoint(R,cx+sign*w,s,depth).toArray());uv.push(sign,u);}
    if(j<36){const k=j*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}
   }
   return geometry(pos,idx,uv);
  };
  // Several paths visibly enter at the fractured edge and fall into the sewer.
  for(let i=0;i<7;i++){
   const a=[.055,.102,.21,.44,.58,.627,.83][i]*TAU,[x,arc]=breakoutContour(a),edge=surfacePoint(R,x,arc,2);
   const start=this.point(a,1,.2+(i%3)*.06),side=arc<0?-1:1,length=46+38*(i%3)+14*Math.sin(i*2.3);
   this.damp.add(makeMesh(strip(x,arc,side,length,2.6+1.2*(i%2),3,-.12,i),this.dampMaterial));
   this.damp.add(makeMesh(strip(x,arc,side,length*1.35,7+2*(i%3),5,-.08,i+.5),this.haloMaterial));
   this.sinter.add(makeMesh(strip(x,arc,side,10+6*(i%3),4.2,1.2,-.2,i+1.7),this.sinterMaterial));
   for(let j=0;j<3;j++){
    const [sx,sa]=breakoutContour(a+(j-1)*.035),p=surfacePoint(R,sx,sa,-.3),o=makeMesh(stalactite,this.sinterMaterial);
    const size=1.1+.9*((i+j)%3)/2,len=3+7*(((i*5+j*3)%7)/6);o.position.copy(p);o.quaternion.setFromUnitVectors(V(0,1,0),p.clone().normalize());o.scale.set(size,len,size);this.sinter.add(o);
   }
   const path=shieldWaterPath(R,start,edge,null),radius=[.42,.85,.3,.58,.98,.36,.52][i]*1.45;
   const stream=tube(path.incoming,radius,this.waterMaterial,64),runoff=tube(path.incoming,radius,this.runoffMaterial,96);
   // Real seepage drips at different rates; strong paths become a broken thread.
   const interval=[.95,.2,1.45,.55,.13,1.15,.38][i];
   this.water.add(stream,runoff);this.streams.push({mesh:stream,runoffMesh:runoff,start,edge,radius,path,curve:path.incoming,angle:a,interval});
   for(let j=0;j<8;j++){const d=makeMesh(dropletGeo,this.dropMaterial);this.water.add(d);this.drops.push({mesh:d,stream:i,index:j,phase:(j*.217+i*.137+j*j*.031)%1});}
   for(let j=0;j<3;j++){const d=makeMesh(dropletGeo,this.runoffMaterial);d.scale.setScalar(1.65);this.water.add(d);this.waterTraces.push({mesh:d,stream:i,phase:j/3});}
   const pendant=makeMesh(dropletGeo,this.dropMaterial);this.water.add(pendant);this.pendants.push(pendant);
   for(let j=0;j<6;j++){const d=makeMesh(dropletGeo,this.dropMaterial);this.water.add(d);this.splashDrops.push({mesh:d,stream:i,index:j});}
  }
  // Expanding rings where drops hit the invert or the sewage surface.
  this.splash=new THREE.Group();this.water.add(this.splash);this.rippleMaterials=[];
  for(let i=0;i<7;i++){const m=this.runoffMaterial.clone();this.rippleMaterials.push(m);const o=makeMesh(new THREE.RingGeometry(.86,1,48,1),m);this.splash.add(o);}
  this.water.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=false;});
  this.sinter.traverse(o=>{if(o.isMesh)o.castShadow=false;});
  this.flowWater=options.sewerWater?this.sewerWater(options.sewerWater):null;if(this.flowWater)this.debris.waterY=this.flowWater.y;
  this.setMilling(0,0,0);this.setCut(true);this.update({time:0,fill:0,hoseFront:0,injecting:false,sealed:0,cured:false});
 }
 setMilling(outer,fill=0,trim=1){
  if(this.closed&&this.options.milling===false){outer=0;trim=1;}
  // Reserve the terminal cache key for an actually complete fill. Rounding
  // .99 to 1 used to freeze a short sleeve, leaving a visible unfilled rim.
  const o=Math.floor(outer*N)/N,f=Math.floor(clamp(fill)*40)/40,key=[o,f,trim].join(',');
  if(key===this.millingKey)return;this.millingKey=key;this.millingProgress={outer:o,fill:f,trim};
  this.projection.geometry.dispose();this.projection.geometry=this.hasBranch?projectingBranchGeometry(this.R,trim):projectingPipeGeometry(this.R,trim);this.projection.visible=trim<1;
  this.roots.visible=this.hasBranch&&trim<1;
  this.soilRoots.visible=this.hasBranch&&!(this.closed&&this.options.milling===false);
  // Without an explicit cutter pose (web seeking), cut at the milled height.
  if(trim<=0)this.rootSystem.setCut(-1e6);else if(!this.cutterPose)this.rootSystem.setCut(this.R-36+trim*60);
  for(const [a,c,g] of [[this.pipe,this.pipeFull,damagedPipeGeometry(this.R,this.pipeLength,18,o,f,this.closed)],[this.branch,this.branchFull,brokenBranch(this.R,this.branchTop)]]){a.geometry.dispose();a.geometry=c.geometry=g;}
  const pos=[],idx=[],uv=[],R=this.R;
  const rect=(x0,x1,y0,y1)=>{const k=pos.length/3;pos.push(x0,y0,0,x1,y0,0,x1,y1,0,x0,y1,0);uv.push(x0/120,y0/120,x1/120,y0/120,x1/120,y1/120,x0/120,y1/120);idx.push(k,k+1,k+2,k,k+2,k+3);};
  rect(-this.pipeLength/2,this.pipeLength/2,-R-18,-R);
  for(const a of [0,Math.PI]){
   const sign=Math.cos(a),edge=breakoutContour(a)[0],end=repairFootprint(R,a,this.closed)[0];
   const depth=o>0&&a/TAU<=o?millingSpec.depth*(1-f):0;
   rect(Math.min(edge,end),Math.max(edge,end),R+depth,R+18);
   rect(Math.min(end,sign*this.pipeLength/2),Math.max(end,sign*this.pipeLength/2),R,R+18);
   const x0=sign*passage.radius,x1=sign*(passage.radius+passage.wall);
   if(this.hasBranch)rect(Math.min(x0,x1),Math.max(x0,x1),branchBottom(R,a),this.branchTop);
  }
  this.pipeCaps.geometry.dispose();this.pipeCaps.geometry=geometry(pos,idx,uv);
 }
 setFeedPoints(points){
  this.feedCurve=new THREE.CatmullRomCurve3(points.map(p=>p.clone()));this.feedCore.geometry.dispose();this.feedCore.geometry=new THREE.TubeGeometry(this.feedCurve,240,injectionSpec.coreRadius,10,false);
 }
 setCut(cut){
  this.ground.setCut(cut,cutPlane);
  this.cut=cut;this.section.visible=cut&&this.fill>.0001;this.branchMortarSection.visible=cut&&this.branchFill>0;
  this.pipeCaps.visible=cut;
  this.pipe.visible=cut;this.pipeFull.visible=!cut;this.branch.visible=this.hasBranch&&cut;this.branchFull.visible=this.hasBranch&&!cut;
  for(const m of [this.cavityMaterial,this.mortarMaterial,this.skinMaterial,this.branchMortarMaterial,this.projectionMaterial,this.dampMaterial,this.haloMaterial,this.sinterMaterial,this.smearMaterial])m.clippingPlanes=cut?[cutPlane]:null;
  // A display cut removes pipe geometry, not half of the water hitting the
  // intact shield. Keep both lateral paths visible; real surfaces still occlude.
  this.waterMaterial.clippingPlanes=this.runoffMaterial.clippingPlanes=this.dropMaterial.clippingPlanes=null;
  // Likewise the hanging root mat stays complete; halved roots would look
  // like fresh cuts in front of the camera.
  this.rootSystem.setClipping(null);this.debris.setClipping(null);
  for(const m of this.rippleMaterials)m.clippingPlanes=cut?[cutPlane]:null;
  if(this.flowWater){this.flowWater.uniforms.uCut.value=cut?1:0;this.flowWater.section.visible=cut;}
  this.cracks.traverse(o=>{if(o.isMesh)o.material.clippingPlanes=cut?[cutPlane]:null;});
 }
 // Continuous dry-weather flow on the invert. `depthOption` < 1 is a fraction of
 // the diameter, otherwise millimetres. The surface is a fine grid shaped in the
 // shader: thin clear film over the submerged base plate, bow wave, faster flow
 // beside and a V-shaped, foaming wake behind parts standing in the flow (+x).
 // Clipped with the pipe section, except the film running over the plate.
 sewerWater(depthOption){
  const R=this.R,depth=depthOption<1?2*R*depthOption:depthOption,y=-R+depth,half=Math.sqrt(R*R-y*y)-.4,L=this.pipeLength;
  const xs=[];for(let x=-L/2;x<-700;x+=40)xs.push(x);for(let x=-700;x<700;x+=2)xs.push(x);for(let x=700;x<L/2;x+=40)xs.push(x);xs.push(L/2);
  const nz=72,pos=[],uv=[],nor=[],idx=[];
  for(let i=0;i<xs.length;i++)for(let j=0;j<=nz;j++){const z=-half+2*half*j/nz;pos.push(xs[i],y,z);nor.push(0,1,0);uv.push((xs[i]+L/2)/L,j/nz);}
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<nz;j++){const a=i*(nz+1)+j,b=a+nz+1;idx.push(a,a+1,b,b,a+1,b+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);
  const normal=flowNormalTexture();normal.repeat.set(L/420,2*half/260);
  const material=new THREE.MeshPhysicalMaterial({color:'#2a271c',roughness:.1,metalness:0,clearcoat:.8,clearcoatRoughness:.03,normalMap:normal,normalScale:new THREE.Vector2(.45,.45),transparent:true,opacity:.94,envMapIntensity:1.2,side:THREE.DoubleSide});
  const uniforms={uTime:{value:0},uFlow:{value:280},uR:{value:R},uCut:{value:0},uObsBox:{value:Array.from({length:6},()=>new THREE.Vector4())},uObsInfo:{value:Array.from({length:6},()=>new THREE.Vector4())}};
  const common=`uniform float uTime,uFlow,uR,uCut;uniform vec4 uObsBox[6];uniform vec4 uObsInfo[6];varying vec3 vWater;
float wHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float wNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(wHash(i),wHash(i+vec2(1.,0.)),f.x),mix(wHash(i+vec2(0.,1.)),wHash(i+vec2(1.,1.)),f.x),f.y);}
float zMask(float z,vec4 b,float soft){float d=max(0.,max(b.z-z,z-b.w));return exp(-d*d/soft);}
// Surface offset (mm) and foam amount caused by the parts in the flow.
vec2 flowField(vec2 p){float h=0.,f=0.;
 for(int i=0;i<6;i++){vec4 b=uObsBox[i];vec4 o=uObsInfo[i];if(o.y<.5)continue;
  float zc=.5*(b.z+b.w),hw=.5*(b.w-b.z),zm=zMask(p.y,b,40.),up=b.x-p.x,s=p.x-b.y;
  if(o.y<1.5){
   // Submerged plate: standing wave at the leading edge, faster thin film, small jump behind.
   float inx=smoothstep(b.x-3.,b.x+3.,p.x)*(1.-smoothstep(b.y-3.,b.y+3.,p.x));
   h+=1.7*exp(-pow((p.x-b.x+4.)/5.,2.))*zm-.7*inx*zm+1.1*exp(-pow((s-11.)/8.,2.))*zm*(.8+.2*sin(p.y*.4+uTime*6.));
   f+=.75*exp(-pow((p.x-b.x)/4.5,2.))*zm+.5*exp(-pow((s-9.)/10.,2.))*zm+.12*inx*zm;
  }else{
   // Part standing in the flow: bow wave, faster sides, V-shaped wake with eddies.
   float side=abs(p.y-zc)-hw,bow=up>-1.?exp(-max(up,0.)/8.5)*exp(-max(side,0.)*max(side,0.)/50.):0.;
   float along=step(b.x-2.,p.x)*step(p.x,b.y+25.),sideDip=along*exp(-pow((side-6.)/7.,2.))*step(0.,side+2.);
   float ws=max(s,0.),lane=abs(abs(p.y-zc)-hw-ws*.42),wake=step(0.,s)*exp(-lane*lane/(14.+ws*.25))*exp(-ws/280.);
   float core=step(0.,s)*exp(-max(side,0.)*max(side,0.)/40.)*exp(-ws/85.);
   h+=4.8*bow-1.3*sideDip+1.1*wake*(.6+.4*sin(ws*.33-uTime*9.))+.9*core*(wNoise(vec2((p.x-uFlow*uTime)*.12,p.y*.15))-.5);
   f+=1.1*bow+.35*sideDip+.8*wake+.75*core;
  }}
 return vec2(h,f);}`;
  material.onBeforeCompile=sh=>{Object.assign(sh.uniforms,uniforms);
   sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\n'+common)
    .replace('#include <beginnormal_vertex>','vec2 fp=position.xz;float e=1.2;float hx=(flowField(fp+vec2(e,0.)).x-flowField(fp-vec2(e,0.)).x)/(2.*e),hz=(flowField(fp+vec2(0.,e)).x-flowField(fp-vec2(0.,e)).x)/(2.*e);vec3 objectNormal=normalize(vec3(-hx,1.,-hz));\n#ifdef USE_TANGENT\nvec3 objectTangent=vec3(tangent.xyz);\n#endif')
    .replace('#include <begin_vertex>','vec3 transformed=position;transformed.y+=flowField(position.xz).x;vWater=transformed;');
   sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\n'+common)
    .replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
 bool overPlate=false;
 for(int i=0;i<6;i++){vec4 b=uObsBox[i];float t=uObsInfo[i].y;
  if(t>.5&&t<1.5&&vWater.x>b.x&&vWater.x<b.y&&vWater.z<b.w+.6)overPlate=true;
  if(t>1.5&&vWater.x>b.x&&vWater.x<b.y&&vWater.z>b.z&&vWater.z<b.w)discard;}
 // Section cut at z = 0, except the film running over the base plate.
 if(uCut>.5&&vWater.z>0.&&!overPlate)discard;`)
    .replace('#include <color_fragment>',`#include <color_fragment>
 float bottom=-sqrt(max(0.,uR*uR-vWater.z*vWater.z));
 for(int i=0;i<6;i++){vec4 b=uObsBox[i];if(uObsInfo[i].y>.5&&uObsInfo[i].y<1.5&&vWater.x>b.x&&vWater.x<b.y&&vWater.z>b.z&&vWater.z<b.w)bottom=max(bottom,uObsInfo[i].x);}
 float wdepth=vWater.y-bottom;
 // Thin water is clear; the flow turns murky with depth; grey scum at the edges.
 diffuseColor.a*=mix(.14,1.,smoothstep(1.,22.,wdepth));
 vec2 ff=flowField(vWater.xz);float nn=wNoise(vec2((vWater.x-uFlow*uTime)*.09,vWater.z*.13))*.65+wNoise(vec2((vWater.x-uFlow*uTime)*.31,vWater.z*.37))*.35;
 float foam=clamp(smoothstep(.38,.9,ff.y*(.45+nn))+.22*smoothstep(3.,.5,wdepth)*nn,0.,1.);
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.74,.71,.62),foam*.85);diffuseColor.a=max(diffuseColor.a,foam*.9);`)
    .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.55,clamp(smoothstep(.38,.9,flowField(vWater.xz).y),0.,1.));');
  };
  material.customProgramCacheKey=()=>'kanaltec-sewer-flow';
  const surface=makeMesh(g,material);surface.castShadow=false;surface.frustumCulled=false;
  const sg=new THREE.PlaneGeometry(L,depth);sg.translate(0,-R+depth/2,0);
  const sectionMaterial=new THREE.MeshStandardMaterial({color:'#2d2a1d',roughness:.35,transparent:true,opacity:.62,side:THREE.DoubleSide,depthWrite:false});
  const section=makeMesh(sg,sectionMaterial);section.castShadow=section.receiveShadow=false;
  const group=new THREE.Group();group.name='Abwasser in der Sohle';group.add(surface,section);this.group.add(group);
  return {group,surface,section,material,sectionMaterial,normal,y,depth,uniforms};
 }
 // Parts lying under or standing in the flow: [{box:[x0,x1,z0,z1],top,type}],
 // type 1 = submerged plate, 2 = part rising out of the water.
 setWaterObstacles(list){
  if(!this.flowWater)return;const u=this.flowWater.uniforms;
  for(let i=0;i<6;i++){const o=list[i];if(o){u.uObsBox.value[i].set(...o.box);u.uObsInfo.value[i].set(o.top,o.type,0,0);}else u.uObsInfo.value[i].set(0,0,0,0);}
 }
 // Cutter pose during preparation: {point, cutY, frontX, rate, roots}.
 setCutter(pose){this.cutterPose=pose;if(pose)this.rootSystem.setCut(pose.cutY,pose.frontX);}
 point(a,q,h){
  const [x,arc]=breakoutContour(a),edge=surfacePoint(this.R,x,arc),r=this.closed?0:passage.radius;
  // One-sided washout with shelves and coarse fracture facets, not a cone.
  const bulge=Math.sin(h*Math.PI)*(18+12*Math.cos(a-.7)+5*Math.sin(a*3+h*8)+3*Math.sin(a*11-h*15));
  const outerRadius=soilCavityRadius(a,0,this.options);
  const ox=THREE.MathUtils.lerp(edge.x,outerRadius*Math.cos(a),h)+Math.cos(a)*bulge,oz=THREE.MathUtils.lerp(edge.z,outerRadius*Math.sin(a),h)+Math.sin(a)*bulge;
  const px=THREE.MathUtils.lerp(r*Math.cos(a),ox,q),pz=THREE.MathUtils.lerp(r*Math.sin(a),oz,q);
  const by=Math.sqrt(Math.max(0,this.R**2-pz*pz));
  const top=this.closed?THREE.MathUtils.lerp(this.R+18,branchBottom(this.R,a),q):branchBottom(this.R,a);
  return V(px,THREE.MathUtils.lerp(by,top,h),pz);
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
   if(fill<1||this.closed)idx.push(a+layer,a+1+layer,b+layer,b+layer,a+1+layer,b+1+layer);
  }
  for(const j of [0,RADIAL])for(let i=0;i<N;i++){const a=j*stride+i;if(Math.max(heights[a],heights[a+1])>0)idx.push(a,a+1,a+layer,a+layer,a+1,a+1+layer);}
  this.mortarGeometry.setIndex(idx);attr.needsUpdate=uv.needsUpdate=true;this.mortarGeometry.computeVertexNormals();this.mortarGeometry.computeBoundingSphere();
  const sectionUV=this.sectionGeometry.attributes.uv;for(let i=0;i<attr.count;i++)sectionUV.setXY(i,attr.getX(i)/80,attr.getY(i)/80);sectionUV.needsUpdate=true;
  const caps=[];for(const i of [0,N/2])for(let j=0;j<RADIAL;j++){const a=j*stride+i,b=a+stride;if(Math.max(heights[a],heights[b])>0)caps.push(a,b,a+layer,b,b+layer,a+layer);}
  this.sectionGeometry.setIndex(caps);this.sectionGeometry.computeVertexNormals();
 }
 updateBranchMortar(fill){
  this.branchFill=this.hasBranch?clamp((fill-.62)/.38):0;
  this.branchMortar.visible=this.branchFill>0;this.branchMortarSection.visible=this.cut&&this.branchMortar.visible;
  if(this.branchFill===this.lastBranchFill)return;
  this.lastBranchFill=this.branchFill;
  this.branchMortar.geometry.dispose();this.branchMortarSection.geometry.dispose();
  this.branchMortar.geometry=branchMortarGeometry(this.R,this.branchFillTop,this.branchFill,this.closed);
  this.branchMortarSection.geometry=this.branchMortar.geometry.clone();
  this.branchMortarSection.geometry.setIndex(this.branchMortar.geometry.userData.sectionIndices);
  if(this.closed)this.branchMortarSection.geometry.computeVertexNormals();
 }
 // time: process phase; clock: real seconds for water, sway and chips, so
 // dripping keeps its natural pace even while a film lingers in one phase.
 update({time,fill,hoseFront,injecting,sealed,cured,shield=null,clock=time}){
  this.rootSystem.setClock(clock);this.debris.update(clock,this.cutterPose);
  if(this.flowWater){this.flowWater.normal.offset.set(-clock*280/420,.05*Math.sin(clock*.7));this.flowWater.uniforms.uTime.value=clock;}
  this.ground.update(fill,cured);this.updateBranchMortar(fill);
  this.fill=fill;this.hoseFront=hoseFront;this.fillGeometry(clamp(fill/.62));this.mortar.visible=fill>.0001;
  this.innerSkin.visible=fill>=.62;this.smear.visible=this.innerSkin.visible;
  this.section.visible=this.cut&&this.mortar.visible;
  this.mortarMaterial.color.set(cured?'#666764':'#444642');this.mortarMaterial.roughness=cured?.96:.68;
  this.skinMaterial.color.copy(this.mortarMaterial.color);this.smearMaterial.color.copy(this.mortarMaterial.color).multiplyScalar(cured?.82:.9);
  this.branchMortarMaterial.color.copy(this.mortarMaterial.color);this.branchMortarMaterial.roughness=cured?.95:.68;
  this.sectionMaterial.color.copy(this.mortarMaterial.color);this.sectionMaterial.roughness=this.mortarMaterial.roughness;
  this.feedCore.geometry.setDrawRange(0,Math.floor(hoseFront*240)*10*6);this.feedCore.visible=hoseFront>0;
  this.outlet.visible=injecting&&hoseFront>=1;
  for(let i=0;i<this.flow.length;i++){
   const u=((clock*.45+i/this.flow.length)%1+1)%1,o=this.flow[i];o.visible=injecting&&u<hoseFront-.012;
   const tangent=this.feedCurve.getTangentAt(u),radial=V(0,0,1).cross(tangent).normalize().applyAxisAngle(tangent,i*2.4);
   o.position.copy(this.feedCurve.getPointAt(u)).addScaledVector(radial,2.7);
  }
  this.waterActivity=this.options.infiltration===false?0:1-smooth(fill/.86);this.water.visible=this.waterActivity>.001;
  this.damp.visible=this.options.infiltration!==false&&fill<.62;
  // Sinter and stalactites sit on the old edge; round milling removes them.
  this.sinter.visible=this.damp.visible&&!(this.millingProgress?.outer>0);
  this.waterMaterial.opacity=.4*this.waterActivity;
  const runoffStrength=1-smooth(((shield?.press||0)-.9)/.1);this.runoffMaterial.opacity=.55*this.waterActivity*runoffStrength;this.dropMaterial.opacity=.42*this.waterActivity*runoffStrength;
  const poseKey=shield?[shield.x,shield.lift,shield.seal].join(','):'no-shield';
  if(poseKey!==this.waterPoseKey){
   this.waterPoseKey=poseKey;
   for(const s of this.streams){s.path=shieldWaterPath(this.R,s.start,s.edge,shield);s.curve=s.path.incoming;s.mesh.geometry.dispose();s.mesh.geometry=rivuletGeometry(s.curve,64,s.radius);if(s.path.runoff){s.runoffMesh.geometry.dispose();s.runoffMesh.geometry=rivuletGeometry(s.path.runoff,96,s.radius);}}
  }
  for(let i=0;i<this.streams.length;i++){
   const s=this.streams[i],a=this.waterActivity; s.mesh.visible=a> .035+i*.025;
   s.runoffMesh.visible=s.mesh.visible&&s.path.caught&&runoffStrength>.001;
  }
  // Drops form at the lip, detach at each stream's own rate and fall freely.
  // Their length follows the fall speed (a short exposure streak).
  const dripping=runoffStrength>.001&&this.waterActivity>.08,wrap=(x,m)=>((x%m)+m)%m;
  const floorAt=z=>this.flowWater?this.flowWater.y:-Math.sqrt(Math.max(1,this.R**2-z**2));
  const fallOf=s=>{const p=s.path.lip,drop=Math.max(1,p.y-floorAt(p.z));return{p,drop,T:Math.sqrt(2*drop/G)};};
  for(const d of this.drops){
   const s=this.streams[d.stream],{p,drop,T}=fallOf(s),cycle=8*s.interval,age=wrap(clock-d.index*s.interval,cycle);
   d.mesh.visible=dripping&&age<T;if(!d.mesh.visible)continue;
   const streak=Math.min(drop*.3,G*age*this.streakTime),r=Math.max(.38,s.radius*.72),y=p.y-.5*G*age*age;
   d.mesh.position.set(p.x+.3*Math.sin(d.index*2.1+d.stream),y+streak*.5,p.z+.3*Math.cos(d.index*1.7+d.stream));d.mesh.scale.set(r,r+streak*.5,r);
  }
  this.pendants.forEach((o,i)=>{
   const s=this.streams[i],grow=wrap(clock,s.interval)/s.interval,r=Math.max(.38,s.radius*.72)*(.5+.8*grow);
   o.visible=dripping;o.position.copy(s.path.lip).add(V(0,-r*(.6+.5*grow),0));o.scale.set(r,r*(1.05+.55*grow),r);
  });
  for(const d of this.splashDrops){
   const s=this.streams[d.stream],{p,drop,T}=fallOf(s),tau=wrap(clock-T,s.interval);
   const a=d.index/6*TAU+d.stream*.9,speed=(160+190*((d.index*7+d.stream)%5)/4)*(.7+.35*s.radius),vy=260+230*((d.index*3+d.stream)%4)/3;
   const x=p.x+Math.cos(a)*speed*tau,z=p.z+Math.sin(a)*speed*tau,y=floorAt(z)+vy*tau-.5*G*tau*tau;
   d.mesh.visible=dripping&&drop>25&&tau<.16&&y>floorAt(z);
   if(d.mesh.visible){const r=.3+.22*s.radius;d.mesh.position.set(x,y,z);d.mesh.scale.set(r,r*1.5,r);}
  }
  for(const d of this.waterTraces){const s=this.streams[d.stream];d.mesh.visible=s.runoffMesh.visible;if(d.mesh.visible)d.mesh.position.copy(s.path.runoff.getPointAt(wrap(clock*.9+d.phase,1)));}
  this.splash.children.forEach((o,i)=>{
   const s=this.streams[i],{p,drop,T}=fallOf(s),life=Math.min(.7,s.interval*.97),u=wrap(clock-T,s.interval)/life,floor=floorAt(p.z);
   const normal=this.flowWater?V(0,1,0):V(0,-floor,-p.z).normalize();
   o.visible=dripping&&drop>25&&u<1;o.position.set(p.x,floor,p.z).addScaledVector(normal,this.flowWater?.3:1.2);o.quaternion.setFromUnitVectors(V(0,0,1),normal);
   o.scale.setScalar(2.5+34*Math.sqrt(Math.min(1,u)));this.rippleMaterials[i].opacity=.5*(1-Math.min(1,u))*this.waterActivity;
  });
 }
 dispose(){this.texture.dispose();for(const pack of [this.pipeTextures,this.mortarTextures,this.soilTextures])for(const t of Object.values(pack))t.dispose();const materials=new Set();for(const root of [this.group,this.hoseGroup])root.traverse(o=>{if(o.isMesh)materials.add(o.material);});for(const m of materials)m.dispose();}
}
