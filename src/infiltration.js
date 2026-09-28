import * as THREE from 'three';
// Additional infiltration details: water films running down the old pipe wall,
// pressurised jets from cracks, washed-in soil grains. Everything is an
// illustrative, deterministic depiction driven by the real-seconds clock, not a
// flow simulation. Rates and jet speeds are display parameters.
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2,G=9810;
const wrap=(x,m)=>((x%m)+m)%m;
function surfacePoint(R,x,arc,depth=0){return V(x,(R+depth)*Math.cos(arc/R),(R+depth)*Math.sin(arc/R));}

// drip: slow single drops. flow: default, drops plus threads, wall films and
// washed-in fines. pressure: groundwater under head, additional crack jets.
export const infiltrationLevels={
 drip:{label:'Tropfend',radius:.8,interval:1.8,films:0,jets:0,grains:0,plume:.3,thread:false},
 flow:{label:'Rinnend',radius:1,interval:1,films:4,jets:0,grains:3,plume:.7,thread:true},
 pressure:{label:'Drückendes Grundwasser',radius:1.25,interval:.6,films:6,jets:3,grains:4,plume:1,thread:true},
 // After the site photo: thick sheets pouring down the wall, a falling curtain
 // from the crown, turbulent streaks and foam.
 burst:{label:'Starker Wassereinbruch',radius:2.6,interval:.12,films:6,filmWidth:7,jets:2,grains:6,plume:1.8,thread:true,curtain:true,streak:1}
};
export function levelSpec(level){return infiltrationLevels[level]||infiltrationLevels.flow;}

// Water sheet on the pipe wall: travelling pulses along the run, bright glints.
function filmMaterial(uniforms){
 const m=new THREE.MeshPhysicalMaterial({color:'#5d5648',transparent:true,opacity:1,roughness:.03,metalness:0,clearcoat:1,clearcoatRoughness:.02,envMapIntensity:1.4,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-6});
 m.onBeforeCompile=sh=>{
  Object.assign(sh.uniforms,uniforms);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 aRun;varying vec2 vRun;').replace('#include <begin_vertex>','#include <begin_vertex>\nvRun=aRun;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uTime,uActivity,uStrong;varying vec2 vRun;')
   .replace('#include <color_fragment>',`#include <color_fragment>
 float across=1.-vRun.x*vRun.x,sp=1.+uStrong*2.2,s1=fract(vRun.y/34.-uTime*5.2*sp),s2=fract(vRun.y/21.+.37-uTime*7.1*sp);
 float lanes=uStrong*(.5+.5*sin(vRun.x*23.+sin(vRun.y*.05-uTime*9.)*2.)),foamy=uStrong*smoothstep(.55,1.,fract(vRun.y/57.-uTime*11.+vRun.x*1.7));
 float pulse=smoothstep(0.,.12,s1)*(1.-smoothstep(.3,1.,s1)),bead=smoothstep(0.,.08,s2)*(1.-smoothstep(.18,.5,s2));
 diffuseColor.a=uActivity*(.2+.3*pulse*across+.2*bead*across*across+.35*lanes*across+.3*foamy)*smoothstep(1.,.55,abs(vRun.x));
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.86,.87,.83),clamp(foamy*.8+lanes*.25,0.,.9));`)
   .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(.22,.22,.2)*uActivity*(pulse*across*across+.8*bead*across);');
 };
 m.customProgramCacheKey=()=>'kanaltec-wall-film';
 return m;
}

