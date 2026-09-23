import * as THREE from 'three';
import {passage} from './bladder.js';
const TAU=Math.PI*2,segments=128,rows=72;
const clamp=x=>THREE.MathUtils.clamp(x,0,1);
export function soilEnvelope(a,h){
 return 182+139*Math.pow(Math.max(0,Math.sin(Math.PI*h)),.64)+18*Math.sin(3*a+h*8)+9*Math.sin(11*a-h*19)+5*Math.cos(23*a+h*37);
}
export function soilHeight(R,a,h,side=1){
 return R+20+250*h+(side?.95:.4)*(h*(22*Math.sin(a*3+.7)+13*Math.cos(a*5)) + Math.sin(Math.PI*h)*5*Math.sin(a*9+h*23));
}
// A local bedding washout: widest below the socket, pinching out upwards.
// Dimensions are visual assumptions informed by damage photographs.
export function soilCavityRadius(a,h,options={}){
 if(options.kind&&options.kind!=='open'){
  const base=options.kind==='pipe'?0:passage.radius+passage.wall+.15;
  return base+Math.pow(Math.max(0,1-h/.76),.82)*(options.cavity==='local'?30:115)*(1+.2*Math.cos(a-.65)+.09*Math.sin(a*3+h*9));
 }
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
export function groundGeometry(R,fill=1,soil=false,section=false,options={}){
 const positions=[],uv=[],indices=[],colors=[],stride=segments+1,layer=(rows+1)*stride;
 const progress=clamp(fill),inner=options.kind==='pipe'?0:passage.radius+passage.wall+.15;
 for(let side=0;side<2;side++)for(let j=0;j<=rows;j++)for(let i=0;i<=segments;i++){
  const a=i/segments*TAU,h=j/rows*(soil?1:progress);
  let y=soil?soilHeight(R,a,h,side):R+8+h*218;
  const envelope=soil?soilEnvelope(a,h):groundGroutProfile(a,h);
  const r=side?THREE.MathUtils.lerp(inner,envelope,soil?1:progress):(soil?soilCavityRadius(a,h,options):inner);
  // The roof of a pipe-hole cavity converges to one axis, without angular fins.
  if(soil&&!side&&options.kind==='pipe')y=THREE.MathUtils.lerp(R+20+250*h,y,Math.min(1,r/20));
  const x=r*Math.cos(a),z=r*Math.sin(a);positions.push(x,y,z);uv.push(a*3,y/85);
  const strata=.84+.12*Math.sin(h*41+.9*Math.sin(a*3))+.06*Math.cos(h*103+a*9);
  const shade=soil?(!side&&!section?.46+.15*h+.08*Math.sin(a*7+h*19):strata):1;colors.push(shade,shade*(soil?.94:1),shade*(soil?.84:1));
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
 constructor(R,soilTextures,mortarTextures,options={}){
  this.options=options;this.R=R;this.group=new THREE.Group();this.group.name='Erdreich mit tief verpresstem Injektionsmörtel';
  this.soilMaterial=new THREE.MeshStandardMaterial({color:'#3d2a19',...soilTextures,bumpScale:1.6,roughness:.88,vertexColors:true,side:THREE.DoubleSide});
  this.soilSectionMaterial=this.soilMaterial.clone();this.soilSectionMaterial.color.set('#48301d');
  this.groutMaterial=new THREE.MeshStandardMaterial({color:'#686963',...mortarTextures,bumpScale:1.1,roughness:.9,side:THREE.DoubleSide});
  this.groutSectionMaterial=this.groutMaterial.clone();
  this.soil=new THREE.Mesh(groundGeometry(R,1,true,false,options),this.soilMaterial);
  this.soilSection=new THREE.Mesh(groundGeometry(R,1,true,true,options),this.soilSectionMaterial);
  this.grout=new THREE.Mesh(groundGeometry(R,0,false,false,options),this.groutMaterial);
  this.groutSection=new THREE.Mesh(groundGeometry(R,0,false,true,options),this.groutSectionMaterial);
  this.group.add(this.soil,this.soilSection,this.grout,this.groutSection);
  // Visible grains remain embedded in the filled ground, rather than turning
  // the entire section into a smooth solid sleeve.
  const stoneMaterial=new THREE.MeshStandardMaterial({color:'#514432',roughness:1});
  this.stones=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),stoneMaterial,360);
  let seed=271826;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),dummy=new THREE.Object3D();
  for(let i=0;i<360;i++){
   const a=i%2?0:Math.PI,h=.04+random()*.92,t=random(),inner=soilCavityRadius(a,h,options)+9,outer=soilEnvelope(a,h)-12;
   dummy.position.set(Math.cos(a)*THREE.MathUtils.lerp(inner,outer,t),THREE.MathUtils.lerp(soilHeight(R,a,h,0),soilHeight(R,a,h,1),t),.85);
   const size=i%9===0?5+random()*7:1+random()*3;
   // Rounded pebbles, slightly tilted, instead of flat hexagon outlines.
   dummy.scale.set(size,size*(.35+random()*.6),.5+random());dummy.rotation.set((random()-.5)*.7,(random()-.5)*.7,random()*TAU);dummy.updateMatrix();this.stones.setMatrixAt(i,dummy.matrix);
   this.stones.setColorAt(i,new THREE.Color().setHSL(.08+random()*.06,.13+random()*.25,.25+random()*.34));
  }
  this.group.add(this.stones);
  // Clods and embedded gravel also break up the outside, not only the cut face.
  this.clodMaterial=new THREE.MeshStandardMaterial({color:'#66503a',roughness:1});
  this.clods=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),this.clodMaterial,420);
  for(let i=0;i<420;i++){
   const a=random()*TAU,h=.02+random()*.96,r=soilEnvelope(a,h)-1;
   dummy.position.set(r*Math.cos(a),soilHeight(R,a,h),r*Math.sin(a));
   const size=1.8+random()*5.5;dummy.scale.set(size,2+random()*7,size*.8);dummy.rotation.set(random()*3,random()*3,random()*3);dummy.updateMatrix();this.clods.setMatrixAt(i,dummy.matrix);
   this.clods.setColorAt(i,new THREE.Color().setHSL(.08+random()*.05,.2+random()*.2,.3+random()*.25));
  }
  this.group.add(this.clods);
  this.cut=false;this.lastFill=-1;this.update(0,false);
 }
 setCut(cut,plane){
  this.cut=cut;this.soilMaterial.clippingPlanes=this.groutMaterial.clippingPlanes=this.clodMaterial.clippingPlanes=cut?[plane]:null;
  this.soilSection.visible=this.stones.visible=cut;this.groutSection.visible=cut&&this.lastFill>0;
 }
 update(fill,cured){
  // First mortar arrives through the breakout, then spreads out/up into ground.
  const p=Math.floor(clamp((fill-.26)/.74)*64)/64;
  if(p!==this.lastFill){
   this.lastFill=p;
   for(const [mesh,section] of [[this.grout,false],[this.groutSection,true]]){mesh.geometry.dispose();mesh.geometry=groundGeometry(this.R,p,false,section,this.options);}
  }
  this.grout.visible=p>0;this.groutSection.visible=this.cut&&p>0;
  for(const material of [this.groutMaterial,this.groutSectionMaterial]){material.color.set(cured?'#555b54':'#454d43');material.roughness=cured?.96:.76;}
 }
}
