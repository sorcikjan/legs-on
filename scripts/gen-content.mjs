// Spike: Workers nemají souborový systém, content/*.md se proto vloží do bundlu jako JSON.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const out = {};
for (const dir of ["clanky", "hoste"]) {
  out[dir] = Object.fromEntries(
    readdirSync(`content/${dir}`)
      .filter((f) => f.endsWith(".md"))
      .map((f) => [f, readFileSync(`content/${dir}/${f}`, "utf8")]),
  );
}
writeFileSync("data/content.generated.json", JSON.stringify(out));
console.log("content.generated.json:", Object.values(out).map((d) => Object.keys(d).length));
