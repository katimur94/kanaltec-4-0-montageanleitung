import * as THREE from 'three';
import {surfaceTextures} from './repair-surface.js';
// Insertion through a manhole. Reconstructed from the site photo (unit lying in
// front of the open manhole, shield cantilevered over the opening) and the
// hinge on PDF p. 10. Shaft sizes, lowering device, rope and cable routing are
// illustrative assumptions, not a manufacturer procedure.
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const lerp=THREE.MathUtils.lerp;

export const insertionStages=[
 {title:'Am Schacht bereitstellen',text:'Roboter und angekuppelte Schalung liegen in Richtung des Zielrohrs vor dem geöffneten Schacht, Bumper vakuumiert, Schalung in Fahrstellung. Die Schalung ragt frei über die Öffnung: Die Klappvorrichtung sperrt das Abknicken nach unten, weil der bewegliche Schenkel (Pos. 9) am Grundkörper der Klappvorrichtung anliegt.',caption:'Wie auf dem Baustellenfoto: Einheit liegt gerade, Schalung vorn über der Schachtöffnung.'},
 {title:'Ankippen und einführen',text:'Das Seil der Absenkvorrichtung wird am Roboterheck eingehängt. Die Einheit kippt mit der Schalung voraus über die Schachtkante. Schild und CutterCam zeigen dabei zur Seite des Zielrohrs. Diese Ausrichtung entscheidet: Nur in diese Richtung kann die Klappvorrichtung später nachgeben.',caption:'Klappvorrichtung gesperrt · Einheit bleibt starr'},
 {title:'Senkrecht absenken',text:'Die Einheit hängt senkrecht am Seil, die Schalung voraus. Das Gewicht wirkt in Längsrichtung, die zwei Federn halten die Klappvorrichtung geschlossen. Unterhalb des Konus pendelt die Einheit zur Schachtmitte über das Gerinne.',caption:'Seil am Roboterheck · Kabel läuft über die Schachtkante nach'},
 {title:'Aufsetzen und einklappen',text:'Das Rad DN 70 an der Einbauhilfe (Pos. 4/6) setzt im Gerinne auf und rollt in das Rohr. Die Klappvorrichtung öffnet um den Gelenkbolzen gegen die zwei Federn: Die Schalung legt sich in die Rohrachse, während der Roboter noch senkrecht im Schacht hängt.',caption:'Klappwinkel wächst bis 90° · Federn gespannt'},
 {title:'Roboter nachführen',text:'Die Einheit wird weiter abgelassen und in das Rohr geschoben. Der Roboter neigt sich mit dem Heck an der gegenüberliegenden Schachtwand, bis seine Räder im Gerinne stehen. Die Federn ziehen die Klappvorrichtung dabei wieder in die gestreckte Lage.',caption:'Klappwinkel geht auf 0° zurück · Heck an der Schachtwand'},
 {title:'Seil lösen und einfahren',text:'Der Haken wird ausgehängt. Der Roboter fährt die Schalung im Gerinne bis in das Rohr; Kabel und Versorgungsleitungen werden über die Schachtkante nachgeführt. Im Rohr beginnt der Ablauf unter „So funktioniert’s“.',caption:'Übergang zur Anfahrt der Schadstelle'}
];

export function manholeSpec(dn){
 const Rp=dn/2,t=18+dn*.04,Rm=dn>=600?600:500,wall=Rm>=600?135:120,ro=Rm>=600?400:312.5;
 const invert=-Rp,G=invert+2500,top=G-230,coneTop=top,coneBottom=Rm>=600?top-200:top-620;
 return {dn,Rp,t,Rm,wall,ro,xc:-(Rm-ro),rimX:-Rm,G,top,coneTop,coneBottom,cone:Rm<600,base:invert-260,apex:V(-(Rm-ro),G+2150,0)};
}
// Horizontal centre and inner radius of the shaft at height y.
export function shaftProfile(spec,y){
 if(y<=spec.coneBottom)return{cx:0,r:spec.Rm};
 if(y>=spec.coneTop)return{cx:spec.xc,r:spec.ro};
 if(!spec.cone)return{cx:spec.xc,r:spec.ro};
 const k=(y-spec.coneBottom)/(spec.coneTop-spec.coneBottom);return{cx:lerp(0,spec.xc,k),r:lerp(spec.Rm,spec.ro,k)};
}
// Channel (Gerinne) floor and bench: invert matches the pipe; bench at axis height.
export function floorAt(spec,x,z){return Math.abs(z)<spec.Rp?-Math.sqrt(spec.Rp**2-z*z):0;}

