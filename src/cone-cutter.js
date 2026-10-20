import * as THREE from 'three';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;

// Cone cutter for opening the liner (user correction 20.10.2026: the bore is
// opened with a conical cutter, not with the mushroom milling head). Carbide
// taper burr with helical flutes on the CutterCam spindle. Dimensions are
// display assumptions, not a tool specification.
export const coneCutterSpec={mountY:197,baseY:215,tipY:255,baseR:18,tipR:1.2};
// Radius of the cutting cone at a depth below its tip.
export function coneCutterRadius(depth){const c=coneCutterSpec;if(depth<=0)return 0;return Math.min(c.baseR,c.tipR+depth*(c.baseR-c.tipR)/(c.tipY-c.baseY));}

export function makeConeCutter(){
 const c=coneCutterSpec,group=new THREE.Group();group.name='Kegelfräser zum Öffnen des Liners';
 const steel=new THREE.MeshStandardMaterial({color:'#c9ced1',metalness:.88,roughness:.24}),carbide=new THREE.MeshStandardMaterial({color:'#8e969b',metalness:.85,roughness:.32}),flute=new THREE.MeshStandardMaterial({color:'#2a2f33',metalness:.6,roughness:.5});
 const add=(g,m,p=V(),parent=group)=>{const o=new THREE.Mesh(g,m);o.position.copy(p);o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
 // Collet nut on the spindle and short shank.
 add(new THREE.CylinderGeometry(12.5,12.5,9,40),steel,V(0,c.mountY+4.5,0));
 add(new THREE.CylinderGeometry(13,13,4,6),steel,V(0,c.mountY+11,0));
 add(new THREE.CylinderGeometry(5,5,6,24),steel,V(0,c.baseY-2,0));
 // Cutting cone, slightly rounded tip.
 const h=c.tipY-c.baseY,profile=[[0,c.baseY],[c.baseR-.8,c.baseY],[c.baseR,c.baseY+.8],[c.tipR+.5,c.tipY-1],[c.tipR*.5,c.tipY-.2],[0,c.tipY]];
 const body=add(new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),64),carbide);body.name='Hartmetall-Kegel';
 // Helical flutes and cutting edges along the cone.
 const n=10;for(let k=0;k<n;k++){
  const pts=[],edge=[];for(let i=0;i<=40;i++){const u=i/40,y=c.baseY+1+u*(h-3),r=c.baseR-(c.baseR-c.tipR)*(y-c.baseY)/h,a=k/n*TAU+u*1.6;pts.push(V((r+.05)*Math.cos(a),y,(r+.05)*Math.sin(a)));edge.push(V((r+.25)*Math.cos(a+.12),y,(r+.25)*Math.sin(a+.12)));}
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,.55,5,false),flute);
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge),40,.32,5,false),steel);
 }
 const tip=new THREE.Object3D();tip.position.set(0,c.tipY,0);group.add(tip);
 return {group,tip};
}
