# Fortschrittschronik

## 20.09.2026 – Detailausgabe näher am Pages-Modell

Nutzer beanstandete die grobe Druckdarstellung. Zusätzlicher Export aus Originalflächen statt globaler Voxelverdickung: feinere Radprofile, Schrauben, Gelenke, Stangen, Bohrungen und Schläuche, durchgängig triangulierte Schildrundungen. Nur einzelne offene Hüllen lokal repariert; Schnittgeometrie und Materialvolumen per Boolean-Operationen erzeugt. Bestehende Animation und robuste Erstfassung erhalten.

Drei Motive in je zehn Größen, STL und farbige 3MF; 400-/600-mm-Versionen zusätzlich segmentiert. Alle 138 Dateien unabhängig erneut eingelesen und geprüft, offizielle lib3mf ohne Warnungen. Alle drei echten Detail-3MF im Browser visuell geprüft, einschließlich Schnitt/Seite und Modellwechsel; keine Browserfehler. `npm ci`, vorhandene Modelltests für alle fünf DN und Build erfolgreich; zusätzlicher Exporttest für Schalennetz, Abmessungen und Bauteilanzahl bestanden. STL-Präzisionskorrektur höchstens 0,0005 mm pro Koordinate. Kein physischer Probedruck; kleine Details benötigen Wandstärken-/Slicerprüfung. Detail-STLs dürfen mehrere geschlossene Teilkörper enthalten.

Lokale Ausgabe `Druckmodelle/DSS-Flex-Detail-2026/`, getrennte Vorschauseiten und ZIPs. Die umfangreichen Druckassets bleiben lokal und werden nicht automatisch veröffentlicht; Erzeugungscode und Dokumentation versioniert. Anleitung, Reproduktion und Grenzen: [3D-DRUCK-DETAIL.md](3D-DRUCK-DETAIL.md).

## 20.09.2026 – Zehn Größen für den 3D-Druck

Auf Nutzerauftrag drei statische DN-400-Anschauungsmodelle aus Modellbasis `d0ac2f3` aufbereitet: Roboter mit Schalung, Schalung allein sowie Rohrsanierung im seitlichen Schnitt mit ausgefahrener Anschlussblase und Mörtelfüllung. Je Motiv zehn Standflächenlängen: 80, 100, 120, 150, 180, 200, 250, 300, 400 und 600 mm. Die zwei kleinsten Ausgaben mit feineren Verstärkungen für Harzdruck, übrige mit stärkeren FDM-Verbindungen. Jeweils einfarbige STL und 3MF mit getrennten Farbbereichen. Große Ausgaben zusätzlich in maximal etwa 170 mm große Klebesegmente geteilt.

Erzeugung unter `work/export-print-source.mjs`, `work/build-print-models.py` und weiteren `work/*print*`-Hilfen reproduzierbar. Lokale Ergebnisse: `Druckmodelle/DSS-Flex-2026/`; zehn einzelne ZIPs und ein Gesamt-ZIP daneben. Offline-Vorschau lädt tatsächliche 3MF-Druckkörper, mit Modellwahl, Größenwahl, Seitenansicht und Einfarbansicht. Alle drei Motive visuell im Browser geprüft, keine Browserfehler. Alle 150 STL-/3MF-Dateien erneut eingelesen: geschlossene, orientierte Körper mit positivem Volumen; 3MF streng mit offizieller lib3mf ohne Warnungen geprüft. Alle 30 Gesamt-STLs zusammenhängend; Segmentabmessungen geprüft. Berichte liegen bei den Dateien.

Grenzen: feste Schaustücke mit dauerhaften Standflächen/Stützen, vereinfachten und verstärkten Details sowie sichtbaren Voxelstufen. Unterschiedliche Motivmaßstäbe, keine funktionsfähige Mechanik, kein kalibriertes Maschinenprofil, kein physischer Probedruck. Slicer-Stützen und Materialzuordnung sind vor dem Druck zu prüfen. Die 3MF-Farbbereiche benötigen einen geeigneten Slicer/Drucker; große Segmente haben plane Klebeflächen ohne Passstifte. Diese Druckausgabe ist lokal erstellt und noch nicht auf Pages veröffentlicht.

