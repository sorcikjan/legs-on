/// <reference types="@cloudflare/workers-types/2023-07-01" />
// Ručně psané typy bindingů z wrangler.jsonc (generovaný `wrangler types` má přes 10 000 řádků).
// D1Database, R2Bucket, Fetcher a ImageBinding jsou globální typy z @cloudflare/workers-types.
interface CloudflareEnv {
  ASSETS: Fetcher;
  DB: D1Database;
  NEXT_TAG_CACHE_D1: D1Database;
  NEXT_INC_CACHE_R2_BUCKET: R2Bucket;
  WORKER_SELF_REFERENCE: Fetcher;
  IMAGES: ImagesBinding;
  SITE_PASSWORD?: string;
  SITE_PUBLIC?: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  ADMIN_TOKEN?: string;
  ADMIN_PASSWORD?: string;
}
