# Fortschrittschronik

## 17.09.2026 – Veröffentlichung des vollständigen DSS-Flex-Stands vorbereitet

**Auftrag:** Aktuellen Stand in `katimur94/kanaltec-4-0-montageanleitung` pushen und GitHub Pages aktualisieren.

**Vorbereitung:** Das bestehende Repository am Commit `5e04cff` separat geklont und dessen Historie erhalten. Aktuelle Quellen, Dokumentation, Originalreferenz, sechs finale Videos samt Galerie und PowerPoint übernommen. Die Veröffentlichung umfasst ca. 350 MiB; größte Einzeldatei 63.522.071 Bytes. Aktuelle Medien ausdrücklich in `.gitignore` freigegeben, ältere Exporte und QA-/Laufzeitdateien ausgeschlossen. Fußzeile und Galerie verknüpfen 3D-Animation, Videos und PowerPoint. Der bisherige HTML-Dateiname wird beim Build als Weiterleitung erhalten.

**Prüfstand vor Push:** Im Klon `npm ci`, `npm test` für alle fünf DN und `npm run build` bestanden. Dateiprüfung ohne private Benutzerpfade oder erkannte Zugangsdatenmuster. Die vorhandenen PowerPoint- und Video-Freigaben bleiben gültig. Push und Live-Prüfung werden nach Abschluss separat dokumentiert.

## 17.09.2026 – PowerPoint mit Übergängen und eingebetteten Animationen

**Nutzerwunsch:** Das DSS-Flex Verfahren auch als PowerPoint mit Übergängen und Animationen bereitstellen.

**Umgesetzt:** Zehn Folien in 16:9, Darkmode und originales DiTom-Logo oben links. Native bearbeitbare Titel/Texte und Sprechernotizen. Sieben kurze stumme Prozessclips erklären Schaden, Fräsen, Nut, Schalung, Blase, Verpressung und Ergebnis. Eine weitere Folie enthält den vollständigen 78-Sekunden-Werbefilm mit Sprecher. Alle Medien fest eingebettet. Weiche Folienübergänge, automatische Texteinblendungen und automatischer Videostart. Folienwechsel erfolgt auf Eingabe. Ausgabe `Praesentationen/DSS-Flex-Verfahren.pptx`, 63.522.071 Bytes. Anleitung in `POWERPOINT.md`.

**Prüfung:** Paket-/Layout-/Schrift-/Importprüfung bestanden. Alle zehn finalen Folien mit Microsoft PowerPoint gerendert und einzeln visuell kontrolliert, kein Textüberlauf. In der PowerPoint-Bildschirmpräsentation auf allen acht Videofolien automatisch fortschreitende Wiedergabe gemessen. Übergangstyp 3849 und native Fade-Texteffekte auf allen Folien bestätigt. Keine Modelländerung, kein erneuter Web-Build notwendig. Keine Veröffentlichung und kein Telegram-Versand.

## 17.09.2026 – Umbenennung in DSS-Flex Verfahren

**Nutzerwunsch:** Das System künftig überall als **DSS-Flex Verfahren** bezeichnen und neue Videos bereitstellen.

**Umgesetzt:** Produktname in Seitentitel, Kopfzeile, Modellüberschrift, Fußzeile, Bildbeschreibungen und PNG-Downloadnamen geändert. Neue eigenständige Datei `DSS-Flex-Verfahren-Praesentation.html`, gemeinsam mit `index.html` aus den Quellen gebaut. Paketname und aktuelle Bedienungs-/Produktionsdokumentation angepasst. Externe Referenzen neutral als historische Quellen beschriftet; Originaldokumente, bestehende Quelladressen und historische Chronik bleiben erhalten. Firmenname und transparentes DiTom-Logo bleiben bestehen.

