/**
 * Low-level Brevo HTTP delivery. Prefer `sendBrevoEmail` from `@/lib/email/brevo`
 * (outbox + immediate send). This module is used by the outbox worker too.
 */

export type BrevoSender = {
  name: string;
  email: string;
};

export type BrevoEmailPayload = {
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
};

export type BrevoSendResult =
  | { mode: "demo"; skipped: true }
  | { mode: "brevo"; result: unknown; sender: BrevoSender };

export function resolveBrevoSender(): BrevoSender | null {
  const email = (process.env.BREVO_FROM_EMAIL || "").trim().toLowerCase();
  const name = (process.env.BREVO_FROM_NAME || "Shepherds Oud Care").trim() || "Shepherds Oud Care";

  if (!email) {
    return null;
  }

  return { name, email };
}

/** Direct Brevo API call — no outbox. */
export async function deliverBrevoEmail(email: BrevoEmailPayload): Promise<BrevoSendResult> {
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
