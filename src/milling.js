import * as THREE from 'three';

// Illustrative tool, not a manufacturer specification. Only the 50 mm insertion
// and the width/depth relationships are supplied by the user.
export const millingSpec={width:60,depth:16,grooveDepth:6,insertion:50,motorLength:205,spindleX:62,outerRadius:178,branchEdge:18,relief:3,overrun:16};
const clamp=x=>THREE.MathUtils.clamp(x,0,1);
export function millingState(t){
 const trim=clamp((t-.12)/.28),outer=clamp((t-.43)/.47),inner=clamp((t-1.12)/.76);
 return {trim,outer,inner,active:t<2,trimming:t<.4,
  exchange:t>=2&&t<3,branch:t>=1,angle:Math.PI*2*(t<.4?trim*3:t<1?outer:inner<.7?inner/.7*5:(inner-.7)/.3)};
}

export function millingTarget(R,state,contour,bottom,branchRadius){
 const a=state.angle,w=millingSpec.width,d=millingSpec.depth;
 if(state.trimming){
  const u=state.trim||0,r=branchRadius+6-w/2;
  return {point:new THREE.Vector3(r*Math.cos(a),R-36+u*60,r*Math.sin(a)),normal:new THREE.Vector3(0,1,0)};
 }
 if(state.branch){
  const radial=new THREE.Vector3(Math.cos(a),0,Math.sin(a));
  // A vertical spindle fits through the branch. The disk's rim cuts the wall;
  // the resulting internal groove is one disk thickness high.
  const u=state.inner??1,preparing=u<.7,top=millingSpec.branchEdge+millingSpec.insertion+d/2+millingSpec.overrun;
  const height=preparing?THREE.MathUtils.lerp(millingSpec.branchEdge,top-d/2,u/.7):millingSpec.branchEdge+millingSpec.insertion;
  return {point:radial.multiplyScalar(branchRadius+(preparing?millingSpec.relief:millingSpec.grooveDepth)-w/2).setY(R+height),normal:new THREE.Vector3(0,1,0)};
 }
 const r=millingSpec.outerRadius-w/2,p=Math.sin(a)*r,normal=new THREE.Vector3(0,Math.cos(p/R),Math.sin(p/R));
 return {point:new THREE.Vector3(Math.cos(a)*r,(R+d/2)*normal.y,(R+d/2)*normal.z),normal};
}
