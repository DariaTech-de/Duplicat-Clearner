# Duplicat-Clearner

Ein lokales Tool zum Finden und sicheren Bereinigen von mehrfach vorhandenen Dateien, Bildern und Videos.

## Ziel

Duplicat-Clearner soll für Kundenordner, Fotoarchive, Videoarchive, alte Backups und gemischte Datenbestände eingesetzt werden. Die App läuft lokal, lädt nichts in eine Cloud hoch und verschiebt Dateien standardmäßig zuerst in Quarantäne oder in den Windows-Papierkorb.

## Funktionen

- mehrere Ordner gleichzeitig scannen
- Duplikate auch ordnerübergreifend finden
- exakte Duplikate per SHA-256 erkennen
- ähnliche Bilder per Bild-Fingerprint erkennen
- Bilder, Videos, Dokumente, Archive oder alle Dateitypen scannen
- Mindestgröße und Maximalgröße filtern
- Ordner/Begriffe ausschließen, zum Beispiel `temp`, `cache`, `.git`
- Auswahlregel wählen: älteste, neueste, größte, kleinste Datei, höchste Bildauflösung usw.
- Bildvorschau direkt in der Oberfläche
- Bereinigung per Quarantäne oder Windows-Papierkorb
- JSON- und CSV-Berichte exportieren
- Windows-EXE per GitHub Actions bauen

## Sicherheit

Das Tool löscht Dateien nicht sofort endgültig. Endgültiges Löschen ist in der API bewusst gesperrt. Empfohlen ist:

1. Erst scannen.
2. Vorschläge kontrollieren.
3. Bericht als CSV/JSON exportieren.
4. Dateien in Quarantäne oder Papierkorb verschieben.
5. Nach Kontrolle final löschen.

Quarantäne-Ordner pro Scan-Root:

```text
.quarantine-duplicates
```

Beispiel:

```text
D:\Kundendaten\.quarantine-duplicates
```

## Typischer Kunden-Workflow

1. Kundenordner zeilenweise eintragen:

```text
D:\Kunde\Fotos
D:\Kunde\Videos
E:\Altes Backup
```

2. Kategorien wählen, zum Beispiel Bilder und Videos.
3. Optional ähnliche Bilder aktivieren.
4. Als Behalte-Regel zum Beispiel `Bild mit höchster Auflösung behalten` auswählen.
5. Analyse starten.
6. Ergebnisse prüfen.
7. CSV-Bericht exportieren.
8. Empfohlene Duplikate auswählen.
9. In Quarantäne oder Papierkorb verschieben.

## Windows-App über GitHub Actions bauen

Die GitHub Action liegt hier:

```text
.github/workflows/build-windows.yml
```

Sie läuft automatisch bei jedem Push auf `main` und kann zusätzlich manuell gestartet werden:

1. In GitHub auf **Actions** gehen.
2. **Build Windows App** auswählen.
3. Auf **Run workflow** klicken.
4. Nach dem Build unten unter **Artifacts** die Datei `Duplicat-Clearner-Windows` herunterladen.
5. ZIP entpacken und `Duplicat-Clearner.exe` starten.

Die EXE startet lokal einen kleinen Webserver und öffnet automatisch:

```text
http://127.0.0.1:8787
```

## Start unter Windows ohne EXE-Build

1. Repository herunterladen oder klonen.
2. `start-windows.bat` doppelt anklicken.
3. Im Browser öffnen:

```text
http://127.0.0.1:8787
```

## Start unter Linux oder macOS

```bash
chmod +x start-linux-mac.sh
./start-linux-mac.sh
```

Danach öffnen:

```text
http://127.0.0.1:8787
```

## Hinweis zu ähnlichen Bildern

Die ähnliche Bildersuche nutzt einen Difference-Hash. Das erkennt häufig verkleinerte, komprimierte oder leicht geänderte Versionen eines Bildes. Es ist bewusst als Vorschlag zu verstehen und sollte vor der Bereinigung kontrolliert werden.

## Nächste sinnvolle Profi-Funktionen

- echter Windows-Installer mit Startmenü-Eintrag
- Scan-Fortschritt in Echtzeit
- gespeicherte Scan-Profile pro Kunde
- Undo-Ansicht für Quarantäne
- Video-Fingerprint über einzelne Frames
- Musik-Duplikate über Audio-Fingerprinting und Tags
- automatische Signatur der EXE gegen SmartScreen-Warnungen
