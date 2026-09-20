import json,zipfile,sys
from pathlib import Path
DETAIL='--detail' in sys.argv
ROOT=Path('Druckmodelle/DSS-Flex-Detail-2026' if DETAIL else 'Druckmodelle/DSS-Flex-2026');reports=json.loads((ROOT/'Pruefbericht.json').read_text(encoding='utf-8'))
intro='''# DSS-Flex – 3D-Druckmodelle

Drei feste Anschauungsmodelle aus der aktuellen DN-400-Animation, Modellbasis d0ac2f3: Roboter mit Schalungssystem, Schalungssystem allein und Rohrsanierung im seitlichen Schnitt. Die dritte Szene zeigt die ausgefahrene Blase und die vollständig eingebrachte Mörtelfüllung vor dem Ausschalen. Zehn Größen beziehen sich jeweils auf die gesamte Standflächenlänge; die drei Motive haben daher unterschiedliche Maßstäbe.

## Dateien und Farben

- `*-einfarbig.stl`: ein geschlossener, verbundener Druckkörper, Maße in Millimetern. Für FDM oder passend vorbereiteten Harzdruck; auch zum späteren Bemalen.
- `*-farbig.3mf`: standardisierte 3MF-Datei in Millimetern mit getrennten Materialvolumen und Farben. Zusammen als EIN mehrteiliges Objekt importieren; Positionen beibehalten. Keine bereits konfigurierte Maschinen- oder AMS-Datei. Der Slicer muss Materialvolumen unterstützen; Filamente selbst zuweisen. Für Einfarbdruck die STL verwenden.
- Farben: dunkle Standfläche, hellgraues Metall, schwarzer Roboter/Gummi, gelbe Schalung/Messing, blaue Leitungen, braunes Steinzeug, braunes Erdreich, türkise Blase und hellgrauer Mörtel. Je Motiv werden nur vorhandene Bereiche verwendet. Bei vier Filamenten Standfläche/Gummi zusammenfassen, Blase/Leitungen zusammenfassen und ähnliche Grau-/Brauntöne nach Wunsch zuordnen. 3MF ersetzt keine Mehrfarbfähigkeit des Druckers. Die Harzvarianten sind primär für einfarbigen Druck und Bemalung vorgesehen.
- `Druckmodelle-ansehen.html`: offline drehbare Vorschau aus den tatsächlich exportierten 3MF-Dateien; zeigt die verstärkte FDM-Ausführung. Die kleine Harzausführung hat feinere Verstärkungen.

## Druckvorbereitung

Die Dateien sind feste Schaustücke, keine funktionsfähigen Maschinenbauteile und kein Montagebausatz. Räder, Blasen und Mechanik sind fixiert. Feine Schläuche, Blechlagen und Verbindungen wurden verstärkt; sehr kleine Ornamente können zusammenwachsen oder entfallen. Gemeinsame Standflächen und kleine dauerhafte Stützen verbinden die Baugruppen. Die digitalen Flächen wurden zu geschlossenen Körpern vereinigt; der Rohrschnitt ist echte Geometrie.

FDM: Standfläche flach auf das Bett. Zusätzliche Slicer-Stützen für Schildunterseite, Arme, Leitungen und Rohrdach aktivieren; Baumstützen prüfen und Kontaktflächen kontrollieren. Als Ausgangspunkt 0,4-mm-Düse, 3 Wände, 15–20 % Füllung und die unten angegebene Schichthöhe. Die sehr kleinen Details bleiben empfindlich; nicht unter die gelieferte Größe skalieren. Werte sind Startpunkte, keine getesteten Druckerprofile. Bei kleinen Düsen oder anderen Materialien passend anpassen.

Harz: 8-/10-cm-Dateien als Kandidaten für kleine Anschauungsmodelle. Im Slicer geneigt orientieren und selbst abstützen. Keine hohle Harzkammer erzeugt; bei nachträglichem Aushöhlen Drainage planen. Abmessungen einschließlich gewählter Orientierung, Raft und Stützen gegen den tatsächlichen Bauraum prüfen. Die nominelle Modelllänge allein garantiert keinen Bauraum-Fit.

## Große Modelle zusammensetzen

40- und 60-cm-Versionen enthalten jeweils zusätzlich einen Ordner `*-Segmente`. Jedes Segment ist höchstens etwa 170 mm groß und kann einzeln mit seiner flachen Unterseite auf dem Bett gedruckt werden. Dateinamen `X..-Y..-Z..` sind die Gitterposition im Gesamtmodell: X entlang des Rohrs, Y quer, Z von unten nach oben. `Segmentplan.json` enthält die ursprünglichen Lagen und die Verschiebung beim Auflegen.

Trocken zusammenlegen und die Schnittflächen anschließend mit einem zum Druckmaterial passenden Kleber verbinden. Es sind plane Klebeflächen ohne Passstifte; eine ebene Unterlage hilft beim Ausrichten. Stützen in jedem Segment separat prüfen. Vollmodelle bleiben zusätzlich für ausreichend große Drucker enthalten. Bei einem Bauraum unter 180 mm pro Achse die tatsächlichen Segmentmaße und den Platz für Brim/Stützen prüfen.

## Prüfung und Grenzen

Alle STL-Dateien wurden erneut eingelesen und auf geschlossene Flächen, konsistente Orientierung, positives Volumen, endliche Koordinaten und positive Auflagehöhe geprüft. Alle 3MF-Dateien werden mit der offiziellen lib3mf-Bibliothek streng eingelesen und ihre Materialvolumen auf Manifold-Eigenschaften geprüft; Details in `Dateipruefung.json`. Die Gesamt-STLs sind zusammenhängend. Ein Segment kann mehrere Teilinseln enthalten; dafür Slicer-Stützen verwenden und beim Kleben die Gitterlage beibehalten. Die Vorschau wurde visuell geprüft. Es wurde kein physischer Probedruck durchgeführt und kein konkreter Drucker kalibriert. Slicer-Lagenvorschau vor dem Druck kontrollieren.

## Größenübersicht

| Variante | Motiv | Länge × Breite × Höhe (mm) | Schicht-Ausgangspunkt (mm) | Segmente |
|---|---|---|---|---|
'''
for r in sorted(reports,key=lambda r:(r['variant'],r['model'])):
 intro+=f"| {r['variant']} | {r['model'][3:]} | {' × '.join(map(str,r['dimensions_mm']))} | {r['layer_suggestion_mm']} | {len(r['segments']) or 'Gesamtmodell'} |\n"
