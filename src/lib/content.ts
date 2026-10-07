import { getCollection, type CollectionEntry } from 'astro:content';
import { marked } from 'marked';
import countries from 'i18n-iso-countries';
import de from 'i18n-iso-countries/langs/de.json';
import en from 'i18n-iso-countries/langs/en.json';
import { path, type Lang } from './i18n';
import siteData from '../data/site.json';
import placesData from '../data/places.json';

countries.registerLocale(de);
countries.registerLocale(en);

export type Trip = CollectionEntry<'trips'>;
export type Entry = CollectionEntry<'diary'>;

export const site = siteData;
export const places = placesData;

/** Anzahl Länder der Welt (193 UNO-Mitglieder + Vatikan + Palästina) */
export const WORLD_COUNTRIES = 195;
export const US_STATES = 50;

/** US-Bundesstaaten: Kürzel -> FIPS-Code (für die Karte) */
const FIPS: Record<string, string> = {
  AL: '01', AK: '02', AZ: '04', AR: '05', CA: '06', CO: '08', CT: '09', DE: '10', DC: '11', FL: '12', GA: '13',
  HI: '15', ID: '16', IL: '17', IN: '18', IA: '19', KS: '20', KY: '21', LA: '22', ME: '23', MD: '24', MA: '25',
  MI: '26', MN: '27', MS: '28', MO: '29', MT: '30', NE: '31', NV: '32', NH: '33', NJ: '34', NM: '35', NY: '36',
  NC: '37', ND: '38', OH: '39', OK: '40', OR: '41', PA: '42', RI: '44', SC: '45', SD: '46', TN: '47', TX: '48',
  UT: '49', VT: '50', VA: '51', WA: '53', WV: '54', WI: '55', WY: '56',
};

/** Feld in gewünschter Sprache, sonst Deutsch als Rückfall */
export function pick(data: Record<string, any>, field: string, lang: Lang): string {
  const own = data[`${field}_${lang}`];
  if (own && String(own).trim()) return String(own);
  return String(data[`${field}_de`] ?? '');
}

/** true, wenn der englische Text fehlt und Deutsch angezeigt wird */
export function isFallback(data: Record<string, any>, field: string, lang: Lang) {
  return lang === 'en' && !String(data[`${field}_en`] ?? '').trim() && !!String(data[`${field}_de`] ?? '').trim();
}

export function md(text: string): string {
  return text ? (marked.parse(text, { async: false }) as string) : '';
}

/** Kurzname aus Dateiname oder Pfad (z. B. "src/content/trips/suedafrika-2026.md" -> "suedafrika-2026") */
export function slugOf(ref: string | null | undefined): string {
  if (!ref) return '';
  return ref.split('/').pop()!.replace(/\.(md|mdx)$/i, '');
}

export function countryName(code: string, lang: Lang) {
  return countries.getName(code.toUpperCase(), lang) ?? code;
}

export function countryNumeric(code: string) {
  return countries.alpha2ToNumeric(code.toUpperCase()) ?? '';
}

export async function getTrips() {
  const all = await getCollection('trips', ({ data }) => !data.draft);
  return all.sort((a, b) => b.data.start.getTime() - a.data.start.getTime());
}