Abschlussprüfung im portablen Repository: `npm ci`, `npm test` (alle fünf DN einschließlich Roboter, Fräsen und Rücksprüngen) und `npm run build` erfolgreich. Beide eigenständigen HTML-Ausgaben sowie äußerer Arbeitsordner synchronisiert. Alle elf ZIP-Archive per CRC geprüft. Quellen und Druckausgaben lokal versioniert; keine Veröffentlichung beauftragt.

## 20.09.2026 – Private Drive-Sicherung für Telegram

Auf ausdrücklichen Nutzerauftrag Telegram-Zugangsdaten im verbundenen persönlichen Google Drive hinterlegt. Vor dem Übertragen anhand einer leeren Platzhalterdatei geprüft: nicht geteilt, ausschließlich Eigentümerberechtigung. Nach dem Upload dieselben privaten Berechtigungen erneut bestätigt. Die abgerufene Konfiguration stimmt per SHA-256 mit dem ursprünglichen lokalen Export überein; temporärer Klartext-Export entfernt. Die bestehende verschlüsselte lokale Konfiguration unverändert und weiterhin lesbar.

Telegram-Skill im Benutzerprofil und Repository ergänzt: Fehlt auf einem anderen Computer die lokale Konfiguration, zuerst die private Drive-Sicherung nutzen, statt neue Schlüssel anzufordern. Keine Schlüssel, Empfänger-IDs oder privaten Datei-IDs versioniert. Der Connector-Download-Link lieferte HTTP 403; die Sicherung wurde über den begrenzten Rohdatenabruf intern anhand der Prüfsumme geprüft. Schlüsselwerte nicht in Shell-Argumente übernehmen. Für die lokale Wiederherstellung ist ein sicher materialisierter Download beziehungsweise ein authentifizierter Drive-Browserdownload nötig; vollständige automatische Installation auf einem anderen Rechner hier nicht geprüft. Skill-Validierung und Prüfung der bestehenden lokalen Konfiguration erfolgreich.

## 20.09.2026 – Veröffentlichung, neue Prozessfilme und portabler Telegram-Skill

**Auftrag:** Aktuellen Stand pushen, GitHub Pages aktualisieren, die sechs bisherigen Videoformate neu produzieren und über Telegram zustellen. Telegram-Versand auch für die Weiterarbeit auf anderen Computern hinterlegen.

**Modell:** Die sieben lokalen Modellkorrekturen bis `6683ef0` auf `main` gepusht. Pages-Build für genau diesen Commit erfolgreich. Live-Seite in Edge mit neun Phasen, aktuellem Erdreich und Schlauchführung an der Armaufnahme geprüft; keine Browserfehler. `npm ci`, `npm test` (alle fünf DN) und `npm run build` im portablen Repository erneut erfolgreich; HTML-Ausgaben synchron.

**Videos:** Neu aus Modellbasis `6683ef0` gerendert: je 78 Sekunden in 1920 × 1080, 1080 × 1920 und 1080 × 1350, jeweils Sprecher/Musik und nur Musik. Schnittfolge ohne Nutfräsen, aktualisierte Blasenhöhe und Mörtelfüllung, eigener Blick auf Opferschlauch/Messingwinkel, kleine ovale Endfläche und detailliertes Erdreich. Deutscher synthetischer Sprechertext neu erzeugt. Alle sechs MP4 vollständig decodiert, H.264/AAC/30 fps, Audiopeaks −1,5 beziehungsweise −5,3 dB, keine Untertitel und Dateigrößen unter 49 MB geprüft. Kontaktbögen aller drei finalen Formate visuell kontrolliert; alle sechs Filme im Browser abgespielt und Zeitsprünge geprüft, keine Fehler. Dateien und Galerie: `Videos/DSS-Flex-Verfahren-2026/`. Die PowerPoint bleibt der separate ältere Stand vom 17.09.2026.

**Skill:** `.agents/skills/telegram-delivery/` enthält sechs geheimnisfreie Quelldateien, natürliche deutsche Telegram-Auslöser, Versandbestätigung und Schutz vor unbeabsichtigter Wiederholung. Persönliche Installation auf diesem Computer aktualisiert. Installationsskript für weitere Computer, sichere DPAPI-Konfiguration unter Windows und optional OS-Schlüsselbund unter macOS/Linux ergänzt. Skill-Validierung, Python-Syntax, Konfigurationsschutz mit künstlichen Testdaten und Lesbarkeit des bestehenden Windows-Zugangs geprüft; andere Betriebssysteme hier nicht praktisch geprüft. Neue Computer benötigen einmalig ihren eigenen sicheren Zugang. Keine Tokens, Empfänger-IDs, privaten Konfigurationsdateien oder Versandprotokolle im Repository. Portables ZIP lokal: `work/qa/Telegram-Versand-Skill.zip`.

