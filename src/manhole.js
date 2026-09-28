import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {surfaceTextures} from './repair-surface.js';
import {flowNormalTexture} from './repair.js';
// Insertion through a manhole. Reconstructed from the site photo (unit lying in
// front of the open manhole, shield cantilevered over the opening) and the
// hinge on PDF p. 10. Shaft sizes, truck with loader crane, rope and cable
// routing are illustrative assumptions, not a manufacturer procedure.
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const lerp=THREE.MathUtils.lerp;

export const insertionStages=[
 {title:'Am Schacht bereitstellen',text:'Der LKW steht mit abgestütztem Ladekran am geöffneten Schacht. Roboter und angekuppelte Schalung liegen in Richtung des Zielrohrs davor, Bumper vakuumiert, Schalung in Fahrstellung. Die Schalung ragt frei über die Öffnung: Die Klappvorrichtung sperrt das Abknicken nach unten, weil der bewegliche Schenkel (Pos. 9) am Grundkörper der Klappvorrichtung anliegt. Der Kabelstecker am Heck ist nach oben geklappt.',caption:'Wie auf dem Baustellenfoto: Einheit liegt gerade, Schalung vorn über der Schachtöffnung.'},
 {title:'Anheben und einführen',text:'Der Kranhaken hängt am Roboterheck. Der Kran hebt das Heck an, die Einheit kippt mit der Schalung voraus in die Schachtöffnung. Schild und CutterCam zeigen dabei zur Seite des Zielrohrs. Diese Ausrichtung entscheidet: Nur in diese Richtung kann die Klappvorrichtung später nachgeben.',caption:'Klappvorrichtung gesperrt · Einheit bleibt starr'},
 {title:'Senkrecht absenken',text:'Die Einheit hängt senkrecht am Kranseil, die Schalung voraus. Das Gewicht wirkt in Längsrichtung, die zwei Federn halten die Klappvorrichtung geschlossen. Neben den Steigbügeln durch die Öffnung, darunter zur Schachtmitte über das Gerinne.',caption:'Kabel läuft aus dem hochgeklappten Stecker nach oben zur Kabeltrommel'},
 {title:'Aufsetzen und einklappen',text:'Das Rad DN 70 an der Einbauhilfe (Pos. 4/6) setzt im Gerinne auf und rollt in das Rohr. Die Klappvorrichtung öffnet um den Gelenkbolzen gegen die zwei Federn: Die Schalung legt sich in die Rohrachse, während der Roboter noch senkrecht im Schacht hängt.',caption:'Klappwinkel wächst bis 90° · Federn gespannt'},
 {title:'Roboter nachführen',text:'Der Kran lässt weiter ab, die Einheit wird in das Rohr geschoben. Der Roboter neigt sich mit dem Heck zur gegenüberliegenden Schachtwand, bis seine Räder im Gerinne stehen. Die Federn ziehen die Klappvorrichtung dabei wieder in die gestreckte Lage.',caption:'Klappwinkel geht auf 0° zurück · Heck frei vor der Schachtwand'},
 {title:'Haken lösen und einfahren',text:'Der Haken wird ausgehängt und der Kabelstecker klappt nach hinten. Der Roboter fährt die Schalung durch das Abwasser im Gerinne bis in das Rohr; das Kabel läuft von der Trommel über die Schachtkante nach. Im Rohr beginnt der Ablauf unter „So funktioniert’s“.',caption:'Übergang zur Anfahrt der Schadstelle'}
];

export function manholeSpec(dn){
 const Rp=dn/2,t=18+dn*.04,Rm=dn>=700?750:dn>=500?600:500,wall=Rm>=750?150:Rm>=600?135:120,ro=Rm>=750?500:Rm>=600?400:312.5;
 const invert=-Rp,G=invert+(Rm>=600?3000:2500),top=G-230;
 // Eccentric cone/cover: its vertical side and the climbing irons are on the
 // back wall (−z), so the opening centre is offset towards −z.
 const zc=-(Rm-ro);
 return {dn,Rp,t,Rm,wall,ro,zc,z0:zc*.55,G,top,coneTop:top,coneBottom:Rm>=600?top-200:top-620,cone:Rm<600,base:invert-260,water:invert+33,ladder:{depth:160,half:150,from:420}};
}
// Inner radius and centre of the shaft at height y (vertical side stays at z = −Rm).
export function shaftProfile(spec,y){
 if(y<=spec.coneBottom)return{cx:0,cz:0,r:spec.Rm};
 if(y>=spec.coneTop||!spec.cone)return{cx:0,cz:spec.zc,r:spec.ro};
 const k=(y-spec.coneBottom)/(spec.coneTop-spec.coneBottom);return{cx:0,cz:lerp(0,spec.zc,k),r:lerp(spec.Rm,spec.ro,k)};
}
// Channel (Gerinne) floor and bench: invert matches the pipe; bench at axis height.
export function floorAt(spec,x,z){return Math.abs(z)<spec.Rp?-Math.sqrt(spec.Rp**2-z*z):0;}
// Climbing irons occupy a narrow band on the back wall.
export function inLadder(spec,p,margin=0){const L=spec.ladder;return p.y>L.from-40&&p.y<spec.coneTop-150&&Math.abs(p.x)<L.half+25+margin&&p.z<-spec.Rm+L.depth+15+margin;}

