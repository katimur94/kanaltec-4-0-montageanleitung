// DSS-Flex Sanierungsanhänger – planning data (Konzept 3, 23.09.2026).
// Metres. x along the trailer (+x = drawbar/front), z across (+z = right,
// curb side with side door), y up. Component x/z = origin on the floor,
// mount = height of the origin above the floor. Masses without a source
// are planning estimates. Forms follow the photos of the existing system.

export const trailer = {
 inner: {length: 5.05, width: 2.10, height: 2.05},
 floorY: 0.76,
 axleX: [0.21, -0.63],       // tandem, centre -0.21 (balanced for the heavy front end)
 wheelR: 0.30,
 couplingX: 4.02,
 emptyMass: 1100,            // tandem box trailer 3.5 t, 5 m GRP box, side door (estimate)
 emptyCgX: -0.05,            // empty trailer slightly nose-heavy
 fitOut: 190,                // lining, airline rails, cable ducts, lights, partitions (estimate)
 door: {x0: 0.55, x1: 1.35, h: 1.88},
};
export const limits = {gvw: 3500, tongueMax: 140, tongueMinAbs: 25};

export const groups = [
 {id: 'energie', name: 'Energie', color: '#8f64e6'},
 {id: 'luft', name: 'Druckluft, Vakuum & Trommel', color: '#e2a023'},
 {id: 'schalung', name: 'DSS-Flex Schalungen & Blasen', color: '#df3f45'},
 {id: 'wasser', name: 'Wasser & Reinigung', color: '#2a97d8'},
 {id: 'moertel', name: 'Mörtel', color: '#e0743a'},
 {id: 'arbeit', name: 'Arbeitsplatz & Sicherheit', color: '#6f8796'},
 {id: 'aussen', name: 'Aufbau & Außen', color: '#3f9c7a'},
];

