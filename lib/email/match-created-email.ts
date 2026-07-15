import { sendBrevoEmail } from "@/lib/email/brevo";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

/** Family notification when a Care Guide adds or re-opens a provider match. */
export async function sendFamilyMatchCreatedEmail(input: {
  contactName: string;
  email: string;
  intakeId: string;
  providerName: string;
  reopened?: boolean;
}) {
  const dashboardUrl = `${appUrl}/family/dashboard?intakeId=${encodeURIComponent(input.intakeId)}`;
  const resultsUrl = `${appUrl}/family/results?intakeId=${encodeURIComponent(input.intakeId)}`;
  const title = input.reopened
    ? `${input.providerName} is available on your shortlist again`
    : `You've been matched with ${input.providerName}`;

  const paragraphs = input.reopened
    ? [
        `Hello ${input.contactName},`,
        `Your Care Guide has re-opened ${input.providerName} on your shortlist so you can consider them again.`,
        "Review the match and request a visit or callback when you are ready.",
        "Your Care Guide remains available if you want help deciding."
      ]
    : [
        `Hello ${input.contactName},`,
        `You've been matched with ${input.providerName}.`,
        "This facility is now on your shortlist. Review the details and request a visit or callback when you are ready.",
        "Your Care Guide is here if you have questions while you compare options."
      ];

  const htmlContent = renderTransactionalEmail({
    preheader: title,
    eyebrow: "New provider match",
    title,
    paragraphs,
    cta: { label: "Review your matches", url: resultsUrl },
    footerNote: `You can also open your dashboard anytime: ${dashboardUrl}`
  });

  return sendBrevoEmail({
    to: [{ email: input.email, name: input.contactName }],
    subject: `${title} — Shepherds Oud`,
    htmlContent,
    textContent: `${title}. ${paragraphs.join(" ")} Matches: ${resultsUrl}`
  });
}

/** Provider notification when they are added or re-opened as a potential referral. */
export async function sendProviderMatchCreatedEmail(input: {
  providerEmail: string;
  providerName: string;
  familyArea: string;
  familyCare: string;
  familyUrgency: string;
  reopened?: boolean;
}) {
  const dashboardUrl = `${appUrl}/provider`;
  const title = input.reopened
    ? "A previous referral has been re-opened"
    : "You have a new potential referral";

  const paragraphs = [
    `Hello ${input.providerName},`,
    input.reopened
      ? "A Care Guide has re-opened a family referral to your facility."
      : "You have a new potential referral from Shepherds Oud.",
    `Area: ${input.familyArea}. Care needs: ${input.familyCare}. Urgency: ${input.familyUrgency}.`,
    "The family can review your profile and may request a visit to your facility or a callback. Open your dashboard for context when they do."
  ];

  const htmlContent = renderTransactionalEmail({
    preheader: title,
    eyebrow: "Potential referral",
    title,
    paragraphs,
    cta: { label: "Open facility dashboard", url: dashboardUrl },
    footerNote: "No action is required until the family requests a visit or callback."
  });

  return sendBrevoEmail({
    to: [{ email: input.providerEmail, name: input.providerName }],
    subject: `${title} — Shepherds Oud`,
    htmlContent,
    textContent: `${title}. ${paragraphs.join(" ")} Dashboard: ${dashboardUrl}`
  });
}
