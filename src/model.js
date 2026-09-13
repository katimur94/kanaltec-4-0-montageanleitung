import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {bom,families,PHASE} from './data.js';
import {BladderMechanism,ports,bladderMount} from './bladder.js';
import {RepairScene} from './repair.js';
import {Robot} from './robot.js';

const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const clamp=THREE.MathUtils.clamp;
const smooth=(x)=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const mat=(color,metalness=.7,roughness=.32)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
const palettes={metal:mat('#adb7bf'),darkMetal:mat('#6c7a83'),gold:mat('#c6ae42',.38,.36),rubber:mat('#191e23',.02,.66),bolt:mat('#75818c',.8,.22),black:mat('#202932',.35,.4),teal:mat('#26a6a0',.15,.35)};
const cached=new Map();
function geo(key,fn){if(!cached.has(key))cached.set(key,fn());return cached.get(key);}
function mesh(g,m,p=V(),r){const o=new THREE.Mesh(g,m);o.position.copy(p);if(r)o.rotation.set(...r);o.castShadow=true;o.receiveShadow=true;return o;}
function box(w,h,d,m,p=V()){return mesh(geo(`b${w},${h},${d}`,()=>new THREE.BoxGeometry(w,h,d)),m,p);}
function cyl(rad,len,m,p=V(),axis='y',sides=40){const o=mesh(geo(`c${rad},${len},${sides}`,()=>new THREE.CylinderGeometry(rad,rad,len,sides)),m,p);if(axis==='x')o.rotation.z=Math.PI/2;if(axis==='z')o.rotation.x=Math.PI/2;return o;}
function torus(rad,tube,m,p=V(),axis='y'){const o=mesh(geo(`t${rad},${tube}`,()=>new THREE.TorusGeometry(rad,tube,8,64)),m,p);if(axis==='y')o.rotation.x=Math.PI/2;if(axis==='x')o.rotation.y=Math.PI/2;return o;}
function tube(rad,inner,len,m,p=V(),axis='x'){
 const sh=new THREE.Shape();sh.absarc(0,0,rad,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,inner,0,Math.PI*2,true);sh.holes.push(hole);
 const ge=new THREE.ExtrudeGeometry(sh,{depth:len,bevelEnabled:false,curveSegments:32});ge.translate(0,0,-len/2);const o=mesh(ge,m,p);if(axis==='x')o.rotation.y=Math.PI/2;if(axis==='y')o.rotation.x=Math.PI/2;return o;
}
function plate(w,h,d,m,holes=[],corner=2,bevel=.45){
 const s=new THREE.Shape(),x=-w/2,y=-h/2,r=Math.min(corner,w/2,h/2);
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
 for(const [hx,hy,hr]of holes){const p=new THREE.Path();p.absarc(hx,hy,hr,0,Math.PI*2,true);s.holes.push(p);}
 const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1,curveSegments:12});g.translate(0,0,-d/2);return mesh(g,m);
}
function hingeBase(){
 // PDF pp.8/10: receiving block, topped by part 3; tube enters from +X.
 const g=new THREE.Group();
 const middle=plate(44,48,42,palettes.metal,[[0,12,11]],0,0);middle.rotation.y=Math.PI/2;middle.position.y=-12;g.add(middle);
 const lower=plate(42,16,44,palettes.metal,[[-10,0,2.3]],0,0);lower.position.y=-44;g.add(lower);
 const upper=plate(42,44,12,palettes.metal,[[-10,-12,2.7],[-10,12,2.7]],0,0);upper.rotation.x=-Math.PI/2;upper.position.y=18;g.add(upper);
 return g;
}
function hingeTop(){
 // Fixed horizontal leaf. The corner is a joint, not a welded L.
 const g=new THREE.Group();
 const top=plate(43.3,44,8,palettes.metal,[[-9.35,-12,3.2],[-9.35,12,3.2]],0,0);top.rotation.x=-Math.PI/2;top.position.set(-.65,28,0);g.add(top);
 for(const z of [-17.5,17.5])g.add(tube(4.5,3.1,9,palettes.metal,V(-25.5,28,z),'z'));
 return g;
}
function hingeFlap(){
 // Moving vertical leaf (part 2), replacing the incorrectly inferred flat links.
 const g=new THREE.Group();
 for(const [cy,height,holes]of [[20,8,[]],[-22,60,[[0,26,3.4],[0,-22,3.4]]]]){const front=plate(44,height,9,palettes.metal,holes,0,0);front.rotation.y=Math.PI/2;front.position.set(-25.5,cy,0);g.add(front);}
 const pivotBand=plate(9,8,44,palettes.metal,[[0,0,2.3]],0,0);pivotBand.position.set(-25.5,12,0);g.add(pivotBand);
 g.add(tube(4.5,3.1,25,palettes.metal,V(-25.5,28,0),'z'),box(9,2.8,25,palettes.metal,V(-25.5,23.4,0)));
 return g;
}
function tensionSpring(side){
 const a=V(-10,-44,side*23.95),b=V(-25.5,12,side*23.95),axis=b.clone().sub(a).normalize(),cross=V(-axis.y,axis.x,0),points=[];
 points.push(a.clone().addScaledVector(axis,3.5));
 for(let i=0;i<=384;i++){const t=i/384,angle=t*Math.PI*40,centre=a.clone().lerp(b,.13+.74*t);centre.z+=side*5;points.push(centre.addScaledVector(cross,3.1*Math.cos(angle)).add(V(0,0,3.1*Math.sin(angle))));}
 points.push(b.clone().addScaledVector(axis,-3.5));
 const g=new THREE.Group();g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),440,.75,8,false),palettes.bolt),torus(3.5,.75,palettes.bolt,a,'z'),torus(3.5,.75,palettes.bolt,b,'z'));
 g.userData.springEyes=[a.toArray(),b.toArray()];return g;
}
function toolMount(){
 // Stepped T section visible on the top face of part 10 in PDF p.10.
 const g=new THREE.Group();for(const [width,depth,x]of [[32,4,-10],[18,8,-4]]){const p=plate(width,84,depth,palettes.metal,[[0,-24,4.2],[0,24,4.2]],0,0);p.rotation.y=Math.PI/2;p.position.x=x;g.add(p);}return g;
}
function shell(rad,thick,length,halfAngle,holes=true,extraHoles=[],corner=38){
 // Triangulate the developed sheet (including true openings), then curve it.
 const width=2*rad*halfAngle,s=new THREE.Shape(),x=-length/2,y=-width/2,cr=Math.min(corner,length/2,width/2);
 s.moveTo(x+cr,y);s.lineTo(x+length-cr,y);s.quadraticCurveTo(x+length,y,x+length,y+cr);s.lineTo(x+length,y+width-cr);s.quadraticCurveTo(x+length,y+width,x+length-cr,y+width);s.lineTo(x+cr,y+width);s.quadraticCurveTo(x,y+width,x,y+width-cr);s.lineTo(x,y+cr);s.quadraticCurveTo(x,y,x+cr,y);
 // Only the outer shield has three separate ports. Carrier and sealing bladder
 // have one shared oval clearance (user description; PDF contour is obscured).
 if(holes==='oval'){const p=new THREE.Path();p.absellipse(0,0,90,42,0,Math.PI*2,true,0);s.holes.push(p);}
 else if(holes)for(const [hx,rr]of [[0,ports.opening],[ports.sensorX,ports.sensorRadius],[ports.inletX,ports.inletRadius]]){const p=new THREE.Path();p.absarc(hx,0,rr,0,Math.PI*2,true);s.holes.push(p);}
 for(const [hx,hy,rr]of extraHoles){const p=new THREE.Path();p.absarc(hx,hy,rr,0,Math.PI*2,true);s.holes.push(p);}
 const raw=new THREE.ExtrudeGeometry(s,{depth:thick,bevelEnabled:false,curveSegments:32,steps:1});
 // Subdivision prevents long planar triangles across the curved sheet.
 let triangles=[];const ps=raw.getAttribute('position');for(let i=0;i<ps.count;i+=3)triangles.push([V(ps.getX(i),ps.getY(i),ps.getZ(i)),V(ps.getX(i+1),ps.getY(i+1),ps.getZ(i+1)),V(ps.getX(i+2),ps.getY(i+2),ps.getZ(i+2))]);
 for(let k=0;k<(rad<30?6:5);k++){const next=[];for(const t of triangles){const [a,b,c]=t;const max=Math.max(a.distanceTo(b),b.distanceTo(c),c.distanceTo(a));if(max<(rad<30?3:25)){next.push(t);continue;}const ab=a.clone().add(b).multiplyScalar(.5),bc=b.clone().add(c).multiplyScalar(.5),ca=c.clone().add(a).multiplyScalar(.5);next.push([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]);}triangles=next;}
 const arr=[];for(const t of triangles)for(const p of t){const ang=p.y/rad,rr=rad+p.z;arr.push(p.x,rr*Math.cos(ang),rr*Math.sin(ang));}
 raw.dispose();const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));const welded=mergeVertices(g,.001);g.dispose();welded.computeVertexNormals();return welded;
}
function wheel(){const g=new THREE.Group();g.add(cyl(35,12,palettes.rubber,V(),'z'),cyl(11,13,palettes.darkMetal,V(),'z'),cyl(4,16,palettes.bolt,V(),'z'),torus(30,.7,palettes.black,V(0,0,6),'z'));return g;}
function bladderShaft(){
 // PDF pp. 4/9 plus user's description: one flat mounting face, rounded back.
 // Dimensions are reconstructed. The mounting pocket is blind, never through
 // the curved winding surface. Main body becomes world X -55..55 after assembly.
 // Assembly shifts the shaft by -13 and rotates it 180° about Y:
 // local X -13 therefore places the mounting opening at the shield centre X 0.
 const g=new THREE.Group(),r=17,flat=6.5,x0=-68,x1=42,holeX=-13,holeR=7.5,floor=-4;
 const alpha=Math.asin(flat/r),halfWidth=Math.sqrt(r*r-flat*flat),profile=[];
 for(let i=0;i<=96;i++){const a=Math.PI-alpha+i/96*(Math.PI+2*alpha);profile.push(new THREE.Vector2(r*Math.cos(a),r*Math.sin(a)));}
 const material=palettes.metal.clone();material.side=THREE.DoubleSide;
 const vertices=[],indices=[];
 for(const x of [x0,x1])for(const p of profile)vertices.push(x,p.y,p.x);
 for(let i=0;i<96;i++){const j=i+97;indices.push(i,j,i+1,j,j+1,i+1);}
 const curved=new THREE.BufferGeometry();curved.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));curved.setIndex(indices);curved.computeVertexNormals();g.add(mesh(curved,material));
 const endShape=new THREE.Shape(profile);endShape.closePath();
 for(const x of [x0,x1]){const end=new THREE.ShapeGeometry(endShape);end.rotateY(Math.PI/2);g.add(mesh(end,material,V(x,0,0)));}
 const face=new THREE.Shape();face.moveTo(x0,-halfWidth);face.lineTo(x1,-halfWidth);face.lineTo(x1,halfWidth);face.lineTo(x0,halfWidth);face.closePath();
 const opening=new THREE.Path();opening.absarc(holeX,0,holeR,0,Math.PI*2,true);face.holes.push(opening);
 const faceGeo=new THREE.ShapeGeometry(face,48);faceGeo.rotateX(-Math.PI/2);g.add(mesh(faceGeo,material,V(0,flat,0)));
 const wallMat=palettes.darkMetal.clone();wallMat.side=THREE.BackSide;
 g.add(mesh(new THREE.CylinderGeometry(holeR,holeR,flat-floor,48,1,true),wallMat,V(holeX,(flat+floor)/2,0)));
 const bottom=new THREE.CircleGeometry(holeR,48);bottom.rotateX(-Math.PI/2);g.add(mesh(bottom,palettes.darkMetal,V(holeX,floor,0)));
 // Female thread inside the blind mounting bore; curved reverse face stays closed.
 const threadPoints=[];for(let i=0;i<=288;i++){const t=i/288,a=t*Math.PI*16;threadPoints.push(V(holeX+7.43*Math.cos(a),-2.25+t*8.4,7.43*Math.sin(a)));}
 g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(threadPoints),288,.12,5,false),palettes.metal));
 g.add(cyl(14,45,palettes.metal,V(-83,0,0),'x'),cyl(19,4,palettes.darkMetal,V(-66,0,0),'x'));
 g.userData.shaftProfile={radius:r,flat,ends:[x0,x1],hole:{x:holeX,radius:holeR,floor}};
 return g;
}
function holderBase(){
 // Four lateral M6 threaded bores per side, aligned with the side-plate holes.
 // Edge strips and centre form one physical BOM part; bores are open geometry.
 const g=new THREE.Group(),xs=[-36,-12,12,36];
 const centre=plate(105,64,12,palettes.metal,[[-40,-24,2.75],[-40,24,2.75],[40,-24,2.75],[40,24,2.75]],0);centre.rotation.x=-Math.PI/2;g.add(centre);
 for(const side of [-1,1]){
  const edge=plate(105,12,16,palettes.metal,xs.map(x=>[x,0,3.08]),0);edge.position.z=side*40;g.add(edge);
  for(const x of xs){const pts=[];for(let i=0;i<=336;i++){const d=i/24,a=d*Math.PI*2;pts.push(V(x+2.94*Math.cos(a),2.94*Math.sin(a),side*(47.8-d)));}
   const thread=mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),336,.14,4,false),palettes.darkMetal);g.add(thread);
  }
 }
 g.userData.threadBores=xs.flatMap(x=>[-1,1].map(side=>({x,y:0,z:side*48,axis:[0,0,-side],depth:14,nominal:6})));
 return g;
}
function saddleStrap(radius,zCenter,railY){
 // PDF p.22: one smooth transverse arch with two drilled fixing wings.
 // Outer face follows the carrier; reconstructed section is 7 mm deep so
 // the M5x10 ends at the outer face of the 3 mm carrier, before the bladder.
 const r=radius-15,phi=Math.asin(zCenter/(radius-8));
 const g=shell(r,7,23,32/r,false,[[0,-24,2.75],[0,24,2.75]],2);
 g.rotateX(phi);g.translate(0,-railY,-zCenter);return mesh(g,palettes.metal);
}
function shieldFixings(radius){const r=radius-15;return [-1,1].flatMap(side=>[-1,1].flatMap(end=>[-1,1].map(wing=>({x:end*79,angle:Math.asin(side*53/(radius-8))+wing*24/r}))));}
function drilledSleeve(rad,inner,length,boreX=0,boreRadius=2.75){const g=geo(`sleeve:${rad}:${inner}:${length}:${boreX}:${boreRadius}`,()=>{const g=shell(inner,rad-inner,length,Math.PI,false,[[boreX,-Math.PI*inner/2,boreRadius],[boreX,Math.PI*inner/2,boreRadius]],0);g.rotateX(Math.PI/2);return g;});return mesh(g,palettes.metal);}
function centralBody(){
 // Two intersecting bores: longitudinal tube seat and transverse M6 fixing.
 // Unmeasured outside dimensions and hole location reconstructed from PDF p.10.
 const group=new THREE.Group(),material=palettes.metal.clone();material.side=THREE.DoubleSide;
 const face=(w,h,hx,hy,hr)=>{const s=new THREE.Shape();s.moveTo(-w/2,1-h/2);s.lineTo(w/2,1-h/2);s.lineTo(w/2,1+h/2);s.lineTo(-w/2,1+h/2);s.closePath();const p=new THREE.Path();p.absarc(hx,hy,hr,0,Math.PI*2,true);s.holes.push(p);return mesh(new THREE.ShapeGeometry(s,96),material);};
 for(const side of [-1,1]){const end=face(44,33,0,0,11);end.rotation.y=Math.PI/2;end.position.x=side*55;group.add(end);const flank=face(110,33,-28,0,3.3);flank.position.z=side*22;group.add(flank);const cap=mesh(new THREE.PlaneGeometry(110,44),material);cap.rotation.x=Math.PI/2;cap.position.y=1+side*16.5;group.add(cap);}
 const walls=[];const quad=(a,b,c,d)=>walls.push(...a,...b,...d,...b,...c,...d);
 for(let i=0;i<384;i++){
  const row=t=>{const y=11*Math.cos(t),z=11*Math.sin(t),cut=Math.sqrt(Math.max(0,3.3**2-y*y));return [[-55,y,z],[-28-cut,y,z],[-28+cut,y,z],[55,y,z]];};
  const a=row(i*Math.PI/192),b=row((i+1)*Math.PI/192);quad(a[0],a[1],b[1],b[0]);quad(a[2],a[3],b[3],b[2]);
  const cross=t=>{const x=-28+3.3*Math.cos(t),y=3.3*Math.sin(t),edge=Math.sqrt(11**2-y*y);return [[x,y,-22],[x,y,-edge],[x,y,edge],[x,y,22]];};
  const c=cross(i*Math.PI/192),d=cross((i+1)*Math.PI/192);quad(c[0],c[1],d[1],d[0]);quad(c[2],c[3],d[3],d[2]);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(walls,3));g.computeVertexNormals();group.add(mesh(g,material));return group;
}
function openM6Nut(){const s=new THREE.Shape(),r=5.77;for(let i=0;i<6;i++){const a=i*Math.PI/3;i?s.lineTo(r*Math.cos(a),r*Math.sin(a)):s.moveTo(r*Math.cos(a),r*Math.sin(a));}s.closePath();const p=new THREE.Path();p.absarc(0,0,3,0,Math.PI*2,true);s.holes.push(p);const g=new THREE.ExtrudeGeometry(s,{depth:5,bevelEnabled:false,curveSegments:32});g.translate(0,0,-2.5);return mesh(g,palettes.bolt);}
function roundPlate(radius,depth,holes,material){const shape=new THREE.Shape();shape.absarc(0,0,radius,0,Math.PI*2,false);for(const [x,z,r]of holes){const hole=new THREE.Path();hole.absarc(x,z,r,0,Math.PI*2,true);shape.holes.push(hole);}const ge=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:48});ge.translate(0,0,-depth/2);ge.rotateX(-Math.PI/2);return mesh(ge,material);}
function spacer(height){const p=plate(67,65,height-.9,palettes.metal,[[0,-23,4.2],[0,23,4.2],[-22,0,4.2],[22,0,4.2]],1.2);p.rotation.x=-Math.PI/2;return p;}
function bumper(){const g=new THREE.Group(),profile=[[0,-49],[62,-49],[73,-47],[81,-40],[85,-31],[85,28],[83,37],[77,45],[65,49],[0,49]].map(p=>new THREE.Vector2(...p));g.add(mesh(new THREE.LatheGeometry(profile,64),palettes.rubber));for(const y of [-50,50]){const cap=roundPlate(60,3,[[0,0,12],[0,-23,3.5],[0,23,3.5]],palettes.darkMetal);cap.position.y=y;g.add(cap,torus(48,1.1,palettes.black,V(0,y*1.04,0)));}g.add(torus(84.9,.6,palettes.black,V(0,-20,0)),torus(84.9,.6,palettes.black,V(0,22,0)));return g;}
function fastener(kind,size){const g=new THREE.Group();const match=size.match(/M(\d+)\s*×\s*(\d+)/),diam=match?+match[1]:size.includes('M8')?8:6,len=match?+match[2]:20,r=diam/2;
 if(kind==='washer'){g.add(tube(5.5,2.75,1.2,palettes.bolt,V(),'y'));}
 else if(kind==='nut'){g.add(cyl(r*1.65,r*1.5,palettes.bolt,V(),'y',6),cyl(r*.75,.3,palettes.black,V(0,r*.76,0)));}
 else if(kind==='pin'){g.add(cyl(3,60,palettes.bolt));}
 else if(kind==='spring'){const pts=[];for(let i=0;i<=240;i++){const t=i/240;pts.push(V(Math.cos(t*Math.PI*18)*3.3,(t-.5)*28,Math.sin(t*Math.PI*18)*3.3));}g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),180,.8,6,false),palettes.bolt));}
 else{g.add(cyl(r,len,palettes.bolt,V(0,-len/2,0)),cyl(r*1.55,diam*.75,palettes.bolt,V(0,diam*.375,0)),cyl(r*.77,.35,palettes.black,V(0,diam*.75+.1,0),'y',6));for(let i=0;i<Math.min(12,len/2);i++)g.add(torus(r,.2,palettes.darkMetal,V(0,-len+2+i*1.6,0)));}
 return g;
}
function between(a,b,r,m){const d=b.clone().sub(a);const o=cyl(r,d.length(),m,a.clone().add(b).multiplyScalar(.5));o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return o;}
function hose(points,r,material){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>V(...p))),72,r,10,false),material);}

