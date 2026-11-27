import { headers } from "next/headers";
import { verifyAccessJwt } from "@/lib/access";

/**
 * Kdo je přihlášený do administrace.
 *  1. Cloudflare Access (cílový stav na produkční doméně): e-mail z ověřeného JWT.
 *  2. Dočasně, dokud Access není (testovací prostředí na workers.dev, kde Access na cestu nejde):
 *     HTTP Basic Auth s heslem ADMIN_PASSWORD; jméno zadané při přihlášení se zapisuje jako autor změn.
 * Bez obojího je administrace zavřená. V `next dev` je přihlášený "dev".
 */
export async function editorFrom(h: Headers): Promise<string | null> {
  if (process.env.NODE_ENV === "development") return "dev";
  const identity = await verifyAccessJwt(h.get("cf-access-jwt-assertion"), {
    teamDomain: process.env.ACCESS_TEAM_DOMAIN,
    aud: process.env.ACCESS_AUD,
  });
  if (identity?.email) return identity.email;

  const password = process.env.ADMIN_PASSWORD;
  const auth = h.get("authorization");
  if (!password || password.length < 12 || !auth?.startsWith("Basic ")) return null;
  let decoded: string;
  try {
    decoded = new TextDecoder().decode(Uint8Array.from(atob(auth.slice(6)), (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
  const i = decoded.indexOf(":");
  if (i === -1 || decoded.slice(i + 1) !== password) return null;
  return decoded.slice(0, i).trim().toLowerCase() || "redakce";
}

/** Pro Server Actions a stránky administrace: vrátí autora, nebo vyhodí chybu. */
export async function requireEditor(): Promise<string> {
  const editor = await editorFrom(await headers());
  if (!editor) throw new Error("Nepřihlášen");
  return editor;
}

export const usesBasicAuth = () => !(process.env.ACCESS_TEAM_DOMAIN && process.env.ACCESS_AUD);
