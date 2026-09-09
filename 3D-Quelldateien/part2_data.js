/* =====================================================================
   DATEN – Baugrößen, Stücklisten (aus den Zeichnungen 03/2026), Texte
   Alle Texte können hier angepasst werden.
   ===================================================================== */
const DN_LIST = ['DN300','DN350-400','DN450-500','DN550-600','DN650-700'];

const DN_CFG = {
  'DN300':     { R:150, spacers:[],            arc:180, len:520, hole:[42,62], teil2:'Schildhalterung Teil2',        bef1:'Befestigung Blaseneinheit1',       screwTeil1:'DIN 912 M6 x 45', shells:['Schalungschild','Blase','Schalungsträger'] },
  'DN350-400': { R:200, spacers:[50],          arc:180, len:540, hole:[45,66], teil2:'Schildhalterung Teil2_DN400',  bef1:'Befestigung Blaseneinheit1_DN400', screwTeil1:'DIN 912 M6x65',   shells:['DN400_Schalungschild','DN400_Blase','DN400_Schalungsträger'] },
  'DN450-500': { R:250, spacers:[100],         arc:180, len:560, hole:[48,70], teil2:'Schildhalterung Teil2_DN450-500', bef1:'Befestigung Blaseneinheit1_DN400', screwTeil1:'DIN 912 M6x65', shells:['DN500_Schalungschild','DN500_Blase','DN500_Schalungsträger'] },
  'DN550-600': { R:300, spacers:[100,50],      arc:180, len:580, hole:[52,76], teil2:'Schildhalterung Teil2_DN550-600', bef1:'Befestigung Blaseneinheit1_DN400', screwTeil1:'DIN 912 M6x65', shells:['DN600_Schalungschild','DN600_Blase','DN600_Schalungsträger'] },
  'DN650-700': { R:350, spacers:[100,50,50],   arc:180, len:600, hole:[56,82], teil2:'Schildhalterung Teil2_DN650-700', bef1:'Befestigung Blaseneinheit1_DN400', screwTeil1:'DIN 912 M6x65', shells:['DN700_Schalungschild','DN700_Blase','DN700_Schalungsträger'] },
};

const BG = {
  gesamt:   { label:'Gesamtansicht', short:'Gesamt' },
  halte:    { label:'Halteeinheit', short:'Halteeinheit' },
  zentral:  { label:'Zentraleinheit (Oberwagen)', short:'Zentraleinheit' },
  unterteil:{ label:'Unterteil', short:'Unterteil' },
  schalung: { label:'Schalung', short:'Schalung' },
};

