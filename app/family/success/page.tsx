import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function SuccessPage() {
  return (
    <>
      <SiteHeader />
      <main className="grid min-h-[calc(100vh-64px)] place-items-center px-4 py-10">
        <section className="max-w-[480px] rounded-[20px] bg-white px-10 py-12 text-center shadow-panel">
          <div className="mx-auto mb-6 grid h-[72px] w-[72px] place-items-center rounded-full bg-sage-100 text-xl font-bold text-sage-600">SO</div>
          <h1 className="text-[1.4rem] font-bold">We&apos;ve received your request</h1>
          <p className="mt-3 text-[15px] leading-7 text-neutral-700">
            Thank you, Maria. We&apos;ve found <strong>3 matching care providers</strong> in Den Haag based on your situation. You can view them now or we will follow up within 24 hours.
          </p>
          <div className="mt-7 grid gap-3">
            <Button asChild>
              <Link href="/family/results">See matched providers</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/family/dashboard">View my dashboard</Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
