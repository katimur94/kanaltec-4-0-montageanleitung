// Nimmt die Schrittbilder fuer das Bild-Text-Tutorial aus dem 3D-Modell auf.
// Voraussetzung: node serve.js . laeuft, Seite mit #debug geoeffnet (http://localhost:8765/#debug).
// Dieses Skript komplett in die Browser-Konsole einfuegen. Ergebnis: captures/<baugruppe>_<nr>.webp neben serve.js
// Danach: node tutorial_gen.js && node build.mjs
(async function(){
  const DN='DN450-500';                       // Baugroesse fuer die Bilder
  const k=window.__kt40; if(!k){ alert('Seite mit #debug oeffnen'); return; }
  document.getElementById('help-close').click();
  document.querySelector('#dnseg button[data-dn="'+DN+'"]').click();
  k.state.labels=false;
  let sc=k.state.parts[0].obj; while(sc.parent) sc=sc.parent;   // Szene
  k.renderer.setSize(1000,640,false); k.camera.aspect=1000/640; k.camera.fov=30; k.camera.updateProjectionMatrix();
  async function cap(bg){
    document.querySelector('#bgseg button[data-bg="'+bg+'"]').click();
    k.state.ghost=(bg==='gesamt'); k.state.stepMode=true;
    const n=k.state.steps[bg].length;
    k.state.stepIdx=n-1; k.applyVisibility(); k.applyExplode(); k.fitView(true);   // Kamera auf die fertige Baugruppe
    const ct=k.controls.target.clone(); const cp=k.camera.position.clone().lerp(ct,0.18);
    for(let i=0;i<n;i++){
      k.state.stepIdx=i; k.applyVisibility(); k.applyExplode();
      k.camera.position.copy(cp); k.controls.target.copy(ct); k.camera.lookAt(ct); k.camera.updateProjectionMatrix();
      sc.updateMatrixWorld(true); k.renderer.render(sc,k.camera);
      const data=document.getElementById('c').toDataURL('image/webp',0.8);
      const r=await fetch('/save?name='+bg+'_'+(i+1),{method:'POST',body:data}); console.log(await r.text());
    }
    k.state.stepMode=false; k.state.stepIdx=0; k.applyVisibility();
  }
  for(const bg of ['unterteil','zentral','halte','schalung','gesamt']) await cap(bg);
  console.log('fertig – jetzt: node tutorial_gen.js && node build.mjs');
})();
