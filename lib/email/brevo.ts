/**
 * Single source of truth for Brevo transactional "From" identity.
 *
 * All app email (magic links, invites, waitlist, intake, matches) goes through
 * `sendBrevoEmail` → this resolver. Better Auth does not send mail itself; its
 * magicLink plugin calls our hooks, which call `sendBrevoEmail`.
 *
 * Env (only these are used — there is no BREVO_SENDER_EMAIL / SMTP_FROM / EMAIL_FROM):
 * - BREVO_API_KEY
 * - BREVO_FROM_EMAIL  (required) e.g. dominique@shepherdsoud.com
 * - BREVO_FROM_NAME   (optional, default "Shepherds Oud")
 *
 * Important: passing a verified sender email is necessary but not sufficient.
 * If `shepherdsoud.com` is not domain-authenticated in Brevo (Brevo code + DKIM
 * + DMARC), Brevo rewrites the visible From to something like
 * `dominique@<accountId>.brevosend.com`. That rewrite is server-side at Brevo —
 * it cannot be fixed by changing this payload. Fix it under Senders → Domains.
 */

export type BrevoSender = {
  name: string;
  email: string;
};

export function resolveBrevoSender(): BrevoSender | null {
  const email = (process.env.BREVO_FROM_EMAIL || "").trim().toLowerCase();
  const name = (process.env.BREVO_FROM_NAME || "Shepherds Oud").trim() || "Shepherds Oud";

  if (!email) {
    return null;
  }

  return { name, email };
}

type BrevoEmail = {
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
};

export async function sendBrevoEmail(email: BrevoEmail) {
  const apiKey = process.env.BREVO_API_KEY;
  const sender = resolveBrevoSender();

  if (!apiKey || !sender) {
    return { mode: "demo" as const, skipped: true };
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      // Explicit From on every call — never omit (omission lets Brevo use account defaults).
      sender: {
        name: sender.name,
        email: sender.email
      },
      replyTo: {
        name: sender.name,
        email: sender.email
      },
      to: email.to,
      subject: email.subject,
      htmlContent: email.htmlContent,
      textContent: email.textContent
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Brevo email failed with status ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  return {
    mode: "brevo" as const,
    result: await response.json(),
    sender
  };
}
