import {stages} from './data.js';

export const repairCases=[
 {id:'open',label:'Anschluss offen halten'},
 {id:'closure',label:'Stillgelegten Anschluss verschließen'},
 {id:'pipe',label:'Loch im Hauptrohr verschließen'}
];

// User-described additional configuration; original drawing/BOM stays intact.
export function stagesForRepair(kind){
 if(kind==='open')return stages;
 const pipe=kind==='pipe',place=pipe?'Rohrloch':'stillgelegten Anschluss';
 const texts=[
  [pipe?'Schadstelle vorbereiten':'Anschluss freifräsen',pipe?'Der Fräser bearbeitet die Rohrinnenwand entlang der ovalen Reparaturkontur um das Loch im Hauptrohr.':'Der Fräser entfernt Einragungen und Wurzeln und bereitet die ovale Reparaturkontur um den stillgelegten Anschluss vor.'],
  ['Zur geschlossenen Schalung wechseln','Der Roboter zieht den Fräser zurück und übernimmt außerhalb der Schadstelle die geschlossene Schalung. Die Welle bleibt ohne Anschlussblase.'],
  ['Positionieren',`Mit vakuumiertem, flachem Bumper fährt der Roboter die geschlossene Schalung unter ${pipe?'das Rohrloch':'den stillgelegten Anschluss'}. Das äußere Schild besitzt keine mittlere Blasenöffnung. Mörtelzulauf und Drucksensor bleiben erhalten.`],
  ['Schild anpressen',`An der Schadstelle bläst sich der Bumper auf und drückt das geschlossene Schalungsschild von innen gegen das Hauptrohr. Es deckt ${pipe?'das Rohrloch':'den stillgelegten Anschluss'} ab. Eintretendes Wasser wird zunächst vom Schild abgefangen; beim vollständigen Anpressen endet der Ablauf in den Kanal.`],
  ['Dichtblase aufblasen','Die separate Dichtblase zwischen Träger und Schild wird aufgeblasen und dichtet die Schalung ab. Halterung, Welle, Bumper und Roboter bleiben wie in der bestehenden Ausführung.'],
  ['Abdichtung halten','Bumper und Dichtblase halten das geschlossene Schild angepresst. Die Welle bleibt ohne Anschlussblase stehen. Die Schalungsfläche formt den geschlossenen Verschluss an der Rohrinnenwand.'],
  ['Mörtel injizieren',`Der Opferschlauch führt den Mörtel über den 45°-Messingwinkel und den separaten Zulauf hinter das Schild. Mörtel verfüllt ${pipe?'das Rohrloch':'den stillgelegten Anschluss'}, den Hohlraum und das umgebende Erdreich. Die Mitte wird vollständig geschlossen. Bei vollständiger Füllung leuchtet die rote Meldelampe am Drucksensor.`],
  ['Aushärten lassen','Bumper und Dichtblase halten das Schild angepresst, bis der Mörtel die erforderliche Festigkeit erreicht. Die Animationsdauer entspricht keiner realen Aushärtezeit.'],
  ['Ausschalen & kontrollieren',`Nach dem Aushärten entspannt sich die Dichtblase. Der Bumper wird vakuumiert, die Schalung senkt sich und fährt weg. Am ${place} bleibt eine geschlossene, der Rohrinnenwand folgende Mörtelfläche zurück. Opferschlauch wechseln; Messingwinkel reinigen und wiederverwenden.`]
 ];
 return texts.map(([title,text],i)=>({...stages[i],title,text,focus:title,caption:'Geschlossene Schalung nach Nutzerangabe. Schadensform, Hohlraum, Fülltiefe und Verpressung sind schematische Darstellungen.'}));
}
