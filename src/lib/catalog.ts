import type { Cents } from "./money";

/**
 * ─── The Little Bookshop catalog ─────────────────────────────────────────────
 *
 * Product data lives here, separate from the interface, so names, prices,
 * options, availability and copy can be edited without touching components.
 *
 * Prices marked priceStatus: "placeholder" are editable estimates derived from
 * the existing shop's per-book pricing and MUST be confirmed by the business
 * before launch (see README → "Business information still needed").
 * Everything else mirrors the live catalog at thestickershop.shop.
 */

export type Category =
  | "bookshelves"
  | "mini-books"
  | "keychains"
  | "stickers"
  | "accessories";

export const CATEGORIES: Record<
  Category,
  { name: string; short: string; blurb: string; art: ArtKind; photo: string }
> = {
  bookshelves: {
    name: "Mini Bookshelves",
    short: "Bookshelves",
    blurb:
      "Six silhouettes, ten colors, two sizes. Built to hold sixty-odd tiny books and one very small plant.",
    art: "shelf-scalloped",
    photo: "/products/mini-scalloped-bookshelf/01.webp",
  },
  "mini-books": {
    name: "Miniature Books",
    short: "Mini Books",
    blurb:
      "Real covers, shrunk to an inch. Ready-made series sets, or six titles you choose yourself.",
    art: "books-set",
    photo: "/products/custom-mini-book-set/01.webp",
  },
  keychains: {
    name: "Keychains",
    short: "Keychains",
    blurb:
      "One favorite book, on your keys. Custom mini-book charms and clear acrylic bookish shapes.",
    art: "keychain-book",
    photo: "/products/mini-book-keychain/01.webp",
  },
  stickers: {
    name: "Stickers",
    short: "Stickers",
    blurb:
      "Waterproof book-stack decals. An author's whole backlist in one pile of spines.",
    art: "sticker-stack",
    photo: "/products/mini-book-lover-sticker-sheet/01.webp",
  },
  accessories: {
    name: "Shelf Accessories",
    short: "Accessories",
    blurb:
      "Plants, rugs, bean bags and a one-inch fish tank. The set dressing that turns a shelf into a scene.",
    art: "plant",
    photo: "/products/mini-bean-bag-chair/06.webp",
  },
};

export type ArtKind =
  | "shelf-scalloped"
  | "shelf-basic"
  | "shelf-fancy"
  | "shelf-cube"
  | "shelf-arched"
  | "shelf-medieval"
  | "books-set"
  | "books-custom"
  | "keychain-book"
  | "keychain-acrylic"
  | "sticker-stack"
  | "sticker-sheet"
  | "plant"
  | "fishtank"
  | "beanbag"
  | "rug";

export interface ProductImage {
  src: string;
  alt: string;
  /** "chart" = a labelled size/color reference rather than a styled shot. */
  kind: "photo" | "chart" | "packaging" | "illustration";
}

/**
 * Gallery shorthand. Each entry is `"<file number>|<alt text>"`, optionally
 * `"|chart"` to mark it as a reference image rather than a styled photo.
 * Files live in public/products/<slug>/, pulled by scripts/fetch-photos.mjs.
 */
function gallery(slug: string, ...entries: string[]): ProductImage[] {
  return entries.map((entry) => {
    const [n, alt, kind] = entry.split("|");
    return {
      src: `/products/${slug}/${n}.webp`,
      alt,
      kind: (kind as ProductImage["kind"]) ?? "photo",
    };
  });
}

export interface OptionAxis {
  name: string; // e.g. "Color"
  values: string[];
}

export interface Variant {
  id: string; // stable id, e.g. "regular|pistachio-green"
  options: Record<string, string>;
  price: Cents;
  available: boolean;
}

export interface ProductDetails {
  included?: string[];
  packaging?: string;
  dimensions?: string[];
  materials?: string;
  care?: string;
  shipping?: string;
}

export interface Product {
  slug: string;
  name: string;
  category: Category;
  blurb: string;
  description: string[];
  art: ArtKind;
  images: ProductImage[];
  options: OptionAxis[];
  variants: Variant[];
  minPrice: Cents;
  maxPrice: Cents;
  priceStatus: "confirmed" | "placeholder";
  details: ProductDetails;
  badges?: string[];
  /** Sold as a set of exactly six mini books. */
  setOfSix?: boolean;
  /** Requires exactly six custom titles before it can be added to the cart. */
  customSet?: boolean;
  /** One personalization field (e.g. a single book title). */
  customSingle?: boolean;
  /** Six included titles for ready-made sets, when confirmed. */
  includedTitles?: string[] | null;
  related: string[];
  available: boolean;
}

/* ─── Shared option data ───────────────────────────────────────────────────── */

export const SHELF_COLORS: { name: string; hex: string }[] = [
  { name: "Pistachio Green", hex: "#b5c9a3" },
  { name: "Camel Tan", hex: "#c9a876" },
  { name: "Peachy Pink", hex: "#f2b5a0" },
  { name: "Hot Pink", hex: "#e56b9f" },
  { name: "Bright White", hex: "#f5f2ec" },
  { name: "Midnight Black", hex: "#3a3a3c" },
  { name: "Navy Blue", hex: "#33456b" },
  { name: "Espresso Brown", hex: "#5d4636" },
  { name: "Lilac Purple", hex: "#b9a8d1" },
  { name: "Sky Blue", hex: "#a9c6e0" },
];

export const COVER_STYLES = ["Front, Back & Spine", "Double-Sided, No Spine"];

