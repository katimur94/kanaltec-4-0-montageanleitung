# Entscheidungen und Wissensstand

Damit jeder (auch eine KI) von hier aus weiterarbeiten kann. Stand 10.09.2026.

## Quelle

Montageanleitung Kanaltec 4.0 (DiTom GmbH Kanaltechnik, Dokumentstand 03/2026), 27 Seiten, nur Zeichnungen:
je Baugröße (DN300, DN350-400, DN450-500, DN550-600, DN650-700) eine Gesamtansicht (Seitenansicht + Isometrie)
und Explosionszeichnungen mit Stückliste für Halteeinheit, Oberwagen (= Zentraleinheit), Unterteil und Schalung.
Die PDF enthält **keine Maße**. Alle Stücklisten sind 1:1 in `part2_data.js` übernommen (inkl. Anzugsmomente „--- 12N“).

Öffentliche Infos zu Kanaltec 4.0 (Hermes Technologie, bau.bi): Hauptkanal DN 200–600 (optional 700–800),
Anschlüsse DN 80–200, ERGELIT-Kanaltec-Mörtel, Drucksensor, 30–45 min je Stelle, Umbau des Roboters ca. 20 min, 70 m Leitung.

## Achsen und Aufbau im 3D-Modell (`part3_app.js`, Funktion `build`)

- Y nach oben, Z = Rohrachse. **+Z** = Seite von Einbauhilfe, Stützrad und Motor (so wie die Isometrien der Zeichnungen),
  **−Z** = Zentralrohr, Klappvorrichtung, Werkzeugaufnahme (Roboterseite). Standardblick von (−X, +Y, +Z).
- Zentralrohrachse ≈ y=0. Schildoberkante bei 231 + 35·i mm über der Zentralrohrachse (i = 0..4 für die fünf Baugrößen),
  Unterkante Stützplatte bei −166 − 50·i. Rohrmitte des Hauptkanals liegt daher **nicht** auf der Zentralrohrachse
  (DN300: 81 mm darüber, DN700: 22 mm).
- Maßstab aus den Seitenansichten (Bezug: Bumper Ø200, Laufscheibe Ø78 – beide in allen Größen gleich):
  Schild 548 lang für alle Größen, Bogen 175° (DN300) bis 157° (DN700), Eckradius 33–51, Öffnung ca. 124 quer × 104 längs,
  Bumper Ø200×120 (ausgefahren), Grundkörper 46×39×120 mit Längsbohrung und Klemmschlitz, Zentralrohr sichtbar 256,
  Klappvorrichtung 67 lang (Block 36, Gelenkplatte 11, Werkzeugaufnahme 20), Motor Ø48×122, Gehäuse 67er Würfel,
  Stützplatte 218×10, Laufscheibe 66 mm über dem Plattenende.
- Distanzstücke (Unterteil) je Baugröße: keine / 50 / 100 / 100+50 / 100+50+50, Schrauben M8×16 / M8×65 / M8×120 (+M8×50).

### Teile, die nach Rückfragen von Timur korrigiert wurden

- **Räder** sind flache Laufscheiben Ø70 („RAD DN70“), keine Reifen mit Nabe.
- **Radhalterung** = Gabel mit Langloch, Achse = M8×40 + Mutter; Distanzstück darunter bündig am Plattenende.
- **Klappvorrichtung**: Teil 3 sitzt oben auf Teil 1 und trägt das Gelenkauge; Teil 2 hängt am Zylinderstift 6×60 und trägt
  die Werkzeugaufnahme; Federpaket (M6×90, 2 Federn, Sicherungsmutter) unten.
- **Blasenwelle**: Vierkantstab mit Mittelbohrung, Bund und abgesetztem Zapfen. **Die Injektionsblase ist um die Welle gewickelt**;
  der Motor dreht die Welle, mit Luftzugabe wird die Blase durch die Öffnung im Schild in den Anschluss ausgefahren.
- **Befestigung Blaseneinheit 2** = Bolzen mit Querbohrungen, **Befestigung 1** = Klemmblöcke; Gehäuse hängt zwischen den Bolzen,
  die 4 langen M6-Schrauben (M6×45 bei DN300, sonst M6×65) laufen quer durch die Bolzen ins Gehäuse.
- **Aufnahme Schalungsschild** (2×) = Rohrhülse, die auf die Tragstange (Schildhalterung Teil 3) geschoben wird, mit je einem
  Halbring-Bügel an beiden Enden; Bügelenden liegen mit Laschen am Schalungsträger an. **Pos 2** (4×) = die unteren Laschen/Füße.
  8× M5×10 = je Lasche eine, 2× M5×30 = je Hülse eine (durch die Hülse in die Stange).
- Tragstangenhöhe so, dass die Hülsen 35 mm unter dem Träger liegen; Blasenwelle 45 mm und Gehäuse 60 mm unter der Stangenachse.

## Ablauf der Rohr-Demo („Rohr und Stutzen einblenden“, 25-s-Schleife, `updateDemo` in `part3_app.js`)

0–4,5 s Roboter fährt die Schalung von hinten unter den Anschluss (Bumper entlüftet, Schild hat Abstand zur Rohrwand;
Schadstelle am Anschluss als brauner Ring) · 4,5–7 Bumper aufblasen, Schild wird angepresst · 7–10 Welle dreht, Blase fährt aus
· 10–14 Mörtel verpressen · 14–16,5 Aushärten (Ring wird hellgrau) · 16,5–19 Blase einfahren · 19–21,5 Bumper entlüften
· 21,5–25 Rückfahrt, der sanierte Anschluss (grauer Mörtelkragen) bleibt.

Der Roboter ist schematisch (Rohrkörper, blaue Kappen, Kamerakopf mit LEDs, 4 Räder auf Schwingarmen, Kabel) und trägt das
DiTom-Logo als Canvas-Textur. Timur wollte ausdrücklich **kein** IBAK-Logo und **keine** Untertitel in der Demo.

## Bedienkonzept

Für Leute ohne Technikaffinität: nummerierte Schritte 1–3 im Bedienfeld, große Tasten, Hilfe-Overlay beim ersten Start
(Finger-/Maus-Version), Umschalter Drehen/Verschieben oben im Bild, alles Weitere eingeklappt. Auf dem Handy bleibt die
3D-Ansicht oben fest (sticky), Positionsnummern sind dort standardmäßig aus. Der frühere Schritt-für-Schritt-Modus im
Bedienfeld wurde auf Wunsch entfernt; stattdessen gibt es unten das Bild-Text-Tutorial (25 Bilder, DN450-500).

## Offene Punkte / Ideen

- Echte Maße (STEP-Dateien oder bemaßte Zeichnungen) würden das Modell exakt machen; bisher alles proportional.
- Hub des Bumpers beim Anfahren ist geschätzt (max. 30 mm, bei DN300 nur ca. 15 mm möglich).
- Roboter könnte nach einem Foto des echten Geräts nachmodelliert werden.
- Tutorial-Bilder gibt es nur für DN450-500; für andere Größen `capture_tutorial.js` mit anderer DN ausführen.
