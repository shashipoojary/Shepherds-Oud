import { sendBrevoEmail } from "@/lib/email/brevo";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

export async function sendProviderInviteEmail(input: {
  email: string;
  contactName: string;
  facilityName?: string | null;
  token: string;
  expiresAt: Date;
}) {
  const inviteUrl = `${appUrl}/provider/login?invite=${encodeURIComponent(input.token)}`;
  const displayName = input.facilityName?.trim() || "your facility";
  const expiresLabel = input.expiresAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
  const subject = "You are invited to onboard your facility on Shepherds Oud";
  const paragraphs = [
    `Hello ${input.contactName},`,
    `Your facility, ${displayName}, has been invited to complete provider onboarding on Shepherds Oud.`,
    "Use the secure link below to sign in with this email address and start setting up your facility profile.",
    `This invitation expires on ${expiresLabel}.`
  ];

  const htmlContent = renderTransactionalEmail({
    preheader: "Complete your Shepherds Oud facility onboarding.",
    eyebrow: "Provider invitation",
    title: "Set up your facility profile",
    paragraphs,
    cta: { label: "Open provider onboarding", url: inviteUrl },
    footerNote: "This invitation is intended only for the email address it was sent to. If this was unexpected, you can ignore it."
  });

  const textContent = [...paragraphs, "", `Open provider onboarding: ${inviteUrl}`].join("\n");

  const result = await sendBrevoEmail({
    to: [{ email: input.email, name: input.contactName }],
    subject,
    htmlContent,
    textContent
  });

  if (result.mode === "demo") {
    console.info(`[dev] Provider invite for ${input.email}: ${inviteUrl}`);
  }

  return result;
}