intro+='''
## Reproduktion

Im Repository: `npm ci`, `node work/export-print-source.mjs`, dann `python -m pip install --target work/qa/print-runtime -r work/print-requirements.txt`. `python work/build-print-models.py`, `python work/check-print-models.py`, `node work/build-print-preview.mjs`, `python work/package-print-models.py`. Zwischenstände liegen im ignorierten `work/qa/`. Die voxelbasierte Aufbereitung erzeugt sichtbare Stufen an Rundungen; feine Details sind druckgerecht vereinfacht. Quellen: [3MF Core](https://3mf.io/spec/core-v1-3-0/), [Trimesh Voxel-Dokumentation](https://trimesh.org/trimesh.voxel.html). Herstellervorlagen und Rekonstruktionsgrenzen siehe Projektunterlagen.
'''
if DETAIL:
 intro=intro.replace('# DSS-Flex – 3D-Druckmodelle','# DSS-Flex – detaillierte 3D-Druckmodelle')
 intro=intro.replace('ein geschlossener, verbundener Druckkörper','geschlossene Volumengeometrie')
 intro=intro.replace('Die Gesamt-STLs sind zusammenhängend.','Lokale Verbindungsstege koppeln die Bauteile; die Anzahl topologischer Komponenten steht im Pruefbericht.json.')
 intro=intro.replace('zeigt die verstärkte FDM-Ausführung. Die kleine Harzausführung hat feinere Verstärkungen.','zeigt die tatsächliche Detailgeometrie. Alle Größen verwenden dieselbe feine Geometrie.')
 intro=intro.replace('Feine Schläuche, Blechlagen und Verbindungen wurden verstärkt; sehr kleine Ornamente können zusammenwachsen oder entfallen.','Originale Schrauben, Bohrungen, Rohrhülsen und Rundungen sind weitgehend direkt übernommen. Nur einzelne ungültige Hüllen sind lokal fein rekonstruiert und geglättet; offene Schlauchenden sind geschlossen. Es gibt keine globale Voxelvergröberung oder pauschale Verdickung.')
 intro=intro.replace('Die sehr kleinen Details bleiben empfindlich; nicht unter die gelieferte Größe skalieren.','ACHTUNG: Diese Detailausgabe ist näher am Webmodell und bewusst nicht pauschal verdickt. Beim 200-mm-Robotermodell sind originale 2-mm-Bleche nur ungefähr 0,17 mm dick; bei 80 mm noch dünner. In kleinen Größen können diese Flächen und feine Gewinde/Federn im Slicer entfallen. Für FDM größere Ausgaben wählen, Düsenbreite und Mindestwandstärken prüfen und nötige lokale Verstärkungen vornehmen. Kleine Resin-Ausgaben sind ebenfalls keine garantierte Wiedergabe jedes Details. Die zehn Größenbezeichnungen sind Auswahlhilfen, keine Druckerfreigabe.')
 intro=intro.replace('python work/build-print-models.py','python work/build-detail-models.py').replace('node work/export-print-source.mjs','node work/export-print-source.mjs --detail').replace('python work/check-print-models.py','python work/check-print-models.py --detail').replace('node work/build-print-preview.mjs','node work/build-print-preview.mjs --detail').replace('python work/package-print-models.py','python work/package-print-models.py --detail')
 intro=intro.replace('Die voxelbasierte Aufbereitung erzeugt sichtbare Stufen an Rundungen; feine Details sind druckgerecht vereinfacht.','Die erste, gröber verstärkte Ausgabe bleibt separat unter DSS-Flex-2026 verfügbar.')
 intro=intro.replace('## Druckvorbereitung','## Detailausgabe und Grenzen\n\nAlle zehn Größen verwenden dieselbe feine Geometrie; die FDM-/Resin-Namen sind keine individuellen Verstärkungsprofile. Die Detail-STLs können mehrere geschlossene Teilkörper enthalten. Im Slicer als gemeinsames Modell übernehmen und die Volumenvereinigung sowie die Lagenvorschau prüfen. Punktgleiche Kontakte wurden im Mikrometerbereich numerisch bereinigt; die genaue STL-Korrektur steht im Prüfbericht. Die getrennten Vorschauseiten laden jeweils nur ein Modell, damit der Speicherbedarf begrenzt bleibt. Die umfangreichen Detaildateien werden lokal erzeugt und nicht automatisch mit GitHub Pages veröffentlicht.\n\n## Druckvorbereitung')
