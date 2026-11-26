import type { MetadataRoute } from "next";
import { SITE_PUBLIC, SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!SITE_PUBLIC) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
