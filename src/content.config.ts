import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Hilfstypen: Felder, die im Upload-Panel leer bleiben dürfen
const optText = z.string().nullish().transform((v) => (v ?? '').trim());
const blank = (v: unknown) => (v === '' || v === undefined ? null : v);
const optNum = z.preprocess(blank, z.coerce.number().nullable());
const optDate = z.preprocess(blank, z.coerce.date().nullable());

const stop = z.object({
  name: z.string(),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  note_de: optText,
  note_en: optText,
});

const photo = z.object({
  image: z.string(),
  caption_de: optText,
  caption_en: optText,
});

const trips = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/trips' }),
  schema: z.object({
    title_de: z.string(),
    title_en: optText,
    start: z.coerce.date(),
    end: optDate,
    countries: z.array(z.string()).nullish().transform((v) => (v ?? []).map((c) => c.trim().toUpperCase()).filter(Boolean)),
    cover: optText,
    summary_de: optText,
    summary_en: optText,
    text_de: optText,
    text_en: optText,
    best_time_de: optText,
    best_time_en: optText,
    budget_de: optText,
    budget_en: optText,
    tip_de: optText,
    tip_en: optText,
    show_route: z.boolean().nullish().transform((v) => v ?? true),
    stops: z.array(stop).nullish().transform((v) => v ?? []),
    gallery: z.array(photo).nullish().transform((v) => v ?? []),
    draft: z.boolean().nullish().transform((v) => v ?? false),
  }),
});

const diary = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/diary' }),
  schema: z.object({
    title_de: z.string(),
    title_en: optText,
    date: z.coerce.date(),
    trip: optText,
    place: optText,
    lat: optNum,
    lng: optNum,
    cover: optText,
    text_de: optText,
    text_en: optText,
    photos: z.array(photo).nullish().transform((v) => v ?? []),
    draft: z.boolean().nullish().transform((v) => v ?? false),
  }),
});

const highlight = z.object({
  title_de: z.string(),
  title_en: optText,
  text_de: optText,
  text_en: optText,
  image: optText,
});

/** Reiseziel-Seite pro Land (Infos und Tipps) */
const destinations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/destinations' }),
  schema: z.object({
    country: z.string().transform((c) => c.trim().toUpperCase()),
    name_de: optText,
    name_en: optText,
    cover: optText,
    intro_de: optText,
    intro_en: optText,
    highlights: z.array(highlight).nullish().transform((v) => v ?? []),
    routes_de: optText,
    routes_en: optText,
    best_time_de: optText,
    best_time_en: optText,
    stay_de: optText,
    stay_en: optText,
    car_de: optText,
    car_en: optText,
    packing_de: optText,
    packing_en: optText,
    costs_de: optText,
    costs_en: optText,
    tips_de: optText,
    tips_en: optText,
  }),
});

export const collections = { trips, diary, destinations };
