import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-lib's standard-fonts dependency loads its glyph metrics from bundled
  // .compressed.json files via require() at runtime. Bundling pdf-lib into
  // the serverless function risks those data files not being traced/included
  // correctly (the same class of issue @react-pdf/renderer hit) — mark it
  // external so Next.js requires it as a real Node module instead.
  serverExternalPackages: ["pdf-lib", "@pdf-lib/standard-fonts"],
};

export default nextConfig;
