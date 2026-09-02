/**
 * One-off: convert the marketing photo drop into web-ready WebP.
 *
 *   node scripts/optimize-marketing.mjs "<path to unzipped 'Marketing Photos' dir>"
 *
 * Long edge is capped at MAX_EDGE and everything is re-encoded to WebP, which
 * takes the drop from ~126MB of PNG to a few MB. Re-runnable: existing outputs
 * are skipped, so adding photos later only processes the new ones.
 */
import { mkdir, readdir, writeFile, access, stat } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import sharp from "sharp";

const SRC = process.argv[2];
const OUT = "public/marketing";
const MAX_EDGE = 1400;
const QUALITY = 82;

if (!SRC) {
  console.error('usage: node scripts/optimize-marketing.mjs "<Marketing Photos dir>"');
  process.exit(1);
}

/** folder name in the drop -> slug used on the site */
const FOLDER = {
  "Arched Shelf": "arched-shelf",
  "Classic Shelf": "classic-shelf",
  "Scalloped Shelf": "scalloped-shelf",
  "Mini Books": "mini-books",
  "Mini Keychain": "keychain",
  Accessories: "accessories",
  Packaging: "packaging",
  "Multiple Shelves": "multiple-shelves",
  "Social Media Posting": "social",
  "Main Photo for shelves": "shelf-mains",
  "New Mini Book Sets Main Cover": "book-set-covers",
};

const exists = (p) => access(p).then(() => true, () => false);
const manifest = {};
let made = 0;
let skipped = 0;
let bytesIn = 0;
let bytesOut = 0;

for (const [folder, slug] of Object.entries(FOLDER)) {
  const dir = join(SRC, folder);
  if (!(await exists(dir))) {
    console.error(`- missing folder: ${folder}`);
    continue;
  }
  const files = (await readdir(dir))
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .sort();
  await mkdir(join(OUT, slug), { recursive: true });

  const entries = [];
  for (const [i, f] of files.entries()) {
    const src = join(dir, f);
    const name = `${String(i + 1).padStart(2, "0")}.webp`;
    const dest = join(OUT, slug, name);
    bytesIn += (await stat(src)).size;

    if (await exists(dest)) {
      skipped++;
    } else {
      await sharp(src)
        .rotate() // honour EXIF orientation before resizing
        .resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(dest);
      made++;
    }
    const m = await sharp(dest).metadata();
    bytesOut += (await stat(dest)).size;
    entries.push({
      src: `/marketing/${slug}/${name}`,
      from: `${folder}/${basename(f, extname(f))}`,
      w: m.width,
      h: m.height,
      orient: m.width > m.height ? "landscape" : m.width === m.height ? "square" : "portrait",
    });
  }
  manifest[slug] = entries;
  console.log(`${slug.padEnd(18)} ${entries.length} photos`);
}

await writeFile(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(
  `\n${made} converted, ${skipped} already present. ` +
    `${(bytesIn / 1e6).toFixed(0)}MB in -> ${(bytesOut / 1e6).toFixed(1)}MB out.`,
);
