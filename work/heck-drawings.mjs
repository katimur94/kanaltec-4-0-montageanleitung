import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {families} from '../src/data.js';
import {heck,heckGeometry,laserSpec,plateHoles,LaserAid,laserFan,laserHead,spiralEnds,spiralSpec,tubeTravelY} from '../src/laser-aid.js';

// Technische Zeichnungen und Montageanleitung der Laser-Positionierhilfe v3 als PDF (A3 quer).
// Alle Maße kommen aus src/laser-aid.js (dieselbe Geometrie wie Website und Tests).
// Bilder: work/qa/heck/*.jpg aus work/render-heck-stills.mjs (work/heck-shots.json).
//   node work/heck-drawings.mjs   → work/qa/heck/zeichnungen.html + Zeichnungen/Laser-Positionierhilfe-DSS-Flex.pdf
// Status: Entwurf. Maße, die nicht aus DiTom-Unterlagen stammen, sind Konstruktionsvorschläge.

const OUT_PDF=path.resolve('Zeichnungen/Laser-Positionierhilfe-DSS-Flex.pdf'),OUT_HTML=path.resolve('work/qa/heck/zeichnungen.html');
const IMG=path.resolve('work/qa/heck');
const DATE='09.10.2026',TITLE='DSS-Flex · Laser-Positionierhilfe v3';
const REF=families.find(f=>f.id===400),Rref=REF.id/2,bottomRef=-125-REF.spacer.reduce((a,b)=>a+b,0),G=heckGeometry(Rref,bottomRef);
const S=heck,H=laserHead,top=G.top;
// Zeichnungskoordinaten: x' ab Stoßfuge nach hinten, y' über Plattenoberkante, z quer (+ = Gegenseite zum Rad).
const X=x=>-68-x,Y=y=>y-top;
const r1=v=>Math.round(v*10)/10,fmt=v=>String(r1(v)).replace('.',',');
const pivot=[X(G.pivot.x),Y(G.pivot.y)],axle=[X(G.axle.x),Y(G.axle.y)],armLen=Math.hypot(axle[0]-pivot[0],axle[1]-pivot[1]);
const laserX=X(laserSpec.x),shieldX=X(-250);
const P={
 plate:{x0:0,x1:X(S.plate.x1),w:S.plate.w,t:S.plate.t,corner:S.plate.corner},
 notch:{x0:X(S.plate.notch.x0),z0:S.plate.notch.z0,z1:S.plate.notch.z1},
 strap:{x0:X(S.strap.x1),x1:X(S.strap.x0),w:S.strap.w,t:S.strap.t},
 block:{x0:X(S.block.x0),x1:X(S.block.x1),z0:S.block.z0,z1:S.block.z1,h:S.block.h,base:S.block.base,slot:S.block.slot},
 bracket:{x0:X(S.bracket.x0),x1:X(S.bracket.x1),web:X(S.bracket.web.x1),z0:S.bracket.z0,z1:S.bracket.z1,t:S.bracket.t,y:Y(G.bracketY)},
 anchor:{x:X(S.anchor.x),h:S.anchor.h},
 seat:{x0:X(S.fork.seat.x0),x1:X(S.fork.seat.x1),z0:S.fork.seat.z0,t:S.fork.seat.t},
 spring:{x:X(S.spring.x),z:S.spring.z,od:S.spring.od,wire:S.spring.wire,free:S.spring.free,coils:S.spring.coils}
};
const holes=plateHoles.map(([x,z,d])=>({x:X(x),z,d}));
// Feder: Einbaulängen aus der Modellkinematik (DN 350–400), Federrate nach DIN EN 13906-1.
const aid=new LaserAid(Rref,bottomRef);aid.setDeflection(0);const L1=G.bracketY-aid.armTop;aid.setDeflection(12);const L2=G.bracketY-aid.armTop;aid.setDeflection(-6);const L3=G.bracketY-aid.armTop;aid.setDeflection(0);
const Gmod=81500,dW=P.spring.wire,Dm=P.spring.od-dW,nA=P.spring.coils,rate=Gmod*dW**4/(8*Dm**3*nA),lever=(pivot[0]-P.spring.x)/(pivot[0]-axle[0]);
const F1=rate*(P.spring.free-L1),F2=rate*(P.spring.free-L2),Lblock=(nA+2)*dW;
const pressLift=8,stroke=pressLift-tubeTravelY;
const dnRows=families.map(f=>{const R=f.id/2,b=-125-f.spacer.reduce((a,c)=>a+c,0),g=heckGeometry(R,b),sp=[tubeTravelY,pressLift].map(l=>{const e=spiralEnds(R,b,l);return e.a.distanceTo(e.b);});
 return{lipLen:(b-S.plate.t/2-S.wiper.t)-g.contactY,label:f.label,R,axle:g.axle.y-g.top,wheelBelow:g.axle.y-S.wheel.r-(b-S.plate.t/2),angle:-(180+g.armAngle*180/Math.PI),tubeAbove:tubeTravelY-g.top,headAboveInvert:tubeTravelY+H.y0+R,spiral:sp};});
const Lopen=-laserSpec.x,Lclosed=-laserSpec.x-66;


// ---------- SVG-Grundelemente (mm) ----------
const n=v=>+(+v).toFixed(3);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const line=(x1,y1,x2,y2,c='v')=>`<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" class="${c}"/>`;
const rect=(x0,y0,x1,y1,c='v',r=0)=>`<rect x="${n(Math.min(x0,x1))}" y="${n(Math.min(y0,y1))}" width="${n(Math.abs(x1-x0))}" height="${n(Math.abs(y1-y0))}" rx="${n(r)}" class="${c}"/>`;
const circ=(x,y,r,c='v')=>`<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" class="${c}"/>`;
const poly=(pts,c='v',close=true)=>`<path d="M${pts.map(p=>n(p[0])+' '+n(p[1])).join('L')}${close?'Z':''}" class="${c}"/>`;
const text=(x,y,s,o={})=>`<text x="${n(x)}" y="${n(y)}" font-size="${o.size||3.5}" text-anchor="${o.anchor||'middle'}"${o.rot?` transform="rotate(${o.rot} ${n(x)} ${n(y)})"`:''} class="${o.cls||'tx'}"${o.weight?` font-weight="${o.weight}"`:''}>${esc(s)}</text>`;
const cross=(x,y,s=5)=>line(x-s,y,x+s,y,'c')+line(x,y-s,x,y+s,'c');
// Maßlinien nach DIN 406: Maßhilfslinien 1 mm Abstand, 2 mm Überstand, Text über der Maßlinie.
function dimH(x1,x2,y1,y2,yd,label,o={}){
 const s=yd<Math.min(y1,y2)?-1:1,e=(y)=>line(0,0,0,0);
 let out=line(x1,y1+s*1,x1,yd+s*2,'d')+line(x2,y2+s*1,x2,yd+s*2,'d');
 const w=Math.abs(x2-x1),lab=label??fmt(w),tw=lab.length*1.85;
 if(w<9){out+=line(Math.min(x1,x2)-7,yd,Math.max(x1,x2)+7,yd,'d')+`<path d="M${n(Math.min(x1,x2)-3)} ${n(yd)}L${n(Math.min(x1,x2))} ${n(yd)}" class="d" marker-end="url(#ar)"/><path d="M${n(Math.max(x1,x2)+3)} ${n(yd)}L${n(Math.max(x1,x2))} ${n(yd)}" class="d" marker-end="url(#ar)"/>`;
  const tx=o.left?Math.min(x1,x2)-8-tw/2:Math.max(x1,x2)+8+tw/2;return out+text(tx,yd-1,lab,{size:3.2});}
 out+=`<path d="M${n(x1)} ${n(yd)}L${n(x2)} ${n(yd)}" class="d" marker-start="url(#ar)" marker-end="url(#ar)"/>`;
 return out+text((x1+x2)/2+(o.dx||0),yd-1,lab,{size:3.2});
}
function dimV(y1,y2,x1,x2,xd,label,o={}){
 const s=xd<Math.min(x1,x2)?-1:1;
 let out=line(x1+s*1,y1,xd+s*2,y1,'d')+line(x2+s*1,y2,xd+s*2,y2,'d');
 const h=Math.abs(y2-y1),lab=label??fmt(h);
 if(h<9){out+=line(xd,Math.min(y1,y2)-7,xd,Math.max(y1,y2)+7,'d')+`<path d="M${n(xd)} ${n(Math.min(y1,y2)-3)}L${n(xd)} ${n(Math.min(y1,y2))}" class="d" marker-end="url(#ar)"/><path d="M${n(xd)} ${n(Math.max(y1,y2)+3)}L${n(xd)} ${n(Math.max(y1,y2))}" class="d" marker-end="url(#ar)"/>`;
  return out+text(xd-1,o.below?Math.max(y1,y2)+8+lab.length*.9:Math.min(y1,y2)-8-lab.length*.9,lab,{size:3.2,rot:-90});}
 out+=`<path d="M${n(xd)} ${n(y1)}L${n(xd)} ${n(y2)}" class="d" marker-start="url(#ar)" marker-end="url(#ar)"/>`;
 return out+text(xd-1,(y1+y2)/2+(o.dy||0),lab,{size:3.2,rot:-90});
}
// Hinweislinie mit Text (z. B. Bohrungen, Durchmesser).
function note(x,y,tx,ty,lab,o={}){const right=o.right??tx>=x,tw=lab.length*1.8+1;return line(x,y,tx,ty,'d')+line(tx,ty,tx+(right?tw:-tw),ty,'d')+circ(x,y,.35,'dot')+text(tx+(right?.5:-.5),ty-1,lab,{size:3,anchor:right?'start':'end'});}
function balloon(bx,by,num,tx,ty){const a=Math.atan2(ty-by,tx-bx);return line(bx+4*Math.cos(a),by+4*Math.sin(a),tx,ty,'d')+circ(tx,ty,.5,'dot')+circ(bx,by,4,'bal')+text(bx,by+1.3,num,{size:3.8,weight:600});}
function spring(x,y0,y1,od,turns){const pts=[];const k=turns*2;for(let i=0;i<=k;i++){const y=y0+(y1-y0)*i/k;pts.push([x+(i===0||i===k?0:(i%2?-od/2:od/2)),y]);}
 return line(x-od/2,y0,x+od/2,y0,'t')+line(x-od/2,y1,x+od/2,y1,'t')+poly(pts,'sp',false);}
function roundRect(x0,y0,x1,y1,r,c='v'){return rect(x0,y0,x1,y1,c,r);}

// ---------- Blattrahmen und Schriftfeld (DIN EN ISO 7200, vereinfacht) ----------
const sheets=[];
function frame(o){
 const tb=[250,252,410,287];let s=rect(20,10,410,287,'frame');
 // Zentrierstriche
 s+=line(215,5,215,10,'t')+line(215,287,215,292,'t')+line(10,148.5,20,148.5,'t')+line(410,148.5,415,148.5,'t');
 s+=rect(tb[0],tb[1],tb[2],tb[3],'tbl');
 s+=line(250,262,410,262,'t')+line(250,270,410,270,'t')+line(250,278,410,278,'t');
 s+=line(330,262,330,287,'t')+line(370,262,370,287,'t');
 s+=text(253,258.6,o.name,{size:4.2,anchor:'start',weight:600})+text(407,258.6,TITLE,{size:2.6,anchor:'end',cls:'mut'});
 const cell=(x,y,k,v,b)=>text(x+2,y+2.6,k,{size:2,anchor:'start',cls:'mut'})+text(x+2,y+6.6,v,{size:3.3,anchor:'start',weight:b?600:400});
 s+=cell(250,262,'Zeichnungs-Nr.',o.no,true)+cell(330,262,'Maßstab',o.scale||'—')+cell(370,262,'Blatt',`${o.idx} / ${o.total}`);
 s+=cell(250,270,'Werkstoff / Halbzeug',o.material||'siehe Stückliste')+cell(330,270,'Datum',DATE)+cell(370,270,'Allgemeintoleranz','ISO 2768-mK');
 s+=cell(250,278,'Status','ENTWURF – nicht für Fertigung freigegeben',true).replace('class="tx" font-weight="600">ENTWURF','class="warn" font-weight="600">ENTWURF')+cell(370,278,'Maße','mm');
 // Projektionssymbol Methode 1 (DIN ISO 5456-2)
 s+=poly([[333,281],[333,285],[341,286.5],[341,279.5]],'t')+line(332,283,342,283,'c')+circ(348,283,3.5,'t')+circ(348,283,2,'t')+line(343.5,283,352.5,283,'c');
 s+=text(357,285.2,'Proj. 1',{size:2.4,anchor:'start',cls:'mut'});
 return s;
}
function sheet(o){sheets.push(o);}
function render(){
 const total=sheets.length;
 return sheets.map((o,i)=>`<section class="sheet"><svg viewBox="0 0 420 297" width="420mm" height="297mm" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${DEFS}${o.svg||''}${frame({...o,idx:i+1,total})}</svg>${o.html||''}</section>`).join('\n');
}
const DEFS=`<defs><marker id="ar" viewBox="0 0 3 1.2" refX="3" refY=".6" markerWidth="3" markerHeight="1.2" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M0 0L3 .6L0 1.2z" fill="#111"/></marker>
<pattern id="hatch" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="2" stroke="#222" stroke-width=".18"/></pattern></defs>`;

