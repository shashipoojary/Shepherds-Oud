import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";
import { brand, brandPhoneLabel, brandRegionNote, brandRegionPrimary } from "@/lib/config/brand";
import { legalFooterLinks } from "@/lib/config/legal";
import { getIsPrelaunch, getPublicRoutes } from "@/lib/config/prelaunch";
import { getLocale } from "@/lib/i18n/get-locale";
import { productUi } from "@/lib/i18n/ui";
import type { Locale } from "@/lib/i18n/config";

function footerLinks(prelaunch: boolean, locale: Locale) {
  const publicRoutes = getPublicRoutes(prelaunch);
  const nav = productUi(locale).nav;

  return prelaunch
    ? [
        { label: nav.home, href: publicRoutes.home },
        { label: nav.waitlist, href: publicRoutes.waitlist },
        { label: nav.forFamilies, href: publicRoutes.waitlistFamily },
        { label: nav.forProviders, href: "/for-providers" },
        { label: nav.faq, href: "/faq" },
        { label: nav.forInternationals, href: "/internationals" },
        { label: nav.contact, href: "/contact" }
      ]
    : [
        { label: nav.home, href: publicRoutes.home },
        { label: nav.howItWorks, href: "/how-it-works" },
        { label: nav.about, href: "/about" },
        { label: nav.faq, href: "/faq" },
        { label: nav.contact, href: "/contact" },
        { label: nav.startIntake, href: publicRoutes.intake },
        { label: nav.forProviders, href: "/for-providers" },
        { label: nav.forInternationals, href: "/internationals" }
      ];
}

export async function Footer() {
  const isPrelaunch = getIsPrelaunch();
  const locale = await getLocale();
  const ui = productUi(locale);
  const links = footerLinks(isPrelaunch, locale);
  const phoneHref = brand.phone ? `tel:${brand.phone.replace(/\s+/g, "")}` : null;

  return (
    <footer className="bg-brand-green-dark text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_0.8fr] md:items-start">
          <div>
            <BrandLogo variant="footer" showTagline tone="light" href="/" />
            <p className="mt-4 max-w-sm text-sm leading-[1.7] text-white/80">
              {isPrelaunch
                ? ui.footer.prelaunchBlurb(brandRegionNote(locale))
                : ui.footer.liveBlurb(brandRegionPrimary(locale))}
            </p>
            <a href={`mailto:${brand.email}`} className="mt-4 inline-block text-sm font-medium text-white/90 hover:text-brand-amber">
              {brand.email}
            </a>
            {phoneHref ? (
              <a href={phoneHref} className="mt-2 block text-sm font-medium text-white/90 hover:text-brand-amber">
                {brandPhoneLabel(locale)}: {brand.phone}
              </a>
            ) : null}
          </div>

          <nav className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-2" aria-label={ui.footer.navAria}>
            {links.map((link) => (
              <Link key={`${link.href}-${link.label}`} href={link.href} className="text-sm leading-relaxed text-white/80 hover:text-brand-amber">
                {link.label}
              </Link>
            ))}
          </nav>

          <nav className="grid gap-3" aria-label={ui.footer.legalAria}>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">{ui.footer.legal}</p>
            {legalFooterLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm leading-relaxed text-white/80 hover:text-brand-amber">
                {ui.footer.legalLabel(link.href, link.label)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/15 pt-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.name}. {ui.footer.copyrightSuffix}
          </p>
          <p>{isPrelaunch ? ui.footer.prelaunchStatus : ui.footer.liveStatus}</p>
        </div>
      </div>
    </footer>
  );
}
