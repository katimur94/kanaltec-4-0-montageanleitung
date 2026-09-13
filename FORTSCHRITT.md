# Fortschrittschronik

Diese Chronik ergänzt Git. Sie erklärt die fachlichen Korrekturen und den Prüfstand so, dass die Weiterarbeit ohne den ursprünglichen Chat möglich ist. Neue abgeschlossene Änderungen oben ergänzen; ursprüngliche Einträge nicht als aktuelle Bestätigung ungeprüfter späterer Exporte verstehen.

## 13.09.2026 – Werbevideos mit Logo und Telegram-Skill

Sechs neue Werbeexporte: 16:9, 9:16 und 4:5, jeweils mit Sprecher/Musik und ausschließlich Musik. Animierter Logo-Auftakt und Abschluss, aktuelles 3D-Modell mit Roboter, Highlights und Überblendungen, keine Untertitel. Formate und Produktions-/Prüfstand sind in [WERBEVIDEOS.md](WERBEVIDEOS.md) dokumentiert. Persönlichen Telegram-Skill separat installiert; Zugriff verschlüsselt im Benutzerprofil gespeichert und für den Versand eingesetzt.

## 13.09.2026 – Freie Modellfläche und separates 3D-Vollbild

**Freie 3D-Fläche:** Kameraansichten, Schnitt & Sicht, Durchblick, automatisches Drehen und Drehen/Verschieben liegen oberhalb der Modellfläche. Beschriftungen sind beim Öffnen ausgeschaltet; **Beschriftung** oder **B** blendet sie ein und aus. Bauteilinformationen und Hinweise erscheinen unterhalb der Fläche. **3D-Vollbild** oder **F** zeigt ausschließlich die 3D-Fläche, **Esc** beendet es. **Umschalt + F** schaltet das Vollbild der gesamten Seite um. Drehen, Zoomen, Leertaste und Animations-Pfeiltasten funktionieren auch im 3D-Vollbild.

**Prüfung:** Browserprüfung von normaler Ansicht, reinem 3D-Vollbild, Beschriftung per B und Rückkehr per Esc. Keine Buttons innerhalb von `#viewport`. Bestehende Geometrie-, Wasser-, Blasen-, Roboter- und Kameraprüfungen für alle fünf DN bestanden (`npm test`). Modellgeometrie unverändert; Standalone-Dateien neu gebaut.

## 13.09.2026 – Wasserführung an der ankommenden Schalung und Projektübergabe

**Problem:** Die Infiltration folgte festen Falllinien. Eine darunterfahrende, noch abgesenkte Schalung wurde nicht berücksichtigt; Wasser war unterhalb des Schildes zu sehen, obwohl es aufgefangen werden müsste.

**Geändert:** Einzelne Wasserstrahlen werden beim Unterfahren abhängig von Schildposition, Breite und gerundeten Enden aufgefangen. Sie folgen außen der gewölbten Fläche zu beiden Seiten und tropfen hinter der jeweiligen Kante ab. Anpressen reduziert und beendet diesen Ablauf. Die Einspeisung hinter der Schalung bleibt bis zur Verfüllung sichtbar. Tropfen enden am Rohrboden, Spritzringe liegen zur lokalen Rohrfläche ausgerichtet. Sichtbare Rohr-/Schalungsschnitte beeinflussen den physischen Wasserweg nicht.

**Prüfung:** Geometrieprüfung über DN 300, 400, 500, 600 und 700 einschließlich Wasserrohr-Vertices oberhalb der Schildhülle, teilweisem Unterfahren, beidseitigen Abläufen, Anpressen, Rücksprung und Schnittoptionen. Bisherige Blasen-, Gussflächen-, Roboter- und Kameraprüfungen bleiben Bestandteil von `npm test`. Zusätzlich visuelle Browserprüfung der Ankunft und des Anpressens. Wasser bleibt eine Verfahrensvisualisierung, keine CFD-Berechnung.