// photos: file names in "Bilder von alte Anlage" used as form reference.
// drawers: openable drawers/boxes (toggle ids) with their contents.
export const components = [
 {n: '01', id: 'gen', group: 'energie', title: 'Stromaggregat 12 kVA im Technikfach', place: 'Links vorn · geschlossenes Fach, Serviceklappe außen', mass: 280, x: 1.8625, z: -0.665, mount: 0,
  desc: 'Schallgedämmtes Dieselaggregat in einem eigenen Fach aus Sandwichplatten. Frischluft über die Serviceklappe links, Kühlluft durch das Gitter in der Stirnwand, Abgas senkrecht durch den Boden. Bedienfeld hinter der Lüftungstür zum Gang.',
  spec: [['12 kVA', '400 / 230 V'], ['ca. 280 kg', 'mit Fach'], ['Tank', 'ca. 25 l Diesel'], ['Abgas', 'durch den Boden']],
  photos: [], toggles: ['genDoor', 'genFlap']},
 {n: '02', id: 'elec', group: 'energie', title: 'Unterverteilung & Hilfsakku', place: 'Stirnwand Mitte', mass: 45, x: 2.525, z: 0.10, mount: 0,
  desc: 'Umschalter Netz/Aggregat, FI-Schutzschalter je Stromkreis, Steckdosenkombination. Der Hilfsakku versorgt Licht und Kleinverbraucher, wenn das Aggregat aus ist. Kabelkanäle führen unter der Decke zu allen Stationen.',
  spec: [['FI/RCD', 'je Stromkreis'], ['Umschalter', 'Netz / Aggregat'], ['Akku', '24 V · 5 kWh'], ['Einspeisung', 'CEE 32 A außen']],
  photos: ['20260921_122110.jpg']},
 {n: '03', id: 'comp', group: 'luft', title: 'Kompressor im Profilregal', place: 'Rechts vorn · oberes Fach, darunter Eurokisten', mass: 100, x: 2.12, z: 0.775, mount: 0,
  desc: 'Aluminium-Profilregal wie in der bestehenden Anlage: oben der fahrbare Kompressor mit 50-l-Kessel, darunter drei Eurokisten auf Gleitleisten, gesichert mit schwenkbaren Sperrbügeln. Seitlich hängen Handfeger und Werkzeug, rechts stehen Sprühdosen.',
  spec: [['10 bar', '50 l Kessel'], ['2,2 kW', '230 V'], ['3 Eurokisten', '600 × 400'], ['Sperrbügel', 'je Kiste']],
  photos: ['20260923_131031.jpg'], toggles: ['box-1', 'box-2', 'box-3'],
  drawers: [
   {id: 'box-1', title: 'Eurokiste 1 · Ersatzblasen', items: ['Anschlussblasen in Folie', 'Dichtblase Ersatz', 'Klebeband, Kabelbinder']},
   {id: 'box-2', title: 'Eurokiste 2 · Opferschläuche', items: ['Klarsichtschlauch in Ringen', 'Schlauchschellen', 'Cutter']},
   {id: 'box-3', title: 'Eurokiste 3 · Werkzeug', items: ['Ringschlüssel 10–19', 'Rohrzange', 'Hammer', 'Innensechskant']},
  ]},
 {n: '04', id: 'vac', group: 'luft', title: 'Vakuumpumpe', place: 'Rechts vorn · unterstes Fach im Kompressorregal', mass: 22, x: 2.12, z: 0.775, mount: 0,
  desc: 'Vakuumpumpe auf einem Stahlbock in einer Auffangwanne. Sie saugt Bumper und Anschlussblase flach, bevor die Schalung in den Kanal fährt und wenn sie ausgeschalt wird.',
  spec: [['0,4 kW', '230 V'], ['Leitung', 'über die Ringleitung']], photos: ['20260923_131020.jpg']},
 {n: '05', id: 'air', group: 'luft', title: 'Druckluft-Ringleitung & Wandkupplungen', place: 'Rechte Wand, Decke hinten, linke Wand', mass: 14, x: 1.70, z: 1.05, mount: 1.30,
  desc: 'Blaue PA-Leitung vom Kompressor über eine Wartungseinheit mit Filter und Druckregler an der Wand entlang bis zum Verteiler. Wandkupplungen mit Kugelhahn an der Seitentür, an der Werkbank und am Mischplatz; am Heck hängt ein Spiralschlauch mit Ausblaspistole.',
  spec: [['6 bar', 'Arbeitsdruck'], ['4 Abgänge', 'Schnellkupplung'], ['Wartungseinheit', 'Filter + Regler'], ['Kondensat', 'Ablass unten']],
  photos: ['20260921_122114.jpg']},
 {n: '06', id: 'drawer', group: 'schalung', title: 'Schwerlastauszug mit Schalungen DN 300 und DN 400', place: 'Links Mitte · bodennah', mass: 110, x: 0.725, z: -0.73, mount: 0,
  desc: 'Vollauszug für 200 kg: zwei komplett montierte DSS-Flex-Schalungen liegen in Schaumstoffbetten, gesichert mit Gurt. Der Auszug zieht in den Gang, die Schalung wird direkt gegriffen. Rote Rastverriegelung gegen Aufziehen während der Fahrt.',
  spec: [['2 Sätze', 'DN 300 · DN 400'], ['Vollauszug', 'bis 200 kg'], ['Verriegelung', 'Rastgriff'], ['ca. 110 kg', 'mit Schalungen']],
  photos: [], toggles: ['drawer'], kit: 400,
  drawers: [{id: 'drawer', title: 'Schwerlastauszug', items: ['Schalung DN 300 komplett', 'Schalung DN 350–400 komplett', 'Schaumstoffbetten, Spanngurt']}]},
 {n: '07', id: 'saddle', group: 'schalung', title: 'Wandsattel Wechselschilde DN 450–700', place: 'Links Mitte · über dem Auszug', mass: 60, x: 0.725, z: -1.05, mount: 1.02,
  desc: 'Vier Schalungsschilde liegen ineinander auf einem gummierten Sattelarm, genau wie in der bestehenden Anlage. Ein Spanngurt zur Airline-Schiene sichert den Stapel.',
  spec: [['4 Schilde', 'DN 450 – 700'], ['Sattelarm', 'gummiert'], ['Sicherung', 'Spanngurt']],
  photos: ['20260923_130830.jpg', '20260923_130834.jpg', '20260923_130841.jpg'], kit: 600},
 {n: '08', id: 'bladders', group: 'schalung', title: 'Blasenhalter an der Decke', place: 'Decke links über dem Mörtelregal', mass: 25, x: -0.33, z: -0.66, mount: 2.05,
  desc: 'Fünf Anschlussblasen hängen an einer Siebdruckplatte unter der Decke – trocken, ohne Knick, sofort greifbar. Wie in der bestehenden Anlage mit Rohrschellen und Gummieinlage befestigt.',
  spec: [['5 Blasen', 'je Baugröße'], ['Halter', 'Siebdruck + Schellen'], ['Länge', 'ca. 0,5–0,7 m']], photos: ['20260921_122108.jpg']},
 {n: '09', id: 'hoses', group: 'schalung', title: 'Schlauchsättel Versorgungsleitungen', place: 'Rechts hinten · Wand über dem Mischplatz', mass: 40, x: -1.70, z: 1.05, mount: 1.98,
  desc: 'Blaue Luft- und graue Versorgungsleitungen je Baugröße auf Kunststoff-Schlauchsätteln, die Baugröße steht auf der Wand. So hängen sie auch in der bestehenden Anlage direkt an der Hecktür.',
  spec: [['2 Sättel', 'Kunststoff'], ['Beschriftung', '400 · 500'], ['Reserve', 'Luft, Vakuum, Sensor']], photos: ['20260923_130846.jpg', '20260923_130849.jpg']},
 {n: '10', id: 'drum', group: 'luft', title: 'Versorgungstrommel 60 m', place: 'Links hinten · an der Hecktür', mass: 92, x: -2.08, z: -0.66, mount: 0,
  desc: 'Große Stahltrommel mit Lochscheiben wie in der bestehenden Anlage. Das Leitungsbündel zur Schalung (Luftkreise, Vakuum, Sensor) läuft über eine Drehdurchführung zum Verteiler, die Trommel hat Kurbel und Feststellbolzen.',
  spec: [['60 m', 'Leitungsbündel'], ['Ø 0,9 m', 'Stahltrommel'], ['Drehdurchführung', 'mehrkanalig'], ['Feststellung', 'Bolzen']],
  photos: ['20260921_122111.jpg']},
 {n: '11', id: 'manifold', group: 'luft', title: 'Druckluftverteiler', place: 'Linke Wand hinten · über der Trommel', mass: 12, x: -2.22, z: -1.05, mount: 1.55,
  desc: 'Stahlkasten mit Kugelhähnen, Feinregler mit Manometer und farbcodierten Kupplungen für die drei Druckkreise und das Vakuum. Von hier gehen die Leitungen zur Drehdurchführung der Trommel.',
  spec: [['3 Druckkreise', '+ Vakuum'], ['Regler', 'Feinregler mit Manometer'], ['Kupplungen', 'farbcodiert']], photos: ['20260923_130855.jpg']},
 {n: '12', id: 'tankL', group: 'wasser', title: 'Wassertank links 300 l', place: 'Links über den Achsen · unter dem Mörtelregal', mass: 32, variable: 'water', x: -0.33, z: -0.75, mount: 0,
  desc: 'Einer von zwei 300-l-Tanks zwischen den Achsen, in einer verzinkten Wanne mit zwei Gurten. Unter dem Boden mit dem rechten Tank verbunden – gleiche Füllhöhe links und rechts. Befüllung außen über die C-Kupplung.',
  spec: [['300 l', 'PE, Schwallwände'], ['600 l', 'gesamt'], ['Füllung', 'C-Kupplung außen'], ['Entlüftung', 'nach außen']], photos: []},
 {n: '13', id: 'tankR', group: 'wasser', title: 'Wassertank rechts 300 l mit Füllstand', place: 'Rechts über den Achsen · unter der Werkbank', mass: 32, variable: 'water', x: -0.235, z: 0.75, mount: 0,
  desc: 'Zweiter 300-l-Tank unter der Werkbank. Das Schauglas zeigt den gemeinsamen Füllstand beider Tanks.',
  spec: [['300 l', 'PE'], ['Schauglas', '0–600 l'], ['Ausgleich', 'unter dem Boden']], photos: []},
 {n: '14', id: 'pumpset', group: 'wasser', title: 'Hauswasserwerk & Filter', place: 'Links hinten · unteres Fach im Gerätegestell', mass: 22, x: -1.34, z: -0.77, mount: 0,
  desc: 'Pumpe mit blauem Druckschalter und Manometer auf einem Stahlbock in der Auffangwanne, wie in der bestehenden Anlage. Saugt über den Filter aus den Tanks und versorgt Hochdruckreiniger und die Zapfstelle am Mischplatz.',
  spec: [['Druckschalter', 'mit Manometer'], ['Filter', 'vor der Pumpe'], ['Wanne', 'fängt Tropfwasser']], photos: ['20260923_131014.jpg', '20260921_122113.jpg', '20260921_122114.jpg']},
 {n: '15', id: 'hd', group: 'wasser', title: 'Hochdruckreiniger', place: 'Links hinten · oberes Fach im Gerätegestell', mass: 65, x: -1.34, z: -0.77, mount: 0.56,
  desc: 'Kaltwasser-Hochdruckreiniger mit Reinigungsmitteltrichter, gespeist vom Hauswasserwerk. Der Schlauch läuft zur Edelstahl-Haspel unter der Decke, die Pistole hängt an der Wand.',
  spec: [['200 bar', 'Kaltwasser'], ['400 V', 'ca. 6,5 kW'], ['Zulauf', 'vom Hauswasserwerk']], photos: ['20260921_122110.jpg']},
 {n: '16', id: 'reel', group: 'wasser', title: 'Edelstahl-Schlauchaufroller', place: 'Decke links hinten', mass: 30, x: -1.34, z: -0.66, mount: 2.05,
  desc: 'Automatischer Schlauchaufroller an einer Edelstahlkonsole unter der Decke, wie in der bestehenden Anlage. 30 m Hochdruckschlauch reichen vom Heck bis zum Schacht.',
  spec: [['30 m', 'HD-Schlauch'], ['Federrückzug', 'mit Führungsarm'], ['Edelstahl', 'Deckenkonsole']], photos: ['20260921_122110.jpg', '20260921_122108.jpg']},
 {n: '17', id: 'mixer', group: 'moertel', title: 'Mischpumpe auf Rollen', place: 'Rechts hinten · unter der Arbeitsplatte, rollt über Rampen raus', mass: 170, variable: 'mixer', x: -1.84, z: 0.70, mount: 0,
  desc: 'Schneckenpumpe mit Trichter und eingesetztem Mischkübel auf einem fahrbaren Gestell – genau wie in der bestehenden Anlage steht sie im Profilrahmen unter der Arbeitsplatte. Zum Arbeiten rollt sie über zwei Klapprampen unter die Heckmarkise. Grüner Stator, Messing-Geka am Ausgang, Mörteldruckmanometer.',
  spec: [['Schneckenpumpe', 'bis 25 bar'], ['Trichter', 'ca. 60 l + Kübel'], ['Räder', 'Luftbereifung'], ['Anschluss', 'Geka + CEE 16 A']],
  photos: ['20260923_130940.jpg', '20260923_130946.jpg', '20260923_130951.jpg'], toggles: ['mixer']},
 {n: '18', id: 'paddle', group: 'moertel', title: 'Rührwerk', place: 'Rechte Wand hinten · im Schlauchsattel', mass: 8, x: -1.34, z: 1.05, mount: 1.62,
  desc: 'Handrührwerk mit Quirl zum sackweisen Anmischen im Kübel. Es hängt wie in der bestehenden Anlage im Schlauchsattel, direkt über dem Mischplatz.',
  spec: [['1,6 kW', '230 V'], ['Quirl', 'Ø 140 mm']], photos: ['20260923_130846.jpg']},
 {n: '19', id: 'bags', group: 'moertel', title: 'Mörtelregal über dem linken Tank', place: 'Links über den Achsen', mass: 18, variable: 'bags', x: -0.33, z: -0.75, mount: 0,
  desc: 'Verzinktes Gitterregal über dem Tank: bis zu zehn Sack Verpressmörtel liegen trocken, belüftet und direkt über der Achse, gesichert mit Kante und Gurt.',
  spec: [['bis 10 Säcke', '25 kg'], ['Gitterboden', 'belüftet'], ['Sicherung', 'Kante + Gurt']], photos: ['20260923_131004.jpg']},
 {n: '20', id: 'settle', group: 'moertel', title: 'Absetzbehälter Waschwasser', place: 'Rechts hinten · vorn im Mischplatz', mass: 18, variable: 'wash', x: -1.23, z: 0.70, mount: 0,
  desc: 'Behälter mit Prallwand: Waschwasser aus Pumpe, Trichter und Kübel setzt sich ab, das Klarwasser wird geprüft und neutralisiert entsorgt.',
  spec: [['80 l', 'mit Prallwand'], ['Ablass', 'Kugelhahn']], photos: []},
 {n: '21', id: 'bench', group: 'arbeit', title: 'Werkbank mit Schubladen', place: 'Rechts über den Achsen · über dem Tank', mass: 85, x: -0.235, z: 0.72, mount: 0,
  desc: 'Profilrahmen mit Siebdruckplatte, drei tiefen Schubladen und Schraubstock. Darüber Lochwand mit Werkzeug, Steckdosen und Druckluft; an der Wand die Rolle mit Opferschlauch. Die Schubladen enthalten die Kleinteile der Schalung wie in der bestehenden Anlage.',
  spec: [['3 Schubladen', 'Vollauszug'], ['Schraubstock', '125 mm'], ['Lochwand', 'Werkzeug'], ['Opferschlauch', 'Rollenhalter']],
  photos: ['20260923_130917.jpg', '20260923_130922.jpg', '20260923_130926.jpg', '20260923_130927.jpg', '20260923_130930.jpg'], toggles: ['bench-1', 'bench-2', 'bench-3'],
  drawers: [
   {id: 'bench-1', title: 'Schublade 1 · Messing & Kupplungen', items: ['Messingwinkel 45° mit Schlauchtülle', 'Geka-Kupplungen', 'Schlauchschellen', 'Spiralschlauch']},
   {id: 'bench-2', title: 'Schublade 2 · Schildaufnahmen', items: ['Edelstahl-Platten mit Bohrbild', 'PE-Blöcke', 'Befestigung Blaseneinheit']},
   {id: 'bench-3', title: 'Schublade 3 · Kleinteile', items: ['Sortierkasten mit Fittings', 'Schrauben M5–M8 in Beuteln', 'O-Ringe, Dichtungen']},
  ]},
 {n: '22', id: 'quick', group: 'arbeit', title: 'Schnellzugriff an der Hecktür', place: 'Rechte Wand hinten · Türpfosten', mass: 22, x: -2.36, z: 1.05, mount: 0,
  desc: 'Putzpapierrolle, Verbandkasten, CEE-Steckdose und Spiralschlauch mit Ausblaspistole – griffbereit an der Hecktür wie in der bestehenden Anlage. Auf der Arbeitsplatte Kabeltrommel und Fettkübel.',
  spec: [['Putzpapier', 'Wandrolle'], ['Kabeltrommel', '25 m'], ['Spiralschlauch', 'mit Pistole']], photos: ['20260921_122114.jpg']},
 {n: '23', id: 'safety', group: 'arbeit', title: 'Sicherheit & Verkehrssicherung', place: 'Rechts vorn · neben der Seitentür', mass: 48, x: 1.58, z: 0.86, mount: 0,
  desc: 'Was beim Ankommen zuerst gebraucht wird, liegt an der Seitentür: Leitkegel mit Gummifüßen, Absperrschranken, Warnleuchten. Feuerlöscher, Verbandkasten und Augenspülung an der Wand, der Dieselkanister für das Aggregat am Boden.',
  spec: [['6 kg', 'ABC-Löscher'], ['6 Leitkegel', 'mit Gummifuß'], ['2 Schranken', 'rot/weiß'], ['Kanister', '20 l Diesel']], photos: ['20260923_131024.jpg', '20260923_131003.jpg']},
 {n: '24', id: 'awning', group: 'aussen', title: 'Heckmarkise – Regendach', place: 'Heck · Kassette über den Hecktüren', mass: 38, x: -2.525, z: 0, mount: 2.10,
  desc: 'Klappt über dem Heck auf und deckt Rampe, Mischpumpe, Trommelabgang und Hochdruckplatz ab – wichtig bei Regen, weil Mörtel, Strom und Elektronik trocken bleiben müssen. Gelenkarme, zwei Stützen mit Füßen, Kurbel.',
  spec: [['3,0 × 2,6 m', 'Ausfall × Breite'], ['2 Stützen', 'mit Fußplatte'], ['Kurbel', 'Getriebe'], ['Tuch', 'wasserdicht']], photos: [], toggles: ['awning']},
 {n: '25', id: 'access', group: 'aussen', title: 'Seitentür mit Klapptritt', place: 'Rechts · Gehwegseite', mass: 14, x: 0.95, z: 1.09, mount: 0,
  desc: 'Einstieg auf der Gehwegseite mit zweistufigem Klapptritt aus Riffelblech und Haltegriff. Dahinter bleibt eine freie Standfläche zum Gang – so kommt man rein, ohne über die Rampe oder durch das Heck zu müssen.',
  spec: [['0,80 × 1,88 m', 'lichte Öffnung'], ['2 Stufen', 'Riffelblech'], ['Haltegriff', 'innen'], ['Türfeststeller', 'außen']], photos: [], toggles: ['side']},
 {n: '26', id: 'ramps', group: 'aussen', title: 'Klapprampen für die Mischpumpe', place: 'Innen an der rechten Hecktür', mass: 24, x: -2.53, z: 0.70, mount: 0,
  desc: 'Zwei Aluminium-Klapprampen hängen innen an der rechten Hecktür. Zum Rausstellen werden sie in die Heckschwelle eingehängt; die Mischpumpe rollt auf ihren Rädern hinunter.',
  spec: [['2 × 2,0 m', 'klappbar'], ['Tragkraft', 'je 400 kg'], ['Einhängung', 'Heckschwelle']], photos: [], toggles: ['ramps']},
 {n: '27', id: 'legs', group: 'aussen', title: 'Kurbelstützen hinten', place: 'Heck · unter dem Rahmen', mass: 14, x: -2.40, z: 0, mount: -0.3,
  desc: 'Zwei Kurbelstützen stützen das Heck, bevor jemand einsteigt oder die Mischpumpe über die Rampen rollt – der Anhänger kippt nicht und federt nicht nach.',
  spec: [['2 Stützen', 'klappbar'], ['Tragkraft', 'je 500 kg']], photos: [], toggles: ['legs']},
 {n: '28', id: 'ext', group: 'energie', title: 'Außenanschlüsse & Arbeitslicht', place: 'Außen · Stirnwand, linke Seite, Heck', mass: 10, x: -0.33, z: -1.09, mount: 0.35,
  desc: 'CEE-32-A-Einspeisung vorn links für Baustrom, C-Füllkupplung für die Tanks an der linken Seite, Außensteckdose und LED-Arbeitsscheinwerfer am Heck unter der Markise, Rundumkennleuchte auf dem Dach.',
  spec: [['CEE 32 A', 'Einspeisung'], ['C-Kupplung', 'Wasser füllen'], ['LED', 'Arbeitsscheinwerfer'], ['Rundumleuchte', 'gelb']], photos: []},
];

