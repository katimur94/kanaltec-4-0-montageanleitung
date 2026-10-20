import * as THREE from 'three';
import {Viewer} from '../src/model.js';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {TexturePass} from 'three/examples/jsm/postprocessing/TexturePass.js';
import {GTAOPass} from 'three/examples/jsm/postprocessing/GTAOPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';

// Film: void filling behind a liner with the injection cone (user description
// 20.10.2026). Same physical process as the web app tab "Liner verpressen";
// cinematic look and finishing as in film-komplett-studio.js.
Viewer.prototype.animate=function(){};
{const set=GTAOPass.prototype.setGBuffer;GTAOPass.prototype.setGBuffer=function(depth,normal){if(depth!==undefined&&!this.normalRenderTarget)this.normalRenderTarget={depthTexture:depth,dispose(){},setSize(){}};return set.call(this,depth,normal);};}
const host=document.querySelector('#scene'),canvas=document.querySelector('#film'),ctx=canvas.getContext('2d');
const viewer=new Viewer(host,()=>{});
viewer.linerKind='kliner';viewer.build(400);viewer.setSections({pipe:true,shield:false,holder:false,hideBladder:false,hideRobot:false});viewer.setMode('liner');viewer.autoCam=false;
viewer.controls.enabled=false;viewer.renderer.setPixelRatio(1);viewer.setTheme(true);viewer.floor.visible=false;
const L=viewer.liner,S=L.spec,renderer=viewer.renderer,scene=viewer.scene,camera=viewer.camera;
camera.near=6;camera.far=12000;

// ---------- Lighting ----------
for(const l of scene.children.filter(o=>o.isLight)){
 if(l.isHemisphereLight){l.intensity=1.25;l.color.set('#c9d8e6');l.groundColor.set('#2b2118');}
 if(l.isDirectionalLight){l.intensity=2.3;l.color.set('#fff3e6');l.position.set(320,620,1350);l.shadow.mapSize.set(4096,4096);Object.assign(l.shadow.camera,{left:-1400,right:1400,top:1400,bottom:-1400,near:10,far:4000});l.shadow.camera.updateProjectionMatrix();l.shadow.bias=-.0004;l.shadow.normalBias=1.2;l.shadow.radius=3;}
}
const sunLights=scene.children.filter(o=>o.isDirectionalLight||o.isHemisphereLight);
const rim=new THREE.DirectionalLight('#a9c9ea',1.0);rim.position.set(-700,420,-900);scene.add(rim);
const bounce=new THREE.DirectionalLight('#ffc98f',.45);bounce.position.set(100,-600,300);scene.add(bounce);sunLights.push(rim,bounce);
const eye=viewer.robot.cameraEye;
const headlight=new THREE.SpotLight('#fff1dc',12,2600,.62,.75,0);headlight.castShadow=true;headlight.shadow.mapSize.set(2048,2048);headlight.shadow.camera.near=8;headlight.shadow.camera.far=2600;headlight.shadow.bias=-.0006;
{eye.add(headlight);const aim=new THREE.Object3D();aim.position.set(600,160,0);eye.add(aim);headlight.target=aim;}
// Work light from the front onto the crown, as the camera's LED ring would give.
const crownLight=new THREE.SpotLight('#f5f7ff',6,2200,.45,.75,0);crownLight.position.set(-150,40,950);crownLight.target.position.set(0,180,-40);scene.add(crownLight,crownLight.target);
const voidLight=new THREE.PointLight('#cfe3ff',1.4,900,0);voidLight.position.set(40,300,260);scene.add(voidLight);
viewer.inspectionLamp.intensity=1.6;viewer.inspectionLamp.color.set('#fff0dd');
const cctv=new THREE.SpotLight('#fff4e4',12,3000,.85,.9,0);const cctvAim=new THREE.Object3D();cctvAim.position.set(0,0,-100);camera.add(cctv,cctvAim);cctv.target=cctvAim;
{
 const env=new THREE.Scene(),room=new THREE.Mesh(new THREE.SphereGeometry(50,32,16),new THREE.MeshBasicMaterial({side:THREE.BackSide,vertexColors:true}));
 const pos=room.geometry.attributes.position,col=[];for(let i=0;i<pos.count;i++){const y=pos.getY(i)/50,c=new THREE.Color('#0b0f14').lerp(new THREE.Color('#3b4652'),THREE.MathUtils.smoothstep(y,-.4,1));col.push(c.r,c.g,c.b);}
 room.geometry.setAttribute('color',new THREE.Float32BufferAttribute(col,3));env.add(room);
 const panel=(w,h,p,c,k)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(k),side:THREE.DoubleSide}));m.position.set(...p);m.lookAt(0,0,0);env.add(m);};
 panel(40,14,[10,40,20],'#fff4e8',5);panel(18,30,[-38,10,-20],'#9cc8ff',2.2);panel(26,10,[30,-8,-30],'#ffd2a1',1.4);
 const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(env,.02).texture;pmrem.dispose();
}
const bgCanvas=document.createElement('canvas');bgCanvas.width=bgCanvas.height=1024;
{const g=bgCanvas.getContext('2d'),r=g.createRadialGradient(560,420,20,512,512,760);r.addColorStop(0,'#223544');r.addColorStop(.45,'#111c26');r.addColorStop(1,'#05080c');g.fillStyle=r;g.fillRect(0,0,1024,1024);}
const bgTexture=new THREE.CanvasTexture(bgCanvas);bgTexture.colorSpace=THREE.SRGBColorSpace;scene.background=bgTexture;
scene.fog=new THREE.FogExp2('#0d161e',.00012);const insideBackground=new THREE.Color('#030405');

