# Werbung: DSS-Flex Verfahren

## Realistische Neufassung – 23.09.2026 (lokal, nicht veröffentlicht)

Gleiche Schnittfolge und Tonspuren (78 Sekunden), aber filmische Darstellung: YouTube in 3840 × 2160, Reels/Shorts 1080 × 1920 und Facebook-Feed 1080 × 1350, jeweils supersampelt. `work/film-studio.js` ergänzt Kamera-Scheinwerfer am CutterCam-Kopf, Kanal-Inspektionslicht, gedämpfte Umgebungsreflexion, Tiefendunst, GTAO-Umgebungsverdeckung, Bloom, Farbgrading, Vignette, Filmkorn, Bewegungsunschärfe (Unterbilder) beim Fräsen, Wasser mit Lichtbrechung, Sohlwasser und Staub im Lampenlicht. Neuer Auftakt als Kanalkamera-Fahrt auf den Wurzelzopf, danach Nahaufnahme von Wurzeln und Infiltration.

1. `npm ci`; Playwright in `work/qa/runtime` (`npm install playwright` dort) oder `KANALTEC_QA_RUNTIME` setzen; Edge und FFmpeg im Pfad (oder `KANALTEC_FFMPEG`).
2. `node work/build-film.mjs`
3. `node work/render-film.mjs --qa --scale=.25 --ss=2` für Kontrollbilder, danach `node work/render-film.mjs` (optional `--formats=YouTube`).
4. Tonspuren der freigegebenen Fassungen nach `work/qa/audio/sprecher.m4a` und `musik.m4a` kopieren (Stream-Copy aus den bisherigen MP4).
5. `python work/finish-real-films.py <Ausgabeordner>` vertont, decodiert vollständig, prüft Format/Dauer/Pegel und erzeugt Kontaktbögen.


## Zusätzliche Verschlussfilme – 20.09.2026

Modellbasis `426422f` mit anschließender Nutzerkorrektur zur kompakteren, leicht ovalen Verschlussfläche (260 × 230 mm in der Rohrabwicklung): **Loch verschließen** und **Anschluss verschließen**, jeweils 60 Sekunden, 1920 × 1080, H.264 mit 30 Bildern/s, AAC Stereo und Faststart. Beide verwenden DN 400, geschlossene Schalung und Welle ohne Anschlussblase, großen Hohlraum mit Infiltration und den direkten Ablauf ohne Fräsen. Der Einfüllstutzen steht mittig unter der Schadstelle; der stillgelegte Anschluss wird nahezu vollständig gefüllt. Nur eigene Instrumentalmusik, keine Sprachaufnahme. Marken- und Titelkarten, keine Untertitel oder Website-Oberfläche.

Reproduktion mit den oben beschriebenen Node-/Python-Laufzeiten und Umgebungsvariablen:

1. `node work/build-closure-film.mjs`
2. `node work/render-closure-film.mjs --qa` für beide Kontaktbildserien; Kameras vor dem Filmrendern prüfen.
3. `node work/render-closure-film.mjs` (optional nur `--pipe` oder `--closure`).
4. `python work/closure-music.py` erzeugt die eigene 60-Sekunden-Musik, ohne Sprachdienst oder Sprachdateien.
5. `python work/finish-closure-films.py` vertont beide Filme, decodiert sie vollständig, prüft Format, Audiopeak und Versandgröße, extrahiert Kontaktbögen und ergänzt die bestehende Videogalerie. Videolinks tragen eine inhaltsabhängige Versionskennung, damit Browser nach Korrekturen die neue MP4 laden. Bei einer erneuten Gesamtproduktion diesen Schritt nach `finish-film.py` ausführen.
6. `node work/verify-closure-films.mjs` prüft Abspielen und Zeitsprung; mit `--live` nach der Pages-Veröffentlichung wiederholen.

Ausgaben: `Videos/DSS-Flex-Verfahren-2026/DiTom-DSS-Flex-{Loch|Anschluss}-verschliessen-Musik.mp4`. Zwischenstände, Kontaktbögen und Prüfberichte liegen ausschließlich in `work/qa/closure-video/`. Die realen Verfahrenszeiten werden für den Film verkürzt; Anschlussfüllquote, Schadensform und Bodenverpressung sind schematische Darstellungsparameter.

## Sechs Filme mit offenem Anschluss – runde Konturkorrektur

**Produktion 20.09.2026, anschließend korrigiert:** Ursprüngliche Modellbasis `6683ef0`, nun mit der Nutzerkorrektur zur runderen Fläche bei offener Anschlussvariante (240 × 210 mm in der Rohrabwicklung). Hochformat-Kanalblick mit erweitertem Bildwinkel, sodass die gesamte Kontur sichtbar bleibt. Schnittfolge und Sprechertext verwenden die neun aktuellen Phasen ohne Nutfräsen, die oberhalb des Schildes verkürzte Blase, den Mörtelanstieg bis zur halben oberen Blasenhöhe, die kleine ovale Reparaturfläche und die Schlauchführung vom Messingwinkel hinunter zum Roboterarm. Der Abschluss zeigt das detaillierte Erdreich und den verfüllten Hohlraum.

Produktname auf beiden Titelkarten: **DSS-Flex Verfahren**. Sprecher-Auftakt: „DSS-Flex Verfahren.“; Abschluss: „DiTom. Das DSS-Flex Verfahren.“ MP4-Dateipräfix: `DiTom-DSS-Flex-Verfahren-`. Firmenlogo und Kontaktadresse bleiben DiTom.

