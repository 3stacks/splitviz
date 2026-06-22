import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // splitviz is a fully client-side SPA (no API routes, server actions, or data
  // fetching), so `next build` emits a static `out/` dir that Cloudflare Pages
  // (or any static host) serves directly. See .github/workflows/deploy.yml.
  output: "export",
};

export default nextConfig;
