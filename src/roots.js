import * as THREE from 'three';

// Procedural root intrusion: roots in the soil reach the washed-out cavity
// around the connection, pass the gap between branch pipe and broken edge and
// hang into the sewer as dense, repeatedly branching root mats. Nothing grows
// out of the branch bore itself (user correction 23.09.2026). Shape, density and
// colours are illustrative, deterministic and identical after every direct seek.
const TAU=Math.PI*2;
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
function mulberry(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const palette={bark:new THREE.Color('#3b281b'),old:new THREE.Color('#6a4d34'),mid:new THREE.Color('#9b7b55'),young:new THREE.Color('#c9ad80'),tip:new THREE.Color('#efe3c6'),slime:new THREE.Color('#57563f')};

class Buffer{
 constructor(){this.p=[];this.n=[];this.c=[];this.s=[];this.ph=[];this.i=[];}
 get count(){return this.p.length/3;}
 geometry(){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));g.setAttribute('aSway',new THREE.Float32BufferAttribute(this.s,1));
  g.setAttribute('aPhase',new THREE.Float32BufferAttribute(this.ph,1));g.setIndex(this.i);g.computeBoundingSphere();return g;
 }
}

// Tapered tube along a polyline with parallel-transport frames (no twisting).
// sway: displacement weight at start/end; swayPhase: shared by a whole root tree
// so that side roots stay attached while the mat moves in the sewer air.
function tube(buf,pts,{r0,r1,sides,color,sway=[0,0],swayPhase=0,phase=0,knots=0}){
 const n=pts.length;if(n<2)return;
 const T=pts.map((p,i)=>pts[Math.min(n-1,i+1)].clone().sub(pts[Math.max(0,i-1)]).normalize());
 const N=Math.abs(T[0].y)<.9?V(0,1,0).cross(T[0]).normalize():V(1,0,0).cross(T[0]).normalize();
 const start=buf.count;let length=0;const lengths=[0];for(let i=1;i<n;i++){length+=pts[i].distanceTo(pts[i-1]);lengths.push(length);}
 const tmp=new THREE.Color();let r=r0;
 for(let i=0;i<n;i++){
  if(i){const axis=T[i-1].clone().cross(T[i]),s=axis.length();if(s>1e-6)N.applyAxisAngle(axis.divideScalar(s),Math.asin(Math.min(1,s)));}
  const B=T[i].clone().cross(N).normalize(),u=lengths[i]/Math.max(1e-6,length);
  // Slight nodes and irregular thickness, tapering hard into a fine tip.
  const node=knots?1+knots*Math.max(0,Math.sin(lengths[i]*.21+phase*3))**6:1;
  r=THREE.MathUtils.lerp(r0,r1,Math.pow(u,.72))*node*(1+.06*Math.sin(lengths[i]*.7+phase));
  color(u,tmp);
  const sw=THREE.MathUtils.lerp(sway[0],sway[1],u);
  for(let k=0;k<sides;k++){
   const a=k/sides*TAU+phase,nx=N.x*Math.cos(a)+B.x*Math.sin(a),ny=N.y*Math.cos(a)+B.y*Math.sin(a),nz=N.z*Math.cos(a)+B.z*Math.sin(a);
   buf.p.push(pts[i].x+nx*r,pts[i].y+ny*r,pts[i].z+nz*r);buf.n.push(nx,ny,nz);
   const shade=.9+.1*Math.cos(a*2+phase);buf.c.push(tmp.r*shade,tmp.g*shade,tmp.b*shade);buf.s.push(sw);buf.ph.push(swayPhase);
  }
 }
 for(let i=0;i<n-1;i++)for(let k=0;k<sides;k++){const a=start+i*sides+k,b=start+i*sides+(k+1)%sides,c=a+sides,d=b+sides;buf.i.push(a,b,c,b,d,c);}
 // Closed, pointed tip.
 const tip=pts[n-1].clone().addScaledVector(T[n-1],r*1.8+.15),t=buf.count;buf.p.push(tip.x,tip.y,tip.z);buf.n.push(T[n-1].x,T[n-1].y,T[n-1].z);color(1,tmp);buf.c.push(tmp.r,tmp.g,tmp.b);buf.s.push(sway[1]);buf.ph.push(swayPhase);
 for(let k=0;k<sides;k++)buf.i.push(start+(n-1)*sides+k,start+(n-1)*sides+(k+1)%sides,t);
 // Closed base as well, so no open tube end is ever visible.
 const base=pts[0].clone().addScaledVector(T[0],-r0*.6),bi=buf.count;buf.p.push(base.x,base.y,base.z);buf.n.push(-T[0].x,-T[0].y,-T[0].z);color(0,tmp);buf.c.push(tmp.r,tmp.g,tmp.b);buf.s.push(sway[0]);buf.ph.push(swayPhase);
 for(let k=0;k<sides;k++)buf.i.push(start+(k+1)%sides,start+k,bi);
}

