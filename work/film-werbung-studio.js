import * as THREE from 'three';
import {Viewer} from '../src/model.js';

// DSS-Flex commercial (Reel 1080 × 1920, 25 s): motion graphics over scenes of the
// complete-process film (footage/…, extracted JPG sequences) plus a live 3D product
// reveal from src/model.js. Cuts and hits sit on a 120 BPM grid (0.5 s per beat).
Viewer.prototype.animate=function(){};
const host=document.querySelector('#scene'),canvas=document.querySelector('#film'),ctx=canvas.getContext('2d');
const W=1080,H=1920,DURATION=25;canvas.width=W;canvas.height=H;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),lerp=(a,b,t)=>a+(b-a)*t,smooth=x=>(x=clamp(x))*x*(3-2*x);
const outBack=x=>{x=clamp(x);const c=1.9;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2);},outExpo=x=>(x=clamp(x))>=1?1:1-Math.pow(2,-10*x),inExpo=x=>(x=clamp(x))<=0?0:Math.pow(2,10*x-10);
const C={red:'#e2231a',blue:'#2b8fe0',cyan:'#6cc0f2',navy:'#060c13',white:'#f4f8fb',yellow:'#f2c230'};
const font=(w,s)=>`${w} ${Math.round(s)}px "Arial Black","Segoe UI Black","Helvetica Neue",Arial,sans-serif`;
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};

// ---------- 3D product ----------
const viewer=new Viewer(host,()=>{});viewer.build(400);viewer.setMode('explore');viewer.setTheme(true);viewer.controls.enabled=false;
viewer.setSections({hideRobot:true,pipe:false,shield:false,holder:false});
const renderer=viewer.renderer,scene=viewer.scene,camera=viewer.camera;
renderer.setPixelRatio(1);renderer.setClearColor(0x000000,0);scene.background=null;renderer.toneMappingExposure=1.45;viewer.floor.visible=false;
const rim1=new THREE.DirectionalLight('#5fb0ff',2.2);rim1.position.set(-900,400,-800);const rim2=new THREE.DirectionalLight('#ff8a5a',1.2);rim2.position.set(900,200,-600);scene.add(rim1,rim2);
camera.near=5;camera.far=20000;const R3=.6667;renderer.setSize(W*R3,H*R3,false);camera.aspect=W/H;camera.updateProjectionMatrix();
function product(t,{yaw,pitch=.3,dist=1,explode=0}){
 viewer.group='all';viewer.explode=viewer.targetExplode=explode;viewer.ambientClock=t;viewer.resetPose();viewer.updateParts();viewer.poseSeal(0);viewer.poseMechanism(0,0,0);viewer.model.updateMatrixWorld(true);
 const b=viewer.bounds(),c=b.getCenter(new THREE.Vector3()),r=b.getSize(new THREE.Vector3()).length()/2,vf=THREE.MathUtils.degToRad(camera.fov),hf=2*Math.atan(Math.tan(vf/2)*camera.aspect);
 const d=r/Math.sin(Math.min(vf,hf)/2)*dist*.74;
 camera.position.set(c.x+d*Math.cos(pitch)*Math.sin(yaw),c.y+d*Math.sin(pitch),c.z+d*Math.cos(pitch)*Math.cos(yaw));camera.lookAt(c);camera.updateMatrixWorld();
 renderer.render(scene,camera);return renderer.domElement;
}

