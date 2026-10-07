import { getCollection, type CollectionEntry } from 'astro:content';
import { marked } from 'marked';
import countries from 'i18n-iso-countries';
import de from 'i18n-iso-countries/langs/de.json';
import en from 'i18n-iso-countries/langs/en.json';
import { path, type Lang } from './i18n';
import siteData from '../data/site.json';

countries.registerLocale(de);
countries.registerLocale(en);

export type Trip = CollectionEntry<'trips'>;
export type Entry = CollectionEntry<'diary'>;

export const site = siteData;

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
  kind: 'stop' | 'entry';
}
export interface MapRoute {
  coords: [number, number][];
}
export interface MapData {
  countries: string[];
  pins: MapPin[];
  routes: MapRoute[];
}

export function buildMapData(trips: Trip[], entries: Entry[], lang: Lang): MapData {
  const countrySet = new Set<string>();
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

  return { countries: [...countrySet].filter(Boolean), pins, routes };
}
