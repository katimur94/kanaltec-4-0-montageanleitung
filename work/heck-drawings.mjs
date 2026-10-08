import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {families} from '../src/data.js';
import {heck,heckGeometry,laserSpec,plateHoles,LaserAid,laserVisible,laserFan} from '../src/laser-aid.js';

// Technische Zeichnungen und Montageanleitung des Laser-Heckmoduls als PDF (A3 quer).
// Alle Maße kommen aus src/laser-aid.js (dieselbe Geometrie wie Website und Tests).
// Bilder: work/qa/heck/*.jpg aus work/render-heck-stills.mjs.
//   node work/heck-drawings.mjs            → work/qa/heck/zeichnungen.html + Zeichnungen/Laser-Heckmodul-DSS-Flex.pdf
// Status: Entwurf. Maße, die nicht aus DiTom-Unterlagen stammen, sind Konstruktionsvorschläge.

const OUT_PDF=path.resolve('Zeichnungen/Laser-Heckmodul-DSS-Flex.pdf'),OUT_HTML=path.resolve('work/qa/heck/zeichnungen.html');
const IMG=path.resolve('work/qa/heck');
const DATE='08.10.2026',TITLE='DSS-Flex · Laser-Positionierhilfe · Heckmodul';
const REF=families.find(f=>f.id===400),Rref=REF.id/2,bottomRef=-125-REF.spacer.reduce((a,b)=>a+b,0),G=heckGeometry(Rref,bottomRef);
const S=heck,top=G.top;
// Zeichnungskoordinaten: x' ab Stoßfuge nach hinten, y' über Plattenoberkante, z quer (+ = Laserseite).
const X=x=>-68-x,Y=y=>y-top,span=(a,b)=>[Math.min(X(a),X(b)),Math.max(X(a),X(b))];
const r1=v=>Math.round(v*10)/10,fmt=v=>String(r1(v)).replace('.',',');
const pivot=[X(G.pivot.x),Y(G.pivot.y)],axle=[X(G.axle.x),Y(G.axle.y)],armLen=Math.hypot(axle[0]-pivot[0],axle[1]-pivot[1]);
const laserX=X(laserSpec.x),shieldX=X(-250);
const P={
 plate:{x0:0,x1:X(S.plate.x1),w:S.plate.w,t:S.plate.t,corner:S.plate.corner},
 notch:{x0:X(S.plate.notch.x0),z0:S.plate.notch.z0,z1:S.plate.notch.z1},
 strap:{x0:X(S.strap.x1),x1:X(S.strap.x0),w:S.strap.w,t:S.strap.t},
 housing:{x0:X(S.housing.x0),x1:X(S.housing.x1),w:S.housing.w,h:S.housing.h,lid:S.housing.lid},
 channel:{x0:X(S.channel.x0),x1:X(S.channel.x1),z0:S.channel.z0,z1:S.channel.z1,h:S.channel.h},
 tower:{x0:X(S.tower.x0),x1:X(S.tower.x1),z0:S.tower.z0,z1:S.tower.z1,h:S.tower.h},
 block:{x0:X(S.block.x0),x1:X(S.block.x1),z0:S.block.z0,z1:S.block.z1,h:S.block.h,base:S.block.base,slot:S.block.slot},
 bracket:{x0:X(S.bracket.x0),x1:X(S.bracket.x1),web:X(S.bracket.web.x1),z0:S.bracket.z0,z1:S.bracket.z1,t:S.bracket.t,y:Y(G.bracketY)},
 seat:{x0:X(S.fork.seat.x0),x1:X(S.fork.seat.x1),z0:S.fork.seat.z0,t:S.fork.seat.t},
 spring:{x:X(S.spring.x),z:S.spring.z,od:S.spring.od,wire:S.spring.wire,free:S.spring.free,coils:S.spring.coils}
};
const holes=plateHoles.map(([x,z,d])=>({x:X(x),z,d}));
// Feder: Einbaulängen aus der Modellkinematik (DN 350–400), Federrate nach DIN EN 13906-1.
const aid=new LaserAid(Rref+0,bottomRef);aid.setDeflection(0);const L1=G.bracketY-aid.armTop;aid.setDeflection(12);const L2=G.bracketY-aid.armTop;aid.setDeflection(-6);const L3=G.bracketY-aid.armTop;aid.setDeflection(0);
const Gmod=81500,dW=P.spring.wire,Dm=P.spring.od-dW,nA=P.spring.coils,rate=Gmod*dW**4/(8*Dm**3*nA),lever=(pivot[0]-P.spring.x)/(pivot[0]-axle[0]);
const F1=rate*(P.spring.free-L1),F2=rate*(P.spring.free-L2),Lblock=(nA+2)*dW;
const dnRows=families.map(f=>{const R=f.id/2,b=-125-f.spacer.reduce((a,c)=>a+c,0),g=heckGeometry(R,b);return{label:f.label,R,axle:g.axle.y-g.top,wheelBelow:g.axle.y-S.wheel.r-(b-S.plate.t/2),angle:-(180+g.armAngle*180/Math.PI)};});
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
const CROP={m:[430,170,1450,690],explosion:[190,150,1330,790],isoHeck:[370,180,1470,730],isoGes:[410,130,1370,760],unten:[330,200,1470,660],oben:[330,10,1600,830],feder:[0,200,1150,740]};

