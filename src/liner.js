import * as THREE from 'three';
import {surfaceTextures} from './repair-surface.js';
import {flowNormalTexture} from './repair.js';
import {millingSpec} from './milling.js';
import {coneCutterRadius,coneCutterSpec} from './cone-cutter.js';
import {coneSpec} from './injection-cone.js';

// Void filling behind a liner (user description 20.10.2026): the pipe already
// carries a K-liner or an inliner, the cutter mills a small hole where the
// void is, the milling head is exchanged for the injection cone and grout is
// pressed through the hole into the void. Liner, void, hole and grout spread
// are display assumptions; the process order follows the user.
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);},lerp=THREE.MathUtils.lerp;

export const linerKinds=[{id:'kliner',label:'K-Liner (Kurzliner)'},{id:'inliner',label:'Schlauchliner (Inliner)'}];
export const linerStages=[
 {title:'Blankes Rohr, großer Hohlraum',text:'Das Altrohr ist im Scheitel gebrochen, Scherben fehlen. Dahinter hat das Wasser einen großen Hohlraum ausgespült. Noch ist kein Liner eingebaut – von innen sieht man direkt in den Hohlraum.',caption:'Ausgangslage'},
 {title:'Bohrstelle einmessen',text:'Bevor saniert wird, fährt der Roboter mit der CutterCam an den Schaden. Die Stelle über dem Hohlraum wird eingemessen und markiert: Station in der Haltung und Lage im Rohrumfang als Uhrzeigerposition. Genau hier wird später durch den Liner gebohrt. Danach fährt der Roboter zurück.',caption:'Station und Uhrzeit festhalten'},
 {title:'Liner einbauen',text:'Der K-Liner fährt auf einem Packer ein, wird über der Schadstelle aufgeblasen und an die Rohrwand gepresst. Nach dem Aushärten wird der Packer entspannt und herausgezogen. Der Liner überbrückt den Bruch – den Hohlraum dahinter sieht man von innen nicht mehr, die eingemessene Stelle bleibt bekannt.',textInliner:'Der Schlauchliner wird in die Haltung eingestülpt, legt sich an die Rohrwand und härtet aus. Er überbrückt den Bruch – den Hohlraum dahinter sieht man von innen nicht mehr, die eingemessene Stelle bleibt bekannt.',caption:'Liner rein'},
 {title:'Zur eingemessenen Stelle',text:'Der Roboter fährt mit dem Kegelfräser auf die eingemessene Station und dreht das Drehmodul hinter der CutterCam auf die notierte Uhrzeigerposition. Die Markierung zeigt, wo der Liner geöffnet wird.',caption:'Anfahren nach Aufmaß'},
 {title:'Liner öffnen',text:'Der Kegelfräser hebt an und dringt mit der Spitze durch den Liner – genau an der eingemessenen Stelle, hinter der der Hohlraum liegt. Die Bohrung wird nur so weit geöffnet, dass der Verpresskegel sie sicher überdeckt. Danach senkt der Fräser ab; die Späne fallen in die Sohle.',caption:'Bohrung mit dem Kegelfräser'},
 {title:'Werkzeug wechseln',text:'Der Roboter fährt zurück zum Schacht. Dort wird der Kegelfräser gegen den DVK-Flex Verpresskegel getauscht: Der Kegel wird auf dieselbe Spindel geschraubt und der Verpressschlauch auf die schräg nach unten zeigende Messingtülle gesteckt. Danach fährt der Roboter wieder an die Bohrung.',caption:'Kegelfräser ab, Verpresskegel auf'},
 {title:'DVK-Flex anpressen',text:'Das Drehmodul stellt denselben Winkel wie beim Öffnen ein, der Arm hebt den Kegel an. Die rote Dichtauflage legt sich rund um die Bohrung an den Liner und wird leicht gestaucht. Der Auslass sitzt mittig über dem Loch.',caption:'Abdichten an der Bohrung'},
 {title:'Hohlraum verpressen',text:'Verpressmörtel läuft durch den Schlauch, die schräge Messingtülle und den Kegel in die Bohrung. Hinter dem Liner breitet er sich aus, füllt zuerst die tiefen Stellen am Altrohr und steigt dann, bis der große Hohlraum voll ist.',caption:'Verfüllen hinter dem Liner'},
 {title:'Aushärten & kontrollieren',text:'Der Kegel bleibt angepresst, bis der Mörtel angezogen hat. Dann senkt der Arm ab: Die Bohrung ist mit Mörtel verschlossen und der Hohlraum hinter dem Liner verfüllt. Der Roboter fährt zurück.',caption:'Ergebnis'}
];
export const linerEnd=linerStages.length-.001;

const cavEdge=a=>1+.08*Math.sin(3*a+.7)+.05*Math.sin(5*a+2)+.03*Math.sin(9*a+.3);
const breakEdge=a=>1+.1*Math.sin(4*a+.3)+.07*Math.sin(7*a+1.1)+.05*Math.sin(13*a+2.4)+.035*Math.sin(23*a+.8)+.02*Math.sin(41*a+1.7);

