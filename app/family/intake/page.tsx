import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { IntakeForm } from "@/components/family/intake-form";
import { getServerSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function IntakePage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/family/login?callbackUrl=/family/intake");
  }

  return (
    <>
      <SiteHeader />
      <main className="px-4 py-10">
        <IntakeForm />
      </main>
    </>
  );
}
