/**
 * Brand / contact consistency checklist for Crisis V2 cutover.
 * Resolve before public launch (client brief).
 */
export const CRISIS_V2_BRAND_FIXES = [
  {
    id: "email-domain",
    issue: "Marketing email uses shepherdsoud.com while public site is shepherdsoud.nl",
    action: "Pick one primary domain for BREVO_FROM_EMAIL / brand.email and update both env + copy"
  },
  {
    id: "phone-format",
    issue: "Phone may display as +31 0687589164 (invalid NL mobile formatting)",
    action: "Normalize to E.164 (+31687589164) and a single display format (+31 6 87589164)"
  },
  {
    id: "care-guide-labels",
    issue: "brand.phoneLabel still says Care Guide line",
    action: "On V2 cutover, rename public labels to support / helpline without implying human triage"
  },
  {
    id: "region-copy",
    issue: "brand.regionNote is Netherlands-wide",
    action: "V2 marketing should say Den Haag / Haaglanden for launch scope"
  }
] as const;
