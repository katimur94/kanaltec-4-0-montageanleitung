export const families = [
  { id:300, label:'DN 300', page:3, spacer:[], holder:65 },
  { id:400, label:'DN 350–400', page:8, spacer:[50], holder:105 },
  { id:500, label:'DN 450–500', page:13, spacer:[100], holder:155 },
  { id:600, label:'DN 550–600', page:18, spacer:[100,50], holder:205 },
  { id:700, label:'DN 650–700', page:23, spacer:[100,50,50], holder:255 },
];
export const groupInfo = {
  s:{name:'Schalung',short:'Schalung',color:'#b79828',text:'Drei gekrümmte Lagen: Schalungsschild außen, Dichtblase dazwischen und Schalungsträger innen. Träger und Dichtblase haben jeweils eine große ovale Öffnung. Die drei getrennten Öffnungen und der von unten befestigte Injektionsanschluss gehören zum äußeren Schalungsschild.',offset:4},
  h:{name:'Halteeinheit',short:'Halteeinheit',color:'#527f98',text:'Zwei seitliche Haltebleche, Rohrführungen und die gelagerte Blasenwelle verbinden die Schalung mit dem Grundkörper. Der Motor liegt auf der Laufrollenseite; das flache Ende der Blasenwelle zeigt zum Roboteranschluss.',offset:1},
  z:{name:'Zentraleinheit / Oberwagen',short:'Zentraleinheit',color:'#55766c',text:'Das Zentralrohr verbindet Grundkörper, Einbauhilfe und Klappvorrichtung. Die Werkzeugaufnahme bildet die Schnittstelle zum Roboter; das kleine Rad unterstützt das Einbringen.',offset:2},
  u:{name:'Unterteil',short:'Unterteil',color:'#5f6570',text:'Bumper, Stützplatte und Radhalterung bilden die untere Abstützung. Die Distanzstücke passen die Bauhöhe an den Rohrdurchmesser an.',offset:3}
};
const row=(pos,name,qty,key,kind='part',extra={})=>({pos,name,qty,key,kind,...extra});
const screw=(pos,size,qty,key)=>row(pos,'DIN 912 '+size,qty,key,'screw');
export function bom(id,g){
 const dn='DN'+id;
 if(g==='h') return [
  screw(1,'M5 × 12',4,'coverbolts'),row(2,'Deckel_Gehäuse_Blasenwelle',1,'cover'),
  screw(3,id===300?'M6 × 45':'M6 × 16',4,id===300?'blockbolts':'railbolts'),row(4,'Schildhalterung Teil3',2,'rail'),
  row(5,'Befestigung_Blaseneinheit_2',2,'pins'),row(6,'Gehäuse_Blasenwelle',1,'housing'),
  screw(7,id===300?'M6 × 16':'M6 × 20',id===300?4:8,id===300?'railbolts':'sidebolts'),
  id===300?screw(8,'M6 × 20',8,'sidebolts'):row(8,'DIN 7991 M5 × 12',4,'bottomfix','screw'),
  row(9,'Schildhalterung Teil1',1,'base'),row(10,'Welle_Blase',1,'shaft'),row(11,'Motor',1,'motor'),
  id===300?row(12,'DIN 7991 M5 × 12',4,'bottomfix','screw'):screw(12,'M4 × 16',4,'motorbolts'),
  row(13,id===300?'Befestigung Blaseneinheit1':'Befestigung Blaseneinheit1_DN400',2,'blocks'),
  screw(14,id===300?'M4 × 16':'M6 × 65',4,id===300?'motorbolts':'blockbolts'),
  row(15,'Schildhalterung Teil2'+(id===300?'':id===400?'_DN400':'_'+families.find(f=>f.id===id).label.replaceAll(' ','').replace('–','-')),2,'sides')
 ];
 if(g==='z') return [
  row(1,'Grundkörper',1,'body'),row(2,'Grundplatte zur Stützplatte',1,'disc'),screw(3,'M8 × 16',2,'bodybolts'),
  row(4,'Einbauhilfe',1,'guide'),row(5,'Zentralrohr',1,'tube'),row(6,'RAD DN70',1,'wheel'),
  row(7,'Klappvorrichtung Teil1',1,'hinge1'),row(8,'Klappvorrichtung Teil3',1,'hinge3'),row(9,'Klappvorrichtung Teil2',1,'hinge2','part',{note:'Beweglicher senkrechter Schenkel des L mit Gelenk an der oberen Ecke. Federn verbinden ihn mit Teil 1; keine zusätzlichen starren Laschen.'}),
  row(10,'Werkzeugaufnahme Teil1',1,'adapter'),row(11,'Sechskantmutter ISO 4032 M8',1,'axlenut','nut'),screw(12,'M8 × 35',1,'axle'),
  screw(13,'M8 × 20',2,'adapterbolts'),screw(14,'M5 × 12',4,'hingebolts'),screw(15,'M6 × 20',2,'topbolts'),
  screw(16,'M6 × 30',1,'guidebolt'),row(17,'Sechskantmutter ISO 4032 M6',2,'nuts','nut'),
  row(18,'DIN EN 28734 – 6 × 60 – A – St',1,'hingepin','pin'),row(19,'Scheibe DIN 126 – 5,5',4,'washers','washer'),
  row(20,'DIN 912 M6 × 90',1,'pivotbolt','screw',{unplaced:true,note:'In der PDF-Stückliste aufgeführt. Einbaulage nicht eindeutig zugeordnet; deshalb nicht im 3D-Modell platziert.'}),row(21,'DIN EN ISO 7040 M6',1,'locknut','nut',{unplaced:true,note:'Einbaulage nicht eindeutig belegt. Die bisher zusammen mit Pos. 20 an der Klappvorrichtung angenommene Platzierung wurde entfernt.'}),screw(22,'M5 × 16',4,'springbolts'),
  row(23,'Feder',2,'spring','spring'),row(24,'DIN 912 M6 × 50',1,'lastbolt','screw',{note:'Seitliche Rohrfixierung im Grundkörper, mit einer M6-Mutter aus Pos. 17 auf der Gegenseite. Einbaulage nach ergänzender Systembeschreibung; Lochabstand angenähert.'})
 ];
 if(g==='u') {
  const a=[row(1,'Stützplatte',1,'plate'),row(2,'Distanzstück Radhalterung',1,'wheelspacer'),row(3,'Radhalterung',1,'fork'),row(4,'RAD DN70',1,'wheel'),screw(5,'M6 × 40',3,'forkbolts'),screw(6,'M8 × 40',1,'axle'),row(7,'Sechskantmutter ISO 4032 M8',1,'nut','nut'),row(8,'Bumper',1,'bumper')];
  if(id===300)a.push(screw(9,'M8 × 16',2,'mountbolts'));
  if(id===400)a.push(screw(9,'M8 × 65',2,'mountbolts'),row(11,'D_Stück_50mm',1,'spacer50'));
  if(id>=500)a.push(row(9,'D_Stück_100mm',1,'spacer100'),screw(10,'M8 × 120',2,'mountbolts'));
  if(id>=600)a.push(row(11,'D_Stück_50mm',id===700?2:1,'spacer50'),screw(12,'M8 × 50',id===700?4:2,'spacerbolts'));
  return a;
 }
 if(g==='s') {
  if(id===600)return [
   row(1,'Schalungsträger',1,'carrier','alias',{aliasOf:10}),row(2,'Blase',1,'mat','alias',{aliasOf:8}),row(3,'Schalungsschild',1,'shield','alias',{aliasOf:9}),
   row(4,'Aufnahme_Schalungsschild',2,'mounts'),row(5,'Aufnahme_Schalungsschild_Pos2',4,'straps'),screw(6,'M5 × 10',8,'bolts'),screw(7,'M5 × 30',2,'mountbolts'),
   row(8,'DN600_Blase',1,'mat'),row(9,'DN600_Schalungsschild',1,'shield'),row(10,'DN600_Schalungsträger',1,'carrier')
  ];
  return [row(1,'Aufnahme_Schalungsschild',2,'mounts'),row(2,'Aufnahme_Schalungsschild_Pos2',4,'straps'),screw(3,'M5 × 10',8,'bolts'),screw(4,'M5 × 30',2,'mountbolts'),
   row(5,id===500?'DN500_Schalungsträger':id===300?'Blase':dn+'_Blase',1,id===500?'carrier':'mat'),
   row(6,id===300?'Schalungsschild':dn+'_Schalungsschild',1,'shield'),
   row(7,id===500?'DN500_Blase':id===300?'Schalungsträger':dn+'_Schalungsträger',1,id===500?'mat':'carrier')];
 }
 return [];
}
export const PHASE={MILL_OUTER:0,CHANGE:1,POSITION:2,BUMPER:3,SEAL:4,BLADDER:5,MORTAR:6,CURE:7,REMOVE:8};
export const stages=[
 {title:'Anschluss freifräsen',tag:'01 / VORBEREITEN',text:'Der Roboter fährt mit Fräswerkzeug ohne Schalung zur Schadstelle. Zuerst fräst er den in die Haltung einragenden Anschluss und Wurzeleinwuchs zurück. Danach bearbeitet er die Rohrinnenwand örtlich entlang der ovalen Reparaturkontur um den Anschluss, ungefähr eine Fräserbreite breit und eine Fräserstärke tief.',focus:'Eine Fräserbreite breit · eine Fräserstärke tief',caption:'Fräskopf und rot-schwarzer Fräser nach Nutzerfoto; Maße angenähert: 60 mm Durchmesser, 16 mm Stärke als Darstellungsannahme, keine Herstellermaße. Unter „Fräsdetail“ und „Schnitt & Sicht“ den Abtrag betrachten.'},
 {title:'Zur Schalung wechseln',tag:'02 / WERKZEUGWECHSEL',text:'Das Fräswerkzeug wird abgesenkt und der Roboter fährt zurück. Außerhalb der Schadstelle erfolgt der Wechsel auf die Klappvorrichtung mit Schalung. Danach beginnt die bekannte Sanierungsfolge.',focus:'Fräser zurückziehen · Schalung übernehmen',caption:'Der Werkzeugwechsel außerhalb der Schadstelle wird als Szenenwechsel dargestellt. Fräser und Schalung sind nie gleichzeitig montiert.'},
 {title:'Positionieren',tag:'03 / AUSRICHTEN',text:'Während der Fahrt ist der Bumper vakuumiert und flach: Die Schalung ist abgesenkt. Der Roboter positioniert sie unter dem Anschluss. Die Anschlussblase liegt mit drei vollständigen Windungen um die Welle. Vakuumiert ist jede Wandlage etwa 3 mm dick, die zusammenliegende Blase damit etwa 6 mm. Ihre starre runde Spitze ragt etwas durch die Schildöffnung.',focus:'Fahrt mit vakuumiertem Bumper',caption:'Unter „Schnitt & Sicht“ lassen sich Rohr, Schalung und Halterung unabhängig einstellen.'},
 {title:'Schild anpressen',tag:'04 / ABDICHTEN',text:'Erst wenn die Schalung die Anschlussposition erreicht hat, wird der Bumper mit Luft aufgeblasen. Er hebt die obere Baugruppe an und drückt das Schalungsschild gegen die Rohrinnenwand am Anschluss.',focus:'Bumper aufblasen und Schalung anpressen',caption:'Hub und Verformung sind schematisch; die Bewegung zeigt den Wechsel von Vakuum zur Luftfüllung.'},
 {title:'Dichtblase aufblasen',tag:'05 / SCHALUNG ABDICHTEN',text:'Nach dem Aufblasen des Bumpers erhält die separate Blase zwischen Schalungsträger und Schalungsschild Luft. Sie dehnt sich gegen das Schild aus und stellt die abschließende Abdichtung her. Die Anschlussblase bleibt währenddessen auf der Welle aufgewickelt.',focus:'Zwischenblase stellt die letzte Abdichtung her',caption:'Die schwarze Lage ist die Blase aus der PDF-Stückliste. Ihre Ausdehnung ist schematisch; unter „Schnitt & Sicht“ kannst du den Schalungsschnitt selbst einschalten.'},
 {title:'Anschlussblase einfahren',tag:'06 / ANSCHLUSS FORMEN',text:'Die Anschlussblase wird mit ihrem Außengewinde direkt in das Innengewinde der Welle eingeschraubt. Ihr wellenseitiges Ende ist starr, rund und etwa 70 mm im Durchmesser. Die gerade Stirnfläche sitzt fast bündig auf der flachen Wellenfläche. Dieses Endstück bleibt beim Wickeln und Aufblasen formstabil; darüber beginnt die flexible Blasenhaut. Nach dem Aufblasen von Bumper und Dichtblase dreht der Motor die Welle und wickelt die Anschlussblase vollständig ab. Am Ende steht die flache Fläche parallel zur Anschlussöffnung; die Blase führt ohne Restwicklung und ohne Knick gerade in den Anschluss. Erst jetzt erhält sie Luft und wird aufgeblasen.',focus:'Vollständig abwickeln · gerade ausrichten · dann aufblasen',caption:'Wickelverlauf nach Foto und ergänzender Systembeschreibung; Drei Windungen und etwa 3 mm je Wandlage nach Nutzerangabe. Falten und Einfahrweg bleiben schematisch; der Teil oberhalb des Schildes ist gegenüber dem bisherigen Modell halb so lang. Die drei Wicklungen bleiben unverändert; der Übergang ist eine schematische Verformung.'},
 {title:'Mörtel injizieren',tag:'07 / HOHLRAUM VERFÜLLEN',text:'Der Opferschlauch führt von hinter dem Roboter neben der CutterCam zum wiederverwendbaren 45°-Messingwinkel unter der Schalung. Durch diesen Winkel und die Injektionsöffnung wird der Mörtel zunächst in den Hohlraum an der Anschlusskante und in das umgebende Erdreich verpresst. Anschließend steigt er im Anschluss um die Blase bis zur Hälfte ihrer ausgefahrenen Höhe oberhalb des Schildes. Die Anschlussblase hält dabei den ursprünglichen Durchgang frei. Erst bei vollständiger Füllung leuchtet die rote Meldelampe am Drucksensor.',focus:'Bis zur halben Blasenhöhe im Anschluss verfüllen',caption:'Erst Schlauchfüllung, dann Schadstelle und Erdreich, danach steigt der Mörtel im vorhandenen Spalt zwischen Blase und Anschlusswand. Es wird keine Nut gefräst. Die Blase formt den freien Durchgang. Verpressung und Vollmeldung sind schematisch dargestellt.'},
 {title:'Aushärten lassen',tag:'08 / VERBINDUNG HERSTELLEN',text:'Bumper und Dichtblase halten das Schalungsschild bis zur erforderlichen Festigkeit angepresst. Die Anschlussblase bleibt im Anschluss. Die tatsächliche Wartezeit richtet sich nach Mörtel und Bedingungen vor Ort.',focus:'Der Mörtel verbleibt im Sanierungsbereich',caption:'Die Animationsdauer bildet keine reale Aushärtezeit ab.'},
 {title:'Ausschalen & kontrollieren',tag:'09 / FERTIGSTELLEN',text:'Nach dem Aushärten wird die Anschlussblase entspannt und durch Rückwärtsdrehen der Welle aufgewickelt. Die starre Spitze bleibt leicht über der Schildöffnung sichtbar. Danach wird die Dichtblase zwischen Schild und Träger entspannt. Anschließend wird der Bumper wieder vakuumiert: Die Schalung senkt sich ab und fährt in flacher Fahrtstellung weiter. Nach jeder Verpressung und Aushärtung wird der Opferschlauch gewechselt; der Messingwinkel wird gereinigt und wiederverwendet.',focus:'Aufwickeln, Dichtblase entspannen, Bumper vakuumieren',caption:'Der Mörtel bleibt zurück. Erst nach Einziehen der Anschlussblase, Entspannen der Zwischenblase und Absenken der Schalung beginnt die Weiterfahrt.'}
];
export const sources=[
 {title:'IBAK · MicroGator-Prospekt',url:'https://www.ibak.de/fileadmin/website/ansprechpartner/flyer_prospekte/fraeserprospekt_a4_de_en.pdf',note:'S. 6–7 und 14–15: Fahrwagen, Hubarm, CutterCam und PUR-/Luftbereifung. S. 16–17: 150-mm-Körperhüllkreis, 720-mm-Starre Länge und Fahrwagenzusätze DN 350–600 sowie DN 600–800.'},
 {title:'IBAK · MicroGator Air – Aufbau der Fahrwagenzusätze',url:'https://www.ibak.de/fileadmin/website/ansprechpartner/flyer_prospekte/microgator_air_10s_en.pdf',note:'S. 6–7: Detailbilder von Zusatzrahmen, Getriebegehäusen, Nabenadaptern und Bereifung. Als Formvergleich des Zubehörs verwendet; das dargestellte DiTom-Trägerfahrzeug bleibt der MicroGator.'},
 {title:'IBAK · Übersicht der Fräs- und Sanierungssysteme',url:'https://www.ibak.de/fileadmin/website/ansprechpartner/flyer_prospekte/uebersicht_fraeser_01.pdf',note:'Seitenansichten von MicroGator, Geräteaufnahme und wechselbaren Arbeitsköpfen. In der Präsentation sitzt die Klappvorrichtung an der Aufnahme.'},
 {title:'IBAK · Allgemeine Radsätze',url:'https://www.ibak.de/fileadmin/website/ansprechpartner/flyer_prospekte/radsaetze_en.pdf',note:'Diese Übersicht gehört zu T66/T76 und PANORAMO. Ihre Radbezeichnungen und Maße sind keine belegte MicroGator-Rüsttabelle und wurden dafür nicht übernommen.'},
 {title:'DiTom GmbH Kanaltechnik',url:'https://www.ditom-kanaltechnik.de/',note:'Hersteller-/Unternehmenszuordnung.'},
 {title:'Hermes Technologie · frühere Produktreferenz',url:'https://www.hermes-technologie.de/kanaltec-4-0/',note:'System, Einsatzbereiche und Drucküberwachung.'},
 {title:'IBAK · Anschlusseinbindung mittels Injektionsmörtel',url:'https://www.ibak.de/infos/magazin/artikel/anschlusseinbindung-mittels-injektionsmoertel',note:'Ablauf des DiTom-DSS-Flex-Verfahrens: Positionierung, Pneumatik, Blase, Injektion und Ausschalen. Als Funktionsreferenz verwendet; keine Gleichsetzung sämtlicher Bauteile mit dem PDF-Stand.'}
];
export const videos=[
 {id:'jWczYU40AhY',title:'Historische Videoreferenz · Stutzensanierungsroboter'},
 {id:'lrbtHgalpqc',title:'Historische Videoreferenz 2 · Stutzensanierung'},
 {id:'k--FPQ0t1t8',title:'Historische Videoreferenz 3 · Verfahrensdarstellung'}
];
