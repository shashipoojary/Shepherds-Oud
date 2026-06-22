import { sendBrevoEmail } from "@/lib/email/brevo";
import { sendAdvisorAlertEmail } from "@/lib/email/advisor-alert-email";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

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
  const advisorKind = isVisit ? "family_visit_request" as const : "family_callback_request" as const;

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

  await Promise.allSettled([
    sendBrevoEmail({
      to: [{ email: input.providerEmail, name: input.providerName }],
      subject: `${title} — Shepherds Oud`,
      htmlContent,
      textContent: paragraphs.join(" ")
    }),
    sendAdvisorAlertEmail({
      kind: advisorKind,
      detail: `${input.familyName} → ${input.providerName}`,
      paragraphs: [
        `${input.familyName} requested ${isVisit ? "a visit" : "a callback"} with ${input.providerName}.`,
        `Area: ${input.familyArea}. Urgency: ${input.familyUrgency}.`,
        "The provider has been notified by email."
      ]
    })
  ]);
}

export async function sendProviderResponseEmails(input: {
  providerName: string;
  familyName: string;
  accepted: boolean;
}) {
  const kind = input.accepted ? "provider_accepted" as const : "provider_declined" as const;
  const verb = input.accepted ? "accepted" : "declined";

  await sendAdvisorAlertEmail({
    kind,
    detail: `${input.providerName} / ${input.familyName}`,
    paragraphs: [
      `${input.providerName} has ${verb} the inquiry from ${input.familyName}.`,
      "The family has been updated on their dashboard and notified by email if this was a milestone update."
    ]
  });
}
