import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { familyDashboard } from "@/lib/content";

export default function FamilyDashboardPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="grid gap-4 rounded-2xl bg-white p-5 shadow-soft sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sage-700">Maria&apos;s care search</p>
            <h1 className="mt-2 text-2xl font-semibold">Next step: choose who to contact first</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
              We found three suitable options near Den Haag. Start with the recommended provider, or ask a care advisor to walk through the list with you.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:grid">
            <Button asChild>
              <Link href="/family/results">View recommended options</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/family/intake">Update care details</Link>
            </Button>
          </div>
        </header>

        <section className="mt-5 grid gap-3 md:grid-cols-3">
          <JourneyStep number="1" title="Intake complete" text="Your family details are saved." done />
          <JourneyStep number="2" title="Options ready" text="Review the recommended providers." active />
          <JourneyStep number="3" title="Make contact" text="Request a visit or advisor call." />
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
          <section className="rounded-2xl bg-white p-5 shadow-soft sm:p-6">
            <h2 className="font-semibold">Care details we are using</h2>
            <div className="mt-4 divide-y divide-stone-200">
              {Object.entries(familyDashboard.summary).map(([label, value]) => (
                <div key={label} className="grid gap-1 py-3 text-sm">
                  <span className="text-neutral-500">{label}</span>
                  <strong className="font-semibold">{value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-soft sm:p-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div>
              <h2 className="font-semibold">What has happened so far</h2>
              <div className="mt-5 border-l-2 border-sage-100 pl-5">
              {familyDashboard.timeline.map((item) => (
                <div key={item.text} className="relative mb-5 last:mb-0">
                  <span className={`absolute -left-[26px] top-1.5 h-3 w-3 rounded-full border-2 border-white ${item.pending ? "bg-stone-300" : "bg-sage-600"}`} />
                  <p className="text-sm text-neutral-700">{item.text}</p>
                  <time className="text-xs text-neutral-500">{item.time}</time>
                </div>
              ))}
              </div>
            </div>
              <aside className="rounded-xl bg-cream p-4">
                <h3 className="font-semibold">Today&apos;s advice</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Contact one provider first. If they are not suitable, keep De Havenzicht as a backup and ask about the waitlist.
                </p>
                <Button asChild size="sm" className="mt-4">
                  <Link href="/family/results">Start with Woonzorg Archipel</Link>
                </Button>
              </aside>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function JourneyStep({ number, title, text, done = false, active = false }: { number: string; title: string; text: string; done?: boolean; active?: boolean }) {
  return (
    <article className={`rounded-2xl p-4 shadow-soft ${active ? "bg-sage-600 text-white" : "bg-white text-neutral-900"}`}>
      <div className={`mb-3 grid h-9 w-9 place-items-center rounded-full text-sm font-semibold ${active ? "bg-white text-sage-700" : done ? "bg-sage-100 text-sage-700" : "bg-stone-100 text-neutral-500"}`}>
        {done ? "✓" : number}
      </div>
      <h2 className="font-semibold">{title}</h2>
      <p className={`mt-1 text-sm ${active ? "text-white/80" : "text-neutral-500"}`}>{text}</p>
    </article>
  );
}
