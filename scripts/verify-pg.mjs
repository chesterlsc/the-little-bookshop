/**
 * Runs the production Postgres order store against Postgres-in-WASM (PGlite),
 * so the exact SQL that will run on Neon/Supabase is exercised without needing
 * a database or a network.
 *
 *   npx tsx scripts/verify-pg.mjs
 */
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite();
const q = { query: (text, params) => db.query(text, params ?? []) };

const store = await import("../src/lib/orders-pg.ts");
store.__setQueryable(q);

const results = [];
const check = (name, ok, extra = "") => {
  results.push([name, ok]);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !extra ? "" : "  → " + extra}`);
};

const snapshot = (total = 76500) => ({
  items: [{ kind: "product", name: "Mini Arched Bookshelf", qty: 1, unitPrice: total, lineTotal: total, details: ["Size: Regular"] }],
  customer: { fullName: "Ana Cruz", phone: "09171234567", email: "a@e.com", instagram: "ana", address1: "1 St", barangay: "B", city: "C", province: "P", postalCode: "1000", addressNotes: "", orderNotes: "" },
  subtotal: total, shipping: 0, total, currency: "PHP",
});

/* ── the schema applies cleanly ── */
await store.migrate(q);
await store.migrate(q); // idempotent
check("migrate is idempotent", true);

/* ── order numbers ── */
const a = await store.createOrder(snapshot());
const b = await store.createOrder(snapshot());
check("number shape LB####-XXXXXX", /^LB\d+-[A-Z2-9]{6}$/.test(a.number), a.number);
check("sequence starts at 1001", a.number.startsWith("LB1001-"), a.number);
check("sequence advances", b.number.startsWith("LB1002-"), b.number);
check("suffixes differ", a.number.slice(-6) !== b.number.slice(-6));

/* ── money survives the BIGINT round trip as numbers, not strings ── */
check("total is a number", typeof a.total === "number" && a.total === 76500, `${typeof a.total} ${a.total}`);
check("subtotal is a number", typeof a.subtotal === "number");
check("status defaults to awaiting_payment", a.status === "awaiting_payment", a.status);

/* ── read back ── */
const got = await store.getOrder(a.number);
check("getOrder round-trips", got?.number === a.number && got.total === 76500);
check("payload parses", JSON.parse(got.payload).customer.fullName === "Ana Cruz");
check("unknown number is undefined", (await store.getOrder("LB9999-ZZZZZZ")) === undefined);

/* ── email claim is exactly-once, and releasable ── */
check("first claim wins", (await store.claimEmailSend(a.number)) === true);
check("second claim refused", (await store.claimEmailSend(a.number)) === false);
await store.releaseEmailSend(a.number);
check("release allows a retry", (await store.claimEmailSend(a.number)) === true);

/* ── status transitions ── */
await store.setPaymentMethod(a.number, "GCash");
check("payment method recorded", (await store.getOrder(a.number)).provider_ref === "GCash");
await store.markStatus(a.number, "confirmed");
const conf = await store.getOrder(a.number);
check("markStatus confirmed", conf.status === "confirmed");
check("paid_at stamped on confirm", !!conf.paid_at);
await store.setPaymentMethod(a.number, "MariBank");
check("method not overwritten once past awaiting", (await store.getOrder(a.number)).provider_ref === "GCash");

/* ── concurrency: 25 orders at once must all be unique ── */
const many = await Promise.all(Array.from({ length: 25 }, () => store.createOrder(snapshot(39900))));
const numbers = many.map((o) => o.number);
check("25 concurrent orders are unique", new Set(numbers).size === 25);
check("no concurrent order reused a sequence value", new Set(numbers.map((n) => n.split("-")[0])).size === 25);

await db.close();
const failed = results.filter(([, ok]) => !ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
