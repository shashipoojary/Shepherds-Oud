import { sendBrevoEmail } from "@/lib/email/brevo";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";

export async function sendFamilyMagicLinkEmail(email: string, url: string) {
  const subject = "Open your Shepherds Oud care dashboard";
  const textContent = [
    "Sign in to your family care dashboard",
    "",
    "Use this secure link to view your care request and provider matches:",
    url,
    "",
    "This link expires in 15 minutes. If you did not request it, you can ignore this email.",
    "",
    "Shepherds Oud - Finding the right care together."
  ].join("\n");

  const htmlContent = renderTransactionalEmail({
    preheader: "Your secure sign-in link for your Shepherds Oud care dashboard.",
    eyebrow: "Family sign in",
    title: "Open your care dashboard",
    paragraphs: [
      "Click the button below to sign in securely and continue your family's care journey.",
      "For your security, this link can only be used once and expires in 15 minutes."
    ],
    cta: { label: "Open care dashboard", url },
    footerNote: "If you did not request this email, you can safely ignore it. No changes will be made to your request."
  });

  const result = await sendBrevoEmail({
    to: [{ email }],
    subject,
    htmlContent,
    textContent
  });

  if (result.mode === "demo") {
    console.info(`[dev] Family magic link for ${email}: ${url}`);
  }

  return result;
}
