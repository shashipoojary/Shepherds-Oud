import { ubuntuTagline } from "@/lib/config/content";
import { sendBrevoEmail } from "@/lib/email/brevo";
import { sendAdvisorAlertEmail } from "@/lib/email/advisor-alert-email";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

export async function sendIntakeConfirmationEmails(input: {
  contactName: string;
  email: string;
  intakeId: string;
  careGuide: { name: string | null; email: string } | null;
}) {
  const dashboardUrl = `${appUrl}/family/dashboard`;
  const reference = input.intakeId.slice(0, 8).toUpperCase();
  const guideName = input.careGuide?.name || "Your Care Guide";

  const familyParagraphs = input.careGuide
    ? [
        `Hello ${input.contactName},`,
        `We received your care request. Your reference is ${reference}.`,
        `${guideName} (${input.careGuide.email}) is your dedicated Care Guide and will personally review your case.`,
        ubuntuTagline
      ]
    : [
        `Hello ${input.contactName},`,
        `We received your care request. Your reference is ${reference}.`,
        "A Care Guide will be assigned shortly to guide you through each decision.",
        ubuntuTagline
      ];

  const familyHtml = renderTransactionalEmail({
    preheader: "We received your Shepherds Oud care request.",
    eyebrow: "Care request received",
    title: "Thank you — we are with you",
    paragraphs: familyParagraphs,
    cta: { label: "Open your dashboard", url: dashboardUrl },
    footerNote: `Reference ${reference}. Save this email for your records.`
  });

  await Promise.allSettled([
    sendBrevoEmail({
      to: [{ email: input.email, name: input.contactName }],
      subject: "We received your Shepherds Oud care request",
      htmlContent: familyHtml,
      textContent: familyParagraphs.join(" ")
    }),
    sendAdvisorAlertEmail({
      kind: "new_intake",
      detail: input.contactName,
      paragraphs: [
        `A new intake was submitted by ${input.contactName} (${input.email}).`,
        `Reference: ${reference}.`,
        input.careGuide ? `Assigned Care Guide: ${guideName}.` : "No Care Guide assigned yet."
      ]
    })
  ]);
}
