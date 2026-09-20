import * as THREE from 'three';

// Illustrative tool dimensions, not a manufacturer specification.
export const millingSpec={width:60,depth:16,motorLength:205,spindleX:62,outerRadius:178,branchEdge:18};
const clamp=x=>THREE.MathUtils.clamp(x,0,1);
export function millingState(t){
 const trim=clamp((t-.12)/.28),outer=clamp((t-.43)/.47);
 return {trim,outer,active:t<1,trimming:t<.4,
  exchange:t>=1&&t<2,angle:Math.PI*2*(t<.4?trim*3:outer)};
}

export function millingTarget(R,state,contour,bottom,branchRadius){
 const a=state.angle,w=millingSpec.width,d=millingSpec.depth;
 if(state.trimming){
  const u=state.trim||0,r=branchRadius+6-w/2;
  return {point:new THREE.Vector3(r*Math.cos(a),R-36+u*60,r*Math.sin(a)),normal:new THREE.Vector3(0,1,0)};
 }
 const r=millingSpec.outerRadius-w/2,p=Math.sin(a)*r,normal=new THREE.Vector3(0,Math.cos(p/R),Math.sin(p/R));
 return {point:new THREE.Vector3(Math.cos(a)*r,(R+d/2)*normal.y,(R+d/2)*normal.z),normal};
}
