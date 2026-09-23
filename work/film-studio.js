import * as THREE from 'three';
import {Viewer} from '../src/model.js';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {TexturePass} from 'three/examples/jsm/postprocessing/TexturePass.js';
import {GTAOPass} from 'three/examples/jsm/postprocessing/GTAOPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';

// Offline film renderer: same physical process as the website, no UI/explosion.
// Cinematic look: practical lights, ambient occlusion, bloom, depth haze,
// supersampling, motion blur for the spinning cutter, grading and grain.
Viewer.prototype.animate=function(){};
// three r160: GTAOPass with an external depth buffer touches a missing target.
{const set=GTAOPass.prototype.setGBuffer;GTAOPass.prototype.setGBuffer=function(depth,normal){if(depth!==undefined&&!this.normalRenderTarget)this.normalRenderTarget={depthTexture:depth,dispose(){},setSize(){}};return set.call(this,depth,normal);};}
const host=document.querySelector('#scene'),canvas=document.querySelector('#film'),ctx=canvas.getContext('2d');
const viewer=new Viewer(host,()=>{});
viewer.repairOptions={kind:'open',infiltration:true,cavity:'large',sewerWater:33};
viewer.build(400);viewer.mode='process';viewer.setMode('process');
viewer.controls.enabled=false;viewer.renderer.setPixelRatio(1);viewer.renderer.toneMappingExposure=1.18;
viewer.setTheme(true);viewer.floor.visible=false;viewer.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const R=viewer.radius+12,renderer=viewer.renderer,scene=viewer.scene,camera=viewer.camera;
// Clear water with real refraction instead of milky, opaque-looking tubes.
for(const m of [viewer.repair.waterMaterial,viewer.repair.runoffMaterial,viewer.repair.dropMaterial,...viewer.repair.rippleMaterials]){Object.assign(m,{transmission:1,thickness:1.4,roughness:.05,ior:1.33,specularIntensity:1,envMapIntensity:1.1,attenuationDistance:40});m.color.set('#eef6f4');m.attenuationColor.set('#c9d8cf');m.needsUpdate=true;}
Object.assign(viewer.repair.dropMaterial,{envMapIntensity:2.2,thickness:2.5});

camera.near=6;camera.far=9000;

// ---------- Lighting: moody practical lights instead of a bright studio ----------
for(const l of scene.children.filter(o=>o.isLight)){
 if(l.isHemisphereLight){l.intensity=1.25;l.color.set('#c9d8e6');l.groundColor.set('#2b2118');}
 if(l.isDirectionalLight){l.intensity=2.3;l.color.set('#fff3e6');l.position.set(320,420,1150);l.shadow.mapSize.set(4096,4096);Object.assign(l.shadow.camera,{left:-900,right:900,top:900,bottom:-900,near:10,far:3000});l.shadow.camera.updateProjectionMatrix();l.shadow.bias=-.0004;l.shadow.normalBias=1.2;l.shadow.radius=3;}
}
const sunLights=scene.children.filter(o=>o.isDirectionalLight||o.isHemisphereLight);
const rim=new THREE.DirectionalLight('#a9c9ea',1.0);rim.position.set(-700,420,-900);scene.add(rim);
const bounce=new THREE.DirectionalLight('#ffc98f',.45);bounce.position.set(100,-600,300);scene.add(bounce);sunLights.push(rim,bounce);
// Robot headlight on the CutterCam; shadows of the root mat fall onto the wall.
const eye=viewer.robot?.cameraEye;
const headlight=new THREE.SpotLight('#fff1dc',12,2600,.62,.75,0);headlight.castShadow=true;headlight.shadow.mapSize.set(2048,2048);headlight.shadow.camera.near=8;headlight.shadow.camera.far=2600;headlight.shadow.bias=-.0006;
if(eye){eye.add(headlight);const aim=new THREE.Object3D();aim.position.set(600,120,0);eye.add(aim);headlight.target=aim;}
viewer.inspectionLamp.intensity=1.6;
const bladderLight=new THREE.SpotLight('#f3f7ff',7,3200,.3,.7,0);bladderLight.position.set(-260,260,900);bladderLight.target.position.set(0,R+150,0);scene.add(bladderLight,bladderLight.target);
const bladderRim=new THREE.PointLight('#bcd8ff',2.2,700,0);bladderRim.position.set(120,R+260,-60);scene.add(bladderRim);
if(viewer.winding?.material)Object.assign(viewer.winding.material,{roughness:.62,envMapIntensity:.9});viewer.inspectionLamp.color.set('#fff0dd');
// CCTV lamp for the inspection view inside the sewer.
const cctv=new THREE.SpotLight('#fff4e4',12,3000,.85,.9,0);cctv.position.set(0,0,0);const cctvAim=new THREE.Object3D();cctvAim.position.set(0,0,-100);camera.add(cctv,cctvAim);cctv.target=cctvAim;

