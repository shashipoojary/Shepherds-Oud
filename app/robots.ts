import type { MetadataRoute } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

/** Public marketing and triage only — block staff dashboards, auth, and private flows. */
const DISALLOWED_PATHS = [
  "/admin",
  "/api/",
  "/provider",
  "/hospital",
  "/login",
  "/dashboard",
  "/patient",
  "/signup",
  "/tasks",
  "/settings",
  "/partner",
  "/family/dashboard",
  "/family/results",
  "/family/success",
  "/register/success"
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/triage", "/directory", "/register", "/register/", "/privacy", "/terms", "/faq", "/how-it-works"],
        disallow: [...DISALLOWED_PATHS]
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/triage", "/directory", "/register", "/register/", "/privacy", "/terms", "/faq", "/how-it-works"],
        disallow: [...DISALLOWED_PATHS]
      }
    ],
    host: appUrl.replace(/^https?:\/\//, "")
  };
}
