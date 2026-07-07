import { sendBrevoEmail } from "@/lib/email/brevo";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

export type WaitlistAnnouncementAudience = "new" | "active";

export function renderAnnouncementTemplate(input: {
  contactName: string;
  facilityName?: string | null;
  message: string;
  type: "FAMILY" | "FACILITY";
}) {
  const greetingName = input.contactName.trim() || "there";
  const facilityLabel = input.facilityName?.trim() || "your facility";
  const body = input.message
    .replaceAll("{{contactName}}", greetingName)
    .replaceAll("{{facilityName}}", facilityLabel)
    .trim();

  const paragraphs = [`Hello ${greetingName},`, body];

  const cta =
    input.type === "FAMILY"
      ? { label: "Open Shepherds Oud", url: `${appUrl}/family/intake` }
      : { label: "Open facility dashboard", url: `${appUrl}/provider/login` };

  return {
    paragraphs,
    cta,
    textContent: [...paragraphs, "", `${cta.label}: ${cta.url}`].join("\n")
  };
}

export async function sendWaitlistAnnouncementEmail(input: {
  email: string;
  contactName: string;
  facilityName?: string | null;
  type: "FAMILY" | "FACILITY";
  subject: string;
  message: string;
}) {
  const content = renderAnnouncementTemplate({
    contactName: input.contactName,
    facilityName: input.facilityName,
    message: input.message,
    type: input.type
  });

  const htmlContent = renderTransactionalEmail({
    preheader: input.subject,
    eyebrow: "Shepherds Oud update",
    title: input.subject,
    paragraphs: content.paragraphs,
    cta: content.cta,
    footerNote: "You are receiving this because you joined the Shepherds Oud waitlist. Reply if you need help."
  });

  return sendBrevoEmail({
    to: [{ email: input.email, name: input.contactName }],
    subject: input.subject,
    htmlContent,
    textContent: content.textContent
  });
}
