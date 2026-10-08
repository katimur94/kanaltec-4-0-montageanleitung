import * as THREE from 'three';
import {Viewer} from '../src/model.js';

// Standbilder des Heckmoduls (Laser-Positionierhilfe) für Zeichnungen und
// Montageanleitung. Gleiche Geometrie wie die Website (src/laser-aid.js).
// window.stills.shot({...}) liefert ein JPEG als Base64.
Viewer.prototype.animate=function(){};
const params=new URLSearchParams(location.search),width=+(params.get('w')||1600),height=+(params.get('h')||1000);
const host=document.querySelector('#scene');
const viewer=new Viewer(host,()=>{});
viewer.repairOptions={kind:'open',infiltration:true,infiltrationLevel:.4,cavity:'large',sewerWater:33};viewer.laserAid=true;
let dn=+(params.get('dn')||400);viewer.build(dn);
viewer.controls.enabled=false;viewer.renderer.setPixelRatio(1);viewer.renderer.setSize(width,height);viewer.camera.aspect=width/height;viewer.camera.updateProjectionMatrix();
const scene=viewer.scene,camera=viewer.camera,renderer=viewer.renderer;
const fill=new THREE.DirectionalLight('#ffffff',1.1);fill.position.set(-600,300,700);scene.add(fill);
const under=new THREE.DirectionalLight('#ffffff',.9);under.position.set(-300,-700,500);scene.add(under);const side=new THREE.DirectionalLight('#ffffff',.9);side.position.set(-200,100,-800);scene.add(side);
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const keys=['plate','strap','block','bracket','fork','wheel','sensor','spring','housing','channel','tower'];
function shot(o){
 if(o.dn&&o.dn!==dn){dn=o.dn;viewer.build(dn);}
 const L=viewer.laser;
 viewer.setTheme(!!o.dark);if(!o.dark)scene.background.set(o.bg||'#ffffff');
 if(o.process){viewer.mode='process';viewer.setMode('process');viewer.setSections({pipe:o.cut!==false,shield:false,hideBladder:false,hideRobot:!!o.hideRobot,holder:false});viewer.time=o.time??2.99;viewer.ambientClock=0;viewer.updateParts();viewer.processPose();}
 else{
  viewer.mode='explore';viewer.setMode('explore');viewer.setSections({pipe:true,hideRobot:o.robot!==true,holder:false,shield:false,hideBladder:false});
  viewer.explode=viewer.targetExplode=0;viewer.updateParts();viewer.resetPose();
  // Fahrstellung: Bumper vakuumiert, obere Baugruppe abgesenkt.
  if(o.travel!==false)viewer.travelPose();
  viewer.feed.visible=false;viewer.floor.visible=false;
  // view: 'assembly' komplette Schalung, 'unit' nur Unterteil, 'heck' nur Heckmodul.
  const view=o.view||'assembly';for(const p of viewer.parts)p.node.visible=view==='assembly'||(view==='unit'&&p.group==='u');
  viewer.winding.group.visible=viewer.inlet.visible=viewer.sensor.visible=view==='assembly';
  L.group.visible=true;L.pose(0,0,{visible:!!o.laserOn,red:o.laserOn==='red',green:o.laserOn==='green'});
 }
 L.setExplode(o.explode||0);L.setDeflection(o.deflection||0);
 for(const k of keys)L.parts[k].visible=!o.parts||o.parts.includes(k);
 L.cable.visible=!o.parts||o.parts.includes('cable');
 if(o.highlight){for(const k of keys)L.parts[k].traverse(m=>{if(m.isMesh&&m.material.emissive){if(!m.userData.baseEmissive)m.userData.baseEmissive=m.material.emissive.clone();m.material=m.material.clone();m.material.emissive.set(o.highlight.includes(k)?'#1e88ac':'#000000');m.material.emissiveIntensity=o.highlight.includes(k)?.35:0;}});}
 viewer.model.updateMatrixWorld(true);
 const target=V(...o.target),pos=V(...o.pos);
 if(o.ortho){
  const s=o.ortho,cam=new THREE.OrthographicCamera(-s*width/height,s*width/height,s,-s,1,20000);cam.position.copy(pos);cam.up.set(...(o.up||[0,1,0]));cam.lookAt(target);cam.updateMatrixWorld();renderer.render(scene,cam);
 }else{camera.position.copy(pos);camera.up.set(0,1,0);camera.fov=o.fov||32;camera.updateProjectionMatrix();camera.lookAt(target);camera.updateMatrixWorld();viewer.inspectionLamp.visible=!!o.lamp;renderer.render(scene,camera);}
 const cam=o.ortho?null:camera,anchors={};
 if(cam)for(const k of [...keys,'cable']){const g=k==='cable'?L.cable:L.parts[k];if(!g.visible)continue;const b=new THREE.Box3().setFromObject(g);if(b.isEmpty())continue;const c=b.getCenter(V(0,0,0)).project(cam);anchors[k]=[(c.x+1)/2,(1-c.y)/2];}
 return {img:renderer.domElement.toDataURL('image/jpeg',.92).split(',')[1],anchors};
}
window.stills={shot,viewer,info:()=>({bottom:viewer.bottom,radius:viewer.radius,geo:viewer.laser.geo})};window.ready=true;
