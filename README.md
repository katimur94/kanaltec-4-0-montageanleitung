# Kanaltec 4.0 – interaktive 3D-Präsentation

[Präsentation öffnen](https://katimur94.github.io/kanaltec-4-0-montageanleitung/)

Das Schalungssystem der DiTom GmbH Kanaltechnik als interaktives 3D-Modell mit fünf Baugrößen, Explosionsansicht und animiertem Sanierungsablauf. Enthalten sind die überarbeiteten Bauteile, die vollständig abwickelbare Anschlussblase mit drei Wicklungen, getrennte Bumper- und Dichtblasenphasen, einstellbare Geschwindigkeit, Pfeiltastensteuerung, frei wählbare Schnitte, Verschieben der Ansicht und Hell-/Dunkelmodus mit transparentem Logo.

Die Nahansicht **Schadstelle** zeigt einen großen Ausbruch mit Bruchkanten und Infiltration. Der Injektionsmörtel fließt im transparenten Schlauch zum Zulauf, füllt die Schadstelle fortschreitend und stoppt den Wassereintritt. Der Anschluss bleibt innen offen. Das Schadensbild ist ein Beispiel zur Erklärung des Verfahrens.

Im **Kanalblick** sind nach dem Ausschalen die eingeprägten Drucksensor- und Injektionsmarken sichtbar. Die Gussfläche schließt bündig mit der Rohrinnenwand ab; der Durchgang hat keine kegelförmige Verengung. Braunes Steinzeug und grauer Mörtel besitzen unterschiedliche Oberflächen.

## Einfach verwenden

Der ergänzte **IBAK-Roboter** trägt die Klappvorrichtung an seiner Werkzeugaufnahme anstelle des Fräskopfs. Vier profilierte Räder, Frontkamera, Hubarm und Leitungen sind nach Nutzerfotos und Herstelleransichten rekonstruiert. Der Arm folgt beim Anpressen der Schalung, während der Fahrwagen seine Höhe hält; die Räder drehen sich während der Fahrt. **Roboter** öffnet eine Nahansicht, **Schnitt & Sicht** erlaubt das Ausblenden. Unbemaßte Roboterdetails und Radzusätze sind angenähert und keine zusätzlichen Positionen der DiTom-Stückliste.

Die Live-Seite im Browser öffnen. Für eine Offline-Präsentation `Kanaltec-4.0-Praesentation.html` herunterladen und per Doppelklick öffnen. Modell, Logo, Fotos und Originalzeichnungen einschließlich PDF sind eingebettet; externe Quellen und YouTube-Videos benötigen Internet. Die HTML-Datei ist etwa 20 MB groß.

Die vollständige Bedienung steht in [START-HIER.md](START-HIER.md). Unbemaßte Geometrien und Teile des Funktionsablaufs sind angenähert; die Präsentation erläutert das System und ist keine bemaßte Fertigungszeichnung.

## Weiterentwickeln

Voraussetzung: Node.js ab Version 20.

```sh
npm ci
npm test
npm run build
```

`src/` enthält Modell, Animation, Oberfläche und eingebettete Quellen. `work/build.mjs` erzeugt zwei inhaltsgleiche, eigenständige Dateien: `index.html` für Pages und `Kanaltec-4.0-Praesentation.html` für die Offline-Nutzung. `work/check-model.mjs` prüft die Baugruppen und die Wickelmechanik für alle fünf Baugrößen; `work/check-robot.mjs` zusätzlich die Roboterkupplung, den Hubarm, die Radbewegung und den Radfreigang.

## Veröffentlichung

GitHub Pages veröffentlicht den Stammordner des Branches `main` über HTTPS. Nach Änderungen an den Quellen zuerst Tests und Build ausführen und beide erzeugten HTML-Dateien mit committen. Ein Push auf `main` aktualisiert die Live-Seite automatisch. `.nojekyll` sorgt für die direkte Veröffentlichung der statischen Dateien.

Die frühere Version bleibt in der Git-Historie erhalten. Der alte HTML-Dateiname leitet zur aktuellen Startseite weiter.

Three.js steht unter der MIT-Lizenz; siehe [THIRD-PARTY-LICENSES.txt](THIRD-PARTY-LICENSES.txt). Herstellerlogo und technische Vorlagen gehören ihren jeweiligen Rechteinhabern.
