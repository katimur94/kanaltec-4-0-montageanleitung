# DSS-Flex – 3D-Druckmodelle

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
| 01-Mini-80-Resin | Roboter-und-Schalung | 80.0 × 15.39 × 16.24 | 0.05 | Gesamtmodell |
| 01-Mini-80-Resin | Nur-Schalung | 80.0 × 38.43 × 40.74 | 0.05 | Gesamtmodell |
| 01-Mini-80-Resin | Rohrsanierung-Schnitt | 80.0 × 19.63 × 40.57 | 0.05 | Gesamtmodell |
| 02-Klein-100-Resin | Roboter-und-Schalung | 100.0 × 19.24 × 20.3 | 0.05 | Gesamtmodell |
| 02-Klein-100-Resin | Nur-Schalung | 100.0 × 48.04 × 50.93 | 0.05 | Gesamtmodell |
| 02-Klein-100-Resin | Rohrsanierung-Schnitt | 100.0 × 24.54 × 50.72 | 0.05 | Gesamtmodell |
| 03-Kompakt-120-FDM | Roboter-und-Schalung | 120.0 × 23.21 × 24.46 | 0.12 | Gesamtmodell |
| 03-Kompakt-120-FDM | Nur-Schalung | 120.0 × 57.76 × 61.22 | 0.12 | Gesamtmodell |
| 03-Kompakt-120-FDM | Rohrsanierung-Schnitt | 120.0 × 29.54 × 60.91 | 0.12 | Gesamtmodell |
| 04-Kompakt-150-FDM | Roboter-und-Schalung | 150.0 × 29.01 × 30.57 | 0.16 | Gesamtmodell |
| 04-Kompakt-150-FDM | Nur-Schalung | 150.0 × 72.19 × 76.53 | 0.16 | Gesamtmodell |
| 04-Kompakt-150-FDM | Rohrsanierung-Schnitt | 150.0 × 36.93 × 76.14 | 0.16 | Gesamtmodell |
| 05-Standard-180-FDM | Roboter-und-Schalung | 180.0 × 34.81 × 36.69 | 0.16 | Gesamtmodell |
| 05-Standard-180-FDM | Nur-Schalung | 180.0 × 86.63 × 91.84 | 0.16 | Gesamtmodell |
| 05-Standard-180-FDM | Rohrsanierung-Schnitt | 180.0 × 44.32 × 91.37 | 0.16 | Gesamtmodell |
| 06-Standard-200-FDM | Roboter-und-Schalung | 200.0 × 38.68 × 40.77 | 0.2 | Gesamtmodell |
| 06-Standard-200-FDM | Nur-Schalung | 200.0 × 96.26 × 102.04 | 0.2 | Gesamtmodell |
| 06-Standard-200-FDM | Rohrsanierung-Schnitt | 200.0 × 49.24 × 101.52 | 0.2 | Gesamtmodell |
| 07-Gross-250-FDM | Roboter-und-Schalung | 250.0 × 48.34 × 50.96 | 0.2 | Gesamtmodell |
| 07-Gross-250-FDM | Nur-Schalung | 250.0 × 120.32 × 127.55 | 0.2 | Gesamtmodell |
| 07-Gross-250-FDM | Rohrsanierung-Schnitt | 250.0 × 61.55 × 126.9 | 0.2 | Gesamtmodell |
| 08-Gross-300-FDM | Roboter-und-Schalung | 300.0 × 58.01 × 61.15 | 0.2 | Gesamtmodell |
| 08-Gross-300-FDM | Nur-Schalung | 300.0 × 144.39 × 153.06 | 0.2 | Gesamtmodell |
| 08-Gross-300-FDM | Rohrsanierung-Schnitt | 300.0 × 73.86 × 152.28 | 0.2 | Gesamtmodell |
| 09-XL-400-segmentiert | Roboter-und-Schalung | 400.0 × 77.35 × 81.53 | 0.24 | 3 |
| 09-XL-400-segmentiert | Nur-Schalung | 400.0 × 192.52 × 204.08 | 0.24 | 12 |
| 09-XL-400-segmentiert | Rohrsanierung-Schnitt | 400.0 × 98.48 × 203.04 | 0.24 | 4 |
| 10-XXL-600-segmentiert | Roboter-und-Schalung | 600.0 × 116.03 × 122.3 | 0.28 | 4 |
| 10-XXL-600-segmentiert | Nur-Schalung | 600.0 × 288.78 × 306.12 | 0.28 | 16 |
| 10-XXL-600-segmentiert | Rohrsanierung-Schnitt | 600.0 × 147.72 × 304.55 | 0.28 | 6 |

## Reproduktion

Im Repository: `npm ci`, `node work/export-print-source.mjs`, dann `python -m pip install --target work/qa/print-runtime -r work/print-requirements.txt`. `python work/build-print-models.py`, `python work/check-print-models.py`, `node work/build-print-preview.mjs`, `python work/package-print-models.py`. Zwischenstände liegen im ignorierten `work/qa/`. Die voxelbasierte Aufbereitung erzeugt sichtbare Stufen an Rundungen; feine Details sind druckgerecht vereinfacht. Quellen: [3MF Core](https://3mf.io/spec/core-v1-3-0/), [Trimesh Voxel-Dokumentation](https://trimesh.org/trimesh.voxel.html). Herstellervorlagen und Rekonstruktionsgrenzen siehe Projektunterlagen.
