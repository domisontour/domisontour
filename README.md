# Domis on Tour – Webseite

Reiseblog von Herr Domi & Frou Domi: www.domisontour.ch

## Inhalte pflegen (ohne Code)
1. https://app.pagescms.org öffnen und mit GitHub anmelden
2. Repository `domisontour/domisontour` öffnen
3. **Tagebuch**, **Reisen** oder **Über uns und Links** wählen, bearbeiten, speichern
4. Nach dem Speichern ist die Seite nach ca. 1–2 Minuten aktualisiert

### Fotos vorbereiten
- In Lightroom exportieren: lange Kante **2048 px**, JPG Qualität **80**
- Metadaten: **„Nur Copyright“** und **Standortinformationen entfernen** (sonst sind GPS-Daten im Foto)
- Videos nicht hochladen, sondern auf Instagram/YouTube verlinken

### Koordinaten für die Karte
In Google Maps Rechtsklick auf den Ort, erste Zahl = Breitengrad, zweite Zahl = Längengrad.

## Technik
- [Astro](https://astro.build) (statische Seite), Deutsch unter `/`, Englisch unter `/en/`
- Karte: MapLibre mit Natural-Earth-Daten (keine externen Kartendienste, keine Cookies)
- Inhalte: `src/content/trips`, `src/content/diary`, `src/data/site.json`
- Fotos: `public/uploads`

```bash
npm install
npm run dev     # lokal ansehen
npm run build   # Ausgabe in dist/
```
