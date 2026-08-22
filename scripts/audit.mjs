import { chromium } from "playwright";
import fs from "node:fs";

const PAGES = [
  ["/", "home"],
  ["/shop", "shop"],
  ["/shop/mini-books", "cat-books"],
  ["/shop/accessories", "cat-acc"],
  ["/products/mini-medieval-bookshelf", "p-medieval"],
  ["/products/custom-mini-book-set", "p-custom"],
  ["/products/acotar-book-stack-sticker", "p-soldout"],
  ["/products/mini-book-keychain", "p-keychain"],
  ["/build", "build"],
  ["/cart", "cart"],
  ["/checkout", "checkout"],
  ["/about", "about"],
  ["/faq", "faq"],
  ["/contact", "contact"],
  ["/policies/shipping", "pol-shipping"],
  ["/policies/privacy", "pol-privacy"],
  ["/nope-404", "notfound"],
  ["/shop?q=zzzz", "search-empty"],
];
const WIDTHS = [320, 390, 1024, 1440];

fs.mkdirSync("shots/audit", { recursive: true });
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const report = [];
for (const width of WIDTHS) {
  const ctx = await browser.newContext({
    viewport: { width, height: width < 500 ? 800 : 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 120)));
  for (const [path, name] of PAGES) {
    try {
      await page.goto("http://localhost:3000" + path, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForTimeout(350);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (overflow > 1) report.push(`OVERFLOW ${name}@${width}: +${overflow}px`);
      await page.screenshot({ path: `shots/audit/${name}-${width}.png`, fullPage: true });
    } catch (e) {
      report.push(`FAIL ${name}@${width}: ${String(e).slice(0, 100)}`);
    }
  }
  if (errs.length) report.push(`JSERR @${width}: ` + errs.slice(0, 5).join(" | "));
  await ctx.close();
}
await browser.close();
console.log(report.length ? report.join("\n") : "audit clean: no overflow, no js errors");
