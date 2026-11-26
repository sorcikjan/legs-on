// Test ověření Access JWT s vlastním klíčem a falešným JWKS. Spuštění: npm run test:access
import { generateKeyPairSync, createSign } from "node:crypto";
import { verifyAccessJwt, __resetAccessCacheForTests } from "../lib/access.ts";

const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "k1" };
const TEAM = "legson.cloudflareaccess.com";
const AUD = "aud-123";
const b = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
function sign(payload, header = { alg: "RS256", kid: "k1" }, key = privateKey) {
  const data = `${b(header)}.${b(payload)}`;
  const sig = createSign("RSA-SHA256").update(data).sign(key).toString("base64url");
  return `${data}.${sig}`;
}
const fakeFetch = async () => new Response(JSON.stringify({ keys: [jwk] }));
const now = Math.floor(Date.now() / 1000);
const good = { aud: [AUD], iss: `https://${TEAM}`, exp: now + 60, email: "jan@example.com" };
const env = { teamDomain: TEAM, aud: AUD };

const other = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
const cases = [
  ["platný token", sign(good), env, "jan@example.com"],
  ["prošlý token", sign({ ...good, exp: now - 1 }), env, null],
  ["cizí AUD", sign({ ...good, aud: ["jina"] }), env, null],
  ["cizí issuer", sign({ ...good, iss: "https://evil.example" }), env, null],
  ["podpis cizím klíčem", sign(good, undefined, other), env, null],
  ["neznámé kid", sign(good, { alg: "RS256", kid: "x" }), env, null],
  ["alg none", `${b({ alg: "none" })}.${b(good)}.`, env, null],
  ["bez tokenu", undefined, env, null],
  ["bez konfigurace (zavřeno)", sign(good), {}, null],
];
let fail = 0;
for (const [name, token, e, expected] of cases) {
  __resetAccessCacheForTests();
  const r = await verifyAccessJwt(token, e, fakeFetch);
  const ok = (r?.email ?? null) === expected;
  if (!ok) fail++;
  console.log(ok ? "OK  " : "FAIL", name);
}
process.exit(fail ? 1 : 0);
