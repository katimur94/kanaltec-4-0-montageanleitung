# Werbevideos mit Logo – 13.09.2026

Neu produzierte Werbung auf Basis des 3D-Modellstands `71dce19`, einschließlich MicroGator, überarbeiteter Wicklung, seitlichem Wasserablauf und bündiger Reparaturfläche.

## Ausgaben

Je Format gibt es eine Fassung mit deutscher synthetischer Sprecherstimme plus Musik und eine zweite Fassung ausschließlich mit Musik:

| Dateistamm | Auflösung | Länge |
|---|---|---|
| YouTube | 1920 × 1080, 16:9 | ca. 58,2 Sekunden |
| Reels-Shorts | 1080 × 1920, 9:16 | ca. 58,2 Sekunden |
| Facebook-Feed | 1080 × 1350, 4:5 | ca. 58,2 Sekunden |

Dateiendungen: `-Sprecher.mp4` und `-Musik.mp4`. H.264, 30 Bilder/s, AAC Stereo, Faststart. Keine Untertitel und keine Website-Bedienelemente. Produktname und kurzer Markentext erscheinen ausschließlich auf den Logo-Karten. Während der 3D-Aufnahmen steht das transparente DiTom-Logo dezent in einer Ecke.

## Gestaltung und Quellen

- Logo-Auftakt und Abschluss mit Bewegung, Lichtschein und Produktname.
- Gesamtmodell mit Roboter, Nahansicht des Werkzeugarms, Explosion, Ankunft, Anpressen/Abdichten, Abwicklung, Mörtelinjektion und Kanalblick.
- Bewegte Kameras, dezente farbige Hervorhebungen und kurze Überblendungen mit einzelnen Lichtwischen.
- Neuer programmatisch erzeugter Instrumentaltrack mit Akkorden, Arpeggio, Bass, Schlagzeug, Logo-Klang und Übergangseffekten. Keine fremde kommerzielle Musikaufnahme verwendet.
- Vorhandene deutsche synthetische Werbesprecher-Aufnahmen wiederverwendet, passend zur neuen Schnittfolge angeordnet. Keine unnötigen Maßangaben im Werbetext.

## Prüfung und Weiterarbeit

Alle sechs Exporte auf Auflösung, Dauer, H.264/AAC, fehlende Untertitelspuren und Dateigröße unter 49 MB geprüft. Kontaktbögen aller zehn Szenen in allen drei Formaten visuell kontrolliert. Browseraufnahme ohne Konsolenfehler. Die variable Aufnahme lag im Mittel bei ca. 27 Bildern/s, die MP4-Ausgabe hat konstant 30 Bilder/s. Der Ton der Sprecherfassung wurde auf Spitzen geprüft; kein digitales Clipping festgestellt.

Die Videodateien und Produktionsmaterialien liegen im ursprünglichen Projektordner unter `Videos/Werbung-Logo-2026/`, einschließlich `projects.json`, Prüfberichten und Kontaktbögen. Die lokalen Skripte heißen `work/prepare-commercial.py`, `work/build-commercial.mjs`, `work/commercial-studio.js`, `work/commercial-server.py`, `work/commercial-finish.py` und `work/commercial-qa.py`.

Diese lokalen Videomaterialien sind **nicht Teil des portablen Web-Repositories**. Für erneuten Filmschnitt auf einem anderen Computer den Produktionsordner und die genannten Skripte mitnehmen. Der Bildexport verwendet das jeweils aktuelle `src/model.js` und dessen Module; ältere gebaute Filmstudios nicht ungeprüft wiederverwenden. Python mit NumPy/Pillow, FFmpeg/FFprobe und die Three.js/esbuild-Laufzeit werden zusätzlich zum Browser benötigt. Die Website selbst bleibt unabhängig davon vollständig aus diesem Repository baubar.

Ein persönlicher Skill `telegram-delivery` wurde separat im Benutzerprofil eingerichtet und für die angeforderte Lieferung verwendet. Zugangsdaten sind Windows-DPAPI-verschlüsselt außerhalb von Skill und Repository gespeichert. Auf einem anderen Computer müssen sie im dortigen Benutzerkonto neu konfiguriert werden. Skill-Installation erteilt keine pauschale Versandberechtigung für neue Projekte.
