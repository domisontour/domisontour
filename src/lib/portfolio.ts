import data from '../data/portfolio.json';
import type { Lang } from './i18n';

export const portfolio = data as any;

/** Text in der gewünschten Sprache, sonst Deutsch */
export const pp = (o: any, key: string, lang: Lang): string => (lang === 'en' && o?.[`${key}_en`]) || o?.[`${key}_de`] || '';

const has = (list: any[] | undefined, field: string) => (list ?? []).some((x) => x?.[field]);

/** Abschnitte der Portfolio-Seite, gruppiert für das Dropdown. Leere Abschnitte fallen weg. */
export function portfolioSections(lang: Lang) {
  const de = lang === 'de';
  const p = portfolio;
  const groups = [
    {
      name: de ? 'Wer wir sind' : 'Who we are',
      items: [
        { id: 'about', label: de ? 'Über uns als Creator' : 'About us as creators', show: true },
        { id: 'perspectives', label: de ? 'Drei Perspektiven' : 'Three perspectives', show: has(p.perspectives, 'title_de') },
        { id: 'locations', label: de ? 'Dreh-Locations' : 'Filming locations', show: has(p.locations, 'image') || !!p.locations_de },
      ],
    },
    {
      name: de ? 'Unsere Arbeit' : 'Our work',
      items: [
        { id: 'videos', label: de ? 'UGC-Videos' : 'UGC videos', show: has(p.videos, 'video') },
        { id: 'photos', label: de ? 'UGC-Fotos' : 'UGC photos', show: has(p.photos, 'image') },
        { id: 'drone', label: de ? 'Drohnenaufnahmen' : 'Drone footage', show: has(p.drone, 'video') },
      ],
    },
    {
      name: de ? 'Buchen' : 'Book us',
      items: [
        { id: 'prices', label: de ? 'Pakete & Preise' : 'Packages & prices', show: (p.prices ?? []).length > 0 },
        { id: 'contact', label: de ? 'Kontakt' : 'Contact', show: true },
      ],
    },
  ];
  return groups
    .map((g) => ({ ...g, items: g.items.filter((i) => i.show) }))
    .filter((g) => g.items.length);
}
