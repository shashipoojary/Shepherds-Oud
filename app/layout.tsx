import type { Metadata, Viewport } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import { PrelaunchProvider } from "@/components/layout/prelaunch-context";
import { brand } from "@/lib/config/brand";
import { getIsPrelaunch } from "@/lib/config/prelaunch";
import "./globals.css";

const brandFont = Outfit({
  subsets: ["latin"],
  variable: "--font-brand",
  weight: ["500", "600", "700"]
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"]
});

export const metadata: Metadata = {
  title: "Shepherds Oud",
  description: brand.metaDescription
};

export const viewport: Viewport = {
  themeColor: "#404D3C"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const isPrelaunch = getIsPrelaunch();

  return (
    <html lang="en" className={`${brandFont.variable} ${bodyFont.variable}`}>
      <body>
        <PrelaunchProvider value={isPrelaunch}>{children}</PrelaunchProvider>
      </body>
    </html>
  );
}
