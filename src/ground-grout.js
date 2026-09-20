import * as THREE from 'three';
import {passage} from './bladder.js';
const TAU=Math.PI*2,segments=128,rows=72;
const clamp=x=>THREE.MathUtils.clamp(x,0,1);
// A local bedding washout: widest below the socket, pinching out upwards.
// Dimensions are visual assumptions informed by damage photographs.
export function soilCavityRadius(a,h){
 const opening=Math.pow(Math.max(0,1-h/.7),.82);
 return passage.radius+passage.wall+.15+opening*(57+22*Math.cos(a-.65)+10*Math.sin(a*3+.4)+5*Math.sin(a*9+h*18));
}
// Illustrative spreading into the surrounding ground, not a specified injection
// radius or a soil/pressure simulation. The existing pipe bore stays untouched.
export function groundGroutProfile(a,h){
 const bulb=Math.pow(Math.max(0,Math.sin(Math.PI*h)),.72);
 const fingers=1+.13*Math.sin(a*5+h*7)+.075*Math.sin(a*11-h*13)+.045*Math.cos(a*19+h*21)+.045*Math.sin(h*57+a*13);
 return passage.radius+passage.wall+14+174*bulb*fingers;
}
export function groundGeometry(R,fill=1,soil=false,section=false){
 const positions=[],uv=[],indices=[],colors=[],stride=segments+1,layer=(rows+1)*stride;
 const progress=clamp(fill),inner=passage.radius+passage.wall+.15;
 for(let side=0;side<2;side++)for(let j=0;j<=rows;j++)for(let i=0;i<=segments;i++){
  const a=i/segments*TAU,h=j/rows*(soil?1:progress),y=R+(soil?20:8)+h*(soil?250:218);
  const envelope=soil?306*(1+.022*Math.sin(a*5)+.014*Math.cos(a*9)):groundGroutProfile(a,h);
  const r=side?THREE.MathUtils.lerp(inner,envelope,soil?1:progress):(soil?soilCavityRadius(a,h):inner);
  const x=r*Math.cos(a),z=r*Math.sin(a);positions.push(x,y,z);uv.push(a*3,y/85);
  const shade=soil&&!side&&!section?.46+.15*h+.08*Math.sin(a*7+h*19):1;colors.push(shade,shade,shade);
 }
 if(section){
  for(const i of [0,segments/2])for(let j=0;j<rows;j++){
   const a=j*stride+i,b=a+stride;indices.push(a,b,a+layer,b,b+layer,a+layer);
  }
  // Separate exposed faces prevent coplanar flicker between soil and grout.
  for(let i=0;i<positions.length;i+=3){positions[i+2]=soil?0:.35;uv[i/3*2]=positions[i]/85;uv[i/3*2+1]=positions[i+1]/85;}
 }else{
  for(let side=0;side<2;side++)for(let j=0;j<rows;j++)for(let i=0;i<segments;i++){
   const a=side*layer+j*stride+i,b=a+stride;indices.push(a,b,a+1,b,b+1,a+1);
  }
  for(const j of [0,rows])for(let i=0;i<segments;i++){
   const a=j*stride+i;
   // Planar UVs on end faces avoid radially stretched soil texture.
   for(const source of [a,a+1,a+layer,a+1,a+layer+1,a+layer]){
    const x=positions[source*3],y=positions[source*3+1],z=positions[source*3+2];
    indices.push(positions.length/3);positions.push(x,y,z);uv.push(x/85,z/85);colors.push(1,1,1);
   }
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}

export class GroundGrout{
 constructor(R,soilTextures,mortarTextures){
  this.R=R;this.group=new THREE.Group();this.group.name='Erdreich mit tief verpresstem Injektionsmörtel';
  this.soilMaterial=new THREE.MeshStandardMaterial({color:'#3d2a19',...soilTextures,bumpScale:1.6,roughness:.88,vertexColors:true,side:THREE.DoubleSide});
  this.soilSectionMaterial=this.soilMaterial.clone();this.soilSectionMaterial.color.set('#48301d');
  this.groutMaterial=new THREE.MeshStandardMaterial({color:'#686963',...mortarTextures,bumpScale:1.1,roughness:.9,side:THREE.DoubleSide});
  this.groutSectionMaterial=this.groutMaterial.clone();
  this.soil=new THREE.Mesh(groundGeometry(R,1,true),this.soilMaterial);
  this.soilSection=new THREE.Mesh(groundGeometry(R,1,true,true),this.soilSectionMaterial);
  this.grout=new THREE.Mesh(groundGeometry(R,0),this.groutMaterial);
  this.groutSection=new THREE.Mesh(groundGeometry(R,0,false,true),this.groutSectionMaterial);
  this.group.add(this.soil,this.soilSection,this.grout,this.groutSection);
  // Visible grains remain embedded in the filled ground, rather than turning
  // the entire section into a smooth solid sleeve.
  const stoneMaterial=new THREE.MeshStandardMaterial({color:'#514432',roughness:1});
  this.stones=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),stoneMaterial,132);
  let seed=271826;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),dummy=new THREE.Object3D();
  for(let i=0;i<132;i++){
   dummy.position.set((i%2?1:-1)*(61+random()*225),R+29+random()*230,.85);
   const boundary=soilCavityRadius(dummy.position.x<0?Math.PI:0,(dummy.position.y-R-20)/250)+8;
   if(Math.abs(dummy.position.x)<boundary)dummy.position.x=Math.sign(dummy.position.x)*(boundary+random()*20);
   dummy.scale.set(2+random()*6,1.4+random()*3.8,.6);dummy.rotation.set(0,0,random()*TAU);dummy.updateMatrix();this.stones.setMatrixAt(i,dummy.matrix);
  }
  this.group.add(this.stones);
  this.cut=false;this.lastFill=-1;this.update(0,false);
 }
 setCut(cut,plane){
  this.cut=cut;this.soilMaterial.clippingPlanes=this.groutMaterial.clippingPlanes=cut?[plane]:null;
  this.soilSection.visible=this.stones.visible=cut;this.groutSection.visible=cut&&this.lastFill>0;
 }
 update(fill,cured){
  // First mortar arrives through the breakout, then spreads out/up into ground.
  const p=Math.floor(clamp((fill-.26)/.74)*64)/64;
  if(p!==this.lastFill){
   this.lastFill=p;
   for(const [mesh,section] of [[this.grout,false],[this.groutSection,true]]){mesh.geometry.dispose();mesh.geometry=groundGeometry(this.R,p,false,section);}
  }
  this.grout.visible=p>0;this.groutSection.visible=this.cut&&p>0;
  for(const material of [this.groutMaterial,this.groutSectionMaterial]){material.color.set(cured?'#555b54':'#454d43');material.roughness=cured?.96:.76;}
 }
}
