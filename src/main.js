import {Viewer} from './model.js';
import {families,groupInfo,bom,stages,sources,videos,PHASE} from './data.js';
import assets from './assets.json';
const $=id=>document.getElementById(id),$$=s=>[...document.querySelectorAll(s)];
const lastStage=stages.length-1, endTime=stages.length-.001;
const state={id:400,mode:'explore',group:'all',playing:false,explodePlaying:false,explodeDirection:1,time:0,speed:1,labels:false,ref:'drawings',lastStage:-1};
const safe=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const opts=families.map(f=>`<option value="${f.id}"${f.id===400?' selected':''}>${f.label}</option>`).join('');$('family').innerHTML=opts;$('refFamily').innerHTML=opts;
$('resetView').insertAdjacentHTML('beforebegin','<button data-view="robot" id="robotView" title="IBAK-Fahrwagen, Hubarm und Werkzeugaufnahme">Roboter</button>');
$('resetView').insertAdjacentHTML('beforebegin','<button data-view="tool" id="toolView" title="CutterCam, Hubschwingen und vordere Werkzeugachse im Detail">Werkzeugarm</button><button data-view="shaft" id="shaftView" title="Nahansicht auf die Blasenwelle; folgt der Welle während der Animation">Wellenkamera</button>');
$('viewSettingsPanel').querySelector('p').insertAdjacentHTML('beforebegin','<label><input id="hideRobot" type="checkbox"> IBAK-Roboter ausblenden</label>');
$('groupButtons').innerHTML=Object.entries(groupInfo).map(([key,g],i)=>`<button class="groupbutton" data-group="${key}" style="--gcolor:${g.color}"><span class="groupicon">0${i+1}</span><span><strong>${g.short}</strong><small>${key==='s'?'Schild, Blase & Träger':key==='h'?'Tragstruktur & Antrieb':key==='z'?'Verbindung zum Roboter':'Abstützung & Distanzstücke'}</small></span><span class="chevron">›</span></button>`).join('');
$('stageButtons').innerHTML=stages.map((s,i)=>`<button class="groupbutton" data-stage="${i}"><span class="stage-no">0${i+1}</span><strong>${s.title}</strong></button>`).join('');
$('labelsLayer').innerHTML=Object.entries(groupInfo).map(([g,d],i)=>`<div id="label-${g}" class="modellabel" style="--gcolor:${d.color}"><i></i><span>0${i+1}</span>${d.short}</div>`).join('')+[0,1,2,3,4].map(i=>`<div id="process-label-${i}" class="modellabel" hidden style="--gcolor:#399c94"></div>`).join('');
$('sourceLinks').innerHTML=sources.map(s=>`<a class="source-card" href="${s.url}" target="_blank" rel="noopener noreferrer"><strong>${s.title} ↗</strong><span>${s.note}</span></a>`).join('');
videos[1].title='Stutzensanierung mit Kanaltec 4.0';videos[2].title='Die Revolution in der Stutzensanierung – Kanaltec 4.0';
$('videoLinks').innerHTML=videos.map((v,i)=>`<a class="source-card" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener noreferrer"><strong>0${i+1} · ${v.title} ↗</strong><span>YouTube · Hermes Technologie</span></a>`).join('');
$('photo1').src=assets.photos[0];$('photo2').src=assets.photos[1];
let viewer;
let dark=true;try{const saved=localStorage.getItem('kanaltec-theme');if(saved==='light')dark=false;}catch{}
function applyTheme(){document.documentElement.dataset.theme=dark?'dark':'light';$('themeToggle').setAttribute('aria-pressed',String(dark));$('themeToggle').innerHTML=`<span aria-hidden="true">${dark?'☾':'☀'}</span><span class="theme-label">${dark?'Dunkel':'Hell'}</span>`;viewer?.setTheme(dark);}
applyTheme();
$('themeToggle').onclick=()=>{dark=!dark;applyTheme();try{localStorage.setItem('kanaltec-theme',dark?'dark':'light');}catch{}};
try{viewer=new Viewer($('viewport'),selectPart);viewer.build(state.id);$('loading').hidden=true;}catch(e){$('loading').innerHTML='<div style="padding:30px;max-width:530px"><b>3D konnte nicht gestartet werden.</b><p>Bitte die Datei in einem aktuellen Edge-, Chrome- oder Firefox-Browser öffnen und Hardwarebeschleunigung aktivieren. Zeichnungen und Fotos sind unter „Originale & Quellen“ verfügbar.</p></div>';console.error(e);}
applyTheme();
function family(){return families.find(f=>f.id===state.id);}
$('viewport').addEventListener('viewchange',e=>{$$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===e.detail.view));$('sceneHint').textContent=e.detail.view==='shaft'?'Wellenkamera folgt der Welle · Ziehen zum Drehen · Rechts ziehen zum Verschieben':'Ziehen zum Drehen · Rechts ziehen zum Verschieben · Mausrad zum Zoomen';});
function updateSections(){const options={pipe:$('cutPipe').checked,shield:$('cutShield').checked,holder:$('hideHolder').checked,hideBladder:$('hideBladder').checked,hideRobot:$('hideRobot').checked};$('showRobot').checked=!options.hideRobot;viewer?.setSections(options);viewer?.poseRobot(viewer.mode==='process'?viewer.upperLift||0:0);$('schematic').textContent=[options.pipe?'Rohr im Schnitt':'Rohr vollständig',options.shield?'Schalung im Schnitt':'Schalung vollständig',...(options.holder?['Halterung ausgeblendet']:[]),options.hideRobot?'Ohne Roboter':'Mit Roboter'].join(' · ');try{localStorage.setItem('kanaltec-visibility',JSON.stringify(options));}catch{}}
try{const saved=JSON.parse(localStorage.getItem('kanaltec-visibility'));if(saved)for(const[id,key]of [['cutPipe','pipe'],['cutShield','shield'],['hideHolder','holder'],['hideBladder','hideBladder'],['hideRobot','hideRobot']])if(typeof saved[key]==='boolean')$(id).checked=saved[key];}catch{}
updateSections();viewer?.fit();
for(const id of ['cutPipe','cutShield','hideHolder','hideBladder','hideRobot'])$(id).onchange=updateSections;
function setRobotVisible(visible){
 $('hideRobot').checked=!visible;updateSections();
 if(visible&&!['all','z'].includes(state.group)){setGroup('all');return;}
 if(viewer&&['iso','side','front','top','robot','tool'].includes(viewer.currentView))viewer.fit(!visible&&['robot','tool'].includes(viewer.currentView)?'iso':viewer.currentView);
}
$('showRobot').onchange=()=>setRobotVisible($('showRobot').checked);
$('hideRobot').onchange=()=>setRobotVisible(!$('hideRobot').checked);
$('viewSettings').onclick=()=>{const open=$('viewSettingsPanel').hidden;$('viewSettingsPanel').hidden=!open;$('viewSettings').setAttribute('aria-expanded',String(open));};
$('closeViewSettings').onclick=()=>{$('viewSettingsPanel').hidden=true;$('viewSettings').setAttribute('aria-expanded','false');};
function page(){return +$('refFamily').value?families.find(f=>f.id===+$('refFamily').value).page+($('refGroup').value==='all'?0:groupInfo[$('refGroup').value].offset):3;}
function notify(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>$('toast').classList.remove('show'),2600);}
function selectPart(p){
 viewer?.select(p);$('selectionCard').hidden=!p;
 if(p){$('selectionMeta').textContent=groupInfo[p.group].short+' · POSITION '+p.pos;$('selectionName').textContent=p.name.replaceAll('_',' ');$('selectionCount').textContent=p.qty+' × in dieser Baugruppe'+(p.note?' · Einbaudetail nur teilweise belegt':'');}
 $$('[data-part]').forEach(b=>b.closest('tr').classList.toggle('selected',!!p&&b.dataset.part===`${p.group}:${p.pos}`));
}
function setGroup(g){state.group=g;selectPart(null);if(viewer){viewer.setGroup(g);viewer.targetExplode=state.mode==='explode'?+$('explosion').value/100:0;viewer.fit();}$$('button[data-group]').forEach(b=>{b.classList.toggle('selected',b.dataset.group===g);b.setAttribute('aria-pressed',String(b.dataset.group===g));});updateInfo();if(!$('bomPanel').hidden)renderBom();}
function setMode(mode){
 const keepShaftCamera=viewer?.currentView==='shaft';
 state.mode=mode;state.playing=false;state.explodePlaying=false;
 $$('button[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===mode);b.setAttribute('aria-pressed',String(b.dataset.mode===mode));});
 const src=mode==='sources',proc=mode==='process';$('workspace').hidden=src;$('sourcesPanel').hidden=!src;
 $('assemblyNav').hidden=proc;$('stageNav').hidden=!proc;$('explosionControl').hidden=mode!=='explode';$('processControl').hidden=!proc;$('schematic').hidden=!proc;$('showBom').hidden=proc;$('ghost').hidden=false;
 $('playbackSettings').hidden=!(proc||mode==='explode');$('phaseKeys').hidden=!proc;
 $('channelView').hidden=!proc;$('damageView').hidden=!proc;$('driveView').hidden=!proc;$('windingView').hidden=!proc;$('mechanismReadout').hidden=!proc;
 $('bomPanel').hidden=true;selectPart(null);
 if(viewer&&!src){viewer.resize();viewer.setMode(mode);if(proc){state.group='all';viewer.setGroup('all');viewer.controls.autoRotate=false;$('rotate').setAttribute('aria-pressed','false');$('ghost').setAttribute('aria-pressed','false');state.lastStage=-1;updateStage();}else{viewer.setGroup(state.group);if(mode==='explode'){$('explosion').value=75;setExplosion(.75,true);}else{viewer.setExplode(0);viewer.explode=0;viewer.fit();}}}
 if(!src&&keepShaftCamera)viewer?.fit('shaft');
 if(src){$('refFamily').value=state.id;$('refGroup').value=state.group;showRef(state.ref);}updateInfo();updatePlayButtons();
}
function updateInfo(){
 $('robotSetup').textContent=viewer?.robot?.config.label||'';
 $('hingeView').hidden=state.mode==='process'||state.group!=='z';
 const f=family();$('variantBadge').textContent=f.label;$('familyNote').textContent=f.spacer.length?f.spacer.map(n=>n+' mm').join(' + ')+' Distanzstücke im Unterteil':'Kompakte Ausführung ohne Höhendistanzstück';
 $$('button[data-group]').forEach(b=>{b.classList.toggle('selected',b.dataset.group===state.group);b.setAttribute('aria-pressed',String(b.dataset.group===state.group));});
 if(state.mode==='process'){$('viewEyebrow').textContent='SANIERUNG IM SCHNITTMODELL';$('viewTitle').innerHTML='So funktioniert<span>’s.</span>';updateStage(true);return;}
 $('viewEyebrow').textContent=state.mode==='explode'?'BAUGRUPPEN & EINZELTEILE':state.group==='all'?'INTERAKTIVE GESAMTANSICHT':'BAUGRUPPE IM DETAIL';
 $('viewTitle').innerHTML=state.group==='all'?(state.mode==='explode'?'Das System <span>entdecken.</span>':'Kanaltec <span>4.0</span>'):safe(groupInfo[state.group].short);
 if(state.group==='all'){$('detailIndex').textContent='01—04';$('detailTitle').textContent=state.mode==='explode'?'Den Aufbau sichtbar machen.':'Vier Baugruppen. Ein System.';$('detailText').textContent=state.mode==='explode'?'Mit dem Regler öffnest du den Aufbau. Wähle links eine Baugruppe, um die Einzelteile mit ihren Positionsnummern aus der PDF zu untersuchen.':'Der IBAK-Roboter fährt das Schalungssystem über die Klappvorrichtung zum Anschluss. Seine Werkzeugaufnahme trägt die Schalung anstelle des Fräskopfs. Wähle „Roboter“ für eine Nahansicht oder untersuche links die vier Schalungsbaugruppen.';$('detailCaption').textContent='Fünf Größenvarianten nach der Montageanleitung · DiTom GmbH Kanaltechnik';}
 else{const g=groupInfo[state.group];$('detailIndex').textContent='0'+(Object.keys(groupInfo).indexOf(state.group)+1);$('detailTitle').textContent=g.name;$('detailText').textContent=g.text;$('detailCaption').textContent='Originalzeichnung: Seite '+(f.page+g.offset)+' · '+f.label+(state.group==='s'&&state.id===600?' · Stücklistenzuordnung siehe Quellen':'');}
}
function setExplosion(v,fit=false){viewer?.setExplode(v);$('explosion').value=Math.round(v*100);$('explosionValue').textContent=Math.round(v*100)+' %';if(fit)viewer?.fit();}
function updateStage(force=false){
 const idx=Math.min(lastStage,Math.floor(state.time)),s=stages[idx];viewer?.setProcess(state.time);$('timeline').value=Math.round(state.time*1000);$('stageCount').textContent=(idx+1)+' / '+stages.length;
 if(force||idx!==state.lastStage){state.lastStage=idx;$('detailIndex').textContent='0'+(idx+1);$('detailTitle').textContent=s.title;$('detailText').textContent=s.text;$('detailCaption').textContent=s.caption;$$('button[data-stage]').forEach(b=>{b.classList.toggle('selected',+b.dataset.stage===idx);b.setAttribute('aria-current',+b.dataset.stage===idx?'step':'false');});$('prevStage').disabled=idx===0;$('nextStage').disabled=idx===lastStage;}
}
function updatePlayButtons(){$('processPlay').textContent=state.playing?'Ⅱ':'▶';$('processPlay').setAttribute('aria-label',state.playing?'Ablauf pausieren':'Ablauf abspielen');$('explodePlay').textContent=state.explodePlaying?'Ⅱ':'▶';$('explodePlay').setAttribute('aria-label',state.explodePlaying?'Explosionsanimation pausieren':'Explosionsanimation starten');}
function togglePlay(){if(state.mode==='explode'){state.explodePlaying=!state.explodePlaying;if(state.explodePlaying)viewer?.fitExplosion();if(viewer?.targetExplode>=.99)state.explodeDirection=-1;else if(viewer?.targetExplode<=.01)state.explodeDirection=1;}else{if(state.mode!=='process')setMode('process');if(state.time>=endTime-.02)state.time=0;state.playUntil=endTime;state.playing=!state.playing;}updatePlayButtons();}
function renderBom(){
 const gs=state.group==='all'?Object.keys(groupInfo):[state.group];$('bomTitle').textContent=state.group==='all'?'Stücklisten der vier Baugruppen':groupInfo[state.group].name+' · Stückliste';$('bomNote').textContent='Positionen und Mengen aus der PDF. Auf einen Eintrag klicken, um die entsprechenden Bauteile im Modell hervorzuheben.';
 $('bomTables').innerHTML=gs.map(g=>`<div class="bom-group-title">${groupInfo[g].name}<span class="small"> · PDF S. ${family().page+groupInfo[g].offset}</span></div><table class="bomtable"><thead><tr><th>POS.</th><th>BENENNUNG</th><th>MENGE</th></tr></thead><tbody>${bom(state.id,g).map(p=>`<tr class="${p.kind==='alias'?'alias':''}"><td>${p.pos}</td><td>${p.unplaced?`<span>${safe(p.name.replaceAll('_',' '))}</span>`:`<button data-part="${g}:${p.aliasOf||p.pos}">${safe(p.name.replaceAll('_',' '))}</button>`}${p.kind==='alias'?`<small>Zuordnung zu Pos. ${p.aliasOf} nach der gezeichneten Dreilagigkeit; nicht als zusätzliche Lage modelliert.</small>`:''}${p.note?`<small>${p.note}</small>`:''}</td><td>${p.qty}</td></tr>`).join('')}</tbody></table>`).join('');
 $$('[data-part]').forEach(b=>b.onclick=()=>{const[g,pos]=b.dataset.part.split(':');const part=viewer?.parts.find(p=>p.group===g&&p.pos===+pos);selectPart(part);$('viewport').scrollIntoView({behavior:'smooth',block:'nearest'});});
}
function showRef(ref){state.ref=ref;$$('[data-ref]').forEach(b=>b.classList.toggle('active',b.dataset.ref===ref));$('drawingsPanel').hidden=ref!=='drawings';$('photosPanel').hidden=ref!=='photos';$('researchPanel').hidden=ref!=='research';if(ref==='drawings')updateDrawing();}
function updateDrawing(){const n=page();$('drawingImage').src=assets.pages[n];$('drawingImage').alt='Originalzeichnung · '+$('refGroup').selectedOptions[0].textContent+' · PDF Seite '+n;$('pageInfo').textContent='PDF Seite '+n+' / 27';}
function largeImage(src,alt){$('largeImage').src=src;$('largeImage').alt=alt;$('imageDialog').showModal();}
function openDrawing(){state.ref='drawings';setMode('sources');}
async function full(target=document.documentElement){try{if(document.fullscreenElement===target)await document.exitFullscreen();else{if(document.fullscreenElement)await document.exitFullscreen();await target.requestFullscreen();}}catch{notify("Dieser Browser erlaubt hier kein Vollbild. Bitte in Chrome, Edge oder Firefox öffnen.");}}
document.addEventListener("fullscreenchange",()=>{$("viewportFullscreen").setAttribute("aria-pressed",String(document.fullscreenElement===$("viewport")));});
$$('button[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));$$('button[data-group]').forEach(b=>b.onclick=()=>setGroup(b.dataset.group));
$$('button[data-stage]').forEach(b=>b.onclick=()=>{state.playing=false;state.time=+b.dataset.stage+.92;updateStage();updatePlayButtons();});
$$('[data-view]').forEach(b=>b.onclick=()=>{if(['robot','tool'].includes(b.dataset.view)){$('hideRobot').checked=false;updateSections();if(state.group!=='all')setGroup('all');}if(b.dataset.view==='shaft'&&!['all','h'].includes(state.group))setGroup('all');stopRotation();viewer?.fit(b.dataset.view);$$('[data-view]').forEach(x=>x.classList.toggle('active',x===b));});
$('family').onchange=()=>{const view=viewer?.currentView;state.id=+$('family').value;state.playing=false;state.explodePlaying=false;viewer?.build(state.id);if(viewer){viewer.setMode(state.mode);viewer.setGroup(state.group);viewer.setExplode(state.mode==='explode'?+$('explosion').value/100:0);viewer.fit(view);}updateInfo();selectPart(null);updatePlayButtons();if(!$('bomPanel').hidden)renderBom();};
$('drawing').onclick=openDrawing;$('fidelity').onclick=()=>{state.ref='research';setMode('sources');};
$('ghost').onclick=()=>{const on=$('ghost').getAttribute('aria-pressed')!=='true';$('ghost').setAttribute('aria-pressed',String(on));viewer?.setGhost(on);};
$('labels').onclick=()=>{state.labels=!state.labels;$('labels').setAttribute('aria-pressed',String(state.labels));};
$('rotate').onclick=()=>{if(viewer){viewer.controls.autoRotate=!viewer.controls.autoRotate;$('rotate').setAttribute('aria-pressed',String(viewer.controls.autoRotate));}};
$('resetView').onclick=()=>viewer?.fit();$('clearSelection').onclick=()=>selectPart(null);
function stopRotation(){if(viewer)viewer.controls.autoRotate=false;$('rotate').setAttribute('aria-pressed','false');}
$$('[data-drag]').forEach(b=>b.onclick=()=>{const mode=b.dataset.drag;viewer?.setDragMode(mode);if(mode==='pan')stopRotation();$$('[data-drag]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('sceneHint').textContent=mode==='pan'?'Ziehen zum Verschieben · Mausrad zum Zoomen':'Ziehen zum Drehen · Rechts ziehen zum Verschieben · Mausrad zum Zoomen';});
$$('[data-pan]').forEach(b=>b.onclick=()=>{stopRotation();viewer?.panView(...b.dataset.pan.split(',').map(Number));});
viewer?.setDragMode('rotate');
$('explosion').oninput=e=>{state.explodePlaying=false;setExplosion(+e.target.value/100);updatePlayButtons();};$('explosion').onchange=()=>viewer?.fit();
$('explodeReset').onclick=()=>{state.explodePlaying=false;setExplosion(0);updatePlayButtons();};$('explodePlay').onclick=togglePlay;$('processPlay').onclick=togglePlay;
$('timeline').oninput=e=>{state.playing=false;state.time=+e.target.value/1000;updateStage();updatePlayButtons();};
$('nextStage').onclick=()=>{state.playing=false;state.time=Math.min(lastStage,Math.floor(state.time)+1)+.92;updateStage();updatePlayButtons();};$('prevStage').onclick=()=>{state.playing=false;state.time=Math.max(0,Math.floor(state.time)-1)+.92;updateStage();updatePlayButtons();};
try{const saved=localStorage.getItem('kanaltec-speed');if([...$('speed').options].some(o=>o.value===saved)){state.speed=+saved;$('speed').value=saved;}}catch{}
$('speed').onchange=e=>{state.speed=+e.target.value;try{localStorage.setItem('kanaltec-speed',String(state.speed));}catch{}};
function stepAnimation(direction,wholePhase=false){
 if(state.mode==='process'){
  state.playing=false;
  const next=wholePhase?Math.floor(state.time)+direction:Math.round((state.time+direction*.02)*1000)/1000;
  state.time=Math.max(0,Math.min(endTime,next));state.playUntil=endTime;updateStage();
 }else if(state.mode==='explode'&&viewer){
  state.explodePlaying=false;const next=Math.max(0,Math.min(1,Math.round((viewer.targetExplode+direction*.02)*100)/100));
  viewer.explode=next;setExplosion(next);
 }else return;
 updatePlayButtons();
}
$('stepBack').onclick=()=>stepAnimation(-1);$('stepForward').onclick=()=>stepAnimation(1);
$('present').onclick=()=>{state.time=0;state.playUntil=endTime;setMode('process');state.playing=true;updatePlayButtons();};$('fullscreen').onclick=()=>full();$('viewportFullscreen').onclick=()=>full($('viewport'));
$('replayStage').onclick=()=>{state.time=Math.floor(state.time);state.playUntil=Math.min(endTime,state.time+.999);state.playing=true;updateStage();updatePlayButtons();};
$('showBom').onclick=()=>{$('bomPanel').hidden=!$('bomPanel').hidden;if(!$('bomPanel').hidden){renderBom();$('bomPanel').scrollIntoView({behavior:'smooth',block:'nearest'});}};$('closeBom').onclick=()=>{$('bomPanel').hidden=true;};
$$('[data-ref]').forEach(b=>b.onclick=()=>showRef(b.dataset.ref));$('refFamily').onchange=updateDrawing;$('refGroup').onchange=updateDrawing;
$('openPdf').onclick=()=>{const bytes=Uint8Array.from(atob(assets.pdf.split(',')[1]),c=>c.charCodeAt(0)),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.click();setTimeout(()=>URL.revokeObjectURL(url),120000);};
$('drawingImage').onclick=()=>largeImage($('drawingImage').src,$('drawingImage').alt);for(const id of ['photo1','photo2'])$(id).onclick=()=>largeImage($(id).src,$(id).alt);
$('closeImage').onclick=()=>$('imageDialog').close();$('help').onclick=()=>$('helpDialog').showModal();$('closeHelp').onclick=()=>$('helpDialog').close();
for(const id of ['helpDialog','imageDialog'])$(id).onclick=e=>{if(e.target===$(id))$(id).close();};
$('saveImage').onclick=()=>{if(!viewer)return;const a=document.createElement('a');a.href=viewer.screenshot();a.download='Kanaltec-4.0-DN'+state.id+'-'+state.mode+'.png';a.click();notify('3D-Ansicht als PNG gespeichert.');};
document.addEventListener('keydown',e=>{
 if(e.altKey||e.ctrlKey||e.metaKey||document.querySelector('dialog[open]')||e.target.isContentEditable)return;
 const timelineControl=['timeline','explosion'].includes(e.target.id);
 if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)&&!timelineControl)return;
 if(['ArrowLeft','ArrowRight'].includes(e.key)&&['process','explode'].includes(state.mode)){e.preventDefault();stepAnimation(e.key==='ArrowRight'?1:-1,e.shiftKey);return;}
 if(e.code==='Space'){e.preventDefault();if(!e.repeat)togglePlay();}
 if(e.key.toLowerCase()==='f'&&!e.repeat){e.preventDefault();full(e.shiftKey||state.mode==='sources'?document.documentElement:$('viewport'));}if(e.key.toLowerCase()==='b'&&!e.repeat)$('labels').click();if(e.key.toLowerCase()==='r')viewer?.fit();if(e.key==='Escape'){selectPart(null);if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});}
});
if(viewer)viewer.onFrame=dt=>{
 if(state.mode==='sources')return;
 if(state.playing&&state.mode==='process'){state.time+=dt*.11*state.speed;const end=state.playUntil??endTime;if(state.time>=end){state.time=end;state.playing=false;updatePlayButtons();}updateStage();}
 if(state.explodePlaying&&state.mode==='explode'){let v=viewer.targetExplode+dt*.19*state.speed*state.explodeDirection;if(v>=1){v=1;state.explodePlaying=false;state.explodeDirection=-1;updatePlayButtons();}else if(v<=0){v=0;state.explodePlaying=false;state.explodeDirection=1;updatePlayButtons();}setExplosion(v);}
 const layer=$('labelsLayer');layer.hidden=!state.labels||!!viewer.selected;
 if(!layer.hidden){const occupied=[];const items=state.mode==='process'?viewer.processAnchors().map((p,i)=>({l:$('process-label-'+i),p:p.point,name:p.name,side:p.side})):Object.keys(groupInfo).map(g=>({l:$('label-'+g),p:viewer.anchor(g)}));for(const l of layer.children)l.hidden=true;for(const item of items){const{l,p}=item;if(!p)continue;const q=viewer.project(p);l.hidden=!q.visible;if(l.hidden)continue;if(item.name)l.textContent=item.name;l.classList.toggle('label-left',item.side==='left');let x=Math.min(viewer.el.clientWidth-l.offsetWidth-12,Math.max(28,item.side==='left'?q.x-l.offsetWidth-55:q.x+80)),y=Math.max(12,Math.min(viewer.el.clientHeight-28,q.y));for(const r of occupied)if(Math.abs(r.y-y)<28&&Math.abs(r.x-x)<170)y=r.y+29;if(y>viewer.el.clientHeight-28)y=viewer.el.clientHeight-28;l.style.left=x+'px';l.style.top=y+'px';occupied.push({x,y});}}
 // Public, read-only DOM evidence for offline QA; no network services are used.
 $('viewport').dataset.modelParts=viewer.parts.length;$('viewport').dataset.group=state.group;$('viewport').dataset.mode=state.mode;$('viewport').dataset.explosion=viewer.explode.toFixed(3);$('viewport').dataset.stage=Math.min(lastStage,Math.floor(state.time));$('viewport').dataset.view=viewer.currentView;
 if(state.mode==='process'){
  const full=String(viewer.sensorFull);if($('sensorStatus').dataset.full!==full){$('sensorStatus').dataset.full=full;$('sensorText').textContent=viewer.sensorFull?'Leuchtet · Gegendruck meldet voll':'Aus · keine Vollmeldung';}
  const n=Math.floor(state.time),f=state.time-n,drive=n<PHASE.BLADDER?'Blase auf der Welle aufgewickelt':n===PHASE.BLADDER&&f<.68?'Welle dreht · Blase vollständig abwickeln':n===PHASE.BLADDER&&f<.8?'Vollständig abgewickelt · flache Seite parallel zum Anschluss':n===PHASE.BLADDER?'Ohne Restwicklung · Blase jetzt aufblasen':n<PHASE.REMOVE?'Blase hält den Anschlussquerschnitt frei':f<.14?'Blase entspannen':f<.64?'Welle dreht zurück · Blase wickelt auf':'Blase wieder auf der Welle';
  if($('driveStatus').textContent!==drive)$('driveStatus').textContent=drive;
  const windingDetail=viewer.winding.fullyUnwound?'Keine Restwicklung · Wellenfläche ausgerichtet · Luftweg frei':`Restwicklung ${viewer.winding.remainingTurns.toFixed(2).replace('.',',')} Umdr. · ca. 3 mm je Wandlage · noch keine Luft`;
  if($('windingDetail').textContent!==windingDetail)$('windingDetail').textContent=windingDetail;
  $('viewport').dataset.bladderInflation=viewer.winding.inflation.toFixed(4);
  const bumper=viewer.bumperAir<.001?'Vakuumiert · flache Fahrtstellung':viewer.bumperAir>.999?'Aufgeblasen · Schalung angepresst':n===PHASE.REMOVE?'Vakuumieren · Schalung absenken':'Aufblasen · Schalung anheben';if($('bumperStatus').textContent!==bumper)$('bumperStatus').textContent=bumper;
  $('viewport').dataset.shaftAngle=viewer.winding.shaftAngle.toFixed(4);$('viewport').dataset.bladderExtension=viewer.winding.extension.toFixed(4);$('viewport').dataset.storedBladder=viewer.winding.storedLength.toFixed(3);$('viewport').dataset.sensorFull=full;
  const seal=viewer.sealAir<.001?'Entspannt · zwischen Schild und Träger':viewer.sealAir>.999?'Aufgeblasen · Schalung abgedichtet':n===PHASE.REMOVE?'Entspannen · Abdichtung lösen':'Aufblasen · letzte Abdichtung herstellen';if($('sealStatus').textContent!==seal)$('sealStatus').textContent=seal;
  $('viewport').dataset.sealAir=viewer.sealAir.toFixed(4);
  $('viewport').dataset.bumperAir=viewer.bumperAir.toFixed(4);$('viewport').dataset.upperLift=viewer.upperLift.toFixed(3);
 }
};
updateInfo();setGroup('all');updateDrawing();
