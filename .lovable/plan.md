## Problemă

La import CSV exerciții în **banca de teste** (`eval_exercises`), `exerciseToDbRow` produce un câmp `xp` care nu există în tabela `eval_exercises` → eroare PostgREST: *"Could not find the 'xp' column of 'eval_exercises' in the schema cache"*.

Tabelele `exercises` și `manual_exercises` au `xp`, dar `eval_exercises` nu — XP-ul nu este relevant în banca de teste (scoring-ul se face la nivel de test).

## Soluție

În `src/components/admin/CsvImporter.tsx`, în pasul de curățare a rândurilor (`cleaned = rowsWithComp.map(...)`), pentru ramura `eval_exercises` să eliminăm câmpul `xp` înainte de insert:

```ts
if (targetTable === "eval_exercises") {
  const { xp, ...rest } = r;
  return rest;
}
return r;
```

Restul logicii rămâne neschimbat (parser, mapare competențe, ID-uri etc.). Nu modificăm `csvParser.ts` — `xp` continuă să fie parsat din CSV pentru lecții normale și manual.

## Fișiere afectate

- `src/components/admin/CsvImporter.tsx` — strip `xp` doar pentru `eval_exercises`.