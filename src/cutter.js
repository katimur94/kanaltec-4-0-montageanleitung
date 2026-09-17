import * as THREE from 'three';
import {millingSpec} from './milling.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
function gritTexture(){
 const data=new Uint8Array(64*64*4);let seed=245;
 for(let i=0;i<4096;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=85+(seed>>>25)*4;data.set([n,n,n,255],4*i);}
 const t=new THREE.DataTexture(data,64,64);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.needsUpdate=true;return t;
}
// IBAK brochure pp. 6–7: longitudinal BG1 motor, top spindle, front-facing
// FrontCam. User photo: red mushroom crown. SDT pp. 14–17: segment topology.
// Photo-derived dimensions, not an identified part number or manufacturer CAD.
export function makeCutter(){
 const group=new THREE.Group();group.name='MicroGator · BG1-Bauform mit FrontCam und Pilzfräser';
 const mat=(color,metalness=.6,roughness=.35)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
 const black=mat('#171b20'),cover=mat('#25292e'),steel=mat('#acb2b5',.87,.24),polished=mat('#d0d6d8',.9,.2),red=mat('#8e2828',.4,.57),yellow=mat('#ecb922',.1,.65),rubber=mat('#080b0f',.03,.68);
 const abrasive=mat('#746e66',.55,.88);abrasive.bumpMap=gritTexture();abrasive.bumpScale=.5;
 const add=(g,m,p=V(),parent=group)=>{const o=new THREE.Mesh(g,m);o.position.copy(p);o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
 const cyl=(r,h,m,p,axis='y',parent=group,n=48)=>{const o=add(new THREE.CylinderGeometry(r,r,h,n),m,p,parent);if(axis==='x')o.rotation.z=-Math.PI/2;if(axis==='z')o.rotation.x=Math.PI/2;return o;};
 const bevel=(w,h,d,m,p,b=2,parent=group)=>{
  const s=new THREE.Shape();s.moveTo(-w/2+b,-h/2);s.lineTo(w/2-b,-h/2);s.lineTo(w/2,-h/2+b);s.lineTo(w/2,h/2-b);s.lineTo(w/2-b,h/2);s.lineTo(-w/2+b,h/2);s.lineTo(-w/2,h/2-b);s.lineTo(-w/2,-h/2+b);s.closePath();
  const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:.5,bevelThickness:.5,bevelSegments:2});g.translate(0,0,-d/2);return add(g,m,p,parent);
 };
 const bolt=(p,axis='z',r=3)=>{cyl(r,2,steel,p,axis,group,12);cyl(r*.46,2.1,rubber,p,axis,group,6);};
 const ring=(r,t,p,axis='y',m=rubber)=>{const o=add(new THREE.TorusGeometry(r,t,8,64),m,p);if(axis==='y')o.rotation.x=Math.PI/2;if(axis==='x')o.rotation.y=Math.PI/2;return o;};
 const housing=bevel(148,77,86,black,V(40,36,0),10);housing.name='Längsliegendes Motorgehäuse';
 for(const z of [-44,44])bevel(127,61,1.8,cover,V(39,35,z),6);
 bevel(123,6,74,steel,V(41,76,0),3);
 for(const z of [-45.5,45.5])for(const [x,y] of [[-17,12],[-17,60],[94,12],[94,60]])bolt(V(x,y,z));
 // Rear fork on the existing fourth axis; no second mould receiver in cutter mode.
 for(const z of [-48,48]){
  bevel(71,54,12,steel,V(-29,0,z),11);cyl(14,16,black,V(-43,0,z),'z');bolt(V(-43,0,z+Math.sign(z)*9),'z',7);
  cyl(10,16,steel,V(-43,-44,z*.78),'z');
 }
 cyl(11,108,steel,V(-43,0,0),'z');bevel(47,20,80,black,V(-32,-31,0),3);
 const sx=millingSpec.spindleX;
 bevel(66,7,66,black,V(sx,82,0),5);
 for(const x of [-25,25])for(const z of [-25,25])bolt(V(sx+x,86,z),'y',3.5);
 cyl(26,6,steel,V(sx,88,0));
 const neck=add(new THREE.CylinderGeometry(18,24,51,64),black,V(sx,116.5,0));neck.name='Konischer Spindelhals';
 ring(23.8,.8,V(sx,94,0));ring(18.5,.65,V(sx,142,0));
 cyl(18.5,9,polished,V(sx,146.5,0));cyl(11.5,38,steel,V(sx,170,0));
 cyl(14,8,polished,V(sx,193,0),'y',group,6);cyl(9,5,steel,V(sx,199.5,0));
 for(const z of [-25,25]){
  const curve=new THREE.CatmullRomCurve3([V(-50,13,z),V(-38,48,z),V(-16,68,z),V(15,79,z)]);
  add(new THREE.TubeGeometry(curve,24,2.1,8,false),z>0?mat('#b69d62',.45,.55):rubber);cyl(4.5,9,steel,V(15,79,z));
 }
 const camera=new THREE.Group();camera.name='FrontCam · axial nach vorne';group.add(camera);camera.position.set(121,33,0);
 cyl(29,21,black,V(),'x',camera);cyl(27,6,cover,V(13,0,0),'x',camera);
 for(const x of [-7,-2,3]){const o=add(new THREE.TorusGeometry(29.3,1,8,48),rubber,V(x,0,0),camera);o.rotation.y=Math.PI/2;}
 const glass=mat('#051019',.5,.1);cyl(9.5,2,steel,V(17,1,0),'x',camera);cyl(7.3,2.3,glass,V(18,1,0),'x',camera);
 const ledMat=new THREE.MeshStandardMaterial({color:'#fff1bb',emissive:'#e9d79f',emissiveIntensity:.7,roughness:.25});
 for(const z of [-11,11])cyl(3.6,2,ledMat,V(18,-13,z),'x',camera);
 for(const z of [-17,17])cyl(2.2,2.4,steel,V(17,12,z),'x',camera,12);
 for(const side of [-1,1]){
  const mark=new THREE.Group();mark.position.set(49,45,side*46.1);if(side<0)mark.rotation.y=Math.PI;group.add(mark);
  const triangle=(size,material,z)=>{const s=new THREE.Shape();s.moveTo(-size/2,size*.3);s.lineTo(size/2,size*.3);s.lineTo(0,-size*.55);s.closePath();add(new THREE.ShapeGeometry(s),material,V(0,0,z),mark);};
  triangle(34,yellow,0);triangle(28,black,.1);triangle(24,yellow,.2);
  for(const x of [-5,0,5]){const pts=[V(x,-3,.4),V(x-1,0,.4),V(x+1,3,.4),V(x,6,.4)];add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),12,.55,5,false),black,V(),mark);}
 }
 const disk=new THREE.Group();disk.name='Gewölbter segmentierter Pilzfräser';disk.position.set(sx,millingSpec.motorLength,0);group.add(disk);
 const r=millingSpec.width/2,h=millingSpec.depth;
 const profile=[[5,-h/2],[14,-h/2],[r-3,-h*.4],[r,-h*.2],[r,h*.08],[r-3,h*.28],[r*.6,h*.43],[7,h*.5],[5,h*.5],[5,-h/2]];
 add(new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),96),red,V(),disk);
 for(let i=0;i<10;i++){
  const a=i/10*TAU,slot=bevel(r*.65,.7,2.5,rubber,V(Math.cos(a)*r*.64,h*.34,Math.sin(a)*r*.64),.1,disk);slot.rotation.y=-a;slot.rotation.z=-.11;
 }
 for(let i=0;i<5;i++){
  const a=i/5*TAU+.22,top=bevel(20,3.2,6.5,abrasive,V(Math.cos(a)*18,h*.39,Math.sin(a)*18),.8,disk);top.rotation.y=-a;top.rotation.z=-.13;
  const side=bevel(3.6,7,13,abrasive,V(Math.cos(a+.4)*(r-.7),-1,Math.sin(a+.4)*(r-.7)),.5,disk);side.rotation.y=-(a+.4);
 }
 cyl(6.2,2,steel,V(0,h*.47,0),'y',disk);cyl(3,2.2,rubber,V(0,h*.49,0),'y',disk,6);
 return {group,disk,housing,neck,camera};
}