// Softer, darker reflections than the website's bright RoomEnvironment boxes.
{
 const env=new THREE.Scene(),room=new THREE.Mesh(new THREE.SphereGeometry(50,32,16),new THREE.MeshBasicMaterial({side:THREE.BackSide,vertexColors:true}));
 const pos=room.geometry.attributes.position,col=[];for(let i=0;i<pos.count;i++){const y=pos.getY(i)/50,c=new THREE.Color('#0b0f14').lerp(new THREE.Color('#3b4652'),THREE.MathUtils.smoothstep(y,-.4,1));col.push(c.r,c.g,c.b);}
 room.geometry.setAttribute('color',new THREE.Float32BufferAttribute(col,3));env.add(room);
 const panel=(w,h,p,c,k)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(k),side:THREE.DoubleSide}));m.position.set(...p);m.lookAt(0,0,0);env.add(m);};
 panel(40,14,[10,40,20],'#fff4e8',5);panel(18,30,[-38,10,-20],'#9cc8ff',2.2);panel(26,10,[30,-8,-30],'#ffd2a1',1.4);
 const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(env,.02).texture;pmrem.dispose();
}
// Background: deep blue-black with a soft glow behind the subject; matching haze.
const bgCanvas=document.createElement('canvas');bgCanvas.width=bgCanvas.height=1024;
{const g=bgCanvas.getContext('2d'),r=g.createRadialGradient(560,420,20,512,512,760);r.addColorStop(0,'#223544');r.addColorStop(.45,'#111c26');r.addColorStop(1,'#05080c');g.fillStyle=r;g.fillRect(0,0,1024,1024);}
const bgTexture=new THREE.CanvasTexture(bgCanvas);bgTexture.colorSpace=THREE.SRGBColorSpace;scene.background=bgTexture;
scene.fog=new THREE.FogExp2('#0d161e',.00022);const insideBackground=new THREE.Color('#030405');

// Pipe joints every 1.5 m: thin dark gaps with a slightly proud socket edge.
{const m=new THREE.MeshStandardMaterial({color:'#1a100b',roughness:.9});for(const x of [-2250,-750,750,2250]){const ring=new THREE.Mesh(new THREE.TorusGeometry(R-.2,1.6,8,160),m);ring.rotation.y=Math.PI/2;ring.position.x=x;viewer.context.add(ring);}}
// Airborne dust in the lamp light, only for views inside the sewer.
const dust=(()=>{const n=900,p=new Float32Array(n*3),seed=[];let s=99;const r=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
 for(let i=0;i<n;i++){const a=r()*Math.PI*2,q=Math.sqrt(r())*(R-15);p.set([-900+r()*1200,q*Math.cos(a),q*Math.sin(a)],i*3);seed.push(r());}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
 const spr=document.createElement('canvas');spr.width=spr.height=64;const c=spr.getContext('2d'),gr=c.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,245,230,1)');gr.addColorStop(.4,'rgba(255,240,220,.35)');gr.addColorStop(1,'rgba(255,240,220,0)');c.fillStyle=gr;c.fillRect(0,0,64,64);
 const m=new THREE.PointsMaterial({size:1.6,map:new THREE.CanvasTexture(spr),transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true});
 const o=new THREE.Points(g,m);o.frustumCulled=false;o.userData.base=p.slice();o.userData.seed=seed;scene.add(o);return o;})();
function driftDust(t){const p=dust.geometry.attributes.position,b=dust.userData.base,s=dust.userData.seed;for(let i=0;i<p.count;i++){p.setXYZ(i,b[i*3]+Math.sin(t*.3+s[i]*40)*14+t*6,b[i*3+1]+Math.sin(t*.23+s[i]*17)*9,b[i*3+2]+Math.cos(t*.27+s[i]*23)*9);}p.needsUpdate=true;}

