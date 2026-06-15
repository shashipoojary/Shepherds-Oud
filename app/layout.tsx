import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shepherds Oud",
  description: "Care matching for families, providers, and admins in the Netherlands."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
