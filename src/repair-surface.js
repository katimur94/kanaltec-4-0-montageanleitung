import * as THREE from 'three';
import {ports,passage} from './bladder.js';
const TAU=Math.PI*2;

function hash(x,y){let n=Math.imul(x+971,374761393)^Math.imul(y+173,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
function noise(x,y,period){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,s=fx*fx*(3-2*fx),t=fy*fy*(3-2*fy);const h=(a,b)=>hash((a+period)%period,(b+period)%period);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(h(ix,iy),h(ix+1,iy),s),THREE.MathUtils.lerp(h(ix,iy+1),h(ix+1,iy+1),s),t);}
export function surfaceTextures(kind){
 const size=384,rgb=new Uint8Array(size*size*4),height=new Uint8Array(size*size*4),rough=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=(y*size+x)*4,a=noise(x/size*5,y/size*5,5),b=noise(x/size*29,y/size*29,29),g=hash(x,y),pore=g>.994? .52:1;
  const mottling=kind==='pipe'?.50+.25*a+.20*b:.73+.12*a+.11*b;
  const c=Math.round(255*mottling*pore),h=Math.round(80+50*b+48*g-(g>.994?60:0)),r=Math.round(kind==='pipe'?115+85*a:190+52*b);
  rgb.set([c,c,c,255],i);height.set([h,h,h,255],i);rough.set([r,r,r,255],i);
 }
 const tex=data=>{const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;};
 return {map:tex(rgb),bumpMap:tex(height),roughnessMap:tex(rough)};
}

// Sensor ring and the smaller, closed injection mark. Positive depth is into
// the mortar, away from the sewer lumen; neither detail creates an obstruction.
export const imprints=[
 {key:'sensor',x:ports.sensorX,z:0,r:12.15,rings:[[12.15,0],[11.3,.35],[10.5,1.45],[9.6,.65],[9,2.5],[0,2.5]]},
 {key:'inlet',x:ports.inletX,z:0,r:7.5,rings:[[7.5,0],[6.9,1.1],[5.65,1.1],[5.3,.25],[0,.25]]}
];
export function mouldY(R,z){return Math.sqrt(Math.max(0,R*R-z*z));}

// The exposed inner skin is a separate, finely tessellated curved casting.
// Exact circular cutouts accept the negative impressions instead of decals.
export function mouldSurface(R,contour,material){
 const outer=[];for(let i=0;i<160;i++){const [x,arc]=contour(i/160*TAU);outer.push(new THREE.Vector2(x,R*Math.sin(arc/R)));}
 const holes=[{x:0,z:0,r:passage.radius},...imprints].map(p=>Array.from({length:80},(_,i)=>new THREE.Vector2(p.x+p.r*Math.cos(-i/80*TAU),p.z+p.r*Math.sin(-i/80*TAU))));
 const triangles=THREE.ShapeUtils.triangulateShape(outer,holes),points=[...outer,...holes.flat()],positions=[],uv=[];
 function vert(p,depth=0){positions.push(p.x,mouldY(R,p.y)+depth,p.y);uv.push(p.x/80,p.y/80);}
 function refine(a,b,c,level=0){
  if(level<6&&Math.max(a.distanceToSquared(b),b.distanceToSquared(c),c.distanceToSquared(a))>36){const ab=a.clone().add(b).multiplyScalar(.5),bc=b.clone().add(c).multiplyScalar(.5),ca=c.clone().add(a).multiplyScalar(.5);refine(a,ab,ca,level+1);refine(ab,b,bc,level+1);refine(ca,bc,c,level+1);refine(ab,bc,ca,level+1);}
  else {vert(a);vert(b);vert(c);}
 }
 for(const t of triangles)refine(...t.map(i=>points[i]));
 const mesh=(pos,uvs)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(pos.length).fill(1),3));g.computeVertexNormals();return new THREE.Mesh(g,material);};
 const group=new THREE.Group();group.add(mesh(positions,uv));
 for(const mark of imprints){
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
