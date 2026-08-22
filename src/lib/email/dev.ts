import fs from "node:fs";
import path from "node:path";
import { fromAddress, type EmailProvider } from "./types";

/**
 * Development mailer: writes each message to var/outbox/*.eml and logs a line.
 * Nothing is actually delivered; perfect for local testing.
 */
export const devEmail: EmailProvider = {
  id: "dev",
  async send(mail) {
    const dir = path.resolve(process.cwd(), "var/outbox");
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeTo = mail.to.replace(/[^a-z0-9@._-]/gi, "_").slice(0, 60);
    const file = path.join(dir, `${stamp}_${safeTo}.eml`);
    const eml = [
      `From: ${fromAddress()}`,
      `To: ${mail.to}`,
      `Subject: ${mail.subject}`,
      "MIME-Version: 1.0",
      'Content-Type: text/html; charset="utf-8"',
      "",
      mail.html,
    ].join("\r\n");
    fs.writeFileSync(file, eml, "utf8");
    console.log(`[email:dev] wrote ${path.relative(process.cwd(), file)} (${mail.subject})`);
  },
};
