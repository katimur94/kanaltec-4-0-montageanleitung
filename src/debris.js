import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Milled material: clay pieces and cut root tufts fall from the cutter, land
// in the dry-weather flow and drift away downstream (+x); fine dust hangs
// briefly around the head. Ballistic paths in real seconds (mm, 9.81 m/s²).
// Each piece remembers where it left the tool, so it does not follow the head.
// Illustrative, not a cutting or sediment-transport simulation.
const TAU=Math.PI*2,G=9810;
function hash(i,k){let n=Math.imul(i+1013,374761393)^Math.imul(k+71,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;}

// A small tuft of cut roots: a few drooping, tapering strands from one knot.
function tuftGeometry(){
 const parts=[],tan=new THREE.Color('#7a5c3e'),tip=new THREE.Color('#c9b08a');
 for(let k=0;k<7;k++){
  const a=k/7*TAU+hash(k,3),len=10+22*hash(k,5),pts=[];
  for(let j=0;j<=5;j++){const u=j/5;pts.push(new THREE.Vector3(Math.cos(a)*len*u*.7,-len*u*u*.8+len*u*.25,Math.sin(a)*len*u*.7).add(new THREE.Vector3(Math.sin(u*7+k)*1.5,0,Math.cos(u*5+k)*1.5)));}
  const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),10,.55-.05*k/7,4,false),p=g.attributes.position,c=[];
  for(let i=0;i<p.count;i++){const u=Math.floor(i/5)/10,col=tan.clone().lerp(tip,u);c.push(col.r,col.g,col.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.deleteAttribute('uv');parts.push(g);
 }
 return mergeGeometries(parts);
}

export class MillingDebris{
 constructor(R,{chunks=110,clumps=16,dust=160,waterY=null}={}){
  this.R=R;this.waterY=waterY;this.flow=260;this.group=new THREE.Group();this.group.name='Fräsgut';
  const chunkGeo=new THREE.IcosahedronGeometry(1,1),p=chunkGeo.attributes.position;
  // Irregular, faceted shards rather than spheres.
  for(let i=0;i<p.count;i++){const s=.65+.7*hash(Math.round(p.getX(i)*97+p.getY(i)*31),Math.round(p.getZ(i)*53));p.setXYZ(i,p.getX(i)*s,p.getY(i)*s*.7,p.getZ(i)*s);}
  chunkGeo.computeVertexNormals();
  this.chunks=new THREE.InstancedMesh(chunkGeo,new THREE.MeshStandardMaterial({roughness:.8,metalness:0,envMapIntensity:.5,flatShading:true}),chunks);
  this.clumps=new THREE.InstancedMesh(tuftGeometry(),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.65,metalness:0,envMapIntensity:.5}),clumps);
  this.dust=new THREE.InstancedMesh(new THREE.SphereGeometry(1,6,4),new THREE.MeshStandardMaterial({color:'#b9a58b',roughness:1,transparent:true,opacity:.5,depthWrite:false}),dust);
  const clay=['#7b4a31','#5d3424','#8f5d40','#4a2a1d','#a57457','#6b5139'];
  for(let i=0;i<chunks;i++)this.chunks.setColorAt(i,new THREE.Color(clay[i%clay.length]).multiplyScalar(.85+.3*hash(i,9)));
  for(const m of [this.chunks,this.clumps,this.dust]){m.frustumCulled=false;m.castShadow=false;m.receiveShadow=m!==this.dust;this.group.add(m);}
  // Kept for film compatibility (sub-frame exposure); pieces rely on real motion blur.
  this.streak=0;this.spawn=new Map();this.dummy=new THREE.Object3D();this.group.visible=false;
 }
 floorAt(z){const invert=-Math.sqrt(Math.max(0,this.R*this.R-z*z));return this.waterY!==null?Math.max(invert,this.waterY):invert;}
 // pose: {point, cutY, rate 0..1, roots}; null hides everything.
 update(clock,pose){
  this.group.visible=!!pose;
  if(!pose){this.spawn.clear();return;}
  const d=this.dummy,water=this.waterY!==null,half=water?Math.sqrt(Math.max(0,this.R**2-this.waterY**2)):0;
  const hide=(mesh,i)=>{d.scale.setScalar(0);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);};
  const cycleOf=(i,kind,period)=>{const offset=hash(i,kind+3)*period,cycle=Math.floor((clock+offset)/period);return{cycle,age:clock+offset-cycle*period};};
  const remember=(i,kind,cycle,make)=>{const key=kind*10000+i;let s=this.spawn.get(key);if(!s||s.cycle!==cycle){s={cycle,...make()};this.spawn.set(key,s);}return s;};
  // Falling, landing and drifting piece; returns false when it has gone.
  const fly=(s,age,drift,sink)=>{
   const {o,v}=s,floor=this.floorAt(o.z),dy=o.y-floor,T=(v.y+Math.sqrt(v.y*v.y+2*G*Math.max(0,dy)))/G;
   if(age<T){d.position.set(o.x+v.x*age,o.y+v.y*age-.5*G*age*age,o.z+v.z*age);d.rotation.set(s.r.x+age*s.spin.x,s.r.y+age*s.spin.y,s.r.z+age*s.spin.z);return true;}
   const w=age-T,land=new THREE.Vector3(o.x+v.x*T,0,o.z+v.z*T);
   if(!water){d.position.set(land.x,this.floorAt(land.z)+.6,land.z);d.rotation.set(s.r.x,s.r.y,s.r.z);return w<drift;}
   // Swept towards the middle of the flow and carried downstream.
   // Settles on the far half of the flow, which stays visible in the cutaway.
   const zc=-half*(.25+.4*hash(Math.round(s.r.x*1000),7)),z=THREE.MathUtils.lerp(zc,THREE.MathUtils.clamp(land.z,-half*.85,half*.85),Math.exp(-w*2.2))+Math.sin(w*2.3+s.r.x)*2;
   d.position.set(land.x+this.flow*w*(1-Math.exp(-w*3))+4*Math.sin(w*1.7+s.r.y),this.waterY-sink(w),z);
   d.rotation.set(s.r.x+.3*Math.sin(w*2),s.r.y+w*.8,s.r.z);return w<drift;
  };
  for(let i=0;i<this.chunks.count;i++){
   const {cycle,age}=cycleOf(i,1,2.6+1.6*hash(i,7));
   const s=remember(i,1,cycle,()=>{
    const a=hash(i+cycle*13,11)*TAU,rim=22+8*hash(i,13),speed=120+300*hash(i+cycle,17);
    return{on:hash(i+cycle*7,5)<pose.rate,o:pose.point.clone().add(new THREE.Vector3(rim*Math.cos(a),-2,rim*Math.sin(a))),
     v:new THREE.Vector3(-Math.sin(a)*speed+Math.cos(a)*50,-30+120*hash(i,19),Math.cos(a)*speed+Math.sin(a)*50),
     r:new THREE.Vector3(hash(i,43)*TAU,hash(i,47)*TAU,hash(i,53)*TAU),spin:new THREE.Vector3(8+9*hash(i,59),6+7*hash(i,61),9*hash(i,67))};
   });
   // Clay shards float for a moment, then sink out of sight.
   if(!s.on||!fly(s,age,1.9,w=>Math.min(6,w*w*3))){hide(this.chunks,i);continue;}
   const size=1.3+4.7*hash(i,23)**2;d.scale.set(size*(.8+.5*hash(i,29)),size*(.5+.4*hash(i,31)),size*(.7+.6*hash(i,37)));d.updateMatrix();this.chunks.setMatrixAt(i,d.matrix);
  }
  for(let i=0;i<this.clumps.count;i++){
   const {cycle,age}=cycleOf(i,2,3.2+1.8*hash(i,71));
   const s=remember(i,2,cycle,()=>{
    // Cut-off root ends drop from around the connection at the cutting height.
    const side=hash(i+cycle,73)<.5?-1:1,y=Number.isFinite(pose.cutY)&&pose.cutY>-1e5?pose.cutY-4:pose.point.y;
    return{on:pose.roots&&hash(i+cycle*5,79)<pose.rate*.9,o:new THREE.Vector3(side*(40+50*hash(i+cycle,83)),y,(hash(i+cycle,89)-.5)*70),
     v:new THREE.Vector3((hash(i,97)-.5)*80,-20,(hash(i,101)-.5)*80),r:new THREE.Vector3(hash(i,103)*TAU,hash(i,107)*TAU,hash(i,109)*TAU),spin:new THREE.Vector3(2+3*hash(i,113),1+2*hash(i,127),2*hash(i,131))};
   });
   // Roots float and are carried further before leaving the picture.
   if(!s.on||!fly(s,age,2.8,()=>.8)){hide(this.clumps,i);continue;}
   d.scale.setScalar(.55+.4*hash(i,137));d.updateMatrix();this.clumps.setMatrixAt(i,d.matrix);
  }
  for(let i=0;i<this.dust.count;i++){
   const period=.55+.6*hash(i,151),{cycle,age}=cycleOf(i,3,period);
   const s=remember(i,3,cycle,()=>{const a=hash(i+cycle,157)*TAU,e=hash(i+cycle,163)*2-1;return{on:hash(i+cycle*3,167)<pose.rate,o:pose.point.clone().add(new THREE.Vector3(26*Math.cos(a),-3+6*e,26*Math.sin(a))),v:new THREE.Vector3(Math.cos(a)*(60+140*hash(i,173)),20*e-10,Math.sin(a)*(60+140*hash(i,179)))};});
   if(!s.on){hide(this.dust,i);continue;}
   // Fine dust: slowed by the air, settles slowly, disperses.
   const drag=(1-Math.exp(-age*4))/4;d.position.set(s.o.x+s.v.x*drag+age*18,s.o.y+s.v.y*drag-60*age*age,s.o.z+s.v.z*drag);
   d.rotation.set(0,0,0);d.scale.setScalar((.35+.45*hash(i,181))*(1+age*1.5)*(1-age/period));d.updateMatrix();this.dust.setMatrixAt(i,d.matrix);
  }
  for(const m of [this.chunks,this.clumps,this.dust])m.instanceMatrix.needsUpdate=true;
 }
 setClipping(planes){for(const m of [this.chunks,this.clumps,this.dust])m.material.clippingPlanes=planes;}
 dispose(){for(const m of [this.chunks,this.clumps,this.dust]){m.geometry.dispose();m.material.dispose();}}
}
