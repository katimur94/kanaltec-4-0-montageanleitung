# DSS-Flex – detaillierte Druckausgabe

Die erste Ausgabe war durch ein grobes Voxelraster und pauschale Verdickung zu stark vereinfacht. Die zusätzliche Detailausgabe übernimmt stattdessen die Originalflächen: Radprofile, Schrauben, Gelenke, Stangen, Öffnungen und Schläuche bleiben getrennt erkennbar. Gekrümmte Schalen verwenden im Export ein durchgängiges Dreiecksnetz; die Web-Animation bleibt im bisherigen Modus.

## Ergebnisse

Lokal unter `Druckmodelle/DSS-Flex-Detail-2026/`: drei Motive in jeweils zehn Größen (80–600 mm), STL und farbige 3MF. Die 400-/600-mm-Ausgaben enthalten zusätzlich 39 Teilstücke, jeweils in beiden Formaten. Insgesamt 138 Druckdateien. `Druckmodelle-ansehen.html` öffnet die Vorschau; die Modellwahl wechselt zwischen drei eigenständigen Offline-Seiten. Screenshots, Druckanleitung und Prüfdaten liegen daneben. ZIPs werden unter `Druckmodelle/Detail-*.zip` sowie `Druckmodelle/DSS-Flex-Detail-Alle-10-Druckvarianten.zip` erzeugt.

Die umfangreichen Detaildateien bleiben lokale Produktionsausgaben und sind in Git ignoriert. Code, diese Anleitung und die bestehenden Präsentations-Bundles werden versioniert. Keine automatische Veröffentlichung auf Pages.

## Prüfung und Grenzen

Alle 138 STL-/3MF-Dateien erneut eingelesen und geprüft: STL geschlossene, konsistent orientierte Flächen mit positivem Volumen; 3MF im strengen Modus der offiziellen lib3mf-Bibliothek ohne Warnungen und mit gültigen Materialvolumen. Segmentabmessungen höchstens etwa 165 mm. Drei tatsächliche Detailmodelle visuell im Browser geprüft, einschließlich Seitenansicht; keine Browserfehler. Der Exporttest prüft geschlossene Schalennetze nach Schweißung gleicher Punkte, Originalabmessungen und Bauteilanzahl. Die bisherigen Modellprüfungen für alle fünf DN und der Web-Build sind ebenfalls erfolgreich.

Die Detail-STLs enthalten mehrere geschlossene Teilkörper, teils mit mikroskopischen Abständen. Im Slicer als gemeinsames Modell übernehmen und Volumenvereinigung sowie Lagenvorschau prüfen. STL-Kontaktpunkte wurden um höchstens 0,0005 mm je Koordinate numerisch getrennt; die 3MF bewahrt ihre indizierten Materialkörper. Einzelne offene Hüllen wurden lokal fein geschlossen. Keine pauschale Verstärkung oder globale Rasterung.

Die zehn Größen sind keine zehn getesteten Maschinenprofile. Bei 200 mm Gesamtlänge des Roboters wird ein originales 2-mm-Blech nur ungefähr 0,17 mm dick. In kleinen Größen können selbst im Harzdruck Details unterhalb der Druckauflösung liegen. Für FDM größere Größen oder gezielte Wandverstärkung verwenden. Die robustere Erstfassung bleibt unter `Druckmodelle/DSS-Flex-2026/` erhalten. Kein physischer Probedruck durchgeführt; Herstellermaße und Funktionsfähigkeit werden nicht zugesichert.

## Neu erzeugen

Mit Node.js und Python 3.12, im Repository:

```text
npm ci
npm test
npm run test:print
npm run build
python -m pip install --target work/qa/print-runtime -r work/print-requirements.txt
node work/export-print-source.mjs --detail
python work/build-detail-models.py
python work/check-print-models.py --detail
node work/build-print-preview.mjs --detail
python work/package-print-models.py --detail
```

Zwischenstände werden ausschließlich unter `work/qa/` abgelegt. Nach Geometrieänderungen die zugehörigen Zwischenstände neu aufbauen. Aktuelle Quellen unter `src/` sind maßgeblich; die Screenshots sind keine Ersatzgeometrie.
