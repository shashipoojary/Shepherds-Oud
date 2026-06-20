import { sendBrevoEmail } from "@/lib/email/brevo";
import { renderTransactionalEmail } from "@/lib/email/transactional-template";
import { intakeStatusLabel, normalizeIntakeStatus } from "@/lib/intake-workflow";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

export async function sendIntakeStatusEmail(input: {
  contactName: string;
  email: string;
  intakeId: string;
  status: string;
  carePathway?: string | null;
  careGuide?: { name: string | null; email: string } | null;
  visitProviderName?: string | null;
  visitScheduledAt?: Date | null;
}) {
  const status = normalizeIntakeStatus(input.status);
  const guideName = input.careGuide?.name || "Your Care Guide";
  const dashboardUrl = `${appUrl}/family/dashboard`;
  const visitWhen = input.visitScheduledAt
    ? input.visitScheduledAt.toLocaleString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit"
      })
    : null;

  const messages: Partial<Record<string, { title: string; paragraphs: string[] }>> = {
    CARE_GUIDE_ASSIGNED: {
      title: "Your Care Guide is assigned",
      paragraphs: [
        `Hello ${input.contactName},`,
        `${guideName} is now personally reviewing your case. They will guide your family through assessment, care planning, and placement.`,
        "No family should carry eldercare decisions alone — your Care Guide is here for shared decision support."
      ]
    },
    ASSESSMENT: {
      title: "Your assessment has started",
      paragraphs: [
        `Hello ${input.contactName},`,
        `${guideName} is reviewing your loved one's needs, mobility, dementia care, and family decision context.`,
        "We will update you when your care plan is ready on your dashboard."
      ]
    },
    CARE_PLAN: {
      title: "Your care plan is ready",
      paragraphs: [
        `Hello ${input.contactName},`,
        input.carePathway
          ? `Your recommended care pathway is ${input.carePathway}. ${guideName} has prepared next steps for your family.`
          : `${guideName} has prepared a care plan with recommended next steps for your family.`,
        "Review your dashboard to see the plan and upcoming provider matches."
      ]
    },
    MATCHED: {
      title: "Provider matches are ready",
      paragraphs: [
        `Hello ${input.contactName},`,
        "Matched providers are now on your shortlist.",
        `${guideName} is here if you have questions while you compare options together.`
      ]
    },
    VISIT_SCHEDULED: {
      title: "Your visit is scheduled",
      paragraphs: [
        `Hello ${input.contactName},`,
        visitWhen
          ? `Your ${input.visitProviderName ? `visit with ${input.visitProviderName}` : "visit or callback"} is scheduled for ${visitWhen}.`
          : "A facility visit or callback has been scheduled and tracked on your dashboard.",
        `${guideName} will support you through this important step.`
      ]
    },
    PROVIDER_RESPONSE: {
      title: "A provider has responded",
      paragraphs: [
        `Hello ${input.contactName},`,
        "A care provider has responded to your request. Your Care Guide will help your family decide the next step.",
        "Check your dashboard for the latest update."
      ]
    },
    PLACEMENT_IN_PROGRESS: {
      title: "Placement is in progress",
      paragraphs: [
        `Hello ${input.contactName},`,
        "Your family is moving forward with placement. Your Care Guide remains available if you need support.",
        "Check your dashboard for the latest updates."
      ]
    },
    PLACED: {
      title: "Care has been arranged",
      paragraphs: [
        `Hello ${input.contactName},`,
        "We are glad to share that care has been arranged for your family.",
        `${guideName} will check in at 7, 30, and 90 days to support your transition.`
      ]
    },
    FOLLOW_UP_7: {
      title: "7-day follow-up",
      paragraphs: [
        `Hello ${input.contactName},`,
        `${guideName} is checking in one week after placement to see how your family is settling in.`,
        "Reply to this email or open your dashboard if anything needs attention."
      ]
    },
    FOLLOW_UP_30: {
      title: "30-day follow-up",
      paragraphs: [
        `Hello ${input.contactName},`,
        `${guideName} is checking in one month after placement.`,
        "We want to make sure your family still feels supported."
      ]
    },
    FOLLOW_UP_90: {
      title: "90-day follow-up",
      paragraphs: [
        `Hello ${input.contactName},`,
        `${guideName} is checking in three months after placement.`,
        "Thank you for trusting Shepherds Oud with your family's care journey."
      ]
    }
  };

  const content = messages[status];
  if (!content) return { skipped: true as const };

  const htmlContent = renderTransactionalEmail({
    preheader: content.title,
    eyebrow: "Your guided care journey",
    title: content.title,
    paragraphs: content.paragraphs,
    ctaLabel: "Open your dashboard",
    ctaUrl: dashboardUrl,
    footerNote: `Reference ${input.intakeId.slice(0, 8).toUpperCase()} · Status: ${intakeStatusLabel(status)}`
  });

  await sendBrevoEmail({
    to: [{ email: input.email, name: input.contactName }],
    subject: `${content.title} — Shepherds Oud`,
    htmlContent,
    textContent: `${content.title}. ${content.paragraphs.join(" ")} Dashboard: ${dashboardUrl}`
  });

  return { sent: true as const };
}
