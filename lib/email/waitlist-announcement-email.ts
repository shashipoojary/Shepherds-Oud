/**
 * @deprecated Import from `@/lib/email/announcement-email` instead.
 * Kept for waitlist launch bulk compatibility.
 */
export {
  renderAnnouncementTemplate,
  sendAnnouncementEmail,
  sendWaitlistAnnouncementEmail,
  stripAnnouncementTokens,
  type AnnouncementRecipientKind
} from "@/lib/email/announcement-email";

export type WaitlistAnnouncementAudience = "new" | "active";
