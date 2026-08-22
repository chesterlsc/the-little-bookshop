/**
 * Business information and long-form content.
 * Values in EDITABLE (marked ⟨ ⟩ in copy) are placeholders awaiting real
 * business details. See README, "Business information still needed".
 */

export const SITE = {
  name: "The Little Bookshop",
  businessName: "The Little Bookshop",
  tagline: "Miniatures for book lovers",
  description:
    "Handmade mini bookshelves, custom miniature book sets of six, keychains, stickers and tiny shelf accessories. Build a little shelf of the stories that made you.",
  /** ⟨EDITABLE⟩ public contact email shown on the site */
  contactEmail: "hello@example.com",
  /** ⟨EDITABLE⟩ where order notification emails are sent */
  ordersEmail: "orders@example.com",
  /** ⟨EDITABLE⟩ Instagram / TikTok handles */
  socials: {
    instagram: "https://www.instagram.com/",
    tiktok: "https://www.tiktok.com/",
  },
  /** ⟨EDITABLE⟩ typical made-to-order production window */
  productionTime: "⟨production time, e.g. 5 to 10 business days⟩",
  /** ⟨EDITABLE⟩ where orders ship from */
  shipsFrom: "⟨shipping origin⟩",
};

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Why are miniature books always sold in sets of six?",
    a: "Six is what fits our illustrated backing card, and it turns out to be the right size for a themed shelf: a TBR, a favorite series, or your five-star reads. Every set is exactly six tiny books.",
  },
  {
    q: "How do custom mini book sets work?",
    a: "You give us exactly six titles (authors help us find the right editions) and we recreate each cover in miniature, printed on matte cardstock and mounted by hand on a foamboard core, front, back and spine. The books are decorative and don't open, which is how they stay a quarter of an inch thick.",
  },
  {
    q: "How big are the mini books and shelves?",
    a: "Each mini book is about 1 × 1.4 inches and 0.25 inches thick. Shelves range from about 6.4 to 9.3 inches tall depending on the style and size, so they suit a desk but still hold a whole reading year.",
  },
  {
    q: "Can I choose the cover edition for my custom books?",
    a: "Yes. Add the edition you'd like (or a link) in the notes when you build your set and we'll match it as closely as we can. Special editions with sprayed edges and foiled covers reproduce especially well at this size.",
  },
  {
    q: "What's the difference between “Front, Back & Spine” and “Double-Sided”?",
    a: "Front, Back & Spine is the one you want for a shelf: a printed spine so the book reads correctly stood upright, with the real front and back covers. Double-Sided prints the front cover on both faces and skips the spine, which suits TBR jars and anywhere both sides are on show.",
  },
  {
    q: "How many mini books fit on a shelf?",
    a: "Between 33 and 68, depending on the style and size. Each product page carries the exact figure for both Regular and Miniature, along with a measured diagram.",
  },
  {
    q: "What are the shelves made of?",
    a: "Made to order from sturdy, plant-based PLA with a soft matte finish, in ten studio colors: pistachio green and camel tan through to navy blue, espresso brown and midnight black.",
  },
  {
    q: "How long does an order take?",
    a: `Everything is made to order in small batches. Current production time is ${SITE.productionTime}, plus shipping. You'll get a confirmation email the moment your order is in, and another when it ships.`,
  },
  {
    q: "Do you ship internationally?",
    a: "⟨Shipping destinations and rates to be confirmed by the shop. This answer is an editable placeholder.⟩",
  },
  {
    q: "Can I order a shelf and books together?",
    a: "That's exactly what Build Your Little Shelf is for. Choose a shelf, pick or customize a set of six, add tiny extras, and the whole bundle arrives together in our illustrated box.",
  },
  {
    q: "Is this a gift-friendly order?",
    a: "Very. Bundles arrive in our illustrated Little Bookshop box, book sets on their six-slot card, and keychains on an illustrated hanging card. Add a note during checkout and we'll tuck it in.",
  },
];

export const POLICIES: Record<
  string,
  { title: string; updated: string; body: string[] }
> = {
  shipping: {
    title: "Shipping",
    updated: "⟨date⟩",
    body: [
      `Every piece is made to order in our little studio. Current production time before dispatch is ${SITE.productionTime}.`,
      "Shipping is free on orders of ₱999 and over. Below that, a flat rate is shown at checkout before you pay. ⟨Carrier names, delivery estimates by region, and international availability to be confirmed by the shop.⟩",
      "You'll receive an email confirmation when your order is placed and ⟨tracking details, if offered⟩ when it ships.",
      "Orders ship from ⟨shipping origin⟩. Customs fees or import taxes, where they apply, are the recipient's responsibility.",
    ],
  },
  returns: {
    title: "Returns & Exchanges",
    updated: "⟨date⟩",
    body: [
      "Custom miniature book sets and personalized keychains are made just for you, so they can't be returned or exchanged. If anything arrives damaged or isn't right, write to us and we will make it right.",
      "⟨Return window, condition requirements, and who pays return postage to be confirmed by the shop.⟩",
      `If something arrives broken, send a photo to ${SITE.contactEmail} within a few days of delivery and we'll arrange a replacement or refund.`,
    ],
  },
  privacy: {
    title: "Privacy",
    updated: "⟨date⟩",
    body: [
      "We collect only what an order needs: your name, email address, phone number, shipping address, and the order details you give us (including custom book titles and notes).",
      "Payment is processed by a secure hosted payment provider. Your card number never touches our servers, and we never see or store it.",
      "We use your details to make and deliver your order, to email you about it, and for nothing else. We don't sell or share your information for marketing.",
      `To ask about, correct, or delete your information, email ${SITE.contactEmail}. ⟨Legal entity name, data retention window, and applicable jurisdiction to be confirmed by the shop.⟩`,
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "⟨date⟩",
    body: [
      "By placing an order you agree to these terms. Orders are confirmed when payment is verified by our payment provider; until then, an order number is only a reservation.",
      "Custom sets require exactly six book titles. We recreate covers in miniature as decorative, non-opening objects for personal display, and may decline requests we can't reproduce respectfully or lawfully.",
      "Prices are shown in Philippine pesos and can change. The price at checkout is the price you pay. If we can't fulfil an order, we'll refund it in full.",
      "Our miniatures are decorative items, not toys. They contain small parts and are not suitable for young children.",
      "⟨Legal entity name, governing law, and dispute process to be confirmed by the shop.⟩",
    ],
  },
};

export const ABOUT = {
  intro: [
    "The Little Bookshop began with a simple, slightly ridiculous wish: to hold a whole reading life in two hands.",
    "We make miniatures for book lovers: tiny shelves in ten colors, six-book sets you can customize title by title, keychains that carry one beloved story, and the small extras (a plant, a rug, a very calm fish) that make a shelf feel like a room.",
    "Everything is made to order, slowly and by hand: covers recreated in miniature, printed on matte cardstock, mounted on foamboard, and packed into our illustrated box like a shelf being tucked into bed.",
  ],
  why: [
    "Readers don't just remember books. We remember who we were when we read them, and a little shelf keeps that person nearby: on a desk, beside a keyboard, on the bookshelf that holds the full-size originals.",
    "That's why our sets are always six books. Six is small enough that you have to choose, and big enough to tell a story about you.",
  ],
};
