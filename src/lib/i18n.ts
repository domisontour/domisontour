export type Lang = 'de' | 'en';
export const langs: Lang[] = ['de', 'en'];

/** Seiten und ihre Pfade pro Sprache */
const routes = {
  home: { de: '/', en: '/en/' },
  map: { de: '/karte/', en: '/en/map/' },
  trips: { de: '/reisen/', en: '/en/trips/' },
  diary: { de: '/tagebuch/', en: '/en/diary/' },
  about: { de: '/ueber-uns/', en: '/en/about/' },
  imprint: { de: '/impressum/', en: '/en/imprint/' },
  privacy: { de: '/datenschutz/', en: '/en/privacy/' },
} as const;

export type PageKey = keyof typeof routes;

export function path(key: PageKey, lang: Lang, slug?: string): string {
  const base = routes[key][lang];
  return slug ? `${base}${slug}/` : base;
}

export const ui = {
  de: {
    nav_map: 'Karte',
    nav_trips: 'Reisen',
    nav_diary: 'Tagebuch',
    nav_about: 'Über uns',
    switch_label: 'Sprache wählen',
    skip: 'Zum Inhalt springen',
    tagline: 'Herr Domi & Frou Domi',
    hero_title: 'Zwei Domis, ein Rucksack voller Notizen.',
    hero_lead:
      'Wir sind ein Schweizer Reisepaar. Hier sammeln wir unsere Routen, Tagebucheinträge und Tipps, damit eure nächste Reise einfacher wird.',
    hero_cta_map: 'Karte ansehen',
    hero_cta_trips: 'Alle Reisen',
    map_title: 'Wo wir schon waren',
    map_lead: 'Jeder Pin ist ein Ort, an dem wir wirklich waren. Tippt darauf für die Geschichte dazu.',
    map_hint: 'Ziehen zum Verschieben, Zwei Finger oder Mausrad zum Zoomen',
    stat_countries: 'Länder',
    stat_places: 'Orte',
    stat_entries: 'Tagebucheinträge',
    trips_title: 'Unsere Reisen',
    trips_lead: 'Routen, Highlights und was wir beim nächsten Mal anders machen würden.',
    diary_title: 'Tagebuch',
    diary_lead: 'Unterwegs notiert. Ehrlich, persönlich und manchmal etwas sandig.',
    latest_diary: 'Neu im Tagebuch',
    all_entries: 'Alle Einträge',
    read_more: 'Weiterlesen',
    open_trip: 'Zur Reise',
    about_title: 'Über uns',
    facts_title: 'Auf einen Blick',
    fact_duration: 'Dauer',
    fact_best_time: 'Beste Reisezeit',
    fact_budget: 'Budget',
    fact_tip: 'Unser Tipp',
    days: 'Tage',
    route_title: 'Unsere Route',
    gallery_title: 'Momente',
    trip_diary: 'Tagebuch dieser Reise',
    back_trips: 'Alle Reisen',
    back_diary: 'Alle Einträge',
    photo_soon: 'Foto folgt',
    empty_trips: 'Noch keine Reisen erfasst. Die erste kommt bald.',
    empty_diary: 'Noch keine Einträge. Der erste folgt nach der nächsten Reise.',
    fallback_note: 'Dieser Eintrag ist nur auf Deutsch verfügbar.',
    follow: 'Folgt uns',
    imprint: 'Impressum',
    privacy: 'Datenschutz',
    from_trip: 'Reise',
  },
  en: {
    nav_map: 'Map',
    nav_trips: 'Trips',
    nav_diary: 'Diary',
    nav_about: 'About us',
    switch_label: 'Choose language',
    skip: 'Skip to content',
    tagline: 'Herr Domi & Frou Domi',
    hero_title: 'Two Domis, one backpack full of notes.',
    hero_lead:
      'We are a Swiss travel couple. This is where we keep our routes, diary entries and tips, so your next trip gets a little easier.',
    hero_cta_map: 'See the map',
    hero_cta_trips: 'All trips',
    map_title: 'Where we have been',
    map_lead: 'Every pin is a place we actually visited. Tap one for the story behind it.',
    map_hint: 'Drag to move, pinch or scroll to zoom',
    stat_countries: 'Countries',
    stat_places: 'Places',
    stat_entries: 'Diary entries',
    trips_title: 'Our trips',
    trips_lead: 'Routes, highlights and what we would do differently next time.',
    diary_title: 'Diary',
    diary_lead: 'Written on the road. Honest, personal and sometimes a little sandy.',
    latest_diary: 'New in the diary',
    all_entries: 'All entries',
    read_more: 'Read more',
    open_trip: 'View trip',
    about_title: 'About us',
    facts_title: 'At a glance',
    fact_duration: 'Duration',
    fact_best_time: 'Best time to go',
    fact_budget: 'Budget',
    fact_tip: 'Our tip',
    days: 'days',
    route_title: 'Our route',
    gallery_title: 'Moments',
    trip_diary: 'Diary from this trip',
    back_trips: 'All trips',
    back_diary: 'All entries',
    photo_soon: 'Photo coming soon',
    empty_trips: 'No trips added yet. The first one is on its way.',
    empty_diary: 'No entries yet. The first one follows after our next trip.',
    fallback_note: 'This entry is only available in German.',
    follow: 'Follow us',
    imprint: 'Imprint',
    privacy: 'Privacy',
    from_trip: 'Trip',
  },
} as const;

export function t(lang: Lang) {
  return ui[lang];
}

export function formatDate(d: Date, lang: Lang, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  return new Intl.DateTimeFormat(lang === 'de' ? 'de-CH' : 'en-GB', opts).format(d);
}

export function formatRange(start: Date, end: Date | null | undefined, lang: Lang) {
  const o: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
  if (!end) return formatDate(start, lang, o);
  const a = formatDate(start, lang, o);
  const b = formatDate(end, lang, o);
  return a === b ? a : `${a} bis ${b}`.replace(' bis ', lang === 'de' ? ' bis ' : ' to ');
}