/* Beschreibungen je Teile-Schlüssel (key). Schrauben werden generisch beschrieben. */
const DESC = {
  // Unterteil
  stuetzplatte:'Grundplatte des Unterteils. Trägt Bumper bzw. Distanzstücke und am vorderen Ende die Radhalterung; liegt unten im Rohr auf.',
  distanz_rad:'Distanzstück auf dem Ende der Stützplatte, darauf die Radhalterung (3× M6×40 durch beide Teile).',
  radhalterung:'Gabel für die Laufscheibe; die M8×40-Schraube mit Sechskantmutter ist die Achse.',
  rad_u:'Laufscheibe DN70 (Ø 70 mm, flache Scheibe). Läuft in der Gabel auf der Rohrsohle und führt das Unterteil.',
  bumper:'Luftbalg („Bumper“) – Gummizylinder mit Anschlussplatten oben und unten. Wird mit Druckluft beaufschlagt und drückt die komplette Einheit samt Schalungsschild gegen die Rohrwand.',
  dstueck50:'Distanzstück 50 mm. Erhöht den Abstand zwischen Stützplatte und Bumper, damit das Schild bei größerem Rohrdurchmesser die Rohrwand erreicht.',
  dstueck100:'Distanzstück 100 mm. Erhöht den Abstand zwischen Stützplatte und Bumper für größere Rohrdurchmesser.',
  // Zentraleinheit
  grundkoerper:'Klemmblock der Zentraleinheit mit Längsbohrung für Zentralrohr und Einbauhilfe, oben geschlitzt, Klemmschraube seitlich. Oben wird die Halteeinheit angeschraubt.',
  grundplatte:'Runde Grundplatte zur Stützplatte – verbindet den Grundkörper mit der oberen Anschlussplatte des Bumpers (2× M8×16 von oben).',
  zentralrohr:'Zentralrohr in Richtung Roboter, im Grundkörper geklemmt (4× M5×12 mit Scheiben von unten). Am Ende sitzt die Klappvorrichtung.',
  einbauhilfe:'Gebogenes Rohr mit Gabelende und Laufscheibe DN70; wird im Grundkörper mit M8×35 und Mutter geklemmt. Erleichtert das Einfädeln und Verfahren im Rohr.',
  rad_z:'Laufscheibe DN70 am Gabelende der Einbauhilfe.',
  klapp1:'Klappvorrichtung Teil 1 – Block am Ende des Zentralrohrs, Unterteil des Gelenks.',
  klapp2:'Klappvorrichtung Teil 2 – Gelenkplatte, hängt oben am Zylinderstift 6×60 und trägt die Werkzeugaufnahme.',
  klapp3:'Klappvorrichtung Teil 3 – Oberteil mit Gelenkauge, mit 2× M6×20 auf Teil 1 geschraubt.',
  feder:'Druckfedern auf der M6×90-Schraube unten zwischen Teil 1 und Teil 2 – halten die Schalung in Arbeitsstellung und lassen sie beim Einfädeln abklappen.',
  stift:'Zylinderstift DIN EN 28734 6×60 – Gelenkbolzen oben zwischen Teil 3 und Teil 2.',
  werkzeugaufnahme:'Werkzeugaufnahme Teil 1 – Adapterplatte mit Zapfen zum Werkzeughalter des Fräsroboters, 2× M8×20 an Teil 2.',
  // Halteeinheit
  teil1:'Schildhalterung Teil 1 – Grundplatte auf dem Grundkörper (4× DIN 7991 M5×12 von oben); die Stehplatten werden seitlich in ihre Stirnflächen geschraubt.',
  teil2:'Schildhalterung Teil 2 – zwei Stehplatten längs zur Rohrachse, seitlich mit 8× M6×20 an Teil 1 verschraubt. Höhe je Baugröße unterschiedlich.',
  teil3:'Schildhalterung Teil 3 – zwei Tragstangen (Rundstab auf Flachleiste) auf den Oberkanten der Stehplatten, je 2× M6×16. Auf die Stangen werden die Rohrhülsen der Schalungsaufnahmen geschoben.',
  gehaeuse:'Gehäuse der Blasenwelle – Würfel mit großer Bohrung, zwischen den Bolzen der Tragstangen mit 4× M6×45 bzw. M6×65 gehalten; vorn Deckel und Motor.',
  deckel:'Deckel des Gehäuses (Motorseite) mit Mittelbohrung, 4× M5×12 in den Ecken; daran der Motorflansch mit 4× M4×16.',
  welle:'Welle der Blaseneinheit – Vierkantstab mit Mittelbohrung für die Injektionsblase; am vorderen Ende Bund und abgesetzter Zapfen, der im Klemmblock und im Gehäuse läuft. Wird vom Motor verstellt.',
  motor:'Antriebsmotor der Blaseneinheit, angeflanscht am Deckel des Gehäuses.',
  bef1:'Befestigung Blaseneinheit 1 – Klemmblöcke mit Bohrung: einer auf dem Zapfen der Blasenwelle, einer auf dem Bolzen der rechten Tragstange.',
  bef2:'Befestigung Blaseneinheit 2 – Bolzen mit Querbohrungen in den vorderen Enden der Tragstangen; durch die Querbohrungen laufen die langen M6-Schrauben ins Gehäuse.',
  // Schalung
  schild:'Schalungsschild – äußere Schale. Wird gegen die Rohrwand gepresst; die Öffnung liegt über dem Stutzen, durch sie arbeitet die Injektionsblase.',
  blase:'Gummiblase zwischen Träger und Schild. Erzeugt mit Druckluft den flächigen Anpressdruck des Schildes.',
  traeger:'Schalungsträger – innere Stahlschale, über die Bogenbügel auf den Tragstangen der Halteeinheit befestigt.',
  aufnahme1:'Aufnahme Schalungsschild – Rohrhülse mit je einem Bogenbügel an beiden Enden; die Hülse wird auf die Tragstange (Teil 3) geschoben und mit M5×30 gesichert, die oberen Laschen der Bügel liegen am Träger an (M5×10).',
  aufnahme2:'Aufnahme Schalungsschild Pos. 2 – vier Füße an den unteren Bügelenden, liegen am Schalungsträger an und werden mit je 1× M5×10 verschraubt.',
  screw:'Normteil. Anzugsmomente laut Stückliste („--- 12N“ usw.).',
};

