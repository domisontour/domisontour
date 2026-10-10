import fs from 'node:fs';
import path from 'node:path';

type Entry = { w: number; h: number; variants: { w: number; src: string }[] };
let manifest: Record<string, Entry> | null = null;

/** Optimierte Bildversionen aus scripts/images.mjs (falls vorhanden) */
export function imageInfo(src: string): Entry | null {
  if (!manifest) {
    try {
      manifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/_img/manifest.json'), 'utf8'));
    } catch {
      manifest = {};
    }
  }
  return manifest![src] ?? null;
}
