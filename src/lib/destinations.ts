import { getCollection, type CollectionEntry } from 'astro:content';
import fs from 'node:fs';
import path from 'node:path';
import { feature } from 'topojson-client';
import { geoContains } from 'd3-geo';
import { countries as countryData } from 'countries-list';
import { getTrips, getEntries, visitedCountryCodes, countryName, countryNumeric, places, type Trip, type Entry } from './content';
import type { Lang } from './i18n';

export type DestEntry = CollectionEntry<'destinations'>;

export type Continent = 'africa' | 'america' | 'asia' | 'europe' | 'oceania';
export const CONTINENTS: Continent[] = ['africa', 'america', 'asia', 'europe', 'oceania'];
export const CONTINENT_NAMES: Record<Continent, { de: string; en: string }> = {
  africa: { de: 'Afrika', en: 'Africa' },
  america: { de: 'Amerika', en: 'Americas' },
  asia: { de: 'Asien', en: 'Asia' },
  europe: { de: 'Europa', en: 'Europe' },
  oceania: { de: 'Ozeanien', en: 'Oceania' },
};

/** Kürzere, gebräuchliche Namen für das Menü */
const NAME_OVERRIDES: Record<string, { de: string; en: string }> = {
  US: { de: 'USA', en: 'USA' },
  GB: { de: 'Grossbritannien', en: 'United Kingdom' },
  AE: { de: 'Vereinigte Arabische Emirate', en: 'United Arab Emirates' },
  TZ: { de: 'Tansania', en: 'Tanzania' },
};

export interface Place {
  name: string;
  lat: number;
  lng: number;
}

