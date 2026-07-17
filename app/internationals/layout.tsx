import type { Metadata } from "next";
import { DocumentLang } from "@/components/marketing/document-lang";

export const metadata: Metadata = {
  alternates: { languages: { en: "/internationals", nl: "/" } }
};

/** English niche page — override document language for this segment only. */
export default function InternationalsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="en">
      <DocumentLang lang="en" />
      {children}
    </div>
  );
}