**Filmproduktion:** Beide Titelkarten tragen „DSS-Flex Verfahren“. Auftakt spricht „DSS-Flex Verfahren.“, Abschluss „DiTom. Das DSS-Flex Verfahren.“; beide Passagen neu synthetisiert und zeitlich geprüft. Alle drei Bildformate neu gerendert, 78 Sekunden/30 Bilder pro Sekunde. Neue Ausgaben unter `Videos/DSS-Flex-Verfahren-2026/` mit Präfix `DiTom-DSS-Flex-Verfahren-`. Darkmode, Fräsmechanik, freier Anschluss und tiefe Erdreichverpressung erhalten.

**Prüfstand:** `npm ci`, `npm test` über alle fünf DN, `npm run build`; beide HTML-Ausgaben SHA-256-identisch. Lokale Browserkontrolle des Prozesses ohne Fehler. Zusätzliche Namensprüfung: Seitentitel, Kopfzeile und Modellüberschrift korrekt, kein sichtbarer alter Produktname, PNG-Download mit DSS-Flex-Dateinamen. Präsentation sowie Film-Titelkarten in allen drei Formaten visuell geprüft.

**Abschluss:** Alle sechs neuen MP4-Dateien vollständig decodiert und geprüft: H.264/AAC, 30 Bilder/s, 78 Sekunden, passende Auflösungen, keine Untertitelspuren, Tonspitzen −1,3 dB bzw. −5,3 dB. Kontaktbögen aus allen drei endgültigen Formaten visuell kontrolliert. Alle sechs Videos in Edge geladen, per Zeitsprung geprüft und abgespielt; keine Browserfehler. Die bisherige lokale Videogalerie verweist auf die neue DSS-Flex-Galerie. Keine Veröffentlichung, kein Telegram-Versand, kein Commit im übergeordneten alten Git-Arbeitsverzeichnis.

## 17.09.2026 – Große Ausbrüche und tiefe Verpressung im Erdreich sichtbar

**Nutzerwunsch:** Am Ende soll der Injektionsmörtel sichtbar tief ins Erdreich verpresst sein, um die Sanierung großer Ausbrüche zu veranschaulichen.

**Umgesetzt:** Eigenständiges Modul `src/ground-grout.js` mit Bodenvolumen, unregelmäßigem Verpresskörper und eingeschlossenen Körnern. Nach Ankunft des Mörtels wächst der Körper vom Ausbruch nach außen/oben. Das Wachstum ist deterministisch, einschließlich Rücksprung. Der Körper bleibt außerhalb der Anschlusswand und des Hauptkanalquerschnitts. Rohrschnitt zeigt gefüllte Schnittflächen von Boden und Mörtel; die Schnittwahl verändert nicht die Verpressung. Bodenfarbe, Granulat und planare Oberseitentextur visuell abgestimmt. Die Ansicht **Schadstelle** umfasst den größeren Körper. Film-Injektionskamera erweitert; Sekunden 68–70 zeigen den freien Durchgang, Sekunden 70–73 den tiefen Verpresskörper ohne Roboter davor. Zwei deutsche Sprecherpassagen dazu neu erzeugt, restliche Stimme und Musik erhalten. Sprachcache erkennt jetzt Textänderungen.

**Einordnung:** Modellhöhe und seitliche Reichweite illustrieren das Verfahren. Sie sind keine bestätigten Baustellenmaße, zugesicherte Eindringtiefe oder Druck-/Bodensimulation. Keine Änderung der recherchierten Robotermechanik, Schalung oder Nutmaße.

**Prüfstand:** Modell-, Roboter- und Fräsprüfungen für alle fünf DN, zusätzlich Verpressreichweite, freier Durchgang, reine Sichtbarkeitsschnitte und rückwärts reproduzierbares Wachstum. Beide HTML-Dateien neu gebaut. Lokale Edge-Prüfung von frühem/vollständigem Verpresskörper, Fräsen, Ausschalen, Rücksprung und DN 300/700 ohne Browserfehler. Film-Einzelbilder in drei Formaten geprüft. Sprecherzeiten passen in die Schnittfenster. Keine Veröffentlichung.

