import type { MetadataRoute } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://shepherds-oud.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/family/intake", "/register", "/register/"],
      disallow: [
        "/admin",
        "/api/",
        "/provider",
        "/login",
        "/family/dashboard",
        "/family/results",
        "/family/success",
        "/register/success"
      ]
    },
    host: appUrl.replace(/^https?:\/\//, "")
  };
}
