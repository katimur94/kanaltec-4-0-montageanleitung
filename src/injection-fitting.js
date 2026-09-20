import * as THREE from 'three';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
// User-described reusable 45-degree brass elbow. Dimensions are illustrative.
export function injectionFitting(){
 const group=new THREE.Group();group.name='Wiederverwendbarer 45°-Messingwinkel';
 const brass=new THREE.MeshStandardMaterial({color:'#bc914b',metalness:.78,roughness:.3});
 const dark=new THREE.MeshStandardMaterial({color:'#665334',metalness:.62,roughness:.4});
 const direction=V(-Math.SQRT1_2,-Math.SQRT1_2,0),points=[V(0,9),V(0,-6)];
 for(let i=1;i<=12;i++){const a=i/12*Math.PI/4;points.push(V(-12+12*Math.cos(a),-6-12*Math.sin(a)));}
 const bendEnd=points.at(-1).clone(),end=bendEnd.clone().addScaledVector(direction,18);points.push(end);
 const curve=new THREE.CurvePath();for(let i=1;i<points.length;i++)curve.add(new THREE.LineCurve3(points[i-1],points[i]));
 const body=new THREE.Mesh(new THREE.TubeGeometry(curve,80,6.5,16,false),brass);group.add(body);
 function collar(radius,length,centre,axis,material=brass,sides=48){
  const shape=new THREE.Shape();
  if(sides===6){for(let i=0;i<=6;i++){const a=i/6*Math.PI*2;i?shape.lineTo(radius*Math.cos(a),radius*Math.sin(a)):shape.moveTo(radius,0);}}
  else shape.absarc(0,0,radius,0,Math.PI*2,false);
  const hole=new THREE.Path();hole.absarc(0,0,3.9,0,Math.PI*2,true);shape.holes.push(hole);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:length,bevelEnabled:false,curveSegments:24});geometry.translate(0,0,-length/2);
  const o=new THREE.Mesh(geometry,material);
  o.quaternion.setFromUnitVectors(V(0,0,1),axis);o.position.copy(centre);group.add(o);return o;
 }
 collar(11.4,2,V(0,9),V(0,1,0));
 collar(9,5,V(0,3),V(0,1,0),brass,6);
 for(const y of [-.5,-2,-3.5])collar(6.85,.45,V(0,y),V(0,1,0),dark);
 collar(8.1,8,bendEnd.clone().addScaledVector(direction,7),direction,brass,6);
 collar(6.2,7,bendEnd.clone().addScaledVector(direction,14.5),direction);
 for(const d of [12,14,16])collar(6.65,.8,bendEnd.clone().addScaledVector(direction,d),direction,dark);
 group.userData={hoseEnd:end,hoseDirection:direction,flowPoints:points,flangeRadius:11.4,angle:45};
 group.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});return group;
}
