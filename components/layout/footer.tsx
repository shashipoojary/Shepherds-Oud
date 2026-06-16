import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { brand } from "@/lib/brand";

const links = [
  { label: "Home", href: "/" },
  { label: "Find care", href: "/family/intake" },
  { label: "Join waitlist", href: "/register" },
  { label: "Family registration", href: "/register/family" },
  { label: "Facility registration", href: "/register/facility" },
  { label: "Provider dashboard", href: "/provider" }
];

export function Footer() {
  return (
    <footer className="bg-brand-green-dark text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-start">
          <div>
            <BrandLogo showTagline tone="light" href="/" />
            <p className="mt-4 max-w-sm text-sm leading-[1.7] text-white/80">
              We help families across the Netherlands find suitable eldercare — with guidance, matched providers, and support through each step.
            </p>
            <p className="mt-3 text-sm italic text-brand-amber">{brand.tagline}</p>
            <a href={`mailto:${brand.email}`} className="mt-4 inline-block text-sm font-medium text-white/90 hover:text-brand-amber">
              {brand.email}
            </a>
          </div>

          <nav className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3" aria-label="Footer navigation">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-white/75 hover:text-brand-amber">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/15 pt-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {brand.name}. Nationwide eldercare matching in the Netherlands.</p>
          <p>For families, seniors, and care providers.</p>
        </div>
      </div>
    </footer>
  );
}
