import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

// `next dev` dostane bindingy z wrangler.jsonc (lokální D1 v .wrangler/state).
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // Obálky dílů z RSS feedu
    remotePatterns: [{ protocol: "https", hostname: "d3t3ozftmdmh3i.cloudfront.net" }],
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