// ---------- Post-processing ----------
let width=1920,height=1080,ss=2,sceneRT,composer,gtao,bloom,grade;
const GradeShader={
 uniforms:{tDiffuse:{value:null},uTime:{value:0},uRes:{value:new THREE.Vector2(1,1)},uSS:{value:2},uVignette:{value:.42},uGrain:{value:.035}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform float uTime,uSS,uVignette,uGrain;uniform vec2 uRes;varying vec2 vUv;
 float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
 void main(){
  vec2 d=vUv-.5;float r=length(d*vec2(uRes.x/uRes.y,1.));
  // Slight lateral colour fringe towards the corners, like a real lens.
  vec2 ca=d*.0016*r;vec3 c=vec3(texture2D(tDiffuse,vUv+ca).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-ca).b);
  // Gentle filmic grade: cool shadows, warm highlights, soft contrast curve.
  float l=dot(c,vec3(.2126,.7152,.0722));c=mix(c,c*vec3(.93,1.,1.07),.35*(1.-smoothstep(.0,.5,l)));c=mix(c,c*vec3(1.05,1.,.94),.3*smoothstep(.45,1.,l));
  c=c*c*(3.-2.*c)*.25+c*.75;c=mix(vec3(l),c,1.06);
  float v=smoothstep(.95,.18,r*uVignette*1.9);c*=mix(.8,1.,v);c=c*.955+.022;
  vec2 gp=floor(gl_FragCoord.xy/uSS);float g=h(gp+fract(uTime*7.13)*91.7)-.5;c+=g*uGrain*(1.-l*.6);
  gl_FragColor=vec4(clamp(c,0.,1.),1.);
 }`
};
// Removes NaN/Inf pixels (e.g. degenerate normals) before blur passes would
// smear them into black blocks; also caps extreme HDR highlights.
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
 bloom=new UnrealBloomPass(new THREE.Vector2(w,h),.16,.45,1.35);composer.addPass(bloom);
 composer.addPass(new OutputPass());
 grade=new ShaderPass(GradeShader);grade.uniforms.uRes.value.set(w,h);grade.uniforms.uSS.value=ss;composer.addPass(grade);
}
const debug={gtao:true,bloom:true,grade:true};
function renderScene(t){
 gtao.enabled=debug.gtao;bloom.enabled=debug.bloom;grade.enabled=debug.grade;
 renderer.setRenderTarget(sceneRT);renderer.render(scene,camera);renderer.setRenderTarget(null);
 grade.uniforms.uTime.value=t;composer.render();
}

const logo=new Image();logo.src='logo.png';await logo.decode();
const lerp=THREE.MathUtils.lerp,clamp=THREE.MathUtils.clamp,smooth=x=>(x=clamp(x,0,1))*x*(3-2*x),ease=x=>(x=clamp(x,0,1))<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
// pos/target move from `pos`/`target` to `pos2`/`target2` with easing.
const shots=[
 {start:3,end:5.6,a:0,b:.022,key:'Kanalblick Wurzeln',pos:[-980,-70,34],pos2:[-470,-58,22],target:[0,R-80,0],target2:[10,R-95,0],inside:true,fov:50,fovP:68,dust:true,blur:2},
 {start:5.6,end:8,a:.022,b:.06,key:'Wurzeln und Infiltration',pos:[-170,40,430],pos2:[-95,75,360],target:[0,R-55,0],target2:[10,R-45,0],fov:36,blur:2},
 {start:8,end:11,a:.06,b:.2,key:'Zurückfräsen',pos:[230,40,640],pos2:[200,62,600],target:[-20,R-40,0],fov:38,blur:6},
 {start:11,end:14,a:.2,b:.40,key:'Fräsgut treibt ab',pos:[330,-80,700],pos2:[290,-70,620],target:[80,-5,0],target2:[60,5,0],fov:42,blur:6},
 {start:14,end:20,a:.43,b:.832857142857,key:'Drehmodul',pos:[-420,180,1350],target:[-230,60,0],fov:38,blur:5},
 {start:20,end:21,a:.832857142857,b:.9,key:'Rundfräsen',pos:[-130,-75,680],target:[-10,180,0],fov:38,blur:5},
 {start:21,end:25,a:1,b:1.999,key:'Werkzeugwechsel',pos:[-190,40,820],target:[-100,100,0],fov:38},
 {start:25,end:29,a:2,b:2.999,key:'Positionieren',pos:[-370,280,1150],target:[-110,105,0],fov:38},
 {start:29,end:33,a:3,b:3.999,key:'Anpressen',pos:[310,80,840],target:[0,125,0],fov:38},
 {start:33,end:37,a:4,b:4.999,key:'Abdichten',pos:[310,80,840],target:[0,125,0],fov:38},
 {start:37,end:45,a:5,b:5.999,key:'Anschlussblase',pos:[-210,190,660],target:[0,225,0],shield:true,fov:38},
 {start:45,end:49,a:6,b:6.3,key:'Opferschlauch',pos:[-340,-70,840],target:[-180,60,0],fov:38},
 {start:49,end:60,a:6.3,b:6.999,key:'Verpressen',pos:[-240,360,1020],target:[0,300,0],shield:true,hideBladder:true,fov:38},
 {start:60,end:62,a:7,b:7.99,key:'Aushärten',pos:[-220,370,1050],target:[0,300,0],shield:true,hideBladder:true,fov:38},
 {start:62,end:68,a:8,b:8.999,key:'Ausschalen',pos:[190,90,850],target:[0,140,0],fov:38},
 {start:68,end:70,a:8.999,b:8.999,key:'Freier Anschluss',exposure:1.05,lamp:3.2,pos:[-15,-130,30],pos2:[-8,-120,24],target:[0,220,0],inside:true,fov:60,fovP:78},
 {start:70,end:73,a:8.999,b:8.999,key:'Verpressung im Erdreich',pos:[380,620,1030],target:[0,325,0],repairOnly:true,fov:38}
];
function configure(w,h,supersample=2){width=w;height=h;ss=supersample;canvas.width=w;canvas.height=h;host.style.width=w+'px';host.style.height=h+'px';renderer.setPixelRatio(1);renderer.setSize(w*ss,h*ss,false);camera.aspect=w/h;camera.updateProjectionMatrix();buildPost();}
function titleFont(weight,size){return `${weight} ${Math.round(size)}px "Segoe UI Variable Display","Segoe UI",Arial,sans-serif`;}
function brand(t,outro){
 const u=outro?(t-73)/5:t/3,fade=smooth(u*3.2),cx=width/2,m=Math.min(width,height);
 const g=ctx.createRadialGradient(width*.5,height*.46,m*.05,width*.5,height*.5,Math.hypot(width,height)*.62);g.addColorStop(0,'#16293a');g.addColorStop(.55,'#0b141d');g.addColorStop(1,'#04070a');ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
 // Slow light sweep and fine concentric rings, like light in a pipe.
 ctx.save();ctx.globalCompositeOperation='lighter';
 for(let i=0;i<7;i++){ctx.strokeStyle=`rgba(70,160,220,${.05-.005*i})`;ctx.lineWidth=m*.004;ctx.beginPath();ctx.arc(cx,height*.46,m*(.16+i*.09)+u*m*.02,0,Math.PI*2);ctx.stroke();}
 const sweep=ctx.createLinearGradient(0,0,width,0),sx=(-.3+1.6*smooth(u*1.1));sweep.addColorStop(clamp(sx-.12,0,1),'rgba(120,190,255,0)');sweep.addColorStop(clamp(sx,0,1),'rgba(160,210,255,.10)');sweep.addColorStop(clamp(sx+.12,0,1),'rgba(120,190,255,0)');ctx.fillStyle=sweep;ctx.fillRect(0,0,width,height);
 ctx.restore();
 const portrait=width<height,lw=(portrait?width*.78:Math.min(width*.46,height*.95))*(0.97+.03*fade),lh=lw*logo.height/logo.width;
 ctx.save();ctx.globalAlpha=fade;ctx.drawImage(logo,cx-lw/2,height*(portrait?.33:.30)-lh/2+(1-fade)*m*.02,lw,lh);ctx.restore();
 const t2=smooth((u-.18)*3.2);ctx.save();ctx.globalAlpha=t2;ctx.textAlign='center';ctx.fillStyle='#eef5fa';ctx.font=titleFont(600,m*(portrait?.075:.07));
 ctx.fillText('DSS-Flex Verfahren',cx,height*(portrait?.52:.60)+(1-t2)*m*.015);
 ctx.fillStyle='rgba(98,183,236,.9)';ctx.fillRect(cx-m*.07*t2,height*(portrait?.55:.645),m*.14*t2,Math.max(2,m*.004));
 ctx.font=titleFont(400,m*(portrait?.036:.034));ctx.fillStyle='#b5cad9';
 ctx.fillText(outro?'Präzision für die Kanalsanierung.':'Fräsen. Vorbereiten. Sanieren.',cx,height*(portrait?.6:.71));
 if(outro){ctx.font=titleFont(500,m*.03);ctx.fillStyle='#6cc0f2';ctx.fillText('ditom-kanaltechnik.de',cx,height*(portrait?.86:.88));}
 ctx.restore();
 // Dip from and to black.
 const black=outro?smooth((t-77.4)/.6):1-smooth(t/.5);if(black>0){ctx.fillStyle=`rgba(0,0,0,${black})`;ctx.fillRect(0,0,width,height);}
}
function pose(s,t){
 const u=clamp((t-s.start)/(s.end-s.start),0,1),e=ease(u),time=lerp(s.a,s.b,s.a===s.b?0:u);
 viewer.model.visible=true;viewer.explode=viewer.targetExplode=0;viewer.ambientClock=t;
 const sectionKey=[s.inside,s.shield,s.hideBladder].join(',');
 if(viewer.filmSectionKey!==sectionKey){viewer.setSections({pipe:!s.inside,shield:!!s.shield,hideBladder:!!s.hideBladder,hideRobot:false,holder:false});viewer.filmSectionKey=sectionKey;}
 viewer.time=time;viewer.updateParts();viewer.processPose();viewer.floor.visible=false;
 const portrait=width<height,square=width/height<1.3&&!portrait;
 const target=new THREE.Vector3(...s.target).lerp(new THREE.Vector3(...(s.target2||s.target)),e),pos=new THREE.Vector3(...s.pos).lerp(new THREE.Vector3(...(s.pos2||s.pos)),e);
 if(!s.inside){
  // Reframe each aspect ratio; no destructive crop of the operating tool.
  const delta=pos.clone().sub(target),factor=portrait?(s.key==='Drehmodul'?2.15:s.key==='Rundfräsen'?1.95:1.7):square?1.18:1;
  delta.multiplyScalar(factor*(s.pos2?1:(1.035-.07*e)));
  delta.applyAxisAngle(new THREE.Vector3(0,1,0),(e-.5)*.08);pos.copy(target).add(delta);
 }
 camera.position.copy(pos);camera.up.set(0,1,0);camera.fov=portrait&&s.fovP?s.fovP:s.fov;camera.updateProjectionMatrix();camera.lookAt(target);camera.updateMatrixWorld();
 viewer.inspectionLamp.visible=true;cctv.visible=!!s.inside;cctv.intensity=s.lamp??12;dust.visible=!!s.dust;if(s.dust)driftDust(t);
 headlight.visible=!s.inside;bladderLight.visible=bladderRim.visible=!!s.shield;
 // Inside the sewer only the camera lamps light the scene: no daylight through the breakout.
 for(const l of sunLights)l.visible=!s.inside||l.isHemisphereLight;
 scene.background=s.inside?insideBackground:bgTexture;scene.fog.density=s.inside?.00036:.00012;renderer.toneMappingExposure=s.exposure??(s.inside?1.4:1.62);scene.fog.color.set(s.inside?'#040506':'#0d161e');
 if(s.inside||s.repairOnly){viewer.model.visible=false;viewer.repair.setWaterObstacles([]);}
}
function frame(t){
 ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 if(t<3||t>=73){brand(t,t>=73);return canvas.toDataURL('image/jpeg',.95).split(',')[1];}
 const s=shots.find(s=>t>=s.start&&t<s.end),K=s.blur||1,shutter=.5/30;
 // Fast particles carry their own streak per sub-frame, so sub-frames join up.
 viewer.repair.streakTime=viewer.repair.debris.streak=shutter/K;
 // Motion blur: average sub-frames across a 180° shutter.
 for(let k=0;k<K;k++){
  const tk=K>1?t+((k+.5)/K-.5)*shutter:t;pose(s,tk);renderScene(tk);
  ctx.globalAlpha=1/(k+1);ctx.drawImage(renderer.domElement,0,0,width,height);
 }
 ctx.globalAlpha=1;
 // A transparent original logo stays discreetly visible during the process.
 const portrait=width<height,lw=portrait?width*.27:width*.15,lh=lw*logo.height/logo.width,pad=width*.03;
 ctx.save();ctx.globalAlpha=.92;ctx.drawImage(logo,pad,pad,lw,lh);ctx.restore();
 const fade=Math.min(1,(t-s.start)/.22,(s.end-t)/.22);if(fade<1){ctx.fillStyle=`rgba(4,8,12,${(1-fade)*.9})`;ctx.fillRect(0,0,width,height);}
 return canvas.toDataURL('image/jpeg',.95).split(',')[1];
}
window.film={configure,frame,shots,duration:78,viewer,debug};window.ready=true;