export class Viewer {
 constructor(el,onSelect){
  this.el=el;this.onSelect=onSelect;this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#edf0ef');
  this.camera=new THREE.PerspectiveCamera(34,1,1,15000);this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;el.prepend(this.renderer.domElement);
  this.inspectionLamp=new THREE.PointLight('#f1f4f6',2.6,1200,0);this.inspectionLamp.position.set(-85,30,0);this.inspectionLamp.visible=false;this.camera.add(this.inspectionLamp);this.scene.add(this.camera);
  this.renderer.localClippingEnabled=true;
  const env=new RoomEnvironment();const pmrem=new THREE.PMREMGenerator(this.renderer);this.scene.environment=pmrem.fromScene(env,.04).texture;env.dispose();pmrem.dispose();
  this.scene.add(new THREE.HemisphereLight('#ffffff','#86949e',2));const key=new THREE.DirectionalLight('#ffffff',3.2);key.position.set(350,900,550);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-1500,right:1500,top:1500,bottom:-1500,near:1,far:4000});key.shadow.normalBias=2;this.scene.add(key);
  this.floor=mesh(new THREE.PlaneGeometry(10000,10000),new THREE.ShadowMaterial({color:'#455861',opacity:.12}));this.floor.rotation.x=-Math.PI/2;this.floor.receiveShadow=true;this.floor.castShadow=false;this.scene.add(this.floor);
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;this.controls.dampingFactor=.09;this.controls.minDistance=180;this.controls.maxDistance=5000;this.controls.maxPolarAngle=Math.PI*.94;this.controls.autoRotateSpeed=.8;
  this.model=new THREE.Group();this.context=new THREE.Group();this.scene.add(this.model,this.context);this.parts=[];this.group='all';this.explode=0;this.targetExplode=0;this.mode='explore';this.time=0;this.selected=null;this.faint=false;
  this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();let start;
  this.renderer.domElement.addEventListener('pointerdown',e=>start=e.button===0&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&this.dragMode!=='pan'?[e.clientX,e.clientY]:null);
  this.renderer.domElement.addEventListener('pointerup',e=>{if(!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])>5)return;const b=this.renderer.domElement.getBoundingClientRect();this.pointer.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hits=this.ray.intersectObjects(this.parts.filter(p=>p.node.visible).map(p=>p.node),true);if(hits.length){let o=hits[0].object;while(o&&!o.userData.part)o=o.parent;if(o?.userData.part)this.onSelect(o.userData.part);} });
  this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(el);this.resize();
  this.last=performance.now();this.animate();
 }
 resize(){const w=this.el.clientWidth,h=this.el.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
 setDragMode(mode){this.dragMode=mode;this.controls.screenSpacePanning=true;this.controls.mouseButtons.LEFT=mode==='pan'?THREE.MOUSE.PAN:THREE.MOUSE.ROTATE;this.controls.touches.ONE=mode==='pan'?THREE.TOUCH.PAN:THREE.TOUCH.ROTATE;this.renderer.domElement.style.cursor=mode==='pan'?'move':'grab';}
 panView(x,y){
  // Move the model in screen directions while preserving camera angle and zoom.
  this.camera.updateMatrixWorld();
  const step=2*this.camera.position.distanceTo(this.controls.target)*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))*.08;
  const offset=new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld,0).multiplyScalar(-x*step).addScaledVector(new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld,1),-y*step);
  this.camera.position.add(offset);this.controls.target.add(offset);this.controls.update();
 }
 setTheme(dark){this.scene.background.set(dark?'#17222c':'#edf0ef');this.floor.material.opacity=dark?.28:.12;this.floor.material.color.set(dark?'#000000':'#455861');}
 clear(){this.repair?.dispose();this.robot?.dispose();for(const n of [this.model,this.context]){n.traverse(o=>{if(o.isMesh){if(![...cached.values()].includes(o.geometry))o.geometry.dispose();if(o.userData.origMat)o.material.dispose();}});n.clear();}this.parts=[];this.robot=null;this.repair=null;}
 addPart(g,row,i,position,explode,object){
  const node=new THREE.Group();node.position.copy(position);node.add(object);this.model.add(node);const p={group:g,pos:row.pos,key:row.key,index:i,name:row.name,qty:row.qty,kind:row.kind,note:row.note,node,base:position.clone(),delta:explode,originalRotation:node.quaternion.clone()};node.userData.part=p;this.parts.push(p);return p;
 }
 build(id){
  this.sections??={pipe:true,shield:false,holder:false};
  this.clear();this.id=id;this.family=families.find(f=>f.id===id);this.radius=id/2-12;const R=this.radius,top=Math.sqrt((R-28)**2-53**2)-3,bottom=-125-this.family.spacer.reduce((a,b)=>a+b,0),sideH=top-22;
  this.bottom=bottom;this.top=top;this.floor.position.y=bottom-13;
  for(const g of ['s','h','z','u'])for(const row of bom(id,g)){
   if(row.kind==='alias'||row.unplaced)continue;
   for(let i=0;i<row.qty;i++){
    let pos=V(),delta=V(),o=new THREE.Group();const s=i%2===0?-1:1,ind=Math.floor(i/2),key=row.key;
    if(g==='s'){
     if(['shield','mat','carrier'].includes(key)){
      const rr=R-(key==='shield'?0:key==='mat'?5:8),thick=key==='shield'?2:key==='mat'?5:3;
      const fixingHoles=key==='carrier'?shieldFixings(R).map(p=>[p.x,rr*p.angle,2.5]):[];
      o.add(mesh(shell(rr,thick,500,1.13,key==='shield'?true:'oval',fixingHoles),palettes[key==='shield'?'gold':key==='mat'?'rubber':'metal']));delta=V(0,key==='shield'?330:key==='mat'?205:95,0);
     }else if(key==='mounts'){
      pos=V(0,top+3,s*53);o.add(drilledSleeve(13,10.3,180,-60));delta=V(0,30,s*90);
     }else if(key==='straps'){
      pos=V(s*79,top+3,(ind?1:-1)*53);o.add(saddleStrap(R,pos.z,pos.y));delta=V(s*25,60,(ind?1:-1)*130);
     }else{
      o=fastener('screw',row.name);
      if(key==='bolts'){const p=shieldFixings(R)[i],normal=V(0,Math.cos(p.angle),Math.sin(p.angle));pos=V(p.x,(R-15)*normal.y,(R-15)*normal.z);o.quaternion.setFromUnitVectors(V(0,-1,0),normal);delta=normal.clone().multiplyScalar(-60);}
      else{pos=V(-60,top-10.2,s*53);o.rotation.z=Math.PI;delta=V(0,-45,s*100);}
     }
    }
    if(g==='h'){
     if(key==='base'){o=holderBase();pos=V(0,25,0);delta=V(0,-40,0);}
     else if(key==='sides'){const height=sideH+3;o=plate(100,height,6,palettes.metal,[[-36,-height/2+6,3.2],[-12,-height/2+6,3.2],[12,-height/2+6,3.2],[36,-height/2+6,3.2],[-27,height/2-12,3.2],[27,height/2-12,3.2]]);pos=V(0,19+height/2,s*51);delta=V(0,0,s*145);}
     else if(key==='rail'){const railTube=drilledSleeve(10,7.5,178,37);railTube.material=palettes.darkMetal;railTube.position.x=23;o.add(railTube);const p=plate(100,25,5,palettes.metal,[[-27,0,3.2],[27,0,3.2]]);p.position.set(0,-16,0);o.add(p);pos=V(0,top+3,s*53);delta=V(0,95,s*145);}
     else if(key==='pins'){o.add(cyl(7,85,palettes.metal,V(),'x'));for(const x of [-20,15])o.add(cyl(2,14.1,palettes.black,V(x,0,0),'z'));pos=V(-66,top+3,s*53);delta=V(-170,60,s*70);}
     else if(key==='housing'){o=plate(68,50,42,palettes.metal,[[0,0,16],[-25,-16,2.5],[25,-16,2.5],[-25,16,2.5],[25,16,2.5]]);o.rotation.y=Math.PI/2;pos=V(-86,top-11,0);delta=V(-150,0,0);}
     else if(key==='cover'){o=plate(68,50,5,palettes.metal,[[0,0,13],[-25,-16,2.5],[25,-16,2.5],[-25,16,2.5],[25,16,2.5]]);o.rotation.y=Math.PI/2;pos=V(-111,top-11,0);delta=V(-235,0,0);}
     else if(key==='shaft'){o=bladderShaft();pos=V(13,top-11,0);delta=V(40,90,0);}
     else if(key==='motor'){o.add(cyl(20,91,palettes.darkMetal,V(-45,0,0),'x'),cyl(27,5,palettes.metal,V(),'x'),cyl(18,4,palettes.black,V(-93,0,0),'x'),cyl(4,16,palettes.metal,V(9,0,0),'x'));pos=V(-116,top-11,0);delta=V(-325,0,0);}
     else if(key==='blocks'){o=plate(38,22,40,palettes.metal,[[0,0,7.5]]);o.rotation.y=Math.PI/2;pos=V(-86,top+3,s*53);delta=V(-120,40,s*100);}
     else{
      o=fastener('screw',row.name);
      if(key==='coverbolts'){pos=V(-115,top-11+s*16,ind===0?-25:25);o.rotation.z=Math.PI/2;delta=V(-280,s*5,0);}
      if(key==='motorbolts'){const a=i*Math.PI/2+Math.PI/4;pos=V(-122,top-11+Math.sin(a)*23,Math.cos(a)*23);o.rotation.z=Math.PI/2;delta=V(-360,0,0);}
      if(key==='railbolts'){pos=V(s*27,top-15,ind===0?-58:58);o.rotation.x=ind===0?-Math.PI/2:Math.PI/2;delta=V(0,80,ind===0?-195:195);}
      if(key==='sidebolts'){pos=V((i%4-1.5)*24,25,i<4?-54.45:54.45);o.rotation.x=i<4?-Math.PI/2:Math.PI/2;delta=V(0,0,i<4?-205:205);}
      if(key==='bottomfix'){pos=V(s*40,31.45,ind%2===0?-24:24);delta=V(0,-100,s*50);}
      if(key==='blockbolts'){pos=V(-86+s*12,top+3,ind===0?-73:73);o.rotation.x=ind===0?-Math.PI/2:Math.PI/2;delta=V(0,40,ind===0?-160:160);}
     }
    }
    if(g==='z'){
     if(key==='body'){o=centralBody();}
     else if(key==='disc'){o.add(roundPlate(55,8,[[-20,0,6],[20,0,6],[-37,-22,3],[37,-22,3],[-37,22,3],[37,22,3]],palettes.metal));pos=V(0,-21,0);delta=V(0,-85,0);}
     else if(key==='tube'){const pipe=drilledSleeve(10.6,7.5,400,102,3.3);pipe.rotation.x=Math.PI/2;pipe.material=palettes.darkMetal;o.add(pipe);pos=V(-130,0,0);delta=V(-160,0,0);}
     else if(key==='guide'){o.add(tube(13,10.8,211,palettes.darkMetal,V(-30,0,0),'x'),between(V(75,0,0),V(137,33,0),11,palettes.darkMetal));o.add(box(53,18,7,palettes.metal,V(113,23,-11)),box(53,18,7,palettes.metal,V(113,23,11)));pos=V(175,0,0);delta=V(165,0,0);}
     else if(key==='wheel'){o=wheel();pos=V(309,33,0);delta=V(225,0,80);}
     else if(key==='hinge1'){o=hingeBase();pos=V(-340,0,0);delta=V(-310,-30,0);}
     else if(key==='hinge3'){o=hingeTop();pos=V(-340,0,0);delta=V(-310,90,0);}
     else if(key==='hinge2'){o=hingeFlap();pos=V(-340,0,0);delta=V(-345,90,0);}
     else if(key==='adapter'){o=toolMount();pos=V(-370,-20,0);delta=V(-435,90,0);}
     else{
      o=fastener(row.kind,row.name);
      if(key==='bodybolts'){pos=V(s*20,20,0);delta=V(0,90,0);}
      if(key==='axle'||key==='axlenut'){pos=V(309,33,key==='axle'?18:-19);o.rotation.x=key==='axle'?Math.PI/2:-Math.PI/2;delta=V(225,0,key==='axle'?135:-60);}
      if(key==='adapterbolts'){pos=V(-382,-20+s*24,0);o.rotation.z=Math.PI/2;delta=V(-470,90,0);}
      if(key==='hingebolts'){pos=V(ind===0?-350:-365.5,ind===0?-44:12,s*24.7);o.rotation.x=s*Math.PI/2;delta=V(-350,ind===0?-30:90,s*100);}
      if(key==='topbolts'){pos=V(-350,32,s*12);delta=V(-310,140,0);}
      if(key==='guidebolt'){pos=V(70,16,0);delta=V(185,60,0);}
      if(key==='nuts'){if(i===0){pos=V(70,-16,0);o.rotation.z=Math.PI;delta=V(160,-60,0);}else{o=openM6Nut();pos=V(-28,0,-24.5);delta=V(0,0,-105);}}
      if(key==='hingepin'){pos=V(-365.5,28,0);o.rotation.x=Math.PI/2;delta=V(-345,90,-100);}
      if(key==='washers'){pos=V(ind===0?-350:-365.5,ind===0?-44:12,s*22.6);o.rotation.x=s*Math.PI/2;delta=V(-350,ind===0?-30:90,s*75);}
      if(key==='springbolts'){pos=V(-342,i<2?-19:13,s*24);o.rotation.x=s*Math.PI/2;delta=V(-310,0,s*180);}
      if(key==='spring'){o=tensionSpring(s);pos=V(-340,0,0);delta=V(-345,-30,s*120);}
      if(key==='lastbolt'){pos=V(-28,0,22);o.rotation.x=Math.PI/2;delta=V(0,0,105);}
     }
    }
    if(g==='u'){
     if(key==='plate'){o=plate(200,105,7,palettes.metal,[[-55,-23,4],[-55,23,4],[73,-27,3.2],[73,0,3.2],[73,27,3.2]],6);o.rotation.x=-Math.PI/2;pos=V(32,bottom,0);delta=V(0,-115,0);}
     else if(key==='wheelspacer'){o.add(box(35,18,49,palettes.metal));pos=V(114,bottom+13,0);delta=V(55,-60,0);}
     else if(key==='fork'){o.add(box(62,12,8,palettes.metal,V(0,0,-16)),box(62,12,8,palettes.metal,V(0,0,16)),box(20,12,31,palettes.metal,V(-23,0,0)));pos=V(139,bottom+27,0);delta=V(100,0,0);}
     else if(key==='wheel'){o=wheel();pos=V(168,bottom+27,0);delta=V(150,0,80);}
     else if(key==='bumper'){o=bumper();pos=V(0,-74,0);delta=V(0,170,0);}
     else if(key==='spacer100'){o.add(spacer(100));pos=V(0,bottom+54,0);delta=V(0,-15,0);}
     else if(key==='spacer50'){o.add(spacer(50));pos=V(0,bottom+29+(id>=600?100:0)+i*50,0);delta=V(0,60+i*65,0);}
     else{
      o=fastener(row.kind,row.name);
      if(key==='forkbolts'){pos=V(114,bottom+35,(i-1)*16);delta=V(75,75,0);}
      if(key==='axle'||key==='nut'){pos=V(168,bottom+27,key==='axle'?22:-22);o.rotation.x=key==='axle'?Math.PI/2:-Math.PI/2;delta=V(150,0,key==='axle'?150:-70);}
      if(key==='mountbolts'){pos=V(0,bottom-4,s*23);o.rotation.z=Math.PI;delta=V(0,-190,0);}
      if(key==='spacerbolts'){pos=V(0,bottom+104+ind*50,s*23);o.rotation.z=Math.PI;delta=V(0,20+ind*75,s*75);}
     }
    }
    // PDF overall views (pp. 3, 8, 13, 18, 23): motor on the wheel end,
    // free flat end of the bladder shaft toward the robot coupling.
    // Rotate the complete holder, including its fasteners and explosion vectors.
    if(g==='h'){const oriented=new THREE.Group();oriented.rotation.y=Math.PI;oriented.add(o);o=oriented;pos.x=-pos.x;pos.z=-pos.z;delta.x=-delta.x;delta.z=-delta.z;}
    this.addPart(g,row,i,pos,delta,o);
   }
  }
  this.buildMechanism();this.buildContext();this.select(null);this.updateParts();this.fit();
 }
 buildMechanism(){
  const R=this.radius;
  this.shaftPart=this.parts.find(p=>p.group==='h'&&p.key==='shaft');
  this.shieldPart=this.parts.find(p=>p.group==='s'&&p.key==='shield');
  this.carrierPart=this.parts.find(p=>p.group==='s'&&p.key==='carrier');
  this.sealPart=this.parts.find(p=>p.group==='s'&&p.key==='mat');
  this.sealAir=0;this.sealPose=undefined;
  for(const p of [this.sealPart,this.shieldPart]){const o=p.node.children[0].children[0];o.userData.restPositions=o.geometry.attributes.position.array.slice();}
  // These photo- and user-described details have no invented PDF BOM number.
  this.winding=new BladderMechanism(R,this.shaftPart.base.y);this.model.add(this.winding.group);
  this.inlet=new THREE.Group();this.inlet.add(tube(6.5,4,20,palettes.metal,V(),'y'),tube(10,4,2,palettes.darkMetal,V(0,9,0),'y'),cyl(9,4,palettes.darkMetal,V(0,-3,0),'y',6));this.model.add(this.inlet);
  this.sensor=new THREE.Group();this.sensor.add(cyl(6,12,palettes.darkMetal,V(0,-6,0)),cyl(9,2,mat('#c3312e',.1,.5),V(0,1,0)),torus(10.5,1.5,palettes.gold,V(0,1,0)));this.model.add(this.sensor);
  this.robotAnchor=this.parts.find(p=>p.group==='z'&&p.key==='adapter');this.robot=new Robot(R+12,this.robotAnchor.base);this.model.add(this.robot.group);
  const robotY=this.robot.bodyY+this.robotAnchor.base.y;
  this.hosePoints=[[-1500,robotY+40,112],[-1250,robotY+48,112],[-900,robotY+48,112],[-720,robotY+55,105],[-560,-5,60],[-285,45,35],[-145,R-72,24],[ports.inletX,R-42,0],[ports.inletX,R-19,0]];
  this.feed=hose(this.hosePoints,4.5,new THREE.MeshStandardMaterial({color:'#90a5aa',roughness:.28,transparent:true,opacity:.26,depthWrite:false}));this.model.add(this.feed);
  this.feedLift=null;this.sensorFull=false;this.poseMechanism(0,0,0);
 }
 poseMechanism(extension,inflation,lift){
  if(!this.winding)return;
  const proc=this.mode==='process',shaft=this.shaftPart;
  this.winding.group.visible=!this.sections?.hideBladder&&(this.group==='all'||this.group==='h');
  this.winding.group.position.copy(shaft.node.position).sub(shaft.base);
  this.winding.update(extension,inflation);shaft.node.rotation.x=this.winding.shaftAngle;
  this.inlet.visible=this.sensor.visible=this.group==='all'||this.group==='s';
  this.inlet.position.copy(this.shieldPart.node.position).sub(this.shieldPart.base).add(V(ports.inletX,this.radius-10+3*this.sealAir,0));
  this.sensor.position.copy(this.shieldPart.node.position).sub(this.shieldPart.base).add(V(ports.sensorX,this.radius+2+3*this.sealAir,0));
  this.feed.visible=proc;this.feed.position.set(0,0,0);
  const offset=this.shieldPart.node.position.clone().sub(this.shieldPart.base);offset.y+=3*this.sealAir;const feedPose=offset.toArray().join(',');
  if(this.feedLift!==feedPose){this.feedLift=feedPose;const points=this.hosePoints.map((p,i)=>V(...p).addScaledVector(offset,i<4?0:i===4?.45:1));this.feedCurve=new THREE.CatmullRomCurve3(points);this.feed.geometry.dispose();this.feed.geometry=new THREE.TubeGeometry(this.feedCurve,144,4.5,10,false);this.repair?.setFeedPoints(points);}
  if(this.repair){this.repair.hoseGroup.visible=proc;this.repair.hoseGroup.position.set(0,0,0);}
  this.poseRobot(lift);
  if(!proc){this.sensorFull=false;this.sensor.children[1].material.emissive.set('#000000');}
 }
 poseRobot(lift=0){
  if(!this.robot)return;
  this.robot.group.visible=!this.sections?.hideRobot&&(this.group==='all'||this.group==='z');
  this.robot.group.position.copy(this.robotAnchor.node.position);this.robot.group.position.y-=lift;
  this.robot.pose(lift,this.mode==='process'?this.model.position.x:0);
 }
 poseSeal(air){
  if(!this.sealPart)return;
  this.sealAir=air;if(air===this.sealPose)return;this.sealPose=air;
  for(const p of [this.sealPart,this.shieldPart]){
   const o=p.node.children[0].children[0],rest=o.userData.restPositions,a=o.geometry.attributes.position;
   for(let i=0;i<a.count;i++){const x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2],r=Math.hypot(y,z),weight=p===this.shieldPart?1:clamp((r-(this.radius-5))/5,0,1),scale=1+3*air*weight/r;a.setXYZ(i,x,y*scale,z*scale);}
   a.needsUpdate=true;o.geometry.computeVertexNormals();o.geometry.computeBoundingSphere();o.geometry.computeBoundingBox();
  }
 }
 buildContext(){
  const R=this.radius+12;
  this.branchTop=R+20+Math.max(260,this.winding.travel+65);
  this.repair=new RepairScene(R,this.branchTop,this.hosePoints,ports.inletX,4600);
  this.context.add(this.repair.group);this.model.add(this.repair.hoseGroup);
  for(const key of ['pipe','pipeFull','branch','branchFull','mortar','flow'])this[key]=this.repair[key];
  this.damage=this.repair.cavity;
  this.context.visible=false;
 }
 setMode(mode){this.mode=mode;this.context.visible=mode==='process';this.floor.visible=mode!=='process';if(mode==='process'){this.group='all';this.targetExplode=0;this.faint=false;}this.updateParts();this.fit();}
 setGroup(group){this.group=group;this.select(null);this.updateParts();this.fit();}
 setExplode(value){this.targetExplode=value;}
 setSections(options){this.sections={...this.sections,...options};this.updateParts();this.applyMaterials();}
 setGhost(v){this.faint=v;this.applyMaterials();}
 select(p){this.selected=p;this.applyMaterials();}
 applyMaterials(){for(const p of this.parts)p.node.traverse(o=>{if(!o.isMesh)return;if(!o.userData.origMat){o.userData.origMat=o.material;o.material=o.material.clone();}const selected=this.selected&&p.group===this.selected.group&&p.pos===this.selected.pos;const cut=this.sections?.shield&&['shield','mat','carrier'].includes(p.key),transparent=this.faint&&p.group==='s';o.material.opacity=transparent?.16:this.selected&&!selected?.33:1;o.material.transparent=o.material.opacity<1;o.material.depthWrite=o.material.opacity===1;o.material.clippingPlanes=cut?[new THREE.Plane(V(0,0,-1),0)]:null;o.material.needsUpdate=true;o.material.emissive.set(selected?'#1e88ac':'#000000');o.material.emissiveIntensity=selected?.32:0;});if(this.winding)for(const m of [this.winding.material,this.winding.tip.material]){m.opacity=this.selected?.2:1;m.transparent=!!this.selected;m.depthWrite=!this.selected;}}
 updateParts(){const groupDelta={s:V(0,240,0),h:V(0,35,0),z:V(0,-140,0),u:V(0,-300,0)};
  const drive=this.sections?.holder;
  if(this.repair)this.repair.setCut(!!this.sections.pipe);
  for(const p of this.parts){const frontHolder=drive&&p.base.z>0&&((p.group==='h'&&['sides','rail','pins','blocks','blockbolts','sidebolts','railbolts'].includes(p.key))||(p.group==='s'&&['mounts','straps','bolts','mountbolts'].includes(p.key)));p.node.visible=(this.group==='all'||p.group===this.group)&&!frontHolder;p.node.position.copy(p.base);if(this.explode>0){const d=p.delta.clone();if(this.group==='all'){d.multiplyScalar(.6);d.add(groupDelta[p.group]);}p.node.position.addScaledVector(d,this.explode);}}
 }
 setProcess(t){this.time=t;}
 processPose(){
  const t=this.time,stage=Math.min(PHASE.REMOVE,Math.floor(t)),f=t-stage,R=this.radius+12;
  const approach=stage===0?1-smooth(f):stage===PHASE.REMOVE?smooth((f-.88)/.12):0;
  this.model.position.x=-430*approach;
  const press=stage<PHASE.BUMPER?0:stage===PHASE.BUMPER?smooth(f):stage===PHASE.REMOVE?1-smooth((f-.75)/.12):1;
  const bumperScale=THREE.MathUtils.lerp(.28,1+8/98,press),lift=98*(bumperScale-1);
  const seal=stage<PHASE.SEAL?0:stage===PHASE.SEAL?smooth(f):stage===PHASE.REMOVE?1-smooth((f-.64)/.1):1;
  this.poseSeal(seal);
  this.bumperAir=press;this.upperLift=lift;
  this.model.position.y=0;
  const extend=stage<PHASE.BLADDER?0:stage===PHASE.BLADDER?smooth(f/.68):stage===PHASE.REMOVE?1-smooth((f-.14)/.5):1;
  const inflation=stage<PHASE.BLADDER?0:stage===PHASE.BLADDER?smooth((f-.8)/.2):stage===PHASE.REMOVE?1-smooth(f/.14):1;
  for(const p of this.parts){if(p.group!=='u')p.node.position.y+=lift;if(p.key==='bumper'){p.node.scale.y=bumperScale;p.node.position.y+=49*(bumperScale-1);}}
  this.poseMechanism(extend,inflation,lift);
  // First fill the supply line, then propagate from the shield inlet through
  // the breakout. Timing is explanatory and remains deterministic when seeking.
  const hoseFront=stage<PHASE.MORTAR?0:stage===PHASE.MORTAR?clamp(f/.18,0,1):1;
  const fill=stage<PHASE.MORTAR?0:stage===PHASE.MORTAR?smooth((f-.18)/.72):1;
  this.sensorFull=(stage===PHASE.MORTAR&&fill>=.995)||stage===PHASE.CURE||(stage===PHASE.REMOVE&&f<.14);
  this.sensor.children[1].material.emissive.set(this.sensorFull?'#e92916':'#000000');this.sensor.children[1].material.emissiveIntensity=this.sensorFull?1.5:0;
  this.repair.update({time:t,fill,hoseFront,injecting:stage===PHASE.MORTAR&&!this.sensorFull,sealed:seal,cured:stage>=PHASE.CURE,shield:{x:this.model.position.x,lift,seal,press}});

 }
 bounds(){this.model.updateMatrixWorld(true);const b=new THREE.Box3();for(const p of this.parts)if(p.node.visible)b.expandByObject(p.node);if(this.robot?.group.visible)b.expandByObject(this.robot.group);return b;}
 shaftFocus(){this.model.updateMatrixWorld(true);return this.shaftPart.node.getWorldPosition(V()).add(V(13,2,0));}
 followShaft(){
  if(this.currentView!=='shaft'||!this.shaftTracking)return;
  const center=this.shaftFocus(),delta=center.clone().sub(this.shaftTracking);
  this.camera.position.add(delta);this.controls.target.add(delta);this.shaftTracking.copy(center);
 }
 fit(view='iso'){
  this.currentView=view;this.shaftTracking=null;
  if(this.inspectionLamp)this.inspectionLamp.visible=['channel','shaft'].includes(view);
  this.camera.fov=view==='channel'?58:view==='shaft'?44:34;this.camera.updateProjectionMatrix();this.controls.minDistance=view==='shaft'?70:180;
  if(view==='shaft'){
   this.explode=this.targetExplode;this.updateParts();if(this.mode==='process')this.processPose();else this.resetPose();
   const center=this.shaftFocus();this.camera.position.copy(center).add(V(-260,-80,0));this.controls.target.copy(center);this.controls.update();this.shaftTracking=center;this.applyMaterials();
   if(this.el)this.el.dispatchEvent(new CustomEvent('viewchange',{detail:{view}}));return;
  }
  if(view==='channel'){
   const R=this.radius+12;this.controls.target.set(0,R,0);this.camera.position.set(-20,R-280,32);this.camera.lookAt(this.controls.target);this.controls.update();this.applyMaterials();
   if(this.el)this.el.dispatchEvent(new CustomEvent('viewchange',{detail:{view}}));return;
  }
  this.model.position.set(0,0,0);this.explode=this.targetExplode;this.updateParts();this.poseRobot();let b=this.bounds();if(this.mode==='process')b=new THREE.Box3(V(this.sections.hideRobot?-570:-2250,this.bottom,-300),V(450,this.branchTop+20,300));if(view==='drive')b=new THREE.Box3(V(-220,this.top-70,-85),V(220,this.radius+this.winding.travel+40,110));
  if(view==='robot'&&this.robot){if(this.mode==='process')this.processPose();b=new THREE.Box3().setFromObject(this.robot.group);b.max.x=-270+this.model.position.x;b.min.x=Math.max(b.min.x,-1740+this.model.position.x);}
  if(view==='tool'&&this.robot){if(this.mode==='process')this.processPose();const origin=this.robot.group.getWorldPosition(V());b=new THREE.Box3(origin.clone().add(V(-420,-145,-90)),origin.clone().add(V(10,125,90)));}
  if(view==='damage')b=new THREE.Box3(V(-265,this.radius-100,-140),V(210,this.radius+180,120));
  if(view==='winding')b=new THREE.Box3(V(-125,this.top-65,-75),V(145,this.radius+80,75));
  if(view==='hinge'){b=new THREE.Box3();for(const p of this.parts)if(p.group==='z'&&['hinge1','hinge2','hinge3','adapter','adapterbolts','hingebolts','topbolts','washers'].includes(p.key))b.expandByObject(p.node);}
  const center=b.getCenter(V()),sz=b.getSize(V());const max=Math.max(sz.y,sz.x/Math.max(.8,this.camera.aspect),sz.z*.75);let dist=Math.max(view==='hinge'?220:500,max/(2*Math.tan(THREE.MathUtils.degToRad(17)))*1.48);
  const dir=view==='side'?V(0,.05,1):view==='front'?V(1,.06,0):view==='top'?V(.001,1,.001):['robot','tool'].includes(view)?V(.3,.62,1):view==='hinge'?V(-.75,.35,1):view==='damage'?V(-.5,.55,1):['drive','winding'].includes(view)?V(-.7,.25,1):this.mode==='process'?V(.35,.28,1):V(.35,.55,1);
  if(this.robot?.group.visible&&!['hinge','damage','drive','winding'].includes(view)){
   const forward=dir.clone().normalize(),right=V(0,1,0).cross(forward).normalize(),up=forward.clone().cross(right).normalize(),ty=Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2)),tx=ty*this.camera.aspect;dist=300;
   for(const x of[b.min.x,b.max.x])for(const y of[b.min.y,b.max.y])for(const z of[b.min.z,b.max.z]){const p=V(x,y,z).sub(center),depth=p.dot(forward);dist=Math.max(dist,depth+1.12*Math.abs(p.dot(right))/tx,depth+1.12*Math.abs(p.dot(up))/ty);}
  }
  this.camera.position.copy(center.clone().add(dir.normalize().multiplyScalar(dist)));this.controls.target.copy(center);this.controls.update();this.applyMaterials();
  if(this.el)this.el.dispatchEvent(new CustomEvent('viewchange',{detail:{view}}));
 }
 project(point){const p=point.clone().project(this.camera);return{x:(p.x+1)/2*this.el.clientWidth,y:(1-p.y)/2*this.el.clientHeight,visible:p.z<1&&p.z>-1};}
 anchor(g){const b=new THREE.Box3();for(const p of this.parts)if(p.node.visible&&p.group===g&&p.kind==='part')b.expandByObject(p.node);return b.isEmpty()?null:b.getCenter(V());}
 processAnchors(){const x=this.model.position.x,y=this.winding.group.position.y;return [
  {name:this.time<PHASE.MORTAR?(this.winding.fullyUnwound?'Blase fast bündig eingeschraubt':'Blase eingeschraubt · auf der Welle'):'Injektionsmörtel',side:'left',point:this.time<PHASE.MORTAR?V(x,this.shaftPart.base.y+y+bladderMount.seat,0):V(0,this.radius+55,75)},
  {name:'Starre runde Blasenspitze',point:V(x,this.winding.tip.position.y+y+7,0)},
  {name:'Mörtelzufuhr von unten',side:'left',point:V(x+ports.inletX,this.inlet.position.y-13,0)},
  {name:this.sensorFull?'Drucksensor · voll':'Drucksensor',point:V(x+ports.sensorX,this.sensor.position.y+2,0)},
  {name:'Dichtblase zwischen Schild & Träger',side:'left',point:V(x-185,this.radius-2+3*this.sealAir+y,0)}
 ];}
 fitExplosion(){const e=this.explode,t=this.targetExplode;this.targetExplode=1;this.fit();this.targetExplode=t;this.explode=e;this.updateParts();}
 screenshot(){this.renderer.render(this.scene,this.camera);return this.renderer.domElement.toDataURL('image/png');}
 resetPose(){this.model.position.set(0,0,0);for(const p of this.parts){p.node.scale.set(1,1,1);p.node.quaternion.copy(p.originalRotation);}this.poseSeal(0);this.poseMechanism(0,0,0);}
 animate(){requestAnimationFrame(()=>this.animate());const now=performance.now(),dt=Math.min((now-this.last)/1000,.05);this.last=now;this.explode+=(this.targetExplode-this.explode)*Math.min(1,dt*7);if(Math.abs(this.targetExplode-this.explode)<.0001)this.explode=this.targetExplode;this.updateParts();this.floor.visible=this.mode!=='process'&&this.explode<.03;if(this.mode==='process')this.processPose();else this.resetPose();this.followShaft();this.controls.update();this.renderer.render(this.scene,this.camera);this.onFrame?.(dt);}
}
