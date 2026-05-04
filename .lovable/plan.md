## Problem

La importul CSV de exerciții, vrem ca un singur `|` în câmpurile de conținut text să fie convertit automat în `,` (formatul intern al variantelor alternative). Dar `||` (operator OR Python/JS) trebuie păstrat intact.

Exemple:
- `>|>=` → `>,>=`
- `ana|mimi` → `ana,mimi`
- `x>0 || y>0` → `x>0 || y>0` (neschimbat)

## Changes

### `src/components/admin/csvParser.ts`

1. **Helper nou `convertSinglePipes(s)`** — folosește regex `/(?<!\|)\|(?!\|)/g` ca să înlocuiască doar pipe-urile singulare cu virgulă.

2. **Aplicat doar pe coloane de text**, nu pe cele care folosesc `|` ca separator real (`lines`, `groups`, `test_cases`, `blanks`). Astfel:
   - `question`, `explanation`, `statement`, `option_*`, `code_template`, `solution`, `correct`, `is_true` etc. trec prin `convertSinglePipes`.
   - `lines` și `groups` (split pe `|`) și `test_cases` (`input:output|input:output`) rămân neatinse.
   - `blanks` rămâne neatins în parser pentru că `rowToExercise` deja face split pe `|` și join pe `,` — și acolo regula "doar `|` singur" nu se aplică (utilizatorul scrie deja `>|>=` ca intenție clară de variantă alternativă).

3. **Comentariu actualizat** în `getExercisesTemplateCSV()` ca să menționeze noua regulă.

### Test unitar nou: `src/components/admin/csvParser.test.ts`

Cazuri:
- Quiz cu `option_a = ">|>="` → opțiunea devine `">,>="`
- Quiz cu `question = "x>0 || y>0"` → rămâne `"x>0 || y>0"`
- Card cu `explanation = "ana|mimi"` → devine `"ana,mimi"`
- Order cu `lines = "a|b|c"` → rămâne split corect în 3 linii (regula NU se aplică)
- Problem cu `test_cases = "1:2|3:4"` → rămâne 2 cazuri de test
- Mix: `"a||b|c"` → `"a||b,c"` (||  păstrat, | simplu convertit)

## Files modified

- `src/components/admin/csvParser.ts`
- `src/components/admin/csvParser.test.ts` (nou)

## Out of scope

Nu modific logica de validare runtime (`FillExercise.tsx` deja acceptă `|` și `,` simultan). Modificarea e exclusiv la nivel de import CSV.

Confirmi și aplicăm?