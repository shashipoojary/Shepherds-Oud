import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shepherds Oud",
  description: "Nationwide eldercare matching for families, providers, and advisors in the Netherlands."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
