import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Viewer} from '../src/model.js';
import {families,PHASE} from '../src/data.js';
import {laserSpec,laserTravel,laserState,heck,laserVisible} from '../src/laser-aid.js';

// Laser-Positionierhilfe: über den Anschluss bis die rote Linie auf der
// Anschlussmitte steht, Halt und Nullen (Doppelblitz), Rückweg L bis Grün.
// Hardware bleibt im Rohr, das Messrad an der Rohrwand; Rücksprünge stimmen.
const near=(a,b,m,e=.01)=>assert.ok(Math.abs(a-b)<=e,`${m}: ${a} != ${b}`);
const v=Object.create(Viewer.prototype);
Object.assign(v,{scene:new THREE.Scene(),model:new THREE.Group(),context:new THREE.Group(),floor:new THREE.Object3D(),parts:[],group:'all',mode:'explore',explode:0,targetExplode:0,selected:null,faint:false,camera:new THREE.PerspectiveCamera(34,1.5,1,15000)});
v.controls={target:new THREE.Vector3(),update(){},addEventListener(){},maxDistance:5000};
v.renderer={domElement:{toDataURL:()=>''},render(){}};
v.resetPose();
for(const f of families)for(const kind of ['open','closure']){
 v.repairOptions={kind,milling:kind==='open',infiltration:true,infiltrationLevel:.85,cavity:'large',sewerWater:33};v.laserAid=true;v.build(f.id);
 v.mode='process';v.context.visible=true;v.sections={pipe:true,shield:false,holder:false};
 const R=v.radius+12,wo=v.workOffset,L=v.laserTarget();
 const pose=(t,clock=1.3)=>{v.time=t+PHASE.POSITION;v.ambientClock=clock;v.updateParts();v.processPose();v.model.updateMatrixWorld(true);};
 pose(0);near(v.model.position.x,wo-430,'Start of positioning continues from the tool change');assert.equal(v.laserStatus.state,'start','Red start line during approach');assert.ok(v.laserStatus.red&&!v.laserStatus.green,'Only the red laser is on');
 assert.ok(v.laser.group.visible&&v.laser.beam.visible,'Laser device and beam are shown');
 pose(laserSpec.forwardEnd+.05);near(v.model.position.x+laserSpec.x,0,'Red line stands on the connection centre after overshooting');
 pose(laserSpec.zeroAt+.005);assert.equal(v.laserStatus.state,'zero','Standstill zeroes the counter');assert.ok(!v.laserStatus.red,'Double flash: line briefly off');
 pose(laserSpec.zeroAt+.015);assert.ok(v.laserStatus.red,'Double flash: line on between flashes');
 let last=-1,seenWarn=false;
 for(let k=0;k<=200;k++){const ff=laserSpec.holdEnd+(1-laserSpec.holdEnd)*k/200;pose(Math.min(ff,.99999));const s=v.laserStatus;assert.ok(s.d>=last-1e-9,'Reverse travel grows monotonically');last=s.d;if(s.state==='warn')seenWarn=true;if(s.state==='target')assert.ok(seenWarn,'Green blinks before solid green');assert.notEqual(s.state,'over','Animation never overshoots the target');}
 pose(.99999);near(v.model.position.x,wo,'Positioning ends exactly at the working position',.02);assert.equal(v.laserStatus.state,'target','Solid green at the target');assert.ok(v.laserStatus.green&&!v.laserStatus.red,'Only the green laser is on');
 near(v.laserStatus.L,L,'Travel L equals laser line to target');near(L,-laserSpec.x-wo,'L follows the mould target');
 // Warn state blinks with the clock.
 const warnF=(()=>{for(let k=0;k<=400;k++){const ff=laserSpec.holdEnd+(1-laserSpec.holdEnd)*k/400;const s=laserState(PHASE.POSITION+ff,wo,0);if(s.state==='warn')return ff;}return null;})();
 assert.ok(warnF!=null,'A warn phase exists');assert.notEqual(laserState(PHASE.POSITION+warnF,wo,0).green,laserState(PHASE.POSITION+warnF,wo,.13).green,'Warn state blinks');
 // Heckmodul am Unterteil: bleibt beim Anpressen in Ruhe, im Rohr, ohne Kollision.
 const moduleBox=()=>new THREE.Box3().setFromObject(v.laser.parts.housing).union(new THREE.Box3().setFromObject(v.laser.parts.tower));
 pose(.3);const travelBox=moduleBox(),travelAxle=v.laser.wheel.position.clone();
 for(const t of [.3,.99,1.5,1.999]){
  pose(t);const box=moduleBox().translate(new THREE.Vector3(-v.model.position.x,0,0)),tb=travelBox.clone().translate(new THREE.Vector3(-laserTravel(.3,wo).x,0,0));
  near(box.min.y,tb.min.y,'Module does not lift with the bumper',.001);near(v.laser.wheel.position.y,travelAxle.y,'Wheel axle stays on the lower unit',.001);
  const a=v.laser.wheel.position,edge=Math.abs(a.z)+heck.wheel.w/2;
  near(Math.hypot(Math.abs(a.y)+heck.wheel.r,edge),R,'Measuring wheel runs on the invert',.5);
  assert.ok(Math.abs(a.z)>10.6+heck.wheel.w/2,'Wheel runs beside the central tube');
  v.model.updateMatrixWorld(true);const p=new THREE.Vector3();let outside=0;
  v.laser.group.traverse(o=>{if(!o.isMesh||v.laser.beam.children.includes(o))return;const g=o.geometry.attributes.position;for(let i=0;i<g.count;i+=5){p.fromBufferAttribute(g,i).applyMatrix4(o.matrixWorld);if(Math.hypot(p.y,p.z)>R+.3)outside++;}});
  assert.equal(outside,0,'Rear module stays inside the pipe');
  // Freigang zu Zentralrohr, Klappvorrichtung und Roboter (Stichproben der Oberflächen).
  const boxes=[];v.laser.group.traverse(o=>{if(o.isMesh&&!v.laser.beam.children.includes(o)&&o!==v.laser.cable){const b=new THREE.Box3().setFromObject(o);b.expandByScalar(-.6);boxes.push(b);}});
  let clash=0;for(const part of v.parts){if(part.key==='bumper'||!part.node.visible)continue;part.node.traverseVisible(o=>{if(!o.isMesh)return;const g=o.geometry.attributes.position,step=Math.max(1,Math.floor(g.count/1500));for(let i=0;i<g.count;i+=step){p.fromBufferAttribute(g,i).applyMatrix4(o.matrixWorld);if(boxes.some(b=>b.containsPoint(p)))clash++;}});}
  v.robot.group.traverseVisible(o=>{if(!o.isMesh)return;const g=o.geometry.attributes.position,step=Math.max(1,Math.floor(g.count/800));for(let i=0;i<g.count;i+=step){p.fromBufferAttribute(g,i).applyMatrix4(o.matrixWorld);if(boxes.some(b=>b.containsPoint(p)))clash++;}});
  assert.equal(clash,0,`No clash with mould, central tube, hinge or robot (t=${t})`);
  assert.ok(v.model.position.x+laserSpec.x<v.model.position.x-250,'Laser plane lies behind the rear shield edge');
  near(new THREE.Box3().setFromObject(v.laser.line).getCenter(new THREE.Vector3()).x,v.model.position.x+laserSpec.x,'Laser line lies on the crown at the laser plane',.6);
  assert.ok(v.laser.visibleArcs.some(([a0,a1])=>a0<=0&&a1>=0),'Crown centre stays lit despite the central-tube shadow');
  for(const z of heck.tower.laserZ)assert.ok(laserVisible(R,v.bottom+3.5,z).some(([a0,a1])=>a0<=0&&a1>=0),`Laser at z=${z} reaches the crown centre`);
 }
 // Federung: Rad federt an Muffen und Versätzen ein, die Feder wird kürzer.
 pose(.3);const a0=v.laser.wheel.position.y,s0=v.laser.armTop;v.laser.setDeflection(12);
 near(v.laser.wheel.position.y-a0,12,'Suspension lifts the wheel by the deflection',.05);assert.ok(v.laser.armTop>s0,'Spring is compressed when the wheel rises');
 // Innerer Freigang über den ganzen Federweg: Rad frei von Feder, Federwinkel,
 // Lagerbock und Turm; Schwinge taucht nur im Radausschnitt durch die Platte.
 for(const d of [-6,0,6,12]){
  v.laser.setDeflection(d);v.model.updateMatrixWorld(true);
  const inv=new THREE.Matrix4().copy(v.laser.group.matrixWorld).invert(),c=v.laser.wheel.position,p=new THREE.Vector3(),n=heck.plate.notch;let hit=0,plateHit=0;
  for(const k of ['plate','strap','block','bracket','spring','housing','channel','tower'])v.laser.parts[k].traverse(o=>{if(!o.isMesh)return;const g=o.geometry.attributes.position;for(let i=0;i<g.count;i++){p.fromBufferAttribute(g,i).applyMatrix4(o.matrixWorld).applyMatrix4(inv);if(Math.hypot(p.x-c.x,p.y-c.y)<heck.wheel.r+1&&Math.abs(p.z-heck.wheel.z)<heck.wheel.w/2+1)hit++;}});
  v.laser.parts.fork.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.attributes.position;for(let i=0;i<g.count;i++){p.fromBufferAttribute(g,i).applyMatrix4(o.matrixWorld).applyMatrix4(inv);if(p.y<v.bottom+3.5&&p.y>v.bottom-3.5&&!(p.x<n.x0&&p.z>n.z0&&p.z<n.z1))plateHit++;
   // Schwinge läuft frei im Schlitz des Lagerbocks (nicht in Wangen oder Boden).
   const b=heck.block,top=v.bottom+3.5,inBlock=p.x<b.x0-.2&&p.x>b.x1+.2&&p.z>b.z0+.2&&p.z<b.z1-.2&&p.y>top+.2&&p.y<top+b.h-.2,inSlot=p.z>b.slot[0]+.2&&p.z<b.slot[1]-.2&&p.y>top+b.base+.2;if(inBlock&&!inSlot)plateHit++;}});
  assert.equal(hit,0,`Wheel clears spring, bracket and housings at deflection ${d}`);assert.equal(plateHit,0,`Swing arm passes the plate only through the wheel notch at deflection ${d}`);
  const sp=heck.spring;assert.ok(sp.z+sp.od/2<heck.wheel.z-heck.wheel.w/2-3,'Spring sits outboard of the wheel');
 }
 v.laser.setDeflection(0);near(v.laser.wheel.position.y,a0,'Suspension returns',.001);
 pose(2.5);assert.ok(!v.laser.beam.visible,'Laser is not needed after pressing');
 pose(.8);const a=v.model.position.x,ang=v.laser.spin.rotation.y;pose(.2);pose(.8);near(v.model.position.x,a,'Seeking backward reproduces the travel');near(v.laser.spin.rotation.y,ang,'Measuring wheel angle follows the travel');
 // Classic positioning unchanged without the laser aid.
 v.laserAid=false;pose(.5);near(v.model.position.x,wo-430*(1-.5),'Without laser aid the original approach is kept');assert.ok(!v.laser.group.visible,'Laser hardware hidden when switched off');v.laserAid=true;
 v.mode='explore';v.resetPose();assert.ok(!v.laser.group.visible,'Not part of the DiTom assembly views');
 console.log(`${f.label} · ${kind}: overshoot, zero flash, reverse ${L.toFixed(0)} mm to green, rear module clearance, wheel on invert, suspension and seeking OK`);
}
assert.equal(laserTravel(0,0).x,-430);console.log('Laser positioning aid passed.');
