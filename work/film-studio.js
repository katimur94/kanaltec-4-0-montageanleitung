import * as THREE from 'three';
import {Viewer} from '../src/model.js';
import {millingState,millingTarget} from '../src/milling.js';
import {breakoutContour,branchBottom} from '../src/repair.js';
import {passage} from '../src/bladder.js';

// Offline film renderer: same physical process as the website, no UI/explosion.
Viewer.prototype.animate=function(){};
const host=document.querySelector('#scene'),canvas=document.querySelector('#film'),ctx=canvas.getContext('2d');
const viewer=new Viewer(host,()=>{});viewer.build(400);viewer.mode='process';viewer.setMode('process');
viewer.controls.enabled=false;viewer.renderer.setPixelRatio(1);viewer.renderer.toneMappingExposure=1.25;
viewer.setTheme(true);viewer.floor.visible=false;
const fillLight=new THREE.DirectionalLight('#e3efff',1.5);fillLight.position.set(100,-240,600);viewer.scene.add(fillLight);
const logo=new Image();logo.src='logo.png';await logo.decode();
let width=1920,height=1080;
const lerp=THREE.MathUtils.lerp,clamp=THREE.MathUtils.clamp,smooth=x=>(x=clamp(x,0,1))*x*(3-2*x);
const shots=[
 {start:3,end:8,a:0,b:.119,key:'Schaden',pos:[-165,45,640],target:[0,180,0]},
 {start:8,end:14,a:.12,b:.40,key:'Zurückfräsen',pos:[210,50,660],target:[-20,165,0]},
 {start:14,end:20,a:.43,b:.832857142857,key:'Drehmodul',pos:[-420,180,1350],target:[-230,60,0]},
 {start:20,end:21,a:.832857142857,b:.9,key:'Rundfräsen',pos:[-130,-75,680],target:[-10,180,0]},
 {start:21,end:25,a:1,b:1.999,key:'Werkzeugwechsel',pos:[-190,40,820],target:[-100,100,0]},
 {start:25,end:29,a:2,b:2.999,key:'Positionieren',pos:[-370,280,1150],target:[-110,105,0]},
 {start:29,end:33,a:3,b:3.999,key:'Anpressen',pos:[310,80,840],target:[0,125,0]},
 {start:33,end:37,a:4,b:4.999,key:'Abdichten',pos:[310,80,840],target:[0,125,0]},
 {start:37,end:45,a:5,b:5.999,key:'Anschlussblase',pos:[-210,190,660],target:[0,225,0],shield:true},
 {start:45,end:49,a:6,b:6.3,key:'Opferschlauch',pos:[-340,-70,840],target:[-180,60,0]},
 {start:49,end:60,a:6.3,b:6.999,key:'Verpressen',pos:[-240,360,1020],target:[0,300,0],shield:true,hideBladder:true},
 {start:60,end:62,a:7,b:7.99,key:'Aushärten',pos:[-220,370,1050],target:[0,300,0],shield:true,hideBladder:true},
 {start:62,end:68,a:8,b:8.999,key:'Ausschalen',pos:[190,90,850],target:[0,140,0]},
 {start:68,end:70,a:8.999,b:8.999,key:'Freier Anschluss',pos:[-15,-130,30],target:[0,220,0],inside:true},
 {start:70,end:73,a:8.999,b:8.999,key:'Verpressung im Erdreich',pos:[380,620,1030],target:[0,325,0],repairOnly:true}
];
function configure(w,h){width=w;height=h;canvas.width=w;canvas.height=h;host.style.width=w+'px';host.style.height=h+'px';viewer.renderer.setSize(w,h);viewer.camera.aspect=w/h;viewer.camera.updateProjectionMatrix();}
function brand(t,outro){
 const u=outro?(t-73)/5:t/3,fade=smooth(u*4),cx=width/2;
 const g=ctx.createLinearGradient(0,0,width,height);g.addColorStop(0,'#0b131d');g.addColorStop(1,'#1b3041');ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
 ctx.strokeStyle='rgba(32,135,198,.13)';ctx.lineWidth=width*.014;
 for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(width*.82,height*.28,Math.min(width,height)*(.3+i*.17)+u*22,0,Math.PI*2);ctx.stroke();}
 const lw=Math.min(width*.58,1000)*(0.96+.04*fade),lh=lw*logo.height/logo.width,pad=width*.035;
 ctx.save();ctx.globalAlpha=fade;ctx.drawImage(logo,pad,pad+(1-fade)*18,lw,lh);ctx.restore();
 ctx.textAlign='center';ctx.fillStyle='#edf5fa';ctx.font=`600 ${Math.round(Math.min(width*.066,88))}px Arial`;
 ctx.fillText('DSS-Flex Verfahren',cx,height*.58);
 ctx.font=`400 ${Math.round(Math.min(width*.034,38))}px Arial`;ctx.fillStyle='#adc5d6';
 ctx.fillText(outro?'Präzision für die Kanalsanierung.':'Fräsen. Vorbereiten. Sanieren.',cx,height*.68);
 if(outro){ctx.font=`400 ${Math.round(Math.min(width*.032,30))}px Arial`;ctx.fillStyle='#62b7ec';ctx.fillText('ditom-kanaltechnik.de',cx,height*.9);}
}
function frame(t){
 ctx.clearRect(0,0,width,height);
 if(t<3||t>=73){brand(t,t>=73);return canvas.toDataURL('image/jpeg',.93).split(',')[1];}
 const s=shots.find(s=>t>=s.start&&t<s.end),u=clamp((t-s.start)/(s.end-s.start),0,1),time=lerp(s.a,s.b,u);
 viewer.model.visible=true;viewer.explode=viewer.targetExplode=0;
 const sectionKey=[s.inside,s.shield,s.hideBladder].join(',');
 if(viewer.filmSectionKey!==sectionKey){viewer.setSections({pipe:!s.inside,shield:!!s.shield,hideBladder:!!s.hideBladder,hideRobot:false,holder:false});viewer.filmSectionKey=sectionKey;}
 viewer.time=time;viewer.updateParts();viewer.processPose();viewer.floor.visible=false;
 const target=new THREE.Vector3(...s.target),pos=new THREE.Vector3(...s.pos),portrait=width<height;
 if(!s.inside){
  // Reframe each aspect ratio; no destructive crop of the operating tool.
  const delta=pos.clone().sub(target),factor=portrait?(s.key==='Drehmodul'?2.15:s.key==='Rundfräsen'?1.95:1.7):1;delta.multiplyScalar(factor*(1.035-.07*smooth(u)));
  delta.applyAxisAngle(new THREE.Vector3(0,1,0),(u-.5)*.08);pos.copy(target).add(delta);
 }
 viewer.camera.position.copy(pos);viewer.camera.up.set(0,1,0);viewer.camera.fov=s.inside?(portrait?65:60):38;viewer.camera.updateProjectionMatrix();viewer.camera.lookAt(target);
 viewer.inspectionLamp.visible=true;
 if(s.inside||s.repairOnly)viewer.model.visible=false;
 viewer.renderer.render(viewer.scene,viewer.camera);ctx.drawImage(viewer.renderer.domElement,0,0,width,height);
 // A transparent original logo stays discreetly visible during the process.
 const lw=portrait?width*.27:width*.16,lh=lw*logo.height/logo.width,pad=width*.03,x=pad,y=pad;
 ctx.drawImage(logo,x,y,lw,lh);
 const fade=Math.min(1,(t-s.start)/.18,(s.end-t)/.18);if(fade<1){ctx.fillStyle=`rgba(10,20,27,${(1-fade)*.85})`;ctx.fillRect(0,0,width,height);}
 return canvas.toDataURL('image/jpeg',.93).split(',')[1];
}
window.film={configure,frame,shots,duration:78};window.ready=true;
