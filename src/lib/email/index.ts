import { devEmail } from "./dev";
import { resendEmail } from "./resend";
import { smtpEmail } from "./smtp";
import type { EmailProvider } from "./types";

const providers: Record<string, EmailProvider> = {
  dev: devEmail,
  resend: resendEmail,
  smtp: smtpEmail,
};

/** Chosen via EMAIL_PROVIDER (dev | resend | smtp). Defaults to the dev outbox. */
export function getEmailProvider(): EmailProvider {
  const id = process.env.EMAIL_PROVIDER ?? "dev";
  const provider = providers[id];
  if (!provider) {
    throw new Error(
      `Unknown EMAIL_PROVIDER "${id}". Expected one of: ${Object.keys(providers).join(", ")}`,
    );
  }
  return provider;
}