// ---------- Stückliste ----------
const bom=[
 [1,'Verlängerungsplatte','1','EN AW-6082 T6, 7 mm, eloxiert','LPH-110','Radausschnitt 64 × 29, Bohrbild Tabelle'],
 [2,'Verbindungslasche','1','1.4301, 6 mm','LPH-110','unter der Stoßfuge, 4 × M6'],
 [3,'Messgehäuse mit Deckel','1','EN AW-6082 T6, eloxiert; Dichtung','LPH-130','Akku, ESP32, Treiber, IP68'],
 [4,'Kabelkanal','1','EN AW-6060, U 24 × 12 × 2','LPH-130','verklebt (MS-Polymer)'],
 [5,'Laserturm mit Schutzfenster','1','EN AW-6082 T6; PMMA 2 mm','LPH-130','2 Aufnahmen Ø12 H7'],
 [6,'Lagerbock (Gabelkopf)','1','EN AW-7075 T6','LPH-120','Schlitz 28, Bohrung Ø8 H7'],
 [7,'Federwinkel','1','EN AW-7075 T6','LPH-120','Federführung Ø12,5'],
 [8,'Schwinge','1','EN AW-7075 T6','LPH-120','Lagersitze Ø12 H7, Federteller'],
 [9,'Messrad RAD DN70, Ø70 × 12','1','PU-Lauffläche, Alu-Nabe','Kaufteil','wie vorderes Rad, Nabe Ø8'],
 [10,`Druckfeder ${fmt(dW)} × ${fmt(P.spring.od)} × ${P.spring.free}`,'1','EN 10270-3 (1.4310)','Kaufteil',`n = ${nA}, c ≈ ${fmt(rate)} N/mm`],
 [11,'Drehgeberkopf AS5600, vergossen','1','Gießharz, Kabel PUR 4 × 0,14','LPH-130','Abstand Magnet 1,0 ± 0,5'],
 [12,'Linienlaser rot 650 nm, ≤ 1 mW','1','Klasse 2, Ø12 × 30, 60° Fächer','Kaufteil','Linie quer zur Rohrachse'],
 [13,'Linienlaser grün 520 nm, ≤ 1 mW','1','Klasse 2, Ø12 × 30, 60° Fächer','Kaufteil','Linie quer zur Rohrachse'],
 [14,'Radwelle Ø8 h6 × 26','1','1.4305','LPH-120','Stirnseite Senkung Ø6,1 × 2,6'],
 [15,'Magnet Ø6 × 2,5 diametral','1','NdFeB N35, vernickelt','Kaufteil','in Radwelle geklebt'],
 [16,'Rillenkugellager MF128-2RS (8 × 12 × 3,5)','2','Edelstahl, abgedichtet','Kaufteil','in beiden Schwingenarmen'],
 [17,'Lagerbolzen Ø8 × 46 mit Sicherungsringen','1','1.4305; DIN 471','Kaufteil','Gleitlager iglidur 8 × 10'],
 [18,'Linsenkopfschraube ISO 7380 M6 × 12','4','A2-70, Loctite 243','Kaufteil','Lasche → Platten'],
 [19,'Senkschraube ISO 10642 M5 × 10','7','A2-70','Kaufteil','Gehäuse 4, Laserturm 2, Lagerbock 1'],
 [20,'Senkschraube ISO 10642 M4 × 10','1','A2-70','Kaufteil','Lagerbock innere Wange'],
 [21,'Zylinderschraube ISO 4762 M4 × 35','1','A2-70','Kaufteil','Federwinkel → Lagerbock'],
 [22,'Akku 18650 Li-Ion mit Schutzschaltung','2','1S2P, 3,6 V','Kaufteil','im Messgehäuse'],
 [23,'ESP32-DevKitC, Laser-Treiber, Reedschalter, Buchse M8 IP68','1 Satz','','Kaufteil','Schaltplan Blatt LPH-130']
];
const bomTable=(rows,o={})=>`<table class="bom${o.small?' small':''}"><thead><tr><th>Pos.</th><th>Benennung</th><th>Menge</th><th>Werkstoff / Ausführung</th><th>Zeichnung</th><th>Bemerkung</th></tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td${i===0||i===2?' class="c"':''}>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const box=(x,y,w,h,html,cls='')=>`<div class="ov ${cls}" style="left:${x}mm;top:${y}mm;width:${w}mm;${h?`height:${h}mm;`:''}">${html}</div>`;

// =====================================================================
// Blatt 1: Übersicht
// =====================================================================
{
 let svg=await pic('iso-gesamt',25,15,190,118,CROP.isoGes)+await pic('iso-heck',220,15,185,118,CROP.isoHeck);
 svg+=await pic('iso-heck-unten',25,138,190,70,CROP.unten)+await pic('iso-heck-oben',220,138,185,70,CROP.oben);
 svg+=text(28,20,'Schalung DSS-Flex mit Heckmodul (Fahrstellung)',{size:3,anchor:'start',cls:'cap'})+text(223,20,'Heckmodul am Unterteil',{size:3,anchor:'start',cls:'cap'});
 svg+=text(28,143,'Unterseite: Verbindungslasche und Rad im Ausschnitt',{size:3,anchor:'start',cls:'cap'})+text(223,143,'Von oben: Federung außen neben dem Rad',{size:3,anchor:'start',cls:'cap'});
 const html=box(25,213,220,0,`<h1>Laser-Heckmodul für DSS-Flex</h1><p>Die Stützplatte unter dem Bumper wird nach hinten verlängert. Darauf sitzen – flach und geschützt – Messgehäuse, Kabelkanal und Laserturm. Hinten läuft wie vorne ein RAD DN70, hier in einer <b>gefederten Schwinge</b>: Muffen und Versätze drücken das Rad bis 12 mm ein, statt es zu beschädigen. Ein Magnet in der Radwelle und ein vergossener AS5600-Sensor messen den Weg. Die Laserlinie liegt ${laserX-shieldX} mm hinter der hinteren Schildkante quer am Scheitel.</p>`,'intro')
  +box(250,140,155,0,'',''); // Platzhalter
 const facts=box(250,213,157,0,`<table class="facts"><tr><th>Bezugsmaß Stoßfuge → Laserlinie</th><td>${fmt(laserX)} mm</td></tr><tr><th>Laserlinie hinter Schildkante</th><td>${fmt(laserX-shieldX)} mm</td></tr><tr><th>Rückweg L (offen / Abschluss)</th><td>${Lopen} / ${Lclosed} mm (Darstellungsannahme, bei Inbetriebnahme messen)</td></tr><tr><th>Federweg Rad</th><td>+12 / −6 mm</td></tr><tr><th>Baubreite / -länge</th><td>${P.plate.w} × ${fmt(P.plate.x1)} mm (+ Rad bis ${fmt(axle[0]+S.wheel.r)} mm)</td></tr></table>`);
 sheet({name:'Übersicht und Kenndaten',no:'LPH-000',scale:'—',svg,html:html+facts});
}

// =====================================================================
// Blatt 2: Zusammenbau 1:1 (Vorderansicht von der Radseite, Draufsicht darunter, Projektion 1)
// =====================================================================
{
 const ox=70,oy=95,FX=u=>ox+u,FY=v=>oy-v;let s='';
 const tw=P.tower,ch=P.channel,ho=P.housing,bk=P.block,br=P.bracket,se=P.seat,pl=P.plate,hw=pl.w/2;
 const xr=FX(axle[0]+S.wheel.r);
 // --- Vorderansicht (Blick von −z auf die Radseite). Zeichenfolge von hinten nach vorne,
 // weiß gefüllte Flächen verdecken dahinterliegende Kanten.
 s+=text(FX(-30),FY(62),'Vorderansicht',{size:3.5,anchor:'start',cls:'vt'})+text(FX(-30),FY(57),'Blick auf die Radseite (−z)',{size:2.4,anchor:'start',cls:'mut'});
 s+=rect(FX(tw.x0),FY(0),FX(tw.x1),FY(tw.h-2))+rect(FX(tw.x0-1),FY(tw.h-2),FX(tw.x1+1),FY(tw.h));
 s+=rect(FX(ch.x0),FY(0),FX(ch.x1),FY(ch.h));
 s+=rect(FX(ho.x0),FY(0),FX(ho.x1),FY(ho.h-ho.lid))+rect(FX(ho.x0-1),FY(ho.h-ho.lid),FX(ho.x1+1),FY(ho.h));
 s+=circ(FX(ho.x0+20),FY(12),5)+circ(FX(ho.x0+20),FY(12),2.2,'t');
 s+=circ(FX(axle[0]),FY(axle[1]),S.wheel.r)+circ(FX(axle[0]),FY(axle[1]),S.wheel.r-6,'t')+circ(FX(axle[0]),FY(axle[1]),11,'t');
 s+=rect(FX(-30),FY(0),FX(0),FY(-pl.t),'ph')+poly([[FX(-30),FY(2)],[FX(-28),FY(-1)],[FX(-32),FY(-5)],[FX(-30),FY(-9)]],'t',false);
 s+=rect(FX(0),FY(0),FX(pl.x1),FY(-pl.t))+rect(FX(P.strap.x0),FY(-pl.t),FX(P.strap.x1),FY(-pl.t-P.strap.t));
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
 s+=line(FX(laserX),FY(tw.h+4),FX(laserX),FY(-3),'c')+line(FX(laserX),FY(tw.h),FX(laserX),FY(tw.h+30),'laser');
 s+=line(FX(shieldX),FY(tw.h+30),FX(shieldX),FY(tw.h+2),'ph')+text(FX(shieldX)-1,FY(tw.h+31),'hintere Schildkante',{size:2.6,anchor:'end',cls:'mut'});
 s+=text(FX(laserX)+1.5,FY(tw.h+28),'Laserebene',{size:2.6,anchor:'start',cls:'laserT'});
 s+=line(FX(0),FY(10),FX(0),FY(0),'ph')+text(FX(1.2),FY(3),'Stoßfuge',{size:2.4,anchor:'start',cls:'mut'});
 s+=text(FX(-28),FY(14),'Stützplatte (Bestand)',{size:2.2,anchor:'start',cls:'mut'});
 const yT=FY(Math.max(tw.h,br.y+br.t));
 s+=dimH(FX(0),FX(pivot[0]),FY(0),FY(pivot[1]),yT-4,fmt(pivot[0]));
 s+=dimH(FX(0),FX(laserX),FY(0),FY(tw.h),yT-11,fmt(laserX));
 s+=dimH(FX(0),FX(axle[0]),FY(0),FY(axle[1]),yT-18,fmt(axle[0]));
 s+=dimH(FX(shieldX),FX(laserX),FY(tw.h+20),FY(tw.h+20),FY(tw.h+22),fmt(laserX-shieldX),{left:true});
 s+=dimV(FY(0),FY(tw.h),FX(tw.x1+1),FX(tw.x1+1),xr+6,fmt(tw.h));
 s+=dimV(FY(0),FY(br.y+br.t),FX(br.x1),FX(br.x1),xr+14,fmt(br.y+br.t));
 s+=dimV(FY(0),FY(-pl.t),FX(pl.x1),FX(pl.x1),xr+6,fmt(pl.t),{below:true});
 s+=dimV(FY(-pl.t),FY(axle[1]-S.wheel.r),FX(axle[0]),FX(axle[0]),xr+14,fmt(-(axle[1]-S.wheel.r)-pl.t),{below:true});
 s+=dimV(FY(0),FY(ho.h),FX(ho.x0-1),FX(ho.x0-1),FX(ho.x0)-8,fmt(ho.h));
 s+=dimH(FX(P.strap.x0),FX(P.strap.x1),FY(-pl.t-P.strap.t),FY(-pl.t-P.strap.t),FY(-pl.t-P.strap.t)+9,fmt(P.strap.x1-P.strap.x0));
 s+=dimH(FX(0),FX(pl.x1),FY(-pl.t),FY(-pl.t),FY(-pl.t-P.strap.t)+16,fmt(pl.x1));
 s+=note(FX(axle[0])+S.wheel.r*.71,FY(axle[1]-S.wheel.r*.71),xr+22,FY(-38),'Ø70 RAD DN70');
 s+=text(xr+22,FY(-38)+3.6,'Stellung DN 350–400, Federweg 0',{size:2.3,anchor:'start',cls:'mut'});
 // --- Draufsicht (unter der Vorderansicht; unten = Radseite −z)
 const oy2=196,TY=z=>oy2-z,nt=P.notch,rc=pl.corner;
 s+=text(FX(-30),TY(hw)-8,'Draufsicht',{size:3.5,anchor:'start',cls:'vt'});
 s+=`<path d="M${FX(0)} ${TY(hw)}L${FX(pl.x1-rc)} ${TY(hw)}Q${FX(pl.x1)} ${TY(hw)} ${FX(pl.x1)} ${TY(hw-rc)}L${FX(pl.x1)} ${TY(nt.z1)}L${FX(nt.x0)} ${TY(nt.z1)}L${FX(nt.x0)} ${TY(nt.z0)}L${FX(pl.x1)} ${TY(nt.z0)}L${FX(pl.x1)} ${TY(-hw+rc)}Q${FX(pl.x1)} ${TY(-hw)} ${FX(pl.x1-rc)} ${TY(-hw)}L${FX(0)} ${TY(-hw)}Z" class="v"/>`;
 s+=rect(FX(-30),TY(hw),FX(0),TY(-hw),'ph');
 for(const h of holes)s+=circ(FX(h.x),TY(h.z),h.d/2);
 s+=rect(FX(P.strap.x0),TY(P.strap.w/2),FX(P.strap.x1),TY(-P.strap.w/2),'h',4);
 s+=rect(FX(ch.x0),TY(ch.z0),FX(ch.x1),TY(ch.z1),'v',2);
 s+=rect(FX(bk.x0),TY(bk.z0),FX(bk.x1),TY(bk.z1),'v',1.5);
 const az=S.fork.armZ,at2=S.fork.armT;
 for(const z of az)s+=rect(FX(pivot[0]-6),TY(z-at2/2),FX(pivot[0]+armLen+8),TY(z+at2/2),'v',1);
 s+=rect(FX(pivot[0]-6),TY(az[0]-at2/2),FX(pivot[0]+6),TY(az[1]+at2/2));
 s+=rect(FX(se.x0),TY(se.z0),FX(se.x1),TY(az[0]-at2/2));
 s+=rect(FX(bk.x0),TY(bk.z0),FX(bk.x1),TY(bk.slot[0]),'v',1)+rect(FX(bk.x0),TY(bk.slot[1]),FX(bk.x1),TY(bk.z1),'v',1);
 s+=rect(FX(axle[0]-S.wheel.r),TY(S.wheel.z-S.wheel.w/2),FX(axle[0]+S.wheel.r),TY(S.wheel.z+S.wheel.w/2),'v',1);
 s+=rect(FX(axle[0]-8),TY(az[0]-at2/2),FX(axle[0]+8),TY(az[0]-at2/2-9),'v',1);
 s+=rect(FX(ho.x0-1),TY(ho.w/2+1),FX(ho.x1+1),TY(-ho.w/2-1),'v',9);
 for(const [x,z] of [[ho.x0+8,ho.w/2-8],[ho.x0+8,-ho.w/2+8],[ho.x1-8,ho.w/2-8],[ho.x1-8,-ho.w/2+8]])s+=circ(FX(x),TY(z),3,'t');
 s+=circ(FX(ho.x0+16),TY(0),2.4,'t')+rect(FX(ho.x0+15),TY(-ho.w/2-1),FX(ho.x0+25),TY(-ho.w/2-7));
 s+=rect(FX(tw.x0-1),TY(tw.z0-1),FX(tw.x1+1),TY(tw.z1+1),'v',6)+rect(FX(tw.x0),TY(tw.z0),FX(tw.x1),TY(tw.z1),'t',5);
 for(const [z,c] of [[S.tower.laserZ[0],'red'],[S.tower.laserZ[1],'grn']])s+=circ(FX(laserX),TY(z),4.2,'v '+c)+circ(FX(laserX),TY(z),6,'t');
 s+=rect(FX(br.x0),TY(br.z0),FX(br.x1),TY(br.z1),'v',1.5)+circ(FX(P.spring.x),TY(P.spring.z),P.spring.od/2,'h');
 s+=line(FX(-34),TY(0),FX(pl.x1+18),TY(0),'c')+line(FX(laserX),TY(hw+6),FX(laserX),TY(-hw-4),'c')+line(FX(axle[0]),TY(-hw-4),FX(axle[0]),TY(-10),'c')+line(FX(pivot[0]-10),TY(S.wheel.z),FX(axle[0]+S.wheel.r+6),TY(S.wheel.z),'c');
 const c0=FX(axle[0]+S.wheel.r)+6;
 s+=dimV(TY(hw),TY(-hw),FX(-30),FX(-30),FX(-36),fmt(pl.w));
 s+=dimV(TY(0),TY(S.tower.laserZ[0]),FX(tw.x1+1),FX(tw.x1+1),c0,fmt(S.tower.laserZ[0]));
 s+=dimV(TY(0),TY(S.tower.laserZ[1]),FX(tw.x1+1),FX(tw.x1+1),c0+8,fmt(S.tower.laserZ[1]));
 s+=dimV(TY(0),TY(S.wheel.z),FX(axle[0]+S.wheel.r),FX(axle[0]+S.wheel.r),c0,fmt(-S.wheel.z));
 s+=dimV(TY(nt.z1),TY(nt.z0),FX(pl.x1),FX(pl.x1),c0+16,fmt(nt.z1-nt.z0));
 // Positionsnummern (Kreise außerhalb der Ansicht, nicht im Schriftfeld)
 const by=TY(-hw)+17,bt=TY(hw)-8;
 const b=[[1,FX(60),TY(-44),FX(60),by],[2,FX(-14),TY(-30),FX(-14),by],[6,FX(140),TY(-13),FX(118),by],[7,FX(152),TY(-49),FX(136),by],[10,FX(177),TY(-47),FX(154),by],[8,FX(197),TY(-41),FX(172),by],
  [3,FX(100),TY(20),FX(100),bt],[4,FX(158),TY(30),FX(158),bt],[5,FX(208),TY(42),FX(190),bt],[9,FX(228),TY(-33),c0+32,TY(-22)],[11,FX(206),TY(-50),c0+32,TY(-40)]];
 for(const [num,tx,ty,bx,by2] of b)s+=balloon(bx,by2,num,tx,ty);
 const html=box(332,14,76,0,`<h3>Hinweise</h3><ol><li>Heckmodul komplett am Unterteil: hebt beim Anpressen nicht mit an.</li><li>Darstellung DN 350–400. Radlage je DN, Schnitt im Rohr und Laserschatten: LPH-140.</li><li>Stoßfuge → Laserlinie <b>${fmt(laserX)} mm</b> = ${fmt(laserX-shieldX)} mm hinter der hinteren Schildkante. Lage der Schildkante am Gerät nachmessen.</li><li>2 × M6 in der Bestand-Stützplatte (20 mm vor der Stoßfuge, ±25) erst nach Prüfung der Unterseite.</li><li>Schrauben mit mittelfester Sicherung, Senkschrauben von unten bündig.</li><li>Rad, Schwinge, Feder auf der Radseite (−z), Laser auf der Gegenseite.</li></ol>`,'notes');
 sheet({name:'Zusammenbau Heckmodul',no:'LPH-100',scale:'1:1',material:'—',svg:s,html});
}

// =====================================================================
// Blatt 3: Explosionsdarstellung und Stückliste
// =====================================================================
{
 const an=await anchors('explosion'),cr=CROP.explosion,x=22,y=14,w=200,h=100,sc=Math.min(w/(cr[2]-cr[0]),h/(cr[3]-cr[1])),offX=x+(w-(cr[2]-cr[0])*sc)/2,offY=y+(h-(cr[3]-cr[1])*sc)/2;
 const pt=k=>[offX+(an[k][0]*1600-cr[0])*sc,offY+(an[k][1]*1000-cr[1])*sc];
 let s=await pic('explosion',x,y,w,h,cr);
 const pos={plate:1,strap:2,housing:3,channel:4,tower:5,block:6,bracket:7,fork:8,wheel:9,spring:10,sensor:11};
 const off={plate:[12,22],strap:[18,12],housing:[18,-16],channel:[-22,10],tower:[-20,-6],block:[-18,-8],bracket:[18,-8],fork:[-14,-14],wheel:[-24,4],spring:[-18,4],sensor:[12,-16]};
 for(const [k,num] of Object.entries(pos)){if(!an[k])continue;const [px,py]=pt(k);s+=balloon(px+off[k][0],py+off[k][1],num,px,py);}
 s+=text(25,19,'Explosionsdarstellung (Positionsnummern wie Stückliste)',{size:3,anchor:'start',cls:'cap'});
 s+=await pic('m6',228,14,180,100,CROP.m)+text(231,19,'Zusammengebaut',{size:3,anchor:'start',cls:'cap'});
 const html=box(22,118,386,0,bomTable(bom));
 sheet({name:'Explosionsdarstellung und Stückliste',no:'LPH-101',scale:'—',svg:s,html});
}

// =====================================================================
// Blatt 4: Pos. 1 Verlängerungsplatte, Pos. 2 Verbindungslasche
// =====================================================================
{
 let s='';const ox=45,oy=105,FX=u=>ox+u,TY=z=>oy-z,pl=P.plate,nt=P.notch,hw=pl.w/2,rc=pl.corner;
 s+=text(FX(0),TY(hw)-14,'Pos. 1 Verlängerungsplatte · Draufsicht (Oberseite)',{size:3.5,anchor:'start',cls:'vt'})+text(FX(0),TY(hw)-9.5,'Bohrungen nach Koordinatentabelle, Bezug Stoßfuge (x′ = 0) und Plattenmitte (z = 0)',{size:2.6,anchor:'start',cls:'mut'});
 s+=`<path d="M${FX(0)} ${TY(hw)}L${FX(pl.x1-rc)} ${TY(hw)}Q${FX(pl.x1)} ${TY(hw)} ${FX(pl.x1)} ${TY(hw-rc)}L${FX(pl.x1)} ${TY(nt.z1)}L${FX(nt.x0)} ${TY(nt.z1)}L${FX(nt.x0)} ${TY(nt.z0)}L${FX(pl.x1)} ${TY(nt.z0)}L${FX(pl.x1)} ${TY(-hw+rc)}Q${FX(pl.x1)} ${TY(-hw)} ${FX(pl.x1-rc)} ${TY(-hw)}L${FX(0)} ${TY(-hw)}Z" class="v"/>`;
 const ids=['A1','A2','B1','B2','B3','B4','C1','C2','D1','D2'];
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
 const tab=`<table class="holes"><thead><tr><th>Kenn.</th><th>x′</th><th>z</th><th>Ausführung</th><th>für</th></tr></thead><tbody>${holes.map((h,i)=>`<tr><td>${ids[i]}</td><td>${fmt(h.x)}</td><td>${fmt(h.z)}</td><td>${h.d>6?'M6 durch':h.d===5.5?'Ø5,5 · Senkung 90° Ø10,4':'Ø4,5 · Senkung 90° Ø8,4'}</td><td>${['Lasche Pos. 2','Lasche Pos. 2','Gehäuse Pos. 3','Gehäuse Pos. 3','Gehäuse Pos. 3','Gehäuse Pos. 3','Laserturm Pos. 5','Laserturm Pos. 5','Lagerbock Pos. 6 außen','Lagerbock Pos. 6 innen'][i]}</td></tr>`).join('')}<tr><td>E1/E2</td><td>−20</td><td>±25</td><td>M6 durch</td><td>Bestand-Stützplatte (nachbohren)</td></tr></tbody></table><p class="mut">x′ ab Stoßfuge nach hinten, z ab Plattenmitte (+ = Laserseite). Werkstoff EN AW-6082 T6, Platte 7 mm (wie Stützplatte), eloxiert, Kanten gebrochen 0,5. Der Radausschnitt ist hinten offen, damit die Schwinge frei einfedern kann.</p>`;
 sheet({name:'Verlängerungsplatte und Verbindungslasche',no:'LPH-110',scale:'1:1',material:'Pos. 1 EN AW-6082 T6 · Pos. 2 1.4301',svg:s,html:box(292,40,116,0,tab)});
}

// =====================================================================
// Blatt 5: Pos. 6 Lagerbock, Pos. 7 Federwinkel, Pos. 8 Schwinge, Pos. 14 Radwelle (2:1)
// =====================================================================
{
 let s='';const k=2,bk=P.block,br=P.bracket,se=P.seat;
 // Pos. 6 Lagerbock: Vorderansicht entlang x (U-Form) und Seitenansicht
 {const ox=55,oy=95,UX=z=>ox+(z-bk.z0)*k,UY=v=>oy-v*k,w=bk.z1-bk.z0;
  s+=text(ox+w,UY(bk.h)-22,'Pos. 6 Lagerbock (Gabelkopf) 2:1',{size:3.5,cls:'vt'});
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
 // Pos. 7 Federwinkel (von −z), Draufsicht
 {const ox=250,oy=95,FX=u=>ox+(u-br.x0)*k,FY=v=>oy-(v-24)*k,L=br.x1-br.x0,wb=br.web-br.x0,hh=br.y+br.t-24;
  s+=text(ox+L,FY(br.y+br.t)-22,'Pos. 7 Federwinkel 2:1',{size:3.5,cls:'vt'});
  s+=poly([[FX(br.x0),FY(24)],[FX(br.web),FY(24)],[FX(br.web),FY(br.y)],[FX(br.x1),FY(br.y)],[FX(br.x1),FY(br.y+br.t)],[FX(br.x0),FY(br.y+br.t)]]);
  s+=line(FX(br.x0+wb/2)-2.25*k,FY(24),FX(br.x0+wb/2)-2.25*k,FY(br.y+br.t)+3.4*k,'h')+line(FX(br.x0+wb/2)+2.25*k,FY(24),FX(br.x0+wb/2)+2.25*k,FY(br.y+br.t)+3.4*k,'h')+line(FX(br.x0+wb/2),FY(22),FX(br.x0+wb/2),FY(br.y+br.t+2),'c');
  s+=rect(FX(br.x0+wb/2)-3.6*k,FY(br.y+br.t),FX(br.x0+wb/2)+3.6*k,FY(br.y+br.t)+3.4*k,'h');
  s+=line(FX(P.spring.x)-6.25*k,FY(br.y),FX(P.spring.x)-6.25*k,FY(br.y)-1*k,'h')+line(FX(P.spring.x)+6.25*k,FY(br.y),FX(P.spring.x)+6.25*k,FY(br.y)-1*k,'h')+line(FX(P.spring.x),FY(br.y)+3,FX(P.spring.x),FY(br.y+br.t)-3,'c');
  s+=dimH(FX(br.x0),FX(br.x1),FY(br.y+br.t),FY(br.y+br.t),FY(br.y+br.t)-8,fmt(L))+dimH(FX(br.x0),FX(P.spring.x),FY(br.y),FY(br.y),FY(24)+8,fmt(P.spring.x-br.x0))+dimH(FX(br.x0),FX(br.web),FY(24),FY(24),FY(24)+16,fmt(wb));
  s+=dimV(FY(24),FY(br.y+br.t),FX(br.x1),FX(br.x1),FX(br.x1)+8,fmt(hh))+dimV(FY(br.y),FY(br.y+br.t),FX(br.x1),FX(br.x1),FX(br.x1)+16,fmt(br.t));
  s+=note(FX(br.x0+wb/2)-2.25*k,FY(26),FX(br.x0)-2,FY(24)+36,'Ø4,5 durch, Senkung Ø8 × 4,4 für M4');
  s+=note(FX(P.spring.x)-5*k,FY(br.y)+.5*k,FX(br.web)+5,FY(34),'Federführung Ø12,5 × 1 tief',{right:true});
  s+=text(FX(br.x0)+L*k/2,FY(24)+26,`Breite (z) ${fmt(br.z1-br.z0)} mm, z ${fmt(br.z0)} … ${fmt(br.z1)}`,{size:2.6,cls:'mut'});
 }
 // Pos. 8 Schwinge: Seitenansicht und Draufsicht (U-Form)
 {const ox=60,oy=150,FX=u=>ox+(u+6)*k,FY=v=>oy-v*k,L=Math.round(armLen*10)/10,az=S.fork.armZ,at=S.fork.armT;
  s+=text(ox,oy-32,'Pos. 8 Schwinge 2:1',{size:3.5,anchor:'start',cls:'vt'});
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
  s+=text(FX(L)+20,TZ(se.z0)-2,'Federteller außen (Radseite −z),',{size:2.6,anchor:'start',cls:'mut'})+text(FX(L)+20,TZ(se.z0)+1.8,'Federführung Ø12,5 × 1 tief',{size:2.6,anchor:'start',cls:'mut'});
 }
 // Pos. 14 Radwelle
 {const ox=300,oy=190,FX=u=>ox+u*k,FY=v=>oy-v*k,L=S.fork.armZ[1]-S.fork.armZ[0]+S.fork.armT;
  s+=text(ox+L,oy-20,'Pos. 14 Radwelle 2:1',{size:3.5,cls:'vt'});
  s+=rect(FX(0),FY(4),FX(L),FY(-4))+line(FX(-3),FY(0),FX(L+3),FY(0),'c')+rect(FX(0),FY(3.05),FX(2.6),FY(-3.05),'h');
  for(const g of [3.8,L-3.8-1.1])s+=rect(FX(g),FY(4),FX(g+1.1),FY(-4),'t');
  s+=dimH(FX(0),FX(L),FY(-4),FY(-4),FY(-4)+10,fmt(L))+dimV(FY(4),FY(-4),FX(L),FX(L),FX(L)+8,'Ø8 h6');
  s+=note(FX(1.3),FY(2),FX(-4),FY(4)-12,'Senkung Ø6,1 × 2,6 (Magnet Pos. 15)');
  s+=note(FX(4.35),FY(-4),FX(10),FY(-4)+20,'2 × Nut DIN 471 für Lagerspiel');
  s+=text(ox+L,FY(-4)+30,'Rad auf Welle mit Madenschraube M4 (Nabe) geklemmt;',{size:2.6,cls:'mut'})+text(ox+L,FY(-4)+34,'Welle dreht in den Kugellagern mit, Magnet zeigt zum Sensor.',{size:2.6,cls:'mut'});
 }
 sheet({name:'Lagerbock, Federwinkel, Schwinge, Radwelle',no:'LPH-120',scale:'2:1',material:'EN AW-7075 T6 · Welle 1.4305',svg:s});
}

// =====================================================================
// Blatt 6: Pos. 3 Messgehäuse, Pos. 4 Kabelkanal, Pos. 5 Laserturm, Pos. 11 Sensorkopf, Schaltplan
// =====================================================================
{
 let s='';const ho=P.housing,ch=P.channel,tw=P.tower;
 // Messgehäuse Draufsicht 1:1 und Schnitt
 {const ox=40,oy=80,FX=u=>ox+(u-ho.x0),TY=z=>oy-z,L=ho.x1-ho.x0;
  s+=text(ox+L/2,TY(ho.w/2)-14,'Pos. 3 Messgehäuse 1:1',{size:3.5,cls:'vt'});
  s+=rect(FX(ho.x0),TY(ho.w/2),FX(ho.x1),TY(-ho.w/2),'v',8)+rect(FX(ho.x0)+3,TY(ho.w/2)+3,FX(ho.x1)-3,TY(-ho.w/2)-3,'h',5);
  for(const [x,z] of [[ho.x0+8,ho.w/2-8],[ho.x0+8,-ho.w/2+8],[ho.x1-8,ho.w/2-8],[ho.x1-8,-ho.w/2+8]])s+=circ(FX(x),TY(z),1.25)+circ(FX(x),TY(z),3,'h');
  for(const [x,z] of [[82,38],[82,-38],[127,38],[127,-38]])s+=circ(FX(x),TY(z),2.5,'h')+circ(FX(x),TY(z),5,'h');
  s+=line(FX(ho.x0)-4,TY(0),FX(ho.x1)+4,TY(0),'c');
  s+=dimH(FX(ho.x0),FX(ho.x1),TY(ho.w/2),TY(ho.w/2),TY(ho.w/2)-6,fmt(L))+dimV(TY(ho.w/2),TY(-ho.w/2),FX(ho.x1),FX(ho.x1),FX(ho.x1)+8,fmt(ho.w));
  s+=dimH(FX(ho.x0),FX(82),TY(-ho.w/2),TY(-ho.w/2),TY(-ho.w/2)+7,fmt(82-ho.x0))+dimH(FX(ho.x0),FX(127),TY(-ho.w/2),TY(-ho.w/2),TY(-ho.w/2)+13,fmt(127-ho.x0))+dimV(TY(38),TY(-38),FX(ho.x0),FX(ho.x0),FX(ho.x0)-8,'76');
  s+=note(FX(127)+1.8,TY(-38)-1.8,FX(ho.x1)+12,TY(-ho.w/2)+18,'4 × Dom Ø10, M5 × 8 tief (von unten)');
  s+=note(FX(ho.x0+8)-1,TY(-ho.w/2+8)+1,FX(ho.x0)+4,TY(-ho.w/2)+21,'4 × M3 Deckel, Ecken R8',{right:true});
  s+=text(FX(ho.x0)+L/2,TY(-ho.w/2)+30,`Höhe ${ho.h} (Unterteil ${ho.h-ho.lid} + Deckel ${ho.lid}), Wand und Boden 3, Dichtung 2 mm im Deckel`,{size:2.6,cls:'mut'});
  s+=text(FX(ho.x0)+L/2,TY(-ho.w/2)+34,'Seite −z: Buchse M8 IP68 (Laden/USB) · Deckel: Lichtleiter Ø3 für Status-LED, Reedkontakt innen (Ein/Aus mit Magnet)',{size:2.6,cls:'mut'});
 }
 // Kabelkanal und Laserturm (von −z) 1:1, Draufsicht Turm 2:1
 {const ox=200,oy=80,FX=u=>ox+(u-ch.x0),FY=v=>oy-v;
  s+=text(ox+40,FY(tw.h)-14,'Pos. 4 Kabelkanal und Pos. 5 Laserturm 1:1',{size:3.5,cls:'vt'});
  s+=rect(FX(ch.x0),FY(0),FX(ch.x1),FY(ch.h))+rect(FX(ch.x0),FY(0)-2,FX(ch.x1),FY(ch.h)+2,'h');
  s+=rect(FX(tw.x0),FY(0),FX(tw.x1),FY(tw.h-2))+rect(FX(tw.x0-1),FY(tw.h-2),FX(tw.x1+1),FY(tw.h));
  s+=rect(FX(laserX)-6,FY(tw.h-2),FX(laserX)+6,FY(tw.h-32),'h')+line(FX(laserX),FY(tw.h+8),FX(laserX),FY(-4),'c')+line(FX(laserX),FY(tw.h),FX(laserX),FY(tw.h+14),'laser');
  for(const x of [188,208])s+=line(FX(x)-2.5,FY(0),FX(x)-2.5,FY(8),'h')+line(FX(x)+2.5,FY(0),FX(x)+2.5,FY(8),'h');
  s+=dimH(FX(ch.x0),FX(ch.x1),FY(0),FY(0),FY(0)+8,fmt(ch.x1-ch.x0))+dimH(FX(tw.x0),FX(tw.x1),FY(0),FY(0),FY(0)+8,fmt(tw.x1-tw.x0))+dimH(FX(tw.x0),FX(laserX),FY(tw.h),FY(tw.h),FY(tw.h)-6,fmt(laserX-tw.x0),{left:true});
  s+=dimV(FY(0),FY(ch.h),FX(ch.x0),FX(ch.x0),FX(ch.x0)-6,fmt(ch.h))+dimV(FY(0),FY(tw.h),FX(tw.x1+1),FX(tw.x1+1),FX(tw.x1)+8,fmt(tw.h))+dimV(FY(tw.h-2),FY(tw.h-32),FX(tw.x1+1),FX(tw.x1+1),FX(tw.x1)+16,'30');
  s+=note(FX(laserX)+6,FY(tw.h-20),FX(tw.x1)+26,FY(tw.h)-6,'2 × Ø12 H7 × 30 (Laser Pos. 12/13)');
  s+=note(FX(tw.x0-1)+.5,FY(tw.h-1),FX(tw.x0)-14,FY(tw.h)-8,'Schutzfenster PMMA 2, geklebt');
  s+=note(FX(208)+2.5,FY(4),FX(tw.x1)+26,FY(0)+14,'2 × M5 × 8 tief (von unten)');
  // Turm Draufsicht 2:1
  const k=2,tx=316,ty=172,TX=u=>tx+(u-tw.x0)*k,TZ=z=>ty-(z-(tw.z0+tw.z1)/2)*k;
  s+=text(tx+32,TZ(tw.z1)-10,'Laserturm Draufsicht 2:1',{size:3,cls:'vt'});
  s+=rect(TX(tw.x0),TZ(tw.z1),TX(tw.x1),TZ(tw.z0),'v',5*k);
  for(const z of S.tower.laserZ)s+=circ(TX(laserX),TZ(z),6*k)+cross(TX(laserX),TZ(z),8*k);
  s+=dimV(TZ(tw.z1),TZ(tw.z0),TX(tw.x1),TX(tw.x1),TX(tw.x1)+8,fmt(tw.z1-tw.z0))+dimV(TZ(S.tower.laserZ[0]),TZ(S.tower.laserZ[1]),TX(tw.x1),TX(tw.x1),TX(tw.x1)+16,fmt(S.tower.laserZ[1]-S.tower.laserZ[0]));
  s+=text(TX(laserX)-6*k-2,TZ(S.tower.laserZ[0])+1,'rot',{size:2.6,anchor:'end',cls:'redT'})+text(TX(laserX)-6*k-2,TZ(S.tower.laserZ[1])+1,'grün',{size:2.6,anchor:'end',cls:'grnT'});
  s+=text(TX(tw.x0)+16*k,TZ(tw.z0)+10,`z ${tw.z0} … ${tw.z1} (Laserseite), Kabelbohrung Ø6 zum Kanal`,{size:2.6,cls:'mut'});
 }
 // Sensorkopf und Schaltplan
 {const ox=40,oy=180,k=2;
  s+=text(ox+30,oy-8,'Pos. 11 Drehgeberkopf 2:1',{size:3.5,cls:'vt'});
  s+=circ(ox+20,oy+22,8*k)+circ(ox+20,oy+22,4*k,'h')+rect(ox+60,oy+22-8*k,ox+60+9*k,oy+22+8*k)+rect(ox+60+1*k,oy+22-6*k,ox+60+2.6*k,oy+22+6*k,'h')+line(ox+60+9*k,oy+22,ox+60+9*k+14,oy+22,'cable');
  s+=dimV(oy+22-8*k,oy+22+8*k,ox+60,ox+60,ox+60-8,'Ø16')+dimH(ox+60,ox+60+9*k,oy+22+8*k,oy+22+8*k,oy+22+8*k+6,'9');
  s+=text(ox+40,oy+52,'AS5600-Platine vergossen, Chip mittig, Luftspalt 1,0 ± 0,5 zum Magneten;',{size:2.6,cls:'mut'})+text(ox+40,oy+56,'2 × M2 an den äußeren Schwingenarm, Kabel PUR 4 × 0,14 außen geführt.',{size:2.6,cls:'mut'});
 }
 const wiring=`<h3>Schaltplan (Blockbild)</h3><svg viewBox="0 0 150 72" class="wire"><g font-size="3.2" text-anchor="middle">
 <rect x="2" y="6" width="30" height="16" rx="2"/><text x="17" y="13">2 × 18650</text><text x="17" y="18" class="wm">1S2P + Schutz</text>
 <rect x="2" y="32" width="30" height="12" rx="2"/><text x="17" y="39.5">Lademodul</text><text x="17" y="52" class="wm">Buchse M8</text>
 <rect x="44" y="6" width="26" height="16" rx="2"/><text x="57" y="13">Reed-</text><text x="57" y="18">schalter</text>
 <rect x="82" y="6" width="26" height="16" rx="2"/><text x="95" y="13">Step-up</text><text x="95" y="18">5 V</text>
 <rect x="82" y="32" width="30" height="26" rx="2"/><text x="97" y="42">ESP32</text><text x="97" y="47" class="wm">DevKitC</text><text x="97" y="53" class="wm">WLAN-Setup</text>
 <rect x="120" y="6" width="28" height="16" rx="2"/><text x="134" y="13">2 × MOSFET</text><text x="134" y="18" class="wm">GPIO 25 / 26</text>
 <rect x="120" y="32" width="28" height="12" rx="2" class="red"/><text x="134" y="39.5">Laser rot</text>
 <rect x="120" y="48" width="28" height="12" rx="2" class="grn"/><text x="134" y="55.5">Laser grün</text>
 <rect x="44" y="40" width="26" height="18" rx="2"/><text x="57" y="47">AS5600</text><text x="57" y="52" class="wm">I²C 0x36</text><text x="57" y="56" class="wm">SDA 21 / SCL 22</text>
 <path d="M32 14H44M70 14H82M108 14H120M95 22V32M17 22V32M112 45H116V26H134V22M134 26V32M148 14H149V54H148M70 49H82"/></g></svg>`;
 sheet({name:'Gehäuse, Laserturm, Sensor, Schaltplan',no:'LPH-130',scale:'1:1 / 2:1',material:'EN AW-6082 T6 eloxiert',svg:s,html:box(150,170,150,0,wiring)});
}

// =====================================================================
// Blatt 7: Federung, Einbaulage je DN, Schnitt in der Laserebene
// =====================================================================
{
 let s=await pic('feder-0',22,16,94,58,CROP.feder)+await pic('feder-12',120,16,94,58,CROP.feder);
 s+=text(24,20,'Federweg 0',{size:2.8,anchor:'start',cls:'cap'})+text(122,20,'Muffe/Versatz: +12 mm',{size:2.8,anchor:'start',cls:'cap'});
 // Querschnitte in der Laserebene 1:5: Rohr, Heckmodul, abgesenktes Zentralrohr, Lichtfächer.
 const k=.2,shadowRows=[];
 const section=(dn,cx,cy)=>{const f=families.find(q=>q.id===dn),R=dn/2,b=-125-f.spacer.reduce((a,c)=>a+c,0),tp=b+3.5,g=heckGeometry(R,b),Z=z=>cx+z*k,Yp=y=>cy-y*k;let o='';
  o+=`<circle cx="${n(cx)}" cy="${n(cy)}" r="${n((R+R*.09)*k)}" fill="url(#hatch)" stroke="#111" stroke-width=".35"/>`+circ(cx,cy,R*k,'v');
  o+=line(cx-(R+R*.09)*k-3,cy,cx+(R+R*.09)*k+3,cy,'c')+line(cx,cy-(R+R*.09)*k-3,cx,cy+(R+R*.09)*k+3,'c');
  // Lichtfächer und Linie je Laser
  for(const [zL,cls] of [[S.tower.laserZ[0],'fanR'],[S.tower.laserZ[1],'fanG']]){const vis=laserVisible(R,tp,zL),y0=tp+S.tower.h;
   for(const [a0,a1] of vis){const pts=[[Z(zL),Yp(y0)]];for(let i=0;i<=24;i++){const a=a0+(a1-a0)*i/24;pts.push([Z(R*Math.sin(a)),Yp(R*Math.cos(a))]);}o+=poly(pts,cls);}
   shadowRows.push({dn,zL,vis,R});}
  const arcs=(zL,cls,dr)=>laserVisible(R,tp,zL).map(([a0,a1])=>{const pts=[];for(let i=0;i<=30;i++){const a=a0+(a1-a0)*i/30;pts.push([Z((R-dr)*Math.sin(a)),Yp((R-dr)*Math.cos(a))]);}return poly(pts,cls,false);}).join('');
  o+=arcs(S.tower.laserZ[0],'lineR',.8/k*.6)+arcs(S.tower.laserZ[1],'lineG',2.4/k*.6);
  // Zentralrohr (abgesenkt), Platte, Gehäuse (dahinter), Turm, Rad
  o+=circ(Z(0),Yp(laserFan.tube.y),laserFan.tube.r*k,'v')+text(Z(0)+laserFan.tube.r*k+1.2,Yp(laserFan.tube.y)+1,'Zentralrohr',{size:2.2,anchor:'start',cls:'mut'});
  o+=rect(Z(-S.housing.w/2-1),Yp(tp),Z(S.housing.w/2+1),Yp(tp+S.housing.h),'ph');
  o+=rect(Z(-S.plate.w/2),Yp(tp),Z(S.plate.w/2),Yp(tp-S.plate.t),'v')+rect(Z(S.tower.z0-1),Yp(tp),Z(S.tower.z1+1),Yp(tp+S.tower.h),'v');
  o+=rect(Z(S.wheel.z-S.wheel.w/2),Yp(g.axle.y+S.wheel.r),Z(S.wheel.z+S.wheel.w/2),Yp(g.axle.y-S.wheel.r),'v');
  o+=text(cx,cy-(R+R*.09)*k-5,`${f.label} · 1:5`,{size:3.2,cls:'vt'});
  return o;};
 s+=section(700,316,130)+section(300,62,226);
 s+=text(318,16,'Schnitt in der Laserebene (Blick nach vorn, Schalung abgesenkt)',{size:3,cls:'cap'});
 const shadowTxt=r=>{const gaps=[];const [lo,hi]=[-laserFan.half,laserFan.half];let prev=lo;for(const [a0,a1] of r.vis){if(a0-prev>.005)gaps.push([prev,a0]);prev=a1;}if(hi-prev>.005)gaps.push([prev,hi]);return gaps.length?gaps.map(([a,b])=>`${Math.round(r.R*Math.sin(a))} … ${Math.round(r.R*Math.sin(b))}`).join(', '):'keine';};
 const allRows=families.map(f=>{const R=f.id/2,b=-125-f.spacer.reduce((a,c)=>a+c,0),tp=b+3.5;return S.tower.laserZ.map(zL=>({dn:f.label,zL,R,vis:laserVisible(R,tp,zL)}));}).flat();
 const html=box(22,78,192,0,`<h3>Einbaulage je Schalung (aus dem Modell)</h3><table class="bom"><thead><tr><th>Schalung</th><th>Rohr-Ø</th><th>Radachse über Plattenoberkante</th><th>Rad unter Plattenunterkante</th><th>Schwinge geneigt</th></tr></thead><tbody>${dnRows.map(r=>`<tr><td>${r.label}</td><td>${r.R*2}</td><td>${fmt(r.axle)}</td><td>${fmt(-r.wheelBelow)}</td><td>${fmt(r.angle)}°</td></tr>`).join('')}</tbody></table><p class="mut">Gleiche Teile für alle fünf Schalungen. Die Sohle liegt immer 28,5 mm unter der Plattenoberkante, nur die Krümmung ändert sich – die Radachse steht deshalb je DN bis 2,5 mm anders, die Feder gleicht das aus.</p>
 <h3>Feder (Rechenwerte, DN 350–400)</h3><table class="facts"><tr><th>Druckfeder</th><td>d ${fmt(dW)} · D<sub>a</sub> ${fmt(P.spring.od)} · L<sub>0</sub> ${P.spring.free} · n ${nA} · 1.4310</td></tr><tr><th>Federrate</th><td>c = G·d⁴ / (8·D<sub>m</sub>³·n) ≈ ${fmt(rate)} N/mm</td></tr><tr><th>Einbaulänge</th><td>${fmt(L1)} mm (Vorspannung ${fmt(P.spring.free-L1)} mm ≈ ${fmt(F1)} N)</td></tr><tr><th>Eingefedert +12 / ausgefedert −6</th><td>${fmt(L2)} mm (≈ ${fmt(F2)} N) / ${fmt(L3)} mm · Blocklänge ≈ ${fmt(Lblock)} mm</td></tr><tr><th>Hebel Feder / Rad</th><td>${fmt(Math.abs(pivot[0]-P.spring.x))} / ${fmt(armLen)} mm → Radkraft ≈ ${fmt(F1*lever)} … ${fmt(F2*lever)} N</td></tr></table><p class="mut">Kleine Radkraft: genug für schlupffreies Abrollen, ohne das Unterteil anzuheben. Bei Schlupf auf nassem Liner härtere Feder (d 1,2) oder Lauffläche mit Profil erproben.</p>`)
 +box(108,192,106,0,`<h3>Schattenlücke am Scheitel</h3><table class="bom small"><thead><tr><th>DN</th><th>rot (z 22)</th><th>grün (z 38)</th></tr></thead><tbody>${families.map(f=>{const rr=allRows.filter(r=>r.dn===f.label);return`<tr><td>${f.label.replace('DN ','')}</td><td>${shadowTxt(rr[0])}</td><td>${shadowTxt(rr[1])}</td></tr>`;}).join('')}</tbody></table><p class="mut">Quermaß z in mm am Scheitel. Die Linienmitte bleibt immer sichtbar; die Lücke liegt seitlich.</p>`);
 sheet({name:'Federung, Einbaulage je DN, Laserebene',no:'LPH-140',scale:'1:5 (Schnitte)',svg:s,html});
}

// =====================================================================
// Blatt 8/9: Montageanleitung
// =====================================================================
{
 const steps=[
  ['m1','Unterteil vorbereiten','Schalung abbauen bzw. Unterteil zugänglich machen. Unterseite der Stützplatte im Bereich 0–40 mm vor der hinteren Kante prüfen (frei von Leitungen). Zwei Gewinde M6 (E1/E2, 20 mm vor der Kante, ±25 quer) bohren und schneiden.'],
  ['m2','Platte und Lasche (Pos. 1, 2)','Verlängerungsplatte stumpf an die Stützplatte legen, Oberseiten bündig. Lasche von unten ansetzen, 4 × ISO 7380 M6 × 12 mit Loctite 243 – 8 Nm. Radausschnitt liegt auf der Seite gegenüber dem Laserturm.'],
  ['m3','Lagerbock, Schwinge, Rad (Pos. 6, 8, 9, 14–17)','Lager MF128 in beide Arme pressen, Welle mit Magnet durch Rad und Lager, Rad mit Madenschraube klemmen. Schwinge mit Gleitlagern in den Lagerbock, Bolzen Ø8 + Sicherungsringe. Lagerbock von unten mit M5 und M4 Senkschrauben. Sensorkopf Pos. 11 außen an den Arm (Spalt 1 mm).'],
  ['m4','Feder und Federwinkel (Pos. 7, 10)','Feder auf den Federteller der Schwinge setzen, Federwinkel darüber und mit M4 × 35 in die äußere Wange schrauben. Schwinge von Hand eindrücken: muss leicht und ohne Klemmen 12 mm einfedern und selbst zurückkommen.'],
  ['m5','Gehäuse, Kanal, Laserturm (Pos. 3–5)','Gehäuse mit 4 × M5 Senkschrauben von unten, Laserturm mit 2 × M5. Kabelkanal zwischen beiden einkleben, Laser- und Sensorkabel einziehen, Durchführungen abdichten. Laser in die Bohrungen Ø12 stecken, Linien quer zur Rohrachse ausrichten und mit Madenschraube sichern.'],
  ['m6','Fertig – Sichtprüfung','Alle Teile innerhalb der Plattenbreite (105 mm), Kabel außen geführt und mit Kabelbindern gesichert. Rad dreht frei, Federung frei. Gehäusedeckel mit Dichtung schließen, Reedkontakt mit Magnet testen: rot/grün Selbsttest.']
 ];
 const card=async(st,i,x,y)=>{const w=125,h=64;return await pic(st[0],x,y,w,h,CROP.m)+circ(x+6,y+6,4.2,'stepN')+text(x+6,y+7.5,String(i+1),{size:4.4,weight:700,cls:'stepT'});};
 let s='',html='';const xs=[22,152,282];
 for(let i=0;i<6;i++){const x=xs[i%3],y=i<3?16:132;s+=await card(steps[i],i,x,y);html+=box(x,y+66,125,0,`<h4>${i+1}. ${esc(steps[i][1])}</h4><p>${esc(steps[i][2])}</p>`,'step');}
 html+=box(22,222,222,0,`<h3>Werkzeug und Anzugsmomente</h3><table class="facts"><tr><th>M6 Lasche (ISO 7380, in Alu-Gewinde)</th><td>8 Nm · Loctite 243 · Innensechskant 4</td></tr><tr><th>M5 Senkschrauben Gehäuse/Turm/Lagerbock</th><td>5 Nm · Loctite 243 · Innensechskant 3</td></tr><tr><th>M4 Federwinkel / Lagerbock innen</th><td>3 Nm · Loctite 243 · Innensechskant 2,5 / 3</td></tr><tr><th>M3 Deckel, Madenschrauben</th><td>1 Nm · ohne Sicherung (Deckel) / Loctite 222</td></tr></table>`);
 sheet({name:'Montageanleitung 1/2 – Zusammenbau',no:'LPH-200',scale:'—',svg:s,html});
 // Blatt 9: Einrichten und Funktionsprüfung
 let s2=await pic('kanal-rot',22,16,190,118)+await pic('kanal-gruen',218,16,190,118);
 s2+=text(25,21,'Schnittbild: rote Linie auf der Anschlussmitte → Halt, Doppelblitz = genullt',{size:3,anchor:'start',cls:'capW'})+text(221,21,`Nach ${Lopen} mm Rückweg: grün = Schildöffnung mittig`,{size:3,anchor:'start',cls:'capW'});
 const html2=box(22,138,125,0,`<h3>Einrichten (einmalig)</h3><ol><li>Akku laden (Buchse M8), Gehäuse mit Magnet einschalten: Selbsttest rot, dann grün.</li><li>Handy mit WLAN „DSS-Laser“ verbinden, Browser 192.168.4.1.</li><li><b>Messrad kalibrieren:</b> Start, Schalung auf ebenem Boden genau 1000 mm schieben, Wert übernehmen.</li><li><b>Ziel L je Schalung messen:</b> Mitte Schildöffnung bis Laserlinie, für offene Sanierung und Abschluss getrennt eintragen.</li><li>Zählrichtung prüfen: Rückwärtsfahrt muss positiv zählen, sonst „umdrehen“.</li></ol>`,'notes')
 +box(152,138,125,0,`<h3>Positionieren im Kanal</h3><ol><li>Mit roter Linie über den Anschluss fahren, bis die Linie auf der Anschlussmitte steht.</li><li>2 s still halten: Doppelblitz = genullt.</li><li>Zurückfahren: rot = weiter, grün blinkt = noch 15 mm, langsam.</li><li>Dauergrün (±3 mm): stoppen, Schildöffnung liegt mittig – Bumper vakuumieren.</li><li>Rot blinkt schnell = zu weit: wieder vorfahren bis grün.</li></ol>`,'notes')
 +box(282,138,126,0,`<h3>Prüfen und warten</h3><ul><li>Vor jedem Einsatz: Rad frei, Federung federt zurück, Fenster sauber, Selbsttest.</li><li>Wöchentlich: Kalibrierung mit 1000 mm Strecke kontrollieren (Abweichung &lt; 3 mm).</li><li>Nach Einsatz: mit Wasser abspülen, Fenster nicht kratzen, Ladebuchse verschließen.</li><li>Laser Klasse 2 (≤ 1 mW): nicht in den Strahl blicken; kein Laserschutzbeauftragter nötig.</li><li>Erprobung zuerst im Versuchsrohr: Schlupf des Rades auf nassem Liner und Linienschatten des Zentralrohrs prüfen.</li></ul>`,'notes');
 const tests=[['Kalibrierung Messrad','1000 mm auf ebenem Boden','± 3 mm'],['Wiederholgenauigkeit','10 × positionieren an Musteranschluss, Versatz messen','± 3 mm'],['Muffe überfahren','Stufe 10 mm vor- und rückwärts','Rad federt ein, kein Anschlag, Zählfehler < 2 mm'],['Versatz abwärts','Stufe 6 mm','Rad bleibt auf der Sohle'],['Nasser Liner','1 m auf nassem Liner, vor/zurück','Schlupf < 3 mm'],['Linie im Kamerabild','DN 300 und DN 700, mit Nebel/Wasserdampf','Linienmitte klar erkennbar'],['Dichtheit Gehäuse','30 min 0,5 m unter Wasser','trocken'],['Akkulaufzeit','Dauerbetrieb, Laser im Wechsel','> 8 h']];
 const html3=box(22,198,222,0,`<h3>Erprobungsprotokoll (Versuchsrohr)</h3><table class="bom small"><thead><tr><th>Prüfung</th><th>Durchführung</th><th>Soll</th><th>Ist</th><th>i. O.</th></tr></thead><tbody>${tests.map(t=>`<tr><td>${t[0]}</td><td>${t[1]}</td><td>${t[2]}</td><td style="width:16mm"></td><td style="width:9mm"></td></tr>`).join('')}</tbody></table>`);
 sheet({name:'Montageanleitung 2/2 – Einrichten und Prüfen',no:'LPH-201',scale:'—',svg:s2,html:html2+html3});
}

// ---------- HTML/PDF ausgeben ----------
const css=`@page{size:420mm 297mm;margin:0}*{box-sizing:border-box}body{margin:0;background:#888;font-family:Inter,"DejaVu Sans",sans-serif;color:#111}
.sheet{position:relative;width:420mm;height:297mm;background:#fff;margin:0 auto 8mm;overflow:hidden;page-break-after:always;break-after:page}
@media print{body{background:#fff}.sheet{margin:0}}
svg text{font-family:"DejaVu Sans Condensed","DejaVu Sans",sans-serif;fill:#111}
.v{fill:#fff;stroke:#111;stroke-width:.5;stroke-linejoin:round}.t{fill:none;stroke:#111;stroke-width:.25}.h{fill:none;stroke:#111;stroke-width:.25;stroke-dasharray:1.6 .8}
.c{fill:none;stroke:#2563a8;stroke-width:.18;stroke-dasharray:6 1 1 1}.ph{fill:none;stroke:#555;stroke-width:.25;stroke-dasharray:6 1 1 1 1 1}.d{fill:none;stroke:#111;stroke-width:.18}.dot{fill:#111}
.sp{fill:none;stroke:#111;stroke-width:.4}.pipe{fill:none;stroke:#7a5a2a;stroke-width:.35;stroke-dasharray:3 1}.laser{stroke:#d22;stroke-width:.6;stroke-dasharray:2 1}.fanR{fill:rgba(230,40,30,.10);stroke:none}.fanG{fill:rgba(30,170,80,.10);stroke:none}.lineR{fill:none;stroke:#e0281e;stroke-width:.8}.lineG{fill:none;stroke:#1ea050;stroke-width:.8}
.red{fill:#ffd9d4 !important}.grn{fill:#d4f5dc !important}.frame{fill:none;stroke:#111;stroke-width:.7}.tbl{fill:none;stroke:#111;stroke-width:.5}.pic{fill:none;stroke:#bbb;stroke-width:.25}
.bal{fill:#fff;stroke:#111;stroke-width:.35}.mut{fill:#555 !important}.warn{fill:#c0262d !important}.vt{font-weight:600}.cap{fill:#333 !important}.capW{fill:#fff !important;font-weight:600}.id{fill:#2563a8 !important}
.laserT,.redT{fill:#c0262d !important}.grnT{fill:#1e8449 !important}.cable{stroke:#111;stroke-width:1.2}.stepN{fill:#1e88ac;stroke:none}.stepT{fill:#fff !important}
.ov{position:absolute;font-size:3.1mm;line-height:1.32}.ov h1{font-size:6.2mm;margin:0 0 2mm}.ov h3{font-size:3.8mm;margin:0 0 1.5mm}.ov h4{font-size:3.4mm;margin:0 0 1mm;color:#1e5f7a}.ov p{margin:0 0 1.5mm}.ov ol,.ov ul{margin:0;padding-left:5mm}.ov li{margin-bottom:.9mm}
.ov .mut,p.mut{color:#555;font-size:2.8mm}.intro p{font-size:3.4mm}
table{border-collapse:collapse;width:100%}th,td{border:.25mm solid #888;padding:.7mm 1.4mm;text-align:left;vertical-align:top}th{background:#eef2f5;font-weight:600}
.bom{font-size:2.9mm}.bom.small{font-size:2.5mm}.bom.small td,.bom.small th{padding:.35mm 1.2mm}.bom td.c{text-align:center}.holes{font-size:2.8mm;margin-bottom:2mm}.facts{font-size:2.9mm}.facts th{width:44%}
.step p{font-size:2.85mm}.wire{width:150mm;height:72mm}.wire rect{fill:#fff;stroke:#111;stroke-width:.35}.wire rect.red{fill:#ffd9d4}.wire rect.grn{fill:#d4f5dc}.wire path{fill:none;stroke:#111;stroke-width:.4}.wire text{font-family:"DejaVu Sans Condensed",sans-serif}.wire .wm{fill:#555;font-size:2.6px}`;
const html=`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Laser-Heckmodul DSS-Flex – Zeichnungen und Montage</title><style>${css}</style></head><body>${render()}</body></html>`;
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