Gezeigt wird die DN-400-Variante. Das Filmstudio verwendet direkt `src/model.js` und dessen aktuelles Schadens-, Fräs- und Sanierungsmodell. Es rendert nur den Prozess; keine Explosionsansicht, Website-Oberfläche oder Untertitel. Das originale Logo wird aus `src/logo-transparent.png` übernommen und ohne zusätzliche Hintergrundfläche oben links gezeichnet. Film, Logo-Karten und lokale Galerie verwenden den Darkmode.

## Reproduzieren

1. `npm ci` für die vorhandenen Three.js-/esbuild-Abhängigkeiten.
2. Python 3.10+; `python -m pip install --target work/qa/video-runtime edge-tts imageio-ffmpeg numpy pillow`.
3. `python work/film-audio.py --speech --compose` erzeugt die deutsche synthetische Stimme und eine deterministische eigene Instrumentalmusik. `work/film-script.json` enthält Text und Zeitfenster. Die Sprachsynthese benötigt Netzwerkzugriff.
4. `node work/build-film.mjs` bündelt das lokale Studio unter `work/qa/video/studio`.
5. `KANALTEC_QA_RUNTIME` auf ein Node-Paketverzeichnis mit Playwright setzen, `KANALTEC_FFMPEG` auf die ausführbare FFmpeg-Datei. Microsoft Edge muss installiert sein.
6. `node work/render-film.mjs --qa` erzeugt Einzelbilder zum Kameraabgleich, einschließlich der vollständig geschlossenen Verpressung bei Sekunde 61. `node work/render-film.mjs` rendert drei H.264-Filme bildgenau mit 30 Bildern/s. Der interne HTTP-Server bindet nur an die lokale Loopback-Adresse und endet automatisch.
7. `python work/finish-film.py` erzeugt sechs vertonte MP4-Dateien, decodiert jede vollständig, kontrolliert Video-/Audioeigenschaften und extrahiert Kontaktbögen aus den fertigen Filmen. Die beiden zusätzlichen Verschlussfilme bleiben in der Galerie erhalten; die neuen Filmdateien erhalten inhaltsabhängige Versionskennungen in den Links.
8. `node work/verify-films.mjs` prüft alle sechs Fassungen mit Zeitsprung auf Sekunde 69 und Wiedergabe; nach Veröffentlichung mit `--live` wiederholen.

Ausgaben: `Videos/DSS-Flex-Verfahren-2026/`, einschließlich lokaler Galerie, Sprechertext, Audio-/Render-/Prüfberichten. Produktionszwischenstände und Werkzeugpakete liegen unter dem ignorierten `work/qa/`. Die aktuellen finalen MP4-Dateien, Galerie und Vorschaubilder werden auf Nutzerauftrag auf GitHub Pages veröffentlicht. Produktionszwischenstände, Laufzeitpakete und Prüfberichte bleiben ausgeschlossen.

## Schnittfolge (78 Sekunden)

| Sekunden | Inhalt |
|---|---|
| 0–3 | Logo-Auftakt |
| 3–8 | Einragender Anschluss, Wurzeln, Infiltration |
| 8–14 | Einragung und Wurzeln zurückfräsen |
| 14–20 | Ovale Fräsfläche; weitere Ansicht zeigt Drehmodul hinter CutterCam und Hubarme |
| 20–21 | Nahansicht der ovalen Fräsfläche |
| 21–25 | Fräser zurückziehen und zur Schalung wechseln |
| 25–29 | Schalung positionieren |
| 29–33 | Schild anpressen |
| 33–37 | Dichtblase aufblasen |
| 37–45 | Anschlussblase abwickeln und aufblasen |
| 45–49 | Opferschlauch und 45°-Messingwinkel, Beginn der Injektion |
| 49–60 | Ausbruch und Bodenhohlraum verfüllen, Mörtel bis zur halben Blasenhöhe oberhalb des Schildes |
| 60–62 | Aushärten (schematische Dauer) |
| 62–68 | Ausschalen und zurückfahren |
| 68–70 | Freier, bündig sanierter Anschluss vom Hauptkanal aus |
| 70–73 | Verpresskörper im Erdreich im Schnitt, ohne Roboter im Vordergrund |
| 73–78 | Logo-Abschluss |

Die Kameras werden für 16:9, 9:16 und 4:5 eigenständig gesetzt. Unter der Stimme wird die Musik abgesenkt. Die Modellmaße und der Vorgang bleiben eine schematische Darstellung, keine Fertigungsdaten oder reale Aushärtezeit.

`src/ground-grout.js` zeigt die räumliche Ausdehnung des Mörtels außerhalb des Rohrs mit unregelmäßiger Kontur und sichtbaren Bodenkörnern. Körperhöhe, seitliche Reichweite und Bodenstruktur sind illustrative Darstellungsparameter, keine zugesicherte Eindringtiefe oder Berechnung eines realen Bodens. Schnittflächen ändern nur die Sichtbarkeit. Die Sprecherpassage ab 45,3 Sekunden beschreibt die aktuelle Zufuhr und Füllhöhe; der Sprachcache erkennt Textänderungen und erzeugt nur betroffene Passagen neu.
