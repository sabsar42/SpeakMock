import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer's React reconciler crashes when bundled into the
  // serverless function on Vercel with React 19 (a known upstream issue) —
  // "Cannot read properties of undefined" at render time, reproducible only
  // in production, never in local dev. Marking it external makes Next.js
  // require() it as a real Node module at runtime instead of bundling it.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
