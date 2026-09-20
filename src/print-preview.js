import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {ThreeMFLoader} from 'three/examples/jsm/loaders/3MFLoader.js';
const data=window.PRINT_DATA,scene=new THREE.Scene();scene.background=new THREE.Color('#17222c');
const camera=new THREE.PerspectiveCamera(36,1,.1,5000),renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));document.querySelector('#view').append(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
scene.add(new THREE.HemisphereLight('#f0f7ff','#77889c',2));const lamp=new THREE.DirectionalLight('#ffffff',3);lamp.position.set(-100,-100,250);scene.add(lamp);
let model;const select=document.querySelector('#model'),size=document.querySelector('#size');
for(const [i,row]of data.models.entries()){const name={'01-Roboter-und-Schalung':'Roboter mit Schalungssystem','02-Nur-Schalung':'Nur Schalungssystem','03-Rohrsanierung-Schnitt':'Rohrsanierung im Schnitt'}[row.kind];select.add(new Option(name,String(i)));}
for(const row of data.variants)size.add(new Option(row.label,row.id));size.value='06-Standard-200-FDM';
function update(){
 if(model){scene.remove(model);model.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});}
 const bytes=Uint8Array.from(atob(data.models[Number(select.value)].base64),c=>c.charCodeAt(0));model=new ThreeMFLoader().parse(bytes.buffer);scene.add(model);
 model.rotation.x=-Math.PI/2;const box=new THREE.Box3().setFromObject(model),c=box.getCenter(new THREE.Vector3()),s=box.getSize(new THREE.Vector3());model.position.sub(c);
 camera.position.set(-s.x*.65,Math.max(s.x*.36,s.y*1.5),s.x*.8);controls.target.set(0,0,0);controls.update();
 model.traverse(o=>{if(o.isMesh){o.userData.color=o.material.color.clone();o.material.roughness=.65;o.material.metalness=.05;}});mono();links();
}
function mono(){model?.traverse(o=>{if(o.isMesh)o.material.color.copy(document.querySelector('#mono').checked?new THREE.Color('#c3cad0'):o.userData.color);});}
function links(){const kind=data.models[Number(select.value)].kind,row=data.reports.find(r=>r.variant===size.value&&r.model===kind);document.querySelector('#dimensions').textContent=row.dimensions_mm.join(' × ')+' mm';document.querySelector('#stl').href=size.value+'/'+kind+'-einfarbig.stl';document.querySelector('#color').href=size.value+'/'+kind+'-farbig.3mf';}
select.onchange=update;size.onchange=links;document.querySelector('#mono').onchange=mono;update();
document.querySelector('#side').onclick=()=>{const s=new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());camera.position.set(0,0,Math.max(s.x,s.y)*1.8);controls.target.set(0,0,0);controls.update();};
document.querySelector('#perspective').onclick=update;
function animate(){const host=document.querySelector('#view'),w=host.clientWidth,h=host.clientHeight;if(renderer.domElement.width!==w*renderer.getPixelRatio()||renderer.domElement.height!==h*renderer.getPixelRatio()){renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}controls.update();renderer.render(scene,camera);requestAnimationFrame(animate);}animate();
window.printPreview={scene,renderer,camera,controls};