**Telegram-Zustellung:** Alle sechs neuen MP4 und das portable Skill-ZIP am 20.09.2026 erfolgreich zugestellt. Für jede der sieben Sendungen liegt eine positive Telegram-Bestätigung mit Nachrichten-ID im privaten lokalen Versandprotokoll vor.

**Medien-Veröffentlichung:** Commit `8edfeab` auf `main` gepusht; Pages-Build für genau diesen Commit erfolgreich. Live-Galerie zeigt Stand 20.09.2026. Alle sechs MP4 über HTTPS mit Status 200 und exakt den neuen Dateigrößen erreichbar; Auflösung und 78 Sekunden Laufzeit im Browser bestätigt. Alle sechs Live-Videos ab dem Anfang erfolgreich abgespielt. Der erste automatisierte Live-Zeitsprung wartete über das Werkzeugzeitlimit hinaus; nach frischem Laden lief die Wiedergabe aller sechs Dateien. Lokale Zeitsprünge waren bereits für alle sechs Filme erfolgreich geprüft.

## 20.09.2026 – Dickerer Injektionsschlauch direkt hinunter zum Roboterarm

**Nutzerkorrektur:** Injektionsöffnung etwas größer, Schlauch etwas dicker. Direkt hinter dem Messingwinkel nach unten und an der im Browserbild markierten vorderen Armaufnahme entlangführen.

**Umsetzung:** Öffnungsdurchmesser von 14 auf 16 mm und Schlauchaußendurchmesser von 9 auf 11 mm erhöht; illustrative Modellmaße, keine Herstellerangaben. Durchlass, Verschraubungen und sichtbarer Mörtelstrang angepasst. Der Schlauch fällt unmittelbar nach dem 45°-Winkel ab, folgt der vorderen Armaufnahme beim Hub und läuft neben der CutterCam bis hinter den Roboter. Zulaufabdruck passend vergrößert; Sensorabdruck, schmale ovale Reparaturfläche und halbierte freie Endabstände erhalten. Prozessbeschreibung und Bedienhinweise aktualisiert.

**Prüfung:** `npm ci`, `npm test` und `npm run build` im portablen Repository bestanden. Alle fünf DN einschließlich direkter Phasensprünge geprüft; ergänzte Prüfungen für Öffnungs-/Schlauchdurchmesser, Abstieg am Winkel, Führung an der bewegten Armaufnahme und Wellenfreigang. In Edge Schlauchabstieg, Werkzeugarm und Winkel visuell geprüft, zusätzlich abgesenkte Stellung DN 300 und angepresste Stellung DN 700; keine Browserfehler. Beide HTML-Ausgaben und Fräskopfvergleich neu gebaut, äußerer Ordner und Repository synchronisiert. Lokal gespeichert; keine Veröffentlichung.

## 20.09.2026 – Unregelmäßiges Erdreich, Messingwinkel und Opferschlauch

**Nutzerkorrektur:** Erdreich detaillierter und ohne Kastenform. Injektionsrundung nur etwas kleiner als der Druckschalter. Unter dem Schild ein 45°-Messingwinkel mit einem Ende an der Injektionsöffnung und dem anderen am Opferschlauch. Schlauch neben CutterCam bis hinter den Roboter; nach jeder Verpressung/Aushärtung wechseln, Messingwinkel reinigen und wiederverwenden.

**Umsetzung:** Bodenaußenform über Höhe und Umfang unregelmäßig, geneigte/uneinheitliche Oberkante, farbliche Schichtung und eigene Bodentextur. 360 verschieden große Steine im Schnitt und 420 räumliche Erdklumpen/Körner außen; der ausgewaschene Leerraum bleibt erhalten. Neuer Messingwinkel mit 45°-Abgang, Sechskantverschraubungen und Anschlussringen. Rundung am Schild Radius 11,4 gegenüber 12 mm am Druckschalter; reine Darstellungsmaße. Durchgängiger Opferschlauch seitlich neben CutterCam bis hinter den vollständigen Fahrwagen. Das vordere Schlauchende folgt dem Winkel beim Anpressen, Entspannen und in Explosionsansichten; die hintere Leitung bleibt auf Fahrwagenhöhe. Der sichtbare Mörtelweg führt auch durch den Winkel. Hinweise zum Wechsel beziehungsweise zur Wiederverwendung in den Prozessbeschreibungen und START-HIER ergänzt. Akzeptierte Reparaturfläche, Abdrücke, Blasenmechanik und Mörtelanstieg unverändert.

