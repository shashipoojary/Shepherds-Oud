import { sendBrevoEmail } from "@/lib/email/brevo";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

export async function sendWaitlistConfirmationEmails(input: {
  contactName: string;
  email: string;
  type: "FAMILY" | "FACILITY";
}) {
  const paragraphs = [
    `Hello ${input.contactName},`,
    "Thank you for registering with Shepherds Oud.",
    "We will contact you as soon as guided intake opens in your area."
  ];

  const htmlContent = renderTransactionalEmail({
    preheader: "Thanks for joining the Shepherds Oud waitlist.",
    eyebrow: "Waitlist",
    title: "You are on the list",
    paragraphs,
    cta: { label: "Visit Shepherds Oud", url: appUrl },
    footerNote: "No further action is needed unless we email you directly."
  });

  await sendBrevoEmail({
    to: [{ email: input.email, name: input.contactName }],
    subject: "Thanks for joining the Shepherds Oud waitlist",
    htmlContent,
    textContent: paragraphs.join(" ")
  });
}
