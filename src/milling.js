import * as THREE from 'three';

// Illustrative tool dimensions, not a manufacturer specification.
export const millingSpec={width:60,depth:16,motorLength:205,spindleX:62,outerRadius:178,branchEdge:18};
// Developed oval, inset from the 500 mm shield and its lateral sealing edge.
// Illustrative casting footprint, not a manufacturer dimension.
export function repairFootprint(R,a){
 const x=222,z=Math.min(135,(R-12)*.82),c=Math.cos(a),s=Math.sin(a);
 const d=Math.pow(Math.pow(Math.abs(c)/x,2.6)+Math.pow(Math.abs(s)/z,2.6),-1/2.6);
 const edge=1+.003*Math.sin(11*a)+.002*Math.cos(17*a);
 return [d*c*edge,d*s*edge];
}
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
 const [x,arc]=repairFootprint(R,a),inset=1-w/2/Math.hypot(x,arc),p=arc*inset,normal=new THREE.Vector3(0,Math.cos(p/R),Math.sin(p/R));
 return {point:new THREE.Vector3(x*inset,(R+d/2)*normal.y,(R+d/2)*normal.z),normal};
}
