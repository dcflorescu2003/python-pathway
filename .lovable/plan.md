
## Obiectiv

Adăugare buton **Import CSV** și **Export CSV** pentru probleme, similar cu cel de la exerciții, cu suport pentru import per-capitol. Editorul rich text + preview există deja în formularul de problemă (RichTextEditor pe Descriere și Hint).

## Format CSV propus

Coloane (separator detectat automat `,` sau `;`):

```
title, description, difficulty, xp_reward, hint, solution, is_premium, test_cases, competencies
```

- `title` (obligatoriu)
- `description` (Markdown — bold, culori HTML, etc.)
- `difficulty` — `ușor` | `mediu` | `greu` (default `ușor`)
- `xp_reward` — număr (default 10)
- `hint` — text/markdown (opțional)
- `solution` — cod Python (opțional, multi-linie cu ghilimele duble)
- `is_premium` — `true`/`false` (default false)
- `test_cases` — format compact: `input1>>output1>>0;input2>>output2>>1` 
  - `>>` separă input/output/hidden(0/1) într-un caz
  - `;` separă cazurile
  - input multi-valoare: `\n` literal (ex: `5\n10>>15>>0`)
- `competencies` — coduri CG/CS/M separate prin `|` (opțional, ex: `CG.1|CS.2.1`)

ID-urile se generează automat folosind prefixul capitolului existent (`rec`, `pr`, `lst`, `gs`, `sub`, `fis`) — următor după ultimul existent.

## Modificări

### 1. `src/components/admin/problemsCsvParser.ts` (nou)
- `parseProblemsCSV(text)` → `{ problems: ParsedProblem[], errors: string[] }`
- `problemToDbRow(p, chapterId, sortOrder, id)` → row pentru `problems`
- `generateProblemsExportCSV(problems[])` → text CSV
- `getProblemsTemplateCSV()` → template descărcabil cu 2 exemple
- Reutilizează helper-ele `splitLogicalLines`, `parseCSVLine`, `detectSeparator` din `csvParser.ts` (le exportăm acolo dacă nu sunt deja).

### 2. `src/components/admin/ProblemsCsvImporter.tsx` (nou)
- Componentă similară cu `CsvImporter.tsx`, dar:
  - target table = `problems`
  - primește `chapterId`, `existingProblemIds`, `existingProblemsCount`, `existingProblems` (pentru export), `onSuccess`
  - generează ID-uri secvențiale folosind `generateProblemId` (deja exportat din ProblemsEditor — îl mutăm într-un helper sau îl re-exportăm)
  - mapează `competencies` → `item_competencies` cu `item_type='problem'` (logica copiată din `CsvImporter.tsx`)
  - butoane: **Import CSV** + **Export** (apare dacă există probleme în capitol)

### 3. `src/components/admin/ProblemsEditor.tsx`
- În header-ul fiecărui capitol, lângă butonul "Adaugă problemă", adăugăm `<ProblemsCsvImporter chapterId={ch.id} ... onSuccess={invalidate} />`.
- Extragere `generateProblemId` / `getChapterPrefix` în `src/components/admin/problemIds.ts` (mic helper, reutilizat în importer).
- Fără alte schimbări la formular — RichTextEditor cu preview există deja.

### 4. Nimic la backend
- Tabelul `problems` are deja toate coloanele necesare.
- RLS permite admin INSERT.
- `item_competencies` are deja policy admin INSERT.

## UX

În fiecare capitol expandat, linia de butoane devine:
```
[+ Adaugă problemă]   [⬆ Import CSV]   [⬇ Export]
```

Dialog-ul de import arată:
- Buton "Alege fișier CSV"
- Preview cu lista problemelor parse-uite (titlu, dificultate, nr. test cases, competențe)
- Erori per-rând cu icon roșu
- Buton final "Importă N probleme"
- Link "Descarcă template" în footer

## Note tehnice

- Pentru `test_cases` cu newline-uri în input, parser-ul transformă `\n` literal (4 caractere) în newline real.
- `solution` poate fi multi-linie dacă e încadrat în `"..."` — `splitLogicalLines` deja respectă quotes.
- Validări: titlu obligatoriu, difficulty în set valid, xp_reward număr valid; altfel rândul primește `error`.
- Codurile de competențe necunoscute → toast warning (la fel ca la exerciții).

## Out of scope

- Modificări la editorul rich text (există deja Bold/Italic/Listă/Cod/Culori/Preview).
- Schimbări de schemă DB.
