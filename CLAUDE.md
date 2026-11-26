@AGENTS.md

# LEGS:ON – web podcastu

- Zadání projektu: `docs/ZADANI.md` – přečti celé před začátkem práce.
- Vizuální návrhy všech stránek: `design/*.dc.html` (mapování na routy je v zadání). Jsou to přesné předlohy vzhledu a textů, ne kód k převzetí.
- Komunikace s uživatelem a texty na webu jsou česky.
- Hlavní CTA „Předplatit“ vede vždy na `/predplatne`, nikdy přímo na Herohero.

## Zakázka
- Od 26. 11. 2026 je to placená zakázka pro tvůrce (Petr a Honza): základní verze webu. Prototyp běží na https://legs-on.netlify.app.
- Produktová vize a principy: `docs/PRODUKT.md`. Rozhodnutí (kdo, kdy, proč): `docs/ROZHODNUTI.md`. Otázky na tvůrce: `docs/OTEVRENE.md`. Po každém rozhodnutí nebo zodpovězené otázce je aktualizuj.
- Práce mimo dohodnutý rozsah: označ ji dřív, než se udělá, a zapiš do `docs/ROZHODNUTI.md`, kdo ji schválil.

## Data a obsah
- Díly: oficiální RSS `https://anchor.fm/s/fa24f0a4/podcast/rss` (Spotify for Creators, ne SoundCloud), obnova jednou denně (`cacheLife("days")`). Záloha `data/feed.json` – obnovit `npm run snapshot`.
- Názvy dílů jsou nepravidelné (parser v `lib/episodes.ts`): `ESPRESSO #97: …`, `#42 LEGS:ON podcast - … | Host`, starší `#16 LEGS:ON podcast - Jméno`, `#LEGS:ON ESPRESSO - Jméno` (2021, bez čísla), `PŘÍBĚHY PELOTONU #6: …`, `… | Tour de France s Michalem Schlegelem`, `#37 … - SPECIÁL …`. Rozhovor #28 existuje dvakrát (Schlegel, Fabián).
- Co ve feedu není (fotka bez textu, host, kapitoly, přepis): `data/episodes.ts`, párování podle začátku názvu.
- Datum dílu počítat v Europe/Prague (vychází kolem půlnoci UTC). Espresso vychází v pátek.
- Obálky z feedu mají v sobě text – na velké plochy jen výřezy bez textu v `public/images/`.

## Nasazení
- Push na `main` = deploy na Netlify. Pushuj v dávkách. Ověř, jestli účet nesdílí kredity s jiným projektem, a ověř stav kreditů před pushem.
- Next.js 16.4.3 má známé zranitelnosti (`npm audit`, oprava 16.4.6) – upgrade čeká na rozhodnutí.
