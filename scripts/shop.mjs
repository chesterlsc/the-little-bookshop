/**
 * The shop's own window onto its database: read the order book, read the
 * mailing list, and record a tracking number once a parcel is handed over.
 *
 *   npm run shop orders [n]
 *   npm run shop subscribers [n]
 *   npm run shop export            (CSV of the list, for a mail tool)
 *   npm run shop ship LB1024-AB3XYZ "J&T Express" JT0099887766 [url]
 *
 * Needs DATABASE_URL in .env.local (the same value Vercel uses). Everything is
 * read-only except `ship`, which only ever moves an order forward.
 */
import fs from "node:fs";

for (const file of [".env.local", ".env"]) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const [cmd, ...rest] = process.argv.slice(2);
const HELP = `Commands:
  npm run shop orders [n]        the order book, newest first
  npm run shop subscribers [n]   who is on the mailing list
  npm run shop export            write the list to var/subscribers.csv
  npm run shop ship <number> <courier> <tracking> [url]`;

if (!cmd || !["orders", "subscribers", "export", "ship"].includes(cmd)) {
  console.log(HELP);
  process.exit(0);
}

// Reads whichever store this machine has: Postgres when DATABASE_URL is set,
// otherwise the local SQLite the dev server writes to.
const remote = Boolean(process.env.DATABASE_URL);
const orders = await import("../src/lib/orders.ts");
const list = await import("../src/lib/subscribers.ts");
console.log(remote ? "Reading Postgres (DATABASE_URL)\n" : "Reading the local database in var/data\n");
const peso = (c) => `PHP ${(c / 100).toFixed(2)}`;
const day = (iso) => (iso ? String(iso).slice(0, 10) : "");

switch (cmd) {
  case "orders": {
    const rows = await orders.listOrders(Number(rest[0]) || 30);
    console.log(rows.length ? `${rows.length} most recent orders\n` : "No orders yet.");
    for (const o of rows) {
      const who = JSON.parse(o.payload).customer;
      console.log(
        `  ${o.number.padEnd(16)} ${day(o.created_at)}  ${o.status.padEnd(17)} ${peso(o.total).padStart(12)}  ${who.fullName}`,
      );
      if (o.tracking_number) console.log(`  ${" ".repeat(16)} ${o.courier} ${o.tracking_number}`);
    }
    break;
  }
  case "subscribers": {
    const rows = await list.listSubscribers(Number(rest[0]) || 50);
    console.log(`${await list.countSubscribers()} on the list, showing ${rows.length}\n`);
    for (const s of rows) console.log(`  ${day(s.created_at)}  ${s.email.padEnd(34)} ${s.source}`);
    break;
  }
  case "export": {
    const rows = await list.listSubscribers(5000);
    const csv = ["email,source,joined", ...rows.map((s) => `${s.email},${s.source},${day(s.created_at)}`)];
    const out = "var/subscribers.csv";
    fs.mkdirSync("var", { recursive: true });
    fs.writeFileSync(out, csv.join("\n") + "\n");
    console.log(`${rows.length} addresses written to ${out}`);
    break;
  }
  case "ship": {
    const [number, courier, tracking, url] = rest;
    if (!number || !courier || !tracking) {
      console.error('Usage: npm run shop ship LB1024-AB3XYZ "J&T Express" JT0099887766 [url]');
      process.exit(1);
    }
    const before = await orders.getOrder(number);
    if (!before) {
      console.error(`No order called ${number}. Check the number from the order email.`);
      process.exit(1);
    }
    await orders.markShipped(number, courier, tracking, url);
    const after = await orders.getOrder(number);
    console.log(`${number} is now ${after.status}, via ${after.courier} ${after.tracking_number}`);
    console.log(`The customer can see it at /order/${number}`);
    break;
  }
  default:
    console.log(HELP);
}
process.exit(0);
