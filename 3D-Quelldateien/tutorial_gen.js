// Erzeugt tutorial.html (Bild-Text-Tutorial) aus den Schrittdaten (part2_data.js) und den Bildern in captures/
const fs=require('fs'), path=require('path');
const src=fs.readFileSync('part2_data.js','utf8');
const m={}; new Function('window', src+'; window.stepsFor=stepsFor; window.bomFor=bomFor; window.BG=BG;')(m);
const DN='DN450-500';
const steps=m.stepsFor(DN), bom=m.bomFor(DN);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const groups=[
  ['unterteil','A','Unterteil','Stützplatte, Distanzstücke, Bumper und Radhalterung mit Laufscheibe.'],
  ['zentral','B','Zentraleinheit (Oberwagen)','Grundkörper mit Zentralrohr, Klappvorrichtung, Werkzeugaufnahme und Einbauhilfe – für alle Baugrößen gleich.'],
  ['halte','C','Halteeinheit','Schildhalterung Teil 1 bis 3 und die Blaseneinheit mit Welle, Gehäuse und Motor.'],
  ['schalung','D','Schalung','Aufnahmen auf den Tragstangen, darauf Schalungsträger, Blase und Schalungsschild.'],
  ['gesamt','E','Gesamtmontage','Die vier Baugruppen von unten nach oben zusammensetzen und am Fräsroboter ankoppeln.'],
];
function bomEntry(key){ for(const g of ['unterteil','zentral','halte','schalung']){ const e=bom[g].find(r=>r[3]===key); if(e) return e; } return null; }
function img(bg,i){
  const cands=[`captures/${bg}_${i}.webp`,`captures/${bg}_${i}.jpg`];
  for(const f of cands){ if(fs.existsSync(f)){ const ext=f.endsWith('.webp')?'webp':'jpeg'; return `data:image/${ext};base64,`+fs.readFileSync(f).toString('base64'); } }
  return '';
}
let out=`<section id="tutorial">
  <span class="eyebrow">Montage</span>
  <h2>Montage Schritt für Schritt</h2>
  <p class="tut-intro">Gezeigt an der Baugröße ${DN}. Bei DN300 entfallen die Distanzstücke, bei DN550-600 und DN650-700 kommen weitere Distanzstücke und längere Schrauben dazu (siehe Tabelle „Baugrößen“ unten). Die Positionsnummern beziehen sich auf die Stücklisten im Bedienfeld.</p>
  <div class="tut-legend"><i></i>Hellblau = Teile, die in diesem Schritt neu dazukommen</div>
`;
let total=0;
for(const [bg,letter,title,intro] of groups){
  out+=`  <div class="tut-group"><h3>${letter} · ${esc(title)}</h3><p>${esc(intro)}</p></div>\n`;
  steps[bg].forEach((st,i)=>{
    const d=img(bg,i+1); total+=d.length;
    const chips=(st.p||[]).map(k=>bomEntry(k)).filter(Boolean).map(e=>`<i>Pos ${e[0]} · ${esc(e[1].replace(/_/g,' ').replace(/ ---.*$/,''))} ×${e[2]}</i>`).join('');
    out+=`  <div class="tut-step">
    ${d?`<img src="${d}" alt="${esc(title)} – Schritt ${i+1}: ${esc(st.t)}" loading="lazy" width="1000" height="640">`:'<div></div>'}
    <div><span class="tn">${letter}${i+1}</span><h4>${esc(st.t)}</h4><p>${esc(st.s)}</p>${chips?`<div class="plist">${chips}</div>`:''}</div>
  </div>\n`;
  });
}
out+=`</section>\n`;
fs.writeFileSync('tutorial.html',out);
console.log('tutorial.html', out.length, 'bytes, images', Math.round(total/1024),'KB');
