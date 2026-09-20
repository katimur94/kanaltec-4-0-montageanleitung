# Projektstand und Übergabe – DSS-Flex Verfahren

**Rundere Verschlussfläche (20.09.2026):** Neue Nutzerkorrektur für Loch und stillgelegten Anschluss: kompakt und nur leicht oval. Kontur in der Rohrabwicklung jetzt 260 × 230 mm statt 295 × 150 mm; passt über alle fünf DN innerhalb der Schalung und umfasst Schaden sowie vollständige Zulauf-/Sensorabdrücke. Rohrwand, Gussfläche, Schnittkante und optionale Fräsbahn verwenden dieselbe Kontur. Zulauf bleibt mittig, Anschlussfüllung nahezu vollständig. Beide Verschlussfilme neu gerendert, vollständig decodiert und im Browser geprüft; korrigierte Fassungen über Telegram bestätigt zugestellt. Darstellungsmaße nach Nutzerkorrektur, keine Herstellerangabe. Siehe [SCHADSTELLEN-QUELLEN.md](SCHADSTELLEN-QUELLEN.md) und neuesten Eintrag in [FORTSCHRITT.md](FORTSCHRITT.md).

**Neue Verschlussfilme (20.09.2026):** „Loch verschließen“ und „Anschluss verschließen“, je 60 Sekunden Full HD, nur eigene Instrumentalmusik und kein Sprecher. Modellbasis `426422f`, direkter Ablauf ohne Fräsen, mittiger Einfüllstutzen und nahezu volle Anschlussfüllung. Beide MP4 vollständig decodiert, Kontaktbögen visuell und Wiedergabe in Edge geprüft; beide über Telegram bestätigt zugestellt. In der [Videogalerie](Videos/DSS-Flex-Verfahren-2026/Videos-ansehen.html) veröffentlicht. Pages-Build für Video-Commit `a8ef4f4` erfolgreich; beide Filme direkt auf Pages mit Abspielen und Zeitsprung ohne Fehler geprüft. Details in [FORTSCHRITT.md](FORTSCHRITT.md).

**Korrektur der geschlossenen Variante (20.09.2026):** Der Einfüllstutzen muss mittig unter dem stillgelegten Anschluss beziehungsweise Rohrloch stehen. Dafür wird die gesamte Schalung bei der Arbeitsposition um den vorhandenen Stutzenversatz verschoben (im Modell +66 mm); Einfüllstutzen, Winkel, Schlauch und Welle behalten ihre Bauteillage. Die beiden Abdrücke folgen der realen Position; die örtliche ovale Guss-/Fräskontur umschließt Schaden und versetzte Sensorposition innerhalb der Schalung. **Vorbereitung → Keine Einragung · ohne Fräsen** ist bei geschlossenen Anwendungen die Voreinstellung: sieben Schritte ab Positionieren, kein Fräser, kein Werkzeugwechsel, kein Rohrabtrag, keine Einragung/Wurzeln. **Einragung vorhanden · erst fräsen** zeigt neun Schritte; am Rohrloch werden Bruchstücke statt eines fiktiven Anschlussrohrs dargestellt. Der stillgelegte Anschluss wird fast vollständig gefüllt: im Modell 95 % der dargestellten Strecke zwischen Verschlussfuß und Anschlussoberkante. Diese Quote ist eine Darstellungsannahme für „fast komplett“, keine Ausführungsbemessung. Die frühere 70-mm-Füllhöhe ist ersetzt. **Schadstelle** zeigt nun die gesamte Anschlussfüllhöhe. Vollständige Tests und portabler Build bestanden, beide HTML-Dateien synchron. Modellstand `426422f` am 20.09.2026 auf GitHub und Pages veröffentlicht; beide Varianten live im Browser ohne Fehler geprüft.

**Geschlossene Schalung (20.09.2026):** Zusätzliche Anwendungsauswahl für stillgelegte Anschlüsse und Löcher im Hauptrohr. Äußeres Schild ohne mittlere Blasenöffnung; gleiche Welle ohne Anschlussblase und ohne Wickelbewegung. Mörtelzulauf, Drucksensor, Träger, Dichtblase, Befestigungen, Bumper und Roboter bleiben erhalten. Beide neuen Anwendungen bieten Infiltration ein/aus und großen oder örtlich begrenzten Hohlraum. Geschlossene Mörtelfläche mit den bisherigen beiden Abdrücken; stillgelegter Anschluss mit massivem Verschluss, Rohrloch ohne fiktives Anschlussrohr oder axialen Durchgang im verfüllten Boden. Neun Schritte; an Stelle des Blaseneinfahrens wird die Abdichtung gehalten. Die ursprüngliche offene Variante bleibt Standard. Bedienung: [START-HIER.md](START-HIER.md). Lokale Erweiterung nach Nutzerangabe; neue Hohlraumformen und Verschlusstiefe sind Darstellungsparameter. Zwei zusätzliche Filme zeigen die geschlossenen Anwendungen; siehe [WERBEVIDEOS.md](WERBEVIDEOS.md). Die bisherigen sechs Filme, PowerPoint und Druckmodelle behalten ihre jeweilige Darstellung.

