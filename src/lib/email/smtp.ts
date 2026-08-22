import nodemailer from "nodemailer";
import { fromAddress, type EmailProvider } from "./types";

/** Any SMTP account (e.g. a workspace mailbox). Requires SMTP_HOST/PORT/USER/PASS. */
export const smtpEmail: EmailProvider = {
  id: "smtp",
  async send(mail) {
    const host = process.env.SMTP_HOST;
    if (!host) throw new Error("SMTP_HOST is not set");
    const port = Number(process.env.SMTP_PORT ?? 587);
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
    await transporter.sendMail({
      from: fromAddress(),
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
  },
};