**Videoabschluss:** Alle sechs Fassungen mit tiefer Verpressung und neuer Schlussansicht fertiggestellt, einschließlich angepasster deutscher Sprecherpassagen. Jede MP4 vollständig decodiert; H.264/AAC, Auflösung, 30 Bilder/s, 78 Sekunden und Tonspitzen geprüft. Kontaktbögen aus den endgültigen Dateien aller drei Formate visuell kontrolliert. Alle sechs Videos in Edge geladen, per Zeitsprung geprüft und abgespielt, ohne Fehler. Dateien etwa 27–45 MiB, weiterhin lokal unter `Videos/Werbung-Fraesen-Sanierung-2026/`. Galerie aktualisiert. Kein Telegram-Versand, keine Veröffentlichung, kein Commit im übergeordneten alten Git-Arbeitsverzeichnis.

## 17.09.2026 – Seitliche Fräsbewegung über Drehmodul hinter CutterCam

**Nutzerkorrektur:** Der Fräskopf darf nicht durch seitliches Ausschwenken der Hubarme geführt werden. Gedreht wird an der Achse direkt hinter der Kamera; die Arme heben und senken.

**Umgesetzt:** Gemeinsame vordere Baugruppe mit Längsdrehachse, rotierendem Frontflansch, CutterCam, Hubarmhalterung, parallelen Schwingen/Führungen und Fräskopf. Die Arme bleiben in ihrer lokalen Hubebene. Fräsposition aus Modulwinkel, Hub und Längsfahrt gelöst; keine freie seitliche Versetzung des Werkzeugs oder verdrehten Armanschlüsse mehr. Schlauchführung folgt der rotierenden Front, Fahrwagen und Räder bleiben gerade. IBAK-Prospekt S. 6–7 erneut abgeglichen und `ROBOTER-QUELLEN.md` ergänzt. Im Film zeigen Sekunden 14–20 das Drehmodul und die Arme mit weiterem Bildausschnitt, anschließend wieder Fräsdetail. Darkmode, Logo und Verpressung erhalten.

**Modellprüfung:** `npm test` für alle fünf DN bestanden, einschließlich neuer Prüfungen für ebene Armbewegung, gemeinsame Kameradrehung, stabilen Fahrwagen und verbundenen Fräskopf. Beide HTML-Ausgaben neu gebaut und SHA-256-identisch. Lokale Edge-Prüfung von Links-/Rechtsdrehung, Fräsen, Verpressen, Ausschalen, Rücksprung und DN 300/700 ohne Browserfehler; Film-Einzelbilder in drei Formaten geprüft. Keine Veröffentlichung.

**Videoabschluss:** Alle sechs Fassungen mit dieser Mechanikkorrektur neu exportiert: drei Formate, jeweils Sprecher/Musik oder nur Musik, unverändert 78 Sekunden. Jede MP4 vollständig decodiert, Video-/Audioformat und Tonspitzen kontrolliert. Kontaktbögen aus den fertigen Dateien aller Formate visuell geprüft; alle sechs Videos in Edge geladen, abgespielt und per Zeitsprung geprüft, ohne Fehler. Lokale Galerie aktualisiert. Kein Telegram-Versand, keine Veröffentlichung und kein Commit im übergeordneten alten Git-Arbeitsverzeichnis.

## 17.09.2026 – Transparentes Logo oben links, Darkmode und geschlossener Mörtelrand

**Nutzerkorrektur:** Helle Fläche hinter dem Logo entfernen, Logo oben links, Werbung wieder im Darkmode und verbliebenen Frässpalt vollständig verfüllen.

**Ursache und Änderung:** Das Logo-PNG war bereits transparent; die helle Platte und die hellen Titelkarten stammten aus dem Filmstudio. Diese Flächen ersetzt, das Logo direkt oben links gesetzt und die Galerie dunkel gestaltet. In `src/repair.js` wurde ein Füllwert knapp unter 100 % auf den endgültigen Cache-Schlüssel gerundet; dadurch konnte die letzte Mörtelhülse zu kurz bleiben. Nur vollständig gefüllte Zustände erhalten jetzt den Endschlüssel, und die Erzeugung verwendet denselben Füllwert wie der Cache. Doppelte Profilreihen an den Nutkanten bilden die rechtwinkligen Stufen exakt ab. Der ursprüngliche freie Innenradius bleibt erhalten.

