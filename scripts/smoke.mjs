/**
 * End-to-end smoke test for the core shopping + order pipeline.
 *
 *   1. start the site (npm run dev  or  npm run build && npm run start)
 *   2. node scripts/smoke.mjs [baseUrl]
 *
 * Requires PAYMENT_PROVIDER=dev and EMAIL_PROVIDER=dev (the defaults).
 */
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3000";
const results = [];
const check = (name, ok) => {
  results.push([name, ok]);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
};

const exePath = fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined;
const browser = await chromium.launch({ executablePath: exePath });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e)));

/* ── storefront ─────────────────────────────────────────────────────────── */
await page.goto(BASE + "/", { waitUntil: "networkidle" });
check("home renders", (await page.textContent("body")).includes("Build your little shelf"));

await page.goto(BASE + "/products/mini-scalloped-bookshelf", { waitUntil: "networkidle" });
await page.getByRole("radio", { name: "Blush Pink" }).click();
await page.getByRole("button", { name: /Add to basket/ }).click();
await page.waitForTimeout(500);
check("add to basket opens drawer", (await page.textContent("body")).includes("Your basket"));
await page.keyboard.press("Escape");

await page.goto(BASE + "/products/custom-mini-book-set", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Add to basket/ }).click();
await page.waitForTimeout(300);
check("custom set blocks without six titles", (await page.textContent("body")).includes("Please add a title for book 1"));
for (let i = 0; i < 6; i++) await page.fill(`#set-title-${i}`, `Tiny Book ${i + 1}`);
await page.getByRole("button", { name: /Add to basket/ }).click();
await page.waitForTimeout(500);
check("custom set adds with six titles", (await page.textContent("body")).includes("Six custom titles"));
await page.keyboard.press("Escape");

await page.reload({ waitUntil: "networkidle" });
await page.goto(BASE + "/cart", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
check("cart persists after reload", (await page.textContent("body")).includes("Custom Mini Book Set"));

/* ── checkout via the dev payment simulator ─────────────────────────────── */
await page.goto(BASE + "/checkout", { waitUntil: "networkidle" });
const fill = (id, v) => page.fill(`#field-${id}`, v);
await fill("fullName", "Smoke Tester");
await fill("email", "smoke@example.com");
await fill("phone", "+1 555 0100");
await fill("address1", "1 Test Lane");
await fill("city", "Testville");
await fill("postalCode", "0000");
await fill("country", "Testland");
await page.getByRole("button", { name: /Continue to secure payment/ }).click();
await page.waitForURL(/\/dev\/pay\//, { timeout: 20000 });
check("checkout redirects to hosted payment", true);
await page.getByRole("button", { name: /Simulate successful payment/ }).click();
await page.waitForURL(/checkout\/result/, { timeout: 20000 });
await page.waitForTimeout(2500);
check("payment verified server-side", (await page.textContent("body")).includes("Paid and on the workbench"));
const cartRaw = await page.evaluate(() => localStorage.getItem("tlb-cart-v1"));
check("basket cleared only after verified payment", !cartRaw || JSON.parse(cartRaw).lines.length === 0);
const orderNumber = (page.url().match(/order=([A-Z0-9-]+)/) ?? [])[1];
await page.goto(`${BASE}/order/${orderNumber}`, { waitUntil: "networkidle" });
check("order page shows paid state", (await page.textContent("body")).includes("Paid & confirmed"));

/* ── API-level edge cases ───────────────────────────────────────────────── */
const cart = { lines: [{ type: "product", key: "k1", slug: "mini-plant", variantId: "blush-pink", qty: 1 }] };
const customer = { fullName: "A", email: "a@example.com", phone: "1", address1: "x", address2: "", city: "y", region: "", postalCode: "z", country: "PH", deliveryNotes: "", orderNotes: "" };
const mk = async () => (await (await fetch(`${BASE}/api/checkout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cart, customer }) })).json()).orderNumber;
const outcome = (n, o) => fetch(`${BASE}/api/dev/pay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber: n, outcome: o }) });
const verify = async (n) => (await (await fetch(`${BASE}/api/payments/verify?order=${n}`)).json()).status;

const nf = await mk(); await outcome(nf, "failed");
check("failed payment marks order failed", (await verify(nf)) === "failed");
const nc = await mk(); await outcome(nc, "cancelled");
check("cancelled payment marks order cancelled", (await verify(nc)) === "cancelled");

const outboxBefore = fs.existsSync("var/outbox") ? fs.readdirSync("var/outbox").length : 0;
const np = await mk(); await outcome(np, "paid");
await verify(np); await verify(np);
const outboxAfter = fs.existsSync("var/outbox") ? fs.readdirSync("var/outbox").length : 0;
check("paid order sends exactly 2 emails (idempotent)", outboxAfter - outboxBefore === 2);

const badCart = { lines: [{ type: "product", key: "k9", slug: "mini-plants", variantId: "bogus", qty: 1 }] };
const bad = await fetch(`${BASE}/api/checkout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cart: badCart, customer }) });
check("invalid cart rejected with 422", bad.status === 422);
const incomplete = { lines: [{ type: "product", key: "k8", slug: "custom-mini-book-set", variantId: "front-back-spine", qty: 1, titles: [{ title: "only one", author: "" }] }] };
const bad2 = await fetch(`${BASE}/api/checkout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cart: incomplete, customer }) });
check("incomplete six-title set rejected server-side", bad2.status === 422);

check("no page errors during run", pageErrors.length === 0);
await browser.close();

const failed = results.filter(([, ok]) => !ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