export const routes = [
 {kind: 'water', label: 'Wasser', color: '#2a97d8'},
 {kind: 'air', label: 'Druckluft / Vakuum', color: '#e2a023'},
 {kind: 'mortar', label: 'Mörtel', color: '#e0743a'},
 {kind: 'power', label: 'Strom', color: '#8f64e6'},
];

// Operating states the 3D model can show (toggle ids of trailer3d.js).
export const operations = [
 {id: 'doors', label: 'Hecktüren', toggles: ['doorL', 'doorR']},
 {id: 'side', label: 'Seitentür', toggles: ['side']},
 {id: 'awning', label: 'Markise', toggles: ['awning']},
 {id: 'legs', label: 'Stützen', toggles: ['legs']},
 {id: 'mixer', label: 'Mischpumpe raus', toggles: ['mixer']},
 {id: 'drawers', label: 'Schubladen', toggles: ['drawer', 'bench-1', 'bench-2', 'bench-3', 'box-1', 'box-2', 'box-3']},
 {id: 'gen', label: 'Technikfach', toggles: ['genDoor', 'genFlap']},
];
export const toggleLabels = {
 doorL: 'Hecktür links', doorR: 'Hecktür rechts', side: 'Seitentür mit Klapptritt', awning: 'Heckmarkise', legs: 'Kurbelstützen', ramps: 'Klapprampen', mixer: 'Mischpumpe rausrollen',
 drawer: 'Schwerlastauszug', 'bench-1': 'Schublade 1', 'bench-2': 'Schublade 2', 'bench-3': 'Schublade 3', 'box-1': 'Eurokiste 1', 'box-2': 'Eurokiste 2', 'box-3': 'Eurokiste 3',
 genDoor: 'Lüftungstür Technikfach', genFlap: 'Serviceklappe Aggregat',
};

