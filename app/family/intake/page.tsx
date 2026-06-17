import { SiteHeader } from "@/components/site-header";
import { IntakeForm } from "@/components/intake-form";

export const dynamic = "force-dynamic";

export default function IntakePage() {
  return (
    <>
      <SiteHeader />
      <main className="px-4 py-10">
        <IntakeForm />
      </main>
    </>
  );
}
