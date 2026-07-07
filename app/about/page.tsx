import type { Metadata } from "next";
import { InfoPage } from "@/components/marketing/info-page";
import { brand } from "@/lib/config/brand";

export const metadata: Metadata = {
  title: `About | ${brand.name}`,
  description: "Human-guided care navigation for people with limited mobility across the Netherlands."
};

export default function AboutPage() {
  return (
    <InfoPage
      label="About us"
      title="Care navigation with a human guide"
      intro="Shepherds Oud helps people with limited mobility — and the families supporting them — find suitable care across the Netherlands. We are not a care directory. Every journey starts with a real Care Guide who listens, assesses, and coordinates next steps with matched providers."
      sections={[
        {
          title: "Who we serve",
          paragraphs: [
            "Our service is for anyone whose mobility limits daily life: adults recovering from injury, people with chronic conditions, younger adults with disabilities, and older adults who need more support at home or in a facility.",
            "Families often contact us when decisions feel urgent, confusing, or emotionally heavy. We stay alongside you from first intake through placement and follow-up."
          ]
        },
        {
          title: "What makes us different",
          list: [
            "A dedicated Care Guide assigned to your case",
            "Matched providers — not an endless searchable list",
            "Clear status updates on your family dashboard",
            "Coordination with facilities when you request visits or callbacks",
            "Support when Dutch systems and paperwork feel overwhelming"
          ],
          paragraphs: []
        },
        {
          title: "Nationwide, human-first",
          paragraphs: [
            "We work with care homes, assisted living, home care agencies, and specialised providers across the Netherlands. Technology supports the process; people make the decisions."
          ]
        }
      ]}
      cta={{ label: "See how it works", href: "/how-it-works" }}
    />
  );
}
