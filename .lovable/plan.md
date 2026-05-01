# Suport `|` ca separator de variante în import CSV (fill)

## Problema
La importul CSV, exercițiile de tip `fill` acceptă blanks separate prin `;` (când ai mai multe spații goale), dar **nu** acceptă variante alternative pentru același blank. Runtime-ul (`FillExercise.tsx`) acceptă deja variante separate prin `,` în câmpul `answer`, dar parserul CSV nu convertește nimic din `|` → `,`.

Exemplul din captură: `x + 1 | x+1` ar trebui să devină 2 răspunsuri corecte pentru același blank.

## Soluția
Un singur fix punctual în `src/components/admin/csvParser.ts`, în `rowToExercise`, case `"fill"`:

```ts
ex.blanks = blanksStr.split(";").map((b, i) => ({
  id: `b${i + 1}`,
  // Convert `|` (alternative variants) to `,` — runtime FillExercise
  // splits by `,` and accepts any variant.
  answer: b.split("|").map(a => a.trim()).filter(Boolean).join(","),
}));
```

Convenții rezultate:
- `;` separă blank-urile diferite (când `code_template` are mai multe `___`)
- `|` separă variantele alternative pentru **același** blank
- `,` rămâne formatul intern stocat în DB (FillExercise îl știe deja)

Exemplu CSV:
```
fill,"...","...","...","l.___(5)",append|adauga,...
```
→ un blank, două variante acceptate: `append` și `adauga`.

```
fill,"...","...","...","print(___, ___)",x+1|x + 1;y|y_val,...
```
→ două blank-uri; primul acceptă `x+1` sau `x + 1`, al doilea acceptă `y` sau `y_val`.

## Verificări secundare
- `generateExportCSV` (linia 343) face `ex.blanks.map(b => b.answer).join(";")`. Dacă un `b.answer` conține deja `,` (variante), exportul îl va salva tot cu `,`. Pentru round-trip curat, vom înlocui `,` → `|` la export, ca să refolosim convenția nouă: `r.blanks = ex.blanks.map(b => (b.answer || "").split(",").map(a => a.trim()).join("|")).join(";")`.
- Texte de ajutor:
  - `CsvImporter.tsx` linia 246: actualizez să menționeze `|` pentru variante.
  - În template-uri (`getExercisesTemplateCSV`, `getContentLessonTemplateCSV`) comentariul existent menționează deja `|` pentru variante (linia 405-406), dar exemplul real nu îl folosește — îl las ca este, comentariul e suficient.

## Fișiere modificate
- `src/components/admin/csvParser.ts` — parser fill + export
- `src/components/admin/CsvImporter.tsx` — text ajutor în dialog
