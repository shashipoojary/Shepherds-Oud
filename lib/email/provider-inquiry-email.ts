import { sendBrevoEmail } from "@/lib/email/brevo";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

/** Provider-only alert when a family requests a visit or callback (action required). */
export async function sendProviderInquiryEmail(input: {
  providerEmail: string;
  providerName: string;
  familyName: string;
  familyArea: string;
  familyCare: string;
  familyUrgency: string;
  requestType: "VISIT_REQUESTED" | "CALLBACK_REQUESTED";
}) {
  const dashboardUrl = `${appUrl}/provider`;
  const isVisit = input.requestType === "VISIT_REQUESTED";
  const title = isVisit ? "A family requested a visit" : "A family requested a callback";

  const paragraphs = [
    `Hello ${input.providerName},`,
    `${input.familyName} from ${input.familyArea} has requested ${isVisit ? "a visit" : "a callback"} through Shepherds Oud.`,
    `Care needs: ${input.familyCare}. Urgency: ${input.familyUrgency}.`,
    "Open your facility dashboard to accept or decline this inquiry."
  ];

  const htmlContent = renderTransactionalEmail({
    preheader: title,
    eyebrow: "New family inquiry",
    title,
    paragraphs,
    cta: { label: "Open facility dashboard", url: dashboardUrl },
    footerNote: "Respond promptly so families know you received their request."
  });

  return sendBrevoEmail({
    to: [{ email: input.providerEmail, name: input.providerName }],
    subject: `${title} — Shepherds Oud`,
    htmlContent,
    textContent: paragraphs.join(" ")
  });
}