**Neue Detail-Druckausgabe (20.09.2026):** Näher am Pages-Modell, mit getrennten Schrauben, Radprofilen, Mechanik und dünnen Schläuchen. Drei Motive in je zehn Größen, insgesamt 138 geprüfte STL-/3MF-Dateien einschließlich großer Segmente. Lokale Vorschau: `Druckmodelle/DSS-Flex-Detail-2026/Druckmodelle-ansehen.html`. Die bisherige robustere Ausgabe bleibt erhalten. Dünne Originalbauteile verlangen eine Slicerprüfung; kein Probedruck. [Anleitung und Reproduktion](3D-DRUCK-DETAIL.md). Große Detailassets bleiben lokal, keine neue Pages-Veröffentlichung.

**3D-Druckmodelle (20.09.2026):** Drei Motive in je zehn Größen von 8 bis 60 cm, jeweils STL und 3MF mit Farbbereichen. 40-/60-cm-Ausgaben zusätzlich segmentiert. [Offline-Vorschau](Druckmodelle/DSS-Flex-2026/Druckmodelle-ansehen.html) öffnen, Motiv und Größe wählen, mit **Seite** den Rohrschnitt betrachten; **Einfarbig ansehen** blendet die Farben aus. [Druckanleitung](Druckmodelle/DSS-Flex-2026/DRUCKANLEITUNG.md) vor dem Slicen lesen. Digitale Geometrieprüfung bestanden, kein physischer Probedruck. Mit dem Push des Modellstands `426422f` ebenfalls im Repository und auf Pages verfügbar.

**Lokaler Abgleich 20.09.2026:** GitHub-Commit `07f4d35` ist in `work/github-pages` und im äußeren Arbeitsordner übernommen, einschließlich Videos und PowerPoint. Hier kann direkt mit `npm test` und `npm run build` weitergearbeitet werden. Lokale Sicherung und Prüfstand siehe neuesten Eintrag in `FORTSCHRITT.md`. Die Synchronisation ist die Grundlage der anschließend dokumentierten lokalen Änderungen.

Früherer Veröffentlichungsstand: Modellstand `6683ef0` enthielt: kleine ovale Reparaturfläche, detailliertes Erdreich, asymmetrischer ausgewaschener Anschluss und feinere Infiltration, Messingwinkel und dickerer Opferschlauch direkt hinunter zum Roboterarm. Nutfräsen bleibt entfernt, Anschlussblase oberhalb des Schildes halbiert und Mörtelanstieg bis zur halben Blasenhöhe erhalten. Pages-Build für diesen Commit erfolgreich; Live-Animation im Browser geprüft.

## Auf einem anderen Computer beginnen

1. Repository klonen: `git clone https://github.com/katimur94/kanaltec-4-0-montageanleitung.git`
2. In den Ordner wechseln: `cd kanaltec-4-0-montageanleitung`
3. Zuerst diese Datei, [FORTSCHRITT.md](FORTSCHRITT.md) und [AGENTS.md](AGENTS.md) lesen.
4. Mit Node.js ab Version 20: `npm ci`, danach `npm test` und `npm run build`.
5. `index.html` im Browser öffnen. Für reine Präsentationen reicht die Datei `DSS-Flex-Verfahren-Praesentation.html`, ohne Node oder Installation.

Der Build erzeugt beide HTML-Dateien inhaltsgleich und bettet sämtliche für die Seite erforderlichen Ressourcen ein. Es gibt kein Backend, keine benötigte `.env` und keine erforderlichen Telegramm- oder Sprachzugänge. Die Web-Präsentation lässt sich vollständig aus diesem Repository weiterentwickeln. Die früher separat erstellten Videodateien und lokalen Produktionsskripte gehören nicht zu diesem portablen Web-Build; aktuelle Modelländerungen aktualisieren solche Videos nicht automatisch.

**Live:** https://katimur94.github.io/kanaltec-4-0-montageanleitung/

## Aktuelle Änderung 20.09.2026

**Schlauchführung nach Bildmarkierung:** Direkt hinter dem 45°-Messingwinkel fällt der Schlauch nach unten und folgt dann der vorderen Roboterarmaufnahme zur CutterCam und weiter nach hinten. Die Führung folgt der Armhöhe beim Anpressen/Absenken; kein langer diagonaler Schlauch über dem Arm. Injektionsöffnung auf 16 mm, Schlauch außen auf 11 mm vergrößert (zuvor 14/9 mm; Darstellungsmaße). Durchlass, Verschraubung und sichtbarer Mörtelstrang passend erweitert. Der kleine Zulaufabdruck ist entsprechend größer; Druckschalterabdruck unverändert, ovale Kontur behält Breite und Halbierungsregel für die Endabstände.