/* ---------- Stücklisten je Baugröße und Baugruppe ----------
   pos, name, qty, key (3D-Teil), din (true = Normteil) */
function bomHalte(dn){
  const c = DN_CFG[dn];
  if (dn==='DN300') return [
    [1,'DIN 912 M5 x 12 --- 12N',4,'s_deckel',1],
    [2,'Deckel_Gehäuse_Blasenwelle',1,'deckel'],
    [3,'DIN 912 M6 x 45 --- 24N',4,'s_teil1',1],
    [4,'Schildhalterung Teil3',2,'teil3'],
    [5,'Befestigung_Blaseneinheit_2',2,'bef2'],
    [6,'Gehäuse_Blasenwelle',1,'gehaeuse'],
    [7,'DIN 912 M6 x 16 --- 16N',4,'s_teil2',1],
    [8,'DIN 912 M6 x 20 --- 20N',8,'s_bef',1],
    [9,'Schildhalterung Teil1',1,'teil1'],
    [10,'Welle_Blase',1,'welle'],
    [11,'Motor',1,'motor'],
    [12,'DIN 7991 - M5 x 12 --- 6.8N',4,'s_senk',1],
    [13,'Befestigung Blaseneinheit1',2,'bef1'],
    [14,'DIN 912 M4 x 16 --- 16N',4,'s_motor',1],
    [15,'Schildhalterung Teil2',2,'teil2'],
  ];
  return [
    [1,'DIN 912 M5 x 12 --- 12N',4,'s_deckel',1],
    [2,'Deckel_Gehäuse_Blasenwelle',1,'deckel'],
    [3,'DIN 912 M6 x 16 --- 16N',4,'s_teil2',1],
    [4,'Schildhalterung Teil3',2,'teil3'],
    [5,'Befestigung_Blaseneinheit_2',2,'bef2'],
    [6,'Gehäuse_Blasenwelle',1,'gehaeuse'],
    [7,'DIN 912 M6 x 20 --- 20N',8,'s_bef',1],
    [8,'DIN 7991 - M5 x 12 --- 6.8N',4,'s_senk',1],
    [9,'Schildhalterung Teil1',1,'teil1'],
    [10,'Welle_Blase',1,'welle'],
    [11,'Motor',1,'motor'],
    [12,'DIN 912 M4 x 16 --- 16N',4,'s_motor',1],
    [13,c.bef1,2,'bef1'],
    [14,'DIN 912 M6x65',4,'s_teil1',1],
    [15,c.teil2,2,'teil2'],
  ];
}
const BOM_ZENTRAL = [
  [1,'Grundkörper',1,'grundkoerper'],
  [2,'Grundplatte zur Stützplatte',1,'grundplatte'],
  [3,'DIN 912 M8 x 16 --- 16N',2,'s_grundplatte',1],
  [4,'Einbauhilfe',1,'einbauhilfe'],
  [5,'Zentralrohr',1,'zentralrohr'],
  [6,'RAD DN70',1,'rad_z'],
  [7,'Klappvorrichtung Teil1',1,'klapp1'],
  [8,'Klappvorrichtung Teil3',1,'klapp3'],
  [9,'Klappvorrichtung Teil2',1,'klapp2'],
  [10,'Werkzeugaufnahme Teil1',1,'werkzeugaufnahme'],
  [11,'Hexagon Nut ISO 4032 - M8 - W - N',1,'n_rad_z',1],
  [12,'DIN 912 M8 x 35 --- 35N',1,'s_rad_z',1],
  [13,'DIN 912 M8 x 20 --- 20N',2,'s_wza',1],
  [14,'DIN 912 M5 x 12 --- 12N',4,'s_k14',1],
  [15,'DIN 912 M6 x 20 --- 20N',2,'s_k15',1],
  [16,'DIN 912 M6 x 30 --- 30N',1,'s_k16',1],
  [17,'Hexagon Nut ISO 4032 - M6 - W - N',2,'n_k17',1],
  [18,'DIN EN 28734 - 6 x 60 - A - St (Zylinderstift)',1,'stift',1],
  [19,'Washer DIN 126 - 5.5',4,'w_k19',1],
  [20,'Cylinder head screw DIN 912 M6x90',1,'s_k20',1],
  [21,'DIN EN ISO 7040 - M6 - N (Sicherungsmutter)',1,'n_k21',1],
  [22,'DIN 912 M5 x 16 --- 16N',4,'s_k22',1],
  [23,'Feder',2,'feder'],
  [24,'DIN 912 M6 x 50 --- 24N',1,'s_k24',1],
];
function bomUnter(dn){
  const base = [
    [1,'Stützplatte',1,'stuetzplatte'],
    [2,'Distanzstück Radhalterung',1,'distanz_rad'],
    [3,'Radhalterung',1,'radhalterung'],
    [4,'RAD DN70',1,'rad_u'],
    [5,'DIN 912 M6 x 40 --- 24N',3,'s_radh',1],
    [6,'DIN 912 M8 x 40 --- 28N',1,'s_achse_u',1],
    [7,'Hexagon Nut ISO 4032 - M8 - W - N',1,'n_achse_u',1],
    [8,'Bumper',1,'bumper'],
  ];
  const x = {
    'DN300':     [[9,'DIN 912 M8 x 16 --- 16N',2,'s_bumper',1]],
    'DN350-400': [[9,'DIN 912 M8 x 65 --- 28N',2,'s_bumper',1],[11,'D_Stück_50mm',1,'dstueck50']],
    'DN450-500': [[9,'D_Stück_100mm',1,'dstueck100'],[10,'DIN912_M8x120',2,'s_bumper',1]],
    'DN550-600': [[9,'D_Stück_100mm',1,'dstueck100'],[10,'DIN912_M8x120',2,'s_bumper',1],[11,'D_Stück_50mm',1,'dstueck50'],[12,'DIN 912 M8 x 50 --- 28N',2,'s_dstk',1]],
    'DN650-700': [[9,'D_Stück_100mm',1,'dstueck100'],[10,'DIN912_M8x120',2,'s_bumper',1],[11,'D_Stück_50mm',2,'dstueck50'],[12,'DIN 912 M8 x 50 --- 28N',4,'s_dstk',1]],
  }[dn];
  return base.concat(x);
}
function bomSchalung(dn){
  const s = DN_CFG[dn].shells;
  if (dn==='DN450-500') return [
    [1,'Aufnahme_Schalungsschild',2,'aufnahme1'],
    [2,'Aufnahme_Schalungsschild_Pos2',4,'aufnahme2'],
    [3,'DIN 912 M5 x 10 --- 10N',8,'s_aufn',1],
    [4,'DIN 912 M5 x 30 --- 22N',2,'s_aufn2',1],
    [5,s[2],1,'traeger'],
    [6,s[0],1,'schild'],
    [7,s[1],1,'blase'],
  ];
  if (dn==='DN550-600') return [
    [1,'Schalungsträger (Konfigurationseintrag, nicht bebildert)',1,null],
    [2,'Blase (Konfigurationseintrag, nicht bebildert)',1,null],
    [3,'Schalungschild (Konfigurationseintrag, nicht bebildert)',1,null],
    [4,'Aufnahme_Schalungsschild',2,'aufnahme1'],
    [5,'Aufnahme_Schalungsschild_Pos2',4,'aufnahme2'],
    [6,'DIN 912 M5 x 10 --- 10N',8,'s_aufn',1],
    [7,'DIN 912 M5 x 30 --- 22N',2,'s_aufn2',1],
    [8,s[1],1,'blase'],
    [9,s[0],1,'schild'],
    [10,s[2],1,'traeger'],
  ];
  return [
    [1,'Aufnahme_Schalungsschild',2,'aufnahme1'],
    [2,'Aufnahme_Schalungsschild_Pos2',4,'aufnahme2'],
    [3,'DIN 912 M5 x 10 --- 10N',8,'s_aufn',1],
    [4,'DIN 912 M5 x 30 --- 22N',2,'s_aufn2',1],
    [5,s[1],1,'blase'],
    [6,s[0],1,'schild'],
    [7,s[2],1,'traeger'],
  ];
}
function bomFor(dn){
  return { halte:bomHalte(dn), zentral:BOM_ZENTRAL, unterteil:bomUnter(dn), schalung:bomSchalung(dn) };
}

