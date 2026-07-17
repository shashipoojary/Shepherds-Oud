export type AnnouncementAudience = "waitlist_new" | "waitlist_active" | "families" | "providers";

/** Tokens are filled only from the recipient profile — never from admin-edited placeholders. */
export const ANNOUNCEMENT_CONTACT_TOKEN = "{{contactName}}";
export const ANNOUNCEMENT_FACILITY_TOKEN = "{{facilityName}}";

export const ANNOUNCEMENT_AUDIENCES: AnnouncementAudience[] = [
  "waitlist_new",
  "waitlist_active",
  "families",
  "providers"
];

export function isAnnouncementAudience(value: string | null | undefined): value is AnnouncementAudience {
  return (
    value === "waitlist_new" ||
    value === "waitlist_active" ||
    value === "families" ||
    value === "providers"
  );
}
