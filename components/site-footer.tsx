import Link from "next/link";

const links = [
  { label: "Home", href: "/" },
  { label: "Find care", href: "/family/intake" },
  { label: "Join waitlist", href: "/register" },
  { label: "Family registration", href: "/register/family" },
  { label: "Facility registration", href: "/register/facility" },
  { label: "Provider dashboard", href: "/provider" }
];

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-start">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold text-sage-600">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-sage-600 text-sm text-white" aria-hidden="true">
                🌿
              </span>
              Shepherds Oud
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-neutral-600">
              We help families across the Netherlands find suitable eldercare — with guidance, matched providers, and support through each step.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3" aria-label="Footer navigation">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-neutral-600 hover:text-sage-600">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-stone-100 pt-6 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Shepherds Oud. Nationwide eldercare matching in the Netherlands.</p>
          <p>For families, seniors, and care providers.</p>
        </div>
      </div>
    </footer>
  );
}
