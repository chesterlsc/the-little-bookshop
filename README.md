# The Little Bookshop, a custom ecommerce site

A complete, custom-built storefront for **The Little Bookshop** (miniatures for
book lovers): mini bookshelves, miniature books in sets of six (ready-made or
fully custom), keychains, stickers, and tiny shelf accessories.

Not a Shopify theme, but a bespoke Next.js application with its own product
system, persistent cart, guided **Build Your Little Shelf** flow, server-side
order pipeline, hosted-payment adapters, and email notifications.

---

## Design direction (summary)

A 50/50 blend, per the brief:

- **Warm illustrated minimalism** from the packaging system: cream, sage,
  blush, warm taupe, soft brown (tokens sampled from the supplied logo and
  packaging art), soft **claymorphism** for cards/buttons, restrained warm
  **liquid glass** for the header, mobile bottom bar, sheets and the cart drawer.
- **Storybook / vintage folk illustration** (Ghibli-leaning warmth): a
  hand-drawn SVG illustration system: the reading-nook-window hero, folk
  flowers and sprigs, scalloped section dividers echoing the scalloped shelf,
  paper-grain texture, stitched borders, and the signature **live mini-shelf**
  that fills with the customer's six titles as they type.
- **Logo**: the supplied bubbly wordmark (background removed, counters kept
  transparent) with the open-book mark cropped for the nav, favicon and cart.
- **Type**: Baloo 2 (display, matches the wordmark), Nunito Sans (body),
  Lora italic (storybook accent lines). Self-hosted via Fontsource.

Mobile-first: fixed rounded glass bottom nav (Home · Shop · **raised Basket**
with live badge and add-pulse · Build · More), safe-area padding, snap-scroll
rows. Desktop: spacious editorial layout, same system.

## Stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS 4**
- **better-sqlite3** for the order store (single file, zero infra)
- **nodemailer** (SMTP option), Resend and PayMongo/Stripe use plain `fetch`
- **Playwright** for the smoke suite and responsive audit
- No UI kit, no CMS, no unnecessary dependencies

## Project map

```
src/
  lib/
    catalog.ts        ← ALL product data (names, prices, options, copy), edit here
    cart.ts           ← cart types, validation (set-of-six rule), pricing
    checkout.ts       ← customer validation + server-side order snapshot/pricing
    db.ts, orders.ts  ← SQLite order store, LB-XXXXX-XXXXX numbers, idempotent transitions
    finalize-order.ts ← the ONLY place an order becomes paid + emails go out (once)
    payments/         ← provider adapters: dev simulator, PayMongo, Stripe
    email/            ← provider adapters: dev outbox, Resend, SMTP + templates
  content/site.ts     ← business info, FAQ, policies, about copy (⟨placeholders⟩ marked)
  components/         ← design system (ui, illustrations, cart, builder, nav…)
  app/                ← routes: home, shop/[category], products/[slug], build,
                        cart, checkout(+result), order/[number], about, faq,
                        contact, policies/[policy], dev/pay/[ref], api/*
scripts/              ← smoke.mjs (e2e suite), audit.mjs (responsive audit), shot.mjs
public/brand/         ← processed logo files, favicons, packaging art, studio photos
```

Product data is fully separated from the interface: names, prices, options,
availability, images and copy live in `src/lib/catalog.ts` and
`src/content/site.ts`. **The browser never decides prices**, carts are
re-validated and re-priced on the server before any payment session is created.

## Setup

```bash
npm install
cp .env.example .env.local   # defaults run fully in dev mode
npm run dev                  # http://localhost:3000
```

Production:

```bash
npm run build
npm run start
```

## Environment variables

See `.env.example` (documented inline). The important ones:

| Variable | Purpose |
| --- | --- |
| `PUBLIC_BASE_URL` | Public site URL (payment redirects + email links) |
| `PAYMENT_PROVIDER` | `dev` (simulator) · `paymongo` · `stripe` |
| `PAYMENT_CURRENCY` | Provider currency (PayMongo settles PHP) |
| `PAYMONGO_SECRET_KEY` / `PAYMONGO_WEBHOOK_SECRET` | PayMongo keys |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe keys |
| `EMAIL_PROVIDER` | `dev` (writes `var/outbox/*.eml`) · `resend` · `smtp` |
| `EMAIL_FROM`, `ORDERS_EMAIL` | Sender + business notification inbox |
| `NEXT_PUBLIC_FLAT_SHIPPING_CENTS` | Flat shipping display value (recomputed server-side) |
| `ORDERS_DB_PATH` | SQLite location (use a persistent volume in prod) |

