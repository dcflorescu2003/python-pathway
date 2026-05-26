## Problemă

Mesajul „Coduri necunoscute" arată celule complete ca `M61,M62`, `M23,M24,M61,M62` etc. — fiecare „cod necunoscut" e de fapt întreaga celulă `competencies` a unui rând, nesplitată. Înseamnă că pe traseul `CSV → exercises[].competencies → import` rămâne un singur string în loc de array de coduri.

Parser-ul `parseExercisesCSV` are deja split corect pe `/[;,|]/` (testele trec). Totuși, importerul nu validează nimic: dacă vine un singur element care conține separatori, îl trimite mai departe la lookup și DB-ul nu-l găsește.

## Soluție

Adaug un pas defensiv de normalizare în importer + verific încă o dată parser-ul pe fișierul real al utilizatorului.

### Modificări

**`src/components/admin/csvParser.ts`**
- Extrag într-o funcție utilitară `splitCompetencyCodes(raw: string | string[] | undefined): string[]` care:
  - acceptă `string` sau `string[]`,
  - sparge fiecare element pe `/[;,|\s]+/`,
  - face `trim().toUpperCase()`, filtrează gol.
- O folosesc în `rowToExercise` (înlocuind split-ul actual) ca să rămână o singură sursă de adevăr.
- Export `splitCompetencyCodes`.

**`src/components/admin/CsvImporter.tsx`**
- La construirea `rowsWithComp`, în loc de `ex.competencies || []` folosesc `splitCompetencyCodes(ex.competencies)` — astfel orice celulă scăpată nesplitată (de ex. dintr-un parser viitor sau dintr-un build cached) e re-spartă înainte de lookup.

**`src/components/admin/CsvLessonImporter.tsx`**
- Aceeași normalizare ca în `CsvImporter` la linia 129 (`competencies: splitCompetencyCodes(ex.competencies)`).

**`src/components/admin/problemsCsvParser.ts`** (linia 248)
- Înlocuiesc `.split("|")` cu `.split(/[;,|\s]+/)` pentru consistență (problemele acceptau doar `|`).

**`src/components/admin/csvParser.test.ts`**
- Adaug un test direct pe `splitCompetencyCodes` cu input `"M61,M62"` (cell nesplit), `["M61,M62"]`, `"M61|M62;M63"`, `["M61", "M62,M63"]` — toate produc `["M61", "M62", "M63"]` corespunzător.

### De ce este sigur

- Schimbarea afectează doar pipeline-ul de import CSV (admin), nu și rularea/scoringul.
- Codurile valide (`M1`, `M91`, etc.) nu conțin niciodată virgule/punct-virgule/pipe/spații, deci sparging-ul agresiv nu rupe nimic legitim.
- Dacă bug-ul venea dintr-un bundle cached care nu primise fix-ul anterior, normalizarea în importer îl rezolvă oricum.

### Verificare după implementare

1. `bunx vitest run src/components/admin/csvParser.test.ts` — toate testele trec.
2. Re-importez fișierul utilizatorului în „Import exerciții CSV (în lecție existentă)" — toast-ul ar trebui să arate `0 coduri ignorate` sau, dacă rămân coduri necunoscute, să fie coduri individuale (`M999`), nu celule întregi cu virgule.