**Modellprüfung:** `npm test` mit zusätzlicher Regression für fast vollständige Füllung, endgültige Höhe, Nutstufen und Rücksprünge über alle fünf DN bestanden. `npm run build` und Filmstudio-Build erfolgreich; beide eigenständigen HTML-Dateien haben denselben SHA-256. Lokale Browserkontrolle von Fräsen, Füllen, Ausschalen, Rücksprung und DN 300/700 ohne Konsolenfehler. Film-Einzelbilder in allen drei Formaten geprüft, einschließlich vollständig gefülltem Anschluss bei Sekunde 61. Keine Veröffentlichung.

**Videoabschluss:** Alle sechs 78-Sekunden-Fassungen aus dem korrigierten Modell neu gerendert und mit bestehender Sprecher-/Musikspur exportiert. Vollständig decodiert, H.264/AAC/30 Bilder pro Sekunde und Tonspitzen kontrolliert; Kontaktbögen aller drei Formate visuell geprüft. Alle sechs MP4 in Edge geladen, abgespielt und per Zeitsprung geprüft, ohne Fehler. Galerie ebenfalls im Darkmode. Dateien ersetzen die bisherigen lokalen Fassungen unter `Videos/Werbung-Fraesen-Sanierung-2026/`; keine Telegram-Sendung. Kein Commit im übergeordneten alten Git-Arbeitsverzeichnis.

## 17.09.2026 – Neue Werbung ausschließlich mit Fräsen und Sanierung

Auftrag: aktuelle Animation mit DiTom-Logo als Werbung, je mit/ohne Sprecher. Spätere Nutzerkorrektur: hier bereitstellen, nicht per Telegram. Frühere lokale Produktionsdateien und Stimme waren auf diesem Computer nicht vorhanden; das aktuelle Modell und Original-Logo wurden übernommen, Filmstudio und Tonproduktion neu angelegt.

**Ergebnis:** Sechs MP4-Dateien, jeweils 78 Sekunden, 30 Bilder/s, H.264/AAC/Faststart: 1920×1080, 1080×1920 und 1080×1350, je mit neuer deutscher synthetischer Sprecherstimme plus Musik bzw. ausschließlich Musik. Nur Fräs-/Sanierungsprozess, keine Explosion, Website-Bedienelemente oder Untertitel. Logo-Auftakt/-Abschluss und dezentes Logo in allen Szenen. Szenen zeigen Schaden, Rückschnitt, Rundfräsen, Wandvorbereitung/Nut, Positionieren, Anpressen, Abdichten, Anschlussblase, Verpressung, Ausschalen und freien Anschluss. Kameras je Seitenverhältnis angepasst. Eigene Instrumentalmusik, Absenkung unter der Stimme.

**Geprüft:** Alle sechs MP4 vollständig decodiert; Video-/Audioformate, Auflösung, Dauer, Bildrate und Tonspitzen geprüft. Keine digitale Übersteuerung; ca. 15–21 MB pro Datei. Kontaktbögen aus den finalen Dateien visuell geprüft. Rendering ohne Browserfehler; alle sechs Fassungen in lokalem Edge geladen, abgespielt und per Zeitsprung geprüft. Produktionsskripte syntaxgeprüft. Modellquellen unverändert; die vorhandenen Geometrieprüfungen aus dem vorherigen Arbeitsschritt gelten weiter. Keine Veröffentlichung und kein Telegram-Versand.

**Ablage:** `Videos/Werbung-Fraesen-Sanierung-2026/`, einschließlich `Videos-ansehen.html`, Sprechertext und Prüfberichten. Reproduktion siehe `work/VIDEO-PRODUKTION.md`; Quellen unter `work/film-*`, `work/build-film.mjs`, `work/render-film.mjs`, `work/finish-film.py`, `work/verify-films.mjs`. Große Ausgaben, Python-Cache und Zwischenstände ausgeschlossen. Kein Commit im übergeordneten alten Git-Arbeitsverzeichnis.


