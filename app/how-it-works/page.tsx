import type { Metadata } from "next";
import { InfoPage } from "@/components/marketing/info-page";
import { brand } from "@/lib/config/brand";

export const metadata: Metadata = {
  title: `How it works | ${brand.name}`,
  description: "Step-by-step: intake, Care Guide assessment, matched providers, visits, and placement support."
};

export default function HowItWorksPage() {
  return (
    <InfoPage
      label="How it works"
      title="From first contact to the right care"
      intro="Shepherds Oud is designed for clarity at every step. You always know what happens next and who is helping you."
      sections={[
        {
          title: "1. Tell us about your situation",
          paragraphs: [
            "Complete the guided intake in about 10–15 minutes. Share who needs care, where you are looking, urgency, mobility and medical support needs, and how we can reach you.",
            "You can save progress and return from any device once signed in."
          ]
        },
        {
          title: "2. Meet your Care Guide",
          paragraphs: [
            "A Care Guide reviews your intake and may contact you for a short assessment call. They clarify care goals, budget context, and practical constraints such as distance and language."
          ]
        },
        {
          title: "3. Review your shortlist",
          paragraphs: [
            "When your care plan is ready, matched providers appear on your results page with availability, estimated wait where known, and indicative pricing.",
            "You can save favourites, request visits or callbacks, and read full provider profiles."
          ]
        },
        {
          title: "4. Visits, placement, and follow-up",
          paragraphs: [
            "Your Care Guide helps coordinate with providers. Status updates appear on your dashboard — from visit scheduled through placement and follow-up check-ins.",
            "If a provider declines, your case stays open and your Care Guide can suggest alternatives."
          ]
        }
      ]}
      cta={{ label: "Start intake", href: "/family/intake" }}
    />
  );
}
