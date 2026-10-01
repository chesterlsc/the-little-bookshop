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

/* ── the payment screenshot claim: at most three per order, and never backwards ── */
const proof = await store.createOrder(snapshot(39900));
check("the first screenshot claims the order", (await store.claimPaymentProof(proof.number, "GCash")) === true);
const submitted = await store.getOrder(proof.number);
check("it moves the order to payment_submitted", submitted.status === "payment_submitted", submitted.status);
check("and records how they paid", submitted.provider_ref === "GCash");
check("a second and third screenshot are allowed",
  (await store.claimPaymentProof(proof.number, "MariBank")) === true && (await store.claimPaymentProof(proof.number)) === true);
check("a fourth is refused, so one order cannot spend the mail quota",
  (await store.claimPaymentProof(proof.number)) === false);
check("the method of the first send is kept", (await store.getOrder(proof.number)).provider_ref === "GCash");

const retried = await store.createOrder(snapshot(39900));
await store.claimPaymentProof(retried.number, "GCash");
await store.releasePaymentProof(retried.number);
const undone = await store.getOrder(retried.number);
check("a screenshot whose email failed leaves the order unpaid again",
  undone.status === "awaiting_payment" && Number(undone.proofs_sent) === 0, `${undone.status}/${undone.proofs_sent}`);
check("and can be sent again", (await store.claimPaymentProof(retried.number)) === true);

const shopMoved = await store.createOrder(snapshot(39900));
await store.markStatus(shopMoved.number, "confirmed");
check("a stale tab cannot knock a confirmed order back to payment_submitted",
  (await store.claimPaymentProof(shopMoved.number)) === false &&
    (await store.getOrder(shopMoved.number)).status === "confirmed");

/* ── concurrency: 25 orders at once must all be unique ── */
const many = await Promise.all(Array.from({ length: 25 }, () => store.createOrder(snapshot(39900))));
const numbers = many.map((o) => o.number);
check("25 concurrent orders are unique", new Set(numbers).size === 25);
check("no concurrent order reused a sequence value", new Set(numbers.map((n) => n.split("-")[0])).size === 25);


/* ── shipping + tracking ── */
const ship = await store.createOrder(snapshot());
await store.markShipped(ship.number, "J&T Express", "JT0099887766", "https://www.jtexpress.ph/trajectoryQuery?billcode=JT0099887766");
const shipped = await store.getOrder(ship.number);
check("markShipped moves the order to shipped", shipped.status === "shipped", shipped.status);
check("courier recorded", shipped.courier === "J&T Express", String(shipped.courier));
check("tracking number recorded", shipped.tracking_number === "JT0099887766");
check("tracking url recorded", String(shipped.tracking_url).includes("JT0099887766"));
check("shipped_at stamped", !!shipped.shipped_at);
const firstShipped = shipped.shipped_at;
await store.markShipped(ship.number, "LBC", "LBC123", undefined);
const reship = await store.getOrder(ship.number);
check("correcting the courier keeps the original ship date", reship.shipped_at === firstShipped);
check("correcting the courier replaces the number", reship.tracking_number === "LBC123");
check("tracking url clears when not given again", reship.tracking_url === null);

/* ── the mailing list ── */
const list = await import("../src/lib/subscribers-pg.ts");
list.__setQueryable(q);
await list.migrate(q);
await list.migrate(q);
check("subscribers migrate is idempotent", true);

const s1 = await list.addSubscriber("reader@example.com", "instagram", "WELCOME5");
check("subscriber saved", s1.email === "reader@example.com" && s1.source === "instagram");
check("subscriber id is a number", typeof s1.id === "number", typeof s1.id);
check("signup date stamped", !!s1.created_at);

await list.addSubscriber("second@example.com", "tiktok", "WELCOME5");
check("two subscribers listed", (await list.listSubscribers()).length === 2);
check("count matches", (await list.countSubscribers()) === 2);

const again = await list.addSubscriber("reader@example.com", "facebook", "WELCOME5");
check("signing up twice does not duplicate", (await list.listSubscribers()).length === 2);
check("signing up twice keeps the original date", again.created_at === s1.created_at);
check("signing up twice refreshes where they found us", again.source === "facebook");

await list.removeSubscriber("reader@example.com");
check("removed address leaves the list", (await list.listSubscribers()).every((r) => r.email !== "reader@example.com"));
check("count drops after removal", (await list.countSubscribers()) === 1);
const back = await list.addSubscriber("reader@example.com", "friend", "WELCOME5");
check("asking again un-removes them", back.unsubscribed_at === null);
check("and they are listed once more", (await list.listSubscribers()).length === 2);

const bulk = await Promise.all(
  Array.from({ length: 20 }, (_, i) => list.addSubscriber(`bulk${i}@example.com`, "instagram", "WELCOME5")),
);
check("20 concurrent signups all saved", new Set(bulk.map((r) => r.email)).size === 20);
check("list caps at the requested limit", (await list.listSubscribers(5)).length === 5);

// the list is the only record of a signup, so one failed connection must not stick
let flakes = 1;
list.__setQueryable({ query: (text, params) => (flakes-- > 0 ? Promise.reject(new Error("Neon waking up")) : q.query(text, params)) });
const outcome = (p) => p.then(() => "saved", () => "failed");
const firstTry = await outcome(list.addSubscriber("flaky@example.com", "tiktok", "WELCOME5"));
const nextTry = await outcome(list.addSubscriber("flaky@example.com", "tiktok", "WELCOME5"));
check("a failed first connection is retried by the next signup", firstTry === "failed" && nextTry === "saved", `${firstTry} then ${nextTry}`);

