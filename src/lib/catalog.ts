import type { Cents } from "./money";

/**
 * ─── The Little Bookshop catalog ─────────────────────────────────────────────
 *
 * Product data lives here, separate from the interface, so names, prices,
 * options, availability and copy can be edited without touching components.
 *
 * Prices, sizes, colors and materials come from the shop's own order form
 * (docs.google.com/forms/.../1FAIpQLSe_DA-jeyOb0tD5gdAdit8dVEv2AlIdLa89exjCIvpYHVkrsw)
 * and are authoritative. Update them there first, then here.
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
      "Three designs, nine colors, two sizes. Classic, Arched or Scalloped, printed to order.",
    art: "shelf-scalloped",
    photo: "/marketing/arched-shelf/15.webp",
  },
  "mini-books": {
    name: "Miniature Books",
    short: "Mini Books",
    blurb:
      "Your titles, made tiny. Sets of six, printed in PLA and assembled by hand.",
    art: "books-set",
    photo: "/marketing/mini-books/05.webp",
  },
  keychains: {
    name: "Keychains",
    short: "Keychains",
    blurb:
      "One favorite book, on your keys. Tell us the title and we will make it small.",
    art: "keychain-book",
    photo: "/marketing/social/03.webp",
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
      "A plant, a ladder, and little word blocks that label a shelf. Fifty pesos each.",
    art: "plant",
    photo: "/marketing/accessories/01.webp",
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

/**
 * The shop's own marketing photography, in public/marketing/<folder>/NN.webp.
 * Entries are `"<folder>/<NN>|<alt>"`, optionally `"|chart"` for the rendered
 * colour line-ups (which carry burned-in colour labels).
 */