// ---------- footage ----------
const counts={roots:58,mill:90,debris:65,truck2:63,crane:80,shaft:80,land:70,press2:59,seal:75,grout:110,free:45,ground:70};
const cache=new Map();
async function img(src){if(cache.has(src))return cache.get(src);const i=new Image();i.src=src;await i.decode();cache.set(src,i);if(cache.size>40)cache.delete(cache.keys().next().value);return i;}
async function clip(name,lt,speed=1,start=0){const n=counts[name],k=clamp(Math.floor(start+lt*25*speed),0,n-1)+1;return img(`footage/${name}/${String(k).padStart(4,'0')}.jpg`);}
// Cover-draw with zoom (crops the logo baked into the footage), offset and rotation.
function cover(im,{zoom=1.32,x=0,y=0,rot=0,alpha=1}={}){ctx.save();ctx.globalAlpha=alpha;ctx.translate(W/2+x,H/2+y);ctx.rotate(rot);const s=Math.max(W/im.width,H/im.height)*zoom;ctx.drawImage(im,-im.width*s/2,-im.height*s/2,im.width*s,im.height*s);ctx.restore();}
const buf=document.createElement('canvas');buf.width=W;buf.height=H;const bctx=buf.getContext('2d');
// Glitch: horizontal slices displaced plus red/cyan ghost copies.
function glitch(amount,seed){if(amount<=0)return;bctx.clearRect(0,0,W,H);bctx.drawImage(canvas,0,0);
 ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.55*amount;ctx.filter='sepia(1) saturate(8) hue-rotate(-50deg)';ctx.drawImage(buf,18*amount,0);ctx.filter='sepia(1) saturate(8) hue-rotate(150deg)';ctx.drawImage(buf,-18*amount,0);ctx.restore();ctx.filter='none';
 const n=Math.round(10*amount);for(let i=0;i<n;i++){const y=hash(seed+i)*H,h=20+hash(seed+i+.5)*140,dx=(hash(seed+i+.7)-.5)*220*amount;ctx.drawImage(buf,0,y,W,h,dx,y,W,h);}}