export interface Destination {
  code: string;
  continent: Continent;
  name: { de: string; en: string };
  slug: { de: string; en: string };
  entry?: DestEntry;
  trips: Trip[];
  entries: Entry[];
  places: { de: Place[]; en: Place[] };
  cover: string;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function continentOf(code: string): Continent {
  const c = (countryData as any)[code]?.continent as string | undefined;
  if (c === 'AF') return 'africa';
  if (c === 'NA' || c === 'SA') return 'america';
  if (c === 'AS') return 'asia';
  if (c === 'OC') return 'oceania';
  return 'europe';
}

// Länderformen einmal laden, um Orte dem richtigen Land zuzuordnen
let shapes: { iso: string; f: any }[] | null = null;
function countryShapes() {
  if (!shapes) {
    const topo = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/map/countries-50m.json'), 'utf8'));
    shapes = (feature(topo, topo.objects.countries) as any).features.map((f: any) => ({ iso: String(f.id ?? ''), f }));
  }
  return shapes!;
}
export function countryAt(lat: number, lng: number): string | null {
  const find = (x: number, y: number) => countryShapes().find((s) => s.f.geometry && geoContains(s.f, [x, y]))?.iso;
  const direct = find(lng, lat);
  if (direct) return direct;
  // Orte an der Küste (z. B. Venedig) liegen in der vereinfachten Karte manchmal im Wasser: in der Nähe suchen
  for (const r of [0.1, 0.2, 0.35, 0.5]) {
    for (let a = 0; a < 360; a += 45) {
      const hit = find(lng + r * Math.cos((a * Math.PI) / 180), lat + r * Math.sin((a * Math.PI) / 180));
      if (hit) return hit;
    }
  }
  return null;
}

let cache: Destination[] | null = null;

/** Alle bereisten Länder als Reiseziele, mit Reisen, Tagebuch und Orten */
export async function getDestinations(): Promise<Destination[]> {
  if (cache) return cache;
  const trips = await getTrips();
  const entries = await getEntries();
  const destEntries = await getCollection('destinations');
  const codes = new Set<string>(visitedCountryCodes(trips));
  destEntries.forEach((d) => codes.add(d.data.country));

  // Orte (Weltkarte + Reisestopps) per Koordinate dem Land zuordnen
  const placeList: { iso: string; de: Place; en: Place }[] = [];
  for (const p of places.places as any[]) {
    if (p.lat == null || p.lng == null) continue;
    placeList.push({ iso: countryAt(p.lat, p.lng) ?? '', de: { name: p.name_de, lat: p.lat, lng: p.lng }, en: { name: p.name_en || p.name_de, lat: p.lat, lng: p.lng } });
  }
  for (const t of trips) {
    for (const s of t.data.stops) {
      if (placeList.some((x) => Math.abs(x.de.lat - s.lat) < 0.05 && Math.abs(x.de.lng - s.lng) < 0.05)) continue;
      placeList.push({ iso: countryAt(s.lat, s.lng) ?? '', de: { name: s.name, lat: s.lat, lng: s.lng }, en: { name: s.name, lat: s.lat, lng: s.lng } });
    }
  }

  const list: Destination[] = [...codes].map((code) => {
    const entry = destEntries.find((d) => d.data.country === code);
    const num = countryNumeric(code);
    const name = {
      de: entry?.data.name_de || NAME_OVERRIDES[code]?.de || countryName(code, 'de'),
      en: entry?.data.name_en || NAME_OVERRIDES[code]?.en || countryName(code, 'en'),
    };
    const dTrips = trips.filter((t) => t.data.countries.includes(code));
    const tripIds = new Set(dTrips.map((t) => t.id));
    const dEntries = entries.filter((e) => {
      const ref = (e.data.trip || '').split('/').pop()!.replace(/\.md$/, '');
      if (tripIds.has(ref) && dTrips.length && (e.data.lat == null || countryAt(e.data.lat!, e.data.lng!) === num)) return true;
      return e.data.lat != null && e.data.lng != null && countryAt(e.data.lat, e.data.lng) === num;
    });
    const mine = placeList.filter((p) => p.iso === num);
    return {
      code,
      continent: continentOf(code),
      name,
      slug: { de: slugify(name.de), en: slugify(name.en) },
      entry,
      trips: dTrips,
      entries: dEntries,
      places: { de: mine.map((p) => p.de), en: mine.map((p) => p.en) },
      cover: entry?.data.cover || dTrips.find((t) => t.data.cover)?.data.cover || '',
    };
  });

  cache = list.sort((a, b) => a.name.de.localeCompare(b.name.de, 'de'));
  return cache;
}

/** Für das Menü: nach Kontinent gruppiert, alphabetisch in der jeweiligen Sprache */
export async function destinationsByContinent(lang: Lang) {
  const all = await getDestinations();
  return CONTINENTS.map((c) => ({
    key: c,
    name: CONTINENT_NAMES[c][lang],
    items: all.filter((d) => d.continent === c).sort((a, b) => a.name[lang].localeCompare(b.name[lang], lang)),
  })).filter((g) => g.items.length);
}

/** Geplante Reisen: geplante Länder plus geplante Orte, nach Land gruppiert */
export async function plannedByCountry(lang: Lang) {
  const isoLib = (await import('i18n-iso-countries')).default;
  const pd = places as any;
  const visited = new Set((await getDestinations()).map((d) => d.code));
  const groups = new Map<string, { code: string; name: string; places: string[]; visited: boolean }>();
  const add = (code: string) => {
    if (!groups.has(code)) {
      groups.set(code, {
        code,
        name: NAME_OVERRIDES[code]?.[lang] || countryName(code, lang),
        places: [],
        visited: visited.has(code),
      });
    }
    return groups.get(code)!;
  };
  for (const c of (pd.planned_countries ?? []) as string[]) if (c?.trim()) add(c.trim().toUpperCase());
  for (const p of (pd.planned_places ?? []) as any[]) {
    if (p.lat == null || p.lng == null) continue;
    const num = countryAt(p.lat, p.lng);
    const code = num ? isoLib.numericToAlpha2(num) : undefined;
    if (!code) continue;
    add(code).places.push((lang === 'en' && p.name_en) || p.name_de);
  }
  return [...groups.values()];
}