export class RootSystem{
 constructor(R,{branchRadius=40,branchWall=12,projection=36,seed=4711,edge=()=>80}={}){
  this.R=R;this.group=new THREE.Group();this.group.name='Wurzeleinwuchs im Kanal';this.soilGroup=new THREE.Group();this.soilGroup.name='Wurzeln im Erdreich';
  const rand=mulberry(seed),range=(a,b)=>a+(b-a)*rand(),unit=()=>{const z=range(-1,1),a=range(0,TAU),s=Math.sqrt(1-z*z);return V(s*Math.cos(a),z,s*Math.sin(a));};
  const inner=new Buffer(),soil=new Buffer(),fine=new Buffer();
  const outer=branchRadius+branchWall,mouth=R-projection,hang=THREE.MathUtils.clamp(.55*R,80,170);
  // Each strand bundles below its own exit point and trails slightly downstream (+x).
  const axis=(y,anchor)=>V(anchor.x+.2*(mouth-y),y,anchor.z+.04*(mouth-y));
  const inPipe=p=>p.y<R+2;
  function constrain(p){
   if(inPipe(p)){const q=Math.hypot(p.y,p.z);if(q>R-2.5){p.y*=(R-2.5)/q;p.z*=(R-2.5)/q;}}
   // Stay outside the branch pipe (wall and bore) along the projecting part.
   const rr=Math.hypot(p.x,p.z);
   if(p.y>mouth-1&&rr<outer+2){const s=(outer+2)/Math.max(rr,1e-3);p.x*=s;p.z*=s;}
   // Crossing the main pipe wall only through the opening of the breakout.
   if(p.y>R-4&&p.y<R+22){const phi=Math.atan2(p.z,p.x),limit=edge(phi)-2.5;if(rr>limit){const s=limit/rr;p.x*=s;p.z*=s;}}
   return p;
  }
  // Growth walk: gravity for flexible roots, wandering, and bundling in the pipe.
  function walk(start,dir,length,step,{gravity=.25,wander=.35,bundle=0,stiff=.6,plane=null,spread=null,anchor=null}){
   const pts=[start.clone()],d=dir.clone().normalize(),p=start.clone(),off=spread||V(),home=anchor||start;
   for(let s=0;s<length/step;s++){
    const g=inPipe(p)?gravity:gravity*.35;
    d.multiplyScalar(stiff).addScaledVector(unit(),wander*(1-stiff)).add(V(0,-g,0));
    // Each strand keeps its own place in a mop that flares slightly downwards.
    if(bundle&&inPipe(p)&&p.y<mouth+4){const flare=1+.9*THREE.MathUtils.clamp((mouth-p.y)/hang,0,1.2),toward=axis(p.y-step,home).addScaledVector(off,flare).sub(p);toward.y=0;d.addScaledVector(toward,bundle/Math.max(6,toward.length()));}
    if(plane!==null)d.z+=(plane-p.z)*.08;
    d.normalize();p.addScaledVector(d,step);constrain(p);pts.push(p.clone());
   }
   return pts;
  }
  const colorFor=(level,jitter,soilPart=false)=>(u,out)=>{
   const a=soilPart?palette.bark:level===0?palette.old:level===1?palette.mid:palette.young;
   const b=soilPart?palette.old:level<2?palette.young:palette.tip;
   out.copy(a).lerp(b,Math.pow(u,1.6));out.lerp(palette.slime,.14*jitter);out.multiplyScalar(.86+.26*jitter);
  };
  const lerpSway=(s,u)=>THREE.MathUtils.lerp(s[0],s[1],u);
  // Fibrous root hairs make the mat read as a living, felted mass.
  const hairs=(pts,count,level,sway,swayPhase)=>{
   for(let h=0;h<count;h++){
    const i=1+Math.floor(rand()*(pts.length-2)),p=pts[i],d=unit().add(V(0,-.8,0)).normalize();
    const len=range(2.5,level>2?7:11),q=[p.clone()],steps=3,s=lerpSway(sway,i/(pts.length-1));
    for(let k=1;k<=steps;k++){d.add(V(0,-.25,0)).addScaledVector(unit(),.3).normalize();q.push(q[k-1].clone().addScaledVector(d,len/steps));}
    const j=rand();tube(fine,q,{r0:range(.13,.22),r1:.05,sides:3,color:(u,o)=>o.copy(palette.young).lerp(palette.tip,u).multiplyScalar(.88+.22*j),sway:[s,s+.06],swayPhase,phase:range(0,TAU)});
   }
  };
  // Recursive branching of the hanging mat.
  const branch=(pts,r,level,sway,swayPhase,spread,anchor)=>{
   const children=[7,3,2][level]||0;
   for(let c=0;c<children-(level?Math.floor(rand()*1.6):0);c++){
    const u=range(.12,.85),i=Math.max(1,Math.floor(u*(pts.length-1))),p=pts[i];
    const tangent=pts[Math.min(pts.length-1,i+1)].clone().sub(pts[i-1]).normalize();
    const dir=tangent.clone().applyAxisAngle(unit(),range(.45,1.15)).add(V(0,-.35,0));
    const rest=(1-u)*(pts.length-1)*2;
    const len=Math.max(6,rest*range(.35,.75)),cr=Math.max(.16,r*range(.42,.62));
    const q=walk(p,dir,len,level>1?1.5:2.1,{gravity:level>1?.34:.26,wander:.6,bundle:level<2?.28:.12,stiff:.55,spread:spread?spread.clone().add(V(range(-9,9),0,range(-9,9))):null,anchor});
    const s0=lerpSway(sway,u),s=[s0,s0+.35];
    tube(inner,q,{r0:cr,r1:Math.max(.07,cr*.18),sides:level>1?4:5,color:colorFor(level+1,rand()),sway:s,swayPhase,phase:range(0,TAU),knots:level<2?.12:0});
    hairs(q,Math.floor(len/(level?1.7:2.6)),level+1,s,swayPhase);
    branch(q,cr,level+1,s,swayPhase,spread,anchor);
   }
  };
  // (1) Primary roots from the washed-out cavity around the connection. They
  // leave through the gap between branch pipe and broken edge (mostly beside
  // the branch along the sewer) and spread into hanging mats around it.
  let placed=0;
  for(let tries=0;placed<26&&tries<400;tries++){
   const phi=(rand()<.5?0:Math.PI)+range(-.75,.75),room=edge(phi)-outer;
   if(room<9)continue;
   const rho=outer+3+range(.1,.85)*(room-6),dir=V(Math.cos(phi),0,Math.sin(phi));
   const exit=dir.clone().multiplyScalar(rho),start=exit.clone().add(V(range(-5,5),R+range(22,70),range(-5,5)));
   const spread=dir.clone().multiplyScalar(range(6,26)).add(V(range(-8,8),0,range(-8,8)));
   const len=hang*range(.45,1.02)+(start.y-R)+range(0,25),r0=range(1.2,2.6),swayPhase=range(0,TAU);
   const pts=walk(start,V(range(-.2,.2),-1,range(-.2,.2)),len,2.4,{gravity:.22,wander:.45,bundle:.45,stiff:.62,spread,anchor:exit});
   tube(inner,pts,{r0,r1:.12,sides:6,color:colorFor(0,rand()),sway:[0,.9],swayPhase,phase:range(0,TAU),knots:.15});
   hairs(pts,Math.floor(len/3),1,[0,.9],swayPhase);branch(pts,r0,0,[0,.9],swayPhase,spread,exit);placed++;
  }
  // (2) Soil roots: thick, bark-coloured, lying in the displayed section plane,
  // entering the washed-out cavity and continuing through the gap into the pipe.
  const soilSources=[[-265,R+215,-1],[-190,R+262,-1],[-120,R+238,-1],[140,R+250,1],[235,R+205,1],[300,R+150,1],[-310,R+120,-1]];
  for(const [sx,sy,side] of soilSources){
   const r0=range(3.2,5.4),zc=-r0*.35,start=V(sx,sy,zc),target=V(side*range(60,78),R+30,zc);
   const pts=[start.clone()],p=start.clone(),d=target.clone().sub(p).normalize();
   while(p.distanceTo(target)>8&&pts.length<260){const steer=THREE.MathUtils.clamp(60/p.distanceTo(target),.25,1.2);d.addScaledVector(target.clone().sub(p).normalize(),steer).addScaledVector(unit(),.2);d.z*=.2;d.normalize();p.addScaledVector(d,4);p.z=THREE.MathUtils.lerp(p.z,zc,.3);pts.push(p.clone());}
   // Down along the outside of the branch pipe and through the joint gap.
   const down=walk(p,V(-side*.15,-1,range(-.1,.1)),hang*range(.45,.8)+(p.y-R),2.4,{gravity:.25,wander:.3,bundle:.35,stiff:.7,plane:zc});
   const all=pts.concat(down.slice(1)),split=all.findIndex(q=>q.y<R+14);
   const phase=range(0,TAU),jit=rand(),swayPhase=range(0,TAU);
   const soilPart=split>0?all.slice(0,split+1):all,pipePart=split>0?all.slice(split):[];
   const u0=soilPart.length/all.length,rSplit=THREE.MathUtils.lerp(r0,.9,u0);
   tube(soil,soilPart,{r0,r1:rSplit,sides:8,color:(u,o)=>colorFor(0,jit,true)(u*u0,o),phase,knots:.18});
   // Lateral fibres in the soil around the main root.
   for(let f=0;f<9&&soilPart.length>6;f++){const i=2+Math.floor(rand()*(soilPart.length-4)),q=walk(soilPart[i],unit().add(V(0,-.4,0)),range(18,60),3,{gravity:.1,wander:.6,stiff:.5,plane:-1});tube(soil,q,{r0:range(.6,1.3),r1:.15,sides:4,color:colorFor(1,rand(),true),phase:range(0,TAU)});}
   if(pipePart.length>1){
    tube(inner,pipePart,{r0:rSplit,r1:.14,sides:6,color:colorFor(0,jit),sway:[0,.8],swayPhase,phase,knots:.12});
    hairs(pipePart,Math.floor(pipePart.length*.6),1,[0,.8],swayPhase);branch(pipePart,Math.min(2,rSplit),0,[0,.8],swayPhase,V(Math.sign(pipePart[0].x)*12,0,0),V(pipePart[0].x,0,pipePart[0].z));
   }
  }
  // Uniforms shared by every root material (cut, sway and fresh cut ends).
  this.uniforms={uCutY:{value:-1e6},uCutFrontX:{value:1e6},uClock:{value:0},uSway:{value:1.4},uCutColor:{value:new THREE.Color('#efe4c8')}};
  const make=(rough,sheen,key)=>{
   const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:rough,metalness:0,envMapIntensity:sheen,side:THREE.DoubleSide});
   m.onBeforeCompile=s=>{
    Object.assign(s.uniforms,this.uniforms);
    s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute float aSway;attribute float aPhase;uniform float uClock,uSway;varying vec3 vRootPos;')
     .replace('#include <begin_vertex>','#include <begin_vertex>\nfloat sw=aSway*aSway*uSway;transformed.x+=sw*(sin(uClock*1.7+aPhase)+.35*sin(uClock*3.9+aPhase*1.7));transformed.z+=sw*.7*cos(uClock*1.3+aPhase*1.3);vRootPos=transformed;');
    s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform float uCutY,uCutFrontX;uniform vec3 uCutColor;varying vec3 vRootPos;')
     .replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nfloat jag=fract(sin(dot(floor(vRootPos.xz*.45),vec2(12.9898,78.233)))*43758.5453);if(vRootPos.y<uCutY+jag*5.0&&vRootPos.x<uCutFrontX)discard;')
     .replace('#include <color_fragment>','#include <color_fragment>\nif(!gl_FrontFacing)diffuseColor.rgb=uCutColor;');
   };
   m.customProgramCacheKey=()=>'kanaltec-roots-'+key;return m;
  };
  this.material=make(.58,.6,'mat');this.soilMaterial=make(.9,.25,'soil');
  const mesh=(buf,m)=>{const o=new THREE.Mesh(buf.geometry(),m);o.castShadow=false;o.receiveShadow=true;o.frustumCulled=false;return o;};
  this.inner=mesh(inner,this.material);this.fine=mesh(fine,this.material);this.soil=mesh(soil,this.soilMaterial);
  this.group.add(this.inner,this.fine);this.soilGroup.add(this.soil);
  this.stats={inner:inner.count,fine:fine.count,soil:soil.count};
 }
 // Everything below y (plus a ragged margin) and behind frontX has been milled.
 setCut(y,frontX=1e6){this.uniforms.uCutY.value=y;this.uniforms.uCutFrontX.value=frontX;}
 setClock(t){this.uniforms.uClock.value=t;}
 setClipping(planes){this.material.clippingPlanes=this.soilMaterial.clippingPlanes=planes;}
 dispose(){for(const o of [this.inner,this.fine,this.soil])o.geometry.dispose();this.material.dispose();this.soilMaterial.dispose();}
}
