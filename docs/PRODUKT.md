# LEGS:ON web – produktová vize

Živý dokument. Mění se jen po dohodě; každá změna má záznam v `ROZHODNUTI.md`.
Značení: **[rozhodnuto]** = dohodnuto s tvůrci nebo Janem, **[návrh]** = čeká na rozhodnutí.

## Proč web existuje
Podcast má 157 dílů (11/2026) rozházených po platformách, ale žádné místo, které by bylo jeho. Na web legson.cz sám nepřijde nikdo, kdo název nezná. Proto má web dvě vrstvy:
1. **Domov podcastu:** „tady jsme, tady si nás pusť, tady si nás předplať.“
2. **Akvizice:** psaný obsah (články) přivádí z Googlu a Google Discover lidi, kteří LEGS:ON neznají. Ti si pustí díl a předplatí si ho.

Detailní cíle a požadavky prototypu: `ZADANI.md`.

## Pro koho
1. **Stálý posluchač:** nový díl, archiv, hosté, newsletter.
2. **Cyklista z Googlu:** hledá téma, jezdce nebo závod. Vstupuje přes článek, profil hosta nebo díl.
3. **Partner:** značka nebo obchod, který zvažuje spolupráci.
4. **Tvůrci jako správci obsahu (Petr a Honza):** v administraci schvalují, co web sám připravil.

## Hlavní tok
Google / Discover → článek → přehrát díl → `/predplatne` → Herohero.

## Pravidla, která platí
- Každé „Předplatit“ vede na `/predplatne`. Na Herohero se odchází jen odtud a s UTM.
- **Člověk schvaluje, stroj připravuje (human in the loop):** web si nový díl sám načte a připraví. Obsah, který tvůrci předtím nenapsali ani neschválili, se nepublikuje bez jejich souhlasu.
- Navazuje se na workflow tvůrců (natočí → jeden stříhá → druhý nahraje na platformy → grafička dělá náhledy). Web od nich nic navíc nevyžaduje a nevyžaduje nic ani od grafičky.
- Archiv se nemaže: díly od roku 2021 jsou hodnota webu i pro SEO. Slugy existujících stránek se nemění.
- Desktop zachovává pořadí čtení z mobilu.
- **Náklady drží kalkulace** („LEGS:ON web – roční kalkulace nákladů“ na Claudu, cca 4 100 Kč/rok v doporučené variantě). Nová placená služba se přidává jen se záznamem v `ROZHODNUTI.md`.
- **Testovací prostředí bez hesla, ale neindexované.** Do přesunu na produkci web nevidí vyhledávače (noindex); adresu lze sdílet ke kontrole. Na produkci se nejdřív pustí indexace, komunikace až v den D.

## Díl vs. článek: hranice
- **Detail dílu:** strohá stránka. „Tady je díl, pusť si ho“ + krátký perex z popisu, který tvůrci napsali pro streamy, + přehrávač, odkazy na platformy a CTA na předplatné. **[návrh]** Díl se publikuje automaticky hned po načtení z RSS, protože jeho text už tvůrci schválili při vydání.
- **Článek:** delší čtení k tématu, které díl jen nakousne (rozhovor s cyklistou, rozbor závodu, glosa). Je to hlavní nástroj SEO a Discoveru. Vzniká z přepisu jako koncept a publikuje se jen po schválení.

## Dlouhodobá vize (rok)
Web roste od domova podcastu k **českému a slovenskému cyklistickému zpravodajskému webu** postavenému na obsahu, který kluci už vytvářejí. Konkurence v CZ/SK je malá. Fázuje se tak, aby provoz zvládli při svém čase:
1. **Vánoční release (den D):** domov podcastu, články, newsletter, administrace.
2. **Fáze 1, navazující:** e-shop s merchem. Je vlastní a jednoduchý: produkty v administraci, platba QR kódem, bez platební brány.
3. **Další fáze:** pravidelné články navázané na páteční Espresso (víc článků týdně, rozpracování témat, výsledky, glosy), partnerský program s daty, eventy pro komunitu a předplatitele (live rozhovory, vyjížďky, konference; zatím nekonkrétní), případně placená propagace článků.

Tempo psaní určí čas tvůrců, ne technika.

## Jak poznáme úspěch
- **Byznysový cíl [rozhodnuto]:** za rok zdvojnásobit předplatitele na Herohero, ze cca 100 na 200.
- **Cíl dosahu:** z řádově stovek poslechů na díl na tisíce.
- **[návrh] Průběžné metriky (měsíčně):** návštěvy z vyhledávání a Discoveru, přehrání na webu, prokliky na `/predplatne` a na Herohero, odběratelé newsletteru, poptávky partnerů. Výchozí stav změřit v den D.

## Rozsah: vánoční release
**[rozhodnuto]** Termín: do Vánoc 2026, zhruba měsíc. Základy musí být pevné, aby se nemuselo složitě předělávat.

Patří do něj:
- Statické stránky: O nás, Pro partnery, Předplatné, odkazy na platformy.
- Díly s odkazy na streamy a přehrávačem.
- Články.
- **Newsletter:** napojený na skutečnou službu, se zachováním stávajících odběratelů.
- **Administrace (redakční systém):** po nahrání dílu na platformy si web díl načte, analyzuje a připraví díl i článek ke schválení. Musí být postavená tak, aby se dala rozšiřovat (víc článků, e-shop, eventy).
- Testovací prostředí neindexované (noindex), produkce se nechá indexovat s předstihem, komunikace v den D.

**Mimo vánoční release:** e-shop (fáze 1; produkty a objednávky jsou ale v datovém modelu od začátku), eventy, zpravodajský provoz s více články týdně, partnerský program s daty, reklama.

## K probrání
- **Vizuál, nebo text?** Podcastová část (díly, hosté, homepage) staví na vizuálu a Antonu. Článková část je text a je hlavním zdrojem návštěv z vyhledávání. Kde přesně vede hranice, třeba u statistik pro partnery?
- **Čísla s kontextem?** Kde web ukazuje čísla (počty dílů, poslechy, statistiky pro partnery), mají mít srovnání nebo vývoj?
