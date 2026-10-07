// Erstellt public/map/labels.json: ein Beschriftungspunkt pro Land (Deutsch/Englisch)
// Ausführen: node scripts/build-labels.mjs
import fs from 'node:fs';
import { feature } from 'topojson-client';
import { geoArea } from 'd3-geo';
import polylabel from 'polylabel';
import countries from 'i18n-iso-countries';
const de = JSON.parse(fs.readFileSync('node_modules/i18n-iso-countries/langs/de.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('node_modules/i18n-iso-countries/langs/en.json', 'utf8'));
countries.registerLocale(de);
countries.registerLocale(en);

const SHORT = {
  US: ['USA', 'USA'], GB: ['Grossbritannien', 'United Kingdom'], RU: ['Russland', 'Russia'],
  AE: ['VAE', 'UAE'], TZ: ['Tansania', 'Tanzania'], CD: ['DR Kongo', 'DR Congo'], CF: ['Zentralafr. Rep.', 'C. African Rep.'],
  KR: ['Südkorea', 'South Korea'], KP: ['Nordkorea', 'North Korea'], IR: ['Iran', 'Iran'], SY: ['Syrien', 'Syria'],
  VE: ['Venezuela', 'Venezuela'], BO: ['Bolivien', 'Bolivia'], LA: ['Laos', 'Laos'], VN: ['Vietnam', 'Vietnam'],
  MD: ['Moldau', 'Moldova'], CZ: ['Tschechien', 'Czechia'], BA: ['Bosnien', 'Bosnia'], MK: ['Nordmazedonien', 'N. Macedonia'],
  DO: ['Dom. Rep.', 'Dominican Rep.'], TW: ['Taiwan', 'Taiwan'], PS: ['Palästina', 'Palestine'], VA: ['Vatikan', 'Vatican'],
};
const topo = JSON.parse(fs.readFileSync('public/map/countries-50m.json', 'utf8'));
const fc = feature(topo, topo.objects.countries);
const out = [];
for (const f of fc.features) {
  const iso = String(f.id ?? '');
  if (!f.geometry || iso === '010') continue;
  const a2 = countries.numericToAlpha2(iso);
  if (!a2) continue;
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  // grösste Teilfläche (Festland) für die Beschriftung
  let best = null, bestA = -1;
  for (const p of polys) {
    const a = geoArea({ type: 'Polygon', coordinates: p });
    if (a > bestA) { bestA = a; best = p; }
  }
  const area = geoArea(f);
  const [x, y] = polylabel(best, 0.05);
  const names = SHORT[a2] ?? [countries.getName(a2, 'de'), countries.getName(a2, 'en')];
  out.push({ type: 'Feature', properties: { iso, de: names[0], en: names[1], area: Math.round(area * 1e5) }, geometry: { type: 'Point', coordinates: [Math.round(x * 100) / 100, Math.round(y * 100) / 100] } });
}
out.sort((a, b) => b.properties.area - a.properties.area);
out.forEach((f, i) => (f.properties.minz = i < 45 ? 0 : i < 110 ? 2.4 : i < 165 ? 3.4 : 4.6));
fs.writeFileSync('public/map/labels.json', JSON.stringify({ type: 'FeatureCollection', features: out }));
console.log('Länder:', out.length);
