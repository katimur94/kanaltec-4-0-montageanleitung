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
 {title:'Auf der Ladebordwand anschlagen',text:'Der LKW steht seitlich am geöffneten Schacht, die Ladebordwand auf Ladehöhe. Roboter und angekuppelte Schalung liegen darauf in Richtung des Zielrohrs, Bumper vakuumiert. Der Hebebügel am Kranhaken wird mit seinen runden Bolzenköpfen in die seitlichen Schlitze zwischen den Rädern eingehängt. Die Kabelbombe hinten steht gerade in Verlängerung des Roboters; das Kabel läuft zur Trommel im Koffer.',caption:'Roter Säulenkran im Koffer, Einheit auf der Ladebordwand.'},
 {title:'Anheben und über den Schacht schwenken',text:'Der Kran hebt an. Die Einheit hängt mit den Bolzen des Hebebügels in den seitlichen Schlitzen und pendelt sich ein, bis der Schwerpunkt unter dem Haken liegt; die Kette zieht den Bügel dabei gerade nach oben; er kann frei wippen, bis seine Querstrebe am Gehäuse des Roboters anliegt. Das Gewicht der vorn liegenden Schalung will sie nach unten klappen – genau diese Richtung sperrt die Klappvorrichtung, weil der bewegliche Schenkel (Pos. 9) anliegt. Deshalb hängt die Einheit starr und steil nach vorn geneigt (je nach DN etwa 70–75°), der Bügel fast senkrecht.',caption:'Gleichgewicht am Haken · Klappvorrichtung gesperrt'},
 {title:'Durch die Öffnung absenken',text:'Der Kran lässt entlang der Achse der hängenden Einheit ab, die Schalung voraus. Die Einheit passt mit ihrer Hängeneigung durch Rahmen und Konus; wo es eng wird, führen die Monteure sie von Hand. Im Schacht wird sie zum Aufsetzpunkt vor dem Rohr geführt. Die Kabelbombe bleibt gerade, die Steigbügel bleiben frei.',caption:'Lage aus Gewicht, Anschlag des Hebebügels, Führung von Hand und Kontakt mit der Schachtwand'},
 {title:'Aufsetzen vor dem Rohr',text:'Das Rad DN 70 an der Einbauhilfe (Pos. 4/6) setzt im Gerinne kurz vor dem Rohreinlauf auf; die Klappvorrichtung ist dabei noch geschlossen. Die Kabelbombe wird hochgeklappt. Während der Kran weiter ablässt, dreht sich die Schalung um das Rad flacher, bis sie in das Rohr passt. Der Roboter bleibt so steil, wie die Schachtwand hinter ihm verlangt – nur um diese Differenz öffnet die Klappvorrichtung gegen die zwei Federn.',caption:'Klappwinkel nur so groß wie nötig, im Schacht DN 1000 bis etwa 45°, in größeren Schächten weniger'},
 {title:'Einschieben und Roboter ablegen',text:'Der Kran lässt weiter ab. Die Schalung gleitet in das Rohr und wird dabei nur so weit geneigt, wie der Rohrscheitel zulässt. Der Roboter legt sich dahinter ins Gerinne; die Federn ziehen die Klappvorrichtung wieder in die gestreckte Lage.',caption:'Klappwinkel geht auf 0° zurück'},
 {title:'Aushängen und einfahren',text:'Der Haken wird ausgehängt. Der Roboter fährt die Schalung durch das Abwasser in das Rohr; sobald Platz ist, klappt die Kabelbombe nach hinten in Fahrstellung. Das Kabel läuft von der Trommel über die Ladebordwand und die Schachtkante nach. Im Rohr beginnt der Ablauf unter „So funktioniert’s“.',caption:'Übergang zur Anfahrt der Schadstelle'}
];
export function manholeSpec(dn){
 const Rp=dn/2,t=18+dn*.04,Rm=dn>=700?750:dn>=500?600:500,wall=Rm>=750?150:Rm>=600?135:120,ro=Rm>=750?500:Rm>=600?400:312.5;
 const invert=-Rp,G=invert+(Rm>=600?3000:2500),top=G-230;
 // Eccentric cone/cover: its vertical side and the climbing irons are on the
 // back wall (−z), so the opening centre is offset towards −z.
 const zc=-(Rm-ro),near=zc-ro-150,zT=near-1250;
 // Tail lift of the truck parked with its rear at the shaft (floor height 1.1 m).
 // Truck parked beside the shaft; tail lift behind its rear (+x).
 const platform={x0:-1300,x1:600,z0:zT-1250,z1:zT+1250,y:G+1100,zT};
 return {dn,Rp,t,Rm,wall,ro,zc,platform,yokeTop:580,yokeStop:60*Math.PI/180,z0:zc*.55,G,top,coneTop:top,coneBottom:Rm>=600?top-200:top-620,cone:Rm<600,base:invert-260,water:invert+33,ladder:{depth:160,half:150,from:420}};
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
// Estimated masses (kg) for the static equilibrium; no weighed values exist.
// Robot 54 kg (IBAK: MicroGator "allein die 54 kg"); mould mass estimated.
export function insertionMasses(dn){return{robot:54,mould:10+dn*.022};}
const DEG=Math.PI/180;
// Quasi-static solver: the unit hangs from the crane hook at the lifting eye
// on top of the robot. For a hook position it finds robot tilt and hinge
// opening with the least potential energy (gravity + hinge springs), while
// tail lift, street, frame, cone, shaft wall, climbing irons, channel and pipe
// act as contacts (penalty). The hinge can only open nose-up (0…90°).
function makeSolver(geo){
 const {spec,pin,eye,masses}=geo,P=spec.platform,L=spec.ladder;
 // Even sample plus the silhouette (extreme points in 48 slices along the
 // unit), so thin parts such as the guide wheel still make contact.
 const thin=(pts,n)=>{const step=Math.max(1,Math.ceil(pts.length/n)),out=pts.filter((p,i)=>i%step===0);
  let lo=Infinity,hi=-Infinity;for(const p of pts){lo=Math.min(lo,p.x);hi=Math.max(hi,p.x);}
  const bins=Array.from({length:48},()=>({}));for(const p of pts){const b=bins[Math.min(47,Math.floor((p.x-lo)/(hi-lo+1e-6)*48))];for(const [k,f] of[['y0',q=>-q.y],['y1',q=>q.y],['z0',q=>-q.z],['z1',q=>q.z],['d0',q=>-q.y-Math.abs(q.z)],['d1',q=>q.y-Math.abs(q.z)]])if(!b[k]||f(p)>f(b[k]))b[k]=p;}
  for(const b of bins)out.push(...Object.values(b));return out;};
 const pack=(pts,o)=>{const a=new Float64Array(pts.length*3);pts.forEach((p,i)=>{a[i*3]=p.x-o.x;a[i*3+1]=p.y-o.y;a[i*3+2]=p.z;});return a;};
 const R=pack(thin(geo.robotPtsStraight||geo.robotPts,1400),eye),F=pack(thin(geo.formPts,900),pin);
 const pe=pin.clone().sub(eye),cr=geo.comR.clone().sub(eye),cf=geo.comF.clone().sub(pin);
 const viol=(x,y,z)=>{
  if(y>=spec.G-1){
   let v=0;
   if(x>P.x0&&x<P.x1&&z>P.z0&&z<P.z1&&y<P.y&&y>P.y-250)v=P.y-y;
   if(y<spec.G+1&&Math.hypot(x,z-spec.zc)>spec.ro)v=Math.max(v,spec.G+1-y);
   return v;
  }
  const wall=Math.sqrt(Math.max(0,spec.Rm*spec.Rm-z*z));
  if(y<spec.Rp&&Math.abs(x)>wall-2)return Math.max(0,Math.hypot(y,z)-(spec.Rp-1));
  const {cz,r}=shaftProfile(spec,y);let v=Math.max(0,Math.hypot(x,z-cz)-(r-8));
  if(y<spec.Rp+60)v=Math.max(v,floorAt(spec,x,z)+1-y);
  if(y>L.from-40&&y<spec.coneTop-150&&Math.abs(x)<L.half+25)v=Math.max(v,-spec.Rm+L.depth+17-z);
  return v;
 };
 const K=3000,kh=90;
 const energy=(H,tr,h)=>{
  const c=Math.cos(tr),s=Math.sin(tr),tf=tr+h,cf2=Math.cos(tf),sf=Math.sin(tf);
  const Wx=H.x+c*pe.x-s*pe.y,Wy=H.y+s*pe.x+c*pe.y;
  let pen=0;
  for(let i=0;i<R.length;i+=3){const v=viol(H.x+c*R[i]-s*R[i+1],H.y+s*R[i]+c*R[i+1],H.z+R[i+2]);pen+=v*v;}
  for(let i=0;i<F.length;i+=3){const v=viol(Wx+cf2*F[i]-sf*F[i+1],Wy+sf*F[i]+cf2*F[i+1],H.z+F[i+2]);pen+=v*v;}
  const yr=H.y+s*cr.x+c*cr.y,yf=Wy+sf*cf.x+cf2*cf.y;
  return masses.robot*yr+masses.mould*yf+kh*h*h+K*pen;
 };
 const pinAt=(H,tr)=>V(H.x+Math.cos(tr)*pe.x-Math.sin(tr)*pe.y,H.y+Math.sin(tr)*pe.x+Math.cos(tr)*pe.y,H.z);
 // seed: start of a local descent (the hanging configuration); without it a
 // coarse global search, used only for the pick-up from the tail lift.
 // The chain hook carries the lifting yoke; its round pins sit in the side
 // slots, so the robot turns about the pins. The yoke's cross bar lies on the
 // robot top at ±yokeStop, then yoke and robot turn together about the hook.
 // H is the pin position with the yoke plumb; u: chain slack when the unit is
 // supported; ty: yoke tilt.
 // The yoke tilt is ty = tr + dy with |dy| ≤ stop (hard limit).
 const Ly=spec.yokeTop,stop=spec.yokeStop;
 const pinFrom=(H,u,ty)=>V(H.x+Ly*Math.sin(ty),H.y+Ly+u-Ly*Math.cos(ty),H.z);
 // guide/kg: a fitter steering the unit by hand (guide rope) towards a tilt.
 const solve=(H,seed,guide,kg=0)=>{
  const E3=(tr,h,u,dy)=>energy(pinFrom(H,u,tr+dy),tr,h)+(kg?kg*(tr-guide)**2:0);
  let best={tr:0,h:0,u:0,dy:0,E:Infinity};
  if(seed){const dy=clamp((seed.ty||0)-seed.thetaR,-stop,stop);best={tr:seed.thetaR,h:seed.h,u:seed.u||0,dy,E:E3(seed.thetaR,seed.h,seed.u||0,dy)};}
  else for(let a=-110;a<=30;a+=6)for(let b=0;b<=90;b+=10){const dy=clamp(-a*DEG,-stop,stop),E=E3(a*DEG,b*DEG,0,dy);if(E<best.E)best={tr:a*DEG,h:b*DEG,u:0,dy,E};}
  // Moves: robot with yoke, hinge, both leaves, chain slack, robot under the resting yoke, yoke alone.
  for(const d of seed?[8,4,2,1,.5,.25,.1]:[4,2,1,.5,.25,.1]){const step=d*DEG,du=d*6;for(let it=0;it<6;it++){let moved=false;for(const [dt,dh,dd,dy] of[[step,0,0,0],[-step,0,0,0],[0,step,0,0],[0,-step,0,0],[step,-step,0,0],[-step,step,0,0],[0,0,du,0],[0,0,-du,0],[step,0,0,-step],[-step,0,0,step],[0,0,0,step],[0,0,0,-step]]){const tr=best.tr+dt,h=clamp(best.h+dh,0,Math.PI/2),u=Math.max(0,best.u+dd),y=clamp(best.dy+dy,-stop,stop),E=E3(tr,h,u,y);if(E<best.E-1e-7){best={tr,h,u,dy:y,E};moved=true;}}if(!moved)break;}}
  const ty=best.tr+best.dy,eyeAt=pinFrom(H,best.u,ty);
  return{thetaR:best.tr,h:best.h,u:best.u,ty,eye:eyeAt,W:pinAt(eyeAt,best.tr)};
 };
 // Resting on the tail lift, straight and centred.
 const all=[...geo.formPts,...geo.robotPts],minX=all.reduce((m,p)=>Math.min(m,p.x),Infinity),maxX=all.reduce((m,p)=>Math.max(m,p.x),-Infinity);
 const W0=V(pin.x-(minX+maxX)/2+(P.x0+P.x1)/2,P.y-geo.yb+pin.y+1,(P.z0+P.z1)/2);
 // Final in-channel pose: rear just clear of the round shaft wall.
 const rearGap=geo.robotPts.reduce((m,p)=>Math.min(m,p.x-pin.x+Math.sqrt(Math.max(0,spec.Rm**2-p.z*p.z))),Infinity);
 const final=V(Math.max(30,22-rearGap),pin.y,0);
 // Free hanging pose far above everything: how far the nose reaches below the eye.
 const ref=V(0,spec.G+9000,0),free=solve(ref),freeLow=(()=>{let m=Infinity;const c=Math.cos(free.thetaR),s=Math.sin(free.thetaR);for(let i=0;i<R.length;i+=3)m=Math.min(m,s*R[i]+c*R[i+1]);const tf=free.thetaR+free.h,c2=Math.cos(tf),s2=Math.sin(tf),W=pinAt(V(),free.thetaR);for(let i=0;i<F.length;i+=3)m=Math.min(m,W.y+s2*F[i]+c2*F[i+1]);return -m;})();
 // Axis of a hanging pose relative to the hook reference: centre c, direction
 // d (towards the nose), extent s0 (rear) … s1 (nose) and all points.
 const axisOf=q=>{const tr=q.thetaR,tf=tr+q.h,d=V(Math.cos(tr),Math.sin(tr),0),e=q.eye.clone().sub(ref),w=q.W.clone().sub(ref),pts=[];
  for(let i=0;i<R.length;i+=3)pts.push(V(...rot(V(R[i],R[i+1],0),tr).add(e).toArray().slice(0,2),R[i+2]));
  for(let i=0;i<F.length;i+=3)pts.push(V(...rot(V(F[i],F[i+1],0),tf).add(w).toArray().slice(0,2),F[i+2]));
  const c=pts.reduce((a,p)=>a.add(V(p.x,p.y,0)),V()).multiplyScalar(1/pts.length);let s0=Infinity,s1=-Infinity;
  for(const p of pts){const s=(p.x-c.x)*d.x+(p.y-c.y)*d.y;s0=Math.min(s0,s);s1=Math.max(s1,s);}
  return{c,d,s0,s1,pts};};
 // Passing frame, slab or cone opening (625/800/1000 mm): the operator lowers
 // the unit along its axis. tau = axis coordinate (from the centroid, towards
 // the nose) that is at frame height yf, at x = xoff. For a tilt th the
 // worst clearance of the rigid unit (negative = fits).
 const yf=spec.G-115,freeAxis=axisOf(free),AP=(()=>{const A=freeAxis,n=V(-A.d.y,A.d.x,0);return A.pts.map(p=>{const x=p.x-A.c.x,y=p.y-A.c.y;return[x*A.d.x+y*A.d.y,x*n.x+y*n.y,p.z+spec.z0];});})();
 const viol2=(th,tau,xoff)=>{const c=Math.cos(th),s=Math.sin(th);let m=-Infinity;for(const [sp,qp,z] of AP){const y=yf+(sp-tau)*s+qp*c;if(y>spec.G)continue;const x=xoff+(sp-tau)*c-qp*s,{cz,r}=shaftProfile(spec,y);m=Math.max(m,Math.hypot(x,z-cz)-r,floorAt(spec,x,z)-y);}return m;};
 const bestOff=(th,tau)=>{let lo=-spec.Rm*.8,hi=spec.Rm*.5;for(let i=0;i<24;i++){const a=lo+(hi-lo)/3,b=hi-(hi-lo)/3;if(viol2(th,tau,a)<viol2(th,tau,b))hi=b;else lo=a;}const x=(lo+hi)/2;return{x,v:viol2(th,tau,x)};};
 // Flattest tilt that fits at each stage of the passage; where the hanging
 // tilt does not fit, the fitters steer the unit steeper by hand (guide
 // rope), ahead of time and only as far as needed, then let it go back.
 const passPath=(()=>{const s0=freeAxis.s0,s1=freeAxis.s1,K=24,th0=free.thetaR,need=[],taus=[];
  for(let k=0;k<=K;k++){const tau=s1-(s1-s0)*k/K;taus.push(tau);if(bestOff(th0,tau).v<=-10){need.push(th0);continue;}let lo=-88*DEG,hi=th0;for(let i=0;i<16;i++){const m=(lo+hi)/2;if(bestOff(m,tau).v<=-10)lo=m;else hi=m;}need.push(lo-1.5*DEG);}
  const rate=DEG/30,tilt=[],lo=[],hi=[],mid=[];
  for(let k=0;k<=K;k++){let t=th0;for(let j=0;j<=K;j++)t=Math.min(t,need[j]+rate*Math.abs(taus[k]-taus[j]));tilt.push(t);
   // Feasible band of the crossing point; the operator keeps near its middle.
   const o=bestOff(t,taus[k]),edge=(from,to)=>{if(viol2(t,taus[k],to)<=-10)return to;for(let i=0;i<18;i++){const m=(from+to)/2;if(viol2(t,taus[k],m)<=-10)from=m;else to=m;}return from;};
   lo.push(edge(o.x,o.x-spec.Rm));hi.push(edge(o.x,o.x+spec.Rm));mid.push(o.v<=-10?(lo[k]+hi[k])/2:o.x);}
  // Smooth the crossing point over the passage, but stay inside the band.
  const xs=mid.map((_,k)=>{let a=0,n=0;for(let j=Math.max(0,k-3);j<=Math.min(K,k+3);j++){a+=mid[j];n++;}return clamp(a/n,Math.min(lo[k],hi[k]),Math.max(lo[k],hi[k]));});
  // Pose at passage progress kf (0…K): the rigid hanging unit turned to the
  // planned tilt about its centroid; yoke on its stop; hook reference H0.
  const trf=free.thetaR,Wrel=free.W.clone().sub(ref).sub(freeAxis.c).setZ(0);
  const at=kf=>{kf=clamp(kf,0,K);const i=Math.min(K-1,Math.floor(kf)),u=kf-i,t=lerp(tilt[i],tilt[i+1],u),tau=lerp(taus[i],taus[i+1],u),x=lerp(xs[i],xs[i+1],u);
   const W=V(x-tau*Math.cos(t),yf-tau*Math.sin(t),0).add(rot(Wrel,t-trf)).setZ(spec.z0),eye=W.clone().sub(rot(pe,t)).setZ(spec.z0),ty=clamp(0,t-stop,t+stop);
   return{tr:t,W,eye,ty,H0:eye.clone().sub(V(Ly*Math.sin(ty),Ly*(1-Math.cos(ty)),0))};};
  return{K,at};})();
 return{solve,W0,final,free,freeLow,freeAxis,passPath,energy,pinAt};
}
export function insertionKinematics(time,geo){
 if(geo.memo&&geo.memo.time===time)return geo.memo.k;
 const k=insertionPose(time,geo);geo.memo={time,k};return k;
}
function insertionPose(time,geo){
 const {spec,pin,eye}=geo,N=insertionStages.length,T=clamp(time,0,N-.001),stage=Math.floor(T),f=T-stage;
 const S=geo.solver||(geo.solver=makeSolver(geo)),P=spec.platform;
 const toEye=eye.clone().sub(pin),eye0=S.W0.clone().add(toEye),eyeF=S.final.clone().add(toEye);
 const rest=V(eye0.x,eye0.y+900,eye0.z),lift=Math.max(P.y+S.freeLow+250,eye0.y+250);
 // Landing: the guide wheel sets down in the channel; while the crane lowers,
 // mould and robot flatten together, the mould slides into the pipe and the
 // hinge opens only a little (site experience: almost never 90°).
 const fp=geo.formPts;
 const contact=(theta,wx)=>{let y=-Infinity;for(const p of fp){const q=rot(V(p.x-pin.x,p.y-pin.y,p.z),theta);y=Math.max(y,floorAt(spec,wx+q.x,p.z)-q.y);}return y;};
 const hangX=30,restY=pin.y-(S.rest??=contact(0,0)),lie=(theta,wx)=>contact(theta,wx)+restY*smooth(1+theta/(Math.PI/2)*2);
 // Clearance of the robot's rear to the shaft wall behind it (cone included),
 // for robot tilt theta, cable bomb angle a (it turns about its own pivot) and
 // pin height wy.
 const RG=S.rearPts??=(()=>{const b=geo.bodyPts||geo.robotPts,pp=geo.plugPts||[],pv=(geo.plugPivot||pin).clone().sub(pin),o=[];
  for(const p of b)o.push([p.x-pin.x,p.y-pin.y,p.z,0]);for(const p of pp)o.push([p.x,p.y,p.z,1]);return{o,pv};})();
 const rearGap=(theta,a,wy)=>{const c=Math.cos(theta),s=Math.sin(theta),ca=Math.cos(a),sa=Math.sin(a);let m=Infinity;
  for(const [x0,y0,z,k] of RG.o){const x=k?RG.pv.x+ca*x0-sa*y0:x0,y=k?RG.pv.y+sa*x0+ca*y0:y0,{cz,r}=shaftProfile(spec,wy+s*x+c*y);m=Math.min(m,c*x-s*y+Math.sqrt(Math.max(0,r*r-(z-cz)**2)));}return m;};
 // Flattest robot tilt whose rear still clears the wall with the pin at wx.
 const trNeed=(wx,a,wy)=>{if(rearGap(0,a,wy)+wx>=22)return 0;let lo=-Math.PI/2,hi=0;for(let i=0;i<22;i++){const m=(lo+hi)/2;if(rearGap(m,a,wy)+wx>=22)lo=m;else hi=m;}return lo;};
 // Inside the pipe the mould can only be tilted as far as the crown allows.
 const fitsPipe=(tf,wx)=>{const wy=lie(tf,wx),c=Math.cos(tf),s=Math.sin(tf);for(const p of fp){const x0=p.x-pin.x,y0=p.y-pin.y;if(wx+c*x0-s*y0>Math.sqrt(Math.max(0,spec.Rm**2-p.z*p.z))-2&&Math.hypot(wy+s*x0+c*y0,p.z)>spec.Rp-3)return false;}return true;};
 const tfMin=(wx,from)=>{if(fitsPipe(from,wx))return from;let lo=from,hi=0;for(let i=0;i<22;i++){const m=(lo+hi)/2;if(fitsPipe(m,wx))hi=m;else lo=m;}return hi;};
 // Pin position that puts the mould's front 15 mm before the pipe mouth.
 const wxL=tf=>{const c=Math.cos(tf),s=Math.sin(tf);let m=Infinity;for(const p of fp){const x0=p.x-pin.x,y0=p.y-pin.y;m=Math.min(m,Math.sqrt(Math.max(0,spec.Rm**2-p.z*p.z))-(c*x0-s*y0));}return m-15;};
 // Landing tilt: as flat as the hanging tilt allows, steep enough that the
 // robot's rear (bomb still straight) is inside the shaft while the guide
 // wheel stands on the channel just in front of the mouth.
 const ok2=m=>{const wx=wxL(m);return rearGap(m,0,lie(m,wx))+wx>=22;};
 const th2=S.th2??=(()=>{let lo=-Math.PI/2,hi=Math.min(S.free.thetaR,-.3);if(ok2(hi))return Math.max(hi,lo);for(let i=0;i<30;i++){const m=(lo+hi)/2;if(ok2(m))lo=m;else hi=m;}return lo;})();
 // Mould tilt over the pin position while sliding in: never steeper than the
 // crown allows, turning at most 1° per 4 mm so it levels ahead of the limit.
 const tiltTable=(x0,t0)=>{const n=Math.max(8,Math.ceil((S.final.x-x0)/5)),w=i=>lerp(x0,S.final.x,i/n),lim=[];let from=t0;
  for(let i=0;i<=n;i++){from=tfMin(w(i),from);lim.push(from);}
  const k=Math.PI/180/4*(S.final.x-x0)/n,g=[];let run=-Infinity;
  for(let i=n;i>=0;i--){run=Math.max(run-k,lim[i]);g[i]=Math.min(0,Math.max(run,t0*(1-smooth(i/n))));}
  return{n,g};};
 // Entry tilt: the mould turns about its guide wheel in front of the mouth
 // until it has the tilt the sliding-in needs at its start.
 const tfE=S.tfE??=tiltTable(wxL(th2),th2).g[0],wx1=S.wx1??=wxL(tfE),tilt=S.tilt??=tiltTable(wx1,tfE);
 const mouldTilt=wx=>{const x=clamp((wx-wx1)/(S.final.x-wx1))*tilt.n,i=Math.min(tilt.n-1,Math.floor(x));return lerp(tilt.g[i],tilt.g[i+1],x-i);};
 const W3=S.W3??=(()=>{const wx=wxL(th2);return V(wx,lie(th2,wx),0);})(),eye3=W3.clone().add(rot(toEye,th2)),stop=spec.yokeStop,Ly=spec.yokeTop,yokeFor=tr=>clamp(0,tr-stop,tr+stop);
 // Hook reference at landing: the yoke rests on the robot at the stop, so the
 // hook is not above the eye.
 const ty3=yokeFor(th2),hook3=V(eye3.x-Ly*Math.sin(ty3),eye3.y-Ly*(1-Math.cos(ty3))+12,0);
 // Stage 2 in three parts: lowering the hanging unit until its nose is at the
 // frame (physics); the passage through frame, slab or cone, the fitters
 // guiding the unit by hand (planned, collision-free); lowering in the shaft
 // to the landing point, steered to the landing tilt (physics, contacts).
 const PP=S.passPath,P0=S.P0??=PP.at(0),PK=S.PK??=PP.at(PP.K),xTop=P0.H0.x;
 const seg=S.seg??=(()=>{const d1=Math.max(1,lift-P0.H0.y),d2=Math.max(1,P0.H0.y-PK.H0.y),d3=Math.max(1,PK.H0.y-hook3.y),T=d1+d2+d3;return{a:d1/T,b:(d1+d2)/T};})();
 const hookAt=(st,g)=>{
  if(st===1){const a=smooth(g/.75),b=smooth((g-.6)/.4);return V(lerp(eye0.x,xTop,b),lerp(eye0.y,lift,a),lerp(eye0.z,spec.z0,b));}
  if(st===2)return V(xTop,lerp(lift,P0.H0.y,g),spec.z0);
  return V(lerp(PK.H0.x,hook3.x,smooth(g)),lerp(PK.H0.y,hook3.y,g),lerp(spec.z0,0,smooth(g/.7)));
 };
 // Stages 1–2 are solved as one continuous sequence (each pose starts from the
 // previous one), lightly damped and cached, so any seek order gives the same result.
 const table=st=>{
  S.tables??={};if(S.tables[st])return S.tables[st];
  const n=48,raw=[];let seed=st===1?{thetaR:0,h:0,u:0,ty:0}:st===2?(()=>{const e=table(1).at(-1);return{thetaR:e[0],h:e[1],u:e[4],ty:e[5]};})():{thetaR:PK.tr,h:0,u:0,ty:PK.ty};
  for(let i=0;i<=n;i++){const H0=hookAt(st,i/n),q=st===3?S.solve(H0,seed,lerp(PK.tr,th2,smooth(i/n)),3e5):S.solve(H0,seed);raw.push([q.thetaR,q.h,q.eye.x-H0.x,q.eye.y-H0.y,q.u,q.ty]);seed=q;}
  const damp=st===1?.3:1,sm=[raw[0].slice()];for(let i=1;i<=n;i++){const p=sm[i-1],r=raw[i];sm.push(p.map((v,k)=>v+(r[k]-v)*damp));}
  return S.tables[st]=sm.map((v,i)=>{const w=smooth((i/n-.8)/.2);return v.map((x,k)=>lerp(x,raw[i][k],w));});
 };
 // Cable bomb: straight while lifting and lowering (clear of the chain), folded
 // up only after touching down, to lay the robot down in the shaft; back in
 // line in the pipe.
 const up=-Math.PI/2,plug=stage<3?0:stage===3?lerp(0,up,smooth((f-.05)/.35)):stage===4?up:lerp(up,0,smooth((f-.45)/.3));
 let H,pose,rope=1,drive=0,ty=0;
 if(stage===0){H=rest.clone().lerp(eye0,smooth(f/.7));pose={thetaR:0,h:0,W:S.W0.clone()};}
 else if(stage===1){
  const tb=table(1),x=f*48,i=Math.min(47,Math.floor(x)),u=x-i,a0=tb[i],a1=tb[i+1],L=k=>lerp(a0[k],a1[k],u);
  H=hookAt(1,f).add(V(L(2),L(3),0));ty=L(5);pose={thetaR:L(0),h:clamp(L(1),0,Math.PI/2),W:S.pinAt(H,L(0))};
 }
 else if(stage===2){
  const gs=smooth(f);
  if(gs>=seg.a&&gs<seg.b){const q=PP.at((gs-seg.a)/(seg.b-seg.a)*PP.K);H=q.eye.clone();ty=q.ty;pose={thetaR:q.tr,h:0,W:q.W.clone()};}
  else{
   const part=gs<seg.a?2:3,g=part===2?gs/seg.a:(gs-seg.b)/(1-seg.b),tb=table(part),x=g*48,i=Math.min(47,Math.floor(x)),u=x-i,a0=tb[i],a1=tb[i+1],L=k=>lerp(a0[k],a1[k],u);
   H=hookAt(part,g).add(V(L(2),L(3),0));let tr=L(0),h=clamp(L(1),0,Math.PI/2);ty=L(5);
   // Hand over from the guided passage without a jerk.
   if(part===3){const w=smooth(g/.12);tr=lerp(PK.tr,tr,w);h*=w;ty=lerp(PK.ty,ty,w);H.lerp(PK.eye,1-w);}
   // Arrive exactly in the landing configuration at the end of lowering.
   const b=smooth((f-.9)/.1);tr=lerp(tr,th2,b);h=lerp(h,0,b);ty=lerp(ty,yokeFor(th2),b);if(b>0)H.lerp(eye3,b);
   pose={thetaR:tr,h,W:S.pinAt(H,tr)};
  }
 }
 else if(stage===3){
  // Touch-down in front of the mouth: while the crane lowers, the mould turns
  // about its guide wheel until it is flat enough to enter; the robot keeps
  // its rear clear of the wall, so the hinge opens only by the difference.
  const tf=lerp(th2,tfE,smooth(f/.9)),wx=wxL(tf),W=V(wx,lie(tf,wx),0),tr=Math.min(tf,trNeed(wx,plug,W.y));
  pose={thetaR:tr,h:tf-tr,W};H=W.clone().add(rot(toEye,tr));ty=yokeFor(tr);
 }
 else if(stage===4){
  // The mould slides into the pipe, the robot lies down, the springs close the hinge.
  const wx=lerp(wx1,S.final.x,smooth(f)),tf=mouldTilt(wx),W=V(wx,lie(tf,wx),0),tr=Math.min(tf,trNeed(wx,plug,W.y));
  pose={thetaR:tr,h:tf-tr,W};H=W.clone().add(rot(toEye,tr));ty=yokeFor(tr);
 }
 else{drive=1400*smooth((f-.15)/.85);rope=1-smooth(f/.2);H=eyeF.clone().add(V(drive,0,0));pose={thetaR:0,h:0,W:S.final.clone().add(V(drive,0,0))};}
 return{stage,f,thetaF:pose.thetaR+pose.h,thetaR:pose.thetaR,W:pose.W,drive,rope,plug,hinge:pose.h,hook:H,yoke:ty};
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

// Box truck parked beside the shaft, seen from the side; the tail lift at the
// rear (+x) is at loading height and the red column crane stands inside the
// box at the rear door, its boom coming out of the truck (site photos).
// Proportions of a 7.5 t service truck; not a specific vehicle.
function buildTruck(spec){
 const G=spec.G,P=spec.platform,xr=P.x0,zT=P.zT,Wd=1250,H=2350,Lb=4800,floor=P.y,grp=new THREE.Group();grp.name='LKW mit Kran im Koffer (Darstellung)';
 const white=new THREE.MeshStandardMaterial({color:'#eef0f1',metalness:.15,roughness:.45}),inner=new THREE.MeshStandardMaterial({color:'#8f9497',roughness:.8,side:THREE.DoubleSide});
 const black=new THREE.MeshStandardMaterial({color:'#15181b',roughness:.7}),tyre=new THREE.MeshStandardMaterial({color:'#1a1b1d',roughness:.92}),rim=new THREE.MeshStandardMaterial({color:'#b9c0c6',metalness:.85,roughness:.3});
 const glass=new THREE.MeshStandardMaterial({color:'#0c1720',metalness:.6,roughness:.08}),red=new THREE.MeshStandardMaterial({color:'#c8231e',metalness:.3,roughness:.4}),blue=new THREE.MeshStandardMaterial({color:'#1565b8',metalness:.3,roughness:.4});
 const crane=new THREE.MeshStandardMaterial({color:'#d1211b',metalness:.35,roughness:.35}),steel=new THREE.MeshStandardMaterial({color:'#9aa3aa',metalness:.85,roughness:.28}),alu=new THREE.MeshStandardMaterial({color:'#b7bcbf',metalness:.7,roughness:.38});
 const amber=new THREE.MeshStandardMaterial({color:'#ffb21e',emissive:'#ff9a00',emissiveIntensity:.9,roughness:.3});
 const add=(g,m,p)=>{const o=mesh(g,m);if(p)o.position.copy(p);grp.add(o);return o;};
 const xc=xr-Lb/2,near=zT+Wd;
 // Closed box body; only the rear (+x) is open with the doors folded to the sides.
 add(new THREE.BoxGeometry(Lb,H,40),white,V(xc,floor+H/2,zT+Wd));add(new THREE.BoxGeometry(Lb,H,40),white,V(xc,floor+H/2,zT-Wd));
 add(new THREE.BoxGeometry(Lb,50,2*Wd+40),white,V(xc,floor+H,zT));add(new THREE.BoxGeometry(40,H,2*Wd+40),white,V(xr-Lb,floor+H/2,zT));
 add(new THREE.BoxGeometry(Lb,60,2*Wd),new THREE.MeshStandardMaterial({color:'#8e9396',metalness:.5,roughness:.5}),V(xc,floor-30,zT));
 add(new THREE.BoxGeometry(20,H-60,2*Wd-60),inner,V(xr-1400,floor+H/2,zT));
 for(const s of[-1,1]){add(new THREE.BoxGeometry(70,H,70),alu,V(xr,floor+H/2,zT+s*(Wd-15)));const door=add(new THREE.BoxGeometry(Wd-20,H-60,30),white,V(xr-(Wd-20)/2-40,floor+H/2,zT+s*(Wd+38)));door.name='Hecktür (geöffnet)';}
 add(new THREE.BoxGeometry(70,120,2*Wd+40),alu,V(xr,floor+H-40,zT));
 // Livery on the kerb side facing the street and the shaft (+z).
 const logoPlane=add(new THREE.PlaneGeometry(3100,3100*733/2145),new THREE.MeshStandardMaterial({transparent:true,roughness:.35,metalness:.1,color:'#ffffff'}),V(xc-300,floor+1560,near+22));logoPlane.name='DiTom-Logo';logoPlane.visible=false;logoPlane.castShadow=false;
 add(new THREE.BoxGeometry(Lb-200,90,6),red,V(xc-100,floor+300,near+22));add(new THREE.BoxGeometry(Lb-200,36,6),blue,V(xc-100,floor+400,near+22));
 const emblem=emblemTexture(),claim=claimTexture();
 if(emblem){const e=add(new THREE.PlaneGeometry(1000,1000),new THREE.MeshStandardMaterial({map:emblem,transparent:true,roughness:.4}),V(xr-640,floor+1350,near+60));e.name='DSS-Flex-Emblem';e.castShadow=false;}
 if(claim){const c=add(new THREE.PlaneGeometry(3100,242),new THREE.MeshStandardMaterial({map:claim,transparent:true,roughness:.5,color:'#26303a'}),V(xc-300,floor+880,near+23));c.castShadow=false;}
 if(typeof document!=='undefined'){const img=document.querySelector('.brand-logo');if(img?.src)new THREE.TextureLoader().load(img.src,t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;logoPlane.material.map=t;logoPlane.material.needsUpdate=true;logoPlane.visible=true;});}
 // Chassis, wheels, cab (front at −x).
 for(const s of[-1,1])add(new THREE.BoxGeometry(7400,260,90),black,V(xr-3300,floor-230,zT+s*430));
 for(const [x,dual] of[[xr-1500,true],[xr-5700,false]])for(const s of[-1,1]){
  const w=dual?560:300,z=zT+s*(Wd-w/2-30);
  for(const [r,m,ww] of[[480,tyre,w],[270,rim,w+8],[90,steel,w+30]]){const o=mesh(new THREE.CylinderGeometry(r,r,ww,r>300?40:24),m);o.rotation.x=Math.PI/2;o.position.set(x,G+480,z);grp.add(o);}
  add(new THREE.BoxGeometry(dual?1150:720,40,w+40),black,V(x,floor-140,z));
 }
 add(new RoundedBoxGeometry(1850,2450,2480,4,120),white,V(xr-Lb-1000,G+2250,zT)).name='Fahrerhaus';
 add(new THREE.PlaneGeometry(700,650),glass,V(xr-Lb-1250,G+2950,near+2));
 add(new THREE.PlaneGeometry(2150,1000),glass,V(xr-Lb-1927,G+2850,zT)).rotation.y=-Math.PI/2;
 add(new THREE.BoxGeometry(260,110,1500),amber,V(xr-Lb-1000,G+3530,zT));
 add(new THREE.BoxGeometry(1500,30,4),red,V(xr-Lb-1000,G+1750,near+2));
 for(const s of[-1,1])add(new THREE.BoxGeometry(40,180,260),new THREE.MeshStandardMaterial({color:'#b3120d',emissive:'#6a0000',emissiveIntensity:.6}),V(xr+20,floor-200,zT+s*(Wd-260)));
 // Tail lift at floor height behind the rear, with warning edge and arms.
 add(new THREE.BoxGeometry(P.x1-P.x0,60,2*Wd),alu,V((P.x0+P.x1)/2,P.y-30,zT)).name='Ladebordwand';
 for(let i=0;i<10;i++)add(new THREE.BoxGeometry(40,62,250),i%2?red:white,V(P.x1-20,P.y-30,zT-Wd+125+i*250));
 for(const s of[-1,1])add(new THREE.BoxGeometry(900,90,90),black,V(xr+200,P.y-300,zT+s*700)).rotation.z=-.35;
 // Column crane just inside the rear door, boom out of the truck.
 const base=V(xr-450,floor,near-420);
 add(new THREE.BoxGeometry(420,30,420),crane,base.clone().add(V(0,15,0)));
 add(new THREE.BoxGeometry(170,1280,170),crane,base.clone().add(V(0,670,0)));
 const head=add(new THREE.BoxGeometry(240,180,240),crane,base.clone().add(V(0,1380,0)));
 const pivot=base.clone().add(V(0,1420,0));
 const mk=m=>{const o=mesh(new THREE.BoxGeometry(1,1,1),m);grp.add(o);return o;};
 const boomA=mk(crane),boomB=mk(crane),cyl=mk(black),rod=mk(steel),sheave=mesh(new THREE.CylinderGeometry(70,70,50,20),black);grp.add(sheave);
 const up=V(0,1,0),minTip=floor+1900,maxTip=floor+4400;
 // The boom luffs up so the hoist always stays well above the load.
 const pose=target=>{
  const flat=V(target.x-pivot.x,0,target.z-pivot.z),d=clamp(flat.length(),700,2900),dir=flat.lengthSq()>1?flat.normalize():V(1,0,0);
  const T=V(pivot.x+dir.x*d,clamp(target.y+950,minTip,maxTip),pivot.z+dir.z*d);
  const mid=pivot.clone().lerp(T,Math.min(.62,1100/T.distanceTo(pivot)));
  beam(boomA,pivot,mid,150,160);beam(boomB,mid.clone().lerp(pivot,.08),T,110,120);
  const c0=base.clone().add(V(0,420,0)).addScaledVector(dir,110),c1=pivot.clone().lerp(mid,.8).addScaledVector(up,-90);
  beam(cyl,c0,c0.clone().lerp(c1,.58),110,110);beam(rod,c0.clone().lerp(c1,.52),c1,55,55);
  head.rotation.y=-Math.atan2(dir.z,dir.x);sheave.position.copy(T);sheave.rotation.set(0,-Math.atan2(dir.z,dir.x),Math.PI/2);
  return T.clone().add(V(0,-70,0));
 };
 // Robot cable drum at the rear inside the box (seen through the door only from the rear).
 const drum=new THREE.Group();drum.name='Kabeltrommel Roboter';const dc=V(xr-500,floor+470,zT-500);
 {const reel=mesh(new THREE.CylinderGeometry(300,300,420,32),new THREE.MeshStandardMaterial({color:'#1b1e20',roughness:.6}));reel.rotation.x=Math.PI/2;drum.add(reel);
  for(const s of[-1,1]){const fl=mesh(new THREE.CylinderGeometry(440,440,24,40),blue);fl.rotation.x=Math.PI/2;fl.position.z=s*222;drum.add(fl);}}
 drum.position.copy(dc);grp.add(drum);
 return{group:grp,pose,drumTop:dc.clone().add(V(0,300,0)),rest:V((P.x0+P.x1)/2,P.y+900,zT),crane:{pivot}};
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
  // Same vitrified clay as the repair animation (dark, salt-glazed).
  this.pipeMat=new THREE.MeshStandardMaterial({color:'#422b21',...pipeTex,bumpScale:.12,roughness:1,metalness:0,envMapIntensity:.18,side:THREE.DoubleSide});
  const asphalt=asphaltTexture();asphalt.repeat.set(16,16);
  this.asphaltMat=new THREE.MeshStandardMaterial({color:'#9a9a9a',map:asphalt,bumpMap:asphalt,bumpScale:2,roughness:.92,side:THREE.DoubleSide});
  this.jointMat=new THREE.MeshStandardMaterial({color:'#4d4b46',roughness:1,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  this.capConcrete=new THREE.MeshStandardMaterial({color:'#a3a29b',...surfaceTextures('mortar'),roughness:1});
  this.capSoil=new THREE.MeshStandardMaterial({color:'#7a5e44',...soil,bumpScale:1,roughness:1});
  this.capPipe=new THREE.MeshStandardMaterial({color:'#4a3025',roughness:1});
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
   const s=new THREE.Shape([V(-4600,-9800),V(6400,-9800),V(6400,2400),V(-4600,2400)].map(p=>new THREE.Vector2(p.x,p.y)));const h=new THREE.Path();h.absarc(0,spec.zc,spec.ro+wall,0,TAU,true);s.holes.push(h);
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
   cover.position.set(1700,G+14,420);cover.rotation.y=.3;this.group.add(cover);
   const markMat=new THREE.MeshStandardMaterial({color:'#e9e8e1',roughness:.8});this.cut.push(markMat);
   for(let x=-4200;x<6200;x+=3000){const m=add(new THREE.BoxGeometry(1500,3,120),markMat);m.position.set(x,G+2,1300);}
   const coneMat=new THREE.MeshStandardMaterial({color:'#e2502b',roughness:.6}),white=new THREE.MeshStandardMaterial({color:'#f1f1ea',roughness:.5});
   for(const [x,z] of[[-2600,600],[1700,-1150],[1500,900],[-1200,1200]]){const c=new THREE.Group();c.add(mesh(new THREE.BoxGeometry(380,30,380),new THREE.MeshStandardMaterial({color:'#222',roughness:.9})));const k=mesh(new THREE.ConeGeometry(150,700,32),coneMat);k.position.y=365;c.add(k);for(const y of[250,420]){const b=mesh(new THREE.CylinderGeometry(150*(1-(y-15)/700)-1,150*(1-(y+55)/700)-1,70,32,1,true),white);b.position.y=y+35;b.scale.setScalar(1.02);c.add(b);}c.position.set(x,G,z);c.name='Leitkegel';this.group.add(c);}
  }
  this.truck=buildTruck(spec);this.group.add(this.truck.group);
  // Electric chain hoist under the boom tip (photo): orange housing, grey
  // motor, chain bag, pendant control; load chain down to an orange hook.
  const orange=new THREE.MeshStandardMaterial({color:'#e8641c',roughness:.45,metalness:.2}),grey=new THREE.MeshStandardMaterial({color:'#c9c4b6',roughness:.5}),bag=new THREE.MeshStandardMaterial({color:'#6f7478',roughness:.95});
  this.hoist=new THREE.Group();this.hoist.name='Elektrokettenzug';
  const hb=mesh(new THREE.BoxGeometry(170,200,150),orange);hb.position.y=-120;this.hoist.add(hb);
  const motor=mesh(new THREE.CylinderGeometry(58,58,190,20),grey);motor.rotation.z=Math.PI/2;motor.position.set(-150,-90,0);this.hoist.add(motor);
  const sack=mesh(new THREE.CylinderGeometry(70,55,220,16),bag);sack.position.set(90,-300,0);this.hoist.add(sack);
  const susp=mesh(new THREE.TorusGeometry(22,6,8,16),orange);susp.position.y=-10;this.hoist.add(susp);this.group.add(this.hoist);
  this.pendant=mesh(new THREE.BoxGeometry(60,170,50),new THREE.MeshStandardMaterial({color:'#f2b705',roughness:.5}));this.pendant.name='Handtaster';this.group.add(this.pendant);
  this.pendantCable=mesh(new THREE.BufferGeometry(),new THREE.MeshStandardMaterial({color:'#222',roughness:.6}));this.group.add(this.pendantCable);
  this.chainMat=new THREE.MeshStandardMaterial({color:'#8d9296',metalness:.85,roughness:.35});
  this.chain=new THREE.InstancedMesh(new THREE.TorusGeometry(9,3,6,12),this.chainMat,400);this.chain.name='Lastkette';this.chain.frustumCulled=false;this.group.add(this.chain);
  this.rope=this.chain;
  this.hook=new THREE.Group();{const hk=mesh(new THREE.TorusGeometry(30,9,8,20,Math.PI*1.45),orange);hk.rotation.z=Math.PI*.8;this.hook.add(hk);const blk=mesh(new THREE.BoxGeometry(56,70,40),orange);blk.position.y=55;this.hook.add(blk);}this.group.add(this.hook);
  // Lifting yoke (photo): black square tube from the hook, silver cross bar and
  // two side straps with round pin heads that sit in the robot's side slots.
  this.yoke=new THREE.Group();this.yoke.name='Hebebügel';{const silver=new THREE.MeshStandardMaterial({color:'#c3c8cb',metalness:.85,roughness:.25}),blk=new THREE.MeshStandardMaterial({color:'#1a1d20',metalness:.3,roughness:.5}),w=78;
   for(const sgn of[-1,1]){const leg=mesh(new THREE.BoxGeometry(34,230,7),silver);leg.position.set(0,115,sgn*w);this.yoke.add(leg);const pinH=mesh(new THREE.CylinderGeometry(13,13,16,20),silver);pinH.rotation.x=Math.PI/2;pinH.position.set(0,0,sgn*(w-9));this.yoke.add(pinH);}
   const bar=mesh(new THREE.BoxGeometry(40,26,2*w+8),silver);bar.position.y=230;this.yoke.add(bar);
   const tubeY=mesh(new THREE.BoxGeometry(46,300,46),blk);tubeY.position.y=390;this.yoke.add(tubeY);
   const eyeR=mesh(new THREE.TorusGeometry(20,6,8,16),silver);eyeR.position.y=560;this.yoke.add(eyeR);}
  this.group.add(this.yoke);this.yokeTop=spec.yokeTop;
  this.cableMat=new THREE.MeshStandardMaterial({color:'#15191c',roughness:.5});this.cable=mesh(new THREE.BufferGeometry(),this.cableMat);this.cable.name='Roboterkabel';this.cable.castShadow=false;this.group.add(this.cable);
  // Cable roller on the rim towards the truck.
  this.roller=V(-120,G+70,spec.zc-spec.ro+40);
  {const r=mesh(new THREE.CylinderGeometry(55,55,160,20),new THREE.MeshStandardMaterial({color:'#e7b416',roughness:.4}));r.rotation.z=Math.PI/2;r.position.copy(this.roller);r.name='Kabelumlenkrolle';this.group.add(r);}
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
 update({hook,yoke=0,rope,plugTip,plugDir,clock=0}){
  const s=this.spec;
  if(this.flowNormal)this.flowNormal.offset.set(-clock*280/420,.05*Math.sin(clock*.7));
  // Crane tip follows the hook while loaded; returns over the tail lift after release.
  // The yoke hangs plumb from its pins; the hook sits on top of it.
  // Yoke turns about its pins (it rests on the robot top at the stop angle).
  this.yoke.position.copy(hook);this.yoke.rotation.set(0,0,yoke);hook=hook.clone().add(V(-this.yokeTop*Math.sin(yoke),this.yokeTop*Math.cos(yoke),0));
  const want=rope>.999?hook.clone():hook.clone().lerp(this.truck.rest,1-rope);
  const tip=this.truck.pose(want);
  const hookPos=rope>.999?hook.clone():hook.clone().lerp(tip.clone().add(V(0,-600,0)),1-rope);
  this.hoist.position.copy(tip);
  const top=tip.clone().add(V(0,-220,0)),bottom=hookPos.clone().add(V(0,100,0)),d=bottom.clone().sub(top),len=d.length(),m=new THREE.Matrix4(),q=new THREE.Quaternion(),dir=d.clone().normalize();
  const n=Math.min(this.chain.count,Math.floor(len/15));
  for(let i=0;i<this.chain.count;i++){if(i<n){q.setFromUnitVectors(V(0,1,0),dir);if(i%2)q.multiply(new THREE.Quaternion().setFromAxisAngle(V(0,1,0),Math.PI/2));m.compose(top.clone().addScaledVector(dir,(i+.5)*len/n),q,V(1,1.45,1));}else m.makeScale(0,0,0);this.chain.setMatrixAt(i,m);}
  this.chain.instanceMatrix.needsUpdate=true;
  this.hook.position.copy(hookPos).add(V(0,20,0));if(rope<.999){this.yoke.rotation.set(0,0,0);this.yoke.position.copy(hookPos).add(V(0,-this.yokeTop,0));}
  const pend=tip.clone().add(V(160,-1500,60));this.pendant.position.copy(pend);
  this.pendantCable.geometry.dispose();this.pendantCable.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([tip.clone().add(V(60,-200,40)),tip.clone().add(V(150,-800,70)),pend.clone().add(V(0,85,0))]),16,4,6,false);
  // Cable: straight out of the cable bomb, up the shaft clear of wall and
  // irons, over the rim roller, up to the tail lift and to the drum inside.
  const P=s.platform,edge=V(-120,P.y+22,P.z1-10),pts=[plugTip.clone(),plugTip.clone().addScaledVector(plugDir,140)];
  if(plugTip.y>s.G+150)pts.push(edge.clone().setZ(P.z1-400),this.truck.drumTop.clone());
  else{
   if(pts[1].x>s.Rm-60&&pts[1].y<s.Rp)pts.push(V(Math.min(pts[1].x-300,s.Rm+200),-s.Rp+40,0),V(s.Rm-260,-s.Rp+60,0));
   const last=pts.at(-1);
   if(last.y<s.G-500)pts.push(V(last.x,Math.max(last.y+350,Math.min(s.coneBottom-150,last.y+900)),last.z*.6),V(this.roller.x*.5,s.G-420,s.zc+(this.roller.z-s.zc)*.4));
   pts.push(this.roller.clone().add(V(0,45,0)),this.roller.clone().lerp(edge,.5).add(V(0,-80,0)),edge,this.truck.drumTop.clone());
  }
  const samples=new THREE.CatmullRomCurve3(pts,false,'centripetal').getSpacedPoints(260).map(p=>this.clampCable(p));
  this.cable.geometry.dispose();this.cable.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(samples,false,'centripetal'),320,7,8,false);
  this.cablePoints=samples;
 }
 dispose(){const mats=new Set(),tex=new Set();this.group.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of[o.material].flat())mats.add(m);}});for(const m of mats){for(const k of['map','bumpMap','roughnessMap','normalMap'])if(m[k])tex.add(m[k]);m.dispose();}tex.forEach(t=>t.dispose());}
}