export class InfiltrationExtras{
 constructor(R,{contour,level,cutPlane,cracks=[]}){
  this.R=R;this.spec=levelSpec(level);this.level=level in infiltrationLevels?level:'flow';this.cutPlane=cutPlane;
  this.group=new THREE.Group();this.group.name='Infiltration · Wandläufe, Strahlen, Bodenkörner';
  this.uniforms={uTime:{value:0},uActivity:{value:1},uStrong:{value:this.spec.streak||0}};
  this.filmMaterial=filmMaterial(this.uniforms);
  this.wetMaterial=new THREE.MeshPhysicalMaterial({color:'#170e08',transparent:true,opacity:.5,roughness:.1,clearcoat:1,clearcoatRoughness:.06,envMapIntensity:1.4,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
  this.films=new THREE.Group();this.wet=new THREE.Group();this.group.add(this.wet,this.films);
  // Films start at the lateral flanks of the breakout, where the wall is
  // already inclined and the water clings instead of dropping.
  const starts=[1.36,1.78,4.52,4.93,1.18,5.12].slice(0,this.spec.films);
  this.filmRuns=[];
  starts.forEach((a,i)=>{
   const [x0,arc0]=contour(a),side=arc0<0?-1:1,end=side*R*Math.acos(-.84),drift=(i%2?1:-1)*(8+5*i);
   const path=u=>{const arc=THREE.MathUtils.lerp(arc0,end,u);return[x0+drift*u*u+4*Math.sin(u*9+i)+2*Math.sin(u*23+i*2),arc];};
   const ribbon=(width,depth)=>{
    const pos=[],run=[],idx=[],n=90;let length=0,prev=null;
    for(let j=0;j<=n;j++){
     const u=j/n,[x,arc]=path(u),c=surfacePoint(R,x,arc,depth);if(prev)length+=c.distanceTo(prev);prev=c;
     const w=width*(.45+.55*Math.min(1,u*5))*(1+.3*Math.sin(u*17+i));
     for(const s of[-1,1]){pos.push(...surfacePoint(R,x+s*w,arc,depth).toArray());run.push(s,length);}
     if(j<n){const k=j*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('aRun',new THREE.Float32BufferAttribute(run,2));g.setAttribute('uv',new THREE.Float32BufferAttribute(run.map((v,k)=>k%2?v/100:v),2));g.setIndex(idx);g.computeVertexNormals();return g;
   };
   const fw=this.spec.filmWidth||1,film=new THREE.Mesh(ribbon((3.2+1.4*(i%3))*fw,-.45-(fw>1?2.2:0)),this.filmMaterial),wet=new THREE.Mesh(ribbon((7+2.5*(i%2))*Math.max(1,fw*.9),-.2),this.wetMaterial);
   for(const o of[film,wet]){o.castShadow=o.receiveShadow=false;o.renderOrder=2;}
   this.films.add(film);this.wet.add(wet);this.filmRuns.push({film,wet,side});
  });
  // Pressurised jets from crack lines; each is recomputed against the shield.
  this.jetMaterial=new THREE.MeshPhysicalMaterial({color:'#c4c2b1',transparent:true,opacity:.5,roughness:.03,metalness:0,ior:1.33,clearcoat:1,envMapIntensity:1.3,depthWrite:false,side:THREE.DoubleSide});
  this.dropletMaterial=this.jetMaterial.clone();this.dropletMaterial.opacity=.6;
  this.jets=[];
  const jetCracks=[[1.42,.55,1900],[4.9,.6,2300],[2.8,.45,1500]].slice(0,this.spec.jets);
  const drop=new THREE.SphereGeometry(1,8,6);
  for(const [a,k,speed] of jetCracks){
   const [x,s]=contour(a),origin=surfacePoint(R,x+Math.cos(a)*k*54,s+Math.sin(a)*k*34,-.4);
   const inward=V(0,-origin.y,-origin.z).normalize(),dir=inward.clone().multiplyScalar(.9).add(V(Math.cos(a)*.35,0,0)).add(V(0,-.15,0)).normalize();
   const mesh=new THREE.Mesh(new THREE.BufferGeometry(),this.jetMaterial);mesh.castShadow=mesh.receiveShadow=false;
   const droplets=new THREE.InstancedMesh(drop,this.dropletMaterial,18),splash=new THREE.InstancedMesh(drop,this.dropletMaterial,10);
   for(const o of[droplets,splash]){o.frustumCulled=false;o.castShadow=o.receiveShadow=false;}
   this.group.add(mesh,droplets,splash);this.jets.push({origin,velocity:dir.multiplyScalar(speed),mesh,droplets,splash,points:[],hit:null});
  }
  // Soil fines washed out of the cavity fall with the drops.
  this.grainMaterial=new THREE.MeshStandardMaterial({color:'#4a3322',roughness:.95});
  this.grainCount=this.spec.grains;
  this.grains=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),this.grainMaterial,Math.max(1,this.grainCount*7));this.grains.frustumCulled=false;this.grains.castShadow=false;this.group.add(this.grains);
  // Continuous threads under strong streams; they break into drops lower down.
  this.threadGeometry=new THREE.CylinderGeometry(.55,1,1,10,6,true);this.threadGeometry.translate(0,-.5,0);
  this.threads=[];
  // Falling curtain out of the crown breakout (strong inflow only).
  if(this.spec.curtain){
   this.curtainMat=new THREE.MeshPhysicalMaterial({color:'#bdbcad',transparent:true,roughness:.05,clearcoat:1,envMapIntensity:1.3,depthWrite:false,side:THREE.DoubleSide});
   this.curtainMat.onBeforeCompile=sh=>{sh.uniforms.uTime=this.uniforms.uTime;sh.uniforms.uActivity=this.uniforms.uActivity;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vCur;').replace('#include <begin_vertex>','#include <begin_vertex>\nvCur=uv;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uTime,uActivity;varying vec2 vCur;').replace('#include <color_fragment>','#include <color_fragment>\n float fall=fract((1.-vCur.y)*5.-uTime*4.2+sin(vCur.x*6.283*4.)*.15),lane=.5+.5*sin(vCur.x*6.283*7.+uTime*3.);\n diffuseColor.a=uActivity*(.35+.35*smoothstep(.5,1.,fall)+.2*lane)*smoothstep(0.,.08,vCur.y);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.93,.93,.9),.5*smoothstep(.75,1.,fall)+.2*(1.-vCur.y));');};
   this.curtainMat.customProgramCacheKey=()=>'kanaltec-curtain';
   const g=new THREE.CylinderGeometry(34,46,1,24,24,true);g.translate(0,-.5,0);
   this.curtain=new THREE.Mesh(g,this.curtainMat);this.curtain.name='Wasservorhang aus dem Scheitel';this.curtain.castShadow=this.curtain.receiveShadow=false;this.group.add(this.curtain);
   this.foam=new THREE.Mesh(new THREE.CircleGeometry(1,32),new THREE.MeshStandardMaterial({color:'#e8e8e2',transparent:true,opacity:.7,roughness:.6,depthWrite:false}));this.foam.rotation.x=-Math.PI/2;this.foam.name='Schaum';this.group.add(this.foam);
  }
  this.matrix=new THREE.Matrix4();this.q=new THREE.Quaternion();
 }
 addThreads(streams){
  if(!this.spec.thread)return;
  streams.forEach((s,i)=>{if(s.interval>=.3)return;const o=new THREE.Mesh(this.threadGeometry,this.jetMaterial);o.castShadow=o.receiveShadow=false;this.group.add(o);this.threads.push({o,stream:i});});
 }
 setCut(cut){for(const m of[this.filmMaterial,this.wetMaterial])m.clippingPlanes=cut?[this.cutPlane]:null;}
 // shield: {x,lift,seal,press} or null. The jet stops where it meets the outer
 // shield surface (including when the shield only passes underneath).
 trace(jet,shield,floorAt){
  const R=this.R,points=[],p=V(),v=jet.velocity;let hit=null;
  for(let i=0;i<=500;i++){
   const t=i*.002;p.copy(jet.origin).addScaledVector(v,t);p.y-=.5*G*t*t;
   if(shield&&i>0){
    const outer=R-10+3*(shield.seal||0)+1.5,dy=p.y-shield.lift,ang=Math.atan2(p.z,dy);
    if(Math.abs(p.x-shield.x)<=250&&Math.abs(ang)<=1.13&&Math.hypot(dy,p.z)<=outer){const n=V(0,dy,p.z).normalize();hit={point:V(p.x,shield.lift+outer*Math.cos(ang),outer*Math.sin(ang)),normal:n,t};points.push(hit.point.clone());break;}
   }
   if(i>3&&(Math.hypot(p.y,p.z)>=R-.3||p.y<=floorAt(p.z))){const floor=floorAt(p.z);hit={point:V(p.x,Math.max(p.y,floor),p.z),normal:V(0,1,0),t};points.push(hit.point.clone());break;}
   if(i%4===0)points.push(p.clone());
  }
  jet.points=points;jet.hit=hit;jet.duration=hit?hit.t:1;
  const curve=new THREE.CatmullRomCurve3(points.length>1?points:[jet.origin,jet.origin.clone().add(V(0,-1,0))]);jet.curve=curve;
  // The intact part of the jet: about 60 % of the flight, then droplets.
  const g=new THREE.TubeGeometry(curve,Math.max(8,points.length),1,8,false),a=g.attributes.position,seg=Math.max(8,points.length);
  for(let j=0;j<=seg;j++){const u=j/seg,c=curve.getPointAt(u),w=u<.6?1.05-.5*u:Math.max(0,(.75-u)*5);for(let k=0;k<=8;k++){const n=j*9+k;a.setXYZ(n,c.x+(a.getX(n)-c.x)*w,c.y+(a.getY(n)-c.y)*w,c.z+(a.getZ(n)-c.z)*w);}}
  g.computeVertexNormals();jet.mesh.geometry.dispose();jet.mesh.geometry=g;
 }
 update({clock,activity,runoff,shield,floorAt,poseChanged,streams,fallOf,dripping,infiltration}){
  this.uniforms.uTime.value=clock;
  const flowing=activity*runoff;this.uniforms.uActivity.value=flowing;
  this.films.visible=flowing>.01;this.wet.visible=infiltration&&activity>.001;this.wetMaterial.opacity=.5*Math.max(.35,activity);
  if(poseChanged)for(const j of this.jets)this.trace(j,shield,floorAt);
  const jetOn=flowing>.05;
  for(const [n,j] of this.jets.entries()){
   j.mesh.visible=jetOn;j.droplets.visible=j.splash.visible=jetOn;if(!jetOn)continue;
   const T=j.duration,pulse=1+.12*Math.sin(clock*9+n*2)+.06*Math.sin(clock*23+n);
   for(let i=0;i<j.droplets.count;i++){
    const t=THREE.MathUtils.lerp(.55,1,wrap(clock*1.7+i/j.droplets.count+n*.3,1))*T,p=j.curve.getPointAt(Math.min(1,t/T)),r=(.5+.45*((i*7+n)%5)/4)*pulse;
    this.matrix.compose(p,this.q.identity(),V(r,r*1.4,r));j.droplets.setMatrixAt(i,this.matrix);
   }
   j.droplets.instanceMatrix.needsUpdate=true;
   const hit=j.hit;
   for(let i=0;i<j.splash.count;i++){
    if(!hit){this.matrix.makeScale(0,0,0);j.splash.setMatrixAt(i,this.matrix);continue;}
    const tau=wrap(clock-i*.023-n*.11,.22),a=i/j.splash.count*TAU+n,side=V(Math.cos(a),0,Math.sin(a)).projectOnPlane(hit.normal).normalize(),speed=380+260*((i*5+n)%4)/3;
    const p=hit.point.clone().addScaledVector(side,speed*tau).addScaledVector(hit.normal,(330+120*(i%3))*tau);p.y-=.5*G*tau*tau;const r=.35+.25*(i%3);
    this.matrix.compose(p,this.q.identity(),V(r,r,r));j.splash.setMatrixAt(i,this.matrix);
   }
   j.splash.instanceMatrix.needsUpdate=true;
  }
  this.jetMaterial.opacity=.5*flowing;this.dropletMaterial.opacity=.6*flowing;
  // Grains and threads below the drip lips.
  let k=0;
  if(this.grainCount&&dripping)streams.forEach((s,i)=>{
   const {p,T}=fallOf(s);
   for(let j=0;j<this.grainCount&&k<this.grains.count;j++,k++){
    const cycle=1.1+.37*j,age=wrap(clock-j*.29-i*.17,cycle);
    if(age>=T){this.matrix.makeScale(0,0,0);this.grains.setMatrixAt(k,this.matrix);continue;}
    const r=.45+.35*((i+j)%3)/2;
    this.matrix.compose(V(p.x+.8*Math.sin(j*2.3+i),p.y-.5*G*age*age,p.z+.8*Math.cos(j*1.9+i)),this.q.setFromAxisAngle(V(1,1,0).normalize(),age*20+j),V(r,r,r));this.grains.setMatrixAt(k,this.matrix);
   }
  });
  for(;k<this.grains.count;k++){this.matrix.makeScale(0,0,0);this.grains.setMatrixAt(k,this.matrix);}
  this.grains.instanceMatrix.needsUpdate=true;this.grains.visible=dripping&&this.grainCount>0;
  if(this.curtain){
   const R=this.R,top=R-6,covered=shield&&Math.abs(shield.x)<250,bottom=covered?shield.lift+R-10+3*(shield.seal||0)+3:floorAt(0);
   this.curtain.visible=this.foam.visible=flowing>.03;
   this.curtain.position.set(4*Math.sin(clock*7),top,0);this.curtain.scale.set(1+.08*Math.sin(clock*9),Math.max(1,top-bottom),1+.06*Math.cos(clock*11));
   this.foam.position.set(0,bottom+.8,0);this.foam.scale.setScalar(70+18*Math.sin(clock*8));this.foam.material.opacity=.6*flowing;
  }
  for(const t of this.threads){
   const s=streams[t.stream],{p,drop}=fallOf(s),len=Math.min(drop*.42,95)*(.85+.15*Math.sin(clock*13+t.stream)),r=Math.max(.35,s.radius*.62);
   t.o.visible=dripping;t.o.position.copy(p).add(V(.25*Math.sin(clock*17+t.stream),0,.25*Math.cos(clock*11)));t.o.scale.set(r,len,r);
  }
 }
}
