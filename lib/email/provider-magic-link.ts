import { sendBrevoEmail } from "@/lib/email/brevo";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";

export async function sendProviderMagicLinkEmail(email: string, url: string) {
  const subject = "Sign in to Shepherds Oud";
  const textContent = [
    "Sign in to your facility dashboard",
    "",
    "Use this secure link to open your provider dashboard:",
    url,
    "",
    "This link expires in 15 minutes. If you did not request it, you can ignore this email.",
    "",
    "Shepherds Oud — Finding the right care together."
  ].join("\n");

  const htmlContent = renderTransactionalEmail({
    preheader: "Your secure sign-in link for the Shepherds Oud facility dashboard.",
    eyebrow: "Provider sign in",
    title: "Open your facility dashboard",
    paragraphs: [
      "Click the button below to sign in securely. This link works with any email address, including Apple, Microsoft, Gmail, and your facility domain.",
      "For your security, this link can only be used once and expires in 15 minutes."
    ],
    ctaLabel: "Open facility dashboard",
    ctaUrl: url,
    footerNote: "If you did not request this email, you can safely ignore it. No changes will be made to your account."
  });

  const result = await sendBrevoEmail({
    to: [{ email }],
    subject,
    htmlContent,
    textContent
  });

  if (result.mode === "demo") {
    console.info(`[dev] Provider magic link for ${email}: ${url}`);
  }

  return result;
}
