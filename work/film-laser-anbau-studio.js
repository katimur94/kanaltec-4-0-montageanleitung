import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {FXAAShader} from 'three/examples/jsm/shaders/FXAAShader.js';
import {STLLoader} from 'three/examples/jsm/loaders/STLLoader.js';
import {Viewer} from '../src/model.js';
import {laserSpec} from '../src/laser-aid.js';
import TL from './qa/laser-anbau/timeline.json';

// Film „Laser-Positionierhilfe – Anbau und Einsatz“ (09.10.2026).
// Schalung, Roboter, Rohr und Bewegung aus src/model.js (DN 400). Die Positionierhilfe
// selbst wird in der Druckversion gezeigt: Netze aus work/druckteile/druckteile.py
// (--view), in die Koordinaten von src/laser-aid.js gesetzt. Zeitplan und Texte aus
// work/laser-anbau-script.json über work/laser-anbau-audio.py (Sprecherlängen).
Viewer.prototype.animate=function(){};
const params=new URLSearchParams(location.search);
const host=document.querySelector('#scene'),canvas=document.querySelector('#film'),ctx=canvas.getContext('2d');
const viewer=new Viewer(host,()=>{});
viewer.repairOptions={kind:'open',infiltration:true,infiltrationLevel:.5,cavity:'large',sewerWater:33};
viewer.laserAid=true;viewer.build(TL.dn);viewer.mode='process';viewer.setMode('process');
viewer.controls.enabled=false;viewer.renderer.setPixelRatio(1);viewer.renderer.toneMappingExposure=1.25;
viewer.setTheme(true);viewer.floor.visible=false;
if(params.get('shadows')==='0'){viewer.renderer.shadowMap.enabled=false;viewer.scene.traverse(o=>{if(o.material)for(const m of [o.material].flat())m.needsUpdate=true;});}
// Nur für den Film: extrem fein unterteilte Hülsen durch gleich große einfache Rohre ersetzen (Software-Rendering).
for(const p of viewer.parts)if(['tube','rail','mounts'].includes(p.key))p.node.traverse(o=>{
 if(!o.isMesh)return;const g=o.geometry,n=g.index?g.index.count/3:g.attributes.position.count/3;if(n<50000)return;
 g.computeBoundingBox();const s=g.boundingBox.getSize(new THREE.Vector3()),c=g.boundingBox.getCenter(new THREE.Vector3());
 const axis=s.x>=s.y&&s.x>=s.z?'x':s.y>=s.z?'y':'z',len=s[axis],rad=Math.max(...['x','y','z'].filter(k=>k!==axis).map(k=>s[k]))/2;
 const simple=new THREE.CylinderGeometry(rad,rad,len,40,1,false);if(axis==='x')simple.rotateZ(Math.PI/2);if(axis==='z')simple.rotateX(Math.PI/2);simple.translate(c.x,c.y,c.z);o.geometry=simple;
});
let renderer=viewer.renderer;
if(params.get('aa')==='0'){
 renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});
 Object.assign(renderer,{outputColorSpace:viewer.renderer.outputColorSpace,toneMapping:viewer.renderer.toneMapping,toneMappingExposure:viewer.renderer.toneMappingExposure,localClippingEnabled:true});
 renderer.shadowMap.enabled=viewer.renderer.shadowMap.enabled;renderer.shadowMap.type=viewer.renderer.shadowMap.type;renderer.setPixelRatio(1);
 const env=new RoomEnvironment(),pm=new THREE.PMREMGenerator(renderer);viewer.scene.environment=pm.fromScene(env,.04).texture;env.dispose();pm.dispose();
}
const scene=viewer.scene,camera=viewer.camera,R=viewer.radius+12,L=viewer.laser;
const V=(x,y,z)=>new THREE.Vector3(x,y,z),lerp=THREE.MathUtils.lerp,clamp=THREE.MathUtils.clamp,smooth=x=>(x=clamp(x,0,1))*x*(3-2*x);
// Licht: Außenaufnahmen, Werkstatt (Anbau) und Kanallampe.
const fill=new THREE.DirectionalLight('#e3efff',1.5);fill.position.set(100,-240,600);scene.add(fill);
const shop=[new THREE.DirectionalLight('#ffffff',1.3),new THREE.DirectionalLight('#ffffff',.9),new THREE.DirectionalLight('#ffffff',.7)];
shop[0].position.set(-600,500,-700);shop[1].position.set(-300,-700,-500);shop[2].position.set(400,200,600);for(const l of shop){l.visible=false;scene.add(l);}
const sun=scene.children.filter(o=>(o.isDirectionalLight||o.isHemisphereLight)&&!shop.includes(o)&&o!==fill);
const lamp=new THREE.SpotLight('#fff1dc',9,2600,.9,.8,0);const lampAim=new THREE.Object3D();lampAim.position.set(0,0,-100);camera.add(lamp,lampAim);lamp.target=lampAim;
const darkBg=new THREE.Color('#17222c'),shopBg=new THREE.Color('#1d2a33'),insideBg=new THREE.Color('#030405');