export const SHELF_THEMES = [
  { id: "tbr", name: "My TBR", line: "The ones waiting patiently." },
  { id: "five-star", name: "Five-Star Reads", line: "Only the very best." },
  { id: "finished", name: "Books I've Finished", line: "A tiny trophy shelf." },
  { id: "favorites", name: "All-Time Favorites", line: "The comfort classics." },
  { id: "series", name: "A Favorite Series", line: "The whole saga, together." },
  { id: "comfort", name: "Comfort Reads", line: "For rainy afternoons." },
  { id: "kindle", name: "Kindle Reads", line: "Give your e-books a shelf." },
  { id: "custom", name: "My Own Collection", line: "A theme all your own." },
] as const;

export type ShelfThemeId = (typeof SHELF_THEMES)[number]["id"];

const vid = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/* ─── Builders ─────────────────────────────────────────────────────────────── */

function shelfVariants(
  prices: { regular: Cents; miniature: Cents },
  extra?: { axis: OptionAxis; delta: Record<string, Cents> },
): { options: OptionAxis[]; variants: Variant[] } {
  const options: OptionAxis[] = [
    { name: "Size", values: ["Regular", "Miniature"] },
    { name: "Color", values: SHELF_COLORS.map((c) => c.name) },
  ];
  if (extra) options.push(extra.axis);
  const variants: Variant[] = [];
  for (const size of options[0].values) {
    for (const color of options[1].values) {
      const base = size === "Regular" ? prices.regular : prices.miniature;
      if (extra) {
        for (const v of extra.axis.values) {
          variants.push({
            id: `${vid(size)}|${vid(color)}|${vid(v)}`,
            options: { Size: size, Color: color, [extra.axis.name]: v },
            price: base + (extra.delta[v] ?? 0),
            available: true,
          });
        }
      } else {
        variants.push({
          id: `${vid(size)}|${vid(color)}`,
          options: { Size: size, Color: color },
          price: base,
          available: true,
        });
      }
    }
  }
  return { options, variants };
}

function simpleVariants(
  price: Cents,
  axis?: OptionAxis,
  unavailable: string[] = [],
): { options: OptionAxis[]; variants: Variant[] } {
  if (!axis) {
    return {
      options: [],
      variants: [{ id: "default", options: {}, price, available: true }],
    };
  }
  return {
    options: [axis],
    variants: axis.values.map((v) => ({
      id: vid(v),
      options: { [axis.name]: v },
      price,
      available: !unavailable.includes(v),
    })),
  };
}

interface Draft
  extends Omit<Product, "minPrice" | "maxPrice" | "available" | "related"> {
  related?: string[];
  available?: boolean;
}

function make(p: Draft): Product {
  const prices = p.variants.map((v) => v.price);
  return {
    related: [],
    ...p,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    available: p.available ?? p.variants.some((v) => v.available),
  };
}

/* ─── Shared copy ──────────────────────────────────────────────────────────── */

const SHELF_MATERIALS =
  "Printed in sturdy, plant-based PLA with a soft matte finish. Each shelf is made to order in our little studio.";
const SHELF_CARE =
  "Dust gently with a dry cloth. Keep away from direct heat and long hours of sunlight. PLA prefers a cozy corner, just like a reader.";
const SHELF_SHIPPING =
  "Wrapped carefully and shipped in protective packaging. Made-to-order production and dispatch times are listed at checkout and on the Shipping page.";
const BOOK_MATERIALS =
  "Each mini book is printed on matte cardstock and mounted by hand on a foamboard core. The books are decorative and do not open.";
const BOOK_SIZE = "Each book measures about 1 × 1.4 in and 0.25 in thick.";
const SET_PACKAGING =
  "Arrives on our illustrated six-slot backing card, each tiny story tucked into its own window.";

/**
 * Every shelf is photographed to the same eight-shot script, so one line here
 * gives each of them a consistent gallery: hero, scale, dimensions, colors.
 */
const shelfGallery = (slug: string, shelf: string, hero: string) =>
  gallery(
    slug,
    `01|${hero}`,
    `07|Regular and Miniature ${shelf} side by side, both filled with mini books`,
    `08|Measured diagram of the Regular and Miniature ${shelf}|chart`,
    `03|The ten shelf colors, from pistachio green to sky blue|chart`,
    `06|Regular next to Miniature, empty, so you can judge the difference`,
    `04|The full color range lined up on a wood floor`,
  );

/* ─── Catalog ──────────────────────────────────────────────────────────────── */