const rot=(p,a)=>{const c=Math.cos(a),s=Math.sin(a);return V(p.x*c-p.y*s,p.x*s+p.y*c,p.z);};
// geo: {pin, formPts, robotPts, yb, hook, spec}. Returns the two rigid frames
// (formwork side, robot side) as rotation about z and world pin position. The
// hinge may only open with the shield nose up relative to the robot.
export function insertionKinematics(time,geo){
 const {spec,pin,formPts,robotPts,yb}=geo,T=clamp(time,0,insertionStages.length-.001),stage=Math.floor(T),f=T-stage;
 const E=V(spec.rimX,spec.G+2,0),c0=344-1.5*spec.ro,c1=-600;
 const contact=(pts,theta,wx=0)=>{let y=-Infinity;for(const p of pts){const q=rot(V(p.x-pin.x,p.y-pin.y,p.z),theta);y=Math.max(y,floorAt(spec,wx+q.x,p.z)-q.y);}return y;};
 const tip=phi=>{const theta=-phi,c=lerp(c0,c1,smooth((phi/(Math.PI/2)-.56)/.44)),q=rot(V(c-pin.x,yb-pin.y,0),theta);return{theta,W:E.clone().sub(q)};};
 const hangX=-80,down=-Math.PI/2,rest=pin.y-contact(formPts,0),lie=(theta,wx)=>contact(formPts,theta,wx)+rest*smooth(1+theta/(Math.PI/2)*2);
 const W3=()=>V(hangX,lie(down,hangX),0);
 // Clearance of the robot to the round shaft wall behind it (circle at each z).
 const rearGap=theta=>{let m=Infinity;for(const p of robotPts){const q=rot(V(p.x-pin.x,p.y-pin.y,p.z),theta);m=Math.min(m,q.x+Math.sqrt(Math.max(0,spec.Rm**2-p.z*p.z)));}return m;};
 const xEnd=Math.max(hangX,22-rearGap(0));
 let thetaF=0,thetaR=0,W,drive=0,rope=1;
 if(stage===0){({W}=tip(0));}
 else if(stage===1){const r=tip(smooth(f)*Math.PI/2);thetaF=thetaR=r.theta;W=r.W;}
 else if(stage===2){
  const start=tip(Math.PI/2).W,end=W3(),k=smooth(f);thetaF=thetaR=down;
  W=V(lerp(start.x,end.x,smooth((f-.35)/.5)),lerp(start.y,end.y,k),0);
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
 return{stage,f,thetaF,thetaR,W,drive,rope,hinge:thetaF-thetaR};
}
export function frameMatrix(theta,W,pin){return new THREE.Matrix4().makeTranslation(W.x,W.y,W.z).multiply(new THREE.Matrix4().makeRotationZ(theta)).multiply(new THREE.Matrix4().makeTranslation(-pin.x,-pin.y,-pin.z));}

function asphaltTexture(){
 const size=256,a=new Uint8Array(size*size*4);let s=91;
 for(let i=0;i<size*size;i++){s=(Math.imul(s,1664525)+1013904223)>>>0;const n=s/4294967296,stone=n>.93?38:n<.05?-18:0,c=58+Math.round(n*26)+stone;a.set([c,c,c+2,255],i*4);}
 const t=new THREE.DataTexture(a,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
}
function mesh(g,m){const o=new THREE.Mesh(g,m);o.castShadow=o.receiveShadow=true;return o;}
function build(pos,idx,uv){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));if(uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
// Shaft wall as a surface of revolution around a moving centre, with exact
// circular openings where the pipes pass through (axis at y = 0).
function shaftWall(spec,y0,y1,offset,openings,rows=1,n=256){
 const pos=[],uv=[],idx=[];
 const push=(p,u,v)=>{pos.push(p.x,p.y,p.z);uv.push(u,v);return pos.length/3-1;};
 const at=(th,y)=>{const {cx,r}=shaftProfile(spec,y),rr=r+offset;return V(cx+rr*Math.cos(th),y,rr*Math.sin(th));};
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
 return build(pos,idx,uv);
}
function capShape(points){const s=new THREE.Shape(points.map(p=>new THREE.Vector2(p[0],p[1])));return new THREE.ShapeGeometry(s);}

export class ManholeScene{
 constructor(dn,cutPlane){
  const spec=this.spec=manholeSpec(dn),{Rp,t,Rm,wall,G}=spec;this.cutPlane=cutPlane;
  this.group=new THREE.Group();this.group.name='Schacht mit Gerinne';
  const mortar=surfaceTextures('mortar'),soil=surfaceTextures('soil'),pipeTex=surfaceTextures('pipe');
  for(const t of Object.values(mortar))t.repeat.set(1.4,1.4);
  this.concrete=new THREE.MeshStandardMaterial({color:'#8d8c86',...mortar,bumpScale:1.2,roughness:.95,side:THREE.DoubleSide});
  this.channelMat=new THREE.MeshStandardMaterial({color:'#6e6b62',...mortar,bumpScale:.6,roughness:.7,side:THREE.DoubleSide});
  this.soilMat=new THREE.MeshStandardMaterial({color:'#7a6048',...soil,bumpScale:2,roughness:1,side:THREE.DoubleSide});
  this.pipeMat=new THREE.MeshStandardMaterial({color:'#8a5236',...pipeTex,bumpScale:.12,roughness:.8,side:THREE.DoubleSide});
  const asphalt=asphaltTexture();asphalt.repeat.set(12,12);
  this.asphaltMat=new THREE.MeshStandardMaterial({color:'#9a9a9a',map:asphalt,bumpMap:asphalt,bumpScale:2,roughness:.92,side:THREE.DoubleSide});
  this.capConcrete=new THREE.MeshStandardMaterial({color:'#9b9a93',...surfaceTextures('mortar'),roughness:1});
  this.capSoil=new THREE.MeshStandardMaterial({color:'#6d543e',...surfaceTextures('soil'),bumpScale:1,roughness:1});
  this.capPipe=new THREE.MeshStandardMaterial({color:'#7a4a31',roughness:1});
  this.capAsphalt=new THREE.MeshStandardMaterial({color:'#303234',roughness:1});
  this.iron=new THREE.MeshStandardMaterial({color:'#2d3033',metalness:.7,roughness:.55});
  this.cut=[this.concrete,this.channelMat,this.soilMat,this.pipeMat,this.asphaltMat];
  const add=(g,m,name)=>{const o=mesh(g,m);if(name)o.name=name;this.group.add(o);return o;};
  // Shaft rings with pipe openings, cone (DN 1000) or cover slab (DN 1200), adjusting rings.
  const y0=spec.base+60;
  add(shaftWall(spec,y0,spec.coneBottom,0,[1,-1],1),this.concrete,'Schachtringe');add(shaftWall(spec,y0,spec.coneBottom,wall,[1,-1],1),this.concrete);
  add(shaftWall(spec,spec.coneBottom,spec.coneTop,0,[],6),this.concrete,spec.cone?'Schachthals (Konus, exzentrisch)':'Abdeckplatte');
  add(shaftWall(spec,spec.coneBottom,spec.coneTop,wall,[],6),this.concrete);
  add(shaftWall(spec,spec.coneTop,G-110,0,[],1),this.concrete,'Auflageringe');add(shaftWall(spec,spec.coneTop,G-110,wall,[],1),this.concrete);
  if(!spec.cone)for(const y of[spec.coneBottom,spec.coneTop]){const sh=new THREE.Shape();sh.absarc(0,0,Rm+wall,0,TAU,false);const h=new THREE.Path();h.absarc(spec.xc,0,y===spec.coneTop?spec.ro+wall:spec.ro,0,TAU,true);sh.holes.push(h);const g=new THREE.ShapeGeometry(sh,64);g.rotateX(Math.PI/2);g.translate(0,y,0);add(g,this.concrete,'Abdeckplatte');}
  // Floor: bench at axis height and a U-shaped channel continuing the invert.
  {
   const pos=[],idx=[],uv=[],nu=64,nv=48;
   for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const phi=lerp(-Math.PI/2,Math.PI/2,i/nu),z=Rp*Math.sin(phi),y=-Rp*Math.cos(phi),half=Math.sqrt(Rm*Rm-z*z),x=lerp(-half,half,j/nv);pos.push(x,y,z);uv.push(x/400,phi*Rp/400);}
   for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+nu+1;idx.push(a,a+1,b,b,a+1,b+1);}
   add(build(pos,idx,uv),this.channelMat,'Gerinne');
   for(const s of[-1,1]){
    const shape=new THREE.Shape();const pts=[];
    for(let i=0;i<=48;i++){const a=lerp(0,Math.PI,i/48);const zz=Rm*Math.sin(a);if(Math.abs(zz)>=Rp)pts.push([Rm*Math.cos(a),zz]);}
    const edge=Math.sqrt(Rm*Rm-Rp*Rp);pts.unshift([edge,Rp]);pts.push([-edge,Rp]);
    shape.setFromPoints(pts.map(([x,z])=>new THREE.Vector2(x,z)));const g=new THREE.ShapeGeometry(shape,1);
    const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getY(i)*s;p.setXYZ(i,x,6*(Math.abs(z)-Rp)/(Rm-Rp),z);}g.computeVertexNormals();
    add(g,this.channelMat,'Berme');
   }
  }
  // Pipes: target pipe (+x) and outgoing pipe (−x), clay, cut with the view.
  // Pipe ends are cut flush with the curved inner shaft wall.
  const wallX=z=>Math.sqrt(Math.max(0,Rm*Rm-z*z));
  const pipeGeo=(r,sgn,far)=>{const pos=[],idx=[],uv=[],n=96;for(let i=0;i<=n;i++){const a=i/n*TAU,y=r*Math.cos(a),z=r*Math.sin(a);pos.push(sgn*wallX(z),y,z,far,y,z);uv.push(0,a*r/400,Math.abs(far)/400,a*r/400);if(i<n){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}return build(pos,idx,uv);};
  const ringFace=sgn=>{const pos=[],idx=[],n=96;for(let i=0;i<=n;i++){const a=i/n*TAU;for(const r of[Rp,Rp+t]){const y=r*Math.cos(a),z=r*Math.sin(a);pos.push(sgn*wallX(z),y,z);}if(i<n){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}return build(pos,idx);};
  for(const [sgn,far,name] of[[1,3400,'Zielrohr'],[-1,-3000,'Ablaufrohr']]){add(pipeGeo(Rp,sgn,far),this.pipeMat,name);add(pipeGeo(Rp+t,sgn,far),this.pipeMat);add(ringFace(sgn),this.pipeMat);}
  // Base slab below the channel.
  {const g=new THREE.CylinderGeometry(Rm+wall,Rm+wall,y0-spec.base,64,1,false);g.translate(0,(y0+spec.base)/2,0);add(g,this.concrete);}
  // Street with the frame opening, frame, opened cover.
  {
   const s=new THREE.Shape([V(-3000,-2400),V(3400,-2400),V(3400,2400),V(-3000,2400)].map(p=>new THREE.Vector2(p.x,p.y)));const h=new THREE.Path();h.absarc(spec.xc,0,spec.ro+wall,0,TAU,true);s.holes.push(h);
   const g=new THREE.ShapeGeometry(s,48);g.rotateX(Math.PI/2);g.translate(0,G,0);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/4000,uv.getY(i)/4000);
   add(g,this.asphaltMat,'Straße');
   const frame=new THREE.Group();frame.name='Schachtrahmen';
   const f1=new THREE.RingGeometry(spec.ro,spec.ro+wall,96);f1.rotateX(-Math.PI/2);const fo=mesh(f1,this.iron);fo.position.set(spec.xc,G+1,0);frame.add(fo);
   const f2=new THREE.CylinderGeometry(spec.ro,spec.ro,110,96,1,true);const fi=mesh(f2,this.iron);fi.position.set(spec.xc,G-55,0);frame.add(fi);
   const f3=new THREE.CylinderGeometry(spec.ro+wall,spec.ro+wall,110,96,1,true);const fq=mesh(f3,this.iron);fq.position.set(spec.xc,G-55,0);frame.add(fq);
   this.group.add(frame);
   const cover=new THREE.Group();cover.name='Schachtdeckel (abgelegt)';
   const disc=mesh(new THREE.CylinderGeometry(spec.ro-8,spec.ro-8,28,72),this.iron);cover.add(disc);
   for(let i=-5;i<=5;i++){const rib=mesh(new THREE.BoxGeometry(6,4,Math.sqrt(Math.max(0,(spec.ro-30)**2-(i*45)**2))*2),this.iron);rib.position.set(i*45,16,0);cover.add(rib);}
   cover.position.set(spec.xc+950,G+14,-760);this.group.add(cover);
   // Traffic cones.
   const coneMat=new THREE.MeshStandardMaterial({color:'#e2502b',roughness:.6}),white=new THREE.MeshStandardMaterial({color:'#f1f1ea',roughness:.5});
   for(const [x,z] of[[-2300,-1200],[1600,-1500]]){const c=new THREE.Group();c.add(mesh(new THREE.BoxGeometry(380,30,380),new THREE.MeshStandardMaterial({color:'#222',roughness:.9})));const k=mesh(new THREE.ConeGeometry(150,700,32),coneMat);k.position.y=365;c.add(k);for(const y of[250,420]){const b=mesh(new THREE.CylinderGeometry(150*(1-(y-15)/700)-1,150*(1-(y+55)/700)-1,70,32,1,true),white);b.position.y=y+35;b.scale.setScalar(1.02);c.add(b);}c.position.set(x,G,z);this.group.add(c);}
  }
  // Climbing irons on the far half, clear of the unit's path.
  for(let y=spec.coneBottom-300;y>40;y-=280){const th=-2.2,g=new THREE.TorusGeometry(150,11,8,24,Math.PI);const o=mesh(g,new THREE.MeshStandardMaterial({color:'#c96a1c',roughness:.55,metalness:.2}));o.position.set(Rm*Math.cos(th)*.93,y,Rm*Math.sin(th)*.93);o.rotation.set(Math.PI/2,0,-th+Math.PI/2);this.group.add(o);}
  // Lowering device: tripod with winch and rope.
  {
   const tri=new THREE.Group();tri.name='Dreibein mit Seilwinde (Annahme)';const alu=new THREE.MeshStandardMaterial({color:'#b8bec2',metalness:.85,roughness:.3});
   const apex=spec.apex.clone();this.apex=apex.clone().add(V(0,-60,0));
   for(const a of[-Math.PI/2+.25,Math.PI/2+.65,Math.PI*1.12]){const foot=V(spec.xc+1150*Math.cos(a),G,1150*Math.sin(a)),d=apex.clone().sub(foot),leg=mesh(new THREE.CylinderGeometry(22,26,d.length(),16),alu);leg.position.copy(foot).addScaledVector(d,.5);leg.quaternion.setFromUnitVectors(V(0,1,0),d.clone().normalize());tri.add(leg);const shoe=mesh(new THREE.CylinderGeometry(45,55,20,20),this.iron);shoe.position.copy(foot).add(V(0,10,0));tri.add(shoe);}
   const head=mesh(new THREE.CylinderGeometry(70,70,90,24),this.iron);head.position.copy(apex);tri.add(head);
   const pulley=mesh(new THREE.TorusGeometry(46,9,10,32),alu);pulley.position.copy(apex).add(V(0,-80,0));tri.add(pulley);
   const winch=mesh(new THREE.BoxGeometry(170,150,200),new THREE.MeshStandardMaterial({color:'#e0a21b',roughness:.5}));const legDir=V(spec.xc+1150*Math.cos(Math.PI*1.12),G,1150*Math.sin(Math.PI*1.12)).sub(apex);winch.position.copy(apex).addScaledVector(legDir,.62);tri.add(winch);
   this.winch=winch.position.clone();this.group.add(tri);
  }
  this.ropeMat=new THREE.MeshStandardMaterial({color:'#d5c79a',roughness:.8});this.rope=mesh(new THREE.BufferGeometry(),this.ropeMat);this.rope.name='Seil';this.group.add(this.rope);
  this.hook=new THREE.Group();const hk=mesh(new THREE.TorusGeometry(16,4.5,8,20,Math.PI*1.5),this.iron);this.hook.add(hk);this.group.add(this.hook);
  this.cableMat=new THREE.MeshStandardMaterial({color:'#15191c',roughness:.5});this.cable=mesh(new THREE.BufferGeometry(),this.cableMat);this.cable.name='Roboterkabel';this.group.add(this.cable);
  // Section faces in the z = 0 plane (visible with "Rohr aufschneiden").
  this.caps=new THREE.Group();this.group.add(this.caps);
  const capMesh=(pts,m)=>{const o=mesh(capShape(pts),m);o.castShadow=false;this.caps.add(o);return o;};
  const side=(s,offset,y)=>{const {cx,r}=shaftProfile(spec,y);return cx+s*(r+offset);};
  const ys=[];for(let y=spec.coneBottom;y<=spec.coneTop;y+=20)ys.push(y);ys.push(spec.coneTop,G-110);
  const top=Rp+t,bottom=-Rp-t,Xr=3400,Xl=-3000;
  for(const s of[-1,1]){
   const X=s>0?Xr:Xl;
   // Soil beside the shaft, above and below the pipe.
   capMesh([[side(s,wall,top),top],[X,top],[X,G-60],[side(s,wall,G-60),G-60],...ys.slice().reverse().map(y=>[side(s,wall,y),y]),[side(s,wall,spec.coneBottom),spec.coneBottom]],this.capSoil);
   capMesh([[s*(Rm+wall),spec.base-400],[X,spec.base-400],[X,bottom],[s*(Rm+wall),bottom]],this.capSoil);
   capMesh([[X,G-60],[X,G],[side(s,wall,G),G],[side(s,wall,G-60),G-60]],this.capAsphalt);
   // Shaft wall, cone/slab and rings.
   capMesh([[s*Rm,top],[s*(Rm+wall),top],[s*(Rm+wall),spec.coneBottom],...ys.map(y=>[side(s,wall,y),y]),[side(s,wall,G-110),G-110],[side(s,0,G-110),G-110],...ys.slice().reverse().map(y=>[side(s,0,y),y]),[s*Rm,spec.coneBottom]],this.capConcrete);
   capMesh([[s*Rm,spec.base+60],[s*(Rm+wall),spec.base+60],[s*(Rm+wall),bottom],[s*Rm,bottom]],this.capConcrete);
   // Pipe walls.
   const x0=s*Rm;capMesh([[x0,Rp],[X,Rp],[X,top],[x0,top]],this.capPipe);capMesh([[x0,bottom],[X,bottom],[X,-Rp],[x0,-Rp]],this.capPipe);
  }
  if(!spec.cone)for(const sgn of[-1,1]){const o=capMesh([[side(sgn,wall,spec.coneTop),spec.coneBottom],[sgn*(Rm+wall),spec.coneBottom],[sgn*(Rm+wall),spec.coneTop],[side(sgn,wall,spec.coneTop),spec.coneTop]],this.capConcrete);o.userData.front=true;}
  capMesh([[-Rm-wall,spec.base],[Rm+wall,spec.base],[Rm+wall,spec.base+60],[Rm,spec.base+60],[Rm,-Rp],[-Rm,-Rp],[-Rm,spec.base+60],[-Rm-wall,spec.base+60]],this.capConcrete);
  capMesh([[-Rm-wall,spec.base-400],[Rm+wall,spec.base-400],[Rm+wall,spec.base],[-Rm-wall,spec.base]],this.capSoil);
  for(const c of this.caps.children)c.position.z=c.userData.front?.8:.5;
  this.setCut(true);
 }
 setCut(cut){for(const m of this.cut)m.clippingPlanes=cut?[this.cutPlane]:null;this.caps.visible=cut;}
 // hook: world point on the robot rear; rope 0..1 attached; cable: world point.
 update({hook,rope,cable,cableDir}){
  const apex=this.apex;
  const end=rope>0.001?hook:apex.clone().add(V(0,-420,0));
  const hookPos=rope>0.001?hook.clone().lerp(apex.clone().add(V(0,-420,0)),1-rope):end;
  this.rope.geometry.dispose();this.rope.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([apex,apex.clone().lerp(hookPos,.5).add(V(0,0,.1)),hookPos]),8,4,6,false);
  this.hook.position.copy(hookPos).add(V(0,-14,0));
  const s=this.spec,rim=V(s.xc+s.ro+10,s.G+40,0),pts=[cable,cable.clone().addScaledVector(cableDir,160)];
  if(pts[1].y<s.G-400){pts.push(V(Math.max(s.xc,Math.min(pts[1].x,s.xc+s.ro-60)),Math.max(pts[1].y+500,s.coneBottom-200),-40));pts.push(V(s.xc+s.ro-40,s.G-150,-40));}
  pts.push(rim,V(rim.x+500,s.G+18,-120),V(3200,s.G+18,-450));
  this.cable.geometry.dispose();this.cable.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,false,'centripetal'),160,7,8,false);
 }
 dispose(){const mats=new Set(),tex=new Set();this.group.traverse(o=>{if(o.isMesh){o.geometry.dispose();mats.add(o.material);}});for(const m of mats){for(const k of['map','bumpMap','roughnessMap'])if(m[k])tex.add(m[k]);m.dispose();}tex.forEach(t=>t.dispose());}
}