// ---------------- Druckversion der Positionierhilfe ----------------
const parts=await fetch('teile/parts.json').then(r=>r.json());
const loader=new STLLoader(),P=parts.pivot,A=parts.axle;
const lower=new THREE.Group(),head=new THREE.Group(),rocker=new THREE.Group(),wheelG=new THREE.Group();
lower.position.y=L.geo.top;L.group.add(lower,head);
rocker.position.set(P[0],P[1],0);lower.add(rocker);wheelG.position.set(A[0]-P[0],A[1]-P[1],0);rocker.add(wheelG);
for(const k of Object.keys(L.parts))L.parts[k].visible=false;
const items={};
await Promise.all(parts.items.filter(it=>!['stuetzplatte','zentralrohr'].includes(it.key)).map(async it=>{
 const geo=loader.parse(await fetch('teile/'+it.file).then(r=>r.arrayBuffer()));geo.computeVertexNormals();
 const ref=it.kind==='ref';
 const mat=new THREE.MeshStandardMaterial({color:it.color,metalness:ref?.55:.04,roughness:ref?.35:.6,emissive:'#000000'});if(it.ghost){mat.transparent=true;mat.opacity=.3;mat.depthWrite=false;mat.roughness=.05;}
 const m=new THREE.Mesh(geo,mat);m.castShadow=m.receiveShadow=true;
 if(it.group==='laser')head.add(m);
 else if(['rad','radnabe'].includes(it.key)){m.position.set(-A[0],-A[1],0);wheelG.add(m);}
 else if(it.rocker){m.position.set(-P[0],-P[1],0);rocker.add(m);}
 else lower.add(m);
 items[it.key]={it,mesh:m,base:m.position.clone()};
}));
// Laserfenster: leuchtende Austrittspunkte rot/grün auf dem Kopf
const lens=[-9,9].map((z,i)=>{const m=new THREE.Mesh(new THREE.CircleGeometry(4.2,24),new THREE.MeshBasicMaterial({color:i?'#173f22':'#5a1d18',toneMapped:false}));m.rotation.x=-Math.PI/2;m.position.set(laserSpec.x,50.3,z);head.add(m);return m;});
const springTop=parts.springTop,alpha0=parts.alpha0*Math.PI/180;
const alphaFor=d=>Math.asin((P[1]-(A[1]+d))/parts.L),seatY=a=>P[1]+parts.seatU*Math.sin(a)+parts.seatV*Math.cos(a);
function deflect(d){const a=alphaFor(d);rocker.rotation.z=a-alpha0;const sp=items.feder;if(sp&&d!==0){const s=(springTop-seatY(a))/(springTop-seatY(alpha0));sp.mesh.scale.y=s;sp.mesh.position.y=sp.base.y+springTop*(1-s);}}

// Ankunftsreihenfolge: Teile eines Anbau-Schritts fliegen ein, spätere sind noch nicht da.
const shots=TL.shots,asm=shots.filter(s=>s.type==='asm');
const arriveAt={};asm.forEach((s,i)=>(s.arrive||[]).forEach(([k,vec,delay])=>arriveAt[k]={i,vec,delay,shot:s}));
function placeItems(shotIdx,t){
 for(const [k,o] of Object.entries(items)){
  const a=arriveAt[k],m=o.mesh,g=o.it.ghost;m.position.copy(o.base);m.material.emissive.set('#000000');m.material.opacity=g?.3:1;m.material.transparent=!!g;
  if(k==='feder'){m.scale.y=1;}
  if(!a){m.visible=true;continue;}
  if(shotIdx==null||a.i<shotIdx){m.visible=true;continue;}
  if(a.i>shotIdx){m.visible=false;continue;}
  const s=a.shot,t0=s.start+.35+a.delay*3.2,p=smooth((t-t0)/1.5);
  m.visible=t>=t0-.05;const off=1-p;m.position.add(V(...a.vec).multiplyScalar(off*1.6));
  m.material.transparent=g||p<1;m.material.opacity=clamp((t-t0)/.35,0,1)*(g?.3:1);
  m.material.emissive.set('#2b7fb0');m.material.emissiveIntensity=.55*(1-smooth((t-t0-1.2)/1.2));
 }
}