const rot=(p,a)=>{const c=Math.cos(a),s=Math.sin(a);return V(p.x*c-p.y*s,p.x*s+p.y*c,p.z);};
// geo: {pin, formPts, robotPts, yb, H, halfWidth, spec}. Returns the two rigid frames
// (mould side, robot side) as rotation about z and world pin position. The
// hinge may only open with the shield nose up relative to the robot.
export function insertionKinematics(time,geo){
 // Under a cover slab the unit passes centred in the opening, clear of the irons.
 const spec=geo.spec.cone?geo.spec:{...geo.spec,z0:Math.max(geo.spec.zc,-geo.spec.Rm+geo.spec.ladder.depth+45+geo.halfWidth)};
 const {pin,formPts,robotPts,yb,H}=geo,T=clamp(time,0,insertionStages.length-.001),stage=Math.floor(T),f=T-stage;
 const E=V(spec.cone?-H/2-30:Math.min(-H/2-30,30-Math.sqrt(spec.ro**2-(spec.z0-spec.zc)**2)),spec.G+2,0),c0=344+E.x-.5*spec.ro,c1=-600;
 const contact=(pts,theta,wx=0)=>{let y=-Infinity;for(const p of pts){const q=rot(V(p.x-pin.x,p.y-pin.y,p.z),theta);y=Math.max(y,floorAt(spec,wx+q.x,p.z)-q.y);}return y;};
 const tip=phi=>{const theta=-phi,c=lerp(c0,c1,smooth((phi/(Math.PI/2)-.56)/.44)),q=rot(V(c-pin.x,yb-pin.y,0),theta),W=E.clone().sub(q);W.z=spec.z0;return{theta,W};};
 const hangX=-80,down=-Math.PI/2,rest=pin.y-contact(formPts,0),lie=(theta,wx)=>contact(formPts,theta,wx)+rest*smooth(1+theta/(Math.PI/2)*2);
 const W3=()=>V(hangX,lie(down,hangX),0);
 // Clearance of the robot to the round shaft wall behind it (circle at each z).
 const rearGap=theta=>{let m=Infinity;for(const p of robotPts){const q=rot(V(p.x-pin.x,p.y-pin.y,p.z),theta);m=Math.min(m,q.x+Math.sqrt(Math.max(0,spec.Rm**2-p.z*p.z)));}return m;};
 const xEnd=Math.max(hangX,22-rearGap(0)),robotMinX=robotPts.reduce((m,p)=>Math.min(m,p.x),Infinity);
 let thetaF=0,thetaR=0,W,drive=0,rope=1;
 if(stage===0){({W}=tip(0));}
 else if(stage===1){const r=tip(smooth(f)*Math.PI/2);thetaF=thetaR=r.theta;W=r.W;}
 else if(stage===2){
  const start=tip(Math.PI/2).W,end=W3();thetaF=thetaR=down;
  if(spec.cone){const k=smooth(f),side=smooth((f-.35)/.5);W=V(lerp(start.x,end.x,side),lerp(start.y,end.y,k),lerp(spec.z0,0,side));}
  else{
   // Under a cover slab: straight down until the rear clears the slab, then
   // across over the channel, then set down (no swinging into the slab edge).
   const clear=spec.coneBottom-60-(pin.x-robotMinX),move=Math.min(start.y,Math.max(clear,end.y+spec.Rp+60));
   const a=smooth(f/.45),side=smooth((f-.45)/.3),b=smooth((f-.75)/.25);
   W=V(lerp(start.x,end.x,side),f<.75?lerp(start.y,move,a):lerp(move,end.y,b),lerp(spec.z0,0,side));
  }
 }else if(stage===3){
  thetaR=down;thetaF=down*(1-smooth(f));const w=W3();
  W=V(hangX,lie(thetaF,hangX),0);if(f<=0)W.y=w.y;
 }else if(stage===4){
  // The robot tilts down behind the mould. The unit is only pushed as far into
  // the pipe as its rear needs to stay inside the shaft, which keeps the
  // robot head below the wall above the pipe opening.
  thetaF=0;thetaR=down*(1-smooth(f));const need=22-rearGap(thetaR);
  W=V(Math.max(hangX,need),pin.y,0);
 }else{
  thetaF=thetaR=0;drive=1400*smooth(f);rope=1-smooth(f/.25);W=V(xEnd+drive,pin.y,0);
 }
 // Cable plug: points world-up while the unit is lifted, folds back in the pipe.
 const up=-thetaR-Math.PI/2,plug=stage<5?clamp(up,-1.45,.52):lerp(-1.45,.52,smooth((f-.15)/.45));
 return{stage,f,thetaF,thetaR,W,drive,rope,plug,hinge:thetaF-thetaR};
}
export function frameMatrix(theta,W,pin){return new THREE.Matrix4().makeTranslation(W.x,W.y,W.z).multiply(new THREE.Matrix4().makeRotationZ(theta)).multiply(new THREE.Matrix4().makeTranslation(-pin.x,-pin.y,-pin.z));}

function noiseTexture(size,seed,fn){
 const a=new Uint8Array(size*size*4);let s=seed;
 for(let i=0;i<size*size;i++){s=(Math.imul(s,1664525)+1013904223)>>>0;const c=fn(s/4294967296);a.set([c[0],c[1],c[2],255],i*4);}
 const t=new THREE.DataTexture(a,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
}
const asphaltTexture=()=>noiseTexture(256,91,n=>{const stone=n>.93?38:n<.05?-18:0,c=58+Math.round(n*26)+stone;return[c,c,c+2];});
function mesh(g,m){const o=new THREE.Mesh(g,m);o.castShadow=o.receiveShadow=true;return o;}
function build(pos,idx,uv,col){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));if(uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));if(col)g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();return g;}
// Dampness, runs and dirt on concrete: darker near the channel and in streaks.
function concreteTone(spec,x,y,z){
 const a=Math.atan2(z,x),streak=.5+.5*Math.sin(a*23+Math.sin(a*7)*2),run=Math.pow(streak,6)*clamp(1-(y-spec.Rp)/1600);
 const damp=clamp(1-(y+spec.Rp)/900)*.38+run*.22+.05*Math.sin(a*61+y*.01);
 const k=1-damp;return[.9*k,.88*k,.83*k*.97];
}
// Shaft wall as a surface of revolution around a moving centre, with exact
// circular openings where the pipes pass through (axis at y = 0).
function shaftWall(spec,y0,y1,offset,openings,rows=1,n=256){
 const pos=[],uv=[],col=[],idx=[];
 const push=(p,u,v)=>{pos.push(p.x,p.y,p.z);uv.push(u,v);col.push(...(offset?[.85,.85,.82]:concreteTone(spec,p.x,p.y,p.z)));return pos.length/3-1;};
 const at=(th,y)=>{const {cx,cz,r}=shaftProfile(spec,y),rr=r+offset;return V(cx+rr*Math.cos(th),y,cz+rr*Math.sin(th));};
 const cut=(th)=>{const x=Math.cos(th),z=(spec.Rm+offset)*Math.sin(th);for(const o of openings)if(Math.sign(x)===o&&Math.abs(z)<spec.Rp+spec.t){const h=Math.sqrt((spec.Rp+spec.t)**2-z*z);return[-h,h];}return null;};
 for(let i=0;i<n;i++){
  const a=i/n*TAU,b=(i+1)/n*TAU,ca=cut(a),cb=cut(b);
  const spans=(ca||cb)&&y0<0&&y1>0?[[y0,ca?ca[0]:0,y0,cb?cb[0]:0],[ca?ca[1]:0,y1,cb?cb[1]:0,y1]]:[[y0,y1,y0,y1]];
  for(const [ya0,ya1,yb0,yb1] of spans){
   for(let r=0;r<rows;r++){
    const k0=r/rows,k1=(r+1)/rows,A0=lerp(ya0,ya1,k0),A1=lerp(ya0,ya1,k1),B0=lerp(yb0,yb1,k0),B1=lerp(yb0,yb1,k1),ra=spec.Rm+offset;
    const p=push(at(a,A0),a*ra/400,A0/400),q=push(at(b,B0),b*ra/400,B0/400),w=push(at(b,B1),b*ra/400,B1/400),e=push(at(a,A1),a*ra/400,A1/400);
    idx.push(p,e,q,q,e,w);
   }
  }
 }
 return build(pos,idx,uv,col);
}
function capShape(points){const s=new THREE.Shape(points.map(p=>new THREE.Vector2(p[0],p[1])));return new THREE.ShapeGeometry(s);}
function beam(o,a,b,w,h){const d=b.clone().sub(a),len=d.length();d.normalize();let side=V(0,1,0).cross(d);if(side.lengthSq()<1e-6)side=V(0,0,1);side.normalize();const x=d.clone().cross(side);o.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,d,side));o.position.copy(a).add(b).multiplyScalar(.5);o.scale.set(w,len,h);}

