import * as THREE from 'three';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;

// Injection cone (working name "Verpresskegel"; the part has no name yet).
// Shape after the user's photos of 20.10.2026: black rubber cone, a red
// sealing pad on the wide face with a black rubber ring around the central
// outlet, a brass hose barb on the flank and a threaded bore underneath that
// takes the CutterCam spindle instead of the milling head. Dimensions are
// estimated from the hand photos (pad about 76 mm), not manufacturer data.
export const coneSpec={
 mountY:197,        // cone underside on the spindle nut (cutter-group frame)
 height:55,         // underside to pad face
 padOuter:38,padInner:13,padBottom:48,padTop:55,
 outlet:8,          // free outlet radius through ring and body
 barbY:24,          // barb axis above the underside, pointing backwards (-x)
 maxSquash:9,       // rubber top compression limit (display value)
 flexFrom:41        // the rubber cone deforms above this height
};

function residueTexture(seed,base,smear,size=256){
 // Dried mortar smears on dark rubber, as on the photos. Tileable value noise.
 const data=new Uint8Array(size*size*4);let s=seed;const rnd=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
 const g=32,grid=Array.from({length:g*g},rnd),at=(x,y)=>grid[((y%g+g)%g)*g+((x%g+g)%g)];
 const noise=(u,v,f)=>{const x=u*f,y=v*f,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
  const a=at(ix,iy),b=at(ix+1,iy),c=at(ix,iy+1),d=at(ix+1,iy+1);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size,n=.55*noise(u,v,4)+.3*noise(u+.3,v,8)+.15*noise(u,v+.6,16);
  const k=THREE.MathUtils.smoothstep(n,.6,.74)*(.55+.45*noise(u,v,32));
  const c=base.map((b,i)=>Math.round(b+(smear[i]-b)*k));data.set([...c,255],(y*size+x)*4);
 }
 const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
}

