# Log rozhodnutí

Nejnovější nahoře. Kdo = kdo rozhodl nebo schválil (Jan / tvůrci / společně).

| Datum | Rozhodnutí | Proč | Kdo |
|---|---|---|---|
| 2026-11-26 | Next.js se upgraduje na 16.4.6 a vypne se `cacheComponents`. Pokus (report `docs/tech/SPIKE-CLOUDFLARE.md` na větvi pokusu) potvrdil, že Cloudflare + D1 + okamžité publikování fungují. | OpenNext pro Cloudflare 16.4.3 nepodporuje a `cacheComponents` na workerd vrací 500; upgrade zároveň opravuje známou zranitelnost. | Jan |
| 2026-11-26 | E-shop bude vlastní a jednoduchý, přímo na webu: produkty v administraci, platba QR kódem převodem, bez platební brány. Shoptet ne. Produkty a objednávky se zahrnou do datového modelu hned, staví se po Vánocích. | Jednotky produktů a desítky objednávek ročně: Shoptet by stál víc než zbytek webu (řádově stovky Kč měsíčně) a vypadal by jinak. Na Shoptet se dá přejít, kdyby objem výrazně vzrostl. | Jan |
| 2026-11-26 | Obsah administrace (díly, články a jejich stavy) bude v databázi Cloudflare D1, přihlášení přes Cloudflare Access. Hosté zatím zůstávají jako soubory v repu. Před stavbou ověří Engineering Lead pokusem, že to funguje s Next.js 16. | Standardní redakční chování (změna je vidět hned po kliknutí), růst ke zpravodajskému webu, bez nákladů navíc oproti kalkulaci. | Jan |
| 2026-11-26 | Hosting: Cloudflare (varianta doporučená v kalkulaci). Prototyp na Netlify je smazaný (heslo a noindex v kódu zůstávají pro novou verzi do dne D). | Tvůrcům byla prezentována doporučená varianta; prototyp splnil účel. | Jan |
| 2026-11-26 | Komunikace s tvůrci jde přes stavový dokument „LEGS:ON web – kde jsme teď“ (Claude Doc), odpovědi přes Messenger nebo na callu. | Jedno místo se stavem, otázkami a rozhodnutími. | Jan |
| 2026-11-26 | Web spouští Jan najednou v den D: do té doby skrytý pro roboty i veřejnost, indexace Googlem až od dne D. | Maximální marketingový efekt spuštění, nic nesmí prosáknout předem. | Jan |
| 2026-11-26 | Web spravuje a provozuje Jan. Projekt běží samostatně, odděleně od ostatních Janových projektů. | Jednodušší provoz bez předávky. | Jan |
| 2026-11-26 | Rozpočet drží kalkulace „LEGS:ON web – roční kalkulace nákladů“ (cca 4 100 Kč/rok). Všechny platby jdou z karty, kterou tvůrci vydají jen pro tento účel. | Malý projekt, odhad slíbený tvůrcům se nesmí výrazně minout. | Jan + tvůrci |
| 2026-11-26 | Obsah připravuje web sám, publikuje se po schválení člověkem (human in the loop). Součástí releasu je administrace pro tvůrce, napojená na jejich současné workflow. | Kvalita obsahu bez ruční práce navíc. | Jan + tvůrci |
| 2026-11-26 | E-shop s merchem je fáze 1 po vánočním releasu. Produktově se načrtne hned, právní a účetní rámec se řeší samostatně a pečlivě. | Je to samostatná komplexita, nesmí ohrozit release. | Jan + tvůrci |
| 2026-11-26 | Newsletter je ve vánočním releasu, se zachováním stávajících odběratelů. | Tvůrci na něj kladou velký důraz. | tvůrci |
| 2026-11-26 | Vánoční release (cca měsíc): statické stránky, díly s odkazy na streamy, články, podpůrné stránky (partneři, předplatné), newsletter, administrace. Ostatní se fázuje. | Web jako vánoční dárek posluchačům; pevné základy bez pozdějšího předělávání. | Jan + tvůrci |
| 2026-11-26 | Byznysový cíl: za rok zdvojnásobit předplatitele (z cca 100 na 200). Cíl dosahu: z řádově stovek na tisíce poslechů na díl. | Měřítko úspěchu webu. | Jan + tvůrci |
| 2026-11-26 | Směr na rok: od domova podcastu k CZ/SK cyklistickému zpravodajskému webu, po fázích. Eventy pro komunitu jsou ve výhledu. | Tvůrci s vizí souhlasí, obsah mají, konkurence je malá. | Jan + tvůrci |
| 2026-11-26 | Zakázka na základní verzi webu potvrzena. | Prototyp tvůrci viděli 25. 11. | tvůrci |
| 2026-11-26 | Projekt má vlastní Claude session, paměť a dokumenty, oddělené od nhl-momentum. | Aby si projekty nepletly kontext. | Jan |
| 2026-11-25 | Díly se berou z oficiálního RSS feedu (Spotify for Creators), obnova jednou denně, záloha `data/feed.json`. | Web vždy ukazuje aktuální díly bez ruční práce. | Jan |
| 2026-11-25 | K formátům Rozhovor a Espresso přibyly Příběhy pelotonu a Speciály (filtry archivu) a téma článků Cyklokros. | Odpovídá tomu, co podcast skutečně vydává. | Jan |
| 2026-11-25 | Espresso se na webu uvádí jako páteční. | Všechna Espressa od 2024 vyšla v pátek; návrh uváděl čtvrtek. | Jan |
