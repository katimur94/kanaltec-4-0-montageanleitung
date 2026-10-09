// Exportiert die Bezugsgeometrie der Positionierhilfe (src/laser-aid.js) für den
// Druckteile-Generator. Bezug: Oberkante Verlängerungsplatte = y 0 (untere Baugruppe),
// Rohrachse = y 0 (Laserkopf). x längs (negativ = nach hinten), z quer.
import {writeFileSync} from 'node:fs';
import {families} from '../../src/data.js';
import {heck,heckGeometry,laserHead,laserSpec,spiralSpec} from '../../src/laser-aid.js';
const dn=families.map(f=>{const R=f.id/2,b=-125-f.spacer.reduce((a,c)=>a+c,0),g=heckGeometry(R,b),t=g.top;
 return{dn:f.id,R,bottom:b,top:t,pivot:[g.pivot.x,g.pivot.y-t],axle:[g.axle.x,g.axle.y-t],contactY:g.contactY-t,
  // Sohle relativ zur Plattenoberkante als Funktion von z: y = -sqrt(R²-z²) - t
  wallAt:[-60,-55,-50,-45,-40,-35,-30,-20,-10,0].map(z=>[z,-Math.sqrt(R*R-z*z)-t])};});
writeFileSync(new URL('./geo.json',import.meta.url),JSON.stringify({ref:400,heck,laserHead,laserX:laserSpec.x,spiralSpec,dn},null,1));
console.log(dn.map(d=>`${d.dn}: axle ${d.axle.map(v=>v.toFixed(2))} contact ${d.contactY.toFixed(2)}`).join('\n'));