**Erdreich und Injektionsanschluss:** Unregelmäßiger Bodenkörper mit unebener Oberkante, Bodenstruktur, verschieden großen Steinen im Schnitt und Erdklumpen außen ersetzt die kastenartige Form. Unter dem Schild sitzt ein wiederverwendbarer 45°-Messingwinkel mit einer Rundung knapp kleiner als die des Druckschalters. Daran schließt der Opferschlauch in gleicher Achsrichtung an; er läuft neben der CutterCam bis hinter den gesamten Roboter. Schlauchfüllung und Mörtelweg folgen der Verbindung. Nutzerangabe: Opferschlauch nach jeder Verpressung/Aushärtung wechseln, Messingwinkel reinigen und wiederverwenden. Anschlussmaße sind Darstellungsannahmen; akzeptierte Mörtelfläche und Abdrücke bleiben erhalten.

**Nachkorrektur der Endabstände:** Die ovale Form und Breite sind akzeptiert. Auf Nutzerkorrektur ist der freie Längsabstand zwischen dem äußeren Rand jedes Abdrucks und der jeweiligen Mörtelrundung exakt halbiert. Gesamtfläche jetzt ungefähr 243 × 134 mm in der Rohrabwicklung; Abdrücke, Breite und Mörtelanstieg unverändert. Der unmittelbare Hauptrohrausbruch ist entsprechend kürzer, damit er innerhalb der Reparatur liegt. Maße sind Darstellungsparameter.

Die fertige Mörtelfläche folgt jetzt einer länglichen ovalen Kontur innerhalb der Schalung; Außenfräsbahn und Rohrabtrag passen dazu. Die Fläche bleibt am Scheitel örtlich begrenzt, beide Abdrücke sind unverändert. Asymmetrischer Rohrbruch, einseitig ausgewaschener tatsächlicher Bodenhohlraum, dunkle Feuchtespuren und feinere ungleichmäßige Rinnsale ersetzen die regelmäßigen Formen. Bildreferenzen und Darstellungsgrenzen: [SCHADSTELLEN-QUELLEN.md](SCHADSTELLEN-QUELLEN.md). Kanalblick mit größerem Bildwinkel zeigt die Reparatur samt umgebendem Altrohr.

Nutfräsphase und Innenwandvertiefung entfernt. Nach dem Freifräsen folgt direkt der Werkzeugwechsel; insgesamt neun Phasen. Die Rohrwand bleibt ungefräst. Auf anschließende Nutzerkorrektur steigt Injektionsmörtel nach der Hohlraumfüllung dennoch im Anschluss bis zur Hälfte der ausgefahrenen Blasenhöhe oberhalb des angepressten Schildes. Die glatte Mörtelschicht nutzt den im Modell vorhandenen Spalt zwischen Blase (Radius 39,55 mm) und Rohr (Radius 40 mm), ohne Nut oder zusätzliche Wandvertiefung. Diese Spaltmaße sind reine Darstellungsparameter. Der freie Durchgang wird von der Blase geformt; die Verpressung im Erdreich bleibt erhalten.

Die volle Blasenhöhe **oberhalb des angepressten Schildes bis zur starren Spitze** beträgt exakt 50 % des bisherigen Werts. Wellenfuß, Spitzengröße, Durchmesser und die drei Wicklungen samt Schichtdicke bleiben unverändert. `referenceTravel` hält den ursprünglichen Wickelpfad fest; `travel` bestimmt den verkürzten Ausfahrweg. Diese Kombination wird als schematische Verformung dargestellt, nicht als Simulation mit unveränderlicher Materiallänge. Die Länge des dargestellten Anschlussrohrs bleibt erhalten.

**Video-Neuproduktion 20.09.2026:** Sechs MP4 in drei Formaten sind aus Modellstand `6683ef0` neu erstellt und vollständig geprüft. Schnittfolge und deutscher Sprechertext sind auf die neun Phasen und die aktuelle Geometrie umgestellt. Mit Commit `8edfeab` auf GitHub Pages veröffentlicht; Pages-Build und Live-Wiedergabe geprüft. Alle sechs Filme und das portable Skill-Paket erfolgreich über Telegram zugestellt. Produktionsdetails und abgeschlossene Prüfungen: [WERBEVIDEOS.md](WERBEVIDEOS.md), [FORTSCHRITT.md](FORTSCHRITT.md). Die PowerPoint stammt weiterhin vom 17.09.2026 und enthält den früheren Ablauf; sie ist nicht Bestandteil dieses Videoauftrags.

