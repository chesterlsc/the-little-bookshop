import { devEmail } from "./dev";
import { resendEmail } from "./resend";
import { smtpEmail } from "./smtp";
import type { EmailProvider } from "./types";

const providers: Record<string, EmailProvider> = {
  dev: devEmail,
  resend: resendEmail,
  smtp: smtpEmail,
};

/**
 * Whichever mailer the environment is actually equipped for.
 *
 * Set a credential and mail sends: no second variable to remember, and no
 * deploy that quietly writes order notifications to a file nobody reads.
 * EMAIL_PROVIDER still overrides, for forcing `dev` on a staging deploy.
 */
export function getEmailProvider(): EmailProvider {
  const id =
    process.env.EMAIL_PROVIDER ||
    (process.env.RESEND_API_KEY ? "resend" : process.env.SMTP_HOST ? "smtp" : "dev");
  const provider = providers[id];
  if (!provider) {
    throw new Error(
      `Unknown EMAIL_PROVIDER "${id}". Expected one of: ${Object.keys(providers).join(", ")}`,
    );
  }
  return provider;
}