// ---------- Bilder ----------
const imgCache={};
async function img(name){return imgCache[name]??=`data:image/jpeg;base64,${(await readFile(path.join(IMG,name+'.jpg'))).toString('base64')}`;}
// Ausschnitt [x0,y0,x1,y1] in Pixeln des 1600×1000-Renders in einen Rahmen (mm) einpassen.
async function pic(name,x,y,w,h,crop=[0,0,1600,1000],o={}){
 const [cx0,cy0,cx1,cy1]=crop;return`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${cx0} ${cy0} ${cx1-cx0} ${cy1-cy0}" preserveAspectRatio="xMidYMid meet"><image href="${await img(name)}" x="0" y="0" width="1600" height="1000"/>${o.overlay||''}</svg>${o.border===false?'':rect(x,y,x+w,y+h,'pic')}`;
}
const anchors=async name=>JSON.parse(await readFile(path.join(IMG,name+'.json'),'utf8'));


const CROP={m:[320,240,1420,730],explosion:[430,90,1290,830],isoHeck:[350,250,1400,730],isoGes:[0,130,1450,1000],unten:[400,130,1340,750],kopf:[80,250,1600,1000],feder:[0,60,1600,940],fahrt:[0,180,1180,780]};

// ---------- Stückliste ----------
const bom=[
 ['','Untere Baugruppe an der Stützplatte (dauerhaft im Abwasser)','','','',''],
 [1,'Verlängerungsplatte','1','EN AW-6082 T6, 7 mm, eloxiert','LPH-111',`${fmt(P.plate.x1)} × ${P.plate.w}, Radausschnitt`],
 [2,'Verbindungslasche','1','1.4301, 6 mm','LPH-111','unter der Stoßfuge, 4 × M6'],
 [3,'Lagerbock (Gabelkopf)','1','EN AW-7075 T6','LPH-120','Schlitz 28, Bohrung Ø8 H7'],
 [4,'Federwinkel mit Zugentlastung','1','EN AW-7075 T6','LPH-120','Federführung Ø13,5, Kabelschelle'],
 [5,'Schwinge','1','EN AW-7075 T6','LPH-120','Lagersitze Ø12 H7, Federteller'],
 [6,'Messrad 200 mm Umfang (Ø63,66), Lauffläche geriffelt','1','Gummi/PU auf Alu-Nabe, Breite ≤ 16','Kaufteil','Bohrung 8 (ggf. von 6 aufbohren)'],
 [7,`Druckfeder ${fmt(dW)} × ${fmt(P.spring.od)} × ${P.spring.free}`,'1','EN 10270-3 (1.4310)','Kaufteil',`n = ${nA}, c ≈ ${fmt(rate)} N/mm`],
 [8,'Drehgeberkopf AS5600, vergossen','1','Gießharz, Kabel PUR 4 × 0,14','LPH-130','Spalt zum Magneten 1,0 ± 0,5'],
 [9,'Radwelle Ø8 h6 × 26','1','1.4305','LPH-120','Stirnseite Senkung Ø6,1 × 2,6'],
 [10,'Magnet Ø6 × 2,5 diametral','1','NdFeB N35, vernickelt','Kaufteil','in Radwelle geklebt'],
 [11,'Rillenkugellager MF128-2RS (8 × 12 × 3,5)','2','Edelstahl, abgedichtet','Kaufteil','in beiden Schwingenarmen'],
 [12,'Lagerbolzen Ø8 × 46, Gleitlager 8 × 10, Sicherungsringe','1 Satz','1.4305; iglidur; DIN 471','Kaufteil',''],
 ['','Laserkopf auf dem Zentralrohr (über dem Wasser)','','','',''],
 [13,'Laserkopf-Gehäuse','1','EN AW-6082 T6, eloxiert','LPH-130',`${Math.abs(H.x1-H.x0)} × ${H.w} × ${H.y1-H.y0}, vergossen`],
 [14,'Rohrschelle Ø21,2 (Unterschale)','2','EN AW-6082 T6','LPH-130','je 1 × M4 × 20'],
 [15,'Linienlaser rot 650 nm, ≤ 1 mW, 60° Linie','1','Klasse 2, Ø12 × 30, 5 V','Kaufteil','Linie quer zur Rohrachse'],
 [16,'Linienlaser grün 520 nm, ≤ 1 mW, 60° Linie','1','Klasse 2, Ø12 × 30, 5 V','Kaufteil','Linie quer zur Rohrachse'],
 [17,'Elektronik Laserkopf','1 Satz','ESP32-C3 SuperMini, MAX3485, Wandler 7–36 V → 5 V, 2 MOSFET','Kaufteil','LPH-140'],
 [18,'Schutzfenster PMMA 2 mm','1','klar, geklebt','LPH-130',''],
 ['','Kabel und Fahrzeug','','','',''],
 [19,`Spiralkabel Messrad ↔ Laserkopf`,'1','PUR 4 × 0,25 mm²','Kaufteil',`Ruhelänge ≈ ${spiralSpec.rest}, Arbeitslänge bis ${spiralSpec.max}`],
 [20,'Spiralkabel Laserkopf → Kabelbombe','1','PUR 4 × 0,25 mm²','Kaufteil','wie die vorhandenen Spiralkabel'],
 [21,'Einbaudose an der Kabelbombe, 4-polig','1','gleiche Bauart wie Drehmotor/Blase/Druckschalter','Kaufteil','Ader 1–4 des Roboterkabels'],
 [22,'Bedienkasten im Fahrzeug','1','ESP32, MAX3485, TM1637, 2 Taster, 2 LED, Summer','LPH-140','12/24 V, Sicherung 1 A'],
 [23,'Schrauben A2 (ISO 7380 M6 × 12, ISO 10642 M5/M4 × 10, ISO 4762 M4 × 35/× 20, M3/M4 × 12)','1 Satz','A2-70, Loctite 243','Kaufteil',''],
 [24,'Sohlenabstreifer (Leiste mit Gummilippe)','2','1.4301 Leiste 49 × 8 × 5; Lippe NBR 70 Shore A, 16 × 3','LPH-111','vor und hinter dem Rad, wischt die Radspur']
];
const bomTable=(rows,o={})=>`<table class="bom${o.small?' small':''}"><thead><tr><th>Pos.</th><th>Benennung</th><th>Menge</th><th>Werkstoff / Ausführung</th><th>Zeichnung</th><th>Bemerkung</th></tr></thead><tbody>${rows.map(r=>r[0]===''?`<tr class="grp"><td colspan="6">${esc(r[1])}</td></tr>`:`<tr>${r.map((c,i)=>`<td${i===0||i===2?' class="c"':''}>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const box=(x,y,w,h,html,cls='')=>`<div class="ov ${cls}" style="left:${x}mm;top:${y}mm;width:${w}mm;${h?`height:${h}mm;`:''}">${html}</div>`;


// =====================================================================
// Blatt 1: Übersicht
// =====================================================================
{
 let svg=await pic('iso-gesamt',25,15,190,118,CROP.isoGes)+await pic('iso-heck',220,15,185,118,CROP.isoHeck);
 svg+=await pic('iso-kopf',25,138,190,70,CROP.kopf)+await pic('iso-heck-unten',220,138,185,70,CROP.unten);
 svg+=text(28,20,'Schalung mit Roboter: Laserkabel von der Kabelbombe, Spiralkabel nach vorn',{size:3,anchor:'start',cls:'cap'})+text(223,20,'Messrad unten an der Stützplatte, Laserkopf oben auf dem Zentralrohr',{size:3,anchor:'start',cls:'cap'});
 svg+=text(28,143,'Laserkopf (vergossen) mit Rohrschellen und Spiralkabeln',{size:3,anchor:'start',cls:'cap'})+text(223,143,'Unterseite: Lasche unter der Stoßfuge, Rad im Ausschnitt',{size:3,anchor:'start',cls:'cap'});
 const html=box(25,213,220,0,`<h1>Laser-Positionierhilfe für DSS-Flex · v3</h1><p>Unten läuft hinter der Stützplatte ein <b>gefedertes Messrad (200 mm Umfang)</b> – vergossen, ohne Gehäuse, für den Dauerbetrieb im Abwasser. Die Laser sitzen als kleiner <b>Laserkopf auf dem Zentralrohr</b> über dem Wasser. Ein Spiralkabel verbindet beide und dehnt sich beim Anpressen. Vom Laserkopf geht ein Spiralkabel zur neuen Steckdose an der Kabelbombe, von dort über die <b>4 freien Adern</b> zum <b>Bedienkasten im Fahrzeug</b>: Restweg in mm, Knopf <b>NULL</b>, Wahl der Schalung. Strom kommt aus dem Fahrzeug – kein Akku.</p>`,'intro');
 const facts=box(250,213,157,0,`<table class="facts"><tr><th>Stoßfuge → Laserebene</th><td>${fmt(laserX)} mm (${fmt(laserX-shieldX)} mm hinter der Schildkante)</td></tr><tr><th>Rückweg L offen / Abschluss</th><td>${Lopen} / ${Lclosed} mm (Modellwert, je Schalung messen)</td></tr><tr><th>Federweg Messrad</th><td>+12 / −6 mm</td></tr><tr><th>Verlängerung der Stützplatte</th><td>${fmt(P.plate.x1)} × ${P.plate.w} × ${P.plate.t} mm</td></tr><tr><th>Adern im Roboterkabel</th><td>4: +24 V, 0 V, RS-485 A, B</td></tr></table>`);
 sheet({name:'Übersicht und Kenndaten',no:'LPH-000',scale:'—',svg,html:html+facts});
}

// =====================================================================
// Blatt 2: Anordnung im Rohr – Seitenansicht 1:2, Schnitte in der Laserebene 1:5
// =====================================================================
{
 const k=.5,ox=90,oy=160,FX=u=>ox+u*k,FY=v=>oy-v*k;let s='';
 const tubeY=l=>Y(l),tY0=tubeY(tubeTravelY),tY1=tubeY(pressLift),hx0=X(H.x0),hx1=X(H.x1);
 s+=text(25,17,'Seitenansicht 1:2 · Blick auf die Radseite · DN 350–400',{size:3.5,anchor:'start',cls:'vt'});
 // Sohle und Wasser
 s+=line(FX(-60),FY(-28.5),FX(300),FY(-28.5),'pipe')+text(FX(300),FY(-28.5)+4,'Sohle (Rohrmitte unten)',{size:2.4,anchor:'end',cls:'mut'});
 s+=line(FX(-60),FY(4.5),FX(300),FY(4.5),'water')+text(FX(300),FY(4.5)-1.2,'Wasser über der Platte (Annahme)',{size:2.4,anchor:'end',cls:'waterT'});
 // Untere Baugruppe
 const bk=P.block,br=P.bracket;
 s+=rect(FX(-60),FY(0),FX(0),FY(-P.plate.t),'ph')+rect(FX(0),FY(0),FX(P.plate.x1),FY(-P.plate.t))+rect(FX(P.strap.x0),FY(-P.plate.t),FX(P.strap.x1),FY(-P.plate.t-P.strap.t));
 for(const wx of S.wiper.xs.map(X))s+=rect(FX(wx-S.wiper.w/2),FY(-P.plate.t),FX(wx+S.wiper.w/2),FY(-P.plate.t-S.wiper.t))+rect(FX(wx-S.wiper.lip.t/2),FY(-P.plate.t-S.wiper.t),FX(wx+S.wiper.lip.t/2),FY(Y(G.contactY)+S.wiper.lip.gap),'v lip');
 s+=circ(FX(axle[0]),FY(axle[1]),S.wheel.r*k)+line(FX(pivot[0]),FY(pivot[1]),FX(axle[0]),FY(axle[1]),'v');
 s+=rect(FX(bk.x0),FY(0),FX(bk.x1),FY(bk.h))+rect(FX(br.x0),FY(bk.h),FX(br.web),FY(br.y))+rect(FX(br.x0),FY(br.y),FX(br.x1),FY(br.y+br.t))+rect(FX(P.anchor.x-5),FY(br.y+br.t),FX(P.anchor.x+5),FY(br.y+br.t+P.anchor.h));
 s+=spring(FX(P.spring.x),FY(br.y-L1),FY(br.y),P.spring.od*k,nA);
 // Zentralrohr: Fahrt (voll) und angepresst (Strich-Zweipunkt), Laserkopf jeweils darauf
 const tube=(ty,c)=>rect(FX(-60),FY(ty+H.tubeR),FX(X(-330)),FY(ty-H.tubeR),c);
 const headAt=(ty,c)=>rect(FX(hx0),FY(ty+H.y0),FX(hx1),FY(ty+H.y1),c,2)+H.clamps.map(cx=>rect(FX(X(cx)-H.clampW/2),FY(ty+H.clampR),FX(X(cx)+H.clampW/2),FY(ty-H.clampR-5),c)).join('');
 s+=tube(tY1,'ph')+headAt(tY1,'ph')+tube(tY0,'v')+headAt(tY0,'v');
 s+=text(FX(-58),FY(tY0)+1,'Zentralrohr (Fahrt)',{size:2.4,anchor:'start',cls:'mut'})+text(FX(-58),FY(tY1)+1,'angepresst',{size:2.4,anchor:'start',cls:'mut'});
 // Spiralkabel (Wellenlinie) Messrad ↔ Laserkopf, Fahrt und angepresst
 const wave=(a,b,c)=>{const pts=[],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy),nx=-dy/L,ny=dx/L,cyc=Math.max(6,Math.round(L/1.6)),n=cyc*8;for(let i=0;i<=n;i++){const q=i/n,amp=Math.min(1,Math.min(q,1-q)*10)*2;pts.push([a[0]+dx*q+nx*amp*Math.sin(q*cyc*2*Math.PI),a[1]+dy*q+ny*amp*Math.sin(q*cyc*2*Math.PI)]);}return poly(pts,c,false);};
 const an=[FX(P.anchor.x),FY(br.y+br.t+P.anchor.h)],gl=ty=>[FX(X(H.gland.side.x)),FY(ty+H.y0+8)];
 s+=wave(an,gl(tY1),'spP')+wave(an,gl(tY0),'sp');
 s+=wave([FX(X(H.x1)+6),FY(tY0+H.gland.rear.y)],[FX(X(-372)),FY(tY0+44)],'sp')+`<path d="M${n(FX(X(-372)))} ${n(FY(tY0+44))}L${n(FX(X(-372))+8)} ${n(FY(tY0+44))}" class="d" marker-end="url(#ar)"/>`;
 s+=text(FX(X(-372))+8,FY(tY0+44)-3,'zur Kabelbombe',{size:2.6,anchor:'end'});
 // Schildkante, Laserebene, Strahl
 s+=line(FX(shieldX),FY(tY0+60),FX(shieldX),FY(tY1+H.y1+16),'ph')+text(FX(shieldX)-1,FY(tY1+H.y1+17),'hintere Schildkante',{size:2.6,anchor:'end',cls:'mut'});
 s+=line(FX(laserX),FY(tY0+H.y1),FX(laserX),FY(tY1+H.y1+30),'laser')+text(FX(laserX)+1.5,FY(tY1+H.y1+27),'Laserlinie zum Scheitel',{size:2.6,anchor:'start',cls:'laserT'});
 // Maße
 s+=dimH(FX(0),FX(laserX),FY(0),FY(tY1+H.y1),FY(tY1+H.y1+38),fmt(laserX));
 s+=dimH(FX(shieldX),FX(laserX),FY(tY1+H.y1+12),FY(tY1+H.y1+12),FY(tY1+H.y1+14),fmt(laserX-shieldX),{left:true});
 s+=dimV(FY(0),FY(tY0),FX(-60),FX(-60),FX(-60)-6,fmt(tY0));
 s+=dimV(FY(tY0),FY(tY1),FX(hx1),FX(hx1),FX(X(-330))+8,fmt(stroke));
 s+=dimV(FY(tY0),FY(tY0+H.y1),FX(hx0),FX(hx0),FX(hx0)-5,String(H.y1));
 s+=dimH(FX(0),FX(P.plate.x1),FY(-P.plate.t-P.strap.t),FY(-P.plate.t-P.strap.t),FY(-P.plate.t-P.strap.t)+8,fmt(P.plate.x1));
 s+=text(FX(0)+1,FY(-P.plate.t-P.strap.t)+14,'Stoßfuge = Hinterkante der bestehenden Stützplatte',{size:2.4,anchor:'start',cls:'mut'});
 // --- Schnitte in der Laserebene 1:5 (Blick nach vorn): DN 650–700 rechts, DN 300 unten links
 const section=(dn,cx,cy,kk=.2)=>{const f=families.find(q=>q.id===dn),R=dn/2,b=-125-f.spacer.reduce((a,c)=>a+c,0),tp=b+3.5,g=heckGeometry(R,b),Z=z=>cx+z*kk,Yp=y=>cy-y*kk;let o='';
  o+=`<circle cx="${n(cx)}" cy="${n(cy)}" r="${n((R+R*.09)*kk)}" fill="url(#hatch)" stroke="#111" stroke-width=".35"/>`+circ(cx,cy,R*kk,'v');
  // Wasser bis über die Platte (Annahme)
  const wy=tp+4.5,half=Math.sqrt(R*R-wy*wy);o+=`<path d="M${n(Z(-half))} ${n(Yp(wy))}A${n(R*kk)} ${n(R*kk)} 0 0 0 ${n(Z(half))} ${n(Yp(wy))}Z" class="waterF"/>`;
  o+=line(cx-(R+R*.09)*kk-3,cy,cx+(R+R*.09)*kk+3,cy,'c')+line(cx,cy-(R+R*.09)*kk-3,cx,cy+(R+R*.09)*kk+3,'c');
  const hy=tubeTravelY+H.y1,fan=[[Z(0),Yp(hy)]];for(let i=0;i<=24;i++){const a=-laserFan.half+2*laserFan.half*i/24;fan.push([Z(R*Math.sin(a)),Yp(R*Math.cos(a))]);}o+=poly(fan,'fanR');
  const arc=dr=>{const pts=[];for(let i=0;i<=30;i++){const a=-laserFan.half+2*laserFan.half*i/30;pts.push([Z((R-dr)*Math.sin(a)),Yp((R-dr)*Math.cos(a))]);}return pts;};o+=poly(arc(3),'lineR',false)+poly(arc(9),'lineG',false);
  o+=rect(Z(-S.plate.w/2),Yp(tp),Z(S.plate.w/2),Yp(tp-S.plate.t),'v')+rect(Z(S.wheel.z-S.wheel.w/2),Yp(g.axle.y+S.wheel.r),Z(S.wheel.z+S.wheel.w/2),Yp(g.axle.y-S.wheel.r),'v');
  o+=rect(Z(S.block.z0),Yp(tp),Z(S.block.z1),Yp(tp+S.block.h),'v')+rect(Z(S.bracket.z0),Yp(g.bracketY),Z(S.bracket.z1),Yp(g.bracketY+S.bracket.t),'v');
  o+=circ(Z(0),Yp(tubeTravelY),H.clampR*kk,'v')+circ(Z(0),Yp(tubeTravelY),H.tubeR*kk,'v')+rect(Z(-H.w/2),Yp(tubeTravelY+H.y0),Z(H.w/2),Yp(tubeTravelY+H.y1),'v');
  const a2=[Z(S.anchor.z),Yp(g.bracketY+S.bracket.t+S.anchor.h)],b2=[Z(H.gland.side.z),Yp(tubeTravelY+H.y0+8)];o+=line(...a2,...b2,'sp');
  o+=text(cx,cy-(R+R*.09)*kk-5,`${f.label} · 1:5`,{size:3.2,cls:'vt'});
  return o;};
 s+=section(700,334,102)+text(334,14.5,'Schnitt in der Laserebene, Blick nach vorn (Fahrstellung)',{size:2.8,cls:'cap'});
 s+=section(300,60,220);
 const rows=dnRows.map(r=>`<tr><td>${r.label}</td><td>${fmt(r.tubeAbove)}</td><td>${fmt(r.headAboveInvert)}</td><td>${fmt(r.spiral[0])} → ${fmt(r.spiral[1])}</td></tr>`).join('');
 const html=box(104,186,142,0,`<h3>Abstände je Schalung (Modell)</h3><table class="bom small"><thead><tr><th>Schalung</th><th>Platte → Rohrachse</th><th>Laserkopf über Sohle</th><th>Spiralkabel Fahrt → angepresst</th></tr></thead><tbody>${rows}</tbody></table><p class="mut">Maße in mm. Spiralkabel: Ruhelänge ≈ ${spiralSpec.rest} mm, Arbeitsbereich bis ${spiralSpec.max} mm.</p>`)
  +box(258,184,150,0,`<h3>Hinweise</h3><ul><li>Unten bleibt alles beim Anpressen in Ruhe; der Laserkopf geht mit dem Zentralrohr ${fmt(stroke)} mm hoch, das Spiralkabel dehnt sich.</li><li>Bei DN 300 gibt es keinen Distanzblock unter dem Bumper: Laserkopf und Messrad sind so gelegt, dass sie auch dort frei bleiben (Prüfung im Modell). Abstand Stützplatte–Sohle am Gerät nachmessen.</li><li>Laserkopf steht über dem Wasser, Messrad und Sensor sind vergossen und dürfen dauerhaft unter Wasser sein.</li></ul>`,'notes');
 sheet({name:'Anordnung im Rohr',no:'LPH-100',scale:'1:2 / 1:5',material:'—',svg:s,html});
}


// =====================================================================
// Blatt 3: Explosionsdarstellung und Stückliste
// =====================================================================
{
 const an=await anchors('explosion'),cr=CROP.explosion,x=22,y=14,w=150,h=100,sc=Math.min(w/(cr[2]-cr[0]),h/(cr[3]-cr[1])),offX=x+(w-(cr[2]-cr[0])*sc)/2,offY=y+(h-(cr[3]-cr[1])*sc)/2;
 const pt=k=>[offX+(an[k][0]*1600-cr[0])*sc,offY+(an[k][1]*1000-cr[1])*sc];
 let s=await pic('explosion',x,y,w,h,cr);
 const pos={plate:1,strap:2,block:3,bracket:4,fork:5,wheel:6,spring:7,sensor:8,head:13};
 const off={plate:[14,16],strap:[16,8],block:[-14,-10],bracket:[16,-6],fork:[-14,-12],wheel:[-12,14],spring:[-16,2],sensor:[12,-14],head:[16,-4]};
 for(const [k,num] of Object.entries(pos)){if(!an[k])continue;const [px,py]=pt(k);s+=balloon(px+off[k][0],py+off[k][1],num,px,py);}
 s+=text(25,19,'Explosionsdarstellung (Zentralrohr nur zur Orientierung)',{size:3,anchor:'start',cls:'cap'});
 s+=await pic('m6',177,14,231,100,CROP.m)+text(180,19,'Zusammengebaut, Fahrstellung',{size:3,anchor:'start',cls:'cap'});
 const html=box(22,118,386,0,bomTable(bom,{small:true}));
 sheet({name:'Explosionsdarstellung und Stückliste',no:'LPH-101',scale:'—',svg:s,html});
}


// =====================================================================
// Blatt 4: Zusammenbau untere Baugruppe 1:1 (Vorderansicht von der Radseite, Draufsicht darunter, Projektion 1)
// =====================================================================
{
 const ox=110,oy=100,FX=u=>ox+u,FY=v=>oy-v;let s='';
 const bk=P.block,br=P.bracket,se=P.seat,pl=P.plate,hw=pl.w/2;
 const xr=FX(axle[0]+S.wheel.r);
 // --- Vorderansicht (Blick von −z auf die Radseite). Zeichenfolge von hinten nach vorne,
 // weiß gefüllte Flächen verdecken dahinterliegende Kanten.
 s+=text(FX(-30),FY(62),'Vorderansicht',{size:3.5,anchor:'start',cls:'vt'})+text(FX(-30),FY(57),'Blick auf die Radseite (−z)',{size:2.4,anchor:'start',cls:'mut'});
 s+=circ(FX(axle[0]),FY(axle[1]),S.wheel.r)+circ(FX(axle[0]),FY(axle[1]),S.wheel.r-6,'t')+circ(FX(axle[0]),FY(axle[1]),11,'t');
 s+=rect(FX(-30),FY(0),FX(0),FY(-pl.t),'ph')+poly([[FX(-30),FY(2)],[FX(-28),FY(-1)],[FX(-32),FY(-5)],[FX(-30),FY(-9)]],'t',false);
 s+=rect(FX(0),FY(0),FX(pl.x1),FY(-pl.t))+rect(FX(P.strap.x0),FY(-pl.t),FX(P.strap.x1),FY(-pl.t-P.strap.t));
 for(const wx of S.wiper.xs.map(X))s+=rect(FX(wx-S.wiper.w/2),FY(-pl.t),FX(wx+S.wiper.w/2),FY(-pl.t-S.wiper.t))+rect(FX(wx-S.wiper.lip.t/2),FY(-pl.t-S.wiper.t),FX(wx+S.wiper.lip.t/2),FY(Y(G.contactY)+S.wiper.lip.gap),'v lip');
 for(const x of [-20,20])s+=rect(FX(x-5.25),FY(-pl.t-P.strap.t),FX(x+5.25),FY(-pl.t-P.strap.t-3.3),'v',1.5);
 const u=[(axle[0]-pivot[0])/armLen,(axle[1]-pivot[1])/armLen],nrm=[-u[1],u[0]],at=(a,b)=>[FX(pivot[0]+u[0]*a+nrm[0]*b),FY(pivot[1]+u[1]*a+nrm[1]*b)];
 s+=poly([at(-6,-6),at(armLen+8,-6),at(armLen+8,6),at(-6,6)]);
 const sa=pivot[0]-se.x0,sb=pivot[0]-se.x1;s+=poly([at(-sa,6),at(-sb,6),at(-sb,6+se.t),at(-sa,6+se.t)]);
 s+=rect(FX(bk.x0),FY(0),FX(bk.x1),FY(bk.h));
 s+=circ(FX(pivot[0]),FY(pivot[1]),4)+circ(FX(pivot[0]),FY(pivot[1]),6.5,'t');
 const yST=br.y-L1;
 s+=spring(FX(P.spring.x),FY(yST),FY(br.y),P.spring.od,nA);
 s+=rect(FX(br.x0),FY(bk.h),FX(br.web),FY(br.y))+rect(FX(br.x0),FY(br.y),FX(br.x1),FY(br.y+br.t));
 s+=circ(FX(axle[0]),FY(axle[1]),8)+circ(FX(axle[0]),FY(axle[1]),4,'t');
 s+=cross(FX(axle[0]),FY(axle[1]),40)+cross(FX(pivot[0]),FY(pivot[1]),8);
 s+=line(FX(0),FY(10),FX(0),FY(0),'ph')+text(FX(1.2),FY(3),'Stoßfuge',{size:2.4,anchor:'start',cls:'mut'});
 s+=text(FX(-28),FY(14),'Stützplatte (Bestand)',{size:2.2,anchor:'start',cls:'mut'});
 const yT=FY(br.y+br.t+P.anchor.h);
 s+=rect(FX(P.anchor.x-5),FY(br.y+br.t),FX(P.anchor.x+5),FY(br.y+br.t+P.anchor.h))+note(FX(P.anchor.x+5),FY(br.y+br.t+P.anchor.h-1),FX(P.anchor.x)+24,yT-6,'Zugentlastung Spiralkabel');
 s+=dimH(FX(0),FX(pivot[0]),FY(0),FY(pivot[1]),yT-4,fmt(pivot[0]));
 s+=dimH(FX(0),FX(axle[0]),FY(0),FY(axle[1]),yT-18,fmt(axle[0]));
 s+=dimV(FY(0),FY(br.y+br.t),FX(br.x1),FX(br.x1),xr+14,fmt(br.y+br.t));
 s+=dimV(FY(0),FY(-pl.t),FX(pl.x1),FX(pl.x1),xr+6,fmt(pl.t),{below:true});
 s+=dimV(FY(-pl.t),FY(axle[1]-S.wheel.r),FX(axle[0]),FX(axle[0]),xr+14,fmt(-(axle[1]-S.wheel.r)-pl.t),{below:true});
 s+=dimH(FX(P.strap.x0),FX(P.strap.x1),FY(-pl.t-P.strap.t),FY(-pl.t-P.strap.t),FY(-pl.t-P.strap.t)+9,fmt(P.strap.x1-P.strap.x0));
 s+=dimH(FX(0),FX(pl.x1),FY(-pl.t),FY(-pl.t),FY(-pl.t-P.strap.t)+16,fmt(pl.x1));
 s+=note(FX(axle[0])+S.wheel.r*.71,FY(axle[1]-S.wheel.r*.71),xr+22,FY(-38),'Messrad Ø63,66 (200 mm Umfang)');
 s+=text(xr+22,FY(-38)+3.6,'Stellung DN 350–400, Federweg 0',{size:2.3,anchor:'start',cls:'mut'});
 // --- Draufsicht (unter der Vorderansicht; unten = Radseite −z)
 const oy2=196,TY=z=>oy2-z,nt=P.notch,rc=pl.corner;
 s+=text(FX(-30),TY(hw)-8,'Draufsicht',{size:3.5,anchor:'start',cls:'vt'});
 s+=`<path d="M${FX(0)} ${TY(hw)}L${FX(pl.x1-rc)} ${TY(hw)}Q${FX(pl.x1)} ${TY(hw)} ${FX(pl.x1)} ${TY(hw-rc)}L${FX(pl.x1)} ${TY(nt.z1)}L${FX(nt.x0)} ${TY(nt.z1)}L${FX(nt.x0)} ${TY(nt.z0)}L${FX(pl.x1)} ${TY(nt.z0)}L${FX(pl.x1)} ${TY(-hw+rc)}Q${FX(pl.x1)} ${TY(-hw)} ${FX(pl.x1-rc)} ${TY(-hw)}L${FX(0)} ${TY(-hw)}Z" class="v"/>`;
 s+=rect(FX(-30),TY(hw),FX(0),TY(-hw),'ph');
 for(const h of holes)s+=circ(FX(h.x),TY(h.z),h.d/2);
 s+=rect(FX(P.strap.x0),TY(P.strap.w/2),FX(P.strap.x1),TY(-P.strap.w/2),'h',4);
 for(const wx of S.wiper.xs.map(X))s+=rect(FX(wx-S.wiper.w/2),TY(S.wiper.z1),FX(wx+S.wiper.w/2),TY(S.wiper.z0),'h');
 s+=rect(FX(bk.x0),TY(bk.z0),FX(bk.x1),TY(bk.z1),'v',1.5);
 const az=S.fork.armZ,at2=S.fork.armT;
 for(const z of az)s+=rect(FX(pivot[0]-6),TY(z-at2/2),FX(pivot[0]+armLen+8),TY(z+at2/2),'v',1);
 s+=rect(FX(pivot[0]-6),TY(az[0]-at2/2),FX(pivot[0]+6),TY(az[1]+at2/2));
 s+=rect(FX(se.x0),TY(se.z0),FX(se.x1),TY(az[0]-at2/2));
 s+=rect(FX(bk.x0),TY(bk.z0),FX(bk.x1),TY(bk.slot[0]),'v',1)+rect(FX(bk.x0),TY(bk.slot[1]),FX(bk.x1),TY(bk.z1),'v',1);
 s+=rect(FX(axle[0]-S.wheel.r),TY(S.wheel.z-S.wheel.w/2),FX(axle[0]+S.wheel.r),TY(S.wheel.z+S.wheel.w/2),'v',1);
 s+=rect(FX(axle[0]-8),TY(az[0]-at2/2),FX(axle[0]+8),TY(az[0]-at2/2-9),'v',1);
 s+=rect(FX(br.x0),TY(br.z0),FX(br.x1),TY(br.z1),'v',1.5)+circ(FX(P.spring.x),TY(P.spring.z),P.spring.od/2,'h');
 s+=line(FX(-34),TY(0),FX(axle[0]+S.wheel.r+10),TY(0),'c')+line(FX(axle[0]),TY(-P.plate.w/2-4),FX(axle[0]),TY(-10),'c')+line(FX(pivot[0]-10),TY(S.wheel.z),FX(axle[0]+S.wheel.r+6),TY(S.wheel.z),'c');
 const c0=FX(axle[0]+S.wheel.r)+6;
 s+=dimV(TY(hw),TY(-hw),FX(-30),FX(-30),FX(-36),fmt(pl.w));
 s+=dimV(TY(0),TY(S.wheel.z),FX(axle[0]+S.wheel.r),FX(axle[0]+S.wheel.r),c0,fmt(-S.wheel.z));
 s+=dimV(TY(nt.z1),TY(nt.z0),FX(pl.x1),FX(pl.x1),c0+16,fmt(nt.z1-nt.z0));
 // Positionsnummern (Kreise außerhalb der Ansicht, nicht im Schriftfeld)
 const by=TY(-hw)+17,bt=TY(hw)-8;
 const b=[[24,FX(X(S.wiper.xs[1])),TY(-20),FX(108),by],[1,FX(20),TY(-44),FX(20),by],[2,FX(-14),TY(-30),FX(-14),by],[3,FX(pivot[0]-7),TY(-12),FX(36),by],[4,FX(P.bracket.x0+6),TY(-50),FX(54),by],[7,FX(P.spring.x),TY(-47),FX(72),by],[5,FX(pivot[0]+30),TY(-41),FX(90),by],
  [6,FX(axle[0]+25),TY(-33),c0+30,TY(-22)],[8,FX(axle[0]+4),TY(-50),c0+30,TY(-40)]];
 for(const [num,tx,ty,bx,by2] of b)s+=balloon(bx,by2,num,tx,ty);
 const html=box(312,14,96,0,`<h3>Hinweise</h3><ol><li>Untere Baugruppe am Unterteil: hebt beim Anpressen nicht mit an und liegt dauerhaft im Abwasser – Edelstahl/Alu eloxiert, Sensor vergossen.</li><li>Darstellung DN 350–400, Federweg 0. Radlage je DN: LPH-150.</li><li>2 × M6 in der Bestand-Stützplatte (20 mm vor der Stoßfuge, ±25) erst nach Prüfung der Unterseite.</li><li>Schrauben mit mittelfester Sicherung, Senkschrauben von unten bündig.</li><li>Spiralkabel zum Laserkopf an der Zugentlastung auf dem Federwinkel anschlagen; Sensorkabel außen am Arm mit 2 Bindern sichern.</li></ol>`,'notes');
 sheet({name:'Zusammenbau untere Baugruppe',no:'LPH-110',scale:'1:1',material:'—',svg:s,html});
}



// =====================================================================
// Blatt 5: Pos. 1 Verlängerungsplatte, Pos. 2 Verbindungslasche
// =====================================================================
{
 let s='';const ox=45,oy=105,FX=u=>ox+u,TY=z=>oy-z,pl=P.plate,nt=P.notch,hw=pl.w/2,rc=pl.corner;
 s+=text(FX(0),TY(hw)-14,'Pos. 1 Verlängerungsplatte · Draufsicht (Oberseite)',{size:3.5,anchor:'start',cls:'vt'})+text(FX(0),TY(hw)-9.5,'Bohrungen nach Koordinatentabelle, Bezug Stoßfuge (x′ = 0) und Plattenmitte (z = 0)',{size:2.6,anchor:'start',cls:'mut'});
 s+=`<path d="M${FX(0)} ${TY(hw)}L${FX(pl.x1-rc)} ${TY(hw)}Q${FX(pl.x1)} ${TY(hw)} ${FX(pl.x1)} ${TY(hw-rc)}L${FX(pl.x1)} ${TY(nt.z1)}L${FX(nt.x0)} ${TY(nt.z1)}L${FX(nt.x0)} ${TY(nt.z0)}L${FX(pl.x1)} ${TY(nt.z0)}L${FX(pl.x1)} ${TY(-hw+rc)}Q${FX(pl.x1)} ${TY(-hw)} ${FX(pl.x1-rc)} ${TY(-hw)}L${FX(0)} ${TY(-hw)}Z" class="v"/>`;
 const ids=['A1','A2','D1','D2','W1','W2','W3','W4'];
 holes.forEach((h,i)=>{s+=circ(FX(h.x),TY(h.z),h.d/2)+(h.d<6?circ(FX(h.x),TY(h.z),h.d/2+2.4,'h'):'')+cross(FX(h.x),TY(h.z),h.d/2+2)+text(FX(h.x)+4.2,TY(h.z)-3.2,ids[i],{size:2.6,anchor:'start',cls:'id'});});
 s+=line(FX(-6),TY(0),FX(pl.x1+6),TY(0),'c');
 // Koordinatenbemaßung (Bezug Stoßfuge / Mittellinie)
 s+=circ(FX(0),TY(0),2.2,'v')+`<path d="M${n(FX(0))} ${n(TY(0)-2.2)}A2.2 2.2 0 0 1 ${n(FX(0)+2.2)} ${n(TY(0))}L${n(FX(0))} ${n(TY(0))}Z" fill="#111"/><path d="M${n(FX(0))} ${n(TY(0)+2.2)}A2.2 2.2 0 0 1 ${n(FX(0)-2.2)} ${n(TY(0))}L${n(FX(0))} ${n(TY(0))}Z" fill="#111"/>`+text(FX(3.5),TY(0)-2,'0 / 0',{size:2.6,anchor:'start',cls:'id'});
 s+=dimH(FX(0),FX(pl.x1),TY(-hw),TY(-hw),TY(-hw)+16,fmt(pl.x1));
 s+=dimH(FX(nt.x0),FX(pl.x1),TY(nt.z0),TY(nt.z0),TY(-hw)+8,fmt(pl.x1-nt.x0));
 s+=dimV(TY(hw),TY(-hw),FX(0),FX(0),FX(-8),fmt(pl.w));
 s+=dimV(TY(nt.z1),TY(nt.z0),FX(pl.x1),FX(pl.x1),FX(pl.x1)+8,fmt(nt.z1-nt.z0));
 s+=dimV(TY(0),TY(nt.z1),FX(pl.x1),FX(pl.x1),FX(pl.x1)+16,fmt(-nt.z1));
 s+=note(FX(pl.x1-rc*.3),TY(hw-rc*.3),FX(pl.x1)+10,TY(hw)-6,`R${rc}`);
 // Seitenansicht (Dicke)
 const sy=TY(-hw)+34;s+=rect(FX(0),sy,FX(pl.x1),sy+pl.t)+text(FX(0),sy-3,'Vorderansicht',{size:3,anchor:'start',cls:'vt'});
 for(const h of holes.filter(h=>h.d<6))s+=line(FX(h.x)-h.d/2,sy,FX(h.x)-h.d/2,sy+pl.t,'h')+line(FX(h.x)+h.d/2,sy,FX(h.x)+h.d/2,sy+pl.t,'h')+poly([[FX(h.x)-h.d/2-2.4,sy+pl.t],[FX(h.x)-h.d/2,sy+pl.t-2.4],[FX(h.x)+h.d/2,sy+pl.t-2.4],[FX(h.x)+h.d/2+2.4,sy+pl.t]],'h',false);
 s+=dimV(sy,sy+pl.t,FX(pl.x1),FX(pl.x1),FX(pl.x1)+8,fmt(pl.t));
 s+=text(FX(0)+2,sy+pl.t+6,'Senkungen von unten (Unterseite liegt auf der Lasche / zur Rohrsohle)',{size:2.6,anchor:'start',cls:'mut'});
 // Pos. 2 Lasche
 const lx=296,ly=184,LX=u=>lx+u,LY=z=>ly-z,st=P.strap;
 s+=text(lx,LY(st.w/2)-20,'Pos. 2 Verbindungslasche 1:1',{size:3.5,anchor:'start',cls:'vt'});
 s+=rect(LX(0),LY(st.w/2),LX(80),LY(-st.w/2),'v',4);
 for(const [xx,z] of [[20,25],[20,-25],[60,25],[60,-25]])s+=circ(LX(xx),LY(z),3.3)+cross(LX(xx),LY(z),5);
 s+=line(LX(40),LY(st.w/2)+3,LX(40),LY(-st.w/2)-3,'ph')+text(LX(40),LY(-st.w/2)+7,'Stoßfuge',{size:2.4,cls:'mut'});
 s+=dimH(LX(0),LX(80),LY(st.w/2),LY(st.w/2),LY(st.w/2)-12,'80')+dimH(LX(20),LX(60),LY(st.w/2),LY(st.w/2),LY(st.w/2)-5,'40');
 s+=dimV(LY(st.w/2),LY(-st.w/2),LX(80),LX(80),LX(80)+14,'80')+dimV(LY(25),LY(-25),LX(80),LX(80),LX(80)+7,'50');
 s+=note(LX(60)+2.3,LY(-25)+2.3,LX(64),LY(-st.w/2)+9,'4 × Ø6,6 durch');s+=note(LX(78.8),LY(st.w/2-1.2),LX(84),LY(st.w/2)-5,'R4');
 s+=rect(LX(94),LY(st.w/2),LX(94)+st.t,LY(-st.w/2))+dimH(LX(94),LX(94)+st.t,LY(-st.w/2),LY(-st.w/2),LY(-st.w/2)+6,'6',{left:true});
 // Pos. 24 Sohlenabstreifer 1:1 (Blick längs x, Rad-Spur in der Mitte der Lippe)
 {const wp=S.wiper,ox=60,oy=236,Z=z=>ox+(z-wp.z0),FY=v=>oy-v,lipLen=dnRows.map(r=>r.lipLen);
  s+=text(ox,oy-14,'Pos. 24 Sohlenabstreifer 1:1 (2 ×)',{size:3.3,anchor:'start',cls:'vt'});
  s+=rect(Z(wp.z0),FY(0),Z(wp.z1),FY(-wp.t))+rect(Z(S.wheel.z-wp.lip.w/2),FY(-wp.t),Z(S.wheel.z+wp.lip.w/2),FY(-wp.t-lipLen[1]),'v lip');
  for(const [z,d] of [[-48.75,3.4],[-9,4.5]])s+=line(Z(z)-d/2,FY(0),Z(z)-d/2,FY(-wp.t),'h')+line(Z(z)+d/2,FY(0),Z(z)+d/2,FY(-wp.t),'h')+line(Z(z),FY(3),Z(z),FY(-wp.t-3),'c');
  s+=dimH(Z(wp.z0),Z(wp.z1),FY(0),FY(0),FY(0)-6,fmt(wp.z1-wp.z0))+dimH(Z(S.wheel.z-wp.lip.w/2),Z(S.wheel.z+wp.lip.w/2),FY(-wp.t-lipLen[1]),FY(-wp.t-lipLen[1]),FY(-wp.t-lipLen[1])+7,fmt(wp.lip.w));
  s+=dimV(FY(0),FY(-wp.t),Z(wp.z1),Z(wp.z1),Z(wp.z1)+6,fmt(wp.t))+dimV(FY(-wp.t),FY(-wp.t-lipLen[1]),Z(S.wheel.z+wp.lip.w/2),Z(S.wheel.z+wp.lip.w/2),Z(wp.z1)+14,fmt(lipLen[1]));
  s+=text(Z(wp.z1)+24,FY(-4),'M3 / M4 von unten in die Platte',{size:2.5,anchor:'start',cls:'mut'})+text(Z(wp.z1)+24,FY(-8),`Lippe je DN ${lipLen.map(fmt).join(' / ')} mm (bis Sohle)`,{size:2.5,anchor:'start',cls:'mut'})+text(Z(wp.z1)+24,FY(-12),'+3 mm Überstand ablängen: Lippe legt sich an',{size:2.5,anchor:'start',cls:'mut'});
 }
 const tab=`<table class="holes"><thead><tr><th>Kenn.</th><th>x′</th><th>z</th><th>Ausführung</th><th>für</th></tr></thead><tbody>${holes.map((h,i)=>`<tr><td>${ids[i]}</td><td>${fmt(h.x)}</td><td>${fmt(h.z)}</td><td>${['M6 durch','M6 durch','Ø5,5 · Senkung 90° Ø10,4','Ø4,5 · Senkung 90° Ø8,4','M3 durch','M4 durch','M3 durch','M4 durch'][i]}</td><td>${['Lasche Pos. 2','Lasche Pos. 2','Lagerbock Pos. 3 außen','Lagerbock Pos. 3 innen','Abstreifer vorn Pos. 24','Abstreifer vorn Pos. 24','Abstreifer hinten Pos. 24','Abstreifer hinten Pos. 24'][i]}</td></tr>`).join('')}<tr><td>E1/E2</td><td>−20</td><td>±25</td><td>M6 durch</td><td>Bestand-Stützplatte (nachbohren)</td></tr></tbody></table><p class="mut">x′ ab Stoßfuge nach hinten, z ab Plattenmitte (+ = Laserseite). Werkstoff EN AW-6082 T6, Platte 7 mm (wie Stützplatte), eloxiert, Kanten gebrochen 0,5. Der Radausschnitt ist hinten offen, damit die Schwinge frei einfedern kann. Oben sitzt nur der Lagerbock, unten Lasche und die zwei Sohlenabstreifer.</p>`;
 sheet({name:'Verlängerungsplatte und Verbindungslasche',no:'LPH-111',scale:'1:1',material:'Pos. 1 EN AW-6082 T6 · Pos. 2 1.4301',svg:s,html:box(292,40,116,0,tab)});
}


// =====================================================================
// Blatt 6: Pos. 3 Lagerbock, Pos. 4 Federwinkel, Pos. 5 Schwinge, Pos. 9 Radwelle (2:1)
// =====================================================================
{
 let s='';const k=2,bk=P.block,br=P.bracket,se=P.seat;
 // Pos. 3 Lagerbock: Vorderansicht entlang x (U-Form) und Seitenansicht
 {const ox=55,oy=95,UX=z=>ox+(z-bk.z0)*k,UY=v=>oy-v*k,w=bk.z1-bk.z0;
  s+=text(ox+w,UY(bk.h)-22,'Pos. 3 Lagerbock (Gabelkopf) 2:1',{size:3.5,cls:'vt'});
  s+=poly([[UX(bk.z0),UY(0)],[UX(bk.z1),UY(0)],[UX(bk.z1),UY(bk.h)],[UX(bk.slot[1]),UY(bk.h)],[UX(bk.slot[1]),UY(bk.base)],[UX(bk.slot[0]),UY(bk.base)],[UX(bk.slot[0]),UY(bk.h)],[UX(bk.z0),UY(bk.h)]]);
  s+=line(UX(bk.z0),UY(bk.pivotH||12)-4*k,UX(bk.z0)+0,UY(12)-4*k,'h');
  for(const [z0,z1] of [[bk.z0,bk.slot[0]],[bk.slot[1],bk.z1]])s+=line(UX(z0),UY(12)-4*k,UX(z1),UY(12)-4*k,'h')+line(UX(z0),UY(12)+4*k,UX(z1),UY(12)+4*k,'h');
  s+=line(UX(bk.z0)-4,UY(12),UX(bk.z1)+4,UY(12),'c');
  for(const [z,d,lab] of [[-48,5,'M5 × 8 tief'],[-13,4,'M4 × 8 tief']])s+=line(UX(z)-d/2*k,UY(0),UX(z)-d/2*k,UY(8),'h')+line(UX(z)+d/2*k,UY(0),UX(z)+d/2*k,UY(8),'h')+line(UX(z),UY(-2),UX(z),UY(10),'c');
  s+=dimH(UX(bk.z0),UX(bk.z1),UY(0),UY(0),UY(0)+16,fmt(w))+dimH(UX(bk.slot[0]),UX(bk.slot[1]),UY(bk.base),UY(bk.base),UY(0)+8,fmt(bk.slot[1]-bk.slot[0]));
  s+=dimH(UX(bk.z0),UX(bk.slot[0]),UY(bk.h),UY(bk.h),UY(bk.h)-6,fmt(bk.slot[0]-bk.z0))+dimH(UX(bk.slot[1]),UX(bk.z1),UY(bk.h),UY(bk.h),UY(bk.h)-6,fmt(bk.z1-bk.slot[1]));
  s+=dimV(UY(0),UY(bk.h),UX(bk.z0),UX(bk.z0),UX(bk.z0)-8,fmt(bk.h))+dimV(UY(0),UY(12),UX(bk.z1),UX(bk.z1),UX(bk.z1)+8,'12')+dimV(UY(0),UY(bk.base),UX(bk.z1),UX(bk.z1),UX(bk.z1)+16,fmt(bk.base));
  s+=text(UX(-48),UY(-6),'M5',{size:2.6})+text(UX(-13),UY(-6),'M4',{size:2.6});
  // Seitenansicht (von −z): Bohrung Ø8 H7
  const sx=ox+w*k+40,SX=u=>sx+u*k,L=bk.x1-bk.x0;
  s+=rect(SX(0),UY(0),SX(L),UY(bk.h))+circ(SX(L/2),UY(12),4*k)+cross(SX(L/2),UY(12),6*k);
  s+=dimH(SX(0),SX(L),UY(0),UY(0),UY(0)+10,fmt(L))+note(SX(L/2)+2.8*k,UY(12)-2.8*k,SX(L)+14,UY(bk.h)-4,'Ø8 H7 durch');
 }
 // Pos. 4 Federwinkel (von −z), Draufsicht
 {const ox=250,oy=95,FX=u=>ox+(u-br.x0)*k,FY=v=>oy-(v-24)*k,L=br.x1-br.x0,wb=br.web-br.x0,hh=br.y+br.t-24;
  s+=text(ox+L,FY(br.y+br.t)-34,'Pos. 4 Federwinkel mit Zugentlastung 2:1',{size:3.5,cls:'vt'});
  s+=poly([[FX(br.x0),FY(24)],[FX(br.web),FY(24)],[FX(br.web),FY(br.y)],[FX(br.x1),FY(br.y)],[FX(br.x1),FY(br.y+br.t)],[FX(br.x0),FY(br.y+br.t)]]);
  s+=line(FX(br.x0+wb/2)-2.25*k,FY(24),FX(br.x0+wb/2)-2.25*k,FY(br.y+br.t)+3.4*k,'h')+line(FX(br.x0+wb/2)+2.25*k,FY(24),FX(br.x0+wb/2)+2.25*k,FY(br.y+br.t)+3.4*k,'h')+line(FX(br.x0+wb/2),FY(22),FX(br.x0+wb/2),FY(br.y+br.t+2),'c');
  s+=rect(FX(br.x0+wb/2)-3.6*k,FY(br.y+br.t),FX(br.x0+wb/2)+3.6*k,FY(br.y+br.t)+3.4*k,'h');
  s+=line(FX(P.spring.x)-6.25*k,FY(br.y),FX(P.spring.x)-6.25*k,FY(br.y)-1*k,'h')+line(FX(P.spring.x)+6.25*k,FY(br.y),FX(P.spring.x)+6.25*k,FY(br.y)-1*k,'h')+line(FX(P.spring.x),FY(br.y)+3,FX(P.spring.x),FY(br.y+br.t)-3,'c');
  s+=rect(FX(P.anchor.x-5),FY(br.y+br.t),FX(P.anchor.x+5),FY(br.y+br.t+P.anchor.h))+note(FX(P.anchor.x),FY(br.y+br.t+P.anchor.h),FX(P.anchor.x)+16,FY(br.y+br.t)-14,'Kabelschelle Ø6, 2 × M3',{right:true});
  s+=dimH(FX(br.x0),FX(br.x1),FY(br.y+br.t),FY(br.y+br.t),FY(br.y+br.t)-22,fmt(L))+dimH(FX(br.x0),FX(P.spring.x),FY(br.y),FY(br.y),FY(24)+8,fmt(P.spring.x-br.x0))+dimH(FX(br.x0),FX(br.web),FY(24),FY(24),FY(24)+16,fmt(wb));
  s+=dimV(FY(24),FY(br.y+br.t),FX(br.x1),FX(br.x1),FX(br.x1)+8,fmt(hh))+dimV(FY(br.y),FY(br.y+br.t),FX(br.x1),FX(br.x1),FX(br.x1)+16,fmt(br.t));
  s+=note(FX(br.x0+wb/2)-2.25*k,FY(26),FX(br.x0)-2,FY(24)+36,'Ø4,5 durch, Senkung Ø8 × 4,4 für M4');
  s+=note(FX(P.spring.x)-5*k,FY(br.y)+.5*k,FX(br.web)+5,FY(34),'Federführung Ø13,5 × 1 tief',{right:true});
  s+=text(FX(br.x0)+L*k/2,FY(24)+26,`Breite (z) ${fmt(br.z1-br.z0)} mm, z ${fmt(br.z0)} … ${fmt(br.z1)}`,{size:2.6,cls:'mut'});
 }
 // Pos. 5 Schwinge: Seitenansicht und Draufsicht (U-Form)
 {const ox=60,oy=150,FX=u=>ox+(u+6)*k,FY=v=>oy-v*k,L=Math.round(armLen*10)/10,az=S.fork.armZ,at=S.fork.armT;
  s+=text(ox,oy-32,'Pos. 5 Schwinge 2:1',{size:3.5,anchor:'start',cls:'vt'});
  s+=rect(FX(-6),FY(6),FX(L+8),FY(-6),'v',6*k*.5)+circ(FX(0),FY(0),5*k)+circ(FX(L),FY(0),6*k)+cross(FX(0),FY(0),8*k)+cross(FX(L),FY(0),8*k);
  const sa=pivot[0]-se.x0,sb=pivot[0]-se.x1;s+=rect(FX(-sa),FY(6),FX(-sb),FY(6+se.t));
  s+=dimH(FX(0),FX(L),FY(-6),FY(-6),FY(-6)+10,fmt(L))+dimH(FX(-6),FX(L+8),FY(-6),FY(-6),FY(-6)+18,fmt(L+14));
  s+=dimH(FX(0),FX(-sa),FY(6+se.t),FY(6+se.t),FY(6+se.t)-6,fmt(-sa))+dimH(FX(-sa),FX(-sb),FY(6+se.t),FY(6+se.t),FY(6+se.t)-6,fmt(sa-sb));
  s+=dimV(FY(6),FY(-6),FX(L+8),FX(L+8),FX(L+8)+8,'12')+dimV(FY(6),FY(6+se.t),FX(-sb),FX(-sb),FX(-sb)+6,fmt(se.t));
  s+=note(FX(0)+3.5*k,FY(0)+3.5*k,FX(10),FY(-6)+26,'Ø10 H7 für Gleitlager 8 × 10');
  s+=note(FX(L)+4.2*k,FY(0)+4.2*k,FX(L)+16,FY(-6)+26,'Ø12 H7 für MF128 (beide Arme)');
  // Draufsicht
  const ty=oy+76,TZ=z=>ty-(z-S.wheel.z)*k;
  for(const z of az)s+=rect(FX(-6),TZ(z+at/2),FX(L+8),TZ(z-at/2),'v',1);
  s+=rect(FX(-6),TZ(az[1]+at/2),FX(6),TZ(az[0]-at/2))+rect(FX(-sa),TZ(az[0]-at/2),FX(-sb),TZ(se.z0));
  s+=line(FX(L),TZ(az[1]+at/2+3),FX(L),TZ(az[0]-at/2-3),'c')+line(FX(-10),TZ(S.wheel.z),FX(L+12),TZ(S.wheel.z),'c');
  s+=dimV(TZ(az[1]+at/2),TZ(az[0]-at/2),FX(L+8),FX(L+8),FX(L+8)+8,fmt(az[1]-az[0]+at))+dimV(TZ(az[1]-at/2),TZ(az[0]+at/2),FX(L+8),FX(L+8),FX(L+8)+16,fmt(az[1]-az[0]-at));
  s+=dimV(TZ(az[0]-at/2),TZ(se.z0),FX(-sb),FX(-sb),FX(-sb)-6,fmt(az[0]-at/2-se.z0));
  s+=text(FX(L)+20,TZ(se.z0)-2,'Federteller außen (Radseite −z),',{size:2.6,anchor:'start',cls:'mut'})+text(FX(L)+20,TZ(se.z0)+1.8,'Federführung Ø13,5 × 1 tief',{size:2.6,anchor:'start',cls:'mut'});
 }
 // Pos. 9 Radwelle
 {const ox=300,oy=190,FX=u=>ox+u*k,FY=v=>oy-v*k,L=S.fork.armZ[1]-S.fork.armZ[0]+S.fork.armT;
  s+=text(ox+L,oy-20,'Pos. 9 Radwelle 2:1',{size:3.5,cls:'vt'});
  s+=rect(FX(0),FY(4),FX(L),FY(-4))+line(FX(-3),FY(0),FX(L+3),FY(0),'c')+rect(FX(0),FY(3.05),FX(2.6),FY(-3.05),'h');
  for(const g of [3.8,L-3.8-1.1])s+=rect(FX(g),FY(4),FX(g+1.1),FY(-4),'t');
  s+=dimH(FX(0),FX(L),FY(-4),FY(-4),FY(-4)+10,fmt(L))+dimV(FY(4),FY(-4),FX(L),FX(L),FX(L)+8,'Ø8 h6');
  s+=note(FX(1.3),FY(2),FX(-4),FY(4)-12,'Senkung Ø6,1 × 2,6 (Magnet Pos. 10)');
  s+=note(FX(4.35),FY(-4),FX(10),FY(-4)+20,'2 × Nut DIN 471 für Lagerspiel');
  s+=text(ox+L,FY(-4)+30,'Rad auf Welle mit Madenschraube M4 (Nabe) geklemmt;',{size:2.6,cls:'mut'})+text(ox+L,FY(-4)+34,'Welle dreht in den Kugellagern mit, Magnet zeigt zum Sensor.',{size:2.6,cls:'mut'});
 }
 sheet({name:'Lagerbock, Federwinkel, Schwinge, Radwelle',no:'LPH-120',scale:'2:1',material:'EN AW-7075 T6 · Welle 1.4305',svg:s});
}


// =====================================================================
// Blatt 7: Pos. 13 Laserkopf mit Pos. 14 Rohrschellen (2:1), Pos. 8 Drehgeberkopf (2:1)
// =====================================================================
{
 let s='';const k=2,Lh=Math.abs(H.x1-H.x0),hgt=H.y1-H.y0,U=x=>H.x0-x,lu=U(laserSpec.x),cu=H.clamps.map(U),gs=U(H.gland.side.x),gr=U(H.gland.rear.x);
 // --- Vorderansicht (Blick von −z): Rohr waagrecht, Kopf oben
 {const ox=25,oy=146,FX=u=>ox+(u+14)*k,FY=y=>oy-y*k;
  s+=text(FX(-14),20,'Pos. 13 Laserkopf · Vorderansicht 2:1',{size:3.5,anchor:'start',cls:'vt'});
  s+=rect(FX(-14),FY(H.tubeR),FX(Lh+14),FY(-H.tubeR),'ph')+text(FX(-13),FY(-H.tubeR)+4,'Zentralrohr Ø21,2',{size:2.4,anchor:'start',cls:'mut'});
  for(const c of cu)s+=rect(FX(c-H.clampW/2),FY(H.clampR),FX(c+H.clampW/2),FY(-H.clampR-5))+circ(FX(c),FY(-H.clampR-2),2.6*k*.6,'t');
  s+=rect(FX(0),FY(H.y0),FX(Lh),FY(H.y1-2),'v',2)+rect(FX(-.5),FY(H.y1-2),FX(Lh+.5),FY(H.y1),'v');
  s+=rect(FX(lu-H.laserR),FY(H.y1-2),FX(lu+H.laserR),FY(H.y1-2-H.laserL),'h')+line(FX(lu),FY(H.y1+10),FX(lu),FY(-H.tubeR-8),'c')+line(FX(lu),FY(H.y1),FX(lu),FY(H.y1+9),'laser');
  s+=circ(FX(gs),FY(H.y0+8),4*k*.9)+rect(FX(Lh),FY(H.gland.rear.y+4),FX(Lh+6),FY(H.gland.rear.y-4));
  s+=line(FX(-16),FY(0),FX(Lh+16),FY(0),'c');
  s+=dimH(FX(0),FX(Lh),FY(H.y1),FY(H.y1),FY(H.y1)-8,fmt(Lh))+dimH(FX(0),FX(lu),FY(H.y1),FY(H.y1),FY(H.y1)-16,fmt(lu),{left:true});
  s+=dimH(FX(0),FX(cu[0]),FY(-H.clampR-5),FY(-H.clampR-5),FY(-H.clampR-5)+8,fmt(cu[0]),{left:true})+dimH(FX(0),FX(cu[1]),FY(-H.clampR-5),FY(-H.clampR-5),FY(-H.clampR-5)+15,fmt(cu[1]));
  s+=dimV(FY(0),FY(H.y1),FX(Lh+6),FX(Lh+6),FX(Lh+6)+8,String(H.y1))+dimV(FY(0),FY(H.y0),FX(Lh),FX(Lh),FX(Lh+6)+16,String(H.y0),{below:true})+dimV(FY(H.y1-2),FY(H.y1-2-H.laserL),FX(lu+H.laserR),FX(lu+H.laserR),FX(lu+H.laserR)+5,String(H.laserL));
  s+=note(FX(gs)+3,FY(H.y0+8)+3,FX(gs)+14,FY(-H.clampR-5)+28,'M8: Spiralkabel zum Messrad',{right:true});
  s+=note(FX(Lh+6),FY(H.gland.rear.y),FX(Lh+6)+4,FY(H.y0+2),'M8: Spiralkabel zur Bombe',{right:true});
  s+=text(FX(lu)+2,FY(H.y1+8),'Laserebene',{size:2.4,anchor:'start',cls:'laserT'});
 }
 // --- Ansicht A (Blick in Rohrachse von hinten): Schelle, Kopf, Laser
 {const ox=226,oy=146,Z=z=>ox+z*k,FY=y=>oy-y*k;
  s+=text(Z(-30),20,'Ansicht A · Blick in die Rohrachse 2:1',{size:3.5,anchor:'start',cls:'vt'});
  s+=circ(Z(0),FY(0),H.clampR*k)+circ(Z(0),FY(0),H.tubeR*k,'ph')+rect(Z(-6),FY(-H.clampR+1),Z(6),FY(-H.clampR-5))+rect(Z(-10),FY(-H.clampR-1),Z(10),FY(-H.clampR-3),'h');
  s+=rect(Z(-H.w/2),FY(H.y0),Z(H.w/2),FY(H.y1-2),'v',2)+rect(Z(-H.w/2-.5),FY(H.y1-2),Z(H.w/2+.5),FY(H.y1),'v');
  for(const l of H.lasers)s+=rect(Z(l.z-H.laserR),FY(H.y1-2),Z(l.z+H.laserR),FY(H.y1-2-H.laserL),'h')+line(Z(l.z),FY(H.y1+6),Z(l.z),FY(H.y1-34),'c');
  s+=rect(Z(-H.w/2-6),FY(H.y0+12),Z(-H.w/2),FY(H.y0+4));
  // Lichtfächer angedeutet
  s+=poly([[Z(0),FY(H.y1)],[Z(-7),FY(H.y1+12)],[Z(7),FY(H.y1+12)]],'fanR')+text(Z(9),FY(H.y1+9),'Fächer 60° quer',{size:2.4,anchor:'start',cls:'laserT'});
  s+=dimH(Z(-H.w/2),Z(H.w/2),FY(H.y0),FY(H.y0),FY(-H.clampR-5)+10,fmt(H.w))+dimH(Z(H.lasers[0].z),Z(H.lasers[1].z),FY(H.y1),FY(H.y1),FY(H.y1+6),fmt(H.lasers[1].z-H.lasers[0].z));
  s+=dimV(FY(H.clampR),FY(-H.clampR),Z(H.clampR),Z(H.clampR),Z(H.w/2)+10,'R15',{});
  s+=note(Z(-8),FY(-H.clampR-4),Z(-20),FY(-H.clampR-5)+20,'M4 × 20 klemmt die Schelle',{right:false});
  s+=text(Z(H.lasers[0].z),FY(H.y1-H.laserL/2)+1,'rot',{size:2.4,cls:'redT'})+text(Z(H.lasers[1].z),FY(H.y1-H.laserL/2)+1,'grün',{size:2.4,cls:'grnT'});
 }
 // --- Draufsicht (unter der Vorderansicht)
 {const ox=296,oy=100,FX=u=>ox+(u+4)*k,TZ=z=>oy-z*k;
  s+=text(FX(-4),20,'Draufsicht 2:1',{size:3.2,anchor:'start',cls:'vt'});
  s+=rect(FX(0),TZ(H.w/2),FX(Lh),TZ(-H.w/2),'v',H.corner*k);
  for(const l of H.lasers)s+=circ(FX(lu),TZ(l.z),4.2*k,'v '+(l.color==='red'?'red':'grn'));
  s+=rect(FX(gs-4),TZ(-H.w/2),FX(gs+4),TZ(-H.w/2-6))+rect(FX(Lh),TZ(4),FX(Lh+6),TZ(-4));
  s+=line(FX(-6),TZ(0),FX(Lh+10),TZ(0),'c')+line(FX(lu),TZ(H.w/2+4),FX(lu),TZ(-H.w/2-4),'c');
  s+=dimV(TZ(H.w/2),TZ(-H.w/2),FX(-4),FX(-4),FX(-10),fmt(H.w))+dimV(TZ(H.lasers[1].z),TZ(H.lasers[0].z),FX(Lh+6),FX(Lh+6),FX(Lh+6)+8,fmt(H.lasers[1].z-H.lasers[0].z));
  s+=dimH(FX(0),FX(gs),TZ(-H.w/2-6),TZ(-H.w/2-6),TZ(-H.w/2-6)+7,fmt(gs));
  s+=note(FX(lu)+3,TZ(H.lasers[0].z)+3,FX(lu)+4,TZ(-H.w/2)+26,'Fenster PMMA 2, Laseraufnahme nach Modul (Ø9 / Ø12)',{right:true});
 }
 // --- Pos. 8 Drehgeberkopf
 {const ox=25,oy=226,kk=2;
  s+=text(ox,oy-6,'Pos. 8 Drehgeberkopf 2:1',{size:3.5,anchor:'start',cls:'vt'});
  s+=circ(ox+20,oy+22,8*kk)+circ(ox+20,oy+22,4*kk,'h')+rect(ox+60,oy+22-8*kk,ox+60+9*kk,oy+22+8*kk)+rect(ox+60+1*kk,oy+22-6*kk,ox+60+2.6*kk,oy+22+6*kk,'h')+line(ox+60+9*kk,oy+22,ox+60+9*kk+14,oy+22,'cable');
  s+=dimV(oy+22-8*kk,oy+22+8*kk,ox+60,ox+60,ox+60-8,'Ø16')+dimH(ox+60,ox+60+9*kk,oy+22+8*kk,oy+22+8*kk,oy+22+8*kk+6,'9');
 }
 const html=box(130,222,115,0,`<h3>Hinweise Laserkopf</h3><ul><li>Gehäuse aus dem Vollen, unten offen; Laser, Platinen (hochkant) und Kabel einsetzen, Laserlinien quer zur Rohrachse ausrichten, dann mit Gießharz vergießen. Fenster bleibt frei.</li><li>Vorderkante ${Math.abs(H.x0)-250} mm hinter der Schildkante, Laserebene ${fmt(lu)} mm dahinter.</li><li>Drehgeberkopf: AS5600 vergossen, Spalt 1,0 ± 0,5 zum Magneten, 2 × M2 am äußeren Arm.</li></ul>`,'notes');
 sheet({name:'Laserkopf und Drehgeberkopf',no:'LPH-130',scale:'2:1',material:'EN AW-6082 T6 eloxiert · Gießharz',svg:s,html});
}


// =====================================================================
// Blatt 8: Elektrik – Verkabelung, Steckerbelegung, Bedienkasten
// =====================================================================
{
 let s='';
 s+=text(25,20,'Verkabelungsplan',{size:3.6,anchor:'start',cls:'vt'});
 const yb=56,blk=(x0,x1,t1,t2,cls='v')=>rect(x0,yb-16,x1,yb+16,cls,2)+text((x0+x1)/2,yb-3,t1,{size:3,weight:600})+text((x0+x1)/2,yb+3,t2,{size:2.4,cls:'mut'});
 const wires=(x0,x1,lab,sub,spiral=false)=>{let o='';for(let i=0;i<4;i++){const y=yb-6+i*4;if(spiral){const pts=[];for(let q=0;q<=40;q++){const t=q/40;pts.push([x0+(x1-x0)*t,y+1.2*Math.sin(t*40*Math.PI)]);}o+=poly(pts,'wr',false);}else o+=line(x0,y,x1,y,'wr');o+=text(x0+2,y-.6,String(i+1),{size:2,anchor:'start',cls:'mut'});}
  return o+text((x0+x1)/2,yb-12,lab,{size:2.8,weight:600})+text((x0+x1)/2,yb+16,sub,{size:2.3,cls:'mut'});};
 s+=blk(25,70,'Bedienkasten','im Fahrzeug, 12/24 V');
 s+=wires(70,180,'Roboterkabel: 4 freie Adern','über Kabeltrommel/Steckfeld des Fahrzeugs');
 s+=blk(180,222,'Kabelbombe','neue Einbaudose 4-pol.');
 s+=wires(222,268,'Spiralkabel','wie Drehmotor/Blase/Druckschalter',true);
 s+=blk(268,318,'Laserkopf','auf dem Zentralrohr');
 s+=wires(318,362,'Spiralkabel','dehnt sich beim Anpressen',true);
 s+=blk(362,405,'Drehgeberkopf','am Messrad (unter Wasser)');
 s+=text(124,yb+24,'Ader 1 = +24 V (12–24 V) · 2 = 0 V · 3 = RS-485 A · 4 = RS-485 B',{size:2.6})+text(340,yb+24,'1 = 3,3 V · 2 = 0 V · 3 = SDA · 4 = SCL',{size:2.6});
 // Bedienkasten-Frontplatte 1:1
 const fx=238,fy=104,fw=150,fh=92;
 s+=text(fx,fy-4,'Bedienkasten · Frontplatte 1:1',{size:3.4,anchor:'start',cls:'vt'});
 s+=rect(fx,fy,fx+fw,fy+fh,'v',4)+rect(fx+10,fy+10,fx+70,fy+32,'disp',2)+text(fx+40,fy+27,'132',{size:13,cls:'segT'})+text(fx+40,fy+38,'Restweg mm',{size:2.4,cls:'mut'});
 s+=circ(fx+86,fy+16,3.5,'v red')+text(fx+92,fy+17.2,'rot',{size:2.6,anchor:'start'})+circ(fx+86,fy+27,3.5,'v grn')+text(fx+92,fy+28.2,'grün',{size:2.6,anchor:'start'});
 s+=circ(fx+125,fy+24,12,'btnY')+text(fx+125,fy+26,'NULL',{size:4,weight:700})+text(fx+125,fy+42,'kurz: nullen · 3 s: aufheben',{size:2.2,cls:'mut'});
 s+=circ(fx+24,fy+60,8,'btn')+text(fx+24,fy+61.5,'WAHL',{size:2.8,weight:700})+text(fx+24,fy+74,'Schalung wählen',{size:2.2,cls:'mut'});
 const legend=['d1 DN 300','d2 DN 350–400','d3 DN 450–500','d4 DN 550–600','d5 DN 650–700'];legend.forEach((t,i)=>s+=text(fx+44,fy+53+i*4.4,t,{size:2.6,anchor:'start'}));
 s+=text(fx+44,fy+53+5*4.4,'-o offen · -A Abschluss',{size:2.6,anchor:'start'});
 s+=rect(fx+108,fy+56,fx+138,fy+66,'v',1)+text(fx+123,fy+62.5,'EIN / AUS',{size:2.4})+circ(fx+123,fy+78,4,'v')+text(fx+123,fy+88,'Sicherung 1 A',{size:2.2,cls:'mut'});
 s+=dimH(fx,fx+fw,fy+fh,fy+fh,fy+fh+6,String(fw))+dimV(fy,fy+fh,fx+fw,fx+fw,fx+fw+6,String(fh));
 const html=box(22,92,206,0,`<h3>Steckerbelegung</h3><table class="bom small"><thead><tr><th>Ader</th><th>Roboterkabel / Einbaudose Bombe / Spiralkabel zur Bombe</th><th>Spiralkabel Laserkopf ↔ Messrad</th></tr></thead><tbody>
 <tr><td class="c">1</td><td>+24 V (Fahrzeug 12–24 V, im Bedienkasten mit 1 A abgesichert)</td><td>3,3 V für den AS5600</td></tr>
 <tr><td class="c">2</td><td>0 V</td><td>0 V</td></tr>
 <tr><td class="c">3</td><td>RS-485 A (verdrillt mit 4)</td><td>SDA (I²C, 100 kHz)</td></tr>
 <tr><td class="c">4</td><td>RS-485 B</td><td>SCL</td></tr></tbody></table>
 <p class="mut">Strom unter 0,2 A bei 24 V – auch auf langen Roboterkabeln mit dünnen Adern unkritisch. RS-485 mit 19 200 Bd reicht weit über 100 m. Abschlusswiderstand 120 Ω je an Bedienkasten und Laserkopf.</p>
 <h3>Blockbild</h3><table class="bom small"><thead><tr><th>Baugruppe</th><th>Inhalt</th></tr></thead><tbody>
 <tr><td>Bedienkasten</td><td>ESP32 DevKitC · RS-485 (MAX3485) · Anzeige TM1637 4-stellig · Taster NULL/WAHL · LED rot/grün · Summer · Wandler 12/24 V → 5 V · WLAN-Einstellseite</td></tr>
 <tr><td>Laserkopf (vergossen)</td><td>ESP32-C3 SuperMini · RS-485 · Wandler 7–36 V → 5 V · 2 MOSFET · Linienlaser rot/grün ≤ 1 mW</td></tr>
 <tr><td>Drehgeberkopf (vergossen)</td><td>AS5600 auf Platine Ø14 · Magnet Ø6 × 2,5 diametral in der Radwelle</td></tr></tbody></table>
 <p class="mut">Firmware: Zeichnungen/firmware/DSS_Bedienkasten und DSS_Laserkopf (Arduino, Paket esp32 3.0.7). Der Laserkopf zählt nur und schaltet die Laser; Rechnen, Nullen und Anzeige macht der Bedienkasten. Ohne Verbindung gehen die Laser nach 0,5 s aus.</p>`);
 sheet({name:'Elektrik und Bedienkasten',no:'LPH-140',scale:'1:1 (Frontplatte)',material:'—',svg:s,html});
}


// =====================================================================
// Blatt 9: Federung, Spiralkabel und Einbaulage je DN
// =====================================================================
{
 let s=await pic('feder-0',22,16,94,58,CROP.feder)+await pic('feder-12',120,16,94,58,CROP.feder)+await pic('fahrt',218,16,94,58,CROP.fahrt)+await pic('anpressen',316,16,92,58,CROP.fahrt);
 s+=text(24,78,'Federweg 0',{size:2.8,anchor:'start',cls:'cap'})+text(122,78,'Muffe/Versatz: +12 mm',{size:2.8,anchor:'start',cls:'cap'})+text(220,78,'Fahrstellung',{size:2.8,anchor:'start',cls:'cap'})+text(318,78,`Angepresst: Kopf +${fmt(stroke)} mm`,{size:2.8,anchor:'start',cls:'cap'});
 const html=box(22,84,190,0,`<h3>Einbaulage je Schalung (aus dem Modell)</h3><table class="bom"><thead><tr><th>Schalung</th><th>Rohr-Ø</th><th>Radachse über Plattenoberkante</th><th>Rad unter Plattenunterkante</th><th>Schwinge geneigt</th></tr></thead><tbody>${dnRows.map(r=>`<tr><td>${r.label}</td><td>${r.R*2}</td><td>${fmt(r.axle)}</td><td>${fmt(-r.wheelBelow)}</td><td>${fmt(r.angle)}°</td></tr>`).join('')}</tbody></table><p class="mut">Gleiche Teile für alle fünf Schalungen. Die Sohle liegt im Modell immer 28,5 mm unter der Plattenoberkante, nur die Krümmung ändert sich; die Feder gleicht die bis 2,5 mm andere Radlage aus. Bei DN 300 ohne Distanzblock den echten Abstand Stützplatte–Sohle nachmessen.</p>`)
 +box(218,84,190,0,`<h3>Feder (Rechenwerte, DN 350–400)</h3><table class="facts"><tr><th>Druckfeder</th><td>d ${fmt(dW)} · D<sub>a</sub> ${fmt(P.spring.od)} · L<sub>0</sub> ${P.spring.free} · n ${nA} · 1.4310</td></tr><tr><th>Federrate</th><td>c = G·d⁴ / (8·D<sub>m</sub>³·n) ≈ ${fmt(rate)} N/mm</td></tr><tr><th>Einbaulänge</th><td>${fmt(L1)} mm (Vorspannung ${fmt(P.spring.free-L1)} mm ≈ ${fmt(F1)} N)</td></tr><tr><th>Eingefedert +12 / ausgefedert −6</th><td>${fmt(L2)} mm (≈ ${fmt(F2)} N) / ${fmt(L3)} mm · Blocklänge ≈ ${fmt(Lblock)} mm</td></tr><tr><th>Hebel Feder / Rad</th><td>${fmt(Math.abs(pivot[0]-P.spring.x))} / ${fmt(armLen)} mm → Radkraft ≈ ${fmt(F1*lever)} … ${fmt(F2*lever)} N</td></tr></table><p class="mut">Gegen Schlupf auf der glitschigen Sohle wirken drei Dinge zusammen: weiche Gummilauffläche mit Querlamellen, Radkraft von ${fmt(F1*lever)} … ${fmt(F2*lever)} N (das Unterteil wiegt ein Vielfaches, es hebt nicht ab) und die Sohlenabstreifer vor und hinter dem Rad, die die Sielhaut aus der Radspur wischen. Keine Spikes oder Rändel – die würden den Liner verletzen.</p>
 <h3>Spiralkabel Messrad ↔ Laserkopf</h3><table class="bom small"><thead><tr><th>Schalung</th><th>Fahrt</th><th>angepresst</th></tr></thead><tbody>${dnRows.map(r=>`<tr><td>${r.label}</td><td>${fmt(r.spiral[0])} mm</td><td>${fmt(r.spiral[1])} mm</td></tr>`).join('')}</tbody></table><p class="mut">Ruhelänge ≈ ${spiralSpec.rest} mm, Arbeitsbereich bis ${spiralSpec.max} mm (PUR 4 × 0,25 mm²). Unten an der Zugentlastung auf dem Federwinkel, oben an der seitlichen Verschraubung des Laserkopfs.</p>`);
 sheet({name:'Federung, Spiralkabel, Einbaulage je DN',no:'LPH-150',scale:'—',svg:s,html});
}

// =====================================================================
// Blatt 10/11: Montageanleitung
// =====================================================================
{
 const steps=[
  ['m1','Unterteil vorbereiten','Unterseite der Stützplatte im Bereich 0–40 mm vor der hinteren Kante prüfen (frei von Leitungen). Zwei Gewinde M6 (E1/E2, 20 mm vor der Kante, ±25 quer) bohren und schneiden. Bei DN 300 den Abstand Stützplatte–Sohle messen.'],
  ['m2','Platte, Lasche, Abstreifer (Pos. 1, 2, 24)','Verlängerungsplatte stumpf an die Stützplatte legen, Oberseiten bündig. Lasche von unten, 4 × ISO 7380 M6 × 12 mit Loctite 243 – 8 Nm. Beide Sohlenabstreifer von unten anschrauben, Gummilippe genau in der Radspur.'],
  ['m3','Lagerbock, Schwinge, Rad (Pos. 3, 5, 6, 8–12)','Lager MF128 in beide Arme pressen, Welle mit Magnet durch Rad und Lager, Rad mit Madenschraube klemmen. Schwinge mit Gleitlagern in den Lagerbock, Bolzen Ø8 + Sicherungsringe. Lagerbock von unten mit M5/M4 Senkschrauben. Drehgeberkopf außen an den Arm (Spalt 1 mm).'],
  ['m4','Feder und Federwinkel (Pos. 4, 7)','Feder auf den Federteller setzen, Federwinkel darüber und mit M4 × 35 in die äußere Wange. Von Hand eindrücken: 12 mm Federweg ohne Klemmen, Rad kommt selbst zurück. Sensorkabel zur Zugentlastung führen.'],
  ['m5','Laserkopf aufs Zentralrohr (Pos. 13–18)','Laserkopf hinter der Schildkante aufsetzen (Vorderkante 2 mm dahinter), Schellen von unten, 2 × M4 – 3 Nm. Kopf genau senkrecht ausrichten: Laserlinie muss quer am Scheitel liegen.'],
  ['m6','Spiralkabel und Stecker (Pos. 19–21)','Spiralkabel vom Messrad an der Zugentlastung und am Laserkopf festschrauben. Zweites Spiralkabel vom Laserkopf am Roboter entlang zur neuen Einbaudose an der Kabelbombe. Schalung von Hand anheben: Kabel dürfen nirgends spannen oder scheuern.']
 ];
 const card=async(st,i,x,y)=>{const w=125,h=64;return await pic(st[0],x,y,w,h,CROP.m)+circ(x+6,y+6,4.2,'stepN')+text(x+6,y+7.5,String(i+1),{size:4.4,weight:700,cls:'stepT'});};
 let s='',html='';const xs=[22,152,282];
 for(let i=0;i<6;i++){const x=xs[i%3],y=i<3?16:132;s+=await card(steps[i],i,x,y);html+=box(x,y+66,125,0,`<h4>${i+1}. ${esc(steps[i][1])}</h4><p>${esc(steps[i][2])}</p>`,'step');}
 html+=box(22,226,222,0,`<h3>Werkzeug und Anzugsmomente</h3><table class="facts"><tr><th>M6 Lasche (ISO 7380, in Alu-Gewinde)</th><td>8 Nm · Loctite 243 · Innensechskant 4</td></tr><tr><th>M5/M4 Senkschrauben Lagerbock, M4 Federwinkel</th><td>5 / 3 Nm · Loctite 243</td></tr><tr><th>M4 Rohrschellen Laserkopf</th><td>3 Nm · ohne Sicherung (zum Nachstellen)</td></tr></table>`);
 sheet({name:'Montageanleitung 1/2 – Zusammenbau',no:'LPH-200',scale:'—',svg:s,html});
 let s2=await pic('kanal-rot',22,16,190,118)+await pic('kanal-gruen',218,16,190,118);
 s2+=text(25,21,'Schnittbild: rote Linie auf der Anschlussmitte → anhalten, NULL drücken',{size:3,anchor:'start',cls:'capW'})+text(221,21,`Nach ${Lopen} mm Rückweg: Anzeige 0, grün = Schildöffnung mittig`,{size:3,anchor:'start',cls:'capW'});
 const html2=box(22,138,125,0,`<h3>Einrichten (einmalig)</h3><ol><li>Einbaudose an der Kabelbombe auf die 4 freien Adern legen (Belegung LPH-140), Bedienkasten im Fahrzeug anschließen. Einschalten: Selbsttest rot, dann grün, Anzeige zeigt die Schalung.</li><li>Handy mit WLAN „DSS-Laser“ verbinden, Browser 192.168.4.1.</li><li><b>Messrad kalibrieren:</b> am besten im Versuchsrohr auf nassem Liner: Start, Schalung genau 1000 mm schieben, Wert übernehmen.</li><li><b>Weg L je Schalung messen</b> (Mitte Schildöffnung bis Laserlinie) und für offen/Abschluss eintragen.</li><li>Zählrichtung prüfen: rückwärts muss die Anzeige kleiner werden, sonst „umdrehen“.</li></ol>`,'notes')
 +box(152,138,125,0,`<h3>Positionieren im Kanal</h3><ol><li>Mit <b>WAHL</b> die Schalung einstellen (z. B. d2-o = DN 350–400 offen).</li><li>Über den Anschluss fahren, bis die rote Linie im Kamerabild auf der Anschlussmitte steht.</li><li>Anhalten, <b>NULL</b> drücken: Doppelblitz, Anzeige zeigt den Restweg.</li><li>Zurückfahren: rot = weiter, grün blinkt = noch 15 mm, langsam.</li><li>Anzeige 0 und Dauergrün (±3 mm): stoppen, Bumper vakuumieren.</li><li>Rot blinkt schnell, Anzeige negativ = zu weit: wieder vor bis grün.</li></ol>`,'notes')
 +box(282,138,126,0,`<h3>Prüfen und warten</h3><ul><li>Vor jedem Einsatz: Rad frei, Federung federt zurück, Fenster sauber, Selbsttest.</li><li>„Err“ = keine Verbindung (Stecker an der Bombe, Spiralkabel); „nAG“ = Magnet nicht erkannt (Sensorspalt).</li><li>Wöchentlich: Kalibrierung mit 1000 mm kontrollieren (Abweichung &lt; 3 mm).</li><li>Nach dem Einsatz: abspülen, Spiralkabel auf Scheuerstellen prüfen.</li><li>Laser Klasse 2 (≤ 1 mW): nicht in den Strahl blicken.</li></ul>`,'notes');
 const tests=[['Kalibrierung Messrad','1000 mm auf ebenem Boden','± 3 mm'],['Wiederholgenauigkeit','10 × positionieren an Musteranschluss','± 3 mm'],['Muffe überfahren','Stufe 10 mm vor- und rückwärts','Rad federt ein, Zählfehler < 2 mm'],['Versatz abwärts','Stufe 6 mm','Rad bleibt auf der Sohle'],['Nasser Liner','1 m vor/zurück','Schlupf < 3 mm'],['Anpressen','Bumper 5 × aufblasen/ablassen','Spiralkabel frei, keine Störung'],['Linie im Kamerabild','DN 300 und DN 700, mit Nebel','Linienmitte klar'],['Dauertest unter Wasser','Messrad und Sensor 8 h in Wasser','Zählen fehlerfrei']];
 const html3=box(22,204,222,0,`<h3>Erprobungsprotokoll (Versuchsrohr)</h3><table class="bom small"><thead><tr><th>Prüfung</th><th>Durchführung</th><th>Soll</th><th>Ist</th><th>i. O.</th></tr></thead><tbody>${tests.map(t=>`<tr><td>${t[0]}</td><td>${t[1]}</td><td>${t[2]}</td><td style="width:16mm"></td><td style="width:9mm"></td></tr>`).join('')}</tbody></table>`);
 sheet({name:'Montageanleitung 2/2 – Einrichten, Bedienen, Prüfen',no:'LPH-201',scale:'—',svg:s2,html:html2+html3});
}


// ---------- HTML/PDF ausgeben ----------
const css=`@page{size:420mm 297mm;margin:0}*{box-sizing:border-box}body{margin:0;background:#888;font-family:Inter,"DejaVu Sans",sans-serif;color:#111}
.sheet{position:relative;width:420mm;height:297mm;background:#fff;margin:0 auto 8mm;overflow:hidden;page-break-after:always;break-after:page}
@media print{body{background:#fff}.sheet{margin:0}}
svg text{font-family:"DejaVu Sans Condensed","DejaVu Sans",sans-serif;fill:#111}
.v{fill:#fff;stroke:#111;stroke-width:.5;stroke-linejoin:round}.t{fill:none;stroke:#111;stroke-width:.25}.h{fill:none;stroke:#111;stroke-width:.25;stroke-dasharray:1.6 .8}
.lip{fill:#5a6168 !important}.c{fill:none;stroke:#2563a8;stroke-width:.18;stroke-dasharray:6 1 1 1}.ph{fill:none;stroke:#555;stroke-width:.25;stroke-dasharray:6 1 1 1 1 1}.d{fill:none;stroke:#111;stroke-width:.18}.dot{fill:#111}
.sp{fill:none;stroke:#111;stroke-width:.4}.pipe{fill:none;stroke:#7a5a2a;stroke-width:.35;stroke-dasharray:3 1}.laser{stroke:#d22;stroke-width:.6;stroke-dasharray:2 1}.wr{fill:none;stroke:#111;stroke-width:.3}.spP{fill:none;stroke:#555;stroke-width:.3;stroke-dasharray:2 1}.water{fill:none;stroke:#2a7ab8;stroke-width:.35;stroke-dasharray:4 1.5}.waterT{fill:#2a7ab8 !important}.waterF{fill:rgba(60,140,200,.22);stroke:#2a7ab8;stroke-width:.25}.disp{fill:#1a1d1f;stroke:#111;stroke-width:.4}.segT{fill:#ff4a30 !important;font-family:'DejaVu Sans Mono',monospace !important;font-weight:700}.btnY{fill:#f2c230;stroke:#111;stroke-width:.5}.btn{fill:#e2e4e6;stroke:#111;stroke-width:.5}.fanR{fill:rgba(230,40,30,.10);stroke:none}.fanG{fill:rgba(30,170,80,.10);stroke:none}.lineR{fill:none;stroke:#e0281e;stroke-width:.8}.lineG{fill:none;stroke:#1ea050;stroke-width:.8}
.red{fill:#ffd9d4 !important}.grn{fill:#d4f5dc !important}.frame{fill:none;stroke:#111;stroke-width:.7}.tbl{fill:none;stroke:#111;stroke-width:.5}.pic{fill:none;stroke:#bbb;stroke-width:.25}
.bal{fill:#fff;stroke:#111;stroke-width:.35}.mut{fill:#555 !important}.warn{fill:#c0262d !important}.vt{font-weight:600}.cap{fill:#333 !important}.capW{fill:#fff !important;font-weight:600}.id{fill:#2563a8 !important}
.laserT,.redT{fill:#c0262d !important}.grnT{fill:#1e8449 !important}.cable{stroke:#111;stroke-width:1.2}.stepN{fill:#1e88ac;stroke:none}.stepT{fill:#fff !important}
.ov{position:absolute;font-size:3.1mm;line-height:1.32}.ov h1{font-size:6.2mm;margin:0 0 2mm}.ov h3{font-size:3.8mm;margin:0 0 1.5mm}.ov h4{font-size:3.4mm;margin:0 0 1mm;color:#1e5f7a}.ov p{margin:0 0 1.5mm}.ov ol,.ov ul{margin:0;padding-left:5mm}.ov li{margin-bottom:.9mm}
.ov .mut,p.mut{color:#555;font-size:2.8mm}.intro p{font-size:3.4mm}
table{border-collapse:collapse;width:100%}tr.grp td{background:#f3f4ef;font-weight:600}th,td{border:.25mm solid #888;padding:.7mm 1.4mm;text-align:left;vertical-align:top}th{background:#eef2f5;font-weight:600}
.bom{font-size:2.9mm}.bom.small{font-size:2.5mm}.bom.small td,.bom.small th{padding:.35mm 1.2mm}.bom td.c{text-align:center}.holes{font-size:2.8mm;margin-bottom:2mm}.facts{font-size:2.9mm}.facts th{width:44%}
.step p{font-size:2.85mm}.wire{width:150mm;height:72mm}.wire rect{fill:#fff;stroke:#111;stroke-width:.35}.wire rect.red{fill:#ffd9d4}.wire rect.grn{fill:#d4f5dc}.wire path{fill:none;stroke:#111;stroke-width:.4}.wire text{font-family:"DejaVu Sans Condensed",sans-serif}.wire .wm{fill:#555;font-size:2.6px}`;
const html=`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Laser-Positionierhilfe DSS-Flex v3 – Zeichnungen und Montage</title><style>${css}</style></head><body>${render()}</body></html>`;
await mkdir(path.dirname(OUT_HTML),{recursive:true});await writeFile(OUT_HTML,html);
if(!process.argv.includes('--html-only')){
 const runtime=process.env.KANALTEC_QA_RUNTIME||path.resolve('work/qa/runtime');
 const {chromium}=createRequire(runtime+'/package.json')('playwright');
 const browser=await chromium.launch();
 try{const page=await browser.newPage();await page.setContent(html,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
  await mkdir(path.dirname(OUT_PDF),{recursive:true});await page.pdf({path:OUT_PDF,width:'420mm',height:'297mm',printBackground:true,preferCSSPageSize:true});}
 finally{await browser.close();}
 console.log('PDF:',path.relative(process.cwd(),OUT_PDF),sheets.length,'Blätter');
}
console.log(`Feder: L1 ${r1(L1)} L2 ${r1(L2)} c ${r1(rate*100)/100} F1 ${r1(F1)} F2 ${r1(F2)} Hebel ${r1(lever*100)/100}`);

