import type { MetadataRoute } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

/** Public marketing and intake only — block staff dashboards, auth, and post-submit pages. */
const DISALLOWED_PATHS = [
  "/admin",
  "/api/",
  "/provider",
  "/login",
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
        allow: ["/", "/family/intake", "/register", "/register/", "/privacy", "/terms"],
        disallow: [...DISALLOWED_PATHS]
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/family/intake", "/register", "/register/", "/privacy", "/terms"],
        disallow: [...DISALLOWED_PATHS]
      }
    ],
    host: appUrl.replace(/^https?:\/\//, "")
  };
}
