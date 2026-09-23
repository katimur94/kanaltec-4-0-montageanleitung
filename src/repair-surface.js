import * as THREE from 'three';
import {ports,passage} from './bladder.js';
const TAU=Math.PI*2;

function hash(x,y){let n=Math.imul(x+971,374761393)^Math.imul(y+173,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
// Periodic gradient noise (tileable), quintic fade: no blocky value-noise grid.
function gnoise(x,y,px,seed=0,py=px){
 const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,f=t=>t*t*t*(t*(t*6-15)+10);
 const g=(a,b,dx,dy)=>{const h=hash(((a%px)+px)%px+seed*131,((b%py)+py)%py+seed*57)*TAU;return Math.cos(h)*dx+Math.sin(h)*dy;};
 const u=f(fx),v=f(fy),n00=g(ix,iy,fx,fy),n10=g(ix+1,iy,fx-1,fy),n01=g(ix,iy+1,fx,fy-1),n11=g(ix+1,iy+1,fx-1,fy-1);
 return THREE.MathUtils.lerp(THREE.MathUtils.lerp(n00,n10,u),THREE.MathUtils.lerp(n01,n11,u),v)*1.4;
}
function fbm(x,y,base,octaves,seed=0,stretch=1){let s=0,a=.5,n=0;for(let o=0;o<octaves;o++){const p=base<<o,q=p*stretch;s+=a*gnoise(x*p,y*q,p,seed+o,q);n+=a;a*=.5;}return s/n;}
// Generated once per kind and shared through clones (identical data, own settings).
const textureCache=new Map();
export function surfaceTextures(kind){
 if(!textureCache.has(kind)){
  const size=kind==='pipe'?768:512,rgb=new Uint8Array(size*size*4),height=new Uint8Array(size*size*4),rough=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const u=x/size,v=y/size,i=(y*size+x)*4,g=hash(x,y);
   let c,h,r,tint=[1,1,1];
   if(kind==='pipe'){
    // Salt-glazed vitrified clay: calm mottling, fine speckles, orange-peel glaze,
    // faint longitudinal extrusion streaks and a few darker deposits.
    const low=fbm(u,v,3,3,1),mid=fbm(u,v,12,3,2),fine=fbm(u,v,64,2,3),streak=fbm(u,v,2,3,4,8),dep=Math.max(0,fbm(u,v,5,4,5)-.18);
    c=.66+.09*low+.05*mid+.05*streak-.22*dep+(g>.992?-.18:g<.004?.12:0);h=.5+.28*fine+.12*mid-(g>.992?.3:0);r=.36+.18*mid+.3*dep+.08*fine;
   }else if(kind==='soil'){
    const low=fbm(u,v,4,4,11),mid=fbm(u,v,18,3,12),grain=fbm(u,v,80,2,13);
    c=.48+.2*low+.14*mid+.1*grain+(g>.985?.2:g<.01?-.2:0);h=.5+.3*grain+.2*mid;r=.86+.1*mid;tint=[1,.88,.7];
   }else{
    // Injection mortar: fine sand grains, small air pores, slight trowel waves.
    const low=fbm(u,v,4,3,21),mid=fbm(u,v,20,3,22),grain=fbm(u,v,110,2,23);
    c=.76+.07*low+.06*mid+.06*grain+(g>.993?-.3:0);h=.5+.3*grain+.15*mid-(g>.993?.45:0);r=.8+.12*mid;
   }
   const C=Math.round(255*THREE.MathUtils.clamp(c,0,1)),H=Math.round(255*THREE.MathUtils.clamp(h,0,1)),Rr=Math.round(255*THREE.MathUtils.clamp(r,0,1));
   rgb.set([Math.round(C*tint[0]),Math.round(C*tint[1]),Math.round(C*tint[2]),255],i);height.set([H,H,H,255],i);rough.set([Rr,Rr,Rr,255],i);
  }
  const tex=data=>{const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t;};
  textureCache.set(kind,{map:tex(rgb),bumpMap:tex(height),roughnessMap:tex(rough)});
 }
 const shared=textureCache.get(kind),out={};
 // Pipe UVs are 120 mm per unit; a 400 mm tile hides any visible repetition.
 for(const [k,t] of Object.entries(shared)){const c=t.clone();c.needsUpdate=true;if(kind==='pipe')c.repeat.set(.3,.3);out[k]=c;}
 return out;
}

// Sensor ring and the smaller, closed injection mark. Positive depth is into
// the mortar, away from the sewer lumen; neither detail creates an obstruction.
export const imprints=[
 {key:'sensor',x:ports.sensorX,z:0,r:12.15,rings:[[12.15,0],[11.3,.35],[10.5,1.45],[9.6,.65],[9,2.5],[0,2.5]]},
 {key:'inlet',x:ports.inletX,z:0,r:ports.inletRadius+.5,rings:[[7.5,0],[6.9,1.1],[5.65,1.1],[5.3,.25],[0,.25]].map(([r,d])=>[r*(ports.inletRadius+.5)/7.5,d])}
];
export function mouldY(R,z){return Math.sqrt(Math.max(0,R*R-z*z));}

// The exposed inner skin is a separate, finely tessellated curved casting.
// Exact circular cutouts accept the negative impressions instead of decals.
export function mouldSurface(R,contour,material,closed=false,offsetX=0){
 const marks=imprints.map(mark=>({...mark,x:mark.x+offsetX}));
 const outer=[];for(let i=0;i<160;i++){const [x,arc]=contour(i/160*TAU);outer.push(new THREE.Vector2(x,R*Math.sin(arc/R)));}
 const holes=[...(closed?[]:[{x:0,z:0,r:passage.radius}]),...marks].map(p=>Array.from({length:80},(_,i)=>new THREE.Vector2(p.x+p.r*Math.cos(-i/80*TAU),p.z+p.r*Math.sin(-i/80*TAU))));
 const triangles=THREE.ShapeUtils.triangulateShape(outer,holes),points=[...outer,...holes.flat()],positions=[],uv=[];
 function vert(p,depth=0){positions.push(p.x,mouldY(R,p.y)+depth,p.y);uv.push(p.x/80,p.y/80);}
 function refine(a,b,c,level=0){
  if(level<6&&Math.max(a.distanceToSquared(b),b.distanceToSquared(c),c.distanceToSquared(a))>36){const ab=a.clone().add(b).multiplyScalar(.5),bc=b.clone().add(c).multiplyScalar(.5),ca=c.clone().add(a).multiplyScalar(.5);refine(a,ab,ca,level+1);refine(ab,b,bc,level+1);refine(ca,bc,c,level+1);refine(ab,bc,ca,level+1);}
  else {vert(a);vert(b);vert(c);}
 }
 for(const t of triangles)refine(...t.map(i=>points[i]));
 const mesh=(pos,uvs)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(pos.length).fill(1),3));g.computeVertexNormals();return new THREE.Mesh(g,material);};
 const group=new THREE.Group(),skin=mesh(positions,uv),shade=skin.geometry.attributes.color;
 // Slightly cloudy mortar instead of a uniformly tinted, artificial surface.
 for(let i=0;i<shade.count;i++){const x=positions[i*3],z=positions[i*3+2],v=.9+.05*Math.sin(x*.061+z*.043+1.3)+.035*Math.sin(x*.17-z*.21)+.02*Math.sin(x*.43+z*.37);shade.setXYZ(i,v,v,v*.99);}
 group.add(skin);
 for(const mark of marks){
  const p=[],u=[];
  const at=(r,a,d)=>[mark.x+r*Math.cos(a),mouldY(R,mark.z+r*Math.sin(a))+d,mark.z+r*Math.sin(a)];
  const put=v=>{p.push(...v);u.push(v[0]/80,v[2]/80);};
  for(let j=0;j<mark.rings.length-1;j++)for(let i=0;i<96;i++){
   const a=i/96*TAU,b=(i+1)/96*TAU,[r0,d0]=mark.rings[j],[r1,d1]=mark.rings[j+1];
   const v0=at(r0,a,d0),v1=at(r0,b,d0),v2=at(r1,a,d1),v3=at(r1,b,d1);for(const v of [v0,v2,v1,v1,v2,v3])put(v);
  }
  const o=mesh(p,u),color=o.geometry.attributes.color;
  for(let i=0;i<p.length/3;i++){const depth=p[i*3+1]-mouldY(R,p[i*3+2]),shade=1-.2*Math.min(1,depth/1.2);color.setXYZ(i,shade,shade,shade);}
  o.userData.imprint=mark;group.add(o);
 }
 group.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});return group;
}