// Working sequence at the trailer; `state` = operating state shown in 3D.
export const steps = [
 {n: 1, title: 'Abstellen & sichern', text: 'Anhänger waagerecht abstellen, Unterlegkeile setzen, Kurbelstützen am Heck herunterkurbeln, Rundumkennleuchte an. Leitkegel und Schranken von der Seitentür aus aufstellen.', uses: ['legs', 'safety', 'access'], state: {legs: 1, side: 1}},
 {n: 2, title: 'Arbeitsstellung', text: 'Hecktüren 270° an die Seitenwände schwenken und einhaken, Heckmarkise aufklappen und abstützen. Arbeitsscheinwerfer an.', uses: ['awning', 'ext'], state: {legs: 1, side: 1, doorL: 1, doorR: 1, awning: 1}},
 {n: 3, title: 'Energie & Druckluft', text: 'Serviceklappe auf, Aggregat starten oder Baustrom über CEE 32 A einspeisen. Kompressor und Vakuumpumpe einschalten, Druck an der Wartungseinheit prüfen.', uses: ['gen', 'elec', 'comp', 'vac', 'air'], state: {legs: 1, side: 1, doorL: 1, doorR: 1, awning: 1, genFlap: 1, genDoor: 1}},
 {n: 4, title: 'Schalung rüsten', text: 'Schwerlastauszug öffnen, Schalung entnehmen oder Wechselschild vom Sattel montieren. Anschlussblase vom Deckenhalter, Opferschlauch und Messingwinkel aus der Werkbank.', uses: ['drawer', 'saddle', 'bladders', 'bench'], state: {legs: 1, side: 1, doorL: 1, doorR: 1, awning: 1, drawer: 1, 'bench-1': 1}},
 {n: 5, title: 'Leitungen anschließen', text: 'Leitungsbündel von der Trommel zur Schalung am Roboter abrollen, an Verteiler und Drehdurchführung anschließen, Druckkreise einstellen.', uses: ['drum', 'manifold', 'hoses'], state: {legs: 1, side: 1, doorL: 1, doorR: 1, awning: 1}},
 {n: 6, title: 'Mischpumpe rausstellen', text: 'Klapprampen von der rechten Hecktür nehmen und in die Heckschwelle einhängen, Mischpumpe unter die Markise rollen. Strom (CEE 16 A) und Wasser von der Zapfstelle anschließen.', uses: ['ramps', 'mixer', 'awning'], state: {legs: 1, side: 1, doorL: 1, doorR: 1, awning: 1, mixer: 1}},
 {n: 7, title: 'Anmischen & verpressen', text: 'Sack aus dem Regal, im Kübel mit dosiertem Tankwasser und Rührwerk anmischen, in den Trichter. Die Schneckenpumpe verpresst über Opferschlauch und Messingwinkel, bis der Drucksensor meldet.', uses: ['bags', 'paddle', 'mixer', 'tankL', 'tankR', 'pumpset'], state: {legs: 1, side: 1, doorL: 1, doorR: 1, awning: 1, mixer: 1}},
 {n: 8, title: 'Reinigen', text: 'Trichter, Stator und Kübel sofort mit dem Hochdruckreiniger reinigen, Schlauch von der Haspel. Waschwasser in den Absetzbehälter.', uses: ['hd', 'reel', 'settle', 'pumpset'], state: {legs: 1, side: 1, doorL: 1, doorR: 1, awning: 1, mixer: 1}},
 {n: 9, title: 'Verladen & Fahrstellung', text: 'Mischpumpe zurückrollen und festzurren, Rampen an die Tür, Schubladen verriegeln, Markise einklappen, Stützen hoch, Türen zu. Waschwasser ablassen und Stützlast prüfen.', uses: ['mixer', 'ramps', 'awning', 'legs'], state: {}},
];

export const sources = {
 s1: ['Stützlast-Planungswert 140 kg (z. B. VW Crafter 50, ADAC Autokatalog)', 'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/vw-nutzfahrzeuge/crafter/ii/329281/'],
 s3: ['§ 44 StVZO Stützeinrichtung und Stützlast', 'https://www.gesetze-im-internet.de/stvzo_2012/__44.html'],
 s10: ['Putzmeister S 5 EV (Schneckenpumpe, 25 bar, 60 m)', 'https://www.pumpendoktor.com/produkt/putzmeister-s-5-ev/'],
 s12: ['Humbaur Kofferanhänger 3,5 t', 'https://www.humbaur.com/de/anhaenger/tandemanhaenger/modelluebersicht/'],
 s13: ['Packer-Luftdruck 0,5–2 bar (Kurzliner)', 'https://nordrohr.de/sanieren/kurzliner-sanierung.php'],
 s14: ['Neutralisation von Baustellenabwässern (pH 10–14)', 'https://blog.messer.at/neutralisation-baustellenabwasser'],
 s15: ['Ehle-HD: Sanierungsanhänger (Referenz Ausbau)', 'https://ehle-hd.com/sanierung-anhaenger/'],
};
