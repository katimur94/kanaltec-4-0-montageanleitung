# Hinweise für die Weiterarbeit

## Einstieg

Vor Änderungen `PROJEKTSTAND.md`, `FORTSCHRITT.md` und für Roboterthemen `ROBOTER-QUELLEN.md` lesen. Die aktuelle Nutzeranweisung hat Vorrang. Die ursprüngliche Zusammenarbeit ist in diesen Dateien zusammengefasst; der Chat auf einem anderen Computer wird nicht vorausgesetzt.

## Modell und Quellen

- In `src/` arbeiten und die beiden eigenständigen HTML-Ausgaben neu bauen; minifizierte HTML-Bundles nicht von Hand korrigieren.
- Bereits korrigierte Befestigungen, Wickelmechanik, Schildlagen und Phasenfolge erhalten. Konkrete Änderungen nach PDF/Fotos/Nutzerkorrekturen vornehmen; fehlende Maße nicht als Herstellerangaben ausgeben.
- Unsichere Positionszuordnungen in `src/data.js` ausdrücklich beibehalten, bis neue Belege vorliegen. Insbesondere M6×90 Pos. 20 und Mutter Pos. 21 nicht ungeprüft platzieren.
- Alle fünf DN-Varianten berücksichtigen. Direkte Vor-/Rücksprünge müssen korrekte Posen ergeben. Schnitte und Ausblendungen sind Ansichten und dürfen die physische Animation nicht verändern.
- Keine Zugangsdaten, `.env`, Telegramm-Chat-IDs, lokale Benutzerpfade oder Logdateien in veröffentlichte Assets übernehmen. Der Web-Build benötigt keine Geheimnisse.

## Prüfen und dokumentieren

- Im geklonten Repository: `npm ci`, `npm test`, `npm run build`. Vorhandene Prüfungen ergänzen, wenn sich relevante Geometrie oder Bewegungslogik ändert.
- Ergebnis visuell im Browser prüfen; bestandene Zahlenprüfungen allein belegen keine originalgetreue Form. Bei Wasseränderungen auch vollständiges Schild, Ankunft, Anpressen, Verfüllung und Rücksprung ansehen.
- Jede abgeschlossene Änderung in `FORTSCHRITT.md` ergänzen; `PROJEKTSTAND.md` aktuell halten. Bedienungsänderungen zusätzlich in `START-HIER.md` und gegebenenfalls README erklären. Nur tatsächlich erfolgte Prüfungen/Veröffentlichungen als erledigt dokumentieren.
- Beide gebauten HTML-Dateien gemeinsam mit den Quellen committen. Bei beauftragter Veröffentlichung Pages auf dem neuen Commit und die Live-Seite prüfen. Kein Force-Push und keine neue Historie statt der bestehenden Fortschritte.

## Ursprünglicher lokaler Entwicklungsordner

Falls zusätzlich zum Repository ein äußerer Arbeitsordner mit `work/runtime` und `work/prepare-github.mjs` vorhanden ist: Änderungen dort nach dem bestehenden Build-/Übernahmepfad synchronisieren. Der portable Repository-Code muss weiterhin ohne diesen äußeren Ordner funktionieren. Neue Dokumente bei der Übernahme mitnehmen; keine privaten lokalen Arbeitsdateien pauschal kopieren.

## Telegram-Versand auf jedem Arbeitscomputer

Bei „schick mir das über Telegram/Telegramm“ den Skill `.agents/skills/telegram-delivery/SKILL.md` verwenden. Er enthält Versandwerkzeuge und kann mit seinem `scripts/install.py` auch projektübergreifend im Benutzerprofil installiert werden. Zuerst `send.py --check`; der neue Rechner braucht einen eigenen sicheren Zugang, falls noch keiner vorhanden ist. Keine Zugangsdaten ins Repository oder in den Chat übernehmen. Eine konkrete Versandbitte autorisiert die angefragten Ergebnisse, keine pauschalen späteren Sendungen.