// Climbing irons after DIN 19555 (plastic-coated U bars, 300 mm wide, about
// 160 mm projection, 250 mm pitch) in one line under the vertical cone side.
function ladderGeometry(spec){
 const L=spec.ladder,parts=[],w=L.half,d=L.depth,back=-spec.Rm;
 for(let y=L.from;y<spec.coneTop-150;y+=250){
  const path=new THREE.CurvePath(),A=V(-w,y,back-35),B=V(-w,y,back+d-14),C=V(-w+14,y,back+d),D=V(w-14,y,back+d),E=V(w,y,back+d-14),F=V(w,y,back-35);
  path.add(new THREE.LineCurve3(A,B));path.add(new THREE.QuadraticBezierCurve3(B,V(-w,y,back+d),C));path.add(new THREE.LineCurve3(C,D));path.add(new THREE.QuadraticBezierCurve3(D,V(w,y,back+d),E));path.add(new THREE.LineCurve3(E,F));
  parts.push(new THREE.TubeGeometry(path,60,12.5,10,false));
  for(let x=-w+30;x<=w-30;x+=20){const r=new THREE.BoxGeometry(5,4,15);r.translate(x,y+12,back+d);parts.push(r);}
  for(const s of[-1,1]){const r=new THREE.CylinderGeometry(24,24,7,20);r.rotateX(Math.PI/2);r.translate(s*w,y,-Math.sqrt(spec.Rm**2-w*w)+3);parts.push(r);}
 }
 return mergeGeometries(parts,false);
}

