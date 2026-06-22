## Context

Pagina `/chapter/ch2/theory` există deja și se randează prin `ChapterTheoryPage.tsx`, citind din `src/data/chapterTheory.ts`. Capitolul 2 ("Prelucrări Numerice") are deja 5 secțiuni de teorie acolo, dar:

- sunt scurte (asemănătoare unor flashcard-uri),
- acoperă doar lecțiile 1-5 (operații cu cifre, divizori, Euclid, factori primi, conversii),
- nu acoperă conținutul nou din lecțiile 6-9 (oglindit, Armstrong, numere abundente/deficiente, CMMMC, baze 8 și 16, hex/oct).

## Ce voi face

Voi rescrie în întregime intrarea `chapterId: "ch2"` din `src/data/chapterTheory.ts` ca să acopere toate cele 9 lecții, cu același nivel de detaliu, stil și format de cod ca la `ch1` (text + bloc `code`).

## Structura noii teorii pentru ch2 (8 secțiuni)

1. **Operații cu cifrele unui număr** — `% 10`, `// 10`, adăugare cifră la dreapta (`nr*10+c`) și la stânga (`c*10**k + nr`), numărarea cifrelor.
2. **Suma, produsul și oglinditul cifrelor** — pattern-uri clasice, construirea oglinditului pas cu pas.
3. **Numere speciale formate din cifre** — palindrom, Armstrong (ex. 153 = 1³+5³+3³), criteriile de divizibilitate cu 2, 3, 5, 9.
4. **Parcurgerea divizorilor** — `n % d == 0`, optimizarea până la `√n`, perechi `(d, n/d)`, numere prime (definiție + funcția `este_prim` eficientă).
5. **Numere prime, abundente, deficiente, perfecte** — clasificare după suma divizorilor proprii (12 abundent, 8 deficient, 6 perfect).
6. **CMMDC și CMMMC (Euclid)** — variantă cu scăderi și cu împărțiri (`a, b = b, a % b`), formula `cmmmc = a*b // cmmdc`.
7. **Descompunere în factori primi** — algoritm cu `d` crescător, exponenți, teorema fundamentală a aritmeticii.
8. **Sisteme de numerație: baza 2, 8, 16** — conversii manuale (împărțiri repetate cu citirea resturilor de jos în sus, sume de puteri), funcțiile Python `bin`, `oct`, `hex`, `int(s, baza)`, prefixele `0b` / `0o` / `0x`.

Fiecare secțiune va avea:
- `title`
- `content` (explicație în română, cu bullet-uri `•` ca în restul fișierului)
- `code` cu exemplu Python relevant pentru lecțiile din capitol

## Detalii tehnice

- Fișier modificat: doar `src/data/chapterTheory.ts` — înlocuiesc blocul `{ chapterId: "ch2", sections: [...] }` (liniile ~48-75) cu noua versiune.
- Nicio schimbare în `ChapterTheoryPage.tsx`, `courses.ts`, rute sau alte componente — pagina deja funcționează și o citește automat.
- Fără modificări la schemă, nu se ating alte capitole.

## Verificare

După implementare, navighez la `/chapter/ch2/theory` în preview (via Playwright headless) și confirm că se afișează toate cele 8 secțiuni cu cod corect formatat.
