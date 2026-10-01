import * as THREE from 'three';
import {Viewer} from '../src/model.js';
import {groupInfo} from '../src/data.js';

// Motion video (Reel 1080 × 1920) about the DSS-Flex formwork: turntable, exploded
// view, the four assemblies one by one, bladders inflating, back together.
// Built from the current src/model.js (DN 400); robot hidden, no pipe context.
Viewer.prototype.animate=function(){};
const host=document.querySelector('#scene'),canvas=document.querySelector('#film'),ctx=canvas.getContext('2d');
const viewer=new Viewer(host,()=>{});
viewer.build(400);viewer.setMode('explore');viewer.setTheme(true);viewer.controls.enabled=false;
viewer.setSections({hideRobot:true,pipe:false,shield:false,holder:false});
const renderer=viewer.renderer,scene=viewer.scene,camera=viewer.camera;
renderer.setPixelRatio(1);renderer.toneMappingExposure=1.35;viewer.floor.visible=false;
// Studio look: dark blue backdrop with a soft spot behind the product, rim lights.
const bg=document.createElement('canvas');bg.width=bg.height=1024;
{const g=bg.getContext('2d'),r=g.createRadialGradient(512,430,30,512,512,760);r.addColorStop(0,'#24384a');r.addColorStop(.5,'#101b25');r.addColorStop(1,'#04070a');g.fillStyle=r;g.fillRect(0,0,1024,1024);}
const bgTex=new THREE.CanvasTexture(bg);bgTex.colorSpace=THREE.SRGBColorSpace;scene.background=bgTex;
const rimL=new THREE.DirectionalLight('#7fb8ff',1.6);rimL.position.set(-900,500,-700);
const rimR=new THREE.DirectionalLight('#ffd6a0',1.0);rimR.position.set(900,300,-500);scene.add(rimL,rimR);
camera.near=5;camera.far=20000;
const logo=new Image();logo.src='logo.png';await logo.decode();

