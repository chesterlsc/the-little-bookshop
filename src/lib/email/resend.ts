import { fromAddress, type EmailProvider } from "./types";

/** Resend (https://resend.com); requires RESEND_API_KEY and a verified EMAIL_FROM domain. */
export const resendEmail: EmailProvider = {
  id: "resend",
  async send(mail) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      // A send that hangs must fail while our own code is still running: an
      // order can then say so, and a claimed subscriber digest is put back
      // instead of the platform killing us mid-send and keeping it claimed.
      signal: AbortSignal.timeout(10_000),
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromAddress(),
        to: Array.isArray(mail.to) ? mail.to : [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }),
    });
    if (!res.ok) {
      throw new Error(`Resend send failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    }
  },
};