**Telegram auf anderen Computern:** Der persönliche Versandablauf ist jetzt zusätzlich ohne Geheimnisse unter [.agents/skills/telegram-delivery/SKILL.md](.agents/skills/telegram-delivery/SKILL.md) versioniert. Codex kann ihn im geklonten Projekt entdecken; `python .agents/skills/telegram-delivery/scripts/install.py` installiert ihn projektübergreifend für den jeweiligen Benutzer. Der Nutzer hat zusätzlich eine private Sicherung der Telegram-Konfiguration in seinem Google Drive autorisiert. Bei fehlender lokaler Konfiguration zuerst diese Sicherung nach Skill-Anleitung verwenden; dasselbe Drive-Konto muss verbunden sein. Windows-DPAPI-Dateien nicht zwischen Rechnern kopieren. Ein sicherer Dateidownload ist für die lokale Wiederherstellung nötig; der aktuelle Connector-Link lieferte HTTP 403, die Sicherungsdaten wurden dennoch intern per Prüfsumme bestätigt. Details zu Installation, sicherer Konfiguration und Versandbestätigung stehen im Skill. Die Anleitung folgt der [offiziellen Skill-Dokumentation](https://learn.chatgpt.com/docs/build-skills).

## Vorherige Arbeiten (Stand 17.09.2026, teilweise durch obige Änderung ersetzt)

**Veröffentlichungsumfang:** Sources und beide eigenständigen HTML-Ausgaben, Fräskopfvergleich, sechs aktuelle MP4-Dateien samt Galerie/Vorschaubildern sowie `Praesentationen/DSS-Flex-Verfahren.pptx`. Die Fußzeile der Animation und die Galerie verbinden die Ausgaben miteinander. Der alte Dateiname `Kanaltec-4.0-Praesentation.html` leitet zur DSS-Flex-Präsentation weiter. Nur finale DSS-Flex-Medien sind in `.gitignore` freigegeben, ältere Filmstände und lokale QA-/Produktionslaufzeiten bleiben ausgeschlossen. Die Git-Historie wird auf Basis des vorhandenen Repository-Stands fortgesetzt. Abschluss/Live-Prüfung werden erst nach erfolgreichem Push dokumentiert.

**PowerPoint-Präsentation (17.09.2026):** `Praesentationen/DSS-Flex-Verfahren.pptx` mit zehn bearbeitbaren Folien, Darkmode, DiTom-Logo oben links, weichen Übergängen und Texteinblendungen. Sieben stumme Prozessclips und der vollständige Film mit Sprecher sind eingebettet. Jede Folie in PowerPoint gerendert und visuell geprüft, alle acht Videos in der Bildschirmpräsentation automatisch gestartet und Wiedergabefortschritt bestätigt. Bedienung und Umfang siehe `POWERPOINT.md`. Lokale Ausgabe, keine Veröffentlichung.

**Umbenennung in DSS-Flex Verfahren (17.09.2026):** Aktueller Produktname in Oberfläche, Bildexport, Film-Titelkarten und Sprechertext. Die eigenständige Präsentation heißt `DSS-Flex-Verfahren-Praesentation.html`. Neue Videos werden unter `Videos/DSS-Flex-Verfahren-2026/` mit dem Dateipräfix `DiTom-DSS-Flex-Verfahren-` bereitgestellt. DiTom bleibt Firmenname und Logo. Originaldokumente, historische Chronikeinträge, externe Quellenadressen und bestehende Repository-URLs bleiben als Herkunftsnachweis erhalten; deren Bezeichnungen sind keine aktuelle Produktbeschriftung. Die Umbenennung betrifft den lokalen Stand, keine neue Veröffentlichung.

**Tiefe Verpressung im Erdreich (17.09.2026):** `src/ground-grout.js` ergänzt einen während der Injektion wachsenden, unregelmäßigen Mörtelkörper außerhalb des Rohrs. Die Schnittansicht zeigt das umgebende Erdreich und eingeschlossene Bodenkörner; Kanal und Anschlussquerschnitt bleiben frei. Unter **Schadstelle** passt der gesamte Körper in die Ansicht. Im Film folgt auf den freien Anschluss bei Sekunden 70–73 eine eigene Schnittansicht des verpressten Bodens. Zwei Sprecherpassagen wurden angepasst. Bodenstruktur und Ausdehnung sind schematische Darstellungsparameter, keine zugesicherte Eindringtiefe.

**Drehachse hinter CutterCam korrigiert (17.09.2026):** Beim Fräsen erzeugt das gemeinsame Drehmodul die Links-/Rechtsbewegung. Frontflansch, Kamera, Armhalterung und Fräskopf drehen um die Längsachse; die Hubarme bleiben in ihrer lokalen Hubebene. Fahrwagen und Räder bleiben gerade. Die Fräsbahn wird über Modulwinkel, Hub und Längsfahrt erreicht, mit durchgehend verbundenen Arm-/Werkzeugachsen. Alle fünf DN und die Ansichten im Browser geprüft; beide HTML-Ausgaben neu gebaut. Die Filmkamera zeigt das Drehmodul während des Rundfräsens ausdrücklich mit.

**Logo, Darkmode und Mörtelabschluss korrigiert (17.09.2026):** Das Filmstudio zeichnet das originale transparente Logo oben links ohne helle Hintergrundplatte; auch Auftakt, Abschluss und lokale Galerie sind dunkel. Die Mörtelhülse folgt den beiden Nutstufen exakt. Der vollständige Füllzustand wird separat berechnet, sodass ein vorheriger Zustand knapp unter 100 % keinen offenen Rand mehr festhält. Modellprüfungen einschließlich Rücksprung-Regression für alle fünf DN bestanden, beide HTML-Dateien neu gebaut und inhaltsgleich; lokale Browserkontrolle ohne Fehler.

**Neue Prozess-Werbevideos (17.09.2026):** Aktueller Fräs- und Sanierungsvorgang einschließlich Wurzeln/Einragung und Verpressung bis über die Nut, ohne Explosionsansicht. 78 Sekunden mit originalem DiTom-Logo, je drei Formate mit neuer deutscher synthetischer Sprecherstimme/Musik oder nur Musik. Sechs fertige und geprüfte MP4-Dateien unter `Videos/DSS-Flex-Verfahren-2026/`, dort `Videos-ansehen.html` zum lokalen Abspielen. Auf Nutzerkorrektur kein Telegram-Versand. Reproduzierbare Filmproduktion unter `work/`; Details siehe `WERBEVIDEOS.md` und `work/VIDEO-PRODUKTION.md`.


**Früherer Stand: Einragender Anschluss, Wurzeln und durchgehende Verpressung.** Phase 0 schneidet zuerst den in die Haltung ragenden Rohrteil und verzweigte Wurzeln zurück und fräst anschließend eine runde Außenkontur (auf der abgewickelten Rohrinnenfläche). Phase 1 bereitet die Anschlusswand bis über die Nut vor. Nach der Hohlraumfüllung steigt Mörtel lückenlos von der zurückgefrästen Kante bis 16 mm über das obere Nutende; die innere Mörtelfläche bleibt exakt auf dem ursprünglichen Anschlussradius. Eine 3-mm-Vertiefung schafft den Platz dafür. Nutmitte weiterhin ca. 50 mm hinter der mittleren zurückgefrästen Kante. Alle zusätzlichen Maße/Schadensformen sind Darstellungsannahmen. Zeitachse, zehn Phasen und Schalungsmechanik bleiben erhalten.


**Fräskopf nach vertiefter Recherche ersetzt.** Der erste Foto-Nachbau wurde als unähnlich beanstandet. Maßgeblich ist jetzt `src/cutter.js`: längsliegender BG1-ähnlicher Motorblock, Flansch/Spindelhals oben, FrontCam vorne und gewölbte segmentierte rote Fräserkrone. Ein separater, offline drehbarer `Fraeskopf-Vergleich.html` zeigt Originalfoto und Modell nebeneinander. IBAK und SDT wurden als Primärquellen bildlich ausgewertet; die Artikelnummer des Werkzeugs im Foto bleibt ungeklärt. Aktuelle Formzuordnung und Grenzen stehen oben in `ROBOTER-QUELLEN.md`.

**Fräsen vor der Schalung:** Drei neue Phasen vor dem bekannten Ablauf: Außenabtrag um den Anschluss, umlaufende Nut ca. 50 mm hinter der mittleren Anschlusskante, Werkzeugrückzug und Wechsel zur Schalung. Außenabtrag eine Fräserbreite breit/eine Fräserstärke tief. Fräskopf nach dem Nutzerfoto vom 17.09.2026: schwarzes kantiges Motorgehäuse, Seitenbleche, kurze Metallspindel, rot-schwarzer Schneidkopf mit einzelnen Schneiden und gelbes Warnzeichen. Die erste Ausführung mit langer dünner Welle wurde ersetzt. Maße sind geschätzt: 60 mm Fräserdurchmesser, 16 mm Stärke; Nut 16 mm hoch und 6 mm tief. Kein CAD und keine bestätigte Hersteller-Rüstkonfiguration. Die neue Ansicht **Fräsdetail** zeigt den Abtrag von innen. Zehn Phasen, Vor-/Rücksprünge und alle fünf DN geprüft. Quellen, Bedienung und Prüfstand siehe Chronik.

**Neue Werbefilme:** Sechs Exporte mit Logoanimation und Modell-Highlights in drei Formaten, je mit Sprecher/Musik oder nur Musik. Details, Prüfstand und lokale Produktionsdateien: [WERBEVIDEOS.md](WERBEVIDEOS.md). Der persönliche Telegram-Skill und seine verschlüsselten Zugangsdaten bleiben außerhalb des Repositories.

**Freie 3D-Fläche:** Kameraansichten, Schnitt & Sicht, Durchblick, automatisches Drehen und Drehen/Verschieben liegen oberhalb der Modellfläche. Beschriftungen sind beim Öffnen ausgeschaltet; **Beschriftung** oder **B** blendet sie ein und aus. Bauteilinformationen und Hinweise erscheinen unterhalb der Fläche. **3D-Vollbild** oder **F** zeigt ausschließlich die 3D-Fläche, **Esc** beendet es. **Umschalt + F** schaltet das Vollbild der gesamten Seite um. Drehen, Zoomen, Leertaste und Animations-Pfeiltasten funktionieren auch im 3D-Vollbild.

Implementierung: Die externe `.scene-controls` enthält alle Ansichtswerkzeuge; `#viewport` enthält ausschließlich Canvas und die standardmäßig verborgene `#labelsLayer`. Auswahlkarte, Lade-/Fehlermeldung und Hinweise liegen außerhalb. Fullscreen API auf `#viewport`, Größenanpassung über den vorhandenen ResizeObserver; kein Neuaufbau des Modells beim Vollbildwechsel.

- Infiltration berücksichtigt die bewegte Schalung: zunächst freier Fall; beim Unterfahren werden die einzelnen Wasserstrahlen nacheinander aufgefangen. Wasser läuft außen auf dem gekrümmten Schild zu beiden seitlichen Rändern und tropft erst dort ab.
- Beim vollständigen Anpressen endet der Ablauf in den Kanal. Wasser hinter der Schalung bleibt bis zur fortschreitenden Mörtelfüllung sichtbar. Nach der Verfüllung kommt beim Absenken kein neues Wasser zurück.
- Rohr- und Schalungsschnitte sind Darstellungsoptionen, keine physisch entfernten Bauteile. Sie verändern den Wasserweg nicht. Beide Wasserabläufe bleiben auch im Rohrschnitt dargestellt; die vorhandene Geometrie verdeckt sie normal.
- Zuvor: MicroGator-CutterCam, durchgehende seitliche Schwingen, parallele untere Führungen und vordere Werkzeugachse überarbeitet. Die Ansichten **Werkzeugarm** und **Wellenkamera** sind vorhanden. Die Wellenkamera folgt dem Antrieb auch beim Fahren, Anheben, Rückspulen und DN-Wechsel.
- Die überprüften Anforderungen, Quellenzuordnungen und Weiterarbeit sind jetzt im Repository dokumentiert.

## Anforderungen, die erhalten bleiben müssen

| Bereich | Aktueller Stand / verbindliche Vorgabe aus der Zusammenarbeit |
|---|---|
| Quellen | DiTom-Montageanleitung Stand 03/2026, bereitgestellte Bilder und Nutzerkorrekturen. Kein CAD vorhanden. Unbemaßte Teile sind rekonstruiert, nicht als fertigungsgerecht bestätigt. |
| Schalung | Drei physische Lagen: Träger, flächige Dichtblase, äußeres Schild. Nur das äußere Schild hat drei getrennte Funktionsöffnungen. Träger und Dichtblase besitzen eine große ovale Freistellung. |
| Befestigung | Schildaufnahmen, Schellen, Schrauben und zugehörige Bohrungen wurden nach der PDF korrigiert; insbesondere Aufnahmen auf PDF S. 22 und Haltergewinde. |
| Öffnungen | Offene Variante: große mittlere Blasenöffnung. Geschlossene Variante: Schildmitte geschlossen. Beide: kleiner separater Mörtelzulauf und separater roter Drucksensor. Der Mörtelschlauch ist von unten am äußeren Schild befestigt und folgt ihm in der Explosion. |
| Welle | Zur Roboterkupplung gerichtetes freies Ende. Eine flache Befestigungsseite mit blindem Innengewinde, gegenüber eine geschlossene runde Wickelfläche. Die Gewindeöffnung liegt mittig unter der Schildöffnung. |
| Anschlussblase | Ausgefahrene Länge oberhalb des Schildes gegenüber 17.09.2026 halbiert; unten und an den drei Wicklungen unverändert. Eingeschraubt mit Außengewinde, nahezu bündig auf der flachen Wellenfläche. Starres rundes Fußstück, ca. 70 mm nach Nutzerangabe. Flexible Haut beginnt darüber. Kein schmaler konischer Hals. |
| Wicklung | Mindestens drei volle Windungen. Ca. 3 mm je vakuumierter Wandlage, ca. 6 mm für zwei aufeinanderliegende Wände. Drehung der Welle wickelt die Blase ab; keine Kolbenbewegung. Vor Luftfüllung vollständig abwickeln, ohne Restknick. |
| Spitze | Starr und rund, etwas kleiner als die Schildöffnung; ragt in eingezogener Stellung leicht durch diese Öffnung. |
| Bumper / Dichtblase | Während Fahrt Bumper vakuumiert und flach. Erst positionieren, dann Bumper aufblasen, dann separate Dichtblase zwischen Schild und Träger aufblasen, danach Anschlussblase abwickeln und aufblasen. |
| Klappvorrichtung | L-förmiger Aufbau mit Gelenk an der Ecke, beweglichem Schenkel und zwei Federn. Federaugen über M5×12 befestigt. T-förmige Werkzeugaufnahme anstelle des Fräskopfs. Keine erfundenen zusätzlichen starren Laschen. PDF S. 10 maßgeblich. |
| Zentraleinheit | M6×50 Pos. 24 fixiert das Zentralrohr seitlich durch den Grundkörper mit Gegenmutter. Nicht an der oberen Schildhalterung platzieren. |
| Schadstelle | Großer unregelmäßiger Ausbruch mit Infiltration. Hauptrohr und Anschluss als braunes Steinzeug. Keine weiße Rohrhülse. |
| Mörtel | Erst Schlauchfüllung, dann vom Schildzulauf aus fortschreitende Verfüllung. Graue strukturierte Oberfläche. Nach Ausschalen bündig zur Rohrinnenkrümmung, freier gerader Anschlussdurchgang ohne störenden Kegel. Sensor- und Injektionsabdrücke als geschlossene Vertiefungen. |
| Druckmeldung | Rote Meldelampe erst bei gefüllter Schadstelle; simuliert den Gegendruck auf den Sensor. Keine reale Druckberechnung. |
| Roboter | IBAK MicroGator nach Bildern und Prospekten, gekoppelt an die Klappvorrichtung. Kein zusätzlicher Fräskopf an der Schalung. Vier Räder, DN-abhängige Zusätze; ein-/ausblendbar auch während Animation. |
| Bedienung | Vollständige Schalung als Ausgangszustand; Schnitte und Ausblendungen nur über die Auswahl. Drehen, Verschieben, Zoom; Darkmode und transparent freigestelltes DiTom-Logo. Geschwindigkeit 0,1×–4×, Pfeiltasten für kleine Animationsschritte, Umschalt+Pfeil für Phasen. |
| Videos | Für spätere Neuproduktion: reine 3D-Szene, wechselnde Perspektiven/Highlights, gesprochen, keine Website-Oberfläche und keine Untertitel. Wanddicke und Fußdurchmesser nicht unnötig im Werbetext erklären. Ein neuer Export ist ein eigener Arbeitsschritt. |

## Ablauf und Koordinaten

Die Animationszeit ist eine Phasenzahl, keine reale Zeit in Sekunden. `PHASE` in `src/data.js` definiert:

| Zeitbereich | Phase |
|---|---|
| 0–1 | Einragenden Anschluss und Wurzeln zurückfräsen; kreisförmig um den Anschluss fräsen |
| 1–2 | Fräser absenken, zurückfahren, Szenenwechsel auf Schalung |
| 2–3 | Positionieren mit flachem Bumper |
| 3–4 | Bumper aufblasen / Schild anpressen |
| 4–5 | Dichtblase zwischen Schild und Träger aufblasen |
| 5–6 | Anschlussblase vollständig abwickeln, kurze Pause, danach aufblasen |
| 6–7 | Schlauch füllen und Mörtel injizieren |
| 7–8 | Aushärten |
| 8–8,999 | Anschlussblase vakuumieren / aufwickeln, Dichtblase entspannen, Bumper absenken, wegfahren |

Die Phasentasten springen auf `Phase + 0,92`, also fast an das Ende. Für Ankunfts- oder Hub-Zwischenstände die Zeitachse oder Pfeiltasten nutzen. Die Geometrie muss auch nach einem direkten Rücksprung stimmen; keine nur vorwärts funktionierenden Zustandsketten einbauen.

X verläuft längs des Kanals, Y nach oben, Z quer zum Kanal. Modelllängen sind in Millimetern angelegt. `Viewer.radius` ist `DN/2 - 12`; `RepairScene.R` ist der Rohrinnenradius `DN/2`. Diese Radien nicht verwechseln.

`updateParts()` stellt Basis-/Explosionspositionen her. Danach wendet `processPose()` den Prozess an. Die fahrende Einheit liegt in `Viewer.model`; Rohr, Schaden und zurückbleibender Mörtel liegen im festen Kontext. Wasser gehört zum festen Schaden und bekommt die aktuelle Schildposition explizit übergeben. Nicht zusätzlich die Fahrttranslation auf das Wasser anwenden. Beim Roboter bleibt die Fahrgestellhöhe unverändert; die Werkzeugaufnahme folgt dem Schildhub. Die geringe Längskorrektur des Fahrwagens hält die angenäherten parallelen Schwingen geschlossen.

## Wo ändern?

| Datei | Zuständigkeit |
|---|---|
| `src/main.js` | Bedienelemente, Modus-/DN-Wechsel, Tastatur, Wiedergabe, lokale Einstellungen |
| `src/model.js` | DiTom-Bauteile, Bohrungen, Anordnung, Explosion, Prozesspositionen, Kameras und Nachführung |
| `src/bladder.js` | Wickelgeometrie, starre Blasenteile, Montagefuß, Restwicklung und Freigabe der Inflation |
| `src/robot.js` | MicroGator, CutterCam, Schwingen, Radkonfigurationen und Kopplung |
| `src/milling.js` | Fräskopf nach Foto, geschätzte Werkzeugmaße, Fräszeiten und Kontaktbahn |
| `src/cutter.js` | Recherchierte Motor-/Fräskopfgeometrie; gemeinsam für Animation und Fotovergleich |
| `src/repair.js` | Rohrbruch, Infiltration, `shieldWaterPath`, Tropfen, Schlauch-/Mörtelfüllung |
| `src/repair-surface.js` | Materialoberflächen, bündige Gussfläche und Abdrücke |
| `src/ground-grout.js` | Erdreich, wachsender äußerer Verpresskörper und gefüllte Schnittansicht |
| `src/data.js` | Varianten, PDF-Stücklisten, Phasen, Quellenlinks; unsichere Teile ausdrücklich markieren |
| `src/closure.js` | Anwendungsauswahl und Beschreibungen für geschlossene Schalung; ursprüngliche PDF-Stücklisten unverändert |
| `src/assets.json` | Eingebettete PDF, Seitenbilder und Fotos; keine Zugangsdaten |
| `src/index.template.html`, `src/style.css` | Seitenaufbau und Gestaltung |
| `work/build.mjs` | Portabler Build der beiden eigenständigen HTML-Dateien |
| `work/check-model.mjs` | DiTom-Geometrie, Blasenablauf, Mörtel, Wasserführung und Wellenkamera über alle fünf DN |
| `work/check-robot.mjs` | Kupplung, Parallelführung, Radbewegung und Rohrfreigang über alle fünf DN |
| `work/check-milling.mjs` | Werkzeugkontakt, Außenabtrag, unveränderter Anschlussquerschnitt, feste Gliedlängen, Wiederverfüllung und Rücksprünge über alle fünf DN |
| `work/check-closure.mjs` | Geschlossene Schildmitte, erhaltene Funktionsöffnungen, massiver Verschluss, Rohrloch ohne Anschluss, trockene/nasse Fälle und Rücksprünge über alle fünf DN |

Nicht die minifizierte Ausgabe in `index.html` bearbeiten. Quellen ändern und neu bauen. Auf dem ursprünglichen Arbeitscomputer existiert zusätzlich ein äußerer Entwicklungsordner mit `work/runtime` und `work/prepare-github.mjs`; das ist keine Voraussetzung auf anderen Computern. Im geklonten Repository kommen Three.js und esbuild ausschließlich über `npm ci` aus der Lockdatei.

## Grenzen und offene Zuordnungen

- Zentraleinheit Pos. 20 (M6×90) und Pos. 21 (M6-Sicherungsmutter) bleiben in der Stückliste dokumentiert, aber unplatziert: die Einbaulage ist nicht eindeutig belegt. Sie nicht wieder ungeprüft an die Klappvorrichtung setzen.
- DN 600 enthält doppelt wirkende Stücklisteneinträge für die Schildlagen. Die Aliaszuordnung in `src/data.js` vermeidet sechs statt drei physische Lagen. Diese Unsicherheit ist in der Oberfläche beschrieben.
- Ovalkontur, nicht bemaßte Bohrungsabstände, verdeckte Teile und Anschlussmaße sind angenähert. Für neue Präzisionskorrekturen die konkrete Originalseite und Fotos vergleichen.
- IBAK nennt Zusatzbereiche; die einzelnen Radmaße und Spurweiten im Modell sind keine verifizierte Rüsttabelle. Details: [ROBOTER-QUELLEN.md](ROBOTER-QUELLEN.md). Die allgemeine T66/T76/PANORAMO-Radübersicht nicht auf MicroGator übertragen.
- Infiltration, Mörtelfluss, flexible Blasenfalten und Hubbewegung sind eine deterministische Verfahrensdarstellung, keine Strömungs-, Druck-, Material- oder Kollisionssimulation des gesamten Systems. Die korrigierten Wasserbahnen berücksichtigen die Schildhülle; weitere reale Hindernisse oder neue Schadensformen müssen bei Änderungen erneut geprüft werden.
- Die Wellenkamera ist eine virtuelle Detailkamera und kein optisch kalibriertes Bild der CutterCam.
- Frühere Videos bilden frühere Modellstände ab. Bei einem gewünschten neuen Export den aktuellen Web-Modellstand verwenden, nicht ältere Film-Bundles ungeprüft veröffentlichen.

## Prüfen und veröffentlichen

1. `npm test` muss für alle fünf Größen bestehen.
2. `npm run build` ausführen. Beide HTML-Ausgaben mit den Quellen committen.
3. Im Browser prüfen: Anfahrt, Zwischenposition, seitlicher Ablauf bei abgesenktem Schild, Übergang zum Anpressen, Ende der Tropfen bei angepresstem Schild, Verfüllung, Rückfahrt ohne neue Infiltration. Rohr-/Schildschnitt ändern und rückwärts durch die Zeitachse springen.
4. Wellenkamera, Roboter ein/aus, DN 300 und DN 700 sowie Drehen/Verschieben kurz prüfen. Browserkonsole auf Fehler kontrollieren.
5. [FORTSCHRITT.md](FORTSCHRITT.md) ergänzen und diesen Projektstand aktualisieren. Ergebnis und verbleibende Grenzen ehrlich festhalten.
6. `git diff --check`, Commit und Push auf `main`. Pages verwendet den Repository-Stammordner mit `.nojekyll`.
7. Den Pages-Build für den **neuen Commit** und danach die tatsächliche Live-Seite prüfen. Ein erfolgreicher alter Build genügt nicht. Falls GitHub CLI verfügbar ist: `gh api repos/katimur94/kanaltec-4-0-montageanleitung/pages/builds/latest`. Bei ausbleibendem Build kann ein neuer Pages-Build über dieselbe API mit `--method POST` angefordert werden.

Die Oberfläche speichert Theme, Sichtbarkeit und Geschwindigkeit lokal im Browser. Für eine unveränderte Ausgangsansicht diese Einstellungen kontrollieren; ein gespeicherter Schnitt ist nicht automatisch ein Modellfehler.
