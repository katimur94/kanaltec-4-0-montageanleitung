import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {makeCutter} from './cutter.js';
const host=document.querySelector('#model'),scene=new THREE.Scene();scene.background=new THREE.Color('#e6e9eb');
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;host.appendChild(renderer.domElement);
const camera=new THREE.PerspectiveCamera(35,1,1,3000),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();
scene.add(new THREE.HemisphereLight('#ffffff','#646974',2));const light=new THREE.DirectionalLight('#ffffff',3);light.position.set(200,400,300);scene.add(light);
const cutter=makeCutter();scene.add(cutter.group);
const presets={iso:[320,225,390],side:[30,100,480],front:[480,120,0],top:[62,550,.1]};
function fit(view){camera.position.set(...presets[view]);controls.target.set(35,90,0);controls.update();}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>fit(b.dataset.view));fit('iso');
document.querySelector('#rotate').onchange=e=>{controls.autoRotate=e.target.checked;};
new ResizeObserver(()=>{renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();}).observe(host);
function frame(){requestAnimationFrame(frame);controls.update();renderer.render(scene,camera);}frame();
