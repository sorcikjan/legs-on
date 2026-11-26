/**
 * Ověření JWT z Cloudflare Access (hlavička Cf-Access-Jwt-Assertion). Bez závislostí, jen Web Crypto.
 * Access aplikaci chrání na hraně, ale origin musí token ověřit sám: workers.dev adresa
 * a případná chyba v pravidlech by jinak vpustily kohokoli.
 * Env: ACCESS_TEAM_DOMAIN (např. legson.cloudflareaccess.com), ACCESS_AUD (AUD tag aplikace).
 */

type Jwk = JsonWebKey & { kid: string };

const b64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const json = (s: string) => JSON.parse(new TextDecoder().decode(b64url(s)));

let certsCache: { at: number; keys: Jwk[] } | undefined;

async function getKeys(teamDomain: string, fetchImpl: typeof fetch): Promise<Jwk[]> {
  if (certsCache && Date.now() - certsCache.at < 10 * 60_000) return certsCache.keys;
  const res = await fetchImpl(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`certs ${res.status}`);
  const { keys } = (await res.json()) as { keys: Jwk[] };
  certsCache = { at: Date.now(), keys };
  return keys;
}

export type AccessIdentity = { email: string };

export async function verifyAccessJwt(
  token: string | null | undefined,
  env: { teamDomain?: string; aud?: string },
  fetchImpl: typeof fetch = fetch,
): Promise<AccessIdentity | null> {
  if (!token || !env.teamDomain || !env.aud) return null;
  const [h, p, s] = token.split(".");
  if (!h || !p || !s) return null;
  try {
    const header = json(h);
    const payload = json(p);
    if (header.alg !== "RS256") return null;
    const jwk = (await getKeys(env.teamDomain, fetchImpl)).find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64url(s), new TextEncoder().encode(`${h}.${p}`));
    if (!ok) return null;
    const aud: string[] = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const now = Date.now() / 1000;
    if (!aud.includes(env.aud) || payload.iss !== `https://${env.teamDomain}` || payload.exp < now) return null;
    return { email: String(payload.email ?? payload.common_name ?? "") }; // service token má common_name místo e-mailu
  } catch {
    return null;
  }
}

export function __resetAccessCacheForTests() {
  certsCache = undefined;
}