Secrets are server-only (no `NEXT_PUBLIC_` prefix) and never reach the client.

## Payments, how the flow works

1. `POST /api/checkout` validates the cart + customer **on the server**,
   recomputes every price from the catalog, creates a `pending` order with a
   unique `LB-XXXXX-XXXXX` number, then creates the provider's **hosted**
   checkout session and returns its URL.
2. The customer pays on the provider's page. **No card data ever touches this
   app**, it is never collected, stored, logged, or emailed.
3. The provider calls `POST /api/payments/webhook` (signature-verified), and/or
   the return page calls `GET /api/payments/verify` which asks the provider
   directly. Landing on the success URL is never treated as proof of payment.
4. Only a server-verified result marks the order `paid` (exactly once), sends
   the business email (full order: customer, items, options, six titles, theme,
   notes, totals, safe payment reference) and the customer confirmation -
   exactly once, even if webhook and verify race. Only then is the basket cleared.

### Configure PayMongo (recommended for PH / GCash / Maya)
1. `PAYMENT_PROVIDER=paymongo`, `PAYMENT_CURRENCY=PHP`, set `PAYMONGO_SECRET_KEY`.
2. In the PayMongo dashboard create a webhook →
   `https://your-domain/api/payments/webhook` with event
   `checkout_session.payment.paid`; put its secret in `PAYMONGO_WEBHOOK_SECRET`.
3. Catalog prices are stored as integer centavos and are already in PHP.

### Configure Stripe
1. `PAYMENT_PROVIDER=stripe`, set `STRIPE_SECRET_KEY`.
2. Add a webhook endpoint → `https://your-domain/api/payments/webhook` with
   `checkout.session.completed` and `checkout.session.expired`; put the signing
   secret in `STRIPE_WEBHOOK_SECRET`.

### Dev simulator
With `PAYMENT_PROVIDER=dev`, checkout redirects to a clearly-labeled
`/dev/pay/<order>` page with *simulate success / failure / cancel* buttons.
The simulated result still goes through the same server-side verification path.

## Email configuration

- `EMAIL_PROVIDER=dev` → messages become `.eml` files in `var/outbox/` (open
  them in any mail app).
- `EMAIL_PROVIDER=resend` → set `RESEND_API_KEY` and a verified `EMAIL_FROM`.
- `EMAIL_PROVIDER=smtp` → set `SMTP_HOST/PORT/USER/PASS`.

## Testing

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run smoke       # 15-check e2e: cart, six-title rule, builder→checkout,
                    # simulated payment, verification, idempotent emails,
                    # tampered/incomplete carts rejected (needs the site running)
npm run audit       # screenshots every page at 320/390/1024/1440 into shots/audit
                    # and fails loudly on horizontal overflow or JS errors
```

Manual paths worth clicking: `/build` (leave mid-flow, come back, state
persists), a sold-out product (`/products/acotar-book-stack-sticker`),
`/shop?q=zzzz` (empty search), `/nope` (404), and cancel/fail on the dev
payment page.

## Business information still needed

Marked `⟨like this⟩` in `src/content/site.ts` / flagged in `src/lib/catalog.ts`:

1. **Prices to confirm** (`priceStatus: "placeholder"`): Custom Mini Book Set
   and ready-made six-sets ($42.00, derived from the existing shop's ~$7/book
   pattern) and the Mini Book Keychain ($12.00).
2. **Included titles** for the Sarah J. Maas / Fourth Wing / Freida McFadden
   six-sets (Twilight and Jenny Han sets are filled in).
3. Production time, shipping origin, carriers/rates, international destinations.
4. Returns window and terms; privacy/terms legal entity + jurisdiction; policy dates.
5. Real contact + orders email addresses and social links.
6. Payment provider account + keys; email provider + verified sending domain.
7. Product photography to replace illustrated placeholders where desired
   (each product card falls back to its hand-drawn illustration automatically).
8. Two keychains were renamed from the source catalog ("HP …" → "Castle
   Library" / a generic envelope was omitted), confirm final names.

## Notes on catalog fidelity

Bookshelves (all six styles, sizes, ten colors, ladder option, capacities,
dimensions, PLA material), accessories (plants, fish tank, bean bag, rug with
their real options), stickers ($6 · 3×3in waterproof; $12 sheet; two genuinely
sold-out items kept as unavailable-state demos) and mini-book construction
facts (1×1.4×0.25 in, matte cardstock on foamboard, non-opening) mirror the
live catalog at thestickershop.shop. The set-of-six rule is the Little
Bookshop brand spec and is enforced in the UI, the cart, and again on the server.
