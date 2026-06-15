import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["better-auth"],
  turbopack: {
    root: path.resolve(".")
  }
};

export default nextConfig;