// axisY: world height of the CutterCam rotary axis with the robot standing on the liner.
export function linerSpec(dn,kind='kliner',axisY=-18){
 const R=dn/2,w=18,tl=Math.round(dn*.03)/2,RL=R-tl,Rm=R+w/2,roll=-.3;
 // Hole: where the tool axis at the working roll meets the liner.
 const c=Math.cos(roll),s=Math.sin(roll),reach=-axisY*c+Math.sqrt(RL*RL-axisY*axisY*s*s);
 const holeP=V(0,axisY+reach*c,reach*s),holeU=V(0,c,s),phiH=Math.atan2(holeP.z,holeP.y);
 const spec={dn,kind,R,w,tl,RL,Rm,roll,axisY,holeP,holeU,phiH,
  x0:-4600,x1:1600,water:.04*dn,station:12.4,
  // Large washed-out void (user: "Riesen-Hohlraum") above a broken crown section.
  cav:{cx:30,cs:-.12*Rm,ax:300+.35*dn,as:150+.3*dn,H:200+.3*dn},
  brk:{cx:-6,cs:Rm*phiH,ax:.5*(300+.35*dn),as:.55*(150+.3*dn)},
  // The cone cutter pierces the liner until the bore is about Ø 19 mm outside.
  lowCut:-55,lowCone:-50,press:.8,plunge:tl+19.5,
  tip:{cutter:V(millingSpec.spindleX,coneCutterSpec.tipY,0),cone:V(millingSpec.spindleX,coneSpec.mountY+coneSpec.height,0)}};
 spec.holeIn=coneCutterRadius(spec.plunge);spec.holeOut=coneCutterRadius(spec.plunge-tl);
 // The K-liner bridges the whole breakout with overlap on sound pipe.
 const b=spec.brk;spec.kliner={x0:b.cx-1.3*b.ax-150,x1:b.cx+1.3*b.ax+150,feather:45};
 // Clock position looking downstream (+x): 12 at the crown, -z is the left side.
 spec.clock=((12+phiH*6/Math.PI)%12+12)%12||12;
 return spec;
}
// Distance from the rotary axis to the liner along a roll angle.
export function reachToLiner(spec,roll){const c=Math.cos(roll),s=Math.sin(roll),a=spec.axisY;return -a*c+Math.sqrt(spec.RL*spec.RL-a*a*s*s);}
export function cavityRho(spec,x,s){const c=spec.cav,u=(x-c.cx)/c.ax,v=(s-c.cs)/c.as;return Math.hypot(u,v)/cavEdge(Math.atan2(v,u));}
export function cavityHeight(spec,x,s){const r=cavityRho(spec,x,s);if(r>=1)return 0;const c=spec.cav,a=Math.atan2((s-c.cs)/c.as,(x-c.cx)/c.ax);return c.H*Math.pow(1-r*r,.55)*(1+.1*r*Math.sin(2*a+1.3));}
export function breakRho(spec,x,s){const b=spec.brk,u=(x-b.cx)/b.ax,v=(s-b.cs)/b.as;return Math.hypot(u,v)/breakEdge(Math.atan2(v,u));}
// Radial floor and roof of the void at a developed position (s = Rm·phi).
export function voidFloor(spec,x,s){return breakRho(spec,x,s)<1?spec.R:spec.R+spec.w;}
export function voidRoof(spec,x,s){return spec.R+spec.w+cavityHeight(spec,x,s);}
export function linerThickness(spec,x){
 if(spec.kind!=='kliner')return x>=spec.x0&&x<=spec.x1?spec.tl:0;
 const k=spec.kliner;if(x<=k.x0||x>=k.x1)return 0;return spec.tl*Math.max(.12,smooth(Math.min(x-k.x0,k.x1-x)/k.feather));
}

// Deterministic process state; every time can be seeked directly. Stages 4–8
// keep the timing of the opening/grouting sequence (process time pt = t-2).
export function linerState(t,spec){
 t=clamp(t,0,linerEnd);const stage=Math.min(linerStages.length-1,Math.floor(t)),f=t-stage,R=spec.roll,P=spec.plunge,pt=t-2,away=-2700;
 const st={stage,f,t,pt,travel:0,roll:0,off:spec.lowCut,tool:t<5.5?'cutter':'cone',spin:false,plunge:0,hose:0,fill:0,cure:0,robotAway:false,liner:1,linerX:0,linerScale:1,packer:null,front:null,marker:0,laser:0};
 if(stage<=1)st.tool='none';
 // Liner: absent before stage 2, installed during it.
 if(stage<2)st.liner=0;
 else if(stage===2){
  if(spec.kind==='kliner'){
   st.linerX=lerp(away,0,smooth(f/.32));st.linerScale=lerp(.8,1,smooth((f-.32)/.18));
   const inflate=smooth((f-.32)/.18)*(1-smooth((f-.72)/.08));st.packer={x:f<.8?st.linerX:lerp(0,away,smooth((f-.8)/.2)),r:lerp(.76,.995,inflate)};
  }else st.front=lerp(spec.x0,spec.x1,smooth((f-.04)/.82));
 }
 // Robot: measuring run without a tool, away while the liner goes in.
 if(stage===0||stage===2){st.travel=away;st.robotAway=true;}
 else if(stage===1){st.travel=f<.5?lerp(away,0,smooth(f/.36)):lerp(0,away,smooth((f-.8)/.2));st.roll=R*smooth((f-.36)/.14)*(1-smooth((f-.66)/.13));st.laser=smooth((f-.46)/.06)*(1-smooth((f-.62)/.05));}
 else if(stage===3){st.travel=lerp(away,0,smooth(f/.5));st.roll=R*smooth((f-.55)/.35);}
 // The marker exists from the measurement until the cutter starts to open.
 st.marker=t<1.55?0:t<1.6?smooth((t-1.55)/.05):stage<4?1:1-smooth((f-.12)/.12);
 if(stage>=4){
  const s=stage-2;
  if(s===3)st.travel=f<.5?away*smooth(f/.42):away*(1-smooth((f-.53)/.42));
  else if(s===6)st.travel=-1600*smooth((f-.62)/.38);
  if(s===2)st.roll=R*(1-smooth((f-.88)/.12));
  else if(s===4)st.roll=R*smooth(f/.3);
  else if(s===5)st.roll=R;
  else if(s===6)st.roll=R*(1-smooth((f-.42)/.16));
  if(s===2){st.off=f<.25?lerp(spec.lowCut,-10,smooth(f/.25)):f<.7?lerp(-10,P,(f-.25)/.45):lerp(P,spec.lowCut,smooth((f-.72)/.2));st.spin=f>.06&&f<.9;}
  if(s>=3)st.off=spec.lowCone;
  if(s===4)st.off=lerp(spec.lowCone,spec.press,smooth((f-.32)/.53));
  if(s===5)st.off=spec.press;
  if(s===6)st.off=lerp(spec.press,spec.lowCone,smooth((f-.3)/.2));
  st.hose=s===5?smooth(f/.22):s>5?1:0;
  st.fill=s===5?smooth((f-.22)/.73):s>5?1:0;
  st.cure=s===6?smooth(f/.35):0;
 }
 st.plunge=pt>=2.7?P:stage===4?clamp(st.off,0,P):0;
 st.holeIn=coneCutterRadius(st.plunge);st.holeOut=coneCutterRadius(st.plunge-spec.tl);
 return st;
}
const clockText=spec=>`${Math.round(spec.clock)||12} Uhr`;
export function linerMeasure(spec){return `Station ${spec.station.toFixed(2).replace('.',',')} m · ${clockText(spec)}`;}
export function linerReadout(st,spec,squash=0){
 const deg=Math.round(-st.roll*180/Math.PI),m=linerMeasure(spec);
 if(st.stage===0)return {text:'Blankes Altrohr · Scheitel gebrochen · großer Hohlraum dahinter',flag:'false'};
 if(st.stage===1)return st.f<.36?{text:'CutterCam fährt an den Schaden',flag:'false'}:st.f<.55?{text:`Drehmodul zeigt auf die Bruchstelle · ${deg}°`,flag:'false'}:{text:`Eingemessen: ${m} (Beispielwerte)`,flag:'locked'};
 if(st.stage===2){
  if(spec.kind!=='kliner')return {text:st.f<.86?`Schlauchliner wird eingestülpt · ${Math.round(clamp((st.f-.04)/.82)*100)} %`:'Schlauchliner härtet aus · liegt an der Rohrwand',flag:'true'};
  return {text:st.f<.32?'K-Liner auf dem Packer fährt ein':st.f<.5?'Packer bläst auf · Liner legt sich an die Wand':st.f<.72?'K-Liner härtet aus':st.f<.8?'Packer wird entspannt':'Packer wird herausgezogen',flag:'true'};
 }
 if(st.stage===3)return {text:st.f<.55?`Kegelfräser fährt zur ${m.split(' · ')[0]}`:`Drehmodul auf ${clockText(spec)} · ${deg}°`,flag:'false'};
 if(st.stage===4)return st.holeOut>0?{text:`Liner geöffnet · Bohrung innen Ø ${Math.round(st.holeIn*2)}, außen Ø ${Math.round(st.holeOut*2)} mm`,flag:'true'}:{text:st.off>-12?'Kegelfräser dringt in den Liner ein':'Kegelfräser hebt an',flag:'true'};
 if(st.stage===5)return {text:st.tool==='cutter'?'Rückfahrt zum Schacht · Werkzeugwechsel':'DVK-Flex Verpresskegel auf der Spindel · Schlauch angeschlossen',flag:'locked'};
 if(st.stage===6)return squash>.2?{text:`Dichtauflage angepresst · am Rand bis ${squash.toFixed(1).replace('.',',')} mm gestaucht`,flag:'locked'}:{text:`Kegel richtet sich zur Bohrung aus · ${deg}°`,flag:'false'};
 if(st.stage===7)return st.fill>0?{text:`Verpressen · Hohlraum ${Math.round(st.fill*100)} % verfüllt`,flag:'true'}:{text:'Mörtel läuft durch den Verpressschlauch',flag:'true'};
 return st.cure<1?{text:'Mörtel zieht an · Kegel bleibt angepresst',flag:'true'}:{text:'Bohrung verschlossen · Hohlraum verfüllt',flag:'locked'};
}