function flash(a,color='#ffffff'){if(a<=0)return;ctx.save();ctx.globalAlpha=clamp(a);ctx.fillStyle=color;ctx.fillRect(0,0,W,H);ctx.restore();}
function shade(a,color=C.navy){ctx.save();ctx.globalAlpha=a;ctx.fillStyle=color;ctx.fillRect(0,0,W,H);ctx.restore();}
function vignette(k=.75){const g=ctx.createRadialGradient(W/2,H*.45,H*.2,W/2,H/2,H*.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(0,0,0,${k})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
// Kinetic word: scale/slide/alpha with optional outline and glow.
function word(text,x,y,size,{color=C.white,weight=900,scale=1,alpha=1,align='center',outline=false,glow=0,track=0,maxW=W*.88,skew=0}={}){
 if(alpha<=0)return;ctx.save();ctx.globalAlpha=clamp(alpha);ctx.translate(x,y);ctx.transform(1,0,skew,1,0,0);ctx.scale(scale,scale);ctx.font=font(weight,size);ctx.textAlign=align;ctx.textBaseline='middle';
 if('letterSpacing' in ctx)ctx.letterSpacing=`${track}px`;const w=ctx.measureText(text).width;if(w>maxW){const k=maxW/w;ctx.scale(k,k);}
 ctx.fillStyle=color;if(glow){ctx.shadowColor=color;ctx.shadowBlur=glow;}
 if(outline){ctx.lineWidth=size*.035;ctx.strokeStyle=color;ctx.strokeText(text,0,0);}else ctx.fillText(text,0,0);ctx.restore();}
function bar(x,y,w,h,color,rot=-.22,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(rot);ctx.fillStyle=color;ctx.fillRect(-w/2,-h/2,w,h);ctx.restore();}
function rings(cx,cy,u,color=C.cyan,n=4){ctx.save();for(let i=0;i<n;i++){const k=clamp(u*1.25-i*.12);if(k<=0||k>=1)continue;ctx.globalAlpha=(1-k)*.9;ctx.strokeStyle=color;ctx.lineWidth=18*(1-k)+2;ctx.beginPath();ctx.arc(cx,cy,W*.08+k*W*.9,0,Math.PI*2);ctx.stroke();}ctx.restore();}
function speedLines(cx,cy,a,seed=1,n=70){if(a<=0)return;ctx.save();ctx.globalAlpha=a;ctx.strokeStyle='#cfe8ff';for(let i=0;i<n;i++){const ang=hash(seed+i)*Math.PI*2,r0=W*(.25+hash(seed+i+.3)*.3),len=W*(.2+hash(seed+i+.6)*.5);ctx.lineWidth=1+hash(i+seed+.9)*4;ctx.beginPath();ctx.moveTo(cx+Math.cos(ang)*r0,cy+Math.sin(ang)*r0);ctx.lineTo(cx+Math.cos(ang)*(r0+len),cy+Math.sin(ang)*(r0+len));ctx.stroke();}ctx.restore();}
function particles(cx,cy,u,seed,n=90,color=C.yellow){if(u<=0||u>=1)return;ctx.save();for(let i=0;i<n;i++){const ang=hash(seed+i)*Math.PI*2,sp=.4+hash(seed+i+.2)*1,r=outExpo(u)*W*.75*sp;ctx.globalAlpha=(1-u)*.9;ctx.fillStyle=i%3?color:C.white;const s=3+hash(seed+i+.4)*9;ctx.fillRect(cx+Math.cos(ang)*r-s/2,cy+Math.sin(ang)*r-s/2,s,s);}ctx.restore();}
function grid(a,shift){if(a<=0)return;ctx.save();ctx.globalAlpha=a;ctx.strokeStyle='rgba(108,192,242,.35)';ctx.lineWidth=2;const hz=H*.62;for(let i=-12;i<=12;i++){ctx.beginPath();ctx.moveTo(W/2+i*40,hz);ctx.lineTo(W/2+i*260,H);ctx.stroke();}for(let j=0;j<10;j++){const k=((j+shift)%10)/10,y=hz+(H-hz)*k*k;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}ctx.restore();}
function hud(a){if(a<=0)return;ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=C.cyan;ctx.lineWidth=5;const m=60,l=90;for(const [x,y,sx,sy] of [[m,m+120,1,1],[W-m,m+120,-1,1],[m,H-m-60,1,-1],[W-m,H-m-60,-1,-1]]){ctx.beginPath();ctx.moveTo(x,y+sy*l);ctx.lineTo(x,y);ctx.lineTo(x+sx*l,y);ctx.stroke();}ctx.restore();}
function check(x,y,s,u){ctx.save();ctx.globalAlpha=clamp(u*3);ctx.strokeStyle=C.cyan;ctx.lineWidth=s*.12;ctx.beginPath();ctx.arc(x,y,s/2,0,Math.PI*2*outExpo(u));ctx.stroke();const k=clamp(u*2-.6);ctx.beginPath();ctx.moveTo(x-s*.22,y);ctx.lineTo(x-s*.22+s*.15*clamp(k*2),y+s*.15*clamp(k*2));if(k>.5)ctx.lineTo(x-s*.07+s*.3*clamp(k*2-1),y+s*.15-s*.32*clamp(k*2-1));ctx.stroke();ctx.restore();}
const logo=new Image();logo.src='logo.png';await logo.decode();
function logoAt(cx,cy,w,a=1,scale=1){ctx.save();ctx.globalAlpha=a;const h=w*logo.height/logo.width;ctx.translate(cx,cy);ctx.scale(scale,scale);ctx.drawImage(logo,-w/2,-h/2,w,h);ctx.restore();}
function shakeAt(t,hits,amp=26){let x=0,y=0;for(const h of hits){const u=t-h;if(u>=0&&u<.35){const k=(1-u/.35)**2*amp;x+=Math.sin(u*90)*k;y+=Math.cos(u*77)*k;}}return[x,y];}

// ---------- scenes ----------
async function frame(t){
 ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.fillStyle=C.navy;ctx.fillRect(0,0,W,H);
 if(t<2.5){// HOOK
  const [sx,sy]=shakeAt(t,[.2,.6]);cover(await clip('roots',t,.8,8),{zoom:1.5-t*.06,x:sx,y:sy});
  shade(.55);flash(.25*(1-smooth((t-.2)/.1))*(t>.2),C.red);
  bar(W*.5,H*.45,W*1.6,170*outExpo((t-.15)/.3),C.red,-.2,.92);
  word('UNDICHTER',W/2+sx,H*.42+sy,150,{scale:lerp(2.6,1,outBack((t-.2)/.28)),alpha:smooth((t-.2)/.08)});
  word('ANSCHLUSS?',W/2+sx,H*.51+sy,150,{color:C.yellow,scale:lerp(2.6,1,outBack((t-.6)/.28)),alpha:smooth((t-.6)/.08)});
  word('Wurzeln · Wasser · Risse',W/2,H*.6,46,{weight:700,color:'#d8e6f0',alpha:smooth((t-1.1)/.3),track:4});
  vignette();flash(1-smooth(t/.12));flash(.8*(1-smooth((t-.2)/.12))*(t>=.2));flash(.6*(1-smooth((t-.6)/.12))*(t>=.6));
  glitch(Math.max(clamp(1-(t-.2)/.15)*(t>=.2),clamp(1-(t-.6)/.15)*(t>=.6),smooth((t-2.1)/.4)),Math.floor(t*25));
 }else if(t<4){// PROBLEM STACCATO
  const i=Math.min(2,Math.floor((t-2.5)/.5)),lt=t-2.5-i*.5,[sx,sy]=shakeAt(lt,[0],18);
  const sc=[['roots','WURZELN.',30,C.white],['seal','WASSER.',5,C.cyan],['mill','EINRAGUNG.',0,C.yellow]][i];
  cover(await clip(sc[0],lt,1,sc[2]),{zoom:lerp(1.75,1.45,outExpo(lt/.5)),x:sx,y:sy,rot:(i-1)*.03});shade(.45);
  bar(W*.5,H*.5,W*1.8,210,i===1?C.blue:C.red,i%2?.18:-.18,.9*outExpo(lt/.15));
  word(sc[1],W/2+sx,H*.5+sy,170,{color:sc[3],scale:lerp(1.8,1,outExpo(lt/.18)),skew:-.12});
  word(`0${i+1}/03`,W*.86,H*.2,40,{weight:700,color:C.white,alpha:.8,align:'right'});
  vignette();flash(.85*(1-smooth(lt/.1)));glitch(clamp(1-lt/.12)*.8,i*31+Math.floor(lt*25));
 }else if(t<5.5){// RISER → REVEAL
  const u=(t-4)/1.5;const g=ctx.createRadialGradient(W/2,H*.45,10,W/2,H*.45,H*.7);g.addColorStop(0,'#123049');g.addColorStop(1,C.navy);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  rings(W/2,H*.45,(u*2)%1);rings(W/2,H*.45,(u*2+.5)%1,C.red,3);speedLines(W/2,H*.45,smooth(u)*.8,Math.floor(t*12));
  word('DIE',W/2,H*.4,90,{weight:700,color:C.cyan,alpha:smooth((t-4.1)/.2),track:30});
  word('LÖSUNG',W/2,H*.47,190,{scale:lerp(.6,1.15,u),alpha:smooth((t-4.3)/.2),glow:30*u});
  flash(inExpo((t-5.1)/.4));
 }else if(t<9.5){// 3D HERO + EXPLOSION
  const u=t-5.5,ex=t<7?0:t<7.3?outExpo((t-7)/.3)*.95:t<7.6?.95:1-outExpo((t-7.6)/.3)*1;
  const g=ctx.createRadialGradient(W/2,H*.42,20,W/2,H*.45,H*.75);g.addColorStop(0,'#1d4566');g.addColorStop(.5,'#0b1b2a');g.addColorStop(1,'#03070b');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  grid(.9,u*2.2);
  // Giant outlined brand type scrolling behind the product.
  word('DSS-FLEX',W/2-u*60,H*.28,330,{outline:true,color:'rgba(108,192,242,.55)',maxW:W*2.2,align:'center'});
  word('DSS-FLEX',W/2+u*60,H*.62,330,{outline:true,color:'rgba(226,35,26,.45)',maxW:W*2.2,align:'center'});
  const [sx,sy]=shakeAt(t,[7,7.6],40);
  const fly=outExpo(u/1.1),yaw=lerp(-7.4,-1.15,fly)+Math.max(0,u-1.1)*.1;
  const im=product(t,{yaw,pitch:lerp(.75,.32,fly),dist:lerp(3.2,1,fly)*(1+ex*.35),explode:ex});
  ctx.drawImage(im,sx,sy-H*.04,W,H);
  speedLines(W/2,H*.45,(t<6.4?(1-u/.9):0)+(t>=7&&t<7.9?1-(t-7)/.9:0),Math.floor(t*25));
  particles(W/2,H*.45,(t-7)/1.2,7,140);particles(W/2,H*.45,(t-7.6)/1,9,90,C.cyan);rings(W/2,H*.45,(t-7.6)/1.1,C.white,3);
  bar(W*.5,H*.79,W*1.4,150*outExpo((t-8.1)/.3),C.red,-.08,.95);
  word('VERFAHREN',W/2,H*.79,120,{scale:lerp(1.6,1,outBack((t-8.15)/.35)),alpha:smooth((t-8.15)/.1),track:10});
  hud(smooth((u-.5)/.4)*.8);vignette(.6);
  flash(1-smooth(u/.25));flash(.9*(1-smooth((t-7.6)/.18))*(t>=7.6));flash(.5*(1-smooth((t-7)/.12))*(t>=7));
 }else if(t<15.5){// FOUR STEPS on the beat
  const i=Math.min(3,Math.floor((t-9.5)/1.5)),lt=t-9.5-i*1.5;
  const st=[['FRÄSEN','Einragung & Wurzeln weg',C.red,'mill',1.3,10],['EINBAUEN','Grabenlos über den Schacht',C.blue,lt<.75?'crane':'shaft',1.2,lt<.75?20:0],['ABDICHTEN','Schalung presst & dichtet',C.yellow,'press2',1,0],['VERPRESSEN','Hohlraum verfüllt',C.red,'grout',1.5,0]][i];
  const [sx,sy]=shakeAt(lt,[0],16);
  cover(await clip(st[3],i===1&&lt>=.75?lt-.75:lt,st[4],st[5]),{zoom:lerp(1.55,1.38,lt/1.5),x:sx-lerp(30,-30,lt/1.5),y:sy});
  // Diagonal colour wipe in, then a slim band carries the word.
  // A colour band sweeps across on the cut.
  ctx.save();ctx.fillStyle=st[2];ctx.beginPath();const x0=lerp(-W*.2,W*2.2,outExpo(lt/.4)),x1=lerp(-W*.7,W*2.2,outExpo((lt-.06)/.45));ctx.moveTo(x1,0);ctx.lineTo(x0,0);ctx.lineTo(x0-500,H);ctx.lineTo(x1-500,H);ctx.closePath();ctx.globalAlpha=.9;ctx.fill();ctx.restore();
  ctx.save();ctx.fillStyle='rgba(4,9,14,.78)';ctx.fillRect(0,H*.68,W*outExpo((lt-.15)/.3),H*.17);ctx.restore();
  word(`0${i+1}`,W*.1,H*.705,120,{outline:true,color:st[2],align:'left',alpha:smooth((lt-.2)/.15)});
  word(st[0],W*.1+lerp(300,0,outExpo((lt-.22)/.3)),H*.765,140,{align:'left',alpha:smooth((lt-.22)/.12),maxW:W*.82});
  word(st[1],W*.1,H*.825,44,{weight:700,color:'#cfe0ec',align:'left',alpha:smooth((lt-.4)/.2),maxW:W*.8});
  ctx.fillStyle=C.white;for(let k=0;k<4;k++){ctx.globalAlpha=k===i?1:.3;ctx.fillRect(W*.1+k*70,H*.66,54,8);}ctx.globalAlpha=1;
  vignette(.5);flash(.7*(1-smooth(lt/.1)));glitch(clamp(1-lt/.12)*.6,i*7+Math.floor(lt*25));
 }else if(t<19.5){// PROMISES
  const lt=t-15.5;cover(await clip('ground',lt*.6,.7),{zoom:1.5+lt*.03});shade(.62);
  const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,'rgba(43,143,224,.35)');g.addColorStop(1,'rgba(226,35,26,.25)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  const items=['GRABENLOS.','DICHT.','ANSCHLUSS FREI.','DN 300 – 700'];
  items.forEach((s,k)=>{const a=lt-k;if(a<0)return;const y=H*(.3+k*.12);check(W*.14,y,86,a/.5);word(s,W*.22+lerp(240,0,outExpo(a/.3)),y,k===3?96:110,{align:'left',color:k===3?C.yellow:C.white,alpha:smooth(a/.12),maxW:W*.72});});
  word('DSS-Flex Verfahren',W/2,H*.82,58,{weight:700,color:C.cyan,alpha:smooth((lt-3.1)/.3),track:6});
  vignette(.55);for(let k=0;k<4;k++)flash(.45*(1-smooth((lt-k)/.1))*(lt>=k));
 }else if(t<21.5){// RESULT
  const lt=t-19.5;cover(await clip('free',lt,.9),{zoom:lerp(2.2,1.35,outExpo(lt/1.2))});shade(.25);
  rings(W/2,H*.48,lt/1.2,C.cyan,4);
  word('SANIERT.',W/2,H*.78,190,{scale:lerp(2.2,1,outBack((lt-.15)/.3)),alpha:smooth((lt-.15)/.08),glow:40});
  word('Dicht. Sauber. Frei.',W/2,H*.85,52,{weight:700,color:'#dbe8f2',alpha:smooth((lt-.7)/.25),track:4});
  vignette(.6);flash(.9*(1-smooth(lt/.15)));glitch(smooth((lt-1.7)/.3),Math.floor(t*25));
 }else{// OUTRO: product + logo slam
  const lt=t-21.5;const g=ctx.createRadialGradient(W/2,H*.4,20,W/2,H*.45,H*.8);g.addColorStop(0,'#173a57');g.addColorStop(1,'#03070b');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  grid(.6,lt*1.5);
  // Stays in the three-quarter front view: a side elevation makes the formwork look squat.
  const im=product(t,{yaw:-1.35+lt*.14,pitch:.28,dist:lerp(1.9,1.4,outExpo(lt/.8))});ctx.drawImage(im,0,H*.17,W,H);
  const [sx,sy]=shakeAt(lt,[.6],30);
  rings(W/2,H*.2,(lt-.6)/1.2,C.white,3);particles(W/2,H*.2,(lt-.6)/1.1,21,80,C.cyan);
  logoAt(W/2+sx,H*.2+sy,W*.8,smooth((lt-.6)/.08),lerp(2.4,1,outBack((lt-.6)/.35)));
  word('DSS-Flex Verfahren',W/2,H*.31,82,{alpha:smooth((lt-1)/.2),scale:lerp(1.3,1,outExpo((lt-1)/.3))});
  bar(W/2,H*.82,W*1.3,140*outExpo((lt-1.5)/.3),C.red,-.05,.95);
  word('JETZT ANFRAGEN',W/2,H*.82,96,{alpha:smooth((lt-1.55)/.12),scale:lerp(1.5,1,outBack((lt-1.55)/.3)),track:6});
  word('ditom-kanaltechnik.de',W/2,H*.885,50,{weight:700,color:C.cyan,alpha:smooth((lt-2)/.3)});
  vignette(.55);flash(1-smooth(lt/.2));flash(.85*(1-smooth((lt-.6)/.15))*(lt>=.6));
  shade(smooth((t-24.6)/.4),'#000');
 }
 // Progress tick along the bottom for the whole spot.
 ctx.globalAlpha=1;ctx.fillStyle=C.cyan;ctx.fillRect(0,H-8,W*t/DURATION,8);
 return canvas.toDataURL('image/jpeg',.92).split(',')[1];
}
function configure(){}
window.film={configure,frame,duration:DURATION,viewer,debug:{lite(){}}};window.ready=true;
