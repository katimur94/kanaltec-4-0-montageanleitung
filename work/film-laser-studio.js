import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {FXAAShader} from 'three/examples/jsm/shaders/FXAAShader.js';
import {Viewer} from '../src/model.js';
import {laserText,laserSpec} from '../src/laser-aid.js';

// Offline-Film zur Laser-Positionierhilfe (08.10.2026). Gleiche Geometrie und
// Bewegung wie die Website: src/model.js mit src/laser-aid.js, DN 400, offener
// Anschluss mit Infiltration. Nur Prozessbilder, Marken- und Kapitelkarten.
Viewer.prototype.animate=function(){};
const params=new URLSearchParams(location.search);
const host=document.querySelector('#scene'),canvas=document.querySelector('#film'),ctx=canvas.getContext('2d');
const viewer=new Viewer(host,()=>{});
viewer.repairOptions={kind:'open',infiltration:true,infiltrationLevel:.55,cavity:'large',sewerWater:33};
viewer.laserAid=true;viewer.build(400);viewer.mode='process';viewer.setMode('process');
viewer.controls.enabled=false;viewer.renderer.setPixelRatio(1);viewer.renderer.toneMappingExposure=1.25;
viewer.setTheme(true);viewer.floor.visible=false;
// Software-Rendering ohne GPU: Schatten optional abschaltbar (?shadows=0).
if(params.get('shadows')==='0'){viewer.renderer.shadowMap.enabled=false;viewer.scene.traverse(o=>{if(o.material)for(const m of [o.material].flat())m.needsUpdate=true;});}
// Nur für den Film: die sehr fein unterteilten Bohrungshülsen (Zentralrohr,
// Schildhalterung, Aufnahmen) durch gleich große, einfache Rohre ersetzen.
// Software-Rendering ist dreiecksgebunden; Website und Geometrieprüfung bleiben unverändert.
for(const p of viewer.parts)if(['tube','rail','mounts'].includes(p.key))p.node.traverse(o=>{
 if(!o.isMesh)return;const g=o.geometry,n=g.index?g.index.count/3:g.attributes.position.count/3;if(n<50000)return;
 g.computeBoundingBox();const s=g.boundingBox.getSize(new THREE.Vector3()),c=g.boundingBox.getCenter(new THREE.Vector3());
 const axis=s.x>=s.y&&s.x>=s.z?'x':s.y>=s.z?'y':'z',len=s[axis],rad=Math.max(...['x','y','z'].filter(k=>k!==axis).map(k=>s[k]))/2;
 const simple=new THREE.CylinderGeometry(rad,rad,len,40,1,false);if(axis==='x')simple.rotateZ(Math.PI/2);if(axis==='z')simple.rotateX(Math.PI/2);simple.translate(c.x,c.y,c.z);
 o.geometry=simple;
});
// Eigener Renderer ohne MSAA (?aa=0): Software-Rendering ist sonst pixelgebunden.
let renderer=viewer.renderer;
if(params.get('aa')==='0'){
 renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});
 Object.assign(renderer,{outputColorSpace:viewer.renderer.outputColorSpace,toneMapping:viewer.renderer.toneMapping,toneMappingExposure:viewer.renderer.toneMappingExposure,localClippingEnabled:true});
 renderer.shadowMap.enabled=viewer.renderer.shadowMap.enabled;renderer.shadowMap.type=viewer.renderer.shadowMap.type;renderer.setPixelRatio(1);
 const env=new RoomEnvironment(),pm=new THREE.PMREMGenerator(renderer);viewer.scene.environment=pm.fromScene(env,.04).texture;env.dispose();pm.dispose();
}
if(params.get('debug')){viewer.laser.materials.rubber.color.set('#ff00ff');viewer.laser.materials.rubber.emissive.set('#ff00ff');}
const scene=viewer.scene,camera=viewer.camera,R=viewer.radius+12,L=viewer.laserTarget();
const fill=new THREE.DirectionalLight('#e3efff',1.5);fill.position.set(100,-240,600);scene.add(fill);
const sun=scene.children.filter(o=>o.isDirectionalLight||o.isHemisphereLight);
const lamp=new THREE.SpotLight('#fff1dc',9,2600,.9,.8,0);const lampAim=new THREE.Object3D();lampAim.position.set(0,0,-100);camera.add(lamp,lampAim);lamp.target=lampAim;
const darkBg=new THREE.Color('#17222c'),insideBg=new THREE.Color('#030405');
const logo=new Image();logo.src='logo.png';await logo.decode();
let width=+(params.get('w')||1920),height=+(params.get('h')||1080);
canvas.width=width;canvas.height=height;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();
let composer=null;
if(renderer!==viewer.renderer){composer=new EffectComposer(renderer);composer.setPixelRatio(1);composer.setSize(width,height);composer.addPass(new RenderPass(scene,camera));composer.addPass(new OutputPass());const fx=new ShaderPass(FXAAShader);fx.material.uniforms.resolution.value.set(1/width,1/height);composer.addPass(fx);}
const draw=()=>{if(composer)composer.render();else renderer.render(scene,camera);};
const lerp=THREE.MathUtils.lerp,clamp=THREE.MathUtils.clamp,smooth=x=>(x=clamp(x,0,1))*x*(3-2*x);
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
// pos/target absolute (Welt-mm). ride: Kamera fährt mit dem Roboter (Kanalkamera).
const shots=[
 {start:3,end:7,a:2,b:2.26,chapter:'1 · Über den Anschluss fahren',pos:[-430,260,1380],pos2:[-330,240,1300],target:[-210,95,0],target2:[-120,110,0]},
 {start:7,end:10.5,a:2.26,b:2.42,chapter:'2 · Rote Linie auf die Anschlussmitte',pos:[160,190,930],pos2:[110,175,860],target:[-10,150,0]},
 {start:10.5,end:14,a:2.44,b:2.585,chapter:'3 · 2 s stehen: Messrad nullt',ride:true,cam:[-470,62,0],look:[-240,R-12,0],hideRobot:true,inside:true,hud:true},
 {start:14,end:23,a:2.585,b:2.9995,chapter:'4 · Zurückfahren bis Grün',ride:true,cam:[-470,62,0],look:[-240,R-12,0],hideRobot:true,inside:true,hud:true,ease:'late'},
 {start:23,end:27,a:2.9995,b:3.45,chapter:'5 · Schildöffnung mittig, anpressen',pos:[-300,250,980],pos2:[-260,240,920],target:[-90,160,0],hud:true},
 {start:27,end:29.2,a:2.985,b:2.985,chapter:'Hauptbox mit zwei Linienlasern',pos:[-560,150,330],pos2:[-520,135,350],target:[-215,-20,-50],target2:[-205,-25,-50],fov:42,hideRobot:true},
 {start:29.2,end:31,a:2.94,b:2.985,chapter:'Messrad an der Rohrwand',pos:[-250,30,-60],pos2:[-235,15,-75],target:[-110,-105,-128],fov:50,inside:true,hideRobot:true}
];
const duration=34;
function font(weight,size){return `${weight} ${Math.round(size)}px "DejaVu Sans","Segoe UI",Arial,sans-serif`;}
function brand(t,outro){
 const u=outro?(t-31)/3:t/3,fade=smooth(u*4),cx=width/2,m=Math.min(width,height);
 const g=ctx.createLinearGradient(0,0,width,height);g.addColorStop(0,'#0b131d');g.addColorStop(1,'#1b3041');ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
 ctx.strokeStyle='rgba(32,135,198,.13)';ctx.lineWidth=width*.014;
 for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(width*.82,height*.28,m*(.3+i*.17)+u*22,0,Math.PI*2);ctx.stroke();}
 const lw=width*.44*(.96+.04*fade),lh=lw*logo.height/logo.width,pad=width*.035;
 ctx.save();ctx.globalAlpha=fade;ctx.drawImage(logo,pad,pad+(1-fade)*18,lw,lh);ctx.restore();
 // Laserlinie als Akzent: rot, beim Abschluss grün.
 const lineW=width*.34*smooth(u*2.2),y=height*.62;ctx.save();ctx.shadowColor=outro?'#2ee66a':'#ff3a2a';ctx.shadowBlur=m*.03;ctx.fillStyle=outro?'#2ee66a':'#ff3a2a';ctx.fillRect(cx-lineW/2,y,lineW,Math.max(3,m*.006));ctx.restore();
 ctx.textAlign='center';ctx.fillStyle='#edf5fa';ctx.font=font(600,m*.076);ctx.fillText('Laser-Positionierhilfe',cx,height*.55);
 ctx.font=font(400,m*.035);ctx.fillStyle='#adc5d6';ctx.fillText(outro?'Rot fahren · Grün stoppen · mittig sanieren':'DSS-Flex Schalung · Messrad und Linienlaser',cx,height*.70);
 ctx.font=font(400,m*.027);ctx.fillStyle='#62b7ec';
 ctx.fillText(outro?'ditom-kanaltechnik.de':'Vorschlag zum genauen Positionieren',cx,height*.85);
 const black=outro?smooth((t-33.4)/.6):1-smooth(t/.5);if(black>0){ctx.fillStyle=`rgba(0,0,0,${black})`;ctx.fillRect(0,0,width,height);}
}
function hud(){
 const s=viewer.laserStatus;if(!s?.visible)return;
 const m=Math.min(width,height),x=width*.035,h=m*.15,w=m*.62,y=height-h-m*.05;
 ctx.save();ctx.fillStyle='rgba(6,12,18,.72)';ctx.strokeStyle='rgba(120,170,200,.35)';ctx.lineWidth=2;
 ctx.beginPath();ctx.roundRect(x,y,w,h,m*.012);ctx.fill();ctx.stroke();
 const color=s.green?'#2ee66a':s.red?'#ff3a2a':'#4b5257';
 ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=s.red||s.green?m*.02:0;ctx.fillRect(x+m*.025,y+m*.03,m*.07,m*.014);ctx.shadowBlur=0;
 ctx.textAlign='left';ctx.fillStyle='#9fb6c6';ctx.font=font(400,m*.022);ctx.fillText('MESSRAD · RÜCKWEG',x+m*.11,y+m*.045);
 const d=s.d==null?'–':Math.round(s.d)+' mm';ctx.fillStyle='#eef5fa';ctx.font=font(600,m*.046);ctx.fillText(d,x+m*.025,y+m*.1);
 ctx.font=font(400,m*.024);ctx.fillStyle='#9fb6c6';ctx.fillText(`Ziel ${Math.round(s.L)} mm`,x+m*.32,y+m*.1);
 ctx.fillStyle=s.green?'#7ef0a4':s.state==='zero'?'#ffd38a':'#ffb0a6';ctx.font=font(400,m*.022);ctx.fillText(laserText(s),x+m*.025,y+m*.135);
 ctx.restore();
}
function chapter(s,t){
 const m=Math.min(width,height),a=Math.min(1,(t-s.start)/.4,(s.end-t)/.3);if(a<=0)return;
 ctx.save();ctx.globalAlpha=clamp(a,0,1);ctx.textAlign='right';ctx.font=font(500,m*.03);ctx.fillStyle='#eef5fa';ctx.shadowColor='rgba(0,0,0,.8)';ctx.shadowBlur=m*.012;
 const tw=ctx.measureText(s.chapter).width;ctx.shadowBlur=0;ctx.fillStyle='rgba(6,12,18,.62)';ctx.beginPath();ctx.roundRect(width*.965-tw-m*.022,height*.075-m*.038,tw+m*.044,m*.056,m*.01);ctx.fill();ctx.fillStyle='#eef5fa';ctx.fillText(s.chapter,width*.965,height*.075);ctx.restore();
}
function processTime(s,u){
 if(s.ease==='late'){
  // Die letzten Millimeter dauern länger, damit Grünblinken und Grün sichtbar werden.
  const k=u<.55?u/.55*.62:.62+(u-.55)/.45*.38;return lerp(s.a,s.b,k);
 }
 return lerp(s.a,s.b,s.a===s.b?0:u);
}
function pose(s,t){
 const u=clamp((t-s.start)/(s.end-s.start),0,1),e=smooth(u);
 viewer.model.visible=true;viewer.explode=viewer.targetExplode=0;viewer.ambientClock=t;
 const key=[s.inside,s.hideRobot].join(',');
 if(viewer.filmKey!==key){viewer.setSections({pipe:!s.inside,shield:false,hideBladder:false,hideRobot:!!s.hideRobot,holder:false});viewer.filmKey=key;}
 viewer.time=processTime(s,u);viewer.updateParts();viewer.processPose();viewer.floor.visible=false;
 let pos,target;
 if(s.ride){const x=viewer.model.position.x;pos=V(x+s.cam[0],s.cam[1],s.cam[2]);target=V(x+s.look[0],s.look[1],s.look[2]);}
 else{target=V(...s.target).lerp(V(...(s.target2||s.target)),e);pos=V(...s.pos).lerp(V(...(s.pos2||s.pos)),e);}
 camera.position.copy(pos);camera.up.set(0,1,0);camera.fov=s.fov??(s.inside?66:38);viewer.laser.fanMaterial.opacity=s.inside?.03:.05;camera.updateProjectionMatrix();camera.lookAt(target);camera.updateMatrixWorld();
 viewer.inspectionLamp.visible=true;lamp.visible=!!s.inside;fill.visible=!s.inside;for(const l of sun)l.visible=!s.inside||l.isHemisphereLight;
 scene.background=s.inside?insideBg:darkBg;renderer.toneMappingExposure=s.inside?1.5:1.25;
}
function frame(t){
 ctx.clearRect(0,0,width,height);
 if(t<3||t>=31){brand(t,t>=31);return canvas.toDataURL('image/jpeg',.93).split(',')[1];}
 const s=shots.find(s=>t>=s.start&&t<s.end);pose(s,t);
 draw();ctx.drawImage(renderer.domElement,0,0,width,height);
 const lw=width*.15,pad=width*.03;ctx.globalAlpha=.92;ctx.drawImage(logo,pad,pad,lw,lw*logo.height/logo.width);ctx.globalAlpha=1;
 chapter(s,t);if(s.hud)hud();
 const fade=Math.min(1,(t-s.start)/.2,(s.end-t)/.2);if(fade<1){ctx.fillStyle=`rgba(6,12,18,${(1-fade)*.85})`;ctx.fillRect(0,0,width,height);}
 return canvas.toDataURL('image/jpeg',.93).split(',')[1];
}
function profile(t){const s=shots.find(s=>t>=s.start&&t<s.end),a=performance.now();pose(s,t);const b=performance.now();draw();const gl=renderer.getContext();const px=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);const c=performance.now();const j=canvas.toDataURL('image/jpeg',.93);const d=performance.now();return{pose:b-a,render:c-b,encode:d-c,calls:viewer.renderer.info.render.calls,tris:viewer.renderer.info.render.triangles};}
function heavy(){const list=[];scene.traverseVisible(o=>{if(o.isMesh||o.isPoints||o.isLine){const g=o.geometry;const n=g.index?g.index.count/3:g.attributes.position.count/3;let p=o,name=o.name;while(!name&&p.parent){p=p.parent;name=p.name||(p.userData.part?p.userData.part.key:'');}list.push([Math.round(n),name||o.type,o.material?.type]);}});return list.sort((a,b)=>b[0]-a[0]).slice(0,25);}
window.film={heavy,profile,frame,shots,duration,width,height,L,laserX:laserSpec.x};window.ready=true;
