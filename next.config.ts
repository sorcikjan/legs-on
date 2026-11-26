import type { NextConfig } from "next";

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