const logo=new Image();logo.src='logo.png';await logo.decode();
let width=+(params.get('w')||1920),height=+(params.get('h')||1080);
const rs=+(params.get('r')||1),rw=Math.round(width*rs),rh=Math.round(height*rs);
canvas.width=width;canvas.height=height;renderer.setSize(rw,rh);camera.aspect=width/height;camera.updateProjectionMatrix();
let composer=null;
if(renderer!==viewer.renderer){composer=new EffectComposer(renderer);composer.setPixelRatio(1);composer.setSize(rw,rh);composer.addPass(new RenderPass(scene,camera));composer.addPass(new OutputPass());const fx=new ShaderPass(FXAAShader);fx.material.uniforms.resolution.value.set(1/rw,1/rh);composer.addPass(fx);}
const draw=()=>{if(composer)composer.render();else renderer.render(scene,camera);};
const font=(w,s,mono)=>`${w} ${Math.round(s)}px ${mono?'"DejaVu Sans Mono",Consolas,monospace':'"DejaVu Sans","Segoe UI",Arial,sans-serif'}`;
const M=()=>Math.min(width,height);

// ---------------- 2D: Marke, Kapitel, Untertitel, Bedienkasten ----------------
function brand(s,t){
 const u=(t-s.start)/(s.end-s.start),outro=!!s.outro,fade=smooth(u*5),cx=width/2,m=M();
 const g=ctx.createLinearGradient(0,0,width,height);g.addColorStop(0,'#0b131d');g.addColorStop(1,'#1b3041');ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
 ctx.strokeStyle='rgba(32,135,198,.13)';ctx.lineWidth=width*.014;
 for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(width*.82,height*.28,m*(.3+i*.17)+u*30,0,Math.PI*2);ctx.stroke();}
 const lw=width*.44*(.96+.04*fade),lh=lw*logo.height/logo.width,pad=width*.035;
 ctx.save();ctx.globalAlpha=fade;ctx.drawImage(logo,pad,pad+(1-fade)*18,lw,lh);ctx.restore();
 const lineW=width*.34*smooth(u*3),y=height*.62;ctx.save();ctx.shadowColor=outro?'#2ee66a':'#ff3a2a';ctx.shadowBlur=m*.03;ctx.fillStyle=outro?'#2ee66a':'#ff3a2a';ctx.fillRect(cx-lineW/2,y,lineW,Math.max(3,m*.006));ctx.restore();
 ctx.textAlign='center';ctx.fillStyle='#edf5fa';ctx.font=font(600,m*.076);ctx.fillText('Laser-Positionierhilfe',cx,height*.55);
 ctx.font=font(400,m*.036);ctx.fillStyle='#adc5d6';ctx.fillText(outro?'Rot fahren · Grün stoppen · mittig sanieren':'Anbau und Einsatz an der DSS-Flex Schalung',cx,height*.70);
 ctx.font=font(400,m*.027);ctx.fillStyle='#62b7ec';ctx.fillText(outro?'ditom-kanaltechnik.de':'Druckversion · Prototyp',cx,height*.85);
 const black=outro?smooth((t-(s.end-.7))/.7):1-smooth((t-s.start)/.5);if(black>0){ctx.fillStyle=`rgba(0,0,0,${black})`;ctx.fillRect(0,0,width,height);}
}
function chapter(s,t){
 if(!s.chapter)return;const m=M(),a=Math.min(1,(t-s.start)/.4,(s.end-t)/.3);if(a<=0)return;
 ctx.save();ctx.globalAlpha=clamp(a,0,1);ctx.textAlign='right';ctx.font=font(500,m*.03);
 const tw=ctx.measureText(s.chapter).width;ctx.fillStyle='rgba(6,12,18,.62)';ctx.beginPath();ctx.roundRect(width*.965-tw-m*.022,height*.075-m*.038,tw+m*.044,m*.056,m*.01);ctx.fill();
 ctx.fillStyle='#eef5fa';ctx.fillText(s.chapter,width*.965,height*.075);ctx.restore();
}
function wrap(text,maxW){const words=text.split(' '),lines=[];let line='';for(const w of words){const n=line?line+' '+w:w;if(ctx.measureText(n).width>maxW&&line){lines.push(line);line=w;}else line=n;}if(line)lines.push(line);return lines;}
function subtitle(s,t,{right=0}={}){
 const a=Math.min(1,(t-s.voiceStart+.2)/.3,(s.voiceStart+s.voice+.6-t)/.3);if(a<=0||!s.text)return;
 const m=M();ctx.save();ctx.globalAlpha=clamp(a,0,1);ctx.font=font(500,m*.031);
 const maxW=width*(right?.56:.72),lines=wrap(s.text,maxW),lh=m*.043,bw=Math.max(...lines.map(l=>ctx.measureText(l).width))+m*.05,bh=lines.length*lh+m*.03;
 const cx=right?width*.04+bw/2:width/2,y0=height-m*.05-bh;
 ctx.fillStyle='rgba(6,12,18,.74)';ctx.beginPath();ctx.roundRect(cx-bw/2,y0,bw,bh,m*.012);ctx.fill();
 ctx.fillStyle='#f1f6f9';ctx.textAlign='center';lines.forEach((l,i)=>ctx.fillText(l,cx,y0+m*.015+lh*(i+.78)));ctx.restore();
}
// Bedienkasten wie in der Firmware: Anzeige Restweg, LED rot/grün, NULL gelb, WAHL.
function controlBox(x,y,w,st){
 const h=w*.62,m=M();ctx.save();
 ctx.fillStyle='#2b3238';ctx.strokeStyle='#59656e';ctx.lineWidth=Math.max(2,w*.008);ctx.beginPath();ctx.roundRect(x,y,w,h,w*.04);ctx.fill();ctx.stroke();
 ctx.fillStyle='#9fb0bc';ctx.font=font(600,w*.045);ctx.textAlign='left';ctx.fillText('LASER-POSITIONIERHILFE',x+w*.06,y+h*.13);
 const dx=x+w*.06,dy=y+h*.2,dw=w*.56,dh=h*.36;ctx.fillStyle='#120607';ctx.beginPath();ctx.roundRect(dx,dy,dw,dh,w*.015);ctx.fill();
 ctx.font=font(700,dh*.78,true);ctx.textAlign='right';ctx.fillStyle='#ff3b2e';ctx.shadowColor='#ff3b2e';ctx.shadowBlur=w*.02;ctx.fillText(st.display,dx+dw-w*.03,dy+dh*.8);ctx.shadowBlur=0;
 const led=(cx,on,col,off,label)=>{ctx.fillStyle=on?col:off;if(on){ctx.shadowColor=col;ctx.shadowBlur=w*.04;}ctx.beginPath();ctx.arc(cx,dy+dh*.32,w*.03,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#9fb0bc';ctx.font=font(500,w*.032);ctx.textAlign='center';ctx.fillText(label,cx,dy+dh*.32+w*.075);};
 led(x+w*.72,st.red,'#ff3a2a','#4a1b17','ROT');led(x+w*.86,st.green,'#2ee66a','#173f22','GRÜN');
 const btn=(cx,r,col,label,pressed)=>{ctx.fillStyle='#1a1f23';ctx.beginPath();ctx.arc(cx,y+h*.8,r*1.18,0,Math.PI*2);ctx.fill();ctx.fillStyle=col;if(pressed){ctx.shadowColor=col;ctx.shadowBlur=w*.05;}ctx.beginPath();ctx.arc(cx,y+h*.8+(pressed?r*.08:0),r*(pressed?.92:1),0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#e9eef2';ctx.font=font(600,w*.04);ctx.textAlign='left';ctx.fillText(label,cx+r*1.45,y+h*.8+w*.014);};
 btn(x+w*.12,w*.06,'#f0c419','NULL',st.nullDown);btn(x+w*.52,w*.045,'#c9d2d8','WAHL',st.wahlDown);
 ctx.restore();return h;
}
function boxState(){
 const s=viewer.laserStatus;if(!s?.visible)return{display:'----',red:false,green:false};
 const f=viewer.time-Math.floor(viewer.time);
 const display=s.state==='start'?'----':s.state==='zero'?'0':String(Math.round(s.L-(s.d??0)));
 return{display,red:s.red,green:s.green,nullDown:Math.floor(viewer.time)===2&&f>=laserSpec.zeroAt-.012&&f<laserSpec.zeroAt+.02};
}
function card(s,t){
 const u=(t-s.start)/(s.end-s.start),m=M();
 const g=ctx.createLinearGradient(0,0,0,height);g.addColorStop(0,'#14212b');g.addColorStop(1,'#0b1218');ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
 const w=Math.min(width*.46,m*.95),x=width*.12,y=height*.2;
 const wahl=u>.12&&u<.22,disp=u<.4?'d2-o':'----',nullDown=u>.62&&u<.7;
 const h=controlBox(x,y,w,{display:u>.62&&u<.75?'0':disp,red:u<.62||u>.75,green:false,nullDown,wahlDown:wahl});
 // Erklärungen rechts
 const tx=x+w+m*.08;ctx.textAlign='left';
 const rows=[['Anzeige','Restweg in mm bis zur Mitte der Schildöffnung. 0 = Ziel, minus = zu weit.'],['WAHL','Schalung wählen: d1 … d5 = DN 300 … DN 650–700, o = offen, A = Abschluss. Hier: d2-o = DN 350–400 offen.'],['NULL','Kurz drücken, wenn die rote Linie auf der Anschlussmitte steht. 3 s halten hebt die Nullung auf.'],['LED / Laser','Rot fahren, Grün blinkt kurz vor dem Ziel, Dauergrün = stoppen.']];
 let yy=y+m*.02;for(const [k,v] of rows){ctx.fillStyle='#62b7ec';ctx.font=font(600,m*.03);ctx.fillText(k,tx,yy);ctx.fillStyle='#d9e5ec';ctx.font=font(400,m*.026);for(const l of wrap(v,width-tx-width*.05)){yy+=m*.036;ctx.fillText(l,tx,yy);}yy+=m*.05;}
 ctx.fillStyle='#8fa6b5';ctx.font=font(400,m*.024);ctx.fillText('Strom und Daten über 4 freie Adern im Roboterkabel: 24 V · 0 V · RS-485 A/B',x,y+h+m*.07);
}

// ---------------- Szenen ----------------
let modeKey=null;
function setScene(kind,s){
 const key=kind==='asm'?`asm-${!!s.robot}`:`use-${!!s.inside}-${!!s.hideRobot}`;if(key===modeKey)return;modeKey=key;
 if(kind==='asm'){
  viewer.mode='explore';viewer.setMode('explore');viewer.setSections({pipe:true,hideRobot:!s.robot,holder:false,shield:false,hideBladder:false});
  viewer.explode=viewer.targetExplode=0;viewer.updateParts();viewer.resetPose();viewer.travelPose();viewer.feed.visible=false;viewer.floor.visible=false;
  for(const p of viewer.parts)p.node.visible=true;
  viewer.winding.group.visible=viewer.inlet.visible=viewer.sensor.visible=true;
  L.group.visible=true;L.pose(viewer.upperLift??-70.56,0,{visible:false});
  if(viewer.robot?.laserLine)viewer.robot.laserLine.visible=!!s.robot;
 }else{
  viewer.mode='process';viewer.setMode('process');viewer.setSections({pipe:!s.inside,shield:false,hideBladder:false,hideRobot:!!s.hideRobot,holder:false});
 }
}
function processTime(s,u){if(s.ease==='late'){const k=u<.55?u/.55*.62:.62+(u-.55)/.45*.38;return lerp(s.a,s.b,k);}return lerp(s.a,s.b,u);}
function poseAsm(s,t){
 const idx=asm.indexOf(s),u=clamp((t-s.start)/(s.end-s.start),0,1);setScene('asm',s);
 placeItems(idx,t);
 let d=0;if(s.demo==='deflection'){const t0=s.start+2.4,k=t-t0;if(k>0&&k<5.4)d=3+9*Math.sin(k/5.4*Math.PI*2*1.5-Math.PI/6)*Math.sin(Math.PI*k/5.4);}
 deflect(d);
 if(s.demo==='swap'){const w=items.wischleiste_vorn,t1=s.start+4.6;const out=smooth((t-t1)/1.0),back=smooth((t-t1-1.6)/1.0);if(t>t1){w.mesh.position.copy(w.base).add(V(0,0,-75*(out-back)));w.mesh.material.emissive.set(back>0?'#e0a23a':'#000000');w.mesh.material.emissiveIntensity=.5*back*(1-smooth((t-t1-2.8)/1));}}
 const cables=!!s.cables||idx>asm.findIndex(x=>x.cables);for(const c of ['spiral','feedSpiral','sensorCable'])L[c].visible=cables;
 head.position.y=viewer.upperLift??-70.56;wheelG.rotation.z=0;for(const l of lens)l.material.color.set(l===lens[0]?'#5a1d18':'#173f22');
 const e=smooth(u);camera.position.copy(V(...s.pos).lerp(V(...(s.pos2||s.pos)),e));camera.up.set(0,1,0);camera.fov=s.fov||30;camera.updateProjectionMatrix();camera.lookAt(V(...s.target).lerp(V(...(s.target2||s.target)),e));camera.updateMatrixWorld();
 viewer.inspectionLamp.visible=false;lamp.visible=false;fill.visible=true;for(const l of shop)l.visible=true;for(const l of sun)l.visible=true;
 scene.background=shopBg;renderer.toneMappingExposure=1.2;
}
function poseUse(s,t){
 const u=clamp((t-s.start)/(s.end-s.start),0,1),e=smooth(u);setScene('use',s);
 placeItems(null,t);deflect(0);
 viewer.model.visible=true;viewer.explode=viewer.targetExplode=0;viewer.ambientClock=t;
 viewer.time=processTime(s,u);viewer.updateParts();viewer.processPose();viewer.floor.visible=false;
 head.position.y=viewer.upperLift;wheelG.rotation.z=-viewer.model.position.x/31.83;
 const st=viewer.laserStatus;lens[0].material.color.set(st?.red?'#ff3a2a':'#5a1d18');lens[1].material.color.set(st?.green?'#2ee66a':'#173f22');
 let pos,target;
 if(s.ride){const x=viewer.model.position.x;pos=V(x+s.cam[0],s.cam[1],s.cam[2]);target=V(x+s.look[0],s.look[1]===-12?R-12:s.look[1],s.look[2]);}
 else{target=V(...s.target).lerp(V(...(s.target2||s.target)),e);pos=V(...s.pos).lerp(V(...(s.pos2||s.pos)),e);}
 camera.position.copy(pos);camera.up.set(0,1,0);camera.fov=s.fov??(s.inside?66:38);L.fanMaterial.opacity=s.inside?.03:.05;camera.updateProjectionMatrix();camera.lookAt(target);camera.updateMatrixWorld();
 viewer.inspectionLamp.visible=true;lamp.visible=!!s.inside;fill.visible=!s.inside;for(const l of shop)l.visible=false;for(const l of sun)l.visible=!s.inside||l.isHemisphereLight;
 scene.background=s.inside?insideBg:darkBg;renderer.toneMappingExposure=s.inside?1.5:1.25;
}
function frame(t){
 ctx.clearRect(0,0,width,height);
 const s=shots.find(s=>t>=s.start&&t<s.end)||shots[shots.length-1];
 if(s.type==='brand'){brand(s,t);subtitle(s,t);return canvas.toDataURL('image/jpeg',.92).split(',')[1];}
 if(s.type==='card'){card(s,t);chapter(s,t);subtitle(s,t);}
 else{
  if(s.type==='asm')poseAsm(s,t);else poseUse(s,t);
  draw();ctx.drawImage(renderer.domElement,0,0,width,height);
  const lw=width*.15,pad=width*.03;ctx.globalAlpha=.92;ctx.drawImage(logo,pad,pad,lw,lw*logo.height/logo.width);ctx.globalAlpha=1;
  chapter(s,t);
  if(s.box){const m=M(),w=m*.52;controlBox(width-w-width*.035,height-w*.62-m*.05,w,boxState());subtitle(s,t,{right:true});}
  else subtitle(s,t);
 }
 const fade=Math.min(1,(t-s.start)/.25,(s.end-t)/.25);if(fade<1){ctx.fillStyle=`rgba(6,12,18,${(1-fade)*.85})`;ctx.fillRect(0,0,width,height);}
 return canvas.toDataURL('image/jpeg',.92).split(',')[1];
}
window.film={frame,shots,duration:TL.duration,width,height};window.ready=true;