const surf=(x,phi,r)=>V(x,r*Math.cos(phi),r*Math.sin(phi));
function geom(pos,idx,uv,col){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));if(uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));if(col)g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();return g;}
function mesh(g,m){const o=new THREE.Mesh(g,m);o.castShadow=o.receiveShadow=true;return o;}
// Grid surface over (i,j) with a vertex function; optional closing in j.
function gridSurface(ni,nj,fn,wrap=false){
 const pos=[],uv=[],idx=[],col=[],cols=wrap?nj:nj+1;
 for(let i=0;i<=ni;i++)for(let j=0;j<cols;j++){const v=fn(i/ni,j/(wrap?nj:nj));pos.push(v.p.x,v.p.y,v.p.z);uv.push(v.u,v.v);col.push(...(v.c||[1,1,1]));}
 for(let i=0;i<ni;i++)for(let j=0;j<nj;j++){const a=i*cols+j,b=i*cols+(wrap?(j+1)%nj:j+1),c=a+cols,d=b+cols;idx.push(a,c,b,b,c,d);}
 return geom(pos,idx,uv,col);
}
function strip(xs,lower,upper,z){
 // Section face in the plane z between two curves y=lower(x), y=upper(x).
 const pos=[],uv=[],idx=[];let prev=-1;
 for(const x of xs){const a=lower(x),b=upper(x);if(b-a<.25){prev=-1;continue;}const n=pos.length/3;pos.push(x,a,z,x,b,z);uv.push(x/90,a/90,x/90,b/90);if(prev>=0)idx.push(prev,n,prev+1,n,n+1,prev+1);prev=n;}
 return geom(pos,idx,uv);
}
const range=(a,b,n)=>Array.from({length:n+1},(_,i)=>a+(b-a)*i/n);
function linerTexture(){
 // Resin-impregnated liner: fine circumferential bands and slight streaks.
 const size=256,data=new Uint8Array(size*size*4);let seed=8123;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const bands=Array.from({length:16},()=>({f:Math.round(2+rnd()*22),p:rnd()*TAU,a:.15+rnd()*.7,w:Math.round((rnd()-.5)*6)}));
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size;let h=0;for(const b of bands)h+=b.a*Math.sin(TAU*(b.f*u+b.w*v)+b.p);
  const n=rnd()*.035,k=.86+.012*h+n;const c=[Math.round(176*k),Math.round(156*k),Math.round(88*k)];data.set([...c.map(q=>Math.min(255,q)),255],(y*size+x)*4);
 }
 const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
}
// Hole in the liner and breakout in the old pipe are cut per fragment, so the
// hole opens continuously while the cutter plunges and seeking stays exact.
function holeShader(material,uniforms,kind){
 material.onBeforeCompile=sh=>{
  Object.assign(sh.uniforms,uniforms);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vHoleW;').replace('#include <project_vertex>','#include <project_vertex>\nvHoleW=(modelMatrix*vec4(transformed,1.0)).xyz;');
  const test=kind==='liner'
   ?'{vec3 q=vHoleW-uHoleP;float d=length(q-dot(q,uHoleU)*uHoleU);float k=clamp((length(vHoleW.yz)-uHoleR.x)/max(.01,uHoleR.y-uHoleR.x),0.,1.);if(d<mix(uHoleR.z,uHoleR.w,k))discard;}'
   :'{float s=uBreak.x*atan(vHoleW.z,vHoleW.y);vec2 q=vec2((vHoleW.x-uBreak.y)/uBreak.z,(s-uBreak.w)/uBreak2.x);float a=atan(q.y,q.x);float e=1.+.1*sin(4.*a+.3)+.07*sin(7.*a+1.1)+.05*sin(13.*a+2.4)+.035*sin(23.*a+.8)+.02*sin(41.*a+1.7);if(length(q)<e&&abs(vHoleW.x-uBreak.y)<uBreak.z*1.4)discard;}';
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>\nvarying vec3 vHoleW;${kind==='liner'?'uniform vec3 uHoleP;uniform vec3 uHoleU;uniform vec4 uHoleR;':'uniform vec4 uBreak;uniform vec4 uBreak2;'}`).replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\n'+test);
 };
 material.customProgramCacheKey=()=>'liner-'+kind;
}

export class LinerScene{
 constructor(dn,cutPlane,options={}){
  const spec=this.spec=linerSpec(dn,options.kind,options.axisY);this.cutPlane=cutPlane;
  this.group=new THREE.Group();this.group.name='Liner mit Hohlraum dahinter';
  const {R,w,tl,RL,Rm}=spec;
  const pipeTex=surfaceTextures('pipe'),soilTex=surfaceTextures('soil'),mortarTex=surfaceTextures('mortar');
  this.pipeMat=new THREE.MeshStandardMaterial({color:'#422b21',...pipeTex,bumpScale:.12,roughness:1,metalness:0,envMapIntensity:.18,side:THREE.DoubleSide});
  this.capMat=new THREE.MeshStandardMaterial({color:'#6b4632',map:pipeTex.map,bumpMap:pipeTex.bumpMap,bumpScale:.3,roughness:1,envMapIntensity:.12});
  const lt=linerTexture();lt.repeat.set(1,1);
  this.linerMat=new THREE.MeshStandardMaterial({color:'#ffffff',map:lt,roughness:.42,metalness:0,envMapIntensity:.55,side:THREE.DoubleSide});
  this.linerCapMat=new THREE.MeshStandardMaterial({color:'#9b8748',roughness:.8,metalness:0});
  this.linerEdgeMat=new THREE.MeshStandardMaterial({color:'#b09a58',roughness:.75,metalness:0,side:THREE.DoubleSide});
  this.soilMat=new THREE.MeshStandardMaterial({color:'#3d2a19',...soilTex,bumpScale:1.6,roughness:.88,vertexColors:true,side:THREE.DoubleSide});
  this.soilCapMat=new THREE.MeshStandardMaterial({color:'#48301d',...surfaceTextures('soil'),bumpScale:1.6,roughness:.9});
  this.groutMat=new THREE.MeshStandardMaterial({color:'#454d43',...mortarTex,bumpScale:1.1,roughness:.76,side:THREE.DoubleSide});
  this.groutCapMat=this.groutMat.clone();this.groutCapMat.side=THREE.FrontSide;
  this.holeUniforms={uHoleP:{value:spec.holeP.clone()},uHoleU:{value:spec.holeU.clone()},uHoleR:{value:new THREE.Vector4(RL,R,0,0)}};
  holeShader(this.linerMat,this.holeUniforms,'liner');
  const b=spec.brk;this.breakUniforms={uBreak:{value:new THREE.Vector4(Rm,b.cx,b.ax,b.cs)},uBreak2:{value:new THREE.Vector4(b.as,0,0,0)}};
  holeShader(this.pipeMat,this.breakUniforms,'pipe');
  // Liner materials are clipped separately: by the section and, while a
  // Schlauchliner is inverted, by its moving front.
  this.clipped=[this.pipeMat,this.soilMat,this.groutMat];this.frontPlane=new THREE.Plane(V(-1,0,0),0);
  this.caps=[];
  this.buildPipe();this.buildLiner();this.buildInstall();this.buildMarker();this.buildSoil();this.buildGrout();this.buildWater();this.buildChips();
  // Pipe, liner and soil are thin shells around a section: as shadow casters they
  // only produce stray patterns inside. Robot and tools keep casting onto the liner.
  this.group.traverse(o=>{if(o.isMesh)o.castShadow=false;});
  this.hose=null;this.hoseKey='';this.lastFill=-1;this.lastHole='';
  this.setCut(false);this.update(linerState(0,spec));
 }
 buildPipe(){
  const {R,w,x0,x1}=this.spec,joints=[-1650,850],n=Math.round((x1-x0)/20),na=160;
  const bulge=x=>joints.reduce((s,j)=>s+16*smooth(1-Math.abs(x-j)/80),0);
  // Texture seam at the invert, never at the crown where the work happens.
  const inner=gridSurface(n,na,(u,v)=>{const x=lerp(x0,x1,u),a=v*TAU+Math.PI;return{p:surf(x,a,R),u:x/120,v:a*R/120};},true);
  const outer=gridSurface(n,na,(u,v)=>{const x=lerp(x0,x1,u),a=v*TAU+Math.PI;return{p:surf(x,a,R+w+bulge(x)),u:x/120,v:a*(R+w)/120};},true);
  this.pipeInner=mesh(inner,this.pipeMat);this.pipeOuter=mesh(outer,this.pipeMat);this.pipeInner.name='Altrohr Steinzeug · Innenseite';this.pipeOuter.name='Altrohr · Außenseite mit Muffen';
  const ends=new THREE.Group();for(const x of [x0,x1]){const ring=new THREE.RingGeometry(R,R+w,96,1);ring.rotateY(Math.PI/2);const o=mesh(ring,this.pipeMat);o.position.x=x;ends.add(o);}
  this.group.add(this.pipeInner,this.pipeOuter,ends);
  // Broken edge of the old pipe around the washed-out spot.
  const s=this.spec,bk=s.brk,pos=[],idx=[],uv=[],N=220;
  for(let i=0;i<=N;i++){const a=i/N*TAU,e=breakEdge(a),x=bk.cx+bk.ax*e*Math.cos(a),phi=(bk.cs+bk.as*e*Math.sin(a))/s.Rm;
   for(const r of [R+.2,R+w-.2]){const p=surf(x,phi,r);pos.push(p.x,p.y,p.z);uv.push(i/N*6,r/30);}
   if(i<N){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}
  this.pipeEdgeMat=new THREE.MeshStandardMaterial({color:'#4d3226',map:this.pipeMat.map,bumpMap:this.pipeMat.bumpMap,bumpScale:.4,roughness:1,metalness:0,envMapIntensity:.15,side:THREE.DoubleSide});this.clipped.push(this.pipeEdgeMat);
  this.breakEdge=mesh(geom(pos,idx,uv),this.pipeEdgeMat);this.breakEdge.name='Bruchkante des Altrohrs';this.group.add(this.breakEdge);
  // Joint seams on the inside, visible beyond a K-liner.
  const seam=new THREE.MeshStandardMaterial({color:'#120b08',roughness:1});
  for(const j of joints){const t=mesh(new THREE.TorusGeometry(R-.3,1.4,6,128),seam);t.rotation.y=Math.PI/2;t.position.x=j;this.group.add(t);this.clipped.push(seam);}
  // Section faces of the old pipe wall (only with the pipe cut open).
  const xs=range(x0,x1,Math.round((x1-x0)/4));
  const top=strip(xs,x=>breakRho(s,x,0)<1?1e9:R,x=>R+w+bulge(x),0);
  const bottom=strip(xs,()=>-R-w,()=>-R,0);
  for(const g of [top,bottom]){const o=mesh(g,this.capMat);o.castShadow=false;this.group.add(o);this.caps.push(o);}
 }
 buildLiner(){
  const s=this.spec,{R}=s,x0=s.kind==='kliner'?s.kliner.x0:s.x0+5,x1=s.kind==='kliner'?s.kliner.x1:s.x1-5,n=Math.round((x1-x0)/8),na=192;
  const inner=gridSurface(n,na,(u,v)=>{const x=lerp(x0,x1,u),a=v*TAU+Math.PI,r=R-linerThickness(s,x)-.05;return{p:surf(x,a,r),u:x/600,v:a*r/600};},true);
  const outer=gridSurface(n,na,(u,v)=>{const x=lerp(x0,x1,u),a=v*TAU+Math.PI;return{p:surf(x,a,R-.15),u:x/600,v:a*R/600};},true);
  this.linerInner=mesh(inner,this.linerMat);this.linerOuter=mesh(outer,this.linerMat);this.linerInner.name=s.kind==='kliner'?'K-Liner (Kurzliner)':'Schlauchliner';this.linerOuter.name='Liner · Außenseite';
  // Moves in on the packer and widens to the wall while it is installed.
  this.linerGroup=new THREE.Group();this.linerGroup.name='Liner';this.group.add(this.linerGroup);this.linerGroup.add(this.linerInner,this.linerOuter);this.linerEnds=[];
  for(const x of [x0,x1]){const t=linerThickness(s,x+(x===x0?.01:-.01))||.6;const ring=new THREE.RingGeometry(R-t-.1,R-.1,128,1);ring.rotateY(Math.PI/2);const o=mesh(ring,this.linerEdgeMat);o.position.x=x;this.linerGroup.add(o);this.linerEnds.push(o);}
  const xs=range(x0,x1,Math.round((x1-x0)/3));
  for(const g of [strip(xs,x=>R-linerThickness(s,x),()=>R-.15,.2),strip(xs,()=>-R+.15,x=>-R+linerThickness(s,x),.2)]){const o=mesh(g,this.linerCapMat);o.castShadow=false;this.linerGroup.add(o);this.caps.push(o);}
  this.holeWall=mesh(new THREE.BufferGeometry(),this.linerEdgeMat);this.holeWall.name='Verpressbohrung im Liner';this.holeWall.visible=false;this.group.add(this.holeWall);
  this.plugMat=this.groutMat.clone();this.plug=mesh(new THREE.BufferGeometry(),this.plugMat);this.plug.name='Mörtel in der Bohrung';this.plug.visible=false;this.group.add(this.plug);
 }
 buildInstall(){
  const s=this.spec;
  // K-liner packer: inflatable rubber body carrying the liner, pulled on a rope.
  if(s.kind==='kliner'){
   const L=s.kliner.x1-s.kliner.x0+120,prof=[[0,-L/2-55],[.5,-L/2-35],[.95,-L/2+5],[1,-L/2+30],[1,L/2-30],[.95,L/2-5],[.5,L/2+35],[0,L/2+55]];
   const g=new THREE.LatheGeometry(prof.map(([r,y])=>new THREE.Vector2(r,y)),64);g.rotateZ(-Math.PI/2);
   // Translucent, so the liner it carries stays visible in the section.
   this.packerMat=new THREE.MeshStandardMaterial({color:'#1d2024',roughness:.5,metalness:.05,side:THREE.DoubleSide,transparent:true,opacity:.5,depthWrite:false});this.clipped.push(this.packerMat);
   this.packer=mesh(g,this.packerMat);this.packer.name='Packer · bläst den K-Liner an die Wand';this.packer.visible=false;this.group.add(this.packer);
   this.packerOffset=(s.kliner.x0+s.kliner.x1)/2;this.packerHalf=L/2+55;
   const rope=new THREE.CylinderGeometry(4,4,1,10);rope.rotateZ(Math.PI/2);rope.translate(.5,0,0);
   this.rope=mesh(rope,new THREE.MeshStandardMaterial({color:'#2e3a44',roughness:.7}));this.rope.name='Zugseil und Luftschlauch des Packers';this.rope.visible=false;this.group.add(this.rope);
  }else{
   // Inversion front of the Schlauchliner.
   this.frontRing=mesh(new THREE.TorusGeometry(s.R-s.tl*1.2,s.tl*1.6,10,128),this.linerEdgeMat);this.frontRing.rotation.y=Math.PI/2;this.frontRing.name='Einstülpfront des Schlauchliners';this.frontRing.visible=false;this.group.add(this.frontRing);
  }
 }
 buildMarker(){
  // Measured drilling point: stays where it was measured until the liner is opened.
  const s=this.spec,m=new THREE.MeshBasicMaterial({color:'#ff3b30',transparent:true,opacity:1,depthWrite:false,toneMapped:false});this.markerMat=m;
  const g=new THREE.Group();g.name='Eingemessene Bohrstelle';
  g.add(new THREE.Mesh(new THREE.TorusGeometry(24,1.8,8,64),m));
  for(const r of [0,Math.PI/2]){const b=new THREE.Mesh(new THREE.BoxGeometry(70,2.6,1),m);b.rotation.z=r;g.add(b);}
  g.add(new THREE.Mesh(new THREE.CircleGeometry(4,24),m));
  g.position.copy(s.holeP).addScaledVector(s.holeU,-1.2);g.quaternion.setFromUnitVectors(V(0,0,1),s.holeU.clone().negate());
  this.marker=g;this.marker.visible=false;this.group.add(g);
  const lg=new THREE.CylinderGeometry(.8,.8,1,10);lg.translate(0,.5,0);
  this.laserMat=new THREE.MeshBasicMaterial({color:'#ff2a1f',transparent:true,opacity:.85,depthWrite:false,toneMapped:false});
  this.laser=new THREE.Mesh(lg,this.laserMat);this.laser.name='Messstrahl der CutterCam';this.laser.visible=false;this.group.add(this.laser);
 }
 applyLinerClip(front){
  const planes=[...(this.cut?[this.cutPlane]:[]),...(front!==null?[this.frontPlane]:[])],key=planes.length+(this.cut?'c':'')+(front!==null?'f':'');
  if(front!==null)this.frontPlane.constant=front;
  if(key===this.linerClipKey)return;this.linerClipKey=key;
  for(const m of [this.linerMat,this.linerEdgeMat,this.linerCapMat]){m.clippingPlanes=planes.length?planes:null;m.clipShadows=this.cut;m.needsUpdate=true;}
 }
 buildSoil(){
  // Soil draped over the crown around the void; the inner face bulges into
  // the washed-out cavity above the broken pipe.
  const s=this.spec,{R,w,Rm}=s,c=s.cav,sx0=c.cx-c.ax-260,sx1=c.cx+c.ax+260,pm=Math.min(2.2,(Math.abs(c.cs)+c.as)/Rm+.9),T=c.H+150;
  const thick=(x,phi)=>{const u=(x-(sx0+sx1)/2)/((sx1-sx0)/2),v=phi/pm,lump=1+.06*Math.sin(x*.011+phi*2)+.04*Math.sin(x*.027-phi*3.5)+.025*Math.cos(phi*6+x*.009);return T*Math.pow(Math.max(0,1-u*u),.5)*Math.pow(Math.max(0,1-v*v),.38)*lump;};
  const innerR=(x,phi)=>R+w+.8+cavityHeight(s,x,Rm*phi);
  const outerR=(x,phi)=>Math.max(innerR(x,phi)+(cavityHeight(s,x,Rm*phi)>0?35:0),R+w+.8+thick(x,phi));
  this.soilOuterR=outerR;this.soilInnerR=innerR;
  const ni=Math.round((sx1-sx0)/9),nj=Math.round(pm*2*Rm/8);
  const colour=(x,phi,inner)=>{const h=cavityHeight(s,x,Rm*phi);if(inner&&h>0){const k=.6+.12*Math.sin(x*.05+phi*9)+.12*clamp(h/c.H);return[k,k*.9,k*.76];}const k=.85+.1*Math.sin(x*.03+phi*5);return[k,k*.94,k*.84];};
  const outer=gridSurface(ni,nj,(u,v)=>{const x=lerp(sx0,sx1,u),phi=lerp(-pm,pm,v);return{p:surf(x,phi,outerR(x,phi)),u:x/85,v:phi*Rm/85,c:colour(x,phi,false)};});
  const inner=gridSurface(ni,nj,(u,v)=>{const x=lerp(sx0,sx1,u),phi=lerp(-pm,pm,v);return{p:surf(x,phi,innerR(x,phi)),u:x/85,v:phi*Rm/85,c:colour(x,phi,true)};});
  this.soilOuter=mesh(outer,this.soilMat);this.soilInner=mesh(inner,this.soilMat);this.soilOuter.name='Erdreich';this.soilInner.name='Ausgespülter Hohlraum hinter dem Liner';
  this.group.add(this.soilOuter,this.soilInner);
  const xs=range(sx0,sx1,ni*2);
  const cap=mesh(strip(xs,x=>innerR(x,0),x=>outerR(x,0),0),this.soilCapMat);cap.castShadow=false;this.group.add(cap);this.caps.push(cap);
  // Gravel grains in the cut face.
  let seed=31337;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),dummy=new THREE.Object3D();
  const stones=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:'#514432',roughness:1}),220);let k=0;
  for(let i=0;i<2000&&k<220;i++){const x=lerp(sx0,sx1,rnd()),lo=innerR(x,0)+5,hi=outerR(x,0)-5;if(hi-lo<12)continue;const y=lerp(lo,hi,rnd()),size=i%9===0?4+rnd()*6:1+rnd()*2.6;dummy.position.set(x,y,.9);dummy.scale.set(size,size*(.35+rnd()*.6),.6+rnd());dummy.rotation.set((rnd()-.5)*.7,(rnd()-.5)*.7,rnd()*TAU);dummy.updateMatrix();stones.setMatrixAt(k,dummy.matrix);stones.setColorAt(k,new THREE.Color().setHSL(.08+rnd()*.06,.13+rnd()*.25,.25+rnd()*.34));k++;}
  stones.count=k;stones.instanceMatrix.needsUpdate=true;this.group.add(stones);this.caps.push(stones);
 }
 buildGrout(){
  const s=this.spec,c=s.cav,N=96;
  // Volume table: grout settles from the lowest points upwards (world height).
  const xs=range(c.cx-c.ax*1.15,c.cx+c.ax*1.15,N),ss=range(c.cs-c.as*1.15,c.cs+c.as*1.15,N),cells=[];let ymin=1e9,ymax=-1e9;
  for(const x of xs)for(const v of ss){if(cavityRho(s,x,v)>=1)continue;const phi=v/s.Rm,co=Math.cos(phi),lo=voidFloor(s,x,v),hi=voidRoof(s,x,v);cells.push([lo,hi,co]);ymin=Math.min(ymin,lo*co);ymax=Math.max(ymax,hi*co);}
  const levels=range(ymin,ymax,80),vol=levels.map(Y=>cells.reduce((sum,[lo,hi,co])=>sum+Math.max(0,Math.min(hi,Y/co)-lo),0)),total=vol[vol.length-1];
  this.levelFor=f=>{const target=f*total;for(let i=1;i<vol.length;i++)if(vol[i]>=target)return lerp(levels[i-1],levels[i],(target-vol[i-1])/Math.max(1e-6,vol[i]-vol[i-1]));return ymax+1;};
  this.groutGrid={nr:30,na:128};
  const g=new THREE.BufferGeometry(),count=(this.groutGrid.nr+1)*this.groutGrid.na,idx=[],uv=[];
  for(let i=0;i<this.groutGrid.nr;i++)for(let j=0;j<this.groutGrid.na;j++){const a=i*this.groutGrid.na+j,b=i*this.groutGrid.na+(j+1)%this.groutGrid.na,cc=a+this.groutGrid.na,d=b+this.groutGrid.na;idx.push(a,b,cc,b,d,cc);}
  for(let i=0;i<=this.groutGrid.nr;i++)for(let j=0;j<this.groutGrid.na;j++){const r=i/this.groutGrid.nr,a=j/this.groutGrid.na*TAU;uv.push(r*Math.cos(a)*c.ax/80,r*Math.sin(a)*c.as/80);}
  g.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(count*3),3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);
  this.grout=mesh(g,this.groutMat);this.grout.name='Verpressmörtel hinter dem Liner';this.group.add(this.grout);
  this.groutCap=mesh(new THREE.BufferGeometry(),this.groutCapMat);this.groutCap.castShadow=false;this.group.add(this.groutCap);
 }
 groutTop(x,v,fill){
  const s=this.spec;if(cavityRho(s,x,v)>=1)return null;
  const lo=voidFloor(s,x,v),hi=voidRoof(s,x,v),phi=v/s.Rm,co=Math.max(.05,Math.cos(phi));
  const level=fill>0?Math.min(hi,this.levelFor(Math.min(1,fill))/co):lo;
  // A thin film first runs from the bore over the floor of the void.
  const hp=s.holeP,dist=Math.hypot(x-hp.x,v-s.Rm*s.phiH)/(Math.max(s.cav.ax,s.cav.as)*1.6),spread=clamp(fill/.12),film=fill>0?lo+2.4*(1-smooth((dist-spread+.15)/.15)):lo;
  return {lo,top:Math.min(hi,Math.max(level,film)),phi};
 }
 updateGrout(fill){
  const q=Math.round(fill*240)/240;if(q===this.lastFill)return;this.lastFill=q;
  const s=this.spec,c=s.cav,{nr,na}=this.groutGrid,a=this.grout.geometry.attributes.position;let any=false;
  for(let i=0;i<=nr;i++)for(let j=0;j<na;j++){
   const r=i/nr,ang=j/na*TAU,e=cavEdge(ang)*.999,x=c.cx+c.ax*r*e*Math.cos(ang),v=c.cs+c.as*r*e*Math.sin(ang),g=this.groutTop(x,v,q);
   let rad=g.lo-1.2;if(g.top-g.lo>.35){rad=g.top;any=true;}
   const p=surf(x,g.phi,rad);a.setXYZ(i*na+j,p.x,p.y,p.z);
  }
  a.needsUpdate=true;this.grout.geometry.computeVertexNormals();this.grout.geometry.computeBoundingSphere();this.grout.visible=any;
  this.groutCap.geometry.dispose();
  const xs=range(c.cx-c.ax*1.1,c.cx+c.ax*1.1,360);
  this.groutCap.geometry=strip(xs,x=>{const g=this.groutTop(x,0,q);return g?g.lo:0;},x=>{const g=this.groutTop(x,0,q);return g&&g.top-g.lo>.35?g.top:-1e9;},.35);
 }
 buildWater(){
  const s=this.spec,h=s.water,y=-s.RL+h,half=Math.sqrt(Math.max(1,s.RL*s.RL-y*y))-1;
  const normal=flowNormalTexture();normal.repeat.set((s.x1-s.x0)/420,2*half/260);this.waterNormal=normal;
  this.waterMat=new THREE.MeshPhysicalMaterial({color:'#2a271c',roughness:.1,metalness:0,clearcoat:.8,clearcoatRoughness:.03,normalMap:normal,normalScale:new THREE.Vector2(.45,.45),transparent:true,opacity:.92,envMapIntensity:1.2,side:THREE.DoubleSide});
  const g=new THREE.PlaneGeometry(s.x1-s.x0,2*half,1,1);g.rotateX(-Math.PI/2);
  this.water=new THREE.Mesh(g,this.waterMat);this.water.position.set((s.x0+s.x1)/2,y,0);this.water.receiveShadow=true;this.water.name='Abwasser in der Sohle';this.group.add(this.water);this.clipped.push(this.waterMat);
 }
 buildChips(){
  const n=42;this.chips=new THREE.InstancedMesh(new THREE.BoxGeometry(3.4,.7,2.2),new THREE.MeshStandardMaterial({color:'#c8b066',roughness:.7}),n);this.chips.name='Frässpäne aus dem Liner';
  let seed=99;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  this.chipData=Array.from({length:n},()=>({t:2.3+rnd()*.42,v:V((rnd()-.5)*260,-rnd()*120,(rnd()-.5)*260),spin:V(rnd()*20,rnd()*20,rnd()*20),drift:40+rnd()*60}));
  this.chips.frustumCulled=false;this.group.add(this.chips);
 }
 updateChips(t){
  const s=this.spec,d=new THREE.Object3D(),floor=-s.RL+s.water+.4;let shown=0;
  for(let i=0;i<this.chipData.length;i++){
   const c=this.chipData[i],age=(t-c.t)/.13;
   if(age<0||t>=3.2||t<2){d.position.set(0,-1e5,0);d.scale.setScalar(.001);}
   else{const fall=Math.sqrt(Math.max(0,2*(s.holeP.y-floor)/9810)),ta=Math.min(age,fall);
    d.position.copy(s.holeP).addScaledVector(s.holeU,-4).addScaledVector(c.v,ta).add(V(0,-.5*9810*ta*ta,0));
    if(age>fall){d.position.y=floor;d.position.x+=c.drift*(age-fall);}
    d.position.z=clamp(d.position.z,-Math.sqrt(Math.max(0,s.RL**2-d.position.y**2))+4,Math.sqrt(Math.max(0,s.RL**2-d.position.y**2))-4);
    d.rotation.set(c.spin.x*ta,c.spin.y*ta,c.spin.z*ta);d.scale.setScalar(1);shown++;}
   d.updateMatrix();this.chips.setMatrixAt(i,d.matrix);
  }
  this.chips.instanceMatrix.needsUpdate=true;this.chips.visible=shown>0;
 }
 updateHole(st){
  const key=[st.holeIn,st.holeOut].map(v=>v.toFixed(2)).join();if(key===this.lastHole)return;this.lastHole=key;
  const s=this.spec;this.holeUniforms.uHoleR.value.set(s.RL,s.R,st.holeIn,st.holeOut);
  this.holeWall.visible=st.holeIn>0;if(!this.holeWall.visible){this.plug.visible=false;return;}
  // Countersunk bore of the dome cutter: wide at the inside, narrower outside.
  const e1=V(1,0,0),e2=s.holeU.clone().cross(e1).normalize(),pos=[],idx=[],N=64;
  const onCyl=(rho,a,r)=>{const p=s.holeP.clone().addScaledVector(e1,rho*Math.cos(a)).addScaledVector(e2,rho*Math.sin(a)),u=s.holeU;const b=p.y*u.y+p.z*u.z,c=p.y*p.y+p.z*p.z-r*r,l=-b+Math.sqrt(Math.max(0,b*b-c));return p.addScaledVector(u,l);};
  const outer=st.holeOut>0?st.holeOut:Math.max(0,st.holeIn-1),outR=st.holeOut>0?s.R-.1:s.RL+st.plunge;
  for(let i=0;i<=N;i++){const a=i/N*TAU;for(const p of [onCyl(st.holeIn,a,s.RL-.05),onCyl(outer,a,outR)])pos.push(p.x,p.y,p.z);if(i<N){const k=i*2;idx.push(k,k+2,k+1,k+1,k+2,k+3);}}
  this.holeWall.geometry.dispose();this.holeWall.geometry=geom(pos,idx);
  // Mortar plug flush with the liner inside (shown once grout has passed).
  const pp=[],pi=[];const rings=6;pp.push(...onCyl(0,0,s.RL-.25).toArray());
  for(let r=1;r<=rings;r++)for(let i=0;i<N;i++){const p=onCyl(st.holeIn*r/rings,i/N*TAU,s.RL-.25);pp.push(p.x,p.y,p.z);}
  for(let i=0;i<N;i++)pi.push(0,1+(i+1)%N,1+i);
  for(let r=1;r<rings;r++)for(let i=0;i<N;i++){const a=1+(r-1)*N+i,b=1+(r-1)*N+(i+1)%N,c=a+N,d=b+N;pi.push(a,b,c,b,d,c);}
  this.plug.geometry.dispose();this.plug.geometry=geom(pp,pi);
 }
 setHose(points,fill){
  if(!points){if(this.hose)this.hose.visible=this.hoseFill.visible=false;return;}
  const key=points.map(p=>p.toArray().map(v=>v.toFixed(1)).join(',')).join(';')+'|'+fill.toFixed(3);if(key===this.hoseKey)return;this.hoseKey=key;
  if(!this.hose){
   this.hoseMat=new THREE.MeshStandardMaterial({color:'#adbac0',roughness:.43,transparent:true,opacity:.48,depthWrite:false});
   this.hoseFillMat=this.groutMat.clone();this.hoseFillMat.clippingPlanes=null;
   this.hose=mesh(new THREE.BufferGeometry(),this.hoseMat);this.hose.name='Verpressschlauch';this.hoseFill=mesh(new THREE.BufferGeometry(),this.hoseFillMat);this.group.add(this.hose,this.hoseFill);
  }
  const curve=new THREE.CatmullRomCurve3(points);this.hose.geometry.dispose();this.hose.geometry=new THREE.TubeGeometry(curve,160,7,12,false);this.hose.visible=true;
  this.hoseFill.visible=fill>0;this.hoseFill.geometry.dispose();
  if(fill>0){const pts=range(1-fill,1,Math.max(2,Math.round(fill*80))).map(u=>curve.getPointAt(u));this.hoseFill.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),Math.max(4,Math.round(fill*160)),5.2,10,false);}
  else this.hoseFill.geometry=new THREE.BufferGeometry();
 }
 setCut(on){
  if(this.cut===on)return;this.cut=on;
  // The cut-away half casts no shadows either, so no stray light/shadow patterns appear inside.
  for(const m of this.clipped){m.clippingPlanes=on?[this.cutPlane]:null;m.clipShadows=on;m.needsUpdate=true;}
  for(const c of this.caps)c.visible=on;this.groutCap.visible=on&&this.lastFill>0;
  this.linerClipKey=null;this.applyLinerClip(this.front??null);
 }
 update(st,clock=0,extra={}){
  this.updateHole(st);this.updateGrout(st.fill);this.updateChips(st.pt);
  this.plug.visible=st.holeIn>0&&st.pt>=5.3;this.groutCap.visible=this.cut&&st.fill>0;
  // Liner installation: K-liner on the packer, Schlauchliner by inversion.
  const s=this.spec;this.linerGroup.visible=st.liner>0||st.packer!==null||st.front!==null;
  this.linerGroup.position.x=st.linerX;this.linerGroup.scale.set(1,st.linerScale,st.linerScale);
  this.front=st.front;this.applyLinerClip(st.front);for(const e of this.linerEnds)e.visible=st.front===null;
  if(this.packer){const p=st.packer;this.packer.visible=this.rope.visible=!!p;if(p){const r=(s.RL-.6)*Math.min(st.linerScale,p.r/.995);this.packer.position.x=p.x+this.packerOffset;this.packer.scale.set(1,r,r);const left=p.x+this.packerOffset-this.packerHalf;this.rope.position.set(s.x0,0,0);this.rope.scale.set(Math.max(1,left-s.x0),1,1);}}
  if(this.frontRing){this.frontRing.visible=st.front!==null&&st.front<s.x1-5;if(st.front!==null)this.frontRing.position.x=st.front;}
  this.marker.visible=st.marker>0;this.markerMat.opacity=st.marker;
  this.laser.visible=st.laser>0&&!!extra.laserFrom;if(this.laser.visible){const b=this.marker.position,a=extra.laserFrom.clone().lerp(b,.18),d=b.clone().sub(a);this.laser.position.copy(a);this.laser.scale.set(1,d.length(),1);this.laser.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());this.laserMat.opacity=.85*st.laser;}
  const wet=st.cure;for(const m of [this.groutMat,this.groutCapMat,this.plugMat,...(this.hoseFillMat?[this.hoseFillMat]:[])]){m.color.set(wet>0?new THREE.Color('#454d43').lerp(new THREE.Color('#6d716a'),wet):'#454d43');m.roughness=lerp(.72,.95,wet);}
  this.waterNormal.offset.x=-(clock*.05)%1;
 }
 dispose(){
  const g=new Set(),m=new Set(),t=new Set();
  this.group.traverse(o=>{if(o.geometry)g.add(o.geometry);for(const x of [o.material].flat())if(x){m.add(x);for(const k of ['map','bumpMap','roughnessMap','normalMap'])if(x[k])t.add(x[k]);}});
  g.forEach(x=>x.dispose());m.forEach(x=>x.dispose());t.forEach(x=>x.dispose());
 }
}

// Automatic camera per step: target, viewing direction, distance (world).
export function linerShot(spec,stage,f,robotX){
 const s=spec,R=s.R,size=1+s.dn/700,h=s.holeP,c=s.cav,cavMid=surf(c.cx,c.cs/s.Rm,R+s.w+c.H*.45);
 const shots=[
  {t:V(0,R+c.H*.35,0),d:V(.16,.12,1),dist:1700*size+900},
  {t:V(Math.min(-60,robotX-200),R*.35,0),d:V(.34,.06,1),dist:1250*size+500},
  {t:V(-250,R*.3,0),d:V(.26,.16,1),dist:1900*size+700},
  {t:V(Math.min(-80,robotX-260),R*.15,0),d:V(.42,.2,1),dist:1250*size+300},
  {t:h.clone().add(V(-30,-R*.3,0)),d:V(.3,-.42,1),dist:560*size+120},
  {t:V(Math.max(-1500,robotX-500),R*.1,0),d:V(.2,.16,1),dist:2000*size+500},
  {t:h.clone().add(V(-40,-R*.32,0)),d:V(-.3,-.4,1),dist:600*size+140},
  {t:cavMid.clone().lerp(h,.3).add(V(-60,0,0)),d:V(.14,.1,1),dist:1200*size+420},
  {t:V(-60,R*.5+c.H*.2,0),d:V(.28,.16,1),dist:1500*size+600}
 ];
 const a=shots[stage],b=shots[Math.min(stage+1,shots.length-1)],k=smooth((f-.84)/.16);
 return {target:a.t.clone().lerp(b.t,k),dir:a.d.clone().normalize().lerp(b.d.clone().normalize(),k).normalize(),dist:lerp(a.dist,b.dist,k)};
}