**Prüfung:** `npm ci`, `npm test`, `npm run build` im portablen Repository bestanden. Alle fünf DN geprüft, zusätzlich Anschluss an den Winkel in allen getesteten Posen, 45°-Richtung, Größe der Rundung, Schlauch neben CutterCam und hinter dem Fahrwagen, unebene Bodenoberkante und tatsächliches Außenrelief. In Edge Erdreich im Schnitt und vollständig, Messingwinkel, Schlauchführung am Roboter, laufende Injektion bei DN 300, ausgehärtete Verfüllung bei DN 700 und Rücksprung visuell geprüft; keine Browserfehler. Beide HTML-Ausgaben neu gebaut, Quellen und äußerer Ordner synchronisiert. Keine Veröffentlichung oder neue Video-/PowerPoint-Exporte.

## 20.09.2026 – Freie Mörtelenden hinter den Abdrücken halbiert

Die ovale Form ist vom Nutzer akzeptiert; nur die Strecke vom Abdruck zur jeweiligen äußeren Rundung war noch zu lang. Beide freien Längsabstände sind jetzt exakt halbiert, gemessen ab dem äußeren Rand des jeweiligen Abdrucks. Daraus ergeben sich rund 42 mm am Sensor und 46 mm am Zulauf, insgesamt etwa 243 × 134 mm Fläche in der Rohrabwicklung. Nur die Längskoordinaten der Kontur werden verkürzt; Breite, Abdruckpositionen und Abdruckgeometrien bleiben identisch. Der unmittelbare Bruchrand ist passend in Längsrichtung verkleinert, damit er vollständig unter der Reparatur liegt. Blasenmechanik und Mörtelanstieg bleiben erhalten.

`npm ci`, `npm test` und `npm run build` im Repository bestanden; alle fünf DN geprüft. Regression prüft die exakte Halbierung beider Endabstände, unveränderte Querbreite und Einfassung des Ausbruchs. Fertige Kanalansicht lokal im Browser visuell geprüft, beide Abdrücke erhalten, keine Browserfehler. Beide HTML-Ausgaben neu gebaut und mit den Quellen synchronisiert. Keine Veröffentlichung und keine neuen Medienexporte.

## 20.09.2026 – Mörtelfläche nochmals deutlich kleiner und schmaler

Nutzerkorrektur: Die vorige Fläche wirkt weiterhin zu groß und kreisförmig. Die gemeinsame Reparatur-/Fräskontur ist jetzt eine schmale Ellipse von ungefähr 330 × 134 mm in der Rohrabwicklung, statt 444 × 226–270 mm. Das Verhältnis von Länge zu Breite steigt auf etwa 2,46; die Fläche sinkt je nach DN um ungefähr 60–66 %. Diese Maße sind Modellparameter, keine Herstellerangaben. Den unmittelbaren Hauptrohrausbruch entsprechend verkleinert, damit kein offener Bruch außerhalb der Reparatur verbleibt. Bodenhohlraum, beide Abdrücke, freie Anschlussöffnung, drei Wicklungen und Mörtelanstieg bleiben erhalten.

Geprüft: `npm ci`, `npm test`, `npm run build` im Repository erfolgreich für alle fünf DN. Bestehende Regression ergänzt um maximale Flächengröße, deutlich längliches Verhältnis und vollständige Einfassung des verkleinerten Bruchrands. Lokale Kanalblick-Sichtprüfung bestätigt die deutlich kleinere Fläche und erhaltene Abdrücke. Beide HTML-Dateien neu gebaut; lokale Änderung, keine Veröffentlichung oder neuen Medienexporte.

## 20.09.2026 – Örtliche ovale Reparaturfläche und realistischere Schadstelle

