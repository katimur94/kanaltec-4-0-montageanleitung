import * as THREE from 'three';
import {imprints} from './repair-surface.js';

// Illustrative tool dimensions, not a manufacturer specification.
export const millingSpec={width:60,depth:16,motorLength:205,spindleX:62,outerRadius:178,branchEdge:18};
// Developed oval, inset from the 500 mm shield and its lateral sealing edge.
// Illustrative casting footprint, not a manufacturer dimension.
const oldLeft=-165*.998,oldRight=165*1.002;
const left=(oldLeft+Math.min(...imprints.map(p=>p.x-p.r)))/2;
const right=(oldRight+Math.max(...imprints.map(p=>p.x+p.r)))/2;
export function repairFootprint(R,a,closed=false){
 // The closed mould is positioned by its inlet, 66 mm from the shield centre.
 // Compact, only slightly oval casting (260 x 230 mm in the developed wall).
 // It encloses the defect and both translated imprints without moving ports.
 if(closed)return [40+130*Math.cos(a),115*Math.sin(a)];
 const x=165,z=67,c=Math.cos(a),s=Math.sin(a);
 const d=1/Math.sqrt((c/x)**2+(s/z)**2);
 const edge=1+.003*Math.sin(11*a)+.002*Math.cos(17*a);
 // Halve each end clearance, measured from the outer edge of its imprint.
 // Only longitudinal coordinates change; the accepted width stays identical.
 return [THREE.MathUtils.lerp(left,right,(d*c*edge-oldLeft)/(oldRight-oldLeft)),d*s*edge];
}
const clamp=x=>THREE.MathUtils.clamp(x,0,1);
export function millingState(t){
 const trim=clamp((t-.12)/.28),outer=clamp((t-.43)/.47);
 return {trim,outer,active:t<1,trimming:t<.4,
  exchange:t>=1&&t<2,angle:Math.PI*2*(t<.4?trim*3:outer)};
}

export function millingTarget(R,state,contour,bottom,branchRadius,closed=false){
 const a=state.angle,w=millingSpec.width,d=millingSpec.depth;
 if(state.trimming){
  const u=state.trim||0,r=branchRadius+6-w/2;
  if(closed==='pipe'){const [x,arc]=contour(a),inset=1-16/Math.hypot(x,arc);return {point:new THREE.Vector3(x*inset,R-36+u*60,R*Math.sin(arc*inset/R)),normal:new THREE.Vector3(0,1,0)};}
  return {point:new THREE.Vector3(r*Math.cos(a),R-36+u*60,r*Math.sin(a)),normal:new THREE.Vector3(0,1,0)};
 }
 const [x,arc]=repairFootprint(R,a,closed),inset=1-w/2/Math.hypot(x,arc),p=arc*inset,normal=new THREE.Vector3(0,Math.cos(p/R),Math.sin(p/R));
 return {point:new THREE.Vector3(x*inset,(R+d/2)*normal.y,(R+d/2)*normal.z),normal};
}
