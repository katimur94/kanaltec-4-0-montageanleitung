import * as THREE from 'three';
import {Viewer} from '../src/model.js';

// Offline process films. Case selection precedes model construction, so all
// geometry and physical poses come from the same implementation as the website.
Viewer.prototype.animate=function(){};
const kind=new URLSearchParams(location.search).get('kind')==='pipe'?'pipe':'closure';
const title=kind==='pipe'?'Loch verschließen':'Anschluss verschließen';
const host=document.querySelector('#scene'),canvas=document.querySelector('#film'),ctx=canvas.getContext('2d');
const viewer=new Viewer(host,()=>{});
viewer.repairOptions={kind,milling:false,infiltration:true,cavity:'large'};
viewer.build(400);viewer.mode='process';viewer.setMode('process');
viewer.controls.enabled=false;viewer.renderer.setPixelRatio(1);viewer.renderer.toneMappingExposure=1.25;
viewer.setTheme(true);viewer.floor.visible=false;
const light=new THREE.DirectionalLight('#e3efff',1.5);light.position.set(100,-240,600);viewer.scene.add(light);
const logo=new Image();logo.src='logo.png';await logo.decode();
const width=1920,height=1080,duration=60;
canvas.width=width;canvas.height=height;viewer.renderer.setSize(width,height);viewer.camera.aspect=width/height;
const lerp=THREE.MathUtils.lerp,clamp=THREE.MathUtils.clamp,smooth=x=>(x=clamp(x,0,1))*x*(3-2*x);
const fillY=kind==='closure'?(200+viewer.branchTop)/2:290;
const fillDistance=kind==='closure'?Math.max(1100,(viewer.branchTop-170)*1.75):1050;
const shots=[
 {start:3,end:8,a:2,b:2,key:'Schadstelle mit Infiltration',pos:[-165,70,740],target:[0,220,0],repairOnly:true},
 {start:8,end:15,a:2,b:2.999,key:'Einfüllstutzen mittig positionieren',pos:[-340,90,980],target:[-35,145,0]},
 {start:15,end:20,a:3,b:3.999,key:'Geschlossene Schalung anpressen',pos:[290,60,900],target:[40,130,0]},
 {start:20,end:24,a:4,b:4.999,key:'Abdichten',pos:[-200,100,810],target:[30,175,0]},
 {start:24,end:27,a:5,b:5.999,key:'Welle ohne Anschlussblase',pos:[-210,0,610],target:[60,115,0],shield:true},
 {start:27,end:31,a:6,b:6.3,key:'Mörtelzufuhr',pos:[-300,-65,860],target:[-150,60,0]},
 {start:31,end:43,a:6.3,b:6.999,key:'Verpressen',pos:[-240,fillY+80,fillDistance],target:[0,fillY,0],shield:true},
 {start:43,end:46,a:7,b:7.999,key:'Aushärten',pos:[-220,fillY+80,fillDistance],target:[0,fillY,0],shield:true},
 {start:46,end:51,a:8.63,b:8.999,key:'Ausschalen',pos:[220,65,880],target:[30,140,0]},
 {start:51,end:54,a:8.999,b:8.999,key:'Geschlossene Reparaturfläche',pos:[-15,-120,30],target:[30,200,0],inside:true},
 {start:54,end:57,a:8.999,b:8.999,key:'Vollständige Verpressung',pos:[310,fillY+160,fillDistance],target:[0,fillY,0],repairOnly:true}
];
function brand(t,outro){
 const u=outro?(t-57)/3:t/3,fade=smooth(u*4),cx=width/2;
 const g=ctx.createLinearGradient(0,0,width,height);g.addColorStop(0,'#0b131d');g.addColorStop(1,'#1b3041');ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
 ctx.strokeStyle='rgba(32,135,198,.13)';ctx.lineWidth=width*.014;
 for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(width*.82,height*.28,Math.min(width,height)*(.3+i*.17)+u*22,0,Math.PI*2);ctx.stroke();}
 const lw=850*(.96+.04*fade),lh=lw*logo.height/logo.width,pad=width*.035;
 ctx.save();ctx.globalAlpha=fade;ctx.drawImage(logo,pad,pad+(1-fade)*18,lw,lh);ctx.restore();
 ctx.textAlign='center';ctx.fillStyle='#edf5fa';ctx.font='600 82px Arial';ctx.fillText(title,cx,height*.55);
 ctx.font='400 38px Arial';ctx.fillStyle='#adc5d6';ctx.fillText('DSS-Flex · Geschlossene Schalung',cx,height*.65);
 ctx.font='400 29px Arial';ctx.fillStyle='#62b7ec';
 ctx.fillText(outro?'ditom-kanaltechnik.de':'Ohne Einragung direkt verpressen',cx,height*.85);
}
function frame(t){
 ctx.clearRect(0,0,width,height);
 if(t<3||t>=57){brand(t,t>=57);return canvas.toDataURL('image/jpeg',.93).split(',')[1];}
 const s=shots.find(s=>t>=s.start&&t<s.end),u=clamp((t-s.start)/(s.end-s.start),0,1);
 viewer.model.visible=true;viewer.explode=viewer.targetExplode=0;
 const sectionKey=[s.inside,s.shield].join(',');
 if(viewer.filmSectionKey!==sectionKey){viewer.setSections({pipe:!s.inside,shield:!!s.shield,hideBladder:false,hideRobot:false,holder:false});viewer.filmSectionKey=sectionKey;}
 viewer.setProcess(lerp(s.a,s.b,u));viewer.updateParts();viewer.processPose();viewer.floor.visible=false;
 const target=new THREE.Vector3(...s.target),pos=new THREE.Vector3(...s.pos);
 if(!s.inside){const delta=pos.clone().sub(target).multiplyScalar(1.025-.05*smooth(u));delta.applyAxisAngle(new THREE.Vector3(0,1,0),(u-.5)*.08);pos.copy(target).add(delta);}
 viewer.camera.position.copy(pos);viewer.camera.up.set(0,1,0);viewer.camera.fov=s.inside?60:38;viewer.camera.updateProjectionMatrix();viewer.camera.lookAt(target);
 viewer.inspectionLamp.visible=true;if(s.inside||s.repairOnly)viewer.model.visible=false;
 viewer.renderer.render(viewer.scene,viewer.camera);ctx.drawImage(viewer.renderer.domElement,0,0,width,height);
 const lw=width*.16,pad=width*.03;ctx.drawImage(logo,pad,pad,lw,lw*logo.height/logo.width);
 const fade=Math.min(1,(t-s.start)/.18,(s.end-t)/.18);if(fade<1){ctx.fillStyle=`rgba(10,20,27,${(1-fade)*.85})`;ctx.fillRect(0,0,width,height);}
 return canvas.toDataURL('image/jpeg',.93).split(',')[1];
}
window.film={frame,shots,duration,kind,title,width,height,branchTop:viewer.branchTop};window.ready=true;