/* ── the shop's digest of new signups ── */
// upgrade a table made before the column existed, holding a signup from before digests
await q.query("ALTER TABLE subscribers DROP COLUMN notified_at");
await q.query("INSERT INTO subscribers (email, source, code, created_at) VALUES ('early@example.com', 'instagram', 'WELCOME5', '2026-09-01T00:00:00.000Z')");
list.__setQueryable(q);
await list.migrate(q);
const waiting = async () => Number((await q.query("SELECT COUNT(*)::int AS n FROM subscribers WHERE notified_at IS NULL AND unsubscribed_at IS NULL")).rows[0].n);
check("signups from before digests count as already announced",
  (await q.query("SELECT notified_at FROM subscribers WHERE email = 'early@example.com'")).rows[0].notified_at !== null);
await list.removeSubscriber("bulk0@example.com");
const n = await waiting();
check("newer signups wait for the digest", n > 0, String(n));
check("fewer than a batch claims nothing", (await list.claimDigest(n + 1)).length === 0);
const digest = await list.claimDigest(n);
check("a full batch claims every waiting signup, oldest first",
  digest.length === n && digest.every((r, i) => i === 0 || digest[i - 1].id < r.id), `${digest.length}/${n}`);
check("the batch leaves out removed and already-announced addresses",
  digest.every((r) => r.email !== "bulk0@example.com" && r.email !== "early@example.com"));
check("a claimed batch is not claimed again", (await list.claimDigest(1)).length === 0);
await list.releaseDigest(digest.map((r) => r.id));
check("a failed send puts the batch back", (await waiting()) === n);
const racing = await Promise.all([list.claimDigest(n), list.claimDigest(n)]);
check("two signups finishing a batch together send it once", racing.map((r) => r.length).sort().join() === `0,${n}`, racing.map((r) => r.length).join());

/* ── gift cards: made once, spent only while the money is there ── */
const gifts = await import("../src/lib/gift-cards-pg.ts");
gifts.__setQueryable(q);
await gifts.migrate(q);
await gifts.migrate(q);
await gifts.createPending("LB2001-AAAAAA", "tok-one", [
  { amount: 100000, delivery: "friend", toName: "Ana", fromName: "Maria", toEmail: "ana@example.com", note: "hi" },
  { amount: 50000, delivery: "self" },
]);
const waitingCards = await gifts.byToken("tok-one");
check("an unpaid gift card has no code and nothing on it",
  waitingCards.length === 2 && waitingCards.every((c) => c.code === null && c.balance === 0 && typeof c.amount === "number"));
check("an unpaid card cannot be emailed", (await gifts.claimEmail(waitingCards[0].id, 4)) === false);
const [made1, made2] = await Promise.all([gifts.issue("tok-one"), gifts.issue("tok-one")]);
const madeAgain = await gifts.issue("tok-one");
check("payment received gives each card a code, its balance and twelve months",
  madeAgain.every((c) => /^LBGC-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/.test(c.code) && c.balance === c.amount
    && new Date(c.expires_at) - new Date(c.issued_at) > 360 * 86400000));
check("pressing the button twice, even at once, makes each code once",
  madeAgain.map((c) => c.code).join() === made1.map((c) => c.code).join()
  && madeAgain.map((c) => c.code).join() === made2.map((c) => c.code).join()
  && madeAgain[0].code !== madeAgain[1].code);
check("an unknown token makes nothing", (await gifts.issue("tok-nope")).length === 0);
const spend = madeAgain[0].code;
const racers = await Promise.all([gifts.redeem(spend, 70000), gifts.redeem(spend, 70000)]);
check("two orders racing for one card cannot both spend it",
  racers.filter(Boolean).length === 1 && (await gifts.byCode(spend)).balance === 30000, racers.join());
check("a card never goes below zero", (await gifts.redeem(spend, 30001)) === false && (await gifts.byCode(spend)).balance === 30000);
check("nothing and less than nothing cannot be spent", !(await gifts.redeem(spend, 0)) && !(await gifts.redeem(spend, -500)));
await gifts.refund(spend, 70000);
check("a failed order puts the money back", (await gifts.byCode(spend)).balance === 100000);
await q.query("UPDATE gift_cards SET expires_at = $1 WHERE code = $2", [new Date(Date.now() - 1000).toISOString(), madeAgain[1].code]);
check("an expired card buys nothing", (await gifts.redeem(madeAgain[1].code, 100)) === false);
const sends = [];
for (let i = 0; i < 5; i++) sends.push(await gifts.claimEmail(madeAgain[0].id, 4));
check("a card's emails are capped", sends.join() === "true,true,true,true,false", sends.join());
await gifts.releaseEmail(madeAgain[0].id);
check("a failed send hands its turn back", (await gifts.claimEmail(madeAgain[0].id, 4)) === true);
await gifts.recordUse(spend, "LB2002-BBBBBB", 70000);
check("each use is written to the shop's ledger",
  Number((await q.query("SELECT amount FROM gift_card_uses WHERE code = $1", [spend])).rows[0].amount) === 70000);

await db.close();
const failed = results.filter(([, ok]) => !ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