/* ---------- Montageschritte (kumulativ; keys = 3D-Teile) ---------- */
function stepsFor(dn){
  const c = DN_CFG[dn];
  const unter = [
    {t:'Stützplatte bereitlegen', s:'Stützplatte (1) mit der Bohrungsseite nach oben.', p:['stuetzplatte']},
    {t:'Radhalterung montieren', s:'Distanzstück (2) und Gabel (3) mit 3× M6×40 (5) auf das Ende der Stützplatte schrauben.', p:['distanz_rad','radhalterung','s_radh']},
    {t:'Laufscheibe einsetzen', s:'Laufscheibe DN70 (4) mit M8×40 (6) und Mutter M8 (7) in der Gabel lagern.', p:['rad_u','s_achse_u','n_achse_u']},
  ];
  if (c.spacers.length) unter.push({t:'Distanzstücke setzen', s:'Distanzstücke '+c.spacers.map(v=>v+' mm').join(' + ')+' mittig auf die Stützplatte stellen'+(c.spacers.length>1?', mit M8×50 untereinander verschrauben':'')+'.', p:['dstueck100','dstueck50','s_dstk']});
  unter.push({t:'Bumper aufsetzen', s:'Bumper (8) von unten durch Stützplatte'+(c.spacers.length?' und Distanzstücke':'')+' mit den beiden M8-Schrauben verschrauben.', p:['bumper','s_bumper']});

  const zentral = [
    {t:'Grundkörper und Grundplatte', s:'Grundplatte zur Stützplatte (2) unter den Grundkörper (1) setzen und mit 2× M8×16 (3) auf den Bumper schrauben.', p:['grundkoerper','grundplatte','s_grundplatte']},
    {t:'Zentralrohr einstecken', s:'Zentralrohr (5) von hinten in den Grundkörper schieben und von unten mit 4× M5×12 (14) samt Scheiben (19) klemmen.', p:['zentralrohr','s_k14','w_k19']},
    {t:'Klappvorrichtung aufbauen', s:'Teil1 (7) auf das Rohrende, Teil3 (8) mit 2× M6×20 (15) obenauf, Teil2 (9) mit Zylinderstift 6×60 (18) im Gelenkauge einhängen; Klemmschraube M6×30 (16) mit Muttern (17), M6×50 (24) durch die Langlöcher.', p:['klapp1','klapp3','s_k15','klapp2','stift','s_k16','n_k17','s_k24']},
    {t:'Federpaket', s:'M6×90 (20) unten durch Teil1 und Teil2 stecken, beide Federn (23) aufschieben, Sicherungsmutter (21) aufdrehen.', p:['s_k20','feder','n_k21']},
    {t:'Werkzeugaufnahme', s:'Werkzeugaufnahme Teil1 (10) mit 2× M8×20 (13) und 4× M5×16 (22) an Teil2 – Schnittstelle zum Fräsroboter.', p:['werkzeugaufnahme','s_wza','s_k22']},
    {t:'Einbauhilfe', s:'Einbauhilfe (4) vorn in den Grundkörper stecken und mit M8×35 (12) und Mutter (11) klemmen; Laufscheibe DN70 (6) sitzt am Gabelende.', p:['einbauhilfe','s_rad_z','n_rad_z','rad_z']},
  ];
  const halte = [
    {t:'Schildhalterung Teil1', s:'Grundplatte Teil1 (9) mit 4× DIN 7991 M5×12 von oben auf den Grundkörper schrauben.', p:['teil1','s_senk']},
    {t:'Stehplatten Teil2', s:'Beide Stehplatten Teil2 (15) seitlich an die Aufkantungen von Teil1 setzen, je 4× M6×20.', p:['teil2','s_bef']},
    {t:'Tragstangen Teil3', s:'Tragstangen Teil3 (4) mit ihren Flachleisten auf die Plattenoberkanten legen, je 2× M6×16.', p:['teil3','s_teil2']},
    {t:'Blasenwelle einsetzen', s:'Blasenwelle (10) mittig auf Höhe der Tragstangen; Klemmblock (13) auf den Zapfen, Bolzen Befestigung 2 (5) in die vorderen Stangenenden, zweiter Klemmblock auf den rechten Bolzen.', p:['welle','bef1','bef2']},
    {t:'Gehäuse, Deckel, Motor', s:'Gehäuse (6) zwischen die Bolzen setzen und mit 4× '+c.screwTeil1.replace('DIN 912 ','')+' quer durch die Bolzen verschrauben; Deckel (2) mit 4× M5×12, Motor (11) mit 4× M4×16 anflanschen.', p:['gehaeuse','s_teil1','deckel','s_deckel','motor','s_motor']},
  ];
  const schal = [
    {t:'Aufnahmen auf die Tragstangen', s:'Beide Aufnahmen (1) mit der Rohrhülse auf die Tragstangen der Halteeinheit schieben und je mit M5×30 (4) sichern; Füße Pos2 (2) an die unteren Bügelenden.', p:['aufnahme1','aufnahme2','s_aufn2']},
    {t:'Schalungsträger', s:'Schalungsträger auf die Bügel legen und an den acht Laschen mit M5×10 (3) von innen verschrauben.', p:['traeger','s_aufn']},
    {t:'Blase auflegen', s:'Gummiblase auf den Träger legen, Öffnung über der Blasenwelle ausrichten.', p:['blase']},
    {t:'Schalungsschild', s:'Schalungsschild als äußere Schale aufsetzen – Öffnung deckungsgleich mit Blase und Träger.', p:['schild']},
  ];
  const gesamt = [
    {t:'Unterteil', s:'Stützplatte, Radhalterung mit Rad, '+(c.spacers.length?'Distanzstücke, ':'')+'Bumper.', bg:'unterteil'},
    {t:'Zentraleinheit aufsetzen', s:'Grundplatte auf den Bumper schrauben; Zentralrohr mit Klappvorrichtung und Werkzeugaufnahme, Einbauhilfe mit Rad.', bg:'zentral'},
    {t:'Halteeinheit montieren', s:'Auf den Grundkörper: Teil1, Stehplatten Teil2 mit Tragstangen Teil3, Blasenwelle mit Klemmblöcken und Bolzen, Gehäuse, Deckel und Motor.', bg:'halte'},
    {t:'Schalung aufsetzen', s:'Bogenbügel auf die Tragstangen, dann Schalungsträger, Blase und Schalungsschild.', bg:'schalung'},
    {t:'Ankoppeln am Fräsroboter', s:'Werkzeugaufnahme mit dem Roboter verbinden, Druckluft für Bumper und Blase sowie Mörtelschlauch anschließen – einsatzbereit für '+dn+'.', bg:null},
  ];
  return { unterteil:unter, zentral:zentral, halte:halte, schalung:schal, gesamt:gesamt };
}
