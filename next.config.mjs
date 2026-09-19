import { withAvatarkit } from "@spatius/avatarkit/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-lib's standard-fonts dependency loads its glyph metrics from bundled
  // .compressed.json files via require() at runtime. Bundling pdf-lib into
  // the serverless function risks those data files not being traced/included
  // correctly (the same class of issue @react-pdf/renderer hit) — mark it
  // external so Next.js requires it as a real Node module instead.
  serverExternalPackages: ["pdf-lib", "@pdf-lib/standard-fonts"],
};

// Required by @spatius/avatarkit: without it, Next.js serves the SDK's .wasm
// files with the wrong MIME type and the avatar fails to load. Kept as .mjs
// (not .ts) because @spatius/avatarkit/next has no "require" export condition
// — Next's next.config.ts loader pulls config in via CJS require() and fails
// with ERR_PACKAGE_PATH_NOT_EXPORTED, while the .mjs loader uses a real ESM
// import and resolves it fine.
export default withAvatarkit(nextConfig);
