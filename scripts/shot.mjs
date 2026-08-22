/* Screenshot helper: node scripts/shot.mjs <path=/> <name=home> [widths=390,1440] [fullPage=1] */
import { chromium } from "playwright";
import fs from "node:fs";

const path = process.argv[2] ?? "/";
const name = process.argv[3] ?? "home";
const widths = (process.argv[4] ?? "390,1440").split(",").map(Number);
const fullPage = (process.argv[5] ?? "1") === "1";
const base = process.env.SHOT_BASE ?? "http://localhost:3000";

fs.mkdirSync("shots", { recursive: true });
const exe = process.env.PW_CHROMIUM;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
for (const width of widths) {
  const page = await browser.newPage({
    viewport: { width, height: width < 500 ? 844 : 900 },
    deviceScaleFactor: width < 500 ? 2 : 1,
  });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(base + path, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `shots/${name}-${width}.png`, fullPage });
  if (errors.length) console.log(`[${width}] console errors:\n` + errors.slice(0, 10).join("\n"));
  await page.close();
}
await browser.close();
console.log("done:", widths.map((w) => `shots/${name}-${w}.png`).join(" "));
