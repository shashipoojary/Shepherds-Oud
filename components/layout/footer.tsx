import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { brand } from "@/lib/brand";
import { isPrelaunch } from "@/lib/content";

const links = isPrelaunch
  ? [
      { label: "Home", href: "/" },
      { label: "Join waitlist", href: "/register" },
      { label: "Register as a family", href: "/register/family" },
      { label: "Register a facility", href: "/register/facility" }
    ]
  : [
      { label: "Home", href: "/" },
      { label: "Start intake", href: "/family/intake" },
      { label: "Join waitlist", href: "/register" },
      { label: "Register a facility", href: "/register/facility" }
    ];

export function Footer() {
  return (
    <footer className="bg-brand-green-dark text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-start">
          <div>
            <BrandLogo variant="footer" showTagline tone="light" href="/" />
            <p className="mt-4 max-w-sm text-sm leading-[1.7] text-white/80">
              {isPrelaunch
                ? "Human-guided eldercare navigation for families across the Netherlands. Register now — we will contact you at launch."
                : "We help families across the Netherlands with a dedicated Care Guide, matched providers, and support through each step."}
            </p>
            <a href={`mailto:${brand.email}`} className="mt-4 inline-block text-sm font-medium text-white/90 hover:text-brand-amber">
              {brand.email}
            </a>
          </div>

          <nav className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-2" aria-label="Footer navigation">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm leading-relaxed text-white/80 hover:text-brand-amber">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/15 pt-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {brand.name}. Nationwide eldercare navigation in the Netherlands.</p>
          <p>{isPrelaunch ? "Pre-launch — guided intake opening soon" : "For families, seniors, and care providers."}</p>
        </div>
      </div>
    </footer>
  );
}
