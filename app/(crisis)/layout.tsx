import { SiteHeader } from "@/components/layout/site-header";
import { CrisisChrome } from "@/components/crisis-v2/crisis-chrome";
import { brand } from "@/lib/config/brand";

export const metadata = {
  title: `Crisis triage | ${brand.name}`,
  robots: { index: false, follow: false }
};

export default function CrisisLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <CrisisChrome>{children}</CrisisChrome>
      </main>
    </>
  );
}
