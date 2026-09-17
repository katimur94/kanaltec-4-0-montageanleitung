# Werbung: DSS-Flex Verfahren

Produktname auf beiden Titelkarten: **DSS-Flex Verfahren**. Sprecher-Auftakt: „DSS-Flex Verfahren.“; Abschluss: „DiTom. Das DSS-Flex Verfahren.“ MP4-Dateipräfix: `DiTom-DSS-Flex-Verfahren-`. Firmenlogo und Kontaktadresse bleiben DiTom.

Gezeigt wird die DN-400-Variante. Das Filmstudio verwendet direkt `src/model.js` und dessen aktuelles Schadens-, Fräs- und Sanierungsmodell. Es rendert nur den Prozess; keine Explosionsansicht, Website-Oberfläche oder Untertitel. Das originale Logo wird aus `src/logo-transparent.png` übernommen und ohne zusätzliche Hintergrundfläche oben links gezeichnet. Film, Logo-Karten und lokale Galerie verwenden den Darkmode.

## Reproduzieren

1. `npm ci` für die vorhandenen Three.js-/esbuild-Abhängigkeiten.
2. Python mit NumPy/Pillow; `edge-tts` und `imageio-ffmpeg` in `work/qa/video-runtime` installieren.
3. `python work/film-audio.py --speech --compose` erzeugt die deutsche synthetische Stimme und eine deterministische eigene Instrumentalmusik. `work/film-script.json` enthält Text und Zeitfenster. Die Sprachsynthese benötigt Netzwerkzugriff.
4. `node work/build-film.mjs` bündelt das lokale Studio unter `work/qa/video/studio`.
5. `KANALTEC_QA_RUNTIME` auf ein Node-Paketverzeichnis mit Playwright setzen, `KANALTEC_FFMPEG` auf die ausführbare FFmpeg-Datei. Microsoft Edge muss installiert sein.
6. `node work/render-film.mjs --qa` erzeugt Einzelbilder zum Kameraabgleich, einschließlich der vollständig geschlossenen Verpressung bei Sekunde 61. `node work/render-film.mjs` rendert drei H.264-Filme bildgenau mit 30 Bildern/s. Der interne HTTP-Server bindet nur an die lokale Loopback-Adresse und endet automatisch.
7. `python work/finish-film.py` erzeugt sechs vertonte MP4-Dateien, decodiert jede vollständig, kontrolliert Video-/Audioeigenschaften und extrahiert Kontaktbögen aus den fertigen Filmen.

Ausgaben: `Videos/DSS-Flex-Verfahren-2026/`, einschließlich lokaler Galerie, Sprechertext, Audio-/Render-/Prüfberichten. Produktionszwischenstände und Werkzeugpakete liegen unter dem ignorierten `work/qa/`. Die aktuellen finalen MP4-Dateien, Galerie und Vorschaubilder werden auf Nutzerauftrag auf GitHub Pages veröffentlicht. Produktionszwischenstände, Laufzeitpakete und Prüfberichte bleiben ausgeschlossen.

## Schnittfolge (78 Sekunden)

| Sekunden | Inhalt |
|---|---|
| 0–3 | Logo-Auftakt |
| 3–8 | Einragender Anschluss, Wurzeln, Infiltration |
| 8–14 | Einragung und Wurzeln zurückfräsen |
| 14–20 | Runde Fräsfläche; weitere Ansicht zeigt Drehmodul hinter CutterCam und Hubarme |
| 20–21 | Nahansicht der runden Fräsfläche |
| 21–29 | Wand vorbereiten und Nut fräsen |
| 29–32 | Fräser zurückziehen |
| 32–41 | Schalung positionieren, anpressen und abdichten |
| 41–49 | Anschlussblase abwickeln und aufblasen |
| 49–60 | Ausbruch, umgebendes Erdreich und Anschlusswand bis über die Nut verpressen |
| 60–62 | Aushärten (schematische Dauer) |
| 62–68 | Ausschalen und zurückfahren |
| 68–70 | Freier, bündig sanierter Anschluss vom Hauptkanal aus |
| 70–73 | Verpresskörper im Erdreich im Schnitt, ohne Roboter im Vordergrund |
| 73–78 | Logo-Abschluss |

Die Kameras werden für 16:9, 9:16 und 4:5 eigenständig gesetzt. Unter der Stimme wird die Musik abgesenkt. Die Modellmaße und der Vorgang bleiben eine schematische Darstellung, keine Fertigungsdaten oder reale Aushärtezeit.

`src/ground-grout.js` zeigt die räumliche Ausdehnung des Mörtels außerhalb des Rohrs mit unregelmäßiger Kontur und sichtbaren Bodenkörnern. Körperhöhe, seitliche Reichweite und Bodenstruktur sind illustrative Darstellungsparameter, keine zugesicherte Eindringtiefe oder Berechnung eines realen Bodens. Schnittflächen ändern nur die Sichtbarkeit. Die beiden Sprecherpassagen bei 49,3 und 68,3 Sekunden beschreiben die erweiterte Verpressung; der Sprachcache erkennt Textänderungen und erzeugt nur betroffene Passagen neu.