**Übergabe:** `PROJEKTSTAND.md`, diese Chronik und `AGENTS.md` hinzugefügt, README und Bedienungsanleitung ergänzt. Dokumentation beschreibt Quellen, Modellannahmen, Dateirollen, Ablauf, offene Zuordnungen und portables Bauen/Veröffentlichen. Keine Kontozugänge oder lokalen `.env`-Dateien für den Web-Build erforderlich.

## 13.09.2026 – CutterCam, Werkzeugachsen und Wellenkamera

Commit: [`fbde6d2`](https://github.com/katimur94/kanaltec-4-0-montageanleitung/commit/fbde6d2).

- CutterCam anhand der IBAK-Ansichten neu geformt: quer liegende Gehäuseteile, gerundeter Optikkopf, rechteckiges Sichtfenster, vier LEDs, abgestufter Metallbügel, Anschlüsse und Reinigungsleitung.
- Zusätzliches serielles Ellbogengelenk entfernt. Durchgehende seitliche Schwingen, parallele untere Führungen und vordere Werkzeugachse umgesetzt. Die Schalung bleibt an der bestehenden Klappvorrichtung gekoppelt.
- Ansichten **Werkzeugarm** und **Wellenkamera** ergänzt. Die Wellenkamera folgt der Welle bei Fahrt, Hub und rückwärtigen Zeitsprüngen; freies Verschieben bleibt erhalten. Funktioniert auch ohne Roboter. DN-Wechsel behält die gewählte Ansicht bei.
- Fünf DN-Varianten, feste Gliedlängen, Parallelität, Rohrfreigang, Kamera-Nachführung und Browserbedienung geprüft. Auf Pages veröffentlicht.

## 13.09.2026 – Detaillierter MicroGator und DN-Zusätze

Commit: [`3047794`](https://github.com/katimur94/kanaltec-4-0-montageanleitung/commit/3047794).

- Fahrgestell, Drehmodul, hinteres Kabelgelenk, Leitungen, Radnaben, Felgen, Ventile und Profile detailliert.
- DN 300: braune PUR-Profilräder; mittlere Varianten: Zusatzfamilie DN 350–600; größte Variante: Zusatzfamilie DN 600–800. Geometrien und Spuren ändern sich mit der Auswahl.
- Radlage aus rotierender Reifenhülle bestimmt und Rohrfreigang geprüft. Herstellerangaben und fotografische Näherungen in `ROBOTER-QUELLEN.md` getrennt dokumentiert.
- Die anschließend erneut beanstandeten Kamera-/Armformen wurden im folgenden Commit `fbde6d2` ersetzt.

## 13.09.2026 – Roboter ein-/ausblenden

Commit: [`7c37111`](https://github.com/katimur94/kanaltec-4-0-montageanleitung/commit/7c37111).

- Sichtbarer Schalter **Roboter anzeigen**, mit **Schnitt & Sicht** synchronisiert. Gilt in Modell, Explosion und Animation; Einstellung wird lokal gespeichert.

## 13.09.2026 – MicroGator an der Klappvorrichtung

Commit: [`c46a5d0`](https://github.com/katimur94/kanaltec-4-0-montageanleitung/commit/c46a5d0).

- Erster fahrbarer Roboter mit vier Rädern, Leitungen und Werkzeugaufnahme anstelle eines zusätzlichen Fräskopfs ergänzt. Radbewegung mit der Fahrt gekoppelt. Form seitdem mehrfach verbessert; dieser erste Entwurf ist nicht mehr maßgeblich.

## 13.09.2026 – Fertige Reparaturfläche und Abdrücke

Commit: [`a58a34c`](https://github.com/katimur94/kanaltec-4-0-montageanleitung/commit/a58a34c).

- Störende kegelförmige Verengung am Anschluss entfernt, Durchgang gerade gehalten.
- Sensor- und Injektionsabdrücke als Vertiefungen in der geschlossenen Gussfläche ergänzt. Innenfläche folgt der Rohrkrümmung.
- Steinzeug und feinporiger Mörtel differenziert; weiße Rohrdarstellung ersetzt. **Kanalblick** zur Kontrolle.

## 13.09.2026 – Großer Ausbruch, Infiltration und Mörtelfüllung

Commit: [`f4ebec8`](https://github.com/katimur94/kanaltec-4-0-montageanleitung/commit/f4ebec8).

- Unregelmäßiger Rohrbruch mit beschädigtem Anschluss, umgebendem Hohlraum und Wassereintritt ergänzt.
- Mörtel zunächst im Zuführschlauch sichtbar, anschließend vom Zulauf aus fortschreitende Füllung. Mit Verfüllung versiegt die Infiltration.
- Der damals noch feste Wasserfall wurde im neuesten Eintrag durch die schildabhängige Führung ersetzt.

## 13.09.2026 – Aktuelle Präsentation ersetzt die ältere Demo

Commit: [`3cd54b3`](https://github.com/katimur94/kanaltec-4-0-montageanleitung/commit/3cd54b3).

Dieser Import bündelte viele davor im Chat erarbeitete lokale Korrekturen; für diese gibt es keine separaten Repository-Commits:

- Fünf PDF-Baugrößen mit vier Baugruppen und Stücklisten; Gesamt-, Einzel- und Explosionsansichten.
- Wellenorientierung, D-Profil, blinde Gewindeöffnung und deren Ausrichtung unter der Schildöffnung korrigiert. Verkürztes freies Wellenende und berührungsfreie Schlauchführung.
- Blase direkt eingeschraubt; starrer runder Fuß nahezu bündig zur Wellenfläche. Drei volle Wicklungen, ca. 3 mm je vakuumierter Wandlage; vollständiges Abwickeln vor Inflation und umgekehrter Ablauf beim Ausschalen.
- Runde starre Spitze, separater roter Drucksensor und Mörtelzufuhr von unten ergänzt. Kein Kolbenmodell für die Blasenbewegung.
- Flacher vakuumierter Bumper während Fahrt, Anpressen an der Anschlussposition, anschließend separate Dichtblase zwischen Schild und Träger, dann Anschlussblase.
- Dreilagiger Schildaufbau, große gemeinsame Ovalfreistellung der inneren beiden Lagen und drei einzelne Öffnungen nur im äußeren Schild. Injektionsanschluss am Schild befestigt.
- Schildaufnahmen und Schraubenbohrungen nach PDF nachgebessert. Seitliche M6×50-Rohrfixierung mit Gegenmutter im Grundkörper.
- Klappvorrichtung nach PDF S. 10 als Gelenk an der L-Ecke mit Federn überarbeitet. Unbelegte M6×90-Platzierung entfernt; Pos. 20/21 bewusst unplatziert dokumentiert.
- Vollständige Schalung als Ausgangsansicht, unabhängige Schnitte/Ausblendungen, Drehen/Verschieben/Zoom, Geschwindigkeitswahl und Pfeiltastenschritte.
- Darkmode, bereitgestelltes DiTom-Logo mit entferntem Hintergrund, eingebettete PDF/Zeichnungen/Fotos und portable HTML-Ausgabe.
- GitHub Pages auf die aktuelle Präsentation umgestellt; alter HTML-Einstieg leitet weiter.

## 09.–10.09.2026 – Frühere Repository-Demo

Commits `25f7e4e` bis `9ec1c81` betreffen den vorherigen Entwurf. Sie bleiben historisch erhalten, sind aber keine Anleitung für die heutige Geometrie. Maßgeblich sind die aktuellen Quellen unter `src/`, nicht ältere Capture-Skripte oder frühere Modellfassungen.

## Ergänzung bei der nächsten Bearbeitung

Pro abgeschlossener Änderung Datum, konkretes Problem, resultierendes Verhalten, betroffene Bereiche, tatsächlich ausgeführte Prüfungen und verbleibende Grenzen festhalten. Bei separat erzeugten Videos/Bildern den zugrunde liegenden Modell-Commit und den Speicherort nennen. Veröffentlichungs- und Prüfergebnisse nicht vorwegnehmen.
