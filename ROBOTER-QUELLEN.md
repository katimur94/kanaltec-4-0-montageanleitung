# MicroGator: Quellen und Modellzuordnung

## 17.09.2026 – Drehachse hinter CutterCam, Hubarme ohne seitliches Gelenk

Nutzerkorrektur: Links-/Rechtsbewegung entsteht an der Drehachse unmittelbar hinter der Kamera; die Arme dienen ausschließlich dem Heben/Senken. Erneut mit dem [IBAK-Fräserprospekt](https://www.ibak.de/fileadmin/website/ansprechpartner/flyer_prospekte/fraeserprospekt_a4_de_en.pdf), gedruckte S. 6–7, abgeglichen: Punkt 4 beschreibt das Drehmodul, Punkt 5 die separate vierte Achse zum Kippen des Motors.

`src/robot.js` besitzt jetzt eine gemeinsame vordere Baugruppe mit Längsdrehachse hinter CutterCam. Frontflansch, Kamera, Armhalterungen, Hubschwingen, Führungen und Fräskopf drehen gemeinsam. Die Arme bewegen sich ausschließlich in der lokalen Hubebene; es gibt keine seitliche Verschiebung und kein seitliches Schwenkgelenk an den Armen. Der Fahrwagen samt Rädern bleibt unverdreht, die Leitungen folgen dem Übergang zur gedrehten Front. `src/model.js` löst die Fräsbahn über Modulwinkel, Hub und Längsfahrt. Die Werkzeugaufnahme bleibt dabei mit den Armenden verbunden. Achslage und Maße sind weiterhin fotografische Modellannahmen, keine neue Herstellerbemaßung.

Geprüft: feste Gliedlängen, Werkzeugkontakt, verbundene Aufnahme, nur ebene Armbewegung, gemeinsame Kameradrehung und stabiler Fahrwagen über alle fünf DN; Rücksprünge und Schalungsphasen bleiben erhalten. Das Filmstudio zeigt das Drehmodul beim Rundfräsen zusätzlich in einer weiteren Ansicht.

## 17.09.2026 – Ergänzung aus Nutzerkorrektur

Einragung, Wurzeln, kreisförmige Fräsfläche und durchgehende Verpressung bis über die Nut sind aktuelle Nutzeranforderungen. Der zurückgefräste mittlere Rand liegt im Modell 18 mm über dem Hauptrohrscheitel; die Nutmitte liegt 50 mm darüber. Zusätzliche 3-mm-Vertiefung bis 16 mm hinter das obere Nutende als Platz für Mörtel bei unverändertem Durchgang. Das sind Darstellungsannahmen; keine neue IBAK-Maß- oder Verfahrensfreigabe. Das recherchierte Fräskopfmodell bleibt erhalten.

## 17.09.2026 – Vertiefte Recherche und neuer Fräskopf

Die vorherige Nachbildung wurde vom Nutzer als unähnlich zurückgewiesen. Sie ist keine freigegebene Originalrekonstruktion. Der erneute Abgleich stützt sich auf:

- [IBAK-Fräserprospekt](https://www.ibak.de/fileadmin/website/ansprechpartner/flyer_prospekte/fraeserprospekt_a4_de_en.pdf), gedruckte S. 6–7: kompakter längsliegender Motorblock, oben aufgesetzte Spindel mit Flansch und Hals, FrontCam vor dem Motor sowie vierte Achse. S. 16–17 trennt Standardmotor BG1 und BG0 für tieferliegende Anschlussbereiche. Verwendet wird die BG1-Bauform als Formreferenz; keine Vermischung mit MicroGator 150 oder Air.
- [IBAK-Anwenderbericht](https://www.ibak.de/infos/magazin/artikel/microgator-leistungsstark-und-zuverlaessig): Pilzkopf mit Diamantbeschichtung für vorbereitendes Fräsen; andere Werkzeuge für andere Bearbeitungsschritte.
- [SDT-Werkzeugkatalog für IBAK-kompatible Roboter](https://sdt-tec.com/us/downloads/getpdf/SUJBSy1TRFQtMDQtMjAyNV8w), S. 14–17: gewölbte Pilzköpfe mit radialen/seitlichen Segmenten, Scheibenwerkzeuge für umlaufende Nuten, weitere Kopfvarianten. SDT ist Werkzeughersteller; damit ist die Artikelnummer des roten Werkzeugs im Nutzerfoto **nicht** identifiziert.
- [Nutzerfoto](references/fraeskopf-nutzerfoto.jpg): rote Krone mit einzelnen rauen dunklen Segmenten, schwarzer Motorblock, kurze Spindel, Frontoptik und Warnmarkierung.

`src/cutter.js` ersetzt den hochkant stehenden Kasten durch den längsliegenden Motor, verschraubten Flansch, konischen Spindelhals, metallischen Werkzeugstutzen, vordere FrontCam und gewölbte rote Krone. Die Schalungsaufnahme wird beim Fräsen durch den zugehörigen Fräskopfträger ersetzt. Motorlage und Werkzeugkontakt berücksichtigen jetzt den seitlichen Versatz der Spindel. Gehäusemaße, verdeckte Befestigungen und Werkzeugsegmentzahl bleiben Näherungen.

Aktuelle Darstellungsparameter: Fräserdurchmesser 60 mm, Profilstärke 16 mm, Nut 16 mm hoch/6 mm tief, 50 mm hinter der mittleren Anschlusskante. Werkzeugmitte 205 mm über und 62 mm vor dem modellierten Trägerursprung. Diese Angaben sind **keine Herstellermaße**. Der Fotovergleich `Fraeskopf-Vergleich.html` zeigt dieselbe Geometrie wie die Animation frei drehbar neben dem Originalfoto. Frühere Maße im folgenden historischen Abschnitt sind überholt.

## Früherer Entwurf 17.09.2026 – inzwischen ersetzt

Zusätzliche Formreferenz: Nutzerfoto vom 17.09.2026, [Fräskopf und Fräser](references/fraeskopf-nutzerfoto.jpg). Schwarzes kantiges Gehäuse, metallische Seitenplatten und Befestigungen, kurzer abgestufter Werkzeugstutzen, roter Träger mit dunklen Schneiden sowie gelbes Warnzeichen nachgebildet. Kein Hersteller-CAD; verdeckte Details und Maße bleiben geschätzt.

Vor dem Schalungseinsatz zeigt die Animation nun ein getrenntes Fräswerkzeug: umlaufender Außenabtrag (eine Werkzeugbreite, eine Werkzeugstärke tief), danach eine Ringnut ca. 50 mm hinter der mittleren Anschlusskante. Diese Verfahrensvorgabe stammt vom Nutzer. 32 mm Fräserdurchmesser, 10 mm Stärke, die feste 240-mm-Werkzeugbaugruppe und deren räumliche Führung sind Darstellungsannahmen, keine neu belegten IBAK-Maße oder Rüstanweisungen. Der Werkzeugwechsel erfolgt als Szenenwechsel außerhalb der Schadstelle. Während der Schalungsphasen bleibt der zusätzliche Fräser ausgeblendet; bisherige Kupplung und Schwingenlängen bleiben erhalten.

Prüfstand: 13.09.2026. Ausgangspunkt sind die zwei vom Nutzer bereitgestellten Fotos und die [IBAK-Downloadseite](https://www.ibak.de/en/info/flyers-and-brochures).

## Belegte Bauform und Größenbereiche

- [Fräserprospekt DE/EN](https://www.ibak.de/fileadmin/website/ansprechpartner/flyer_prospekte/fraeserprospekt_a4_de_en.pdf), gedruckte S. 6–7 und 14–15: gegliederter Fahrwagen, vorderes Drehmodul, Hubarm, CutterCam, hinteres Klappgelenk, PUR-Profilräder und Luftreifen. S. 16–17 nennt Körperhüllkreis 150 mm, starre Länge 720 mm, Hubweg 200 mm sowie Fahrwagenzusätze für DN 350–600 und DN 600–800. 1040 mm Gesamtlänge bezieht den Fräsmotor ein und ist keine Gesamtlänge der DiTom-Kombination.
- [MicroGator Air EN](https://www.ibak.de/fileadmin/website/ansprechpartner/flyer_prospekte/microgator_air_10s_en.pdf), gedruckte S. 6–7: Zusatzrahmen mit vier Getriebegehäusen, Schnellbefestigungen, Nabenadaptern und großem Radsatz. Ergänzender Formvergleich, kein Austausch des Robotermodells gegen die Air-Version.
- [Systemübersicht](https://www.ibak.de/fileadmin/website/ansprechpartner/flyer_prospekte/uebersicht_fraeser_01.pdf), Innenseite: Seitenansichten und Werkzeug-/Packeraufnahme.
- [DiTom-Anwenderbericht](https://www.ibak.de/infos/magazin/artikel/anschlusseinbindung-mittels-injektionsmoertel): bestätigt die Verwendung des MicroGator mit DiTom-Schalungssystem. Das dort gezeigte DSS-Flex ersetzt nicht die Kanaltec-4.0-Montagezeichnung.

## Nicht als MicroGator-Rüstmaße übernommen

Die [allgemeine Radsatz-PDF](https://www.ibak.de/fileadmin/website/ansprechpartner/flyer_prospekte/radsaetze_en.pdf) ordnet die aufgeführten Räder T66/T76 und PANORAMO zu. Sie liefert keine eindeutige MicroGator-Radnummer je DN. Auch die Sanierungsneuheiten 2023 und Neuheiten 2026 enthalten keine solche Tabelle.

Das separat gefundene [Universal-Fahrwagenzusatz-Datenblatt](https://www.ibak.de/fileadmin/website/ansprechpartner/newsletter/250106_newsletter_produktinfo_fahrwagenzussatz_a4_01.pdf) beschreibt eine weitere Bauform. Die dortigen Bereiche für T76 mit HEK sind nicht auf MicroGator zu übertragen. Das Modell folgt den zwei klassischen Zusatzbereichen aus dem Fräserprospekt, nicht einer Vermischung beider Ausführungen.

## Umsetzung in der Präsentation

| Gewählte Schalung | Dargestellter Roboteraufbau |
|---|---|
| DN 300 | Grundfahrwagen mit braunen PUR-Profilrädern |
| DN 350–400 | Zusatz DN 350–600, schmale Spur |
| DN 450–500 | Zusatz DN 350–600, mittlere Spur |
| DN 550–600 | Zusatz DN 350–600, breite Spur |
| DN 650–700 | Zusatz DN 600–800, größerer Radsatz und breiterer Tragrahmen |

Die Bereichsgrenzen der Zusatzfamilien sind Herstellerangaben. Die Auswahl innerhalb überlappender Bereiche, einzelnen Raddurchmesser, Spurweiten, Achsversätze und verdeckten Anschlussmaße sind fotografisch angenäherte Darstellungsparameter. Es liegt keine vollständige bemaßte MicroGator-Rüst-/Montageanleitung vor. Die Tabelle ist deshalb keine praktische Rüstanweisung.

`src/robot.js` trennt diese Größenparameter vom gleichbleibenden Grundkörper. Pro DN entstehen neue Radgeometrien, Spurweiten, Nabenadapter und Zusatzrahmen. Die Radlage wird aus der vollständigen rotierenden Reifenhülle bestimmt. Der gekoppelte Hubarm folgt dem Schalungshub, während der Fahrwagen auf den Rädern bleibt. Die DiTom-Positionsnummern und Stücklisten werden nicht mit Roboterteilen erweitert.

Der Werkzeugträger folgt nun der durchgehenden seitlichen Schwinge und den parallelen unteren Führungen aus den Seiten- und Schrägansichten. Die vordere Querachse trägt die Werkzeugaufnahme; das vorherige zusätzliche serielle Ellbogengelenk entfällt. Die nachgebildete CutterCam hat zwei quer liegende gerundete Gehäuseteile, einen geschwenkten Optikkopf mit rechteckigem Fenster und vier LED-Fenstern, einen abgestuften Metallbügel, seitliche Anschlüsse und eine Reinigungsleitung. Formvergleich: Fräserprospekt gedruckte S. 6–7 und 14–15 sowie CutterCam-Einzelbild im Air-Prospekt S. 6. Diese Formmerkmale sind sichtbar; genaue Abmessungen, verdeckte Lagerung und Gelenkabstände bleiben angenähert.

Die Animation verwendet eine parallele Führung mit festen Gliedlängen. Eine kleine Längskorrektur des Fahrwagens hält die Schalungsaufnahme beim Hub an derselben Stelle; die Räder rollen entsprechend mit. Dies ist die kinematische Umsetzung im Erklärmodell, keine vom Hersteller belegte Steuerungssequenz. Die virtuelle **Wellenkamera** folgt dem Schalungsantrieb und ist kein kalibriertes Livebild der CutterCam.

Geprüft werden alle fünf Varianten: Anschlusslage, feste Schwingen-/Führungslängen, Parallelität, rollende Räder, Rohrfreiheit und eingeschaltete Darstellung ohne zusätzliche Fräseinheit. Die Wellenkamera wird über Fahrt, Anheben, Abwickeln und rückwärtige Zeitsprünge geprüft, einschließlich frei gewählter Verschiebung und unveränderter Sichtbarkeitseinstellungen. Wiederholte Details werden nach Material zusammengefasst, um die Darstellung interaktiv zu halten.
