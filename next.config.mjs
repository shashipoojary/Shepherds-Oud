import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  serverExternalPackages: ["better-auth"],
  images: {
    formats: ["image/avif", "image/webp"]
  },
  turbopack: {
    root: path.resolve(".")
  },
  async redirects() {
    return [
      // Keep old Dutch slugs working after English path normalization.
      { source: "/veelgestelde-vragen", destination: "/faq", permanent: true },
      { source: "/voor-zorgaanbieders", destination: "/for-providers", permanent: true }
    ];
  },
  async headers() {
    const globalHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "X-DNS-Prefetch-Control", value: "on" }
    ];

    const noIndexHeaders = [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" }];

    return [
      {
        source: "/(.*)",
        headers: globalHeaders
      },
      {
        source: "/admin/:path*",
        headers: noIndexHeaders
      },
      {
        source: "/api/:path*",
        headers: noIndexHeaders
      },
      {
        source: "/provider/:path*",
        headers: noIndexHeaders
      },
      {
        source: "/provider",
        headers: noIndexHeaders
      },
      {
        source: "/login/:path*",
        headers: noIndexHeaders
      },
      {
        source: "/login",
        headers: noIndexHeaders
      },
      {
        source: "/family/dashboard",
        headers: noIndexHeaders
      },
      {
        source: "/family/results",
        headers: noIndexHeaders
      },
      {
        source: "/family/success",
        headers: noIndexHeaders
      }
    ];
  }
};

export default nextConfig;