**Nutzerkorrektur:** Die fertige Fläche soll ungefähr der ovalen Schalung folgen, statt kreisrund und wie eine halbe Rohrbeschichtung zu wirken. Bestehende Abdrücke ausdrücklich erhalten. Infiltration und Anschluss-Hohlraum anhand echter Beispiele überarbeiten.

**Bildabgleich:** Originale Vorher-/Nachher-Bilder von KASSELWASSER und das Infiltrationsfoto von BLD im Browser angesehen; IBAK-Anwenderbericht zur Anschlusseinbindung gelesen. Beobachtungen, verwendete Aspekte und Grenzen in `SCHADSTELLEN-QUELLEN.md` dokumentiert. Keine fremden Bilder eingebettet und keine verborgenen Hohlraummaße aus Fotos als gesichert ausgegeben.

**Geändert:** Längliche, seitlich begrenzte Kontur innerhalb des Schildes, DN-abhängig und gemeinsam für Mörtelfläche, Rohrabtrag und Außenfräsbahn. Unveränderte Sensor-/Zulaufabdrücke und bündige Oberfläche. Größerer Bildwinkel im Kanalblick zeigt angrenzendes Altrohr. Asymmetrischer Bruchrand, ungleich ausgewaschener echter Leerraum im Boden, dunklere feuchte Hohlraumwände und Bodensteine außerhalb des Leerraums. Sieben ungleich verteilte feinere Rinnsale mit wechselndem Querschnitt, unterschiedlichen Stärken, unregelmäßigen Tropfenabständen und lokalen Feuchtespuren. Physisches Abfangen durch die vollständige Schalung bleibt unabhängig von Ansichtsschnitten erhalten.

**Geprüft:** `npm ci`, `npm test`, `npm run build` im portablen Repository bestanden. Alle fünf DN einschließlich Roboter, Wicklung, halber oberer Blasenhöhe, Mörtelanstieg, Abdrücken, Wasserführung und Rücksprüngen geprüft. Ergänzte Regressionen für ovalen Umriss innerhalb der Schalung, lokale Begrenzung am Scheitel, vollständige Abdeckung des Ausbruchs, asymmetrischen Schaden, unterschiedliche Wasserstärken und den zuerst leeren, anschließend verfüllten Bodenhohlraum. In Edge Ausgangsschaden, Ankunft, vollständigen Schild, Anpressen, Verfüllung, Rücksprung sowie Endflächen DN 300/700 visuell geprüft; keine Browserfehler. Beide eigenständigen HTML-Ausgaben neu gebaut und äußeren Ordner mit Repository synchronisiert.

**Stand:** Lokale Änderung; keine Veröffentlichung und keine neuen Video-/PowerPoint-Exporte. Die Geometrie ist eine anhand von Praxisbildern überarbeitete Veranschaulichung, keine vermessene Rekonstruktion eines einzelnen Schadens.

## 20.09.2026 – Injektionsmörtel ohne Nut bis zur halben Blasenhöhe

**Nutzerkorrektur:** Auch ohne Nut soll Mörtel im Anschluss bis zur Hälfte der Blase hochgehen. Maßgeblich ist die ausgefahrene Blasenhöhe oberhalb des angepressten Schildes.

**Umsetzung:** Nach der Hohlraumfüllung steigt eine glatte, geschlossene Mörtelschicht vom Anschlussrand bis zur exakt berechneten halben Blasenhöhe. Sie liegt im bereits modellierten Spalt zwischen aufgeblasener Blase (Radius 39,55 mm) und unveränderter Rohrwand (Innenradius 40 mm). Keine Nut, kein zusätzlicher Innenabtrag. Diese Spaltmaße sind Darstellungsannahmen, keine Herstellermaße. Der untere Rand schließt an die Schadstellenfüllung an; die Schicht bleibt nach dem Ausschalen erhalten. Schnitt und Blasen-Ausblendung ändern nur die Sichtbarkeit. Drei Wicklungen und verkürzte Blase bleiben erhalten.

**Geprüft:** npm ci, npm test und npm run build im Repository erfolgreich; Modell-, Wickel-, Wasser-, Roboter- und Fräsprüfungen für alle fünf DN bestanden. Neue Regression prüft Füllreihenfolge, halbe Blasenhöhe, Lage außerhalb der Blase und innerhalb der Rohrwand, Rücksprünge, Schnitte und Verbleib nach dem Ausschalen. Lokale Edge-Sichtprüfung von Anstieg, vollständiger Füllung und ausgehärtetem Zustand ohne Browserfehler. Beide HTML-Ausgaben neu gebaut. Bedienung, Projektstand und README angepasst. Keine neuen Video-/PowerPoint-Exporte und keine Veröffentlichung.