(ROOT/'DRUCKANLEITUNG.md').write_text(intro,encoding='utf-8')
for variant in sorted(set(r['variant'] for r in reports)):
 folder=ROOT/variant;rows=[r for r in reports if r['variant']==variant]
 (folder/'Segmentplan.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
 (folder/'HINWEISE.txt').write_text('DSS-Flex '+variant+'\n\nDrei Anschauungsmodelle, jeweils STL einfarbig und 3MF mit Materialbereichen.\nDie DRUCKANLEITUNG.md vor dem Drucken lesen. Kein fertiges Maschinenprofil.\n\n'+'\n'.join(r['model']+': '+str(r['dimensions_mm'])+' mm' for r in rows),encoding='utf-8')
 with zipfile.ZipFile(ROOT.parent/(('Detail-' if DETAIL else '')+variant+'.zip'),'w',zipfile.ZIP_DEFLATED,compresslevel=5) as z:
  z.write(ROOT/'DRUCKANLEITUNG.md','DRUCKANLEITUNG.md')
  for p in folder.rglob('*'):
   if p.is_file():z.write(p,variant+'/'+p.relative_to(folder).as_posix())
with zipfile.ZipFile(ROOT.parent/('DSS-Flex-Detail-Alle-10-Druckvarianten.zip' if DETAIL else 'DSS-Flex-Alle-10-Druckvarianten.zip'),'w',zipfile.ZIP_DEFLATED,compresslevel=5) as z:
 for p in ROOT.rglob('*'):
  if p.is_file():z.write(p,p.relative_to(ROOT).as_posix())
print('Ten individual ZIPs and complete print package created.')
