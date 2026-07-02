import { sendBrevoEmail } from "@/lib/email/brevo";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

type ProviderStatusKind = "visit_scheduled" | "care_chosen";

export async function sendProviderStatusEmail(input: {
  providerEmail: string;
  providerName: string;
  familyName: string;
  kind: ProviderStatusKind;
  visitScheduledAt?: Date | null;
  visitType?: string | null;
  visitNotes?: string | null;
}) {
  const dashboardUrl = `${appUrl}/provider`;
  const isVisit = input.kind === "visit_scheduled";
  const title = isVisit ? "Visit or callback details confirmed" : "A family chose your facility";
  const visitLine =
    input.visitScheduledAt && !Number.isNaN(input.visitScheduledAt.getTime())
      ? `Timing: ${input.visitScheduledAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}.`
      : "Open your dashboard for the latest timing and notes.";

  const paragraphs = isVisit
    ? [
        `Hello ${input.providerName},`,
        `A Care Guide scheduled the next step for ${input.familyName}.`,
        `${input.visitType || "Visit or callback"} - ${visitLine}`,
        input.visitNotes ? `Notes: ${input.visitNotes}` : "Please check your facility dashboard for the family context."
      ]
    : [
        `Hello ${input.providerName},`,
        `${input.familyName} has chosen to move forward with your facility.`,
        "A Care Guide will continue coordinating final details with the family and your team.",
        "Open your facility dashboard for the latest inquiry status."
      ];

  const htmlContent = renderTransactionalEmail({
    preheader: title,
    eyebrow: "Care Guide update",
    title,
    paragraphs,
    cta: { label: "Open facility dashboard", url: dashboardUrl },
    footerNote: "This update was sent by Shepherds Oud after Care Guide review."
  });

  return sendBrevoEmail({
    to: [{ email: input.providerEmail, name: input.providerName }],
    subject: `${title} - Shepherds Oud`,
    htmlContent,
    textContent: `${title}. ${paragraphs.join(" ")} Dashboard: ${dashboardUrl}`
  });
}
