import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Viewer} from '../src/model.js';
import {families,bom} from '../src/data.js';
import {ports,bladderMount,windingSpec} from '../src/bladder.js';

// Geometry checks without a browser or GPU; assertions describe PDF orientation
// and assembled contacts, not dimensional certification of unmeasured drawings.
const v=Object.create(Viewer.prototype);
Object.assign(v,{model:new THREE.Group(),context:new THREE.Group(),floor:new THREE.Object3D(),parts:[],group:'all',mode:'explore',explode:0,targetExplode:0,selected:null,faint:false,camera:new THREE.PerspectiveCamera(34,1.5,1,15000)});
v.controls={target:new THREE.Vector3(),update(){v.camera.lookAt(this.target);}};
const near=(a,b,label,tol=.02)=>assert.ok(Math.abs(a-b)<tol,`${label}: ${a} vs ${b}`);
const part=(g,key)=>v.parts.find(p=>p.group===g&&p.key===key);
const bounds=p=>new THREE.Box3().setFromObject(p.node);
v.resetPose(); // The render loop starts before the first model has been built.
for(const f of families){
 v.build(f.id);
 const motor=part('h','motor'),shaft=part('h','shaft'),housing=part('h','housing'),rail=part('h','rail'),pin=part('h','pins'),block=part('h','blocks');
 assert.ok(motor.base.x>0&&part('z','wheel').base.x>0&&part('z','adapter').base.x<0,'Motor and wheels opposite coupling');
 assert.ok(bounds(shaft).min.x<housing.base.x,'Free shaft end faces coupling');
 near(bounds(shaft).min.x,-55,'Shortened free end stops before the mortar hose');
 v.poseMechanism(1,0,0);v.model.updateMatrixWorld(true); // Aligned end position, before air admission.
 const shaftObject=shaft.node.children[0].children[0],profile=shaftObject.userData.shaftProfile;
 assert.ok(profile,'Shaft has a single flat face and curved back');
 const mountingCentre=shaftObject.localToWorld(new THREE.Vector3(profile.hole.x,profile.flat,0));
 const shieldCentre=part('s','shield').node.localToWorld(new THREE.Vector3(0,v.radius,0));
 near(mountingCentre.x,shieldCentre.x,'Shaft mounting opening centred below shield opening along pipe',.00001);
 near(mountingCentre.z,shieldCentre.z,'Shaft mounting opening centred below shield opening across pipe',.00001);
 const castLocal=(origin,direction)=>{const ray=new THREE.Raycaster(shaftObject.localToWorld(new THREE.Vector3(...origin)),new THREE.Vector3(...direction).transformDirection(shaftObject.matrixWorld),.001,80);return ray.intersectObject(shaftObject,true);};
 const topHit=castLocal([profile.hole.x,30,0],[0,-1,0])[0];near(topHit.distance,30-profile.hole.floor,'Mounting opening ends at blind floor');
 const bottomHit=castLocal([profile.hole.x,-30,0],[0,1,0])[0];near(bottomHit.distance,30-profile.radius,'Rounded reverse face stays closed',.04);
 const flatHit=castLocal([0,30,0],[0,-1,0])[0];near(flatHit.distance,30-profile.flat,'One planar mounting face');
 const curveHit=castLocal([0,-30,10],[0,1,0])[0];near(curveHit.distance,30-Math.sqrt(profile.radius**2-100),'Reverse face is circular, not a second flat',.04);
 const hoseCurve=new THREE.CatmullRomCurve3(v.hosePoints.map(p=>new THREE.Vector3(...p)));let minClearance=Infinity;
 for(let i=0;i<=1600;i++){
  const p=hoseCurve.getPoint(i/1600),dx=Math.max(-55-p.x,0,p.x-93),dr=Math.max(Math.hypot(p.y-shaft.base.y,p.z)-20,0);
  minClearance=Math.min(minClearance,Math.hypot(dx,dr)-4.5);
 }
 assert.ok(minClearance>2,`Hose clears full shaft rotation envelope including hose thickness: ${minClearance.toFixed(2)} mm`);
 near(shaft.base.y,housing.base.y,'Shaft/housing axis height');near(motor.base.y,housing.base.y,'Motor/housing axis height');
 near(pin.base.y,rail.base.y,'Pin/rail coaxial height');near(pin.base.z,rail.base.z,'Pin/rail coaxial transverse position');
 near(pin.base.y,block.base.y,'Pin/bearing coaxial height');near(pin.base.z,block.base.z,'Pin/bearing coaxial transverse position');
 near(bounds(housing).max.y,bounds(block).max.y,'Housing and bearing top faces',.1);
 const sleeve=part('s','mounts'),matchingRail=v.parts.find(p=>p.group==='h'&&p.key==='rail'&&p.base.z===sleeve.base.z);
 near(sleeve.base.y,matchingRail.base.y,'Shield sleeve/rail axis');
 const straps=v.parts.filter(p=>p.group==='s'&&p.key==='straps');assert.equal(straps.length,4,'Two fixing arches per sleeve');
 near(Math.hypot(sleeve.base.y,sleeve.base.z)+13,v.radius-15,'Sleeve touches inner arch without a gap');
 for(const bolt of v.parts.filter(p=>p.group==='s'&&p.key==='bolts')){
  const normal=new THREE.Vector3(0,-1,0).transformDirection(bolt.node.children[0].matrixWorld),start=bolt.base.clone().addScaledVector(normal,-1);
  const strap=straps.find(p=>Math.abs(p.base.x-bolt.base.x)<.01&&Math.sign(p.base.z)===Math.sign(bolt.base.z));assert.ok(strap,'Each short screw belongs to a fixing wing');
  const ray=new THREE.Raycaster(start,normal,.01,12);
  assert.equal(ray.intersectObject(strap.node,true).length,0,'Open screw hole through fixing arch');
  assert.equal(ray.intersectObject(part('s','carrier').node,true).length,0,'Matching screw hole through carrier');
  ray.ray.origin.x+=5;assert.ok(ray.intersectObject(strap.node,true).length>0,'Material surrounds fixing-wing bore');
  assert.ok(ray.intersectObject(part('s','carrier').node,true).length>0,'Carrier fixing remains in material outside oval');
  const tip=bolt.base.clone().addScaledVector(normal,10);near(Math.hypot(tip.y,tip.z),v.radius-5,'M5x10 ends at carrier face, before sealing bladder');
 }
 for(const bolt of v.parts.filter(p=>p.group==='s'&&p.key==='mountbolts')){
  const sleeve=v.parts.find(p=>p.group==='s'&&p.key==='mounts'&&p.base.z===bolt.base.z);
  const rail=v.parts.find(p=>p.group==='h'&&p.key==='rail'&&p.base.z===bolt.base.z);
  const ray=new THREE.Raycaster(new THREE.Vector3(bolt.base.x,sleeve.base.y-30,bolt.base.z),new THREE.Vector3(0,1,0),.01,60);
  assert.equal(ray.intersectObject(sleeve.node,true).length,0,'Long screw has a radial bore in sleeve');
  assert.equal(ray.intersectObject(rail.node,true).length,0,'Long screw clears guide bore and mounting flange');
 }
 assert.equal(v.parts.filter(p=>['shield','mat','carrier'].includes(p.key)).length,3,'Three physical shield layers');
 const throughLayer=(key,x,z)=>new THREE.Raycaster(new THREE.Vector3(x,v.radius+20,z),new THREE.Vector3(0,-1,0),.001,65).intersectObject(part('s',key).node,true);
 for(const key of ['mat','carrier']){
  for(const x of [-78,-50,0,50,78])assert.equal(throughLayer(key,x,0).length,0,'One continuous oval clears ports and former bridges');
  assert.equal(throughLayer(key,0,37).length,0,'Oval clears central bladder');
  assert.ok(throughLayer(key,0,47).length>0,'Material outside oval sides');
  assert.ok(throughLayer(key,97,0).length>0,'Material outside oval ends');
 }
 for(const x of [ports.inletX,0,ports.sensorX])assert.equal(throughLayer('shield',x,0).length,0,'Outer shield retains separate ports');
 for(const x of [-50,50])assert.ok(throughLayer('shield',x,0).length>0,'Outer shield retains bridges between ports');
 const checkInlet=()=>{
  const shieldLift=v.shieldPart.node.position.y-v.shieldPart.base.y;
  near(v.inlet.position.y+10,v.radius+shieldLift+3*v.sealAir,'Inlet flange contacts outer shield underside');
  near(v.feed.position.y+v.hosePoints.at(-1)[1],v.inlet.position.y-9,'Hose stays joined to inlet');
 };
 for(const e of [0,.5,1]){v.explode=e;v.updateParts();v.resetPose();checkInlet();}
 v.explode=0;v.updateParts();v.resetPose();
 assert.equal(v.parts.length,['s','h','z','u'].flatMap(g=>bom(f.id,g)).filter(r=>r.kind!=='alias'&&!r.unplaced).reduce((n,r)=>n+r.qty,0),'All placed BOM quantities instantiated');
 for(const pos of [20,21]){assert.ok(bom(f.id,'z').some(r=>r.pos===pos&&r.qty===1&&r.unplaced&&r.note),'Unlocated fastener retained and explained in BOM');assert.ok(!v.parts.some(p=>p.group==='z'&&p.pos===pos),'No invented hinge placement for unlocated fastener');}
 const base=part('h','base'),baseObject=base.node.children[0].children[0];v.model.updateMatrixWorld(true);
 const bores=baseObject.userData.threadBores;assert.equal(bores.length,8,'Four M6 threaded bores on each side');
 const bolts=v.parts.filter(p=>p.group==='h'&&p.key==='sidebolts');
 for(const bore of bores){
  const mouth=baseObject.localToWorld(new THREE.Vector3(bore.x,bore.y,bore.z));
  const inward=new THREE.Vector3(...bore.axis).transformDirection(baseObject.matrixWorld);
  const bolt=bolts.find(p=>Math.abs(p.base.x-mouth.x)<.01&&Math.sign(p.base.z)===Math.sign(mouth.z));assert.ok(bolt,'Each bore has a screw');
  near(bolt.base.y,mouth.y,'Screw and thread axis height');
  const screwObject=bolt.node.children[0].children[0],direction=new THREE.Vector3(0,-1,0).transformDirection(screwObject.matrixWorld);near(direction.dot(inward),1,'Screw points into thread');
  near(bolt.base.distanceTo(mouth),6.45,'Head bears against outside of 6 mm side plate');
  const ray=new THREE.Raycaster(mouth.clone().addScaledVector(inward,-.8),inward,.01,14.3);
  assert.equal(ray.intersectObject(baseObject,true).length,0,'Thread bore has real open centre');
  ray.ray.origin.x+=6;assert.ok(ray.intersectObject(baseObject,true).length>0,'Metal surrounds the bore');
 }
 const tube=bounds(part('z','tube')),guide=bounds(part('z','guide')),body=bounds(part('z','body'));
 assert.ok(tube.min.x<body.min.x&&tube.max.x>body.max.x&&tube.max.x>guide.min.x,'Central tube reaches through body into guide');
 const fixing=part('z','lastbolt'),counterNut=v.parts.find(p=>p.group==='z'&&p.key==='nuts'&&p.index===1);
 near(fixing.base.x,-28,'M6x50 positioned at side bore of central body');near(fixing.base.y,0,'Fixing crosses central tube axis');near(fixing.base.z,body.max.z,'Screw head seated on body side');
 const axis=new THREE.Vector3(0,-1,0).transformDirection(fixing.node.children[0].matrixWorld);near(axis.z,-1,'M6x50 points transversely through body');
 const fixingRay=new THREE.Raycaster(fixing.base.clone().addScaledVector(axis,-5),axis,.001,65);
 assert.equal(fixingRay.intersectObject(part('z','body').node,true).length,0,'Actual transverse through-bore in body');
 assert.equal(fixingRay.intersectObject(part('z','tube').node,true).length,0,'Both tube walls drilled on fixing axis');
 assert.equal(fixingRay.intersectObject(counterNut.node,true).length,0,'Counter nut has an open bore');
 fixingRay.ray.origin.x+=6;
 assert.ok(fixingRay.intersectObject(part('z','body').node,true).length>0,'Body material surrounds fixing hole');
 assert.ok(fixingRay.intersectObject(part('z','tube').node,true).length>0,'Tube material surrounds cross bore');
 near(counterNut.base.x,fixing.base.x,'Nut and screw coaxial X');near(counterNut.base.y,fixing.base.y,'Nut and screw coaxial Y');
 near(bounds(counterNut).max.z,body.min.z,'Nut seated against opposite body side');
 const tip=fixing.base.clone().addScaledVector(axis,50);assert.ok(tip.z<bounds(counterNut).min.z&&tip.z>bounds(counterNut).min.z-3,'50 mm screw passes completely through nut');
 assert.ok(fixing.delta.z>0&&counterNut.delta.z<0,'Explosion separates screw and nut on opposite sides');
 const hingeBase=part('z','hinge1'),hingeTop=part('z','hinge3'),flap=part('z','hinge2'),toolMount=part('z','adapter');
 near(bounds(toolMount).max.x,bounds(flap).min.x,'Tool profile seats on moving vertical hinge leaf');
 near(bounds(hingeBase).max.y,24,'Part 1 supports top plate at Y24');
 assert.equal(new THREE.Raycaster(new THREE.Vector3(-300,0,0),new THREE.Vector3(-1,0,0),.01,60).intersectObject(hingeBase.node,true).length,0,'Part 1 has longitudinal bore for central tube');
 for(const bolt of v.parts.filter(p=>p.group==='z'&&p.key==='adapterbolts')){
  const axis=new THREE.Vector3(0,-1,0).transformDirection(bolt.node.children[0].matrixWorld);near(axis.x,1,'M8 tool screws point from robot side into part 3');
  near(bolt.base.x,bounds(toolMount).min.x,'M8 head seats on front of stepped profile');
  const ray=new THREE.Raycaster(bolt.base.clone().addScaledVector(axis,-1),axis,.001,21);
  assert.equal(ray.intersectObject(toolMount.node,true).length,0,'Both steps have aligned M8 clearance holes');
  assert.equal(ray.intersectObject(flap.node,true).length,0,'Moving leaf has matching M8 receiver bore');
  const tip=bolt.base.clone().addScaledVector(axis,20);assert.ok(tip.x>-370&&tip.x< -361,'20 mm tool screw ends within 9 mm front plate');
  ray.ray.origin.y+=6;assert.ok(ray.intersectObject(flap.node,true).length>0,'Material surrounds tool mounting bore');
 }
 for(const bolt of v.parts.filter(p=>p.group==='z'&&p.key==='topbolts')){
  near(bolt.base.y,32,'M6 head seated on horizontal top plate');
  const ray=new THREE.Raycaster(bolt.base.clone().add(new THREE.Vector3(0,1,0)),new THREE.Vector3(0,-1,0),.001,21);
  assert.equal(ray.intersectObject(hingeTop.node,true).length,0,'Open vertical M6 clearance in top plate');
  near(ray.intersectObject(hingeBase.node,true)[0].distance,21,'M6 receiver stays open to the blind floor at screw tip');
  ray.ray.origin.x+=6;assert.ok(ray.intersectObject(hingeTop.node,true).length>0&&ray.intersectObject(hingeBase.node,true).length>0,'Top screw has material around both holes');
 }
 for(const bolt of v.parts.filter(p=>p.group==='z'&&p.key==='hingebolts')){
  const axis=new THREE.Vector3(0,-1,0).transformDirection(bolt.node.children[0].matrixWorld),receiver=bolt.base.y<0?hingeBase:flap;
  const ray=new THREE.Raycaster(bolt.base.clone().addScaledVector(axis,-1),axis,.001,14);
  const spring=v.parts.find(p=>p.group==='z'&&p.key==='spring'&&Math.sign(p.node.children[0].userData.springEyes[0][2])===Math.sign(bolt.base.z));
  assert.equal(ray.intersectObject(spring.node,true).length,0,'M5 screw passes open spring eye');
  const eye=spring.node.children[0].userData.springEyes[bolt.base.y<0?0:1];near(eye[0]+spring.base.x,bolt.base.x,'Spring eye follows M5 screw X');near(eye[1]+spring.base.y,bolt.base.y,'Spring eye follows M5 screw Y');
  assert.equal(ray.intersectObject(receiver.node,true).length,0,'M5 screw matches upper or lower receiver');
  const washer=v.parts.find(p=>p.group==='z'&&p.key==='washers'&&p.index===bolt.index);
  near(Math.abs(bolt.base.z-washer.base.z),2.1,'Spring eye seated between washer and M5 head');
  assert.equal(ray.intersectObject(washer.node,true).length,0,'Open washer aligned with M5 screw');
  ray.ray.origin.y+=3.5;assert.ok(ray.intersectObject(receiver.node,true).length>0,'Material surrounds M5 receiver');
 }
 v.fit('hinge');assert.ok(v.controls.target.x< -330,'Hinge close-up targets coupling end');assert.ok(v.parts.every(p=>p.node.visible),'Hinge close-up does not hide components');
 const cornerPin=part('z','hingepin');near(cornerPin.base.x,-365.5,'Hinge axis at L corner X');near(cornerPin.base.y,28,'Hinge axis at L corner height');
 const cornerRay=new THREE.Raycaster(new THREE.Vector3(-365.5,28,40),new THREE.Vector3(0,0,-1),.001,80);
 assert.equal(cornerRay.intersectObject(hingeTop.node,true).length,0,'Fixed hinge knuckles have open pivot bore');
 assert.equal(cornerRay.intersectObject(flap.node,true).length,0,'Moving hinge knuckle shares pivot bore');
 assert.equal(v.parts.filter(p=>p.group==='z'&&p.key==='spring').length,2,'Two springs replace inferred rigid side links');
 for(const p of v.parts){const b=bounds(p);assert.ok([...b.min.toArray(),...b.max.toArray()].every(Number.isFinite),`Finite geometry: ${p.key}`);}
 assert.equal(v.sections.shield,false,'Shield complete by default');
 v.fit('drive');assert.ok(v.parts.every(p=>p.node.visible),'Camera close-up does not hide components');
 v.setSections({pipe:false,shield:true,holder:true});assert.ok(v.pipeFull.visible&&!v.pipe.visible,'User can choose full pipe');
 assert.ok(v.parts.some(p=>p.group==='h'&&p.key==='rail'&&!p.node.visible),'Holder hidden only on user setting');
 v.setSections({pipe:true,shield:false,holder:false});assert.ok(v.parts.every(p=>p.node.visible),'User can restore complete holder');v.fit();
 v.mode='process';v.context.visible=true;
 const pose=t=>{v.time=t;v.updateParts();v.processPose();v.model.updateMatrixWorld(true);};
 v.context.updateMatrixWorld(true);
 const crownRay=(x,z=0)=>new THREE.Raycaster(new THREE.Vector3(x,v.radius+150,z),new THREE.Vector3(0,-1,0),.001,190).intersectObject(v.pipeFull,true);
 assert.equal(crownRay(115).length,0,'Large breakout removes crown wall well beyond the old circular opening');
 near(crownRay(220)[0].point.y,v.radius+30,'Intact pipe retains its wall outside the breakout',.15);
 const branchBox=new THREE.Box3().setFromObject(v.branchFull);
 near(branchBox.max.y,v.branchTop,'Branch surface reaches actual branch top');
 assert.ok(branchBox.min.y>v.radius+45&&branchBox.min.y<v.radius+80,'Branch has a broken lower edge above the main crown');
 pose(4.09);assert.ok(v.repair.hoseFront>.45&&v.repair.hoseFront<.55,'Mortar front first advances along the hose');
 assert.equal(v.repair.fill,0,'Cavity cannot fill before mortar reaches the inlet');assert.equal(v.repair.outlet.visible,false,'No mortar appears ahead of the hose front');
 pose(4.31);const early=Array.from(v.repair.mortarGeometry.attributes.position.array),earlyFill=v.repair.fill;
 assert.ok(earlyFill>0&&earlyFill<.2&&v.repair.outlet.visible,'After the line fills, mortar enters the actual cavity');
 pose(4.61);assert.ok(v.repair.fill>earlyFill&&v.repair.waterActivity<.5,'Cavity filling progressively suppresses infiltration');
 const advanced=Array.from(v.repair.mortarGeometry.attributes.position.array);
 for(let k=early.length/2+1;k<early.length;k+=3)assert.ok(advanced[k]>=early[k]-.002,'Filled height never recedes during injection');
 pose(4.31);assert.deepEqual(Array.from(v.repair.mortarGeometry.attributes.position.array),early,'Seeking backward reproduces the same physical fill geometry');
 pose(4.92);assert.equal(v.repair.water.visible,false,'Completed patch stops infiltration');
 assert.equal(v.repair.fill,1,'All of the repair volume is filled before curing');
 assert.equal(v.repair.mortar.scale.y,1,'Fill grows from the inlet instead of scaling a complete cylinder');
 v.context.updateMatrixWorld(true);const openBranch=new THREE.Raycaster(new THREE.Vector3(0,v.radius+140,0),new THREE.Vector3(0,-1,0),.001,150).intersectObject(v.mortar,true);
 assert.equal(openBranch.length,0,'Repair preserves the bladder-shaped open branch lumen');
 pose(6.99);assert.equal(v.repair.water.visible,false,'No infiltration returns after removal');
 assert.ok(v.repair.hoseGroup.position.equals(v.feed.position),'Internal mortar follows the attached hose during lowering and travel');
 pose(.5);const bumperPart=part('u','bumper'),vacuumHeight=bumperPart.node.scale.y;
 assert.ok(vacuumHeight<.4&&v.upperLift<0&&v.bumperAir===0,'Vacuum-flat bumper and lowered shield during approach');
 near(bumperPart.node.position.y-49*bumperPart.node.scale.y,bumperPart.base.y-49,'Bumper lower mounting remains fixed');
 pose(1.5);assert.ok(v.bumperAir>.4&&v.bumperAir<.6&&bumperPart.node.scale.y>vacuumHeight,'Inflation only after positioning');
 pose(1.99);
 near(v.sealAir,0,'Dichtblase remains relaxed while bumper inflates');
 const relaxedSeal=bounds(part('s','mat')),relaxedCarrier=bounds(part('s','carrier'));
 pose(2.5);near(v.bumperAir,1,'Bumper full before Dichtblase inflates');near(v.sealAir,.5,'Dichtblase has its own inflation stage');near(v.winding.extension,0,'Anschlussblase stays wound until Dichtblase is full');
 checkInlet();
 assert.ok(bounds(part('s','mat')).max.y>relaxedSeal.max.y+1,'Dichtblase expands visibly');near(bounds(part('s','carrier')).max.y,relaxedCarrier.max.y,'Carrier stays fixed during sealing',.03);
 pose(2.999);assert.ok(v.sealAir>.999,'Dichtblase fully inflated before branch insertion');
 checkInlet();
 const capRest=new THREE.Box3().setFromObject(v.winding.tip),capSize=capRest.getSize(new THREE.Vector3());
 assert.ok(capSize.x<ports.opening*2&&capSize.x>ports.opening*1.6,'Rigid head slightly smaller than central opening');
 assert.ok(capRest.max.y>v.radius+13&&capRest.max.y<v.radius+25,'Retracted head remains slightly above pressed shield');
 let stored=v.winding.storedLength,rotation=Math.abs(v.winding.shaftAngle),tipHeight=v.winding.tip.position.y;
 const initialRotation=rotation;
 near(initialRotation/(2*Math.PI),3,'Travel state has three full wraps');near(v.winding.remainingTurns,3,'Three visible winding turns');near(windingSpec.wall,3,'Vacuum wall thickness 3 mm');near(windingSpec.folded,6,'Two walls make a 6 mm folded bladder');
 const woundSurface=v.winding.coilGeometry.attributes.position;
 // Mid-ribbon opposing samples measure thickness independent of coil rotation.
 const windingRows=woundSurface.count/49-1;
 for(const i of [Math.floor(windingRows*.4),Math.floor(windingRows*.7)]){const a=i*49+12,b=i*49+36;const dy=woundSurface.getY(a)-woundSurface.getY(b),dz=woundSurface.getZ(a)-woundSurface.getZ(b);near(Math.hypot(dy,dz),6,'Wound bladder retains two 3 mm wall layers',.001);}
 for(const f of [0,.2,.4,.6,.76,.999]){
  pose(3+f);near(v.winding.storedLength+v.winding.deployedLength,v.winding.totalLength,'Bladder material length conserved',.001);
  assert.ok(v.winding.storedLength<=stored+.001&&Math.abs(v.winding.shaftAngle)<=rotation+.001&&v.winding.tip.position.y>=tipHeight-.001,'Rotation releases wound bladder toward aligned zero position as head advances');
  near(shaft.node.rotation.x,v.winding.shaftAngle,'Actual shaft follows winding');
  near(new THREE.Box3().setFromObject(v.winding.tip).getSize(new THREE.Vector3()).x,capSize.x,'Head remains rigid');
  stored=v.winding.storedLength;rotation=Math.abs(v.winding.shaftAngle);tipHeight=v.winding.tip.position.y;
 }
 near(initialRotation-rotation,6*Math.PI,'Complete three-turn unwinding, no shortened angular motion');assert.ok(v.winding.tip.position.y+v.winding.group.position.y+7<v.branchTop,'Extended bladder fits within displayed branch');
 pose(3.74);near(v.winding.storedLength,0,'No residual winding before inflation');near(v.winding.inflation,0,'Full unwinding has a separate pause before air');near(shaft.node.rotation.x,0,'Flat face points up parallel to branch opening');assert.equal(v.winding.coil.visible,false,'No wound bladder rendered in fully deployed state');
 const skin=v.winding.bodyGeometry.attributes.position;
 for(let i=0;i<=112;i++){const a=i*49,b=a+24;near((skin.getX(a)+skin.getX(b))/2,0,'Straight bladder centre along branch X');near((skin.getZ(a)+skin.getZ(b))/2,0,'Straight bladder centre along branch Z');}
 const footTop=bladderMount.seat+bladderMount.capHeight;
 near(skin.getY(0),shaft.base.y+footTop,'Flexible bladder starts at upper face of rigid foot');near(v.winding.attachment.rotation.x,shaft.node.rotation.x,'Attachment rotates with shaft');
 const mountBounds=new THREE.Box3().setFromObject(v.winding.attachment);near(mountBounds.max.y,shaft.node.position.y+footTop,'Rigid foot replaces the raised air coupling');assert.ok(bladderMount.seat-profile.flat<1,'Flat lower face sits nearly flush with shaft');assert.ok(bladderMount.threadTop<=profile.flat&&bladderMount.threadBottom>profile.hole.floor,'Male thread sits inside blind bore');
 const rigidFoot=v.winding.rigidFoot;rigidFoot.geometry.computeBoundingBox();const rigidSize=rigidFoot.geometry.boundingBox.getSize(new THREE.Vector3());near(rigidSize.x,70,'Rigid shaft-side foot diameter X');near(rigidSize.z,70,'Rigid shaft-side foot diameter Z');near(skin.getX(0)-skin.getX(24),70,'No conical narrowing at attachment');
 v.winding.update(.9,1);near(v.winding.inflation,0,'Air blocked with any residual wrap');
 for(const extension of [0,.2,.55,.9,1]){
  v.poseMechanism(extension,0,v.upperLift);v.model.updateMatrixWorld(true);
  const material=extension===1?v.winding.bodyGeometry.attributes.position:v.winding.coilGeometry.attributes.position;
  const foot=v.winding.group.localToWorld(new THREE.Vector3((material.getX(0)+material.getX(24))/2,(material.getY(0)+material.getY(24))/2,(material.getZ(0)+material.getZ(24))/2));
  const fixing=v.winding.attachment.localToWorld(new THREE.Vector3(0,footTop,0));near(foot.distanceTo(fixing),0,'Bladder stays attached to rotating rigid foot',.0001);
  near(material.getX(0)-material.getX(24),70,'Flexible skin meets full 70 mm rigid foot in every winding pose');assert.ok(rigidFoot.scale.equals(new THREE.Vector3(1,1,1)),'Rigid foot does not deform during winding');
 }
 for(const air of [0,.5,1]){v.poseMechanism(1,air,v.upperLift);near(v.winding.bodyGeometry.attributes.position.getX(0),35,'Air does not change rigid attachment radius');assert.ok(rigidFoot.scale.equals(new THREE.Vector3(1,1,1)),'Rigid foot does not swell');}
 pose(4.3);assert.equal(v.sensorFull,false,'No early full signal');
 pose(4.92);assert.equal(v.sensorFull,true,'Full signal after filling');assert.ok(v.flow.every(p=>!p.visible),'Injection indication stops on full signal');
 pose(6.15);assert.equal(v.sensorFull,false,'Full signal clears after pressure release');
 const angleBeforeRewind=shaft.node.rotation.x;pose(6.5);assert.ok(shaft.node.rotation.x<angleBeforeRewind,'Reverse rotation rewinds bladder');
 pose(6.64);near(v.winding.extension,0,'Bladder rewound before shield releases');near(v.shieldPart.node.position.y-v.shieldPart.base.y,8,'Bumper still pressed during rewind');near(v.sealAir,1,'Dichtblase holds during rewind');
 pose(6.74);near(v.sealAir,0,'Dichtblase relaxed before bumper lowers');near(v.bumperAir,1,'Bumper holds until seal relaxed');
 pose(6.875);near(bumperPart.node.scale.y,vacuumHeight,'Bumper vacuum-flat before further travel');near(v.model.position.x,0,'Vacuum completed before departing');
 assert.ok(ports.inletX< -ports.opening&&ports.sensorX>ports.opening,'Three separate openings ordered as photograph');
 near(v.hosePoints.at(-1)[0],ports.inletX,'Hose ends at separate inlet');assert.ok(v.hosePoints.at(-1)[1]<v.radius-8,'Hose approaches shield from below');
 for(const t of [0,.92,1.92,2.92,3.92,4.92,5.92,6.92]){v.time=t;v.updateParts();v.processPose();assert.ok(v.model.position.toArray().every(Number.isFinite));assert.ok(v.mortar.scale.y>0);}
 assert.ok(v.model.position.x<0&&v.mortar.visible,'After removal repair remains at branch');
 v.mode='explore';v.resetPose();
 near(v.sealAir,0,'Dichtblase deformation resets outside process');
 assert.ok(v.parts.every(p=>p.node.scale.equals(new THREE.Vector3(1,1,1))),'Process deformation resets');
 console.log(`${f.label}: ${v.parts.length} PDF parts; orientation, winding, rigid tip, inlet, full signal, rewind OK`);
}