## 17.09.2026 – Einragender Anschluss, Wurzeln, runde Fräsfläche und lückenlose Verpressung

**Nutzerkorrektur:** Mörtel soll von der Anschlusskante zusammenhängend bis über die Nut verpresst erscheinen, ohne den Anschlussquerschnitt zu verkleinern. Die Fräsfläche im Hauptkanal soll rund sein. Der anfänglich einragende Anschluss und etwas in die Haltung reichender Wurzeleinwuchs werden zurückgefräst.

**Umsetzung:** Eigene Steinzeug-Geometrie für den einragenden Rohrteil, verzweigte Wurzelstränge, progressiver Rückschnitt innerhalb Phase 0. Danach kreisförmige Fräsgrenze auf der abgewickelten Rohrfläche statt der bisherigen gezackten Außenkontur. Im Anschluss eine vorbereitete 3-mm-Vertiefung von der zurückgefrästen Kante bis 16 mm über die 16 mm hohe/6 mm tiefe Nut; Nutmitte ca. 50 mm hinter der mittleren Kante. Der Mörtel füllt zuerst den Hohlraum, dann die Anschlusswand einschließlich Nut. Die geschlossene Mörtelgeometrie besitzt durchgehend den ursprünglichen Innenradius, inklusive gefüllter Schnittflächen. Diese zusätzlichen Maße, der einragende Rohrteil und die Wurzeln sind beispielhafte Darstellungsannahmen, keine Hersteller- oder Baustellenmaße. Zehn Phasen und bisherige Schalungsmechanik erhalten. Rücksprünge stellen Einragung und Wurzeln wieder her.

**Prüfung:** Geometrieprüfungen ergänzt: kreisförmige Fräsgrenze, Einragung vor/nach Rückschnitt, Wurzelzustand, vollständig freier Innenradius, Mörtelende hinter der Nut, Füllreihenfolge und Rücksprung. Die Modell-, Wasser-, Wickel-, Roboter- und Fräsprüfungen für alle fünf DN bestanden. Visuell im lokalen Edge geprüft: Einragung/Wurzeln, Rückschnitt, runde Fräsfläche, Nut, früher und vollständiger Mörtelfluss, Ausschalen sowie Rücksprung; zusätzlich DN 300/700 und der freie Anschluss vom Hauptkanal aus. Keine Browserfehler. Beide HTML-Ausgaben neu gebaut und inhaltsgleich. Die abschließende Mörtelhaut deckt die gesamte kreisförmige Fräsfläche einheitlich ab. Nur lokale Ausgaben, keine Veröffentlichung.


## 17.09.2026 – Fräskopf nach vertiefter IBAK-Recherche ersetzt

**Anlass:** Nutzer beanstandete die Ähnlichkeit des ersten Foto-Nachbaus. Erst IBAK-Prospekt S. 6–7/16–17, IBAK-Anwenderbericht und SDT-Werkzeugkatalog S. 14–17 recherchiert und die relevanten Produktbilder gerendert/verglichen. Ergebnis: Motorblock muss längs liegen; Spindel sitzt oben, FrontCam vorne. Der rote Kopf ist als gewölbte segmentierte Pilzform nachzubilden, nicht als kleines Zahnrad. Genaue Artikelnummer und Fertigungsmaße bleiben offen.

**Geändert:** Eigenständige Geometrie in `src/cutter.js`, länglicher facettierter Motorblock mit Deckeln/Schrauben, Querachse, Flansch, konischer Hals, Werkzeugstutzen, FrontCam, Leitungen und Warnsymbol. Rote gewölbte Krone mit getrennten rauen Schleifsegmenten. Spindelversatz bei der Positionierung berücksichtigt; keine zusätzliche Schalungsaufnahme während des Fräsens. Darstellungsmaße nun 60 mm Durchmesser/16 mm Profilstärke, innere Nut 16 mm hoch/6 mm tief, weiterhin ca. 50 mm im Anschluss. Die Maße sind Annahmen. `Fraeskopf-Vergleich.html` vergleicht dieselbe drehbare Werkzeuggeometrie direkt mit dem Nutzerfoto und verlinkt die Recherchequellen. Build erzeugt zusätzlich zu beiden Animationen diesen Vergleich.

