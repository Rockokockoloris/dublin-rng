# Die Hundis – Stammtisch-Team-Auslosung

🔗 **Live:** https://rockokockoloris.github.io/dublin-rng/

Mobile-first PWA für den Stammtisch: lost Zweier-/Dreier-Teams für die Monate des Jahres aus, lockert das Ganze mit kleinen Multiplayer-Challenges auf und lässt sich auch komplett ohne Challenges als reine Party-Challenge-Maschine nutzen.

## Ablauf

1. **Startbildschirm** – Wahl zwischen zwei Modi:
   - **🎲 Auslosung** – vollständiger Ablauf mit Team-Verlosung
   - **🔥 Nur Challenges** – beliebig viele Challenges hintereinander, ohne Team-Auslosung
2. **Setup** – wer ist heute dabei (Anwesenheits-Auswahl, bestimmt den Spieler-Pool für Challenges), und im Auslosung-Modus zusätzlich: wer steht nicht für die Organisation der Stammtischfahrt zur Verfügung.
3. **Auslosung-Modus:** 6 Zweier-Teams (je ein Zweimonats-Zeitraum, Jan/Feb bis Nov/Dez) + 1 Dreier-Team (organisiert die Stammtischfahrt) werden nacheinander aufgedeckt, dazwischen zufällig eingestreute Challenges. Am Ende steht eine Gesamtübersicht aller Teams.
   **Nur-Challenges-Modus:** nach jeder Challenge direkt die nächste, bis "Fertig" gedrückt wird.
4. Vor jeder Challenge läuft ein kurzes Game-Show-Intro (bellender Hund, "CHALLENGE!"), das per Antippen gestartet wird.

Die 15 Namen sind aktuell fest im Code hinterlegt ([app.js](app.js), `PRESET_NAMES`).

## Challenges

| Challenge | Kurzbeschreibung |
|---|---|
| 🐾 Reaktionsduell | Wer nach dem Signal zuerst tippt, gewinnt – zu früh verliert automatisch |
| 🐾 Tic-Tac-Toe | Klassische Runde, abwechselnd |
| 🐾 Tap-Sprint | 10 Sekunden lang so oft wie möglich tippen |
| 🐾 Perfekte 5 Sekunden | Ohne sichtbaren Timer möglichst nah an exakt 5s tippen |
| 🐾 Hot Potato | Handy reihum weitergeben, bis die Kartoffel nach zufälliger Zeit explodiert – kein Tracking, wer verliert, entscheidet die Gruppe |
| 🐾 Steady Hand | Mit dem Finger einer Spur von START zu ZIEL folgen, ohne den Rand zu berühren |
| 🐾 Memory-Duell | Kartenpaare abwechselnd aufdecken, wer mehr Paare hat gewinnt |

Die Spielauswahl ist gewichtet zufällig ([challenges.js](challenges.js), `pickWeightedGame`) – gerade gezogene Challenges werden für die nächsten Runden unwahrscheinlicher, damit mehr Abwechslung reinkommt.

## PWA / Offline

Die App ist als installierbare, komplett offline-fähige PWA aufgesetzt:
- [manifest.json](manifest.json) – Name, Icon, `display: standalone`
- [sw.js](sw.js) – Service Worker cached alle Kerndateien (HTML/CSS/JS, Hintergrundbild, Google Fonts) beim ersten Laden
- Einmal online geladen, läuft die App auch ganz ohne Netz weiter (z. B. im Pub-Keller ohne Empfang)
- Eine History-Sperre in [app.js](app.js) fängt versehentliche Zurück-Wischgesten ab, damit der laufende Zustand (z. B. mitten in einer Challenge) beim Herumreichen des Handys nicht verloren geht

## Dateistruktur

- `index.html` – Markup, drei bis vier Screens (Welcome, Setup, Reveal, Summary)
- `styles.css` – komplettes Styling, mobile-first
- `app.js` – Kernlogik: Setup, Team-Auslosung, Navigation zwischen Screens
- `challenges.js` – alles rund um die Mini-Games (Auswahl, Intro-Animation, einzelne Spiele)
- `manifest.json`, `sw.js`, `assets/icon.svg` – PWA-Grundlagen
- `assets/app_background.jpeg` – Hintergrundfoto

## Lokal testen

Einfach den Ordner über einen Server ausliefern, z. B.:

```
python3 -m http.server 8000
```

und dann `http://localhost:8000` öffnen. Für Service-Worker-Tests reicht `localhost` als sicherer Kontext aus.

## Deployment auf GitHub Pages (kostenlos)

1. Repo auf GitHub pushen.
2. In den Repo-Settings → **Pages** → unter "Build and deployment" als Source **Deploy from a branch** wählen, Branch `main`, Ordner `/ (root)`.
3. Nach ein paar Minuten ist die Seite unter `https://<username>.github.io/<repo>/` erreichbar.

## Erweiterbarkeit

Neue Challenges lassen sich in [challenges.js](challenges.js) ergänzen: Render-Funktion schreiben, in `CHALLENGE_GAMES`, `GAME_NAMES` und der `renderers`-Map in `renderChallenge` eintragen – die restliche Logik (Auswahl, Intro, Gewichtung) greift automatisch.
