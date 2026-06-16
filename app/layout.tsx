import type { Metadata, Viewport } from "next";
import { DM_Sans, Outfit } from "next/font/google";
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
  description: "Finding the right care together. Nationwide eldercare matching for families, providers, and advisors in the Netherlands."
};

export const viewport: Viewport = {
  themeColor: "#404D3C"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${brandFont.variable} ${bodyFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
