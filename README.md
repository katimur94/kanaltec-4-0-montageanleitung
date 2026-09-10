# Kanaltec 4.0 – Montageanleitung 3D

Interaktive 3D-Montageanleitung für das Schalungssystem **Kanaltec 4.0** der DiTom GmbH Kanaltechnik (Ahlen).
Baugrößen DN300, DN350-400, DN450-500, DN550-600 und DN650-700 mit Stücklisten, Explosionsansicht,
Bild-Text-Tutorial und einer Demo des Sanierungsablaufs im Rohr (Fräsroboter fährt die Schalung an,
Bumper presst an, Injektionsblase fährt in den Anschluss, Mörtel, Aushärten, Rückfahrt).

- **Live-Seite:** https://katimur94.github.io/kanaltec-4-0-montageanleitung/
- **Repo:** https://github.com/katimur94/kanaltec-4-0-montageanleitung (Branch `main`, GitHub Pages aus `main` / `/`)
- Läuft im Browser auf PC und Handy, keine Installation. Alles steckt in **einer** HTML-Datei (Three.js eingebettet, offlinefähig).

## Dateien

| Datei / Ordner | Zweck |
|---|---|
| `index.html` | Die Webseite (GitHub Pages). Identisch mit der Datei darunter. |
| `Kanaltec_4_0_Montageanleitung_3D.html` | Dieselbe Seite zum Herunterladen / Weitergeben (ca. 1,9 MB). |
| `3D-Quelldateien/part1_head.html` | Layout: CSS, Bedienfeld, Hilfe-Overlay, Dokumentation unten (Funktionsprinzip, Baugruppen, Tabellen). Enthält den Platzhalter `<!--TUTORIAL-->`. |
| `3D-Quelldateien/part2_data.js` | **Daten**: Baugrößen (`DN_CFG`), Stücklisten je Baugröße und Baugruppe (aus den Zeichnungen 03/2026), Teilebeschreibungen (`DESC`), Montageschritte (`stepsFor`). Hier Texte ändern. |
| `3D-Quelldateien/part3_app.js` | **3D**: Geometrie aller Teile (prozedural, Three.js), Explosion, Auswahl, Beschriftung, Rohr-Demo mit Roboter, Bedienung. |
| `3D-Quelldateien/three.min.js`, `OrbitControls.js` | Three.js r128 (MIT), wird beim Bauen eingebettet. |
| `3D-Quelldateien/build.mjs` | Baut aus den Teilen die fertige HTML-Datei (schreibt nach `../Kanaltec_4_0_Montageanleitung_3D.html`). |
| `3D-Quelldateien/tutorial.html` | Generiertes Bild-Text-Tutorial (25 Schrittbilder als WebP eingebettet). Wird an `<!--TUTORIAL-->` eingesetzt. |
| `3D-Quelldateien/tutorial_gen.js` | Erzeugt `tutorial.html` aus `captures/*.webp` und den Schrittdaten. |
| `3D-Quelldateien/captures/` | Die Schrittbilder (aus dem 3D-Modell aufgenommen, Baugröße DN450-500). |
| `3D-Quelldateien/serve.js` | Kleiner Vorschau-Server (Port 8765) mit `POST /save` zum Speichern von Bildern aus dem Browser. |
| `3D-Quelldateien/capture_tutorial.js` | Browser-Snippet, das die 25 Schrittbilder aufnimmt (siehe unten). |
| `ENTSCHEIDUNGEN.md` | Was warum so gebaut wurde: Maße aus den Zeichnungen, Aufbau der Teile, Ablauf der Demo, offene Punkte. |

Die Original-PDF (`Montageanleitung_Kanaltec_4_0.pdf`) liegt **nicht** im Repo (`.gitignore`), weil das Repo öffentlich ist.

## Weiterarbeiten von einem anderen Rechner

Voraussetzung: Node.js (getestet mit v24) und Git.

```bash
git clone https://github.com/katimur94/kanaltec-4-0-montageanleitung.git
cd kanaltec-4-0-montageanleitung/3D-Quelldateien
# ... part1_head.html / part2_data.js / part3_app.js ändern ...
node build.mjs            # erzeugt ../Kanaltec_4_0_Montageanleitung_3D.html und ../index.html
cd ..
git add -A
git commit -m "Was geändert wurde"
git push
```

GitHub Pages baut nach jedem Push automatisch (ca. 1 Minute). Danach ist die Änderung unter der Live-Adresse sichtbar
(im Browser ggf. mit Strg+F5 neu laden).

### Lokal ansehen

Die HTML-Datei kann direkt per Doppelklick geöffnet werden. Für die Bildaufnahme des Tutorials braucht es den Server:

```bash
node 3D-Quelldateien/serve.js .        # aus dem Repo-Ordner, dann http://localhost:8765/
```

### Debug-Zugriff im Browser

Seite mit `#debug` aufrufen (z. B. `http://localhost:8765/#debug`). Dann gibt es `window.__kt40` mit
`state`, `camera`, `controls`, `fitView(reset)`, `applyExplode()`, `applyVisibility()`, `renderer`.

## Tutorial-Bilder neu aufnehmen

Nur nötig, wenn sich die Geometrie oder die Montageschritte ändern.

1. `node 3D-Quelldateien/serve.js .` starten, `http://localhost:8765/#debug` im Browser öffnen (Chrome/Edge).
2. Inhalt von `3D-Quelldateien/capture_tutorial.js` in die Browser-Konsole einfügen und ausführen.
   Es speichert `captures/<baugruppe>_<nr>.webp` neben `serve.js`.
3. `cd 3D-Quelldateien && node tutorial_gen.js && node build.mjs`

## Bedienung der Seite (Kurzfassung)

1. Rohrgröße wählen, 2. Baugruppe wählen, 3. „Zusammengebaut“ / „Auseinandergezogen“ oder Regler.
Oben im Bild: „Drehen“ / „Verschieben“ umschalten, „⟲“ setzt die Ansicht zurück, „? Hilfe“ zeigt die Kurzanleitung.
„Weitere Einstellungen“: Rohr und Stutzen einblenden (Demo mit Roboter), Positionsnummern, automatisch drehen,
Schild durchsichtig, andere Baugruppen blass, Vollbild. Teil antippen (im Modell oder in der Stückliste) zeigt Name und Erklärung.

Stand der Zeichnungen: 03/2026. Alle Maße im Modell sind proportional aus den Ansichten der Zeichnungen übernommen
(die PDF enthält keine Bemaßung); Details siehe `ENTSCHEIDUNGEN.md`.