**Prüfstand:** Bestehende Modell-, Wasser-, Wickel- und Roboterprüfungen sowie Werkzeugkontakt, Gliedlängen, Nut, Rücksprünge und Ausblendungen für alle fünf DN geprüft. Neue Formregression prüft längsliegendes Gehäuse, FrontCam vor dem Motor und Spindelversatz. Visuell im lokalen Edge geprüft: Vergleich in Schräg-, Seiten- und Draufsicht, Außenfräsen, innere Nut, Wechsel, Positionieren, Verfüllung, Ausschalen und Rücksprung; zusätzlich DN 300/700. Keine Browserfehler. Die Nachbildung wird nicht als identifiziertes Hersteller-CAD bezeichnet. Lokal gebaut, keine Veröffentlichung; übergeordnetes Git-Arbeitsverzeichnis unverändert.

## 17.09.2026 – Fräsvorbereitung und Nut im Anschluss, lokal gebaut

**Fotokorrektur:** Auf anschließenden Nutzerwunsch die erste schematische Fräseinheit durch die Bauform des bereitgestellten Originalfotos ersetzt: kantiges schwarzes Gehäuse mit Seitenplatten, kurze abgestufte Metallspindel, roter Schneidenträger mit dunklen einzelnen Schneiden, Warnzeichen und untere Optik. Das Foto belegt die Bauform, nicht die Maße. Die 3D-Nachbildung bleibt angenähert.

Vor den bisherigen sieben Schritten drei Phasen ergänzt: Fräsen um den Anschluss, umlaufende Nut und Rückzug/Werkzeugwechsel. Der Roboter trägt dabei ein rotierendes Fräswerkzeug ohne Schalung. Der Außenstreifen wird eine Fräserbreite breit und eine Fräserstärke tief abgetragen. Die innere Ringnut liegt 50 mm hinter der mittleren Anschlusskante; die unregelmäßige Bruchkante bleibt erhalten. Annahmen: Fräserdurchmesser 32 mm, Stärke 10 mm, innere Nut 10 mm hoch und 6 mm tief; keine bestätigten Herstellermaße. Die feste Werkzeugverlängerung und seitliche Werkzeugführung erläutern den Ablauf, sind keine bestätigte IBAK-Rüstkonfiguration.

Abtrag entsteht fortschreitend in der Rohrgeometrie, bleibt nach Rückzug sichtbar und wird bei der Mörtelphase bündig verfüllt. Zeitabhängige Berechnung erlaubt direkte Vor- und Rücksprünge. Schnitte und Roboter-Ausblendung ändern den Abtrag nicht. Neue Ansicht **Fräsdetail**, zehn Phasentasten und erweiterte Zeitachse; Bedienhinweise aktualisiert. Der Wechsel auf die Schalung wird außerhalb der Schadstelle als Szenenwechsel gezeigt.

Prüfung: `npm ci`, bestehende Modell-/Wasser-/Wickel-/Roboterprüfungen sowie neue Fräsprüfungen für alle fünf DN bestanden. Prüfung von Werkzeugkontakt, festen Gliedlängen, Nuttiefe/-position, Wiederverfüllung, Ausblendungen und Rücksprüngen. Beide eigenständigen HTML-Dateien gebaut. Visuelle Prüfung in lokalem Edge/Playwright: Fräsen, Nut, Wechsel, Positionieren, Verfüllung, Ausschalen und Rücksprung; zusätzlich DN 300/700, keine Browserfehler. Screenshots unter ignoriertem `work/qa/`. Keine Veröffentlichung und kein Videoexport. Der aktuelle Ordner ist eine ausgepackte Projektkopie innerhalb eines älteren übergeordneten Git-Arbeitsverzeichnisses; dessen bestehende Löschungen wurden nicht angefasst, kein Commit darin erzeugt.

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
