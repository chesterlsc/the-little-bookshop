/**
 * One-off: pull product photography from the live shop into public/products/<slug>/.
 * Re-runnable; skips files that already exist. Writes public/products/manifest.json.
 *
 * Usage: node scripts/fetch-photos.mjs
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const SRC = "https://thestickershop.shop";
const OUT = "public/products";
const MAX_PER_PRODUCT = 8;
const WIDTH = 1200;

/** local catalog slug -> live shop handle */
const MAP = {
  "mini-scalloped-bookshelf": "mini-scalloped-bookshelf",
  "mini-basic-bookshelf": "mini-basic-bookshelf",
  "mini-fancy-bookshelf": "mini-fancy-bookshelf",
  "mini-cube-bookshelf": "mini-cube-bookshelf",
  "mini-arched-bookshelf":
    "mini-bookshelf-bookends-books-library-book-swag-miniature-bookish-gift-library-tiny-booktok-reading-arched-bookcase-bookend-decor-romance",
  "mini-medieval-bookshelf": "mini-medieval-bookshelf",
  "custom-mini-book-set": "handmade-custom-mini-foam-books",
  "mini-twilight-saga-set": "handmade-mini-twilight-series-books-set-of-5-mini-books",
  "mini-sarah-j-maas-set": "handmade-mini-sarah-j-maas-books-set-of-8-mini-books",
  "mini-fourth-wing-set": "handmade-mini-fourth-wing-series-books-set-of-3-mini-books",
  "mini-jenny-han-set":
    "handmade-mini-summer-series-books-set-of-3-mini-books-reader-romance-miniature-tiny-books-booktok-the-summer-i-turned-pretty-jenny-han",
  "mini-freida-mcfadden-set": "handmade-mini-freida-mcfadden-books-set-of-9-mini-books",
  "mini-book-keychain":
    "custom-mini-book-keychains-reading-tracker-tiny-book-stickers-customizable-books-book-lover-gift-small-novels-choose-your-own",
  "book-stack-acrylic-keychain": "copy-of-coloured-pencils-acrylic-keychain",
  "bookstore-acrylic-keychain": "copy-of-corgi-acrylic-keychain",
  "bookish-castle-acrylic-keychain": "castle-acrylic-keychain",
  "mini-book-lover-sticker-sheet": "copy-of-mini-teacher-collection",
  "mini-plants":
    "mini-plants-library-book-swag-miniature-bookish-gift-library-tiny-booktok-reading-dollhouse-decor-romance-bookshelf-accessory",
  "mini-fish-tank":
    "mini-fish-tank-library-book-swag-miniature-bookish-gift-library-tiny-booktok-reading-dollhouse-decor-romance-bookshelf-accessory",
  "mini-bean-bag-chair":
    "mini-bean-bag-chair-library-book-swag-miniature-bookish-gift-library-tiny-booktok-reading-dollhouse-decor-romance-bookshelf-accessory",
  "mini-rug":
    "mini-rug-library-book-swag-miniature-bookish-gift-library-tiny-booktok-reading-dollhouse-decor-romance-bookshelf-accessory",
  "emily-henry-book-stack-sticker":
    "emily-henry-inspired-book-stack-sticker-gift-laptop-waterproof-stickers-bookish-romance-book-lover-beach-read-happy-place-funny-story-1",
  "abby-jimenez-book-stack-sticker":
    "abby-jimenez-inspired-book-stack-sticker-gift-laptop-waterproof-stickers-bookish-romance-just-for-the-summer-part-of-your-world-fiction",
  "special-edition-fourth-wing-sticker":
    "special-edition-fourth-wing-book-stack-sticker-gift-laptop-decal-waterproof-books-romance-the-empyrean-rebecca-yarros-fantasy-romantasy",
  "magnolia-parks-book-stack-sticker":
    "magnolia-parks-book-stack-sticker-gift-laptop-waterbottle-waterproof-stickers-bookish-romance-fiction-romance-contemporary-jessa-hastings",
  "twilight-book-stack-sticker":
    "twilight-book-stack-sticker-gift-laptop-decal-water-bottle-waterproof-stickers-books-romance-romantasy-stephenie-meyer-fantasy-ya-vampire-1",
  "freida-mcfadden-book-stack-sticker":
    "freida-mcfadden-book-stack-sticker-gift-laptop-decal-waterproof-stickers-books-bookish-thriller-mystery-suspense-read-the-housemaid",
  "mary-kubica-book-stack-sticker":
    "mary-kubica-book-stack-sticker-gift-laptop-decal-waterproof-stickers-books-bookish-thriller-mystery-suspense-local-woman-missing",
  "acotar-book-stack-sticker":
    "acotar-book-stack-sticker-decal-planner-water-bottle-waterproof-stickers-fantasy-romance-romantasy-sarah-j-maas-court-of-thorns-and-roses-1",
};

/** Shopify CDN resize: name.jpg?v=1 -> name_1200x.jpg?v=1 */
const sized = (url) => url.replace(/(\.[a-z]+)(\?|$)/i, `_${WIDTH}x$1$2`);

const exists = (p) => access(p).then(() => true, () => false);

const manifest = {};
let downloaded = 0;
let skipped = 0;

for (const [slug, handle] of Object.entries(MAP)) {
  const res = await fetch(`${SRC}/products/${handle}.json`);
  if (!res.ok) {
    console.error(`x ${slug}: ${res.status} for ${handle}`);
    continue;
  }
  const { product } = await res.json();
  const dir = join(OUT, slug);
  await mkdir(dir, { recursive: true });

  const entries = [];
  for (const [i, img] of product.images.slice(0, MAX_PER_PRODUCT).entries()) {
    const file = `${String(i + 1).padStart(2, "0")}.webp`;
    const path = join(dir, file);
    if (await exists(path)) {
      skipped++;
    } else {
      const bin = await fetch(sized(img.src));
      if (!bin.ok) {
        console.error(`  x ${slug}/${file}: ${bin.status}`);
        continue;
      }
      await sharp(Buffer.from(await bin.arrayBuffer())).webp({ quality: 80 }).toFile(path);
      downloaded++;
    }
    entries.push({
      src: `/products/${slug}/${file}`,
      alt: img.alt || null,
      width: img.width,
      height: img.height,
    });
  }
  manifest[slug] = { title: product.title, handle, images: entries };
  console.log(`ok ${slug} - ${entries.length} photos`);
}

await writeFile(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`\n${downloaded} downloaded, ${skipped} already present.`);