export function makeInjectionCone(){
 const group=new THREE.Group();group.name='Verpresskegel (Arbeitsname) · auf der CutterCam-Spindel';
 const rubber=new THREE.MeshStandardMaterial({color:'#ffffff',map:residueTexture(4711,[22,24,27],[150,148,140]),roughness:.66,metalness:.02,envMapIntensity:.6,side:THREE.DoubleSide});
 const red=new THREE.MeshStandardMaterial({color:'#ffffff',map:residueTexture(911,[176,36,58],[214,170,170]),roughness:.82,metalness:0,side:THREE.DoubleSide});
 const ringMat=new THREE.MeshStandardMaterial({color:'#0d0f11',roughness:.55,metalness:.02,side:THREE.DoubleSide});
 const brass=new THREE.MeshStandardMaterial({color:'#b8995a',roughness:.33,metalness:.78,side:THREE.DoubleSide});
 const dark=new THREE.MeshStandardMaterial({color:'#050607',roughness:.9,metalness:0,side:THREE.DoubleSide});
 const add=(g,m,parent=group)=>{const o=new THREE.Mesh(g,m);o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
 const lathe=(pts,n=72)=>new THREE.LatheGeometry(pts.map(([r,y])=>new THREE.Vector2(r,y)),n);
 const c=coneSpec;
 // Rubber body: threaded underside boss, cone flank, cylindrical band under
 // the pad, then the top face and the central channel.
 const body=add(lathe([[c.outlet,30],[10,12],[10,0],[20.5,0],[22,1.5],[22,4],[35.6,40],[37,41.2],[37,47.2],[36.4,48],[c.outlet,48]]),rubber);body.name='Gummikegel';
 add(lathe([[10,.1],[10,12],[c.outlet,30]],36),dark); // threaded bore (dark)
 add(lathe([[c.outlet-.2,30],[c.outlet-.2,52.2]],36),dark); // outlet channel
 const ring=add(lathe([[c.outlet,47.8],[c.padInner,47.8],[c.padInner,52.4],[c.outlet,52.4]]),ringMat);ring.name='Gummiring um den Auslass';
 body.userData.rest=Float32Array.from(body.geometry.attributes.position.array);ring.userData.rest=Float32Array.from(ring.geometry.attributes.position.array);
 // Red sealing pad, deformable: it conforms to the liner when pressed.
 const padProfile=[[c.padInner,c.padBottom+.2],[c.padOuter-.4,c.padBottom+.2],[c.padOuter+.6,c.padBottom+1.2],[c.padOuter+.6,c.padTop-1],[c.padOuter-.2,c.padTop],[c.padInner+.6,c.padTop],[c.padInner,c.padTop-.6],[c.padInner,c.padBottom+.2]];
 const pad=add(lathe(padProfile,96),red);pad.name='Rote Dichtauflage';
 pad.userData.rest=Float32Array.from(pad.geometry.attributes.position.array);
 // Brass hose barb on the flank, pointing back towards the robot.
 const barb=new THREE.Group();barb.name='Messing-Schlauchtülle';barb.position.set(-(22+(35.6-22)*(c.barbY-4)/36)+1.5,c.barbY,0);barb.rotation.z=Math.PI/2;group.add(barb);
 add(new THREE.CylinderGeometry(9.5,9.5,6,32),brass,barb).position.y=3;
 const ribs=[[4.2,31],[6.2,31]];for(let i=0;i<5;i++){const y=30-i*4.6;ribs.push([7.1,y-1.2],[6.2,y-4.4]);}ribs.push([6.2,6],[4.2,6]);
 add(lathe(ribs.map(([r,y])=>[r,y]),40),brass,barb);add(lathe([[4.25,6.2],[4.25,30.8]],24),dark,barb);
 group.userData.barbTip=V(0,31,0);
 const out=new THREE.Object3D();out.position.set(0,c.padTop,0);group.add(out);
 return {group,pad,body,ring,barb,outlet:out,flex:[pad,body,ring],materials:[rubber,red,ringMat,brass,dark]};
}

// Press the rubber top against the inside of a pipe wall of radius RL (pipe
// axis = world x). Points that would pass the wall slide back along the tool
// axis; the rubber below follows proportionally down to flexFrom. Returns the
// largest compression of the pad face.
export function conformPad(cone,RL){
 const c=coneSpec;cone.group.updateMatrixWorld(true);const m=cone.group.matrixWorld,axis=V().setFromMatrixColumn(m,1).normalize(),p=V();let squash=0;
 const a2=axis.y*axis.y+axis.z*axis.z;
 for(const o of cone.flex){
  const rest=o.userData.rest,a=o.geometry.attributes.position;
  for(let i=0;i<a.count;i++){
   const x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2];
   if(y<=c.flexFrom){a.setXYZ(i,x,y,z);continue;}
   // Wall distance along the axis from the pad face above this point.
   p.set(x,c.padTop,z).applyMatrix4(m);
   const b=p.y*axis.y+p.z*axis.z,cc=p.y*p.y+p.z*p.z-RL*RL,disc=b*b-a2*cc,lambda=disc>=0?(-b+Math.sqrt(disc))/a2:0;
   const push=Math.max(-c.maxSquash,Math.min(0,lambda)),w=THREE.MathUtils.clamp((y-c.flexFrom)/(c.padTop-c.flexFrom),0,1);
   a.setXYZ(i,x,y+push*w,z);if(o===cone.pad)squash=Math.max(squash,-push*(1-THREE.MathUtils.clamp((c.padBottom-c.flexFrom)/(c.padTop-c.flexFrom),0,1)));
  }
  a.needsUpdate=true;o.geometry.computeVertexNormals();
 }
 return squash;
}
export function restPad(cone){for(const o of cone.flex){const a=o.geometry.attributes.position;a.array.set(o.userData.rest);a.needsUpdate=true;o.geometry.computeVertexNormals();}}
