# Stammtisch-Team-Auslosung

🔗 **Live:** https://rockokockoloris.github.io/dublin-rng/

Statische Website zum Auslosen von Stammtisch-Teams: 15 Namen eingeben, es werden 6 Zweier-Teams (je ein Zweimonats-Zeitraum) und 1 Dreier-Team (organisiert die Jahresfahrt) gewürfelt. Die Teams werden einzeln nacheinander per "Weiter"-Klick aufgedeckt, am Ende steht eine Gesamtübersicht.

## Lokal testen

Einfach `index.html` in einem Server ausliefern, z. B.:

```
python3 -m http.server 8000
```

und dann `http://localhost:8000` öffnen.

## Deployment auf GitHub Pages (kostenlos)

1. Repo auf GitHub pushen.
2. In den Repo-Settings → **Pages** → unter "Build and deployment" als Source **Deploy from a branch** wählen, Branch `main`, Ordner `/ (root)`.
3. Nach ein paar Minuten ist die Seite unter `https://<username>.github.io/<repo>/` erreichbar.

## Geplante Ausbaustufe

Ein Trinkspiel-Element soll den Auslosungs-Ablauf zukünftig auflockern. Die Reveal-Logik in `app.js` arbeitet mit einer Liste von "Steps" (`buildSteps`) – neue Step-Typen (z. B. `challenge`) lassen sich dort einfügen, ohne die restliche Logik umzubauen.