export async function getEntries() {
  const all = await getCollection('diary', ({ data }) => !data.draft);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function tripDays(trip: Trip) {
  if (!trip.data.end) return null;
  return Math.round((trip.data.end.getTime() - trip.data.start.getTime()) / 86400000) + 1;
}

export function excerpt(text: string, max = 160) {
  const plain = text.replace(/[#*_>`\[\]()!]/g, '').replace(/\s+/g, ' ').trim();
  return plain.length > max ? plain.slice(0, max).replace(/\s+\S*$/, '') + ' …' : plain;
}

/** Daten für die Karte: Länder, Routen, Pins */
export interface MapPin {
  lat: number;
  lng: number;
  title: string;
  sub: string;
  href: string;
  image: string;
  kind: 'stop' | 'entry' | 'place' | 'planned';
}
export interface MapRoute {
  coords: [number, number][];
}
export interface MapData {
  countries: string[];
  states: string[];
  plannedCountries: string[];
  plannedStates: string[];
  pins: MapPin[];
  routes: MapRoute[];
  stats: { countries: number; countriesTotal: number; states: number; statesTotal: number; plannedCountries: number; plannedStates: number };
}

/** Alle bereisten Länder (Weltkarte + Reisen), als ISO-Kürzel */
export function visitedCountryCodes(trips: Trip[]) {
  const set = new Set<string>(places.countries.map((c) => c.trim().toUpperCase()).filter(Boolean));
  trips.forEach((t) => t.data.countries.forEach((c) => set.add(c)));
  return [...set];
}

export function buildMapData(trips: Trip[], entries: Entry[], lang: Lang, opts: { withPlaces?: boolean } = {}): MapData {
  const withPlaces = opts.withPlaces ?? false;
  const countrySet = new Set<string>(withPlaces ? visitedCountryCodes(trips).map(countryNumeric) : []);
  const pins: MapPin[] = [];
  const routes: MapRoute[] = [];

  for (const trip of trips) {
    trip.data.countries.forEach((c) => countrySet.add(countryNumeric(c)));
    const title = pick(trip.data, 'title', lang);
    trip.data.stops.forEach((s) => {
      pins.push({
        lat: s.lat,
        lng: s.lng,
        title: s.name,
        sub: title,
        href: path('trips', lang, trip.id),
        image: trip.data.cover,
        kind: 'stop',
      });
    });
    if (trip.data.show_route && trip.data.stops.length > 1) {
      routes.push({ coords: trip.data.stops.map((s) => [s.lng, s.lat]) });
    }
  }

  for (const e of entries) {
    if (e.data.lat == null || e.data.lng == null) continue;
    pins.push({
      lat: e.data.lat,
      lng: e.data.lng,
      title: pick(e.data, 'title', lang),
      sub: e.data.place,
      href: path('diary', lang, e.id),
      image: e.data.cover || e.data.photos[0]?.image || '',
      kind: 'entry',
    });
  }

  const stateCodes = withPlaces ? places.us_states.map((c) => c.trim().toUpperCase()).filter((c) => FIPS[c] && c !== 'DC') : [];
  if (withPlaces) {
    for (const p of places.places) {
      if (p.lat == null || p.lng == null) continue;
      // keine doppelten Pins, wenn eine Reise denselben Ort schon zeigt
      if (pins.some((x) => Math.abs(x.lat - p.lat) < 0.05 && Math.abs(x.lng - p.lng) < 0.05)) continue;
      pins.push({ lat: p.lat, lng: p.lng, title: (lang === 'en' && p.name_en) || p.name_de, sub: '', href: '', image: '', kind: 'place' });
    }
  }
  const countries = [...countrySet].filter(Boolean);
  // Geplant: nur, was noch nicht bereist ist
  const pd = places as any;
  const plannedCountries = withPlaces
    ? [...new Set<string>((pd.planned_countries ?? []).map((c: string) => countryNumeric(c.trim())))].filter((c) => c && !countrySet.has(c))
    : [];
  const plannedStateCodes = withPlaces
    ? [...new Set<string>((pd.planned_us_states ?? []).map((c: string) => c.trim().toUpperCase()))].filter((c) => FIPS[c] && c !== 'DC' && !stateCodes.includes(c))
    : [];
  if (withPlaces) {
    for (const p of pd.planned_places ?? []) {
      if (p.lat == null || p.lng == null) continue;
      pins.push({ lat: p.lat, lng: p.lng, title: (lang === 'en' && p.name_en) || p.name_de, sub: lang === 'de' ? 'Geplant' : 'Planned', href: '', image: '', kind: 'planned' });
    }
  }
  return {
    countries,
    states: stateCodes.map((c) => FIPS[c]),
    plannedCountries,
    plannedStates: plannedStateCodes.map((c) => FIPS[c]),
    pins,
    routes,
    stats: {
      countries: countries.length,
      countriesTotal: WORLD_COUNTRIES,
      states: stateCodes.length,
      statesTotal: US_STATES,
      plannedCountries: plannedCountries.length,
      plannedStates: plannedStateCodes.length,
    },
  };
}
