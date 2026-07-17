import type { Metadata, Viewport } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { PrelaunchProvider } from "@/components/layout/prelaunch-context";
import { NavigationProgressHost } from "@/components/shared/navigation-progress-host";
import { brand } from "@/lib/config/brand";
import { getIsPrelaunch } from "@/lib/config/prelaunch";
import { getLocale } from "@/lib/i18n/get-locale";
import "./globals.css";

const brandFont = Outfit({
  subsets: ["latin"],
  variable: "--font-brand",
  weight: ["500", "600", "700"],
  display: "swap"
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Shepherds Oud",
  description: brand.metaDescription
};

export const viewport: Viewport = {
  themeColor: "#404D3C"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const isPrelaunch = getIsPrelaunch();
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${brandFont.variable} ${bodyFont.variable}`}>
      <body>
        <NavigationProgressHost />
        <LocaleProvider initialLocale={locale}>
          <PrelaunchProvider value={isPrelaunch}>{children}</PrelaunchProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