const clamp=THREE.MathUtils.clamp,lerp=THREE.MathUtils.lerp,smooth=x=>(x=clamp(x,0,1))*x*(3-2*x),ease=x=>(x=clamp(x,0,1))<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const DURATION=30;
// Shots: explode amount, visible group, bladder unwinding/inflation, orbit angle and distance.
const groups=['s','h','z','u'];
function state(t){
 const S={group:'all',explode:0,ext:0,inf:0,seal:0,yaw:-.6+t*.11,pitch:.32,dist:1,label:null};
 if(t<8){S.dist=lerp(1.25,1,ease((t-2)/6));}
 else if(t<12){S.explode=ease((t-8)/3);S.dist=1.18;S.label={title:'4 Baugruppen',sub:'Schalung · Halteeinheit · Zentraleinheit · Unterteil',t0:8.6,t1:11.8};}
 else if(t<20){const i=Math.min(3,Math.floor((t-12)/2)),g=groups[i];S.group=g;S.explode=.55;S.dist=1.02;S.pitch=.3;
  S.label={title:groupInfo[g].name,sub:teaser[g],t0:12+i*2+.15,t1:12+i*2+1.9,color:groupInfo[g].color};}
 else if(t<21.2){S.explode=1-ease((t-20)/1.2);S.dist=1.05;}
 else if(t<27){const u=(t-21.2)/5.8;S.ext=smooth(u/.45);S.inf=smooth((u-.45)/.4);S.seal=smooth(u/.35);S.dist=1.12;S.pitch=.38;
  S.label={title:'Dichtblase & Anschlussblase',sub:'Abdichten · Anschluss freihalten',t0:21.6,t1:26.6};}
 else {S.ext=1-smooth((t-27)/1.2);S.inf=1-smooth((t-27)/.8);S.seal=1-smooth((t-27)/1);S.dist=1.1;S.label={title:'DN 300 – DN 700',sub:'Eine Schalung für fünf Baugrößen',t0:27.2,t1:30};}
 return S;
}
const teaser={s:'Schild · Dichtblase · Träger',h:'Haltebleche · Blasenwelle',z:'Zentralrohr · Klappvorrichtung',u:'Bumper · Stützplatte · Distanzstücke'};
let width=1080,height=1920,ss=1;
function configure(w,h,s=1){width=w;height=h;ss=s;canvas.width=w;canvas.height=h;host.style.width=w+'px';host.style.height=h+'px';renderer.setSize(w*ss,h*ss,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
const font=(w,s)=>`${w} ${Math.round(s)}px "Segoe UI","Helvetica Neue",Arial,sans-serif`;
let fitBox=null;
function pose(S,t){
 viewer.group=S.group;viewer.explode=viewer.targetExplode=S.explode;viewer.ambientClock=t;
 viewer.resetPose();viewer.updateParts();viewer.poseSeal(S.seal);viewer.poseMechanism(S.ext,S.inf,0);
 viewer.model.updateMatrixWorld(true);
 const b=viewer.bounds(),c=b.getCenter(new THREE.Vector3()),r=b.getSize(new THREE.Vector3()).length()/2;
 // Fit to the narrower field of view (the width in portrait).
 const vf=THREE.MathUtils.degToRad(camera.fov),hf=2*Math.atan(Math.tan(vf/2)*camera.aspect),d=r/Math.sin(Math.min(vf,hf)/2)*S.dist*.8;
 c.y-=r*.32; // product in the upper part, captions below
 camera.position.set(c.x+d*Math.cos(S.pitch)*Math.sin(S.yaw),c.y+d*Math.sin(S.pitch),c.z+d*Math.cos(S.pitch)*Math.cos(S.yaw));
 camera.lookAt(c);camera.updateMatrixWorld();
}
function overlay(t,S){
 const m=Math.min(width,height),pad=width*.07;
 // Logo top left all the time.
 const lw=width*.3;ctx.save();ctx.globalAlpha=.95;ctx.drawImage(logo,pad,pad*.9,lw,lw*logo.height/logo.width);ctx.restore();
 if(S.label){const a=smooth((t-S.label.t0)/.35)*(1-smooth((t-S.label.t1+.35)/.35));if(a>0){
  const y=height*.79,slide=(1-a)*width*.08;ctx.save();ctx.globalAlpha=a;
  ctx.fillStyle=S.label.color||'#6cc0f2';ctx.fillRect(pad-slide,y-m*.11,m*.012,m*.17);
  const maxW=width-pad*2-m*.05,fit=(txt,w,s)=>{ctx.font=font(w,s);const k=Math.min(1,maxW/ctx.measureText(txt).width);ctx.font=font(w,s*k);};
  ctx.fillStyle='#f2f7fb';fit(S.label.title,700,m*.075);ctx.textAlign='left';ctx.fillText(S.label.title,pad+m*.04-slide,y-m*.03);
  ctx.fillStyle='#9fc0d6';fit(S.label.sub,400,m*.042);ctx.fillText(S.label.sub,pad+m*.04-slide,y+m*.035);ctx.restore();}}
 // Thin progress line at the bottom.
 ctx.fillStyle='rgba(108,192,242,.75)';ctx.fillRect(0,height-m*.008,width*t/DURATION,m*.008);
}
function card(t,outro){
 const u=outro?(t-(DURATION-3))/3:t/2.4,a=smooth(u*3),m=Math.min(width,height),cx=width/2;
 const g=ctx.createRadialGradient(cx,height*.45,m*.05,cx,height*.5,height*.75);g.addColorStop(0,'#1b3042');g.addColorStop(.6,'#0b141d');g.addColorStop(1,'#04070a');ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
 ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<6;i++){ctx.strokeStyle=`rgba(80,170,230,${.06-.008*i})`;ctx.lineWidth=m*.005;ctx.beginPath();ctx.arc(cx,height*.4,m*(.2+i*.11)+u*m*.04,0,Math.PI*2);ctx.stroke();}ctx.restore();
 const lw=width*.74,lh=lw*logo.height/logo.width;ctx.save();ctx.globalAlpha=a;ctx.drawImage(logo,cx-lw/2,height*.36-lh/2-(1-a)*m*.03,lw,lh);
 const b=smooth((u-.25)*3);ctx.globalAlpha=b;ctx.textAlign='center';ctx.fillStyle='#eef5fa';ctx.font=font(700,m*.085);
 ctx.fillText(outro?'DSS-Flex Verfahren':'Die DSS-Flex',cx,height*.53);ctx.fillText(outro?'':'Schalung',cx,height*.53+m*.1);
 ctx.fillStyle='#6cc0f2';ctx.fillRect(cx-m*.08*b,height*(outro?.565:.665),m*.16*b,m*.006);
 ctx.font=font(400,m*.045);ctx.fillStyle='#b5cad9';ctx.fillText(outro?'Präzision für die Kanalsanierung.':'Stutzensanierung ohne Aufgraben',cx,height*(outro?.62:.72));
 if(outro){ctx.font=font(600,m*.04);ctx.fillStyle='#6cc0f2';ctx.fillText('ditom-kanaltechnik.de',cx,height*.86);}
 ctx.restore();
 const black=outro?smooth((t-DURATION+.5)/.5):1-smooth(t/.4);if(black>0){ctx.fillStyle=`rgba(0,0,0,${black})`;ctx.fillRect(0,0,width,height);}
}
function frame(t){
 ctx.clearRect(0,0,width,height);
 if(t<2.4||t>=DURATION-3){card(t,t>=DURATION-3);return canvas.toDataURL('image/jpeg',.93).split(',')[1];}
 const S=state(t);pose(S,t);renderer.render(scene,camera);ctx.drawImage(renderer.domElement,0,0,width,height);
 // Soft cross-dissolve out of and into the cards.
 const fade=Math.min(1,(t-2.4)/.5,(DURATION-3-t)/.5);if(fade<1){ctx.fillStyle=`rgba(4,8,12,${1-fade})`;ctx.fillRect(0,0,width,height);}
 overlay(t,S);
 return canvas.toDataURL('image/jpeg',.93).split(',')[1];
}
window.film={configure,frame,duration:DURATION,viewer,debug:{lite(){}}};window.ready=true;
