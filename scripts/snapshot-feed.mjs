// Uloží aktuální RSS feed do data/feed.json (záloha, když feed při buildu nejde načíst).
// Spuštění: npm run snapshot
import { writeFile } from "node:fs/promises";
import { parseRss } from "../lib/rss.ts";

const url = process.env.PODCAST_RSS_URL || "https://anchor.fm/s/fa24f0a4/podcast/rss";
const res = await fetch(url);
if (!res.ok) throw new Error(`RSS ${res.status}`);
const episodes = parseRss(await res.text());
if (episodes.length === 0) throw new Error("RSS bez dílů");
await writeFile(new URL("../data/feed.json", import.meta.url), JSON.stringify(episodes, null, 2) + "\n");
console.log(`${episodes.length} dílů, nejnovější: ${episodes[0].title}`);