// Canvas panels need a browser; tests build the geometry without them.
function canvasTexture(w,h,draw){if(typeof document==='undefined')return null;const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
function emblemTexture(){
 return canvasTexture(1024,1024,(g,w)=>{
  const c=w/2;g.clearRect(0,0,w,w);
  g.fillStyle='#0e2233';g.beginPath();g.arc(c,c,500,0,TAU);g.fill();
  g.lineWidth=26;g.strokeStyle='#d7dde2';g.beginPath();g.arc(c,c,470,0,TAU);g.stroke();
  g.lineWidth=10;g.strokeStyle='#1c7cc4';g.beginPath();g.arc(c,c,430,0,TAU);g.stroke();
  // Pipe section with the gold shield pressed against the crown.
  g.lineWidth=34;g.strokeStyle='#b8633c';g.beginPath();g.arc(c,c-40,170,0,TAU);g.stroke();
  g.lineWidth=30;g.strokeStyle='#d8b640';g.beginPath();g.arc(c,c-40,130,-Math.PI*.85,-Math.PI*.15);g.stroke();
  g.fillStyle='#e03a2a';g.beginPath();g.arc(c,c-40-130,16,0,TAU);g.fill();
  g.fillStyle='#ffffff';g.textAlign='center';g.textBaseline='middle';
  g.font='900 190px Arial Black, Arial, sans-serif';g.fillText('DSS',c,c+250);
  g.fillStyle='#e03a2a';g.font='800 118px Arial, sans-serif';g.fillText('FLEX',c,c+385);
  g.fillStyle='#d7dde2';g.font='700 52px Arial, sans-serif';
  const txt='VERFAHREN · KANALSANIERUNG';for(let i=0;i<txt.length;i++){const a=-Math.PI*.92+i*(Math.PI*.84/(txt.length-1));g.save();g.translate(c+395*Math.cos(a),c+395*Math.sin(a));g.rotate(a+Math.PI/2);g.fillText(txt[i],0,0);g.restore();}
 });
}
function claimTexture(){return canvasTexture(2048,160,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#d7dde2';g.font='600 78px Arial, sans-serif';g.textBaseline='middle';const txt='Stutzen- und Rohrsanierung · DSS-Flex';const k=Math.min(1,(w-20)/g.measureText(txt).width);g.setTransform(k,0,0,1,10,0);g.fillText(txt,0,h/2);});}

// Truck with box body and rear loader crane. Proportions of a municipal
// service truck; not a specific vehicle.
function buildTruck(spec){
 const G=spec.G,zT=-3150,half=1250,grp=new THREE.Group();grp.name='LKW mit Ladekran (Darstellung)';
 const paint=new THREE.MeshStandardMaterial({color:'#1b2127',metalness:.35,roughness:.42}),white=new THREE.MeshStandardMaterial({color:'#e8ebee',metalness:.2,roughness:.38});
 const black=new THREE.MeshStandardMaterial({color:'#15181b',roughness:.7}),tyre=new THREE.MeshStandardMaterial({color:'#1a1b1d',roughness:.92}),rim=new THREE.MeshStandardMaterial({color:'#b9c0c6',metalness:.85,roughness:.3});
 const glass=new THREE.MeshStandardMaterial({color:'#0c1720',metalness:.6,roughness:.08}),red=new THREE.MeshStandardMaterial({color:'#c8231e',metalness:.3,roughness:.4}),blue=new THREE.MeshStandardMaterial({color:'#1565b8',metalness:.3,roughness:.4});
 const crane=new THREE.MeshStandardMaterial({color:'#c62b22',metalness:.4,roughness:.38}),steel=new THREE.MeshStandardMaterial({color:'#9aa3aa',metalness:.85,roughness:.28}),amber=new THREE.MeshStandardMaterial({color:'#ffb21e',emissive:'#ff9a00',emissiveIntensity:.9,roughness:.3});
 const lamp=new THREE.MeshStandardMaterial({color:'#f4f6f8',emissive:'#dfe8f0',emissiveIntensity:.4,roughness:.2});
 const add=(g,m,p)=>{const o=mesh(g,m);if(p)o.position.copy(p);grp.add(o);return o;};
 // Chassis, axles and wheels.
 for(const s of[-1,1])add(new THREE.BoxGeometry(7700,260,90),black,V(1500,G+950,zT+s*420));
 for(const [x,dual] of[[900,true],[2250,true],[4550,false]])for(const s of[-1,1]){
  const w=dual?560:300,z=zT+s*(half-w/2-20);
  for(const [r,m,ww] of[[480,tyre,w],[270,rim,w+8],[90,steel,w+30]]){const o=mesh(new THREE.CylinderGeometry(r,r,ww,r>300?40:24),m);o.rotation.x=Math.PI/2;o.position.set(x,G+480,z);grp.add(o);}
  add(new THREE.BoxGeometry(dual?1150:720,40,w+40),black,V(x,G+1000,z));
 }
 // Cab.
 add(new RoundedBoxGeometry(1900,2450,2480,4,120),white,V(4450,G+2250,zT)).name='Fahrerhaus';
 add(new THREE.PlaneGeometry(2150,1000),glass,V(5402,G+2850,zT)).rotation.y=Math.PI/2;
 add(new THREE.PlaneGeometry(760,700),glass,V(4980,G+2900,zT+1241));
 add(new THREE.BoxGeometry(40,1200,1500),black,V(5405,G+1650,zT));
 for(const s of[-1,1]){add(new THREE.BoxGeometry(30,160,380),lamp,V(5412,G+1350,zT+s*930));add(new THREE.BoxGeometry(260,420,40),black,V(5250,G+3050,zT+s*1400));}
 add(new THREE.BoxGeometry(240,360,2560),black,V(5420,G+880,zT));
 add(new THREE.BoxGeometry(260,110,1500),amber,V(4450,G+3530,zT));
 add(new THREE.BoxGeometry(1500,30,4),red,V(4450,G+1750,zT+1242));
 // Box body with the DiTom livery on the kerb side facing the shaft.
 add(new RoundedBoxGeometry(4800,2600,2500,3,40),paint,V(1000,G+2450,zT)).name='Kofferaufbau DiTom';
 add(new THREE.BoxGeometry(4800,90,6),red,V(1000,G+1420,zT+half+2));add(new THREE.BoxGeometry(4800,36,6),blue,V(1000,G+1520,zT+half+2));
 const logoPlane=add(new THREE.PlaneGeometry(2900,2900*733/2145),new THREE.MeshStandardMaterial({transparent:true,roughness:.35,metalness:.1,color:'#ffffff'}),V(600,G+2980,zT+half+4));logoPlane.name='DiTom-Logo';logoPlane.visible=false;logoPlane.castShadow=false;
 const emblem=emblemTexture(),claim=claimTexture();
 if(emblem){const e=add(new THREE.PlaneGeometry(1150,1150),new THREE.MeshStandardMaterial({map:emblem,transparent:true,roughness:.4}),V(2720,G+2560,zT+half+4));e.name='DSS-Flex-Emblem';e.castShadow=false;}
 if(claim){const c=add(new THREE.PlaneGeometry(2900,226),new THREE.MeshStandardMaterial({map:claim,transparent:true,roughness:.5}),V(600,G+2130,zT+half+4));c.castShadow=false;}
 if(typeof document!=='undefined'){const img=document.querySelector('.brand-logo');if(img?.src)new THREE.TextureLoader().load(img.src,t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;logoPlane.material.map=t;logoPlane.material.needsUpdate=true;logoPlane.visible=true;});}
 // Rear crane platform, outriggers with pads, rear doors and chevrons.
 add(new THREE.BoxGeometry(900,140,2500),paint,V(-1850,G+1150,zT));
 for(const s of[-1,1]){const zz=s>0?-1480:zT-half-380;add(new THREE.BoxGeometry(180,160,Math.abs(zz-zT)),crane,V(-1850,G+1080,(zz+zT)/2));add(new THREE.CylinderGeometry(60,60,1040,16),steel,V(-1850,G+560,zz));add(new THREE.CylinderGeometry(240,260,40,24),black,V(-1850,G+20,zz));}
 add(new THREE.BoxGeometry(6,2400,2300),black,V(-1408,G+2450,zT));
 for(let i=0;i<8;i++)add(new THREE.BoxGeometry(8,180,280),i%2?red:white,V(-2305,G+820,zT-1050+i*300));
 // Loader crane: column, slewing head, main and knuckle booms, cylinders.
 const base=V(-1850,G+1220,-2250);
 add(new THREE.CylinderGeometry(210,240,900,24),crane,base.clone().add(V(0,450,0)));
 const head=add(new THREE.CylinderGeometry(270,270,260,24),crane,base.clone().add(V(0,1030,0)));
 const P=base.clone().add(V(0,1130,0));
 const mk=m=>{const o=mesh(new THREE.BoxGeometry(1,1,1),m);grp.add(o);return o;};
 const boom1=mk(crane),boom2=mk(crane),boom3=mk(steel),cyl1=mk(black),rod1=mk(steel),cyl2=mk(black),hookBlock=mk(new THREE.MeshStandardMaterial({color:'#e7b416',roughness:.4}));
 const winch=mesh(new THREE.CylinderGeometry(110,110,300,20),black);grp.add(winch);
 const L1=2600,L2=2900,up=V(0,1,0);
 const pose=target=>{
  const flat=V(target.x-P.x,0,target.z-P.z),d=Math.max(1,flat.length()),dir=flat.clone().divideScalar(d),h=target.y-P.y,dist=clamp(Math.hypot(d,h),Math.abs(L1-L2)+10,L1+L2-10);
  const a=Math.atan2(h,d),al=Math.acos(clamp((L1*L1+dist*dist-L2*L2)/(2*L1*dist),-1,1)),t1=a+al;
  const K=P.clone().addScaledVector(dir,L1*Math.cos(t1)).addScaledVector(up,L1*Math.sin(t1));
  const T=P.clone().addScaledVector(dir,dist*Math.cos(a)).addScaledVector(up,dist*Math.sin(a));
  beam(boom1,P,K,300,260);const mid=K.clone().lerp(T,.55);beam(boom2,K,mid,260,230);beam(boom3,mid,T,190,170);
  const c0=base.clone().add(V(0,420,0)).addScaledVector(dir,260),c1=P.clone().lerp(K,.48).addScaledVector(up,-150);beam(cyl1,c0,c0.clone().lerp(c1,.55),170,170);beam(rod1,c0.clone().lerp(c1,.5),c1,90,90);
  beam(cyl2,P.clone().lerp(K,.75).addScaledVector(up,190),K.clone().lerp(T,.25).addScaledVector(up,190),130,130);
  head.rotation.y=-Math.atan2(dir.z,dir.x);winch.position.copy(K).addScaledVector(up,160);winch.rotation.set(Math.PI/2,0,-Math.atan2(dir.z,dir.x));
  hookBlock.position.copy(T).add(V(0,-130,0));hookBlock.scale.set(160,200,120);hookBlock.quaternion.identity();
  return T.clone().add(V(0,-230,0));
 };
 // Cable drum next to the truck, fed over a roller at the shaft rim.
 const drum=new THREE.Group();drum.name='Kabeltrommel';const dc=V(-2750,G+560,-1350);
 const reel=mesh(new THREE.CylinderGeometry(330,330,380,32),new THREE.MeshStandardMaterial({color:'#1b1e20',roughness:.6}));reel.rotation.x=Math.PI/2;drum.add(reel);
 for(const s of[-1,1]){const f=mesh(new THREE.CylinderGeometry(480,480,24,40),new THREE.MeshStandardMaterial({color:'#0b5ea8',metalness:.3,roughness:.4}));f.rotation.x=Math.PI/2;f.position.z=s*205;drum.add(f);const leg=mesh(new THREE.BoxGeometry(60,560,60),steel);leg.position.set(0,-280,s*260);drum.add(leg);}
 drum.position.copy(dc);grp.add(drum);
 return{group:grp,pose,drumTop:dc.clone().add(V(0,330,0)),crane:{P,reach:L1+L2}};
}

export class ManholeScene{
 constructor(dn,cutPlane){
  const spec=this.spec=manholeSpec(dn),{Rp,t,Rm,wall,G}=spec;this.cutPlane=cutPlane;
  this.group=new THREE.Group();this.group.name='Schacht mit Gerinne';
  const mortar=surfaceTextures('mortar'),soil=surfaceTextures('soil'),pipeTex=surfaceTextures('pipe');
  for(const tx of Object.values(mortar))tx.repeat.set(1.4,1.4);
  this.concrete=new THREE.MeshStandardMaterial({color:'#9b9a94',...mortar,bumpScale:1.4,roughness:.96,vertexColors:true,side:THREE.DoubleSide});
  this.concreteOuter=new THREE.MeshStandardMaterial({color:'#8d8c86',...surfaceTextures('mortar'),bumpScale:1,roughness:.98,side:THREE.DoubleSide});
  this.channelMat=new THREE.MeshStandardMaterial({color:'#77736a',...surfaceTextures('mortar'),bumpScale:.5,roughness:.55,vertexColors:true,side:THREE.DoubleSide});
  this.pipeMat=new THREE.MeshStandardMaterial({color:'#8a5236',...pipeTex,bumpScale:.12,roughness:.7,side:THREE.DoubleSide});
  const asphalt=asphaltTexture();asphalt.repeat.set(16,16);
  this.asphaltMat=new THREE.MeshStandardMaterial({color:'#9a9a9a',map:asphalt,bumpMap:asphalt,bumpScale:2,roughness:.92,side:THREE.DoubleSide});
  this.jointMat=new THREE.MeshStandardMaterial({color:'#4d4b46',roughness:1,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  this.capConcrete=new THREE.MeshStandardMaterial({color:'#a3a29b',...surfaceTextures('mortar'),roughness:1});
  this.capSoil=new THREE.MeshStandardMaterial({color:'#7a5e44',...soil,bumpScale:1,roughness:1});
  this.capPipe=new THREE.MeshStandardMaterial({color:'#7a4a31',roughness:1});
  this.capAsphalt=new THREE.MeshStandardMaterial({color:'#303234',roughness:1});
  this.iron=new THREE.MeshStandardMaterial({color:'#2d3033',metalness:.7,roughness:.55});
  this.ladderMat=new THREE.MeshStandardMaterial({color:'#e2711d',roughness:.55,metalness:.05});
  this.cut=[this.concrete,this.concreteOuter,this.channelMat,this.pipeMat,this.asphaltMat,this.jointMat];
  const add=(g,m,name)=>{const o=mesh(g,m);if(name)o.name=name;this.group.add(o);return o;};
  // Shaft rings with pipe openings, cone (DN 1000) or cover slab (DN 1200), adjusting rings.
  const y0=spec.base+60;
  add(shaftWall(spec,y0,spec.coneBottom,0,[1,-1],8),this.concrete,'Schachtringe DN '+Rm*2);add(shaftWall(spec,y0,spec.coneBottom,wall,[1,-1],1),this.concreteOuter);
  add(shaftWall(spec,spec.coneBottom,spec.coneTop,0,[],6),this.concrete,spec.cone?'Schachthals (Konus, exzentrisch)':'Abdeckplatte');
  add(shaftWall(spec,spec.coneBottom,spec.coneTop,wall,[],6),this.concreteOuter);
  add(shaftWall(spec,spec.coneTop,G-110,0,[],1),this.concrete,'Auflageringe');add(shaftWall(spec,spec.coneTop,G-110,wall,[],1),this.concreteOuter);
  if(!spec.cone)for(const y of[spec.coneBottom,spec.coneTop]){const sh=new THREE.Shape();sh.absarc(0,0,Rm+wall,0,TAU,false);const h=new THREE.Path();h.absarc(0,spec.zc,y===spec.coneTop?spec.ro+wall:spec.ro,0,TAU,true);sh.holes.push(h);const g=new THREE.ShapeGeometry(sh,64);g.rotateX(Math.PI/2);g.translate(0,y,0);add(g,this.concreteOuter,'Abdeckplatte');}
  // Ring joints every 500 mm (not across the pipe openings).
  for(let y=y0+500;y<spec.coneBottom-40;y+=500){if(Math.abs(y)<Rp+t+30)continue;const g=new THREE.CylinderGeometry(Rm-.6,Rm-.6,9,128,1,true);g.translate(0,y,0);add(g,this.jointMat,'Ringfuge');}
  {const g=new THREE.CylinderGeometry(Rm-.6,Rm-.6,9,128,1,true);g.translate(0,spec.coneBottom,0);add(g,this.jointMat);}
  add(ladderGeometry(spec),this.ladderMat,'Steigbügel (kunststoffummantelt)');
  // Floor: bench at axis height and a U-shaped channel continuing the invert.
  {
   const pos=[],idx=[],uv=[],col=[],nu=64,nv=48;
   for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const phi=lerp(-Math.PI/2,Math.PI/2,i/nu),z=Rp*Math.sin(phi),y=-Rp*Math.cos(phi),half=Math.sqrt(Rm*Rm-z*z),x=lerp(-half,half,j/nv);pos.push(x,y,z);uv.push(x/400,phi*Rp/400);const film=y<spec.water+14?.55:y<spec.water+60?.72:.9;col.push(film,film*.95,film*.82);}
   for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+nu+1;idx.push(a,a+1,b,b,a+1,b+1);}
   add(build(pos,idx,uv,col),this.channelMat,'Gerinne');
   for(const s of[-1,1]){
    const shape=new THREE.Shape();const pts=[];
    for(let i=0;i<=48;i++){const a=lerp(0,Math.PI,i/48);const zz=Rm*Math.sin(a);if(Math.abs(zz)>=Rp)pts.push([Rm*Math.cos(a),zz]);}
    const edge=Math.sqrt(Rm*Rm-Rp*Rp);pts.unshift([edge,Rp]);pts.push([-edge,Rp]);
    shape.setFromPoints(pts.map(([x,z])=>new THREE.Vector2(x,z)));const g=new THREE.ShapeGeometry(shape,1);
    const p=g.attributes.position,c=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getY(i)*s;p.setXYZ(i,x,6*(Math.abs(z)-Rp)/(Rm-Rp),z);const k=.8+.12*Math.min(1,(Math.abs(z)-Rp)/200);c.push(k,k*.97,k*.9);}
    g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.computeVertexNormals();
    add(g,this.channelMat,'Berme');
   }
  }
  // Pipes: target pipe (+x) and outgoing pipe (−x), clay with sockets, cut
  // flush with the curved inner shaft wall.
  const wallX=z=>Math.sqrt(Math.max(0,Rm*Rm-z*z));
  const pipeGeo=(r,sgn,far)=>{const pos=[],idx=[],uv=[],n=96;for(let i=0;i<=n;i++){const a=i/n*TAU,y=r*Math.cos(a),z=r*Math.sin(a);pos.push(sgn*wallX(z),y,z,far,y,z);uv.push(0,a*r/400,Math.abs(far)/400,a*r/400);if(i<n){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}return build(pos,idx,uv);};
  const ringFace=sgn=>{const pos=[],idx=[],n=96;for(let i=0;i<=n;i++){const a=i/n*TAU;for(const r of[Rp,Rp+t]){const y=r*Math.cos(a),z=r*Math.sin(a);pos.push(sgn*wallX(z),y,z);}if(i<n){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}return build(pos,idx);};
  for(const [sgn,far,name] of[[1,3400,'Zielrohr'],[-1,-3000,'Ablaufrohr']]){add(pipeGeo(Rp,sgn,far),this.pipeMat,name);add(pipeGeo(Rp+t,sgn,far),this.pipeMat);add(ringFace(sgn),this.pipeMat);
   for(let x=Rm+900;x<Math.abs(far)-100;x+=1500){const g=new THREE.CylinderGeometry(Rp+t+16,Rp+t+16,140,64,1,true);g.rotateZ(Math.PI/2);g.translate(sgn*x,0,0);add(g,this.pipeMat,'Muffe');}}
  // Base slab below the channel.
  {const g=new THREE.CylinderGeometry(Rm+wall,Rm+wall,y0-spec.base,64,1,false);g.translate(0,(y0+spec.base)/2,0);add(g,this.concreteOuter);}
  // Dry-weather flow in the channel and pipes.
  {
   const wy=spec.water,half=Math.sqrt(Rp*Rp-wy*wy)-.5,g=new THREE.PlaneGeometry(6400,2*half,160,4);g.rotateX(-Math.PI/2);g.translate(200,wy,0);
   this.flowNormal=flowNormalTexture();this.flowNormal.repeat.set(6400/420,2*half/260);
   this.waterMat=new THREE.MeshPhysicalMaterial({color:'#2a271c',roughness:.1,clearcoat:.8,clearcoatRoughness:.03,normalMap:this.flowNormal,normalScale:new THREE.Vector2(.45,.45),transparent:true,opacity:.9,envMapIntensity:1.2,side:THREE.DoubleSide});
   this.cut.push(this.waterMat);const w=add(g,this.waterMat,'Abwasser im Gerinne');w.castShadow=false;
  }
  // Street with the frame opening, frame, opened cover, kerb and markings.
  {
   const s=new THREE.Shape([V(-4600,-5400),V(6400,-5400),V(6400,2400),V(-4600,2400)].map(p=>new THREE.Vector2(p.x,p.y)));const h=new THREE.Path();h.absarc(0,spec.zc,spec.ro+wall,0,TAU,true);s.holes.push(h);
   const g=new THREE.ShapeGeometry(s,48);g.rotateX(Math.PI/2);g.translate(0,G,0);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/4000,uv.getY(i)/4000);
   add(g,this.asphaltMat,'Straße');
   const patch=new THREE.RingGeometry(spec.ro+wall,spec.ro+wall+260,72);patch.rotateX(-Math.PI/2);const po=add(patch,new THREE.MeshStandardMaterial({color:'#44474a',roughness:.95}));po.position.set(0,G+1.2,spec.zc);
   const frame=new THREE.Group();frame.name='Schachtabdeckung (Rahmen)';
   const f1=new THREE.RingGeometry(spec.ro,spec.ro+wall,96);f1.rotateX(-Math.PI/2);const fo=mesh(f1,this.iron);fo.position.set(0,G+2,spec.zc);frame.add(fo);
   for(const r of[spec.ro,spec.ro+wall]){const f=mesh(new THREE.CylinderGeometry(r,r,110,96,1,true),this.iron);f.position.set(0,G-55,spec.zc);frame.add(f);}
   this.group.add(frame);
   const cover=new THREE.Group();cover.name='Schachtdeckel (abgelegt)';
   cover.add(mesh(new THREE.CylinderGeometry(spec.ro-8,spec.ro-8,28,72),this.iron));
   for(let i=-5;i<=5;i++){const rib=mesh(new THREE.BoxGeometry(6,4,Math.sqrt(Math.max(0,(spec.ro-30)**2-(i*45)**2))*2),this.iron);rib.position.set(i*45,16,0);cover.add(rib);}
   cover.position.set(950,G+14,-700);cover.rotation.y=.3;this.group.add(cover);
   const kerb=add(new THREE.BoxGeometry(11000,300,160),new THREE.MeshStandardMaterial({color:'#9c9c98',roughness:.9}),'Bordstein');kerb.position.set(900,G+20,-5250);
   const markMat=new THREE.MeshStandardMaterial({color:'#e9e8e1',roughness:.8});
   for(let x=-4200;x<6200;x+=3000){const m=add(new THREE.BoxGeometry(1500,3,120),markMat);m.position.set(x,G+2,1300);}
   const coneMat=new THREE.MeshStandardMaterial({color:'#e2502b',roughness:.6}),white=new THREE.MeshStandardMaterial({color:'#f1f1ea',roughness:.5});
   for(const [x,z] of[[-2300,-900],[1700,-1150],[1500,900],[-1200,1200]]){const c=new THREE.Group();c.add(mesh(new THREE.BoxGeometry(380,30,380),new THREE.MeshStandardMaterial({color:'#222',roughness:.9})));const k=mesh(new THREE.ConeGeometry(150,700,32),coneMat);k.position.y=365;c.add(k);for(const y of[250,420]){const b=mesh(new THREE.CylinderGeometry(150*(1-(y-15)/700)-1,150*(1-(y+55)/700)-1,70,32,1,true),white);b.position.y=y+35;b.scale.setScalar(1.02);c.add(b);}c.position.set(x,G,z);this.group.add(c);}
  }
  this.truck=buildTruck(spec);this.group.add(this.truck.group);
  this.ropeMat=new THREE.MeshStandardMaterial({color:'#9aa0a4',metalness:.8,roughness:.4});this.rope=mesh(new THREE.BufferGeometry(),this.ropeMat);this.rope.name='Kranseil';this.group.add(this.rope);
  this.hook=new THREE.Group();this.hook.add(mesh(new THREE.TorusGeometry(26,7,8,20,Math.PI*1.5),new THREE.MeshStandardMaterial({color:'#e7b416',roughness:.4})));this.group.add(this.hook);
  this.cableMat=new THREE.MeshStandardMaterial({color:'#15191c',roughness:.5});this.cable=mesh(new THREE.BufferGeometry(),this.cableMat);this.cable.name='Roboterkabel';this.cable.castShadow=false;this.group.add(this.cable);
  // Cable roller at the rim on the drum side.
  const toDrum=V(this.truck.drumTop.x,0,this.truck.drumTop.z-spec.zc).normalize();
  this.roller=V(toDrum.x*(spec.ro-30),G+70,spec.zc+toDrum.z*(spec.ro-30));
  {const r=mesh(new THREE.CylinderGeometry(55,55,140,20),new THREE.MeshStandardMaterial({color:'#e7b416',roughness:.4}));r.rotation.set(Math.PI/2,0,Math.atan2(toDrum.z,toDrum.x));r.position.copy(this.roller);r.name='Kabelumlenkrolle';this.group.add(r);}
  // Section faces in the z = 0 plane (visible with "Rohr aufschneiden").
  this.caps=new THREE.Group();this.group.add(this.caps);
  const capMesh=(pts,m)=>{const o=mesh(capShape(pts),m);o.castShadow=false;this.caps.add(o);return o;};
  const side=(s,offset,y)=>{const {cz,r}=shaftProfile(spec,y);return s*Math.sqrt(Math.max(0,(r+offset)**2-cz*cz));};
  const ys=[];for(let y=spec.coneBottom;y<=spec.coneTop;y+=20)ys.push(y);ys.push(spec.coneTop,G-110);
  const top=Rp+t,bottom=-Rp-t,Xr=3400,Xl=-3000;
  for(const s of[-1,1]){
   const X=s>0?Xr:Xl;
   capMesh([[side(s,wall,top),top],[X,top],[X,G-60],[side(s,wall,G-60),G-60],...ys.slice().reverse().map(y=>[side(s,wall,y),y]),[side(s,wall,spec.coneBottom),spec.coneBottom]],this.capSoil);
   capMesh([[s*(Rm+wall),spec.base-400],[X,spec.base-400],[X,bottom],[s*(Rm+wall),bottom]],this.capSoil);
   capMesh([[X,G-60],[X,G],[side(s,wall,G),G],[side(s,wall,G-60),G-60]],this.capAsphalt);
   capMesh([[s*Rm,top],[s*(Rm+wall),top],[s*(Rm+wall),spec.coneBottom],...ys.map(y=>[side(s,wall,y),y]),[side(s,wall,G-110),G-110],[side(s,0,G-110),G-110],...ys.slice().reverse().map(y=>[side(s,0,y),y]),[s*Rm,spec.coneBottom]],this.capConcrete);
   capMesh([[s*Rm,spec.base+60],[s*(Rm+wall),spec.base+60],[s*(Rm+wall),bottom],[s*Rm,bottom]],this.capConcrete);
   const x0=s*Rm;capMesh([[x0,Rp],[X,Rp],[X,top],[x0,top]],this.capPipe);capMesh([[x0,bottom],[X,bottom],[X,-Rp],[x0,-Rp]],this.capPipe);
  }
  if(!spec.cone)for(const sgn of[-1,1]){const o=capMesh([[side(sgn,wall,spec.coneTop),spec.coneBottom],[sgn*(Rm+wall),spec.coneBottom],[sgn*(Rm+wall),spec.coneTop],[side(sgn,wall,spec.coneTop),spec.coneTop]],this.capConcrete);o.userData.front=true;}
  capMesh([[-Rm-wall,spec.base],[Rm+wall,spec.base],[Rm+wall,spec.base+60],[Rm,spec.base+60],[Rm,-Rp],[-Rm,-Rp],[-Rm,spec.base+60],[-Rm-wall,spec.base+60]],this.capConcrete);
  capMesh([[-Rm-wall,spec.base-400],[Rm+wall,spec.base-400],[Rm+wall,spec.base],[-Rm-wall,spec.base]],this.capSoil);
  // Stones and gravel in the soil section, as in the repair scene.
  {
   let seed=7;const rnd=()=>(seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;
   const stoneMats=['#8d8575','#6f6658','#a39a88','#5c5347'].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.9}));
   for(let i=0;i<260;i++){
    const x=lerp(-3000,3400,rnd()),y=lerp(spec.base-380,G-90,rnd()),r=8+Math.pow(rnd(),2.2)*60,m=stoneMats[Math.floor(rnd()*4)];
    const shp=new THREE.Shape(),n=7+Math.floor(rnd()*4),jit=Array.from({length:n},()=>.7+.4*rnd());
    if(Math.abs(x)<Math.abs(side(1,wall,Math.min(y,G-111)))+r*1.3+10||Math.abs(y)<top+r+10||(y<spec.base+60&&Math.abs(x)<Rm+wall+r*1.3))continue;
    for(let k=0;k<n;k++){const a=k/n*TAU,rr=r*jit[k],px=x+rr*Math.cos(a)*1.25,py=y+rr*Math.sin(a)*.85;k?shp.lineTo(px,py):shp.moveTo(px,py);}
    const o=mesh(new THREE.ShapeGeometry(shp),m);o.castShadow=false;o.userData.front=true;this.caps.add(o);
   }
  }
  for(const c of this.caps.children)c.position.z=c.userData.front?.9:.5;
  this.craneTarget=V(0,G+3000,spec.zc);
  this.setCut(true);
 }
 setCut(cut){for(const m of this.cut)m.clippingPlanes=cut?[this.cutPlane]:null;this.caps.visible=cut;}
 // Keep a routed cable inside shaft, channel and pipe (with its own radius).
 clampCable(p){
  const s=this.spec,margin=22;
  if(p.y>s.G-15)return p;
  const wall=Math.sqrt(Math.max(0,s.Rm**2-p.z*p.z));
  if(p.y<s.Rp&&Math.abs(p.x)>wall-40){const r=Math.hypot(p.y,p.z),m=s.Rp-margin;if(r>m){p.y*=m/r;p.z*=m/r;}}
  else{const {cz,r}=shaftProfile(s,p.y),dz=p.z-cz,d=Math.hypot(p.x,dz),m=r-margin;if(d>m){p.x*=m/d;p.z=cz+dz*m/d;}
   if(inLadder(s,p,10))p.z=-s.Rm+s.ladder.depth+45;}
  if(p.y<s.Rp+60)p.y=Math.max(p.y,floorAt(s,p.x,p.z)+margin);
  return p;
 }
 // hook: world point on the robot rear; rope 0..1 attached; plug tip and
 // outgoing direction of the folded cable plug.
 update({hook,rope,plugTip,plugDir,clock=0}){
  const s=this.spec;
  if(this.flowNormal)this.flowNormal.offset.set(-clock*280/420,.05*Math.sin(clock*.7));
  // Crane tip follows the hook while loaded; retracts over the truck after release.
  const want=V(hook.x,s.G+3000,hook.z);
  if(rope<1)want.lerp(V(-900,s.G+3300,-1500),1-rope);
  this.craneTarget.copy(want);
  const tip=this.truck.pose(this.craneTarget);
  const hookPos=rope>0.001?hook.clone().lerp(tip.clone().add(V(0,-700,0)),1-rope):tip.clone().add(V(0,-700,0));
  this.rope.geometry.dispose();this.rope.geometry=new THREE.TubeGeometry(new THREE.LineCurve3(tip,hookPos.clone().add(V(0,40,0))),4,6,6,false);
  this.hook.position.copy(hookPos).add(V(0,10,0));
  // Cable: out of the plug, up the shaft away from the wall and the irons,
  // over the rim roller to the drum. Every sample is kept inside the shaft.
  const pts=[plugTip.clone(),plugTip.clone().addScaledVector(plugDir,140)];
  if(pts[1].x>s.Rm-60&&pts[1].y<s.Rp)pts.push(V(Math.min(pts[1].x-300,s.Rm+200),-s.Rp+40,0),V(s.Rm-260,-s.Rp+60,0));
  const last=pts.at(-1);
  if(last.y<s.G-500)pts.push(V(last.x,Math.max(last.y+350,Math.min(s.coneBottom-150,last.y+900)),last.z*.6),V(this.roller.x*.4,s.G-420,s.zc+(this.roller.z-s.zc)*.4));
  pts.push(this.roller.clone().add(V(0,40,0)),this.roller.clone().lerp(this.truck.drumTop,.35).setY(s.G+18),this.truck.drumTop.clone());
  const samples=new THREE.CatmullRomCurve3(pts,false,'centripetal').getSpacedPoints(260).map(p=>this.clampCable(p));
  this.cable.geometry.dispose();this.cable.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(samples,false,'centripetal'),320,7,8,false);
  this.cablePoints=samples;
 }
 dispose(){const mats=new Set(),tex=new Set();this.group.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of[o.material].flat())mats.add(m);}});for(const m of mats){for(const k of['map','bumpMap','roughnessMap','normalMap'])if(m[k])tex.add(m[k]);m.dispose();}tex.forEach(t=>t.dispose());}
}
