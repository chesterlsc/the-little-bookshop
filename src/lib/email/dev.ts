import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fromAddress, type Mail, type EmailProvider } from "./types";

/** A multipart/mixed message: the HTML, then each attachment, base64 at 76 columns. */
function multipart(headers: string[], html: string, attachments: NonNullable<Mail["attachments"]>) {
  const boundary = `tlb-${randomUUID()}`;
  const parts = [
    ...headers,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="utf-8"',
    "",
    html,
  ];
  for (const a of attachments) {
    parts.push(
      `--${boundary}`,
      `Content-Type: ${a.contentType}; name="${a.filename}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${a.filename}"`,
      "",
      a.base64.replace(/(.{76})/g, "$1\r\n"),
    );
  }
  parts.push(`--${boundary}--`, "");
  return parts.join("\r\n");
}

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
    const recipients = Array.isArray(mail.to) ? mail.to.join(", ") : mail.to;
    const safeTo = recipients.replace(/[^a-z0-9@._-]/gi, "_").slice(0, 60);
    const file = path.join(dir, `${stamp}_${safeTo}.eml`);
    const headers = [
      `From: ${fromAddress()}`,
      `To: ${recipients}`,
      `Subject: ${mail.subject}`,
      "MIME-Version: 1.0",
    ];
    // Real MIME when something is attached, so the .eml opens with the image
    // showing. Without one the file stays byte-identical to every older one.
    const eml = mail.attachments?.length
      ? multipart(headers, mail.html, mail.attachments)
      : [...headers, 'Content-Type: text/html; charset="utf-8"', "", mail.html].join("\r\n");
    fs.writeFileSync(file, eml, "utf8");
    console.log(`[email:dev] wrote ${path.relative(process.cwd(), file)} (${mail.subject})`);
  },
};
