/**
 * Sends one real test email to the shop inbox and explains any failure.
 *
 * Put your credentials in .env.local, run `npm run mail:check`, and only copy
 * them into Vercel once this passes. Reading the reason here beats reading it
 * from a serverless log after a customer has already lost an order.
 *
 * Deliberately talks to the providers directly rather than importing the app's
 * mailer: plain node cannot resolve the app's TypeScript imports, and pulling
 * in a loader to run one diagnostic is not worth the dependency. The provider
 * choice below is the same rule as src/lib/email/index.ts; keep them in step.
 */
import fs from "node:fs";
import nodemailer from "nodemailer";

/* ── environment ─────────────────────────────────────────────────────────── */
for (const file of [".env.local", ".env"]) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

// The one place the shop mailbox is defined, so this cannot drift from the site.
const site = fs.readFileSync("src/content/site.ts", "utf8");
const SHOP_EMAIL = site.match(/const SHOP_EMAIL = "([^"]+)"/)?.[1];
if (!SHOP_EMAIL) {
  console.error("Could not find SHOP_EMAIL in src/content/site.ts.");
  process.exit(1);
}

const to = process.env.ORDERS_EMAIL || SHOP_EMAIL;
const from = process.env.EMAIL_FROM || `The Little Bookshop <${SHOP_EMAIL}>`;
// This exists to prove a real credential works, so an EMAIL_PROVIDER=dev left in
// .env.local to keep the dev server off real mail must not skip the test.
const forced = process.env.EMAIL_PROVIDER === "dev" ? "" : process.env.EMAIL_PROVIDER;
const provider =
  forced || (process.env.SMTP_HOST ? "smtp" : process.env.RESEND_API_KEY ? "resend" : "dev");

const mail = {
  to,
  from,
  subject: "Test from your Little Bookshop site",
  html: `<p>If you are reading this, order emails will reach you.</p>
         <p style="color:#666">Sent by <code>npm run mail:check</code>. Nothing was ordered.</p>`,
  text: "If you are reading this, order emails will reach you. Sent by npm run mail:check.",
};

console.log(`provider : ${provider}`);
console.log(`from     : ${from}`);
console.log(`to       : ${to}\n`);

/* ── what went wrong, in words the shop can act on ───────────────────────── */
function explain(err) {
  const text = `${err?.code ?? ""} ${err?.responseCode ?? ""} ${err?.message ?? err}`;
  const hints = [
    [
      /EAUTH|535|Username and Password not accepted/i,
      `Gmail refused the sign-in.
   SMTP_PASS must be a 16-character App Password, not the account password.
   Turn on 2-Step Verification first, then create one at
   https://myaccount.google.com/apppasswords
   App Passwords are also revoked whenever the account password changes.`,
    ],
    [
      /ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ESOCKET/i,
      `Could not reach ${process.env.SMTP_HOST ?? "the mail server"}:${process.env.SMTP_PORT ?? 587}.
   Check SMTP_HOST and SMTP_PORT (smtp.gmail.com and 587 for Gmail), and that
   the network allows outbound mail.`,
    ],
    [
      /domain is not verified|only send testing emails to your own/i,
      `Resend will not send this yet. Until a domain is verified it delivers
   only to the address that owns the Resend account, which the error above
   names, and only from onboarding@resend.dev. Three ways on:

     - point ORDERS_EMAIL at that account address, and your order mail works
       today. Customers still get nothing.
     - or change the Resend account's email to the shop mailbox, so orders
       land there instead with no config change.
     - or verify a domain (free, up to three) and set EMAIL_FROM to an address
       on it. This is the only option where customers are emailed too, and it
       needs the shop's own domain to be live.

   Gmail SMTP has no such limit and emails customers today.`,
    ],
    [/401|API key is invalid/i, `RESEND_API_KEY was rejected. Copy it again from resend.com/api-keys.`],
    [/RESEND_API_KEY is not set|SMTP_HOST is not set/i, `${err.message} Add it to .env.local.`],
  ];
  return hints.find(([re]) => re.test(text))?.[1];
}

/* ── send ────────────────────────────────────────────────────────────────── */
try {
  if (provider === "dev") {
    console.log(`No mail credential is set, so nothing would be delivered.

Pick one and add it to .env.local:

  Gmail (works today, both emails, any recipient)
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=${SHOP_EMAIL}
    SMTP_PASS=<16-character App Password>

  Resend (no Gmail settings to change, needs a verified domain to reach
  customers; before that it only delivers to the Resend account's own address)
    RESEND_API_KEY=re_...
    EMAIL_FROM=The Little Bookshop <onboarding@resend.dev>`);
    process.exit(1);
  }

  if (provider === "smtp") {
    const port = Number(process.env.SMTP_PORT ?? 587);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
    await transport.verify();
    console.log("credentials accepted, sending...");
    await transport.sendMail(mail);
  } else {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject: mail.subject, html: mail.html, text: mail.text }),
    });
    if (!res.ok) throw new Error(`Resend replied ${res.status}: ${(await res.text()).slice(0, 400)}`);
  }

  console.log(`\nSent. Check ${to} (and the spam folder the first time).`);
  console.log("Once it arrives, copy the same values into Vercel and redeploy.");
} catch (err) {
  console.error(`\nFAILED: ${err?.message ?? err}\n`);
  const hint = explain(err);
  if (hint) console.error(`   ${hint}\n`);
  process.exit(1);
}
