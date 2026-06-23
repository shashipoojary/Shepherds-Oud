import { sendBrevoEmail } from "@/lib/email/brevo";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

function familyLaunchContent(contactName: string) {
  const intakeUrl = `${appUrl}/family/intake`;

  const paragraphs = [
    `Hello ${contactName},`,
    "Shepherds Oud is now live. Guided eldercare navigation is open for families across the Netherlands.",
    "You can start your family intake today. A dedicated Care Guide will personally review your situation, help prepare a care plan, and support your family through matching, visits, and placement.",
    "Thank you for waiting with us — we are ready to help you take the next step."
  ];

  return {
    subject: "Shepherds Oud is live — start your guided care intake",
    htmlContent: renderTransactionalEmail({
      preheader: "Guided eldercare navigation is now open on Shepherds Oud.",
      eyebrow: "We are live",
      title: "Your guided care journey can begin",
      paragraphs,
      cta: { label: "Start family intake", url: intakeUrl },
      footerNote: "If you already completed intake, you can sign in from the homepage to view your journey."
    }),
    textContent: [...paragraphs, `Start intake: ${intakeUrl}`].join(" ")
  };
}

function facilityLaunchContent(contactName: string, facilityName?: string | null) {
  const providerLoginUrl = `${appUrl}/provider/login`;
  const greetingName = facilityName?.trim() || contactName;

  const paragraphs = [
    `Hello ${contactName},`,
    `Shepherds Oud is now live. Care facilities can sign in, list services, and receive matched family inquiries through the provider dashboard.`,
    facilityName
      ? `${facilityName} can now complete facility onboarding and manage availability, inquiries, and visit requests in one place.`
      : "You can now sign in with your work email, complete your facility profile, and start receiving matched family inquiries.",
    "Thank you for registering before launch — we are glad to welcome you onto the platform."
  ];

  return {
    subject: "Shepherds Oud is live — sign in to your facility dashboard",
    htmlContent: renderTransactionalEmail({
      preheader: "Provider onboarding is open on Shepherds Oud.",
      eyebrow: "We are live",
      title: `${greetingName} can now list on Shepherds Oud`,
      paragraphs,
      cta: { label: "Sign in to your facility dashboard", url: providerLoginUrl },
      footerNote: "Use the same email address you registered with. Need help? Reply to this email or contact our team."
    }),
    textContent: [...paragraphs, `Facility sign-in: ${providerLoginUrl}`].join(" ")
  };
}

export async function sendWaitlistFamilyLaunchEmail(input: { contactName: string; email: string }) {
  const content = familyLaunchContent(input.contactName);

  return sendBrevoEmail({
    to: [{ email: input.email, name: input.contactName }],
    subject: content.subject,
    htmlContent: content.htmlContent,
    textContent: content.textContent
  });
}

export async function sendWaitlistFacilityLaunchEmail(input: {
  contactName: string;
  email: string;
  facilityName?: string | null;
}) {
  const content = facilityLaunchContent(input.contactName, input.facilityName);

  return sendBrevoEmail({
    to: [{ email: input.email, name: input.contactName }],
    subject: content.subject,
    htmlContent: content.htmlContent,
    textContent: content.textContent
  });
}
