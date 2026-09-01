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

/* ── checkout: manual payment, no gateway ───────────────────────────────── */
await page.goto(BASE + "/checkout", { waitUntil: "networkidle" });
const fill = (id, v) => page.fill(`#field-${id}`, v);
await fill("fullName", "Smoke Tester");
await fill("phone", "09171234567");
await fill("email", "smoke@example.com");
await fill("instagram", "@smoketester");
await fill("address1", "1 Test Lane");
await fill("barangay", "San Roque");
await fill("city", "Quezon City");
await fill("province", "Metro Manila");
await fill("postalCode", "1100");
// the exact total the customer is promised, to compare against the payment screen
const checkoutTotal = (await page.textContent("body")).match(/₱[\d,]+\.\d\d/g).pop();
await page.getByRole("button", { name: /Place order/ }).click();
await page.waitForURL(/\/order\/LB[\w-]+\/pay/, { timeout: 20000 });
check("place order redirects to payment instructions", true);
// client-side nav: wait for the screen itself, not just the URL
await page.getByRole("heading", { name: /almost ours/ }).waitFor({ timeout: 20000 });
const body = await page.textContent("body");
check("payment screen shows awaiting payment", body.includes("Awaiting payment"));
check("payment screen shows GCash + MariBank", body.includes("09614863499") && body.includes("MariBank"));
const orderNumber = (page.url().match(/\/order\/(LB[\w-]+)\/pay/) ?? [])[1];
check("order number is short and quotable", /^LB\d+-[A-Z2-9]{6}$/.test(orderNumber ?? ""));
check("payment total matches checkout total", body.includes(checkoutTotal));
await page.waitForTimeout(600);
const cartRaw = await page.evaluate(() => localStorage.getItem("tlb-cart-v1"));
check("basket cleared once the order is saved", !cartRaw || JSON.parse(cartRaw).lines.length === 0);

await page.reload({ waitUntil: "networkidle" });
const afterReload = await page.textContent("body");
check("refresh keeps the same order", afterReload.includes(orderNumber) && afterReload.includes(checkoutTotal));

await page.goto(`${BASE}/order/${orderNumber}`, { waitUntil: "networkidle" });
check("order page shows awaiting payment", (await page.textContent("body")).includes("Awaiting payment"));

/* ── API-level edge cases ───────────────────────────────────────────────── */
const cart = { lines: [{ type: "product", key: "k1", slug: "mini-plant", variantId: "blush-pink", qty: 1 }] };
const customer = { fullName: "A", phone: "09171234567", email: "a@example.com", instagram: "@someone", address1: "x", barangay: "b", city: "y", province: "p", postalCode: "1000", addressNotes: "", orderNotes: "" };
const post = (payload) => fetch(`${BASE}/api/checkout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

const r1 = await (await post({ cart, customer })).json();
check("api creates an order", /^LB\d+-[A-Z2-9]{6}$/.test(r1.orderNumber ?? ""));

const key = `smoke-${Date.now()}`;
const a = await (await post({ cart, customer, idempotencyKey: key })).json();
const b = await (await post({ cart, customer, idempotencyKey: key })).json();
check("double submit reuses one order", a.orderNumber === b.orderNumber && b.reused === true);

const bad = await post({ cart, customer: { ...customer, email: "nope", postalCode: "12" } });
const badJson = await bad.json();
check("invalid customer rejected with friendly errors", bad.status === 422 && !!badJson.fieldErrors?.email && !!badJson.fieldErrors?.postalCode);

const badCart = await post({ cart: { lines: [{ type: "product", key: "z", slug: "nope", variantId: "default", qty: 1 }] }, customer });
check("invalid cart rejected with 422", badCart.status === 422);

const gone = await fetch(`${BASE}/api/payments/verify?order=LB1001`);
check("old payment gateway routes are gone", gone.status === 404);

check("no page errors during run", pageErrors.length === 0, pageErrors.join(" | "));

await browser.close();
const failed = results.filter(([, ok]) => !ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
