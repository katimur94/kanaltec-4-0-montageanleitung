# MicroGator: Quellen und Modellzuordnung

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

Geprüft werden alle fünf Varianten: Anschlusslage, Armgliedlängen, rollende Räder, Rohrfreiheit und eingeschaltete Darstellung ohne zusätzliche Fräseinheit. Wiederholte Details werden nach Material zusammengefasst, um die Darstellung interaktiv zu halten.