export const PRODUCTS: Product[] = [
  /* ─── Mini bookshelves ─── */
  make({
    slug: "mini-scalloped-bookshelf",
    name: "Mini Scalloped Bookshelf",
    category: "bookshelves",
    blurb: "Our best-loved shelf, with a soft scalloped edge on every tier.",
    description: [
      "This is the one people photograph. Each tier ends in a row of gentle scallops, so even an empty shelf looks like it belongs in a storybook.",
      "Regular holds about 68 mini books. Miniature is sized for a bedside table or the gap beside your monitor. Both keep spines out and proud, with room on top for a plant.",
    ],
    art: "shelf-scalloped",
    images: shelfGallery(
      "mini-scalloped-bookshelf",
      "scalloped shelf",
      "Peachy pink Mini Scalloped Bookshelf, styled with a full collection of mini books",
    ),
    ...shelfVariants({ regular: 36900, miniature: 35900 }),
    priceStatus: "confirmed",
    details: {
      dimensions: [
        "Regular: 8.5 in H × 5 in W × 1.5 in D, holds about 68 mini books",
        "Miniature: 6.5 in H × 3.9 in W × 1.5 in D, holds about 39 mini books",
      ],
      materials: SHELF_MATERIALS,
      care: SHELF_CARE,
      shipping: SHELF_SHIPPING,
      included: ["One mini bookshelf in your chosen size and color"],
      packaging:
        "Ships in our illustrated Little Bookshop box when bundled with a book set.",
    },
    related: ["custom-mini-book-set", "mini-plants", "mini-basic-bookshelf"],
  }),
  make({
    slug: "mini-basic-bookshelf",
    name: "Mini Basic Bookshelf",
    category: "bookshelves",
    blurb: "Clean lines and square corners. The shelf that lets your spines do the talking.",
    description: [
      "Straight edges, four even tiers, nothing competing for attention. That is why it suits any room, from cottage clutter to a minimalist desk.",
      "Best for loud collections. A rainbow of mini spines needs a plain frame, and this one gives them 66 slots.",
    ],
    art: "shelf-basic",
    images: shelfGallery(
      "mini-basic-bookshelf",
      "basic shelf",
      "Bright white Mini Basic Bookshelf, four clean tiers of mini books",
    ),
    ...shelfVariants({ regular: 36500, miniature: 35500 }),
    priceStatus: "confirmed",
    details: {
      dimensions: [
        "Regular: 8.5 in H × 5 in W × 1.5 in D, holds about 66 mini books",
        "Miniature: 6.4 in H × 3.9 in W × 1.5 in D, holds about 39 mini books",
      ],
      materials: SHELF_MATERIALS,
      care: SHELF_CARE,
      shipping: SHELF_SHIPPING,
      included: ["One mini bookshelf in your chosen size and color"],
    },
    related: ["mini-scalloped-bookshelf", "custom-mini-book-set", "mini-rug"],
  }),
  make({
    slug: "mini-fancy-bookshelf",
    name: "Mini Fancy Bookshelf",
    category: "bookshelves",
    blurb: "Crown moulding and trim, for shelves that dress for dinner.",
    description: [
      "The classic shape with a cornice on top and detail down the sides. The difference between a bookcase and a bookcase in a period drama.",
      "Our tallest slim shelf at nine inches, so it fits a windowsill or the narrow strip beside a monitor. 54 mini books in the Regular, 36 in the Miniature.",
    ],
    art: "shelf-fancy",
    images: shelfGallery(
      "mini-fancy-bookshelf",
      "fancy shelf",
      "Cream Mini Fancy Bookshelf with trimmed cornice, filled with mini books",
    ),
    ...shelfVariants({ regular: 36900, miniature: 35900 }),
    priceStatus: "confirmed",
    details: {
      dimensions: [
        "Regular: 9 in H × 4.25 in W × 1.5 in D, holds about 54 mini books",
        "Miniature: 6.5 in H × 4.25 in W × 1.5 in D, holds about 36 mini books",
      ],
      materials: SHELF_MATERIALS,
      care: SHELF_CARE,
      shipping: SHELF_SHIPPING,
      included: ["One mini bookshelf in your chosen size and color"],
    },
    related: ["mini-medieval-bookshelf", "mini-fish-tank", "custom-mini-book-set"],
  }),
  make({
    slug: "mini-cube-bookshelf",
    name: "Mini Cube Bookshelf",
    category: "bookshelves",
    blurb: "Square cubbies for the sorters. Everything in its own little room.",
    description: [
      "A tiny take on the cube organizer. Four square compartments, which turns out to be the most satisfying way to shelve a collection: one series per cubby, or one mood, or one color.",
      "Square cubbies waste less space than open tiers, so the Miniature still holds 42 mini books. It is also the only shelf where a mini plant gets a whole room to itself.",
    ],
    art: "shelf-cube",
    images: shelfGallery(
      "mini-cube-bookshelf",
      "cube shelf",
      "White Mini Cube Bookshelf with four square cubbies of sorted mini books",
    ),
    ...shelfVariants({ regular: 36500, miniature: 35500 }),
    priceStatus: "confirmed",
    details: {
      dimensions: [
        "Regular: holds about 56 mini books",
        "Miniature: holds about 42 mini books",
      ],
      materials: SHELF_MATERIALS,
      care: SHELF_CARE,
      shipping: SHELF_SHIPPING,
      included: ["One mini bookshelf in your chosen size and color"],
    },
    related: ["mini-basic-bookshelf", "mini-plants", "mini-bean-bag-chair"],
  }),
  make({
    slug: "mini-arched-bookshelf",
    name: "Mini Arched Bookshelf",
    category: "bookshelves",
    blurb: "A soft arch on top, like a doorway into your collection. Our most-gifted shelf.",
    description: [
      "The curve is borrowed from old shop windows and garden gates. An arch reads as an entrance, so the books inside stop looking stored and start looking kept.",
      "It is also our most affordable, and the one we point first-timers toward. A Miniature arch plus one set of six is the whole idea of this shop.",
    ],
    art: "shelf-arched",
    images: shelfGallery(
      "mini-arched-bookshelf",
      "arched shelf",
      "Blush Mini Arched Bookshelf, arch framing a full row of mini books",
    ),
    ...shelfVariants({ regular: 35900, miniature: 34900 }),
    priceStatus: "confirmed",
    details: {
      dimensions: [
        "Regular: holds about 62 mini books",
        "Miniature: holds about 35 mini books",
      ],
      materials: SHELF_MATERIALS,
      care: SHELF_CARE,
      shipping: SHELF_SHIPPING,
      included: ["One mini bookshelf in your chosen size and color"],
    },
    related: ["mini-scalloped-bookshelf", "custom-mini-book-set", "mini-rug"],
  }),
  make({
    slug: "mini-medieval-bookshelf",
    name: "Mini Medieval Bookshelf",
    category: "bookshelves",
    blurb: "Gothic arches and an optional leaning ladder. A very small, very serious library.",
    description: [
      "For readers whose dream library has stone arches and weather outside. Pointed arch openings, a heavy cornice, and the proportions of somewhere you would need a key to get into.",
      "Add the ladder and it leans against the frame exactly as it should. Sixty mini books in the Regular, our largest shelf.",
    ],
    art: "shelf-medieval",
    images: shelfGallery(
      "mini-medieval-bookshelf",
      "medieval shelf",
      "Espresso brown Mini Medieval Bookshelf with its matching leaning ladder",
    ),
    ...shelfVariants(
      { regular: 36900, miniature: 35900 },
      {
        axis: { name: "Ladder", values: ["Ladder Included", "No Ladder"] },
        delta: { "Ladder Included": 1000, "No Ladder": 0 },
      },
    ),
    priceStatus: "confirmed",
    details: {
      dimensions: [
        "Regular: 9.3 in H × 5.4 in W × 1.7 in D, holds about 60 mini books",
        "Miniature: 7.2 in H × 4.2 in W × 1.7 in D, holds about 33 mini books",
      ],
      materials: SHELF_MATERIALS,
      care: SHELF_CARE,
      shipping: SHELF_SHIPPING,
      included: [
        "One mini bookshelf in your chosen size and color",
        "Matching mini ladder, when selected",
      ],
    },
    related: ["mini-fancy-bookshelf", "custom-mini-book-set", "mini-plants"],
  }),

  /* ─── Miniature books (always sets of six) ─── */
  make({
    slug: "custom-mini-book-set",
    name: "Custom Mini Book Set",
    category: "mini-books",
    blurb: "Name six books and we make them small.",
    description: [
      "Send us six titles and we will shrink them: your five-star reads, your comfort rereads, the series that got you through a bad winter. We source each cover, scale it down, print it on matte cardstock, and mount it by hand on a foamboard core.",
      "Six is what fits the backing card, and six is about as many favorites as anyone can name without hedging.",
      "Choose Front, Back & Spine for shelving, or Double-Sided if the set is going in a TBR jar where both faces show.",
      `${BOOK_SIZE} ${BOOK_MATERIALS}`,
    ],
    art: "books-custom",
    images: gallery(
      "custom-mini-book-set",
      "01|Three custom mini books held in a hand, covers facing out",
      "03|A single mini book held up against the full-size edition behind it",
      "04|The back and spine of a mini book, showing its foamboard thickness",
      "05|A mini book balanced between two fingertips for scale",
      "08|Custom mini books shelved on a blush arched bookshelf beside a mini plant",
      "07|A pair of mini shelves filled with custom sets, next to their full-size originals",
    ),
    ...simpleVariants(74900, { name: "Cover Style", values: COVER_STYLES }),
    priceStatus: "placeholder",
    badges: ["Set of six", "Made to order"],
    setOfSix: true,
    customSet: true,
    includedTitles: null,
    details: {
      included: ["Six custom mini books, made from your list"],
      packaging: SET_PACKAGING,
      dimensions: [BOOK_SIZE],
      materials: BOOK_MATERIALS,
      care: "Keep dry. Wipe gently with a soft, dry cloth.",
      shipping: SHELF_SHIPPING,
    },
    related: ["mini-scalloped-bookshelf", "mini-book-keychain", "mini-plants"],
  }),
  make({
    slug: "mini-twilight-saga-set",
    name: "Mini Twilight Saga Set",
    category: "mini-books",
    blurb: "The whole Forks shelf in miniature.",
    description: [
      "The original four, plus Midnight Sun and Life and Death. Those covers have been recognizable from across a room for twenty years, and they lose none of it at an inch.",
      "The set people buy for someone who read them at thirteen and never quite let go.",
      `${BOOK_SIZE} ${BOOK_MATERIALS}`,
    ],
    art: "books-set",
    images: gallery(
      "mini-twilight-saga-set",
      "01|The mini Twilight saga fanned out across the pages of an open book",
      "03|Six mini saga covers held in one hand",
      "02|The full set laid flat, all six covers face up",
      "04|Cover and spine options: front, back and spine, or double-sided|chart",
    ),
    ...simpleVariants(64900, { name: "Cover Style", values: COVER_STYLES }),
    priceStatus: "placeholder",
    badges: ["Set of six"],
    setOfSix: true,
    includedTitles: [
      "Twilight",
      "New Moon",
      "Eclipse",
      "Breaking Dawn",
      "Midnight Sun",
      "Life and Death",
    ],
    details: {
      included: ["Six ready-made mini books from the saga"],
      packaging: SET_PACKAGING,
      dimensions: [BOOK_SIZE],
      materials: BOOK_MATERIALS,
      care: "Keep dry. Wipe gently with a soft, dry cloth.",
      shipping: SHELF_SHIPPING,
    },
    related: ["custom-mini-book-set", "mini-arched-bookshelf", "twilight-book-stack-sticker"],
  }),
  make({
    slug: "mini-sarah-j-maas-set",
    name: "Mini Sarah J. Maas Set",
    category: "mini-books",
    blurb: "Six tiny doors into Prythian, Erilea and the rest.",
    description: [
      "A six-book selection from across the Maas-iverse, sized so the whole thing fits in a closed hand. Those jewel-toned spines were made for a shelf, and shrinking them only makes the color read harder.",
      "The exact six included are listed with your order confirmation.",
      `${BOOK_SIZE} ${BOOK_MATERIALS}`,
    ],
    art: "books-set",
    images: gallery(
      "mini-sarah-j-maas-set",
      "01|Six mini Sarah J. Maas covers fanned across a hand",
      "03|The full set spread out, jewel-toned covers face up",
      "08|The set stood spine-out in a row, held between finger and thumb",
      "07|Mini spines lined up along the gutter of an open book",
      "06|The stack held together in one hand for scale",
    ),
    ...simpleVariants(67900, { name: "Cover Style", values: COVER_STYLES }),
    priceStatus: "placeholder",
    badges: ["Set of six"],
    setOfSix: true,
    includedTitles: null,
    details: {
      included: ["Six ready-made mini books from the series"],
      packaging: SET_PACKAGING,
      dimensions: [BOOK_SIZE],
      materials: BOOK_MATERIALS,
      care: "Keep dry. Wipe gently with a soft, dry cloth.",
      shipping: SHELF_SHIPPING,
    },
    related: ["mini-fourth-wing-set", "custom-mini-book-set", "mini-medieval-bookshelf"],
  }),
  make({
    slug: "mini-fourth-wing-set",
    name: "Mini Fourth Wing Series Set",
    category: "mini-books",
    blurb: "Dragons, war college, and very small spines. Six from the Empyrean.",
    description: [
      "Fourth Wing, Iron Flame, Onyx Storm and the special editions. The sprayed-edge covers translate beautifully at this size.",
      "The exact six included are listed with your order confirmation.",
      `${BOOK_SIZE} ${BOOK_MATERIALS}`,
    ],
    art: "books-set",
    images: gallery(
      "mini-fourth-wing-set",
      "01|Mini Fourth Wing, Iron Flame and Onyx Storm covers laid on an open book",
      "05|The Empyrean set held in one hand, covers facing out",
      "03|The full set fanned across a page",
      "04|Three mini covers standing upright against the spine of a paperback",
      "06|Cover and spine options: front, back and spine, or double-sided|chart",
    ),
    ...simpleVariants(67900, { name: "Cover Style", values: COVER_STYLES }),
    priceStatus: "placeholder",
    badges: ["Set of six"],
    setOfSix: true,
    includedTitles: null,
    details: {
      included: ["Six ready-made mini books from the series"],
      packaging: SET_PACKAGING,
      dimensions: [BOOK_SIZE],
      materials: BOOK_MATERIALS,
      care: "Keep dry. Wipe gently with a soft, dry cloth.",
      shipping: SHELF_SHIPPING,
    },
    related: ["mini-sarah-j-maas-set", "special-edition-fourth-wing-sticker", "custom-mini-book-set"],
  }),
  make({
    slug: "mini-jenny-han-set",
    name: "Mini Jenny Han Summer Set",
    category: "mini-books",
    blurb: "Both trilogies, side by side. Six summers on one small shelf.",
    description: [
      "The Summer I Turned Pretty and the Lara Jean letters together: six pastel spines that smell faintly of sunscreen and first love.",
      "The softest-looking set we make. Put it on a white shelf and it reads as a color palette.",
      `${BOOK_SIZE} ${BOOK_MATERIALS}`,
    ],
    art: "books-set",
    images: gallery(
      "mini-jenny-han-set",
      "01|Pastel mini covers from both trilogies spread across an open book",
      "03|The six covers fanned out in one hand",
      "02|The set stood upright in a row on a page",
      "04|A single mini cover held between finger and thumb for scale",
      "05|Cover and spine options: front, back and spine, or double-sided|chart",
    ),
    ...simpleVariants(64900, { name: "Cover Style", values: COVER_STYLES }),
    priceStatus: "placeholder",
    badges: ["Set of six"],
    setOfSix: true,
    includedTitles: [
      "The Summer I Turned Pretty",
      "It's Not Summer Without You",
      "We'll Always Have Summer",
      "To All the Boys I've Loved Before",
      "P.S. I Still Love You",
      "Always and Forever, Lara Jean",
    ],
    details: {
      included: ["Six ready-made mini books across both trilogies"],
      packaging: SET_PACKAGING,
      dimensions: [BOOK_SIZE],
      materials: BOOK_MATERIALS,
      care: "Keep dry. Wipe gently with a soft, dry cloth.",
      shipping: SHELF_SHIPPING,
    },
    related: ["custom-mini-book-set", "mini-basic-bookshelf", "mini-rug"],
  }),
  make({
    slug: "mini-freida-mcfadden-set",
    name: "Mini Freida McFadden Thriller Set",
    category: "mini-books",
    blurb: "Six twisty little spines for the thriller shelf. Lock the door first.",
    description: [
      "The Housemaid, Never Lie, Do Not Disturb, The Teacher and company, each shrunk to an inch and mounted by hand.",
      "Red, black and white at this size makes a striking shelf. It looks like a row of tiny warning labels.",
      "The exact six included are listed with your order confirmation.",
      `${BOOK_SIZE} ${BOOK_MATERIALS}`,
    ],
    art: "books-set",
    images: gallery(
      "mini-freida-mcfadden-set",
      "03|Mini thriller covers spread across a desk, titles clearly readable",
      "01|The set scattered beside a laptop",
      "04|Six mini covers laid out in two rows",
      "05|The set arranged next to a notebook and pen",
      "02|The covers viewed at an angle, showing their thickness",
    ),
    ...simpleVariants(67900, { name: "Cover Style", values: COVER_STYLES }),
    priceStatus: "placeholder",
    badges: ["Set of six"],
    setOfSix: true,
    includedTitles: null,
    details: {
      included: ["Six ready-made mini books from the author's catalog"],
      packaging: SET_PACKAGING,
      dimensions: [BOOK_SIZE],
      materials: BOOK_MATERIALS,
      care: "Keep dry. Wipe gently with a soft, dry cloth.",
      shipping: SHELF_SHIPPING,
    },
    related: ["freida-mcfadden-book-stack-sticker", "custom-mini-book-set", "mini-cube-bookshelf"],
  }),

  /* ─── Keychains ─── */
  make({
    slug: "mini-book-keychain",
    name: "Mini Book Keychain",
    category: "keychains",
    blurb: "One book, your choice, on your keys.",
    description: [
      "A single mini book sealed in clear acrylic on a steel ring, so the story that means something to you rides along on your keys or your bag.",
      "Tell us the title and we will make it small, front and back, both readable.",
      "Arrives on our illustrated hanging card, which makes it an easy gift.",
    ],
    art: "keychain-book",
    images: gallery(
      "mini-book-keychain",
      "01|Two mini book keychains held in a hand, covers facing out",
      "04|A mini book keychain laid flat beside its steel ring",
      "05|A keychain held up against the full-size edition of the same book",
      "03|The keychain hanging from a finger, showing the acrylic case",
      "06|The reverse of the keychain, with the back cover blurb printed",
    ),
    ...simpleVariants(14900),
    priceStatus: "placeholder",
    badges: ["Personalized", "Made to order"],
    customSingle: true,
    details: {
      included: ["One custom mini book on a keyring"],
      packaging: "Arrives on our illustrated Little Bookshop hanging card.",
      dimensions: ["Book charm about 1 × 1.4 in; hangs about 3 in with ring"],
      materials:
        "Matte cardstock cover on a foamboard core, sealed for daily carry, with a steel keyring.",
      care: "Splash-friendly, not swim-friendly. Wipe dry if it gets caught in the rain.",
      shipping: SHELF_SHIPPING,
    },
    related: ["custom-mini-book-set", "book-stack-acrylic-keychain", "mini-book-lover-sticker-sheet"],
  }),
  make({
    slug: "book-stack-acrylic-keychain",
    name: "Book Stack Acrylic Keychain",
    category: "keychains",
    blurb: "A leaning stack of books in clear acrylic.",
    description: [
      "Our illustrated stack, five books piled the way books actually pile, printed crisp on durable clear acrylic with a sturdy ring.",
      "Two inches square, light enough that you forget it is there until someone points at it.",
    ],
    art: "keychain-acrylic",
    images: gallery(
      "book-stack-acrylic-keychain",
      "01|Book stack acrylic keychain laid flat on a kraft background",
      "02|The keychain held in a hand for scale",
    ),
    ...simpleVariants(17900),
    priceStatus: "confirmed",
    details: {
      dimensions: ["About 2 × 2 in"],
      materials: "Printed acrylic charm with metal keyring.",
      care: "Wipe clean with a soft cloth.",
      shipping: SHELF_SHIPPING,
    },
    related: ["bookstore-acrylic-keychain", "mini-book-keychain", "emily-henry-book-stack-sticker"],
  }),
  make({
    slug: "bookstore-acrylic-keychain",
    name: "Bookstore Acrylic Keychain",
    category: "keychains",
    blurb: "A tiny storefront with the lights on.",
    description: [
      "A little shop with warm windows and full shelves, printed on clear acrylic. For everyone whose happy place has a bell above the door.",
    ],
    art: "keychain-acrylic",
    images: gallery(
      "bookstore-acrylic-keychain",
      "01|Bookstore acrylic keychain laid flat, storefront illustration visible",
      "02|The keychain held in a hand for scale",
    ),
    ...simpleVariants(17900),
    priceStatus: "confirmed",
    details: {
      dimensions: ["About 2 × 2 in"],
      materials: "Printed acrylic charm with metal keyring.",
      care: "Wipe clean with a soft cloth.",
      shipping: SHELF_SHIPPING,
    },
    related: ["book-stack-acrylic-keychain", "mini-book-keychain", "bookish-castle-acrylic-keychain"],
  }),
  make({
    slug: "bookish-castle-acrylic-keychain",
    name: "Castle Library Acrylic Keychain",
    category: "keychains",
    blurb: "Turrets, towers, and presumably a library somewhere inside.",
    description: [
      "A storybook castle in clear acrylic, with enough spires to suggest at least one restricted section.",
    ],
    art: "keychain-acrylic",
    images: gallery(
      "bookish-castle-acrylic-keychain",
      "01|Castle library acrylic keychain laid flat on a white background",
      "02|The castle keychain held in a hand for scale",
    ),
    ...simpleVariants(17900),
    priceStatus: "confirmed",
    details: {
      dimensions: ["About 2 × 1.5 in"],
      materials: "Printed acrylic charm with metal keyring.",
      care: "Wipe clean with a soft cloth.",
      shipping: SHELF_SHIPPING,
    },
    related: ["bookstore-acrylic-keychain", "book-stack-acrylic-keychain", "mini-medieval-bookshelf"],
  }),

  /* ─── Stickers ─── */
  make({
    slug: "mini-book-lover-sticker-sheet",
    name: "Mini Book Lover Sticker Sheet",
    category: "stickers",
    blurb: "One sheet, a dozen tiny bookish things.",
    description: [
      "Book stacks, a storefront, a tote, a little shelf and a lettering piece. A 3 × 4.5 inch sheet printed with eco-friendly ink and cut ready to peel.",
      "Sized deliberately small, for the margin of a reading journal or the back of a Kindle.",
    ],
    art: "sticker-sheet",
    images: gallery(
      "mini-book-lover-sticker-sheet",
      "01|The mini book lover sticker sheet held up, all designs visible",
      "02|Individual stickers peeled off and arranged on a desk",
      "06|A book stack sticker applied to the lid of a laptop",
      "08|The sticker sheet resting on a closed notebook",
      "03|A pile of cut sticker sheets",
    ),
    options: [],
    variants: [{ id: "default", options: {}, price: 12900, available: false }],
    priceStatus: "confirmed",
    details: {
      dimensions: ["Sheet is 3 × 4.5 in"],
      materials: "Printed with eco-friendly ink.",
      shipping: SHELF_SHIPPING,
    },
    related: ["emily-henry-book-stack-sticker", "mini-book-keychain", "twilight-book-stack-sticker"],
  }),
  ...(
    [
      ["emily-henry-book-stack-sticker", "Emily Henry Inspired Book Stack Sticker", "Beach reads, happy places and funny stories, stacked in the sun.", "Every summer she publishes and every summer we all pretend to be surprised. A warm, sun-yellow stack for the people who reread these on purpose.", true],
      ["abby-jimenez-book-stack-sticker", "Abby Jimenez Inspired Book Stack Sticker", "Love stories that make you laugh, then quietly wreck you.", "The ones that are funny for two hundred pages and then are not. A soft, hopeful stack for readers who like to be ambushed.", true],
      ["special-edition-fourth-wing-sticker", "Special Edition Fourth Wing Book Stack Sticker", "The dragon-edged special editions, in one very glossy stack.", "Sprayed edges, foiled dragons, the whole Empyrean production. If your copies live on a display stand rather than a shelf, this is your sticker.", true],
      ["magnolia-parks-book-stack-sticker", "Magnolia Parks Book Stack Sticker", "London, longing, and a very dramatic stack of spines.", "Fashion, heartbreak and extremely poor decision-making, in a stack of covers that look like a magazine spread. Worn best on a laptop in a coffee shop.", true],
      ["twilight-book-stack-sticker", "Twilight Book Stack Sticker", "The saga stack. Hands holding an apple not included.", "Black, red and white, legible from across a lecture hall. Twenty years on, this stack still starts conversations.", true],
      ["freida-mcfadden-book-stack-sticker", "Freida McFadden Book Stack Sticker", "A stack of thrillers that all end with a gasp.", "The housemaid, the teacher, the coworker, the inmate. Six-hour reads with one-hour endings, piled up where your water bottle can show them off.", true],
      ["mary-kubica-book-stack-sticker", "Mary Kubica Book Stack Sticker", "Quiet covers, loud twists. For the suspense shelf.", "Muted, misty covers hiding a great deal of trouble. A restrained-looking stack for a reader who is anything but.", true],
      ["acotar-book-stack-sticker", "ACOTAR Book Stack Sticker", "To the stars who listen, and the readers who sticker.", "Thorns, mist, wings and ruin, stacked in order. Currently sold out, which surprises absolutely nobody.", false],
    ] as [string, string, string, string, boolean][]
  ).map(([slug, name, blurb, line, available]) =>
    make({
      slug,
      name,
      category: "stickers",
      blurb,
      description: [
        line,
        "Printed on waterproof, weather-resistant vinyl at about 3 × 3 inches, with a clean die cut around the stack. Happy on Kindles, phones, laptop lids, water bottles and notebooks.",
      ],
      art: "sticker-stack",
      images: gallery(
        slug,
        `01|${name} shown flat, every spine in the stack readable`,
        `02|The sticker applied and photographed in use`,
      ),
      options: [],
      variants: [{ id: "default", options: {}, price: 7900, available }],
      priceStatus: "confirmed",
      details: {
        dimensions: ["About 3 × 3 in"],
        materials: "Waterproof, weather-resistant vinyl sticker.",
        shipping: SHELF_SHIPPING,
      },
      related: ["mini-book-lover-sticker-sheet", "custom-mini-book-set", "mini-book-keychain"],
    }),
  ),

  /* ─── Shelf accessories ─── */
  make({
    slug: "mini-plants",
    name: "Mini Plants",
    category: "accessories",
    blurb: "Every good shelf has a plant. Ours is 1.25 inches tall and never needs water.",
    description: [
      "The fastest way to make a shelf look lived-in. A tiny potted plant in a little white pot that sits on a top tier or in a spare cubby.",
      "Styles ship at random, so no two shelves end up alike. Order a few; they look best in odd numbers.",
    ],
    art: "plant",
    images: gallery(
      "mini-plants",
      "01|A mini plant in its white pot on the top tier of a styled shelf",
      "04|A hand placing a mini plant onto a white mini bookshelf",
      "05|A mini plant beside a row of mini books on a white shelf",
      "03|A mini plant held between finger and thumb, showing its 1.25 inch height",
      "02|Examples of the plant styles that ship at random|chart",
    ),
    ...simpleVariants(4900),
    priceStatus: "confirmed",
    details: {
      dimensions: ["About 1.25 in tall"],
      materials: "Assorted styles; style is a surprise.",
      shipping: SHELF_SHIPPING,
    },
    related: ["mini-rug", "mini-fish-tank", "mini-bean-bag-chair"],
  }),
  make({
    slug: "mini-fish-tank",
    name: "Mini Fish Tank",
    category: "accessories",
    blurb: "A one-inch aquarium. Gravel, plants, one fish.",
    description: [
      "A genuinely tiny tank with a gravel bed, a strand of green, and a single fish suspended mid-swim. The detail people notice last and comment on first.",
      "Pick your fish in orange, white, black or yellow. No filter, no holiday sitter.",
    ],
    art: "fishtank",
    images: gallery(
      "mini-fish-tank",
      "01|Three mini fish tanks lined up on a white shelf",
      "04|Mini fish tanks styled on a pink and a white mini bookshelf",
      "08|Two mini fish tanks side by side, gravel and plants visible",
      "03|The four fish colors: orange, white, black and yellow|chart",
      "02|Fish color guide for the mini tank|chart",
    ),
    ...simpleVariants(9900, {
      name: "Fish Color",
      values: ["Orange", "White", "Black", "Yellow"],
    }),
    priceStatus: "confirmed",
    details: {
      dimensions: ["About 1 in tall × 1 in wide × 0.5 in deep"],
      shipping: SHELF_SHIPPING,
    },
    related: ["mini-plants", "mini-rug", "mini-cube-bookshelf"],
  }),
  make({
    slug: "mini-bean-bag-chair",
    name: "Mini Bean Bag Chair",
    category: "accessories",
    blurb: "A squashy little reading chair with its own one-inch pillow.",
    description: [
      "Somewhere for an imaginary reader to flop. Soft polyester, properly squashy, in five colors, with a matching one-inch pillow, because a bean bag without a pillow is just a bag.",
      "Sat beside a mini shelf with a rug underneath, it stops being a shelf and starts being a room.",
    ],
    art: "beanbag",
    images: gallery(
      "mini-bean-bag-chair",
      "01|Five mini bean bag chairs in a row, one in each color",
      "05|A mini bean bag chair and rug staged beside a white mini bookshelf",
      "06|Bean bags and a mini rug arranged into a tiny reading corner",
      "03|The five bean bag colors, labelled|chart",
      "02|Bean bag chair color guide|chart",
    ),
    ...simpleVariants(14900, {
      name: "Color",
      values: [
        "Pistachio Green",
        "Sky Blue",
        "Espresso Brown",
        "Peachy Pink",
        "Lilac Purple",
      ],
    }),
    priceStatus: "confirmed",
    details: {
      dimensions: ["About 6 in wide, with a 1 × 1 in pillow"],
      materials: "100% polyester fabric.",
      shipping: SHELF_SHIPPING,
    },
    related: ["mini-rug", "mini-plants", "mini-scalloped-bookshelf"],
  }),
  make({
    slug: "mini-rug",
    name: "Mini Rug",
    category: "accessories",
    blurb: "Five inches of ultra-soft round rug.",
    description: [
      "Deep, plush and round, in four colors chosen to flatter a shelf rather than compete with it. Lay it under a mini bookshelf and the arrangement reads as a room instead of a row of objects.",
      "Ivory Cream and Oat Beige disappear politely. Sky Blue and Dusty Rose do not, which is sometimes the point.",
    ],
    art: "rug",
    images: gallery(
      "mini-rug",
      "01|A mini rug laid beneath a white mini bookshelf and bean bag",
      "05|A mini rug and bean bag chair styled into a tiny reading nook",
      "03|The four rug colors: ivory cream, sky blue, oat beige and dusty rose|chart",
      "06|A hand holding a mini rug, showing the plush pile and backing",
      "04|Close-up of the rug colors side by side|chart",
    ),
    ...simpleVariants(9900, {
      name: "Color",
      values: ["Ivory Cream", "Sky Blue", "Oat Beige", "Dusty Rose"],
    }),
    priceStatus: "confirmed",
    details: {
      dimensions: ["About 5 in wide"],
      materials: "Ultra-soft plush fabric.",
      shipping: SHELF_SHIPPING,
    },
    related: ["mini-bean-bag-chair", "mini-plants", "mini-basic-bookshelf"],
  }),
];

/* ─── Lookup helpers ───────────────────────────────────────────────────────── */

const bySlug = new Map(PRODUCTS.map((p) => [p.slug, p]));

export function getProduct(slug: string): Product | undefined {
  return bySlug.get(slug);
}

export function getVariant(product: Product, variantId: string): Variant | undefined {
  return product.variants.find((v) => v.id === variantId);
}

export function productsInCategory(category: Category): Product[] {
  return PRODUCTS.filter((p) => p.category === category);
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return PRODUCTS;
  return PRODUCTS.filter((p) =>
    [p.name, p.blurb, p.category, ...(p.badges ?? []), ...p.description]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
}

export function colorHex(name: string): string | undefined {
  return SHELF_COLORS.find((c) => c.name === name)?.hex;
}

export function defaultVariant(product: Product): Variant {
  return product.variants.find((v) => v.available) ?? product.variants[0];
}

export const SET_SIZE = 6;