## 20.09.2026 – Nutfräsen entfernt, Blase nur oberhalb des Schildes halbiert

**Nutzerkorrektur:** Nutfräsen aus dem Ablauf entfernen. Auf Nachfrage ausdrücklich nur den Teil der ausgefahrenen Anschlussblase oberhalb des Schildes halbieren; drei Wicklungen beibehalten.

**Geändert:** Neun statt zehn Phasen. Nach Rückschnitt und äußerem Rundfräsen folgt unmittelbar der Rückzug und Wechsel zur Schalung. Innere Ringnut, Innenwandvertiefung und zugehörige Mörtelhülse entfernt; der Anschlussquerschnitt bleibt unverändert. Mörtel füllt weiterhin die Schadstelle und das Erdreich. Phasennummern, Zeitachse, Beschriftungen, Tests und Browserprüfskript angepasst.

**Blase:** Ausgefahrene Höhe vom Scheitel des angepressten Schildes bis zur Oberseite der starren Spitze exakt auf 50 % des bisherigen Werts gesetzt. Durchmesser, Fuß, Spitzengröße, Wickelpfad, drei Umdrehungen und 3-mm-Wandlagen bleiben erhalten. Vor Luftfüllung wird vollständig abgewickelt. Die kürzere Ausfahrlänge bei unveränderter Wicklung ist eine schematische Verformung, keine längenkonstante Materialsimulation. Anschlussrohrhöhe unverändert.

**Prüfung:** Modell-, Wickel-, Wasser-, Roboter- und Fräsprüfungen für alle fünf DN bestanden, einschließlich Halbierung oberhalb des Schildes, drei vollständiger Umdrehungen, unverändertem Anschlussradius und Rücksprüngen. Lokaler Build erfolgreich. In Edge Blasenantrieb, Wicklung mit Schalungsschnitt, DN 300/700, äußerer Fräsvorgang, fertiger Anschluss und Rücksprung visuell geprüft; keine Browserfehler. Beide HTML-Ausgaben und Quellen im äußeren Arbeitsordner sowie im Repository synchronisiert.

**Medien und Veröffentlichung:** Vorhandene Videos und PowerPoint nicht neu exportiert; deren abweichender Modellstand ist in den Anleitungen gekennzeichnet. Vor neuem Filmexport müssen die alten Szenenzeiten und Sprechertexte umgestellt werden. Lokaler Stand, kein Push und keine neue Pages-Veröffentlichung.


## 20.09.2026 – Aktuellen GitHub-Stand lokal übernommen

GitHub-Commit `07f4d35` per Fast-forward in `work/github-pages` übernommen. Alle 64 versionierten Dateien einschließlich Quellen, Dokumentation, HTML-Ausgaben, sechs DSS-Flex-Videos und PowerPoint in den äußeren Arbeitsordner synchronisiert. Vorherige lokale Dateien unter `work/local-backup-20260920-170111` gesichert; zusätzliche ältere Medien und private Produktionsdateien erhalten.

Beide Arbeitsordner nutzen jetzt die unveränderten portablen Quellen und dieselbe package.json/Lockdatei. Abhängigkeiten in beiden Ordnern mit `npm ci` installiert. `work/prepare-github.mjs` übernimmt die bereits versionierten Dateien ohne alte Import-Umschreibungen oder Überschreiben der aktuellen Paketkonfiguration; neue öffentliche Dateien müssen im Repository ausdrücklich ergänzt werden.

Prüfung: `npm test` im Repository für alle fünf DN bestanden; `npm run build` in beiden Ordnern erfolgreich. Erzeugte HTML-Dateien stimmen abgesehen von Windows-Zeilenenden mit GitHub überein. Anschließend Original-Zeilenenden wiederhergestellt. Lokale 3D- und Prozessansicht in Edge visuell geprüft, keine Browserfehler. Keine erneute vollständige Video-/PowerPoint-Prüfung. Repository bleibt unverändert auf `origin/main`; kein Push und keine Veröffentlichung. Dieser lokale Synchronisationsvermerk steht nur im äußeren Arbeitsordner.


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