// ---------- Post-processing (as in the complete-process film) ----------
let width=1920,height=1080,ss=2,sceneRT,composer,gtao,bloom,grade;
const GradeShader={
 uniforms:{tDiffuse:{value:null},uTime:{value:0},uRes:{value:new THREE.Vector2(1,1)},uSS:{value:2},uVignette:{value:.42},uGrain:{value:.035}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform float uTime,uSS,uVignette,uGrain;uniform vec2 uRes;varying vec2 vUv;
 float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
 void main(){
  vec2 d=vUv-.5;float r=length(d*vec2(uRes.x/uRes.y,1.));
  vec2 ca=d*.0016*r;vec3 c=vec3(texture2D(tDiffuse,vUv+ca).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-ca).b);
  float l=dot(c,vec3(.2126,.7152,.0722));c=mix(c,c*vec3(.93,1.,1.07),.35*(1.-smoothstep(.0,.5,l)));c=mix(c,c*vec3(1.05,1.,.94),.3*smoothstep(.45,1.,l));
  c=c*c*(3.-2.*c)*.25+c*.75;c=mix(vec3(l),c,1.06);
  float v=smoothstep(.95,.18,r*uVignette*1.9);c*=mix(.8,1.,v);c=c*.955+.022;
  vec2 gp=floor(gl_FragCoord.xy/uSS);float g=h(gp+fract(uTime*7.13)*91.7)-.5;c+=g*uGrain*(1.-l*.6);
  gl_FragColor=vec4(clamp(c,0.,1.),1.);
 }`
};
const SanitizeShader={uniforms:{tDiffuse:{value:null}},vertexShader:GradeShader.vertexShader,
 fragmentShader:'uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);bvec3 bad=bvec3(isnan(c.r)||isinf(c.r),isnan(c.g)||isinf(c.g),isnan(c.b)||isinf(c.b));if(any(bad))c.rgb=vec3(0.);gl_FragColor=vec4(min(max(c.rgb,0.),vec3(40.)),1.);}'};
function buildPost(){
 const w=width*ss,h=height*ss;
 sceneRT?.dispose();composer?.dispose?.();
 sceneRT=new THREE.WebGLRenderTarget(w,h,{type:THREE.HalfFloatType,depthTexture:new THREE.DepthTexture(w,h,THREE.UnsignedIntType)});
 composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(w,h,{type:THREE.HalfFloatType}));composer.setPixelRatio(1);composer.setSize(w,h);
 composer.addPass(new TexturePass(sceneRT.texture));composer.addPass(new ShaderPass(SanitizeShader));
 gtao=new GTAOPass(scene,camera,w,h,{depthTexture:sceneRT.depthTexture});gtao.blendIntensity=.85;
 gtao.updateGtaoMaterial({radius:34*ss/2,distanceExponent:1.6,thickness:28,scale:1.05,samples:16,distanceFallOff:1});
 gtao.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6*ss,rings:2,samples:16});
 composer.addPass(gtao);composer.addPass(new ShaderPass(SanitizeShader));
 bloom=new UnrealBloomPass(new THREE.Vector2(w,h),.14,.45,1.35);composer.addPass(bloom);
 composer.addPass(new OutputPass());
 grade=new ShaderPass(GradeShader);grade.uniforms.uRes.value.set(w,h);grade.uniforms.uSS.value=ss;composer.addPass(grade);
}
const debug={gtao:true,bloom:true,grade:true,blur:true,lite(){this.gtao=false;this.blur=false;}};
function renderScene(t){
 gtao.enabled=debug.gtao;bloom.enabled=debug.bloom;grade.enabled=debug.grade;
 renderer.setRenderTarget(sceneRT);renderer.render(scene,camera);renderer.setRenderTarget(null);
 grade.uniforms.uTime.value=t;composer.render();
}

const logo=new Image();logo.src='logo.png';await logo.decode();
const lerp=THREE.MathUtils.lerp,clamp=THREE.MathUtils.clamp,smooth=x=>(x=clamp(x,0,1))*x*(3-2*x),ease=x=>(x=clamp(x,0,1))<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const shots=[
 {start:3,end:8.5,a:.15,b:.6,key:'Ausgangslage',chapter:'Hohlraum hinter dem Liner',pos:[-620,330,1650],pos2:[-260,300,1180],target:[-90,170,0],target2:[30,215,0],fov:36},
 {start:8.5,end:12.5,a:.6,b:1.5,key:'Anfahrt',follow:[330,170,1000],aim:[-170,30,0],fov:36},
 {start:12.5,end:16,a:1.5,b:1.97,key:'Ausrichten',inside:true,pos:[430,-45,70],pos2:[370,-35,60],target:[0,135,-35],fov:58},
 {start:16,end:23,a:2,b:2.95,key:'Fräsen',chapter:'1 · Verpressloch fräsen',pos:[300,30,650],pos2:[230,55,560],target:[0,150,-40],fov:36,blur:4},
 {start:23,end:25.5,a:3.005,b:3.04,key:'Bohrung',cutterCam:true,fov:64},
 {start:25.5,end:31,a:3.04,b:3.82,key:'Werkzeugwechsel',chapter:'2 · Werkzeugwechsel',pos:[-1550,330,3350],pos2:[-1350,300,3150],target:[-1000,40,0],fov:36},
 {start:31,end:35,a:3.82,b:4.3,key:'Verpresskegel',cone:[175,-25,330],fov:36},
 {start:35,end:41,a:4.3,b:4.99,key:'Anpressen',pos:[210,-15,520],pos2:[165,-5,470],target:[0,125,-40],fov:36},
 {start:41,end:44,a:5,b:5.24,key:'Schlauch',chapter:'3 · Hohlraum verpressen',pos:[-700,220,1100],pos2:[-620,200,1000],target:[-380,70,0],fov:36},
 {start:44,end:52,a:5.24,b:5.98,key:'Verfüllen',pos:[130,370,1280],pos2:[70,330,1070],target:[20,235,-20],fov:36},
 {start:52,end:55,a:6,b:6.4,key:'Aushärten',pos:[-210,250,930],pos2:[-170,240,880],target:[0,205,-20],fov:36},
 {start:55,end:58.5,a:6.4,b:6.6,key:'Kontrolle',cutterCam:true,fov:64},
 {start:58.5,end:61.5,a:6.62,b:6.999,key:'Ergebnis',pos:[-320,430,1700],pos2:[-220,390,1480],target:[0,200,0],fov:36}
];
const DURATION=66,OUTRO=61.5;
function configure(w,h,supersample=2){width=w;height=h;ss=supersample;canvas.width=w;canvas.height=h;host.style.width=w+'px';host.style.height=h+'px';renderer.setPixelRatio(1);renderer.setSize(w*ss,h*ss,false);camera.aspect=w/h;camera.updateProjectionMatrix();buildPost();}
function titleFont(weight,size){return `${weight} ${Math.round(size)}px "Segoe UI Variable Display","Segoe UI",Arial,sans-serif`;}
function brand(t,outro){
 const u=outro?(t-OUTRO)/4.5:t/3,fade=smooth(u*3.2),cx=width/2,m=Math.min(width,height);
 const g=ctx.createRadialGradient(width*.5,height*.46,m*.05,width*.5,height*.5,Math.hypot(width,height)*.62);g.addColorStop(0,'#16293a');g.addColorStop(.55,'#0b141d');g.addColorStop(1,'#04070a');ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
 ctx.save();ctx.globalCompositeOperation='lighter';
 for(let i=0;i<7;i++){ctx.strokeStyle=`rgba(70,160,220,${.05-.005*i})`;ctx.lineWidth=m*.004;ctx.beginPath();ctx.arc(cx,height*.46,m*(.16+i*.09)+u*m*.02,0,Math.PI*2);ctx.stroke();}
 const sweep=ctx.createLinearGradient(0,0,width,0),sx=(-.3+1.6*smooth(u*1.1));sweep.addColorStop(clamp(sx-.12,0,1),'rgba(120,190,255,0)');sweep.addColorStop(clamp(sx,0,1),'rgba(160,210,255,.10)');sweep.addColorStop(clamp(sx+.12,0,1),'rgba(120,190,255,0)');ctx.fillStyle=sweep;ctx.fillRect(0,0,width,height);
 ctx.restore();
 const lw=Math.min(width*.42,height*.9)*(0.97+.03*fade),lh=lw*logo.height/logo.width;
 ctx.save();ctx.globalAlpha=fade;ctx.drawImage(logo,cx-lw/2,height*.29-lh/2+(1-fade)*m*.02,lw,lh);ctx.restore();
 const t2=smooth((u-.18)*3.2);ctx.save();ctx.globalAlpha=t2;ctx.textAlign='center';ctx.fillStyle='#eef5fa';ctx.font=titleFont(600,m*.068);
 ctx.fillText(outro?'Hohlraum verfüllt.':'Verpressen hinter dem Liner',cx,height*.6+(1-t2)*m*.015);
 ctx.fillStyle='rgba(98,183,236,.9)';ctx.fillRect(cx-m*.07*t2,height*.645,m*.14*t2,Math.max(2,m*.004));
 ctx.font=titleFont(400,m*.034);ctx.fillStyle='#b5cad9';
 ctx.fillText(outro?'Präzision für die Kanalsanierung.':'Hohlräume gezielt verfüllen – durch den Liner',cx,height*.71);
 if(outro){ctx.font=titleFont(500,m*.03);ctx.fillStyle='#6cc0f2';ctx.fillText('ditom-kanaltechnik.de',cx,height*.88);}
 ctx.restore();
 const black=outro?smooth((t-DURATION+.6)/.6):1-smooth(t/.5);if(black>0){ctx.fillStyle=`rgba(0,0,0,${black})`;ctx.fillRect(0,0,width,height);}
}
function pose(s,t){
 const u=clamp((t-s.start)/(s.end-s.start),0,1),e=ease(u),time=lerp(s.a,s.b,u);
 viewer.ambientClock=t;viewer.setLiner(time);viewer.updateParts();
 // The section is an outside view only; the camera inside sees the full pipe.
 L.setCut(!(s.inside||s.cutterCam));viewer.linerPose();viewer.model.updateMatrixWorld(true);
 const st=viewer.linerState;let pos,target;
 if(s.cutterCam){
  pos=eye.getWorldPosition(V()).add(V(6,4,0));
  const tool=(viewer.cone.group.visible?viewer.cone.outlet:viewer.robot.cutter.disk).getWorldPosition(V());
  target=tool.lerp(S.holeP.clone().add(V(st.travel,0,0)),.4);
 }else if(s.follow){target=V(st.travel,0,0).add(V(...s.aim));pos=target.clone().add(V(...s.follow));}
 else if(s.cone){target=viewer.cone.outlet.getWorldPosition(V()).add(V(0,-40,0));pos=target.clone().add(V(...s.cone).multiplyScalar(1.04-.08*e));}
 else{target=V(...s.target).lerp(V(...(s.target2||s.target)),e);pos=V(...s.pos).lerp(V(...(s.pos2||s.pos)),e);}
 camera.position.copy(pos);camera.up.set(0,1,0);camera.fov=s.fov;camera.near=s.cutterCam?3:6;camera.updateProjectionMatrix();camera.lookAt(target);camera.updateMatrixWorld();
 const inside=s.inside||s.cutterCam;
 viewer.inspectionLamp.visible=true;cctv.visible=!!inside;headlight.visible=!s.cutterCam;crownLight.visible=!inside;voidLight.visible=!inside;
 for(const l of sunLights)l.visible=!inside||l.isHemisphereLight;
 scene.background=inside?insideBackground:bgTexture;scene.fog.density=inside?.0003:.00012;scene.fog.color.set(inside?'#040506':'#0d161e');
 renderer.toneMappingExposure=inside?1.08:1.55;cctv.intensity=s.cutterCam?5:3.5;viewer.inspectionLamp.intensity=s.inside?.8:1.6;
}
function frame(t){
 ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 if(t<3||t>=OUTRO){brand(t,t>=OUTRO);return canvas.toDataURL('image/jpeg',.95).split(',')[1];}
 const s=shots.find(s=>t>=s.start&&t<s.end),K=debug.blur?s.blur||1:1,shutter=.5/30;
 for(let k=0;k<K;k++){const tk=K>1?t+((k+.5)/K-.5)*shutter:t;pose(s,tk);renderScene(tk);ctx.globalAlpha=1/(k+1);ctx.drawImage(renderer.domElement,0,0,width,height);}
 ctx.globalAlpha=1;
 const lw=width*.15,lh=lw*logo.height/logo.width,pad=width*.03;ctx.save();ctx.globalAlpha=.92;ctx.drawImage(logo,pad,pad,lw,lh);ctx.restore();
 if(s.chapter){const a=smooth((t-s.start-.35)/.5)*(1-smooth((t-s.start-2.8)/.6));if(a>0){const m=Math.min(width,height),x=width*.05,y=height*.84;ctx.save();ctx.font=titleFont(600,m*.05);const tw=ctx.measureText(s.chapter).width;ctx.globalAlpha=a;ctx.fillStyle='rgba(6,12,18,.55)';ctx.fillRect(x-m*.02,y-m*.075,tw+m*.06,m*.1);ctx.fillStyle='#6cc0f2';ctx.fillRect(x-m*.02,y-m*.075,m*.008,m*.1);ctx.fillStyle='#eef5fa';ctx.textAlign='left';ctx.fillText(s.chapter,x,y);ctx.restore();}}
 const next=shots[shots.indexOf(s)+1],bigIn=!!s.chapter,bigOut=!next||!!next.chapter,din=bigIn?.55:.22,dout=bigOut?.55:.22;
 const fade=Math.min(1,(t-s.start)/din,(s.end-t)/dout);if(fade<1){ctx.fillStyle=`rgba(4,8,12,${(1-fade)*.92})`;ctx.fillRect(0,0,width,height);}
 return canvas.toDataURL('image/jpeg',.95).split(',')[1];
}
window.film={configure,frame,shots,duration:DURATION,viewer,debug};window.ready=true;