function shots(...entries: string[]): ProductImage[] {
  return entries.map((entry) => {
    const [file, alt, kind] = entry.split("|");
    return {
      src: `/marketing/${file}.webp`,
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
  { name: "Blush Pink", hex: "#f2b5a0" },
  { name: "Bone White", hex: "#f5f2ec" },
  { name: "Choco Brown", hex: "#5d4636" },
  { name: "Lilac", hex: "#b9a8d1" },
  { name: "Sage Green", hex: "#b5c9a3" },
  { name: "Camel Tan", hex: "#c9a876" },
  { name: "Banana Yellow", hex: "#efd98a" },
  { name: "Navy Blue", hex: "#33456b" },
  { name: "Midnight Black", hex: "#3a3a3c" },
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
  prices: { regular: Cents; mini: Cents },
  extra?: { axis: OptionAxis; delta: Record<string, Cents> },
): { options: OptionAxis[]; variants: Variant[] } {
  const options: OptionAxis[] = [
    { name: "Size", values: ["Regular", "Mini"] },
    { name: "Color", values: SHELF_COLORS.map((c) => c.name) },
  ];
  if (extra) options.push(extra.axis);
  const variants: Variant[] = [];
  for (const size of options[0].values) {
    for (const color of options[1].values) {
      const base = size === "Regular" ? prices.regular : prices.mini;
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
  "3D printed in PLA plastic, waterproof, and assembled by hand. The books are decorative and do not open.";
const BOOK_SIZE = "Each book measures about 1 × 1.4 in and 0.25 in thick.";
const MADE_BY_HAND = "PLA plastic · waterproof · manually assembled";
const SET_PACKAGING =
  "Arrives on our illustrated six-slot backing card, each tiny story tucked into its own window.";

/* ─── Catalog ──────────────────────────────────────────────────────────────── */

export const PRODUCTS: Product[] = [
  /* ─── Mini bookshelves ─── */
  make({
    slug: "mini-scalloped-bookshelf",
    name: "Mini Scalloped Bookshelf",
    category: "bookshelves",
    blurb: "A scalloped trim along every shelf edge. The sweetest of the three.",
    description: [
      "This is the one people photograph. Each tier ends in a row of gentle scallops, so even an empty shelf looks like it belongs in a storybook.",
      "Regular holds about 68 mini books. Miniature is sized for a bedside table or the gap beside your monitor. Both keep spines out and proud, with room on top for a plant.",
    ],
    art: "shelf-scalloped",
    images: shots(
      "scalloped-shelf/09|A Blush Pink Scalloped bookshelf filled with tiny hardcovers and wooden FAVES letters, standing beside full-size paperbacks",
      "scalloped-shelf/03|An empty Blush Pink Scalloped bookshelf centred on a dark wood table, showing the scalloped trim on every shelf edge",
      "scalloped-shelf/08|Close view of the Scalloped shelf packed with tiny romance paperbacks and wooden FAVES letters",
      "scalloped-shelf/02|The Mini and Regular Scalloped bookshelves side by side and empty, showing the height difference",
      "scalloped-shelf/04|The Mini and Regular Scalloped bookshelves in Sage Green",
      "multiple-shelves/03|The Scalloped shelf shown in seven of its nine colours, with the colour names labelled|chart",
    ),
    ...shelfVariants({ regular: 76500, mini: 64500 }),
    priceStatus: "confirmed",
    details: {
      dimensions: [
        "Regular: 9 in H × 5 in W × 1.5 in D",
        "Mini: 7 in H × 4 in W × 1.5 in D",
      ],
      materials: SHELF_MATERIALS,
      care: SHELF_CARE,
      shipping: SHELF_SHIPPING,
      included: ["One mini bookshelf in your chosen size and color"],
      packaging:
        "Ships in our illustrated Little Bookshop box when bundled with a book set.",
    },
    related: ["custom-mini-book-set", "mini-classic-bookshelf"],
  }),
  make({
    slug: "mini-classic-bookshelf",
    name: "Mini Classic Bookshelf",
    category: "bookshelves",
    blurb: "Fluted columns and an arched back panel. Our tallest, most furniture-like shelf.",
    description: [
      "The Classic is the one that looks like real furniture. Fluted columns down each side, a moulded cornice on top, and an arched back panel behind the upper shelf — the kind of bookcase you would find in a study with a good chair in it.",
      "Three deep shelves, tall enough for a wooden LITERATURE topper or a small brass globe alongside the books. In Choco Brown it reads as an antique; in Bone White it reads as a nursery.",
    ],
    art: "shelf-basic",
    images: shots(
      "classic-shelf/14|A choco brown Mini Classic bookshelf styled with tiny novels, a plant and white LITERATURE letters, standing next to a full-size hardback",
      "classic-shelf/12|The Classic shelf filled with miniature books, a plant and a brass globe, lit by window light beside a candle and an open book",
      "classic-shelf/16|The Classic shelf photographed at an angle with its little ladder leaning against the side",
      "classic-shelf/10|An empty choco brown Classic bookshelf on a wood table, showing its fluted columns and arched back panel",
      "classic-shelf/13|The Classic shelf standing beside four full-size hardcovers that dwarf it",
      "multiple-shelves/01|The Classic shelf shown in seven of its nine colours, with the colour names labelled|chart",
    ),
    ...shelfVariants({ regular: 85000, mini: 73000 }),
    priceStatus: "confirmed",
    details: {
      dimensions: [
        "Regular: 9 in H × 5 in W × 1.5 in D",
        "Mini: 7 in H × 4 in W × 1.5 in D",
      ],
      materials: SHELF_MATERIALS,
      care: SHELF_CARE,
      shipping: SHELF_SHIPPING,
      included: ["One mini bookshelf in your chosen size and color"],
    },
    related: ["mini-scalloped-bookshelf", "custom-mini-book-set"],
  }),
  make({
    slug: "mini-arched-bookshelf",
    name: "Mini Arched Bookshelf",
    category: "bookshelves",
    blurb: "A soft dome on top, like a little doorway into your collection.",
    description: [
      "The curve is borrowed from old shop windows and garden gates. An arch reads as an entrance, so the books inside stop looking stored and start looking kept.",
      "It is also our most affordable, and the one we point first-timers toward. A Miniature arch plus one set of six is the whole idea of this shop.",
    ],
    art: "shelf-arched",
    images: shots(
      "arched-shelf/13|A Bone White Arched bookshelf packed with miniature books, a TBR topper and a mini plant, next to a full-size novel",
      "arched-shelf/11|A hand holding a Bone White Arched bookshelf filled with tiny paperbacks, a wooden TBR topper and a miniature plant",
      "arched-shelf/15|Full-size novels, a styled Arched shelf and an empty one lined up together on a wood table",
      "arched-shelf/04|A single empty Bone White Arched bookshelf on a dark wood table, showing its three shelves and domed top",
      "arched-shelf/02|The Regular and Mini Arched bookshelves standing empty side by side, showing the height difference",
      "arched-shelf/16|A Mini Arched shelf with nine miniature books displayed cover-out beneath a row of wooden stars",
      "multiple-shelves/02|The Arched shelf shown in seven of its nine colours, with the colour names labelled|chart",
    ),
    ...shelfVariants({ regular: 76500, mini: 64500 }),
    priceStatus: "confirmed",
    details: {
      dimensions: [
        "Regular: 9 in H × 5 in W × 1.5 in D",
        "Mini: 7 in H × 4 in W × 1.5 in D",
      ],
      materials: SHELF_MATERIALS,
      care: SHELF_CARE,
      shipping: SHELF_SHIPPING,
      included: ["One mini bookshelf in your chosen size and color"],
    },
    related: ["mini-scalloped-bookshelf", "custom-mini-book-set"],
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
    images: shots(
      "mini-books/05|Six miniature novels arranged face-up on the pages of an open book, covers fully readable",
      "mini-books/04|A hand holding a stack of six miniature novels, their spines no longer than a thumb",
      "mini-books/01|Ten miniature novels spread across a pale wood surface in afternoon light",
    ),
    ...simpleVariants(39900, { name: "Cover Style", values: COVER_STYLES }),
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
    related: ["mini-scalloped-bookshelf", "mini-book-keychain"],
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
    ...simpleVariants(39900, { name: "Cover Style", values: COVER_STYLES }),
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
    ...simpleVariants(39900, { name: "Cover Style", values: COVER_STYLES }),
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
    related: ["mini-fourth-wing-set", "custom-mini-book-set"],
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
    ...simpleVariants(39900, { name: "Cover Style", values: COVER_STYLES }),
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
    ...simpleVariants(39900, { name: "Cover Style", values: COVER_STYLES }),
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
    related: ["custom-mini-book-set", "mini-classic-bookshelf"],
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
    ...simpleVariants(39900, { name: "Cover Style", values: COVER_STYLES }),
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
    related: ["freida-mcfadden-book-stack-sticker", "custom-mini-book-set"],
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
    images: shots(
      "keychain/06|A mini book keychain hanging from the gold strap ring of a brown suede bag, a shelf of books blurred behind",
      "keychain/04|Overhead view of two mini book keychains laid on tan wood between six tiny paperbacks",
      "keychain/01|A hand cradling a mini book keychain on its gold ring, with miniature paperbacks scattered on the wood beneath",
      "keychain/02|Two mini book keychains hanging from gold clasps on pale wood",
      "keychain/05|Two mini book keychains on dark walnut in low warm light, their gold clasps catching the light",
    ),
    ...simpleVariants(19900),
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
    related: ["bookstore-acrylic-keychain", "book-stack-acrylic-keychain"],
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
    slug: "mini-plant",
    name: "Miniature Plant",
    category: "accessories",
    blurb: "Every good shelf has a plant. This one never needs water.",
    description: [
      "The fastest way to make a shelf look lived-in. A tiny potted plant that sits on a top tier or beside a row of spines.",
      "Printed in the shelf colour of your choice, so it either disappears into the shelf or stands out against it.",
    ],
    art: "plant",
    images: shots(
      "accessories/01|Miniature plants in the accessory tray, alongside the letter blocks and star bars",
      "arched-shelf/13|A miniature plant on the top shelf of a styled Arched bookshelf",
    ),
    ...simpleVariants(5000, { name: "Color", values: SHELF_COLORS.map((c) => c.name) }),
    priceStatus: "confirmed",
    details: {
      materials: MADE_BY_HAND,
      shipping: SHELF_SHIPPING,
    },
    related: ["mini-shelf-letters", "mini-ladder", "mini-scalloped-bookshelf"],
  }),
  make({
    slug: "mini-shelf-letters",
    name: "Mini Shelf Letters",
    category: "accessories",
    blurb: "Little word blocks that label a shelf: TBR, READ, FAVES, 5 Stars, Literature.",
    description: [
      "Tiny standing letters that tell your shelf what it is. Put TBR on the row that is waiting, READ on the row that is done, FAVES on the row you would rescue from a fire.",
      "Each one is a single word block, printed in the colour you pick. They lean nicely against a stack of spines.",
    ],
    art: "plant",
    images: shots(
      "accessories/01|A tray of miniature shelf accessories: TBR, READ, FAVES and LITERATURE letter blocks in choco brown and bone white, with star bars and mini plants",
    ),
    ...simpleVariants(5000, {
      name: "Word",
      values: ["TBR", "READ", "FAVES", "5 Stars", "Literature"],
    }),
    priceStatus: "confirmed",
    badges: ["Pick your word"],
    details: {
      included: ["One word block in your chosen word and colour"],
      materials: MADE_BY_HAND,
      shipping: SHELF_SHIPPING,
    },
    related: ["mini-plant", "mini-ladder", "custom-mini-book-set"],
  }),
  make({
    slug: "mini-ladder",
    name: "Mini Library Ladder",
    category: "accessories",
    blurb: "A little ladder to lean against the shelf, for reaching the top row.",
    description: [
      "Every proper library has one. This one leans against the side of your shelf and goes precisely nowhere, which is the point.",
      "Printed to match, in any of the nine shelf colours.",
    ],
    art: "plant",
    images: shots(
      "classic-shelf/16|The little library ladder leaning against the side of a styled Classic bookshelf",
      "classic-shelf/12|The ladder in place on a fully styled Classic shelf beside a candle and dried flowers",
    ),
    ...simpleVariants(8000, { name: "Color", values: SHELF_COLORS.map((c) => c.name) }),
    priceStatus: "confirmed",
    details: {
      materials: MADE_BY_HAND,
      shipping: SHELF_SHIPPING,
    },
    related: ["mini-plant", "mini-shelf-letters", "mini-arched-bookshelf"],
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
