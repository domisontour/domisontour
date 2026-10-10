// Erzeugt vor jedem Build schlanke WebP-Versionen aller Fotos aus public/uploads
// (480, 960 und 1600 px breit) plus eine Liste mit den Bildmassen.
// Die Originale bleiben unverändert.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'public/uploads';
const OUT = 'public/_img';
const WIDTHS = [480, 960, 1600];
fs.mkdirSync(OUT, { recursive: true });

const manifest = {};
const files = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f)) : [];
for (const file of files) {
  const input = path.join(SRC, file);
  const base = file.replace(/\.[^.]+$/, '');
  const img = sharp(input).rotate();
  const meta = await img.metadata();
  // Ausrichtung (EXIF) berücksichtigen
  const swap = (meta.orientation ?? 1) >= 5;
  const w = swap ? meta.height : meta.width;
  const h = swap ? meta.width : meta.height;
  const variants = [];
  for (const width of WIDTHS.filter((x) => x < w).concat([Math.min(w, 1600)])) {
    if (variants.some((v) => v.w === width)) continue;
    const name = `${base}-${width}.webp`;
    const out = path.join(OUT, name);
    if (!fs.existsSync(out) || fs.statSync(out).mtimeMs < fs.statSync(input).mtimeMs) {
      await sharp(input).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out);
    }
    variants.push({ w: width, src: `/_img/${name}` });
  }
  manifest[`/uploads/${file}`] = { w, h, variants };
}
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log(`Bilder optimiert: ${files.length}`);
