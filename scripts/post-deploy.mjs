// Krok po nasazení (Workers Builds, deploy command): zneplatní cache, aby stránky
// prerenderované při buildu bez D1 nahradila aktuální data. Viz docs/tech/SPIKE-CLOUDFLARE.md.
// Proměnné buildu: ADMIN_TOKEN (stejný jako secret workeru), DEPLOY_URL (výchozí testovací adresa).
import { readFileSync } from "node:fs";
const url = (process.env.DEPLOY_URL ?? "https://legs-on.sorcikjan.workers.dev") + "/api/revalidate";
const token = process.env.ADMIN_TOKEN;
const buildId = readFileSync(".next/BUILD_ID", "utf8").trim();
if (!token) {
  console.error("post-deploy: chybí ADMIN_TOKEN, cache se nezneplatnila (web se srovná do 15 min).");
  process.exit(1);
}
// Nová verze se po deployi chvíli šíří: dokud odpovídá stará (409 / 404), zkoušej znovu.
for (let attempt = 1; attempt <= 36; attempt++) {
  const res = await fetch(url, { method: "POST", headers: { authorization: `Bearer ${token}`, "x-build-id": buildId } }).catch((e) => ({ ok: false, status: String(e) }));
  if (res.ok) {
    console.log("post-deploy: cache zneplatněna", await res.text());
    process.exit(0);
  }
  console.log(`post-deploy: pokus ${attempt} → ${res.status}`);
  await new Promise((r) => setTimeout(r, 5000));
}
console.error("post-deploy: revalidace selhala");
process.exit(1);
