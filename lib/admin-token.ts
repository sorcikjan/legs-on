/**
 * Strojový přístup k /api/admin/* a /api/revalidate (automatizace, krok po nasazení):
 * hlavička `Authorization: Bearer <ADMIN_TOKEN>`. Bez nastaveného ADMIN_TOKEN je vše odmítnuto.
 * Lidé se do administrace přihlašují přes Cloudflare Access (lib/access.ts).
 */
export function hasAdminToken(request: Request) {
  const token = process.env.ADMIN_TOKEN;
  if (!token || token.length < 32) return false;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (given.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

export const unauthorized = () => Response.json({ error: "unauthorized" }, { status: 401 });
