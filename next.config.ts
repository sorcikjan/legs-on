import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

// `next dev` dostane bindingy z wrangler.jsonc (lokální D1 v .wrangler/state).
initOpenNextCloudflareForDev();

// ID buildu: krok po nasazení podle něj pozná, že už odpovídá nová verze (scripts/post-deploy.mjs).
const BUILD_ID = process.env.WORKERS_CI_BUILD_UUID ?? "local";

const nextConfig: NextConfig = {
  generateBuildId: async () => BUILD_ID,
  env: { APP_BUILD_ID: BUILD_ID },
  /* config options here */
  images: {
    // Obálky dílů z RSS feedu
    remotePatterns: [{ protocol: "https", hostname: "d3t3ozftmdmh3i.cloudfront.net" }],
  },
  experimental: {
    // Nahrávání fotek v administraci (Server Action); větší originály admin odmítne sám.
    serverActions: { bodySizeLimit: "16mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
