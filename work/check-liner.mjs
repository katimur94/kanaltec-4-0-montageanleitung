import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Viewer} from '../src/model.js';
import {families} from '../src/data.js';
import {linerStages,linerEnd,linerState,breakRho,cavityRho,voidFloor,voidRoof} from '../src/liner.js';
import {coneSpec} from '../src/injection-cone.js';

// Void filling behind a liner: the tool reaches the bore it milled, the cone
// seals around that bore, the robot and hose stay inside the liner, grout
// stays behind the liner and every time can be seeked directly. Tolerances
// are display tolerances, not a collision certification.
const v=Object.create(Viewer.prototype);
Object.assign(v,{scene:new THREE.Scene(),model:new THREE.Group(),context:new THREE.Group(),floor:new THREE.Object3D(),parts:[],group:'all',mode:'explore',explode:0,targetExplode:0,selected:null,faint:false,camera:new THREE.PerspectiveCamera(34,1.5,1,15000)});
v.controls={target:new THREE.Vector3(),update(){v.camera.lookAt(this.target);},maxDistance:5000};
v.scene.add(v.model);
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),p=V();
const pose=t=>{v.setLiner(t);v.updateParts();v.linerPose();v.model.updateMatrixWorld(true);v.liner.group.updateMatrixWorld(true);return v.linerState;};
const points=(root,step=40)=>{const out=[];root.traverseVisible(o=>{if(!o.isMesh&&!o.isInstancedMesh)return;const a=o.geometry.attributes.position;if(!a)return;const k=Math.max(1,Math.floor(a.count/step));for(let i=0;i<a.count;i+=k)out.push(p.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).clone());});return out;};
for(const kind of ['kliner','inliner'])for(const f of families.filter(f=>!process.env.DN||String(f.id)===process.env.DN)){
 v.linerKind=kind;v.build(f.id);v.setSections({pipe:true,shield:false,holder:false});v.setMode('liner');
 const s=v.liner.spec,tag=`DN ${f.id} ${kind}`;
 assert.equal(linerStages.length,7,'seven steps');
 // The bore lies in the broken part of the old pipe and below the void.
 const arc=s.Rm*s.phiH;
 for(let i=0;i<32;i++){const a=i/32*Math.PI*2,x=s.holeP.x+s.holeOut*Math.cos(a),q=arc+s.holeOut*Math.sin(a);assert.ok(breakRho(s,x,q)<.95,`${tag}: bore inside the pipe breakout`);assert.ok(cavityRho(s,x,q)<.9,`${tag}: bore below the void`);}
 assert.ok(s.holeOut>8&&s.holeIn<coneSpec.padOuter-6,`${tag}: bore through the liner and narrower than the sealing pad (${s.holeOut.toFixed(1)}/${s.holeIn.toFixed(1)})`);
 let prev=null,worst={robot:-1e9,hose:-1e9,squash:0,tip:0};
 for(let t=0;t<=linerEnd;t=Math.round((t+.02)*1000)/1000){
  const st=pose(t);
  if(prev){assert.ok(Math.abs(st.travel-prev.travel)<210,`${tag} t=${t}: continuous travel`);assert.ok(Math.abs(st.roll-prev.roll)<.08,`${tag} t=${t}: continuous roll`);assert.ok(Math.abs(st.off-prev.off)<14,`${tag} t=${t}: continuous lift`);}
  prev=st;
  // Tool tip on the planned axis: the robot solution reaches the bore.
  const tool=st.tool==='cone'?v.cone.outlet.getWorldPosition(V()):v.robot.cutter.disk.localToWorld(V(0,8,0));
  if(st.travel===0&&Math.abs(st.roll-s.roll)<1e-9){const target=s.holeP.clone().addScaledVector(s.holeU,st.off);worst.tip=Math.max(worst.tip,tool.distanceTo(target));}
  // Robot, tool and hose inside the liner (the working tip may touch it).
  for(const q of points(v.robot.group)){
   const r=Math.hypot(q.y,q.z),nearTip=q.distanceTo(s.holeP.clone().add(V(st.travel,0,0)))<45;
   if(q.y<-s.RL*.2)continue; // wheels on the invert
   if(!nearTip)worst.robot=Math.max(worst.robot,r-(s.RL-1));
  }
  if(v.liner.hose?.visible){const c=v.liner.hose.geometry.parameters.path;for(let i=0;i<=80;i++){const q=c.getPointAt(i/80);if(q.x<-1950+st.travel)continue;worst.hose=Math.max(worst.hose,Math.hypot(q.y,q.z)+7-(s.RL-.5));}}
  if(st.tool==='cone'&&st.off>0){
   worst.squash=Math.max(worst.squash,v.linerSquash);
   // Pad face on the liner, nowhere through it; outlet centred on the bore.
   for(const q of points(v.cone.pad,800))assert.ok(Math.hypot(q.y,q.z)<s.RL+.05,`${tag} t=${t}: pad stays on the liner face`);
   const axisOff=v.cone.outlet.getWorldPosition(V()).sub(s.holeP),lateral=axisOff.clone().sub(s.holeU.clone().multiplyScalar(axisOff.dot(s.holeU))).length();
   assert.ok(lateral<1,`${tag} t=${t}: outlet centred on the bore (${lateral.toFixed(2)} mm)`);
  }
  // Grout only in the void behind the liner, never in the pipe.
  if(st.fill>0){const g=v.liner.grout.geometry.attributes.position;for(let i=0;i<g.count;i+=7){p.fromBufferAttribute(g,i);const r=Math.hypot(p.y,p.z);assert.ok(r>s.R-1.5,`${tag} t=${t}: grout outside the liner`);assert.ok(r<s.R+s.w+s.cav.H*1.12+1,`${tag} t=${t}: grout inside the void`);}}
  if(st.stage===2&&st.f>.71)assert.ok(st.holeOut>0,`${tag} t=${t}: bore through the liner after milling`);
 }
 assert.ok(worst.tip<.5,`${tag}: tool reaches the planned bore axis (${worst.tip.toFixed(2)} mm)`);
 assert.ok(worst.robot<=0,`${tag}: robot inside the liner (${worst.robot.toFixed(1)} mm)`);
 assert.ok(worst.hose<=0,`${tag}: hose inside the liner (${worst.hose.toFixed(1)} mm)`);
 assert.ok(worst.squash>.5&&worst.squash<=coneSpec.padTop-coneSpec.padBottom-1.5,`${tag}: pad compressed, within its limit (${worst.squash.toFixed(2)} mm)`);
 // Direct jumps backwards: no bore, no grout, milling head back on the spindle.
 pose(6.9);pose(.5);assert.ok(!v.liner.holeWall.visible&&!v.liner.grout.visible&&!v.liner.plug.visible,`${tag}: rewind removes bore and grout`);assert.ok(v.robot.cutter.disk.visible&&!v.cone.group.visible,`${tag}: rewind restores the milling head`);
 pose(5.5);const mid=v.liner.lastFill;pose(1);pose(5.5);assert.equal(v.liner.lastFill,mid,`${tag}: same fill after a jump`);
 // Full fill reaches the roof; the void floor is the liner where the old pipe is broken.
 pose(linerEnd);assert.ok(v.liner.plug.visible&&v.liner.groutTop(s.cav.cx,s.cav.cs,1).top>voidRoof(s,s.cav.cx,s.cav.cs)-.5,`${tag}: void completely filled`);
 assert.equal(voidFloor(s,s.holeP.x,arc),s.R,`${tag}: floor below the bore is the liner`);
 // Leaving the tab mounts the milling head again for the other animations.
 v.setMode('process');v.resetPose();assert.ok(!v.cone.group.visible&&v.robot.cutter.disk.visible,`${tag}: milling head restored outside the tab`);
 console.log(`${tag}: bore Ø ${(2*s.holeOut).toFixed(0)}/${(2*s.holeIn).toFixed(0)} mm, pad ≤ ${worst.squash.toFixed(1)} mm, robot margin ${(-worst.robot).toFixed(1)} mm, hose margin ${(-worst.hose).toFixed(1)} mm`);
}
console.log('Liner void filling checks passed');
