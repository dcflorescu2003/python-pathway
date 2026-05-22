
## Răspuns la întrebarea 2

**Nu, importul CSV nu a fost actualizat** la implementarea anterioară. `problemsCsvParser.ts` și `ProblemsCsvImporter.tsx` suportă în continuare doar formatul vechi:

```
title, description, difficulty, xp_reward, hint, solution, is_premium, test_cases, competencies
```

unde `test_cases` = `input>>output>>hidden;...`.

Pentru probleme „normale" (doar stdin/stdout) nimic nu s-a stricat — sunt 100% backward compatible. Dar **nu poți importa prin CSV** probleme cu fișiere sau cu verificare statică Tkinter. Le poți crea momentan doar din UI-ul de admin.

---

## Plan

### 1) Extind `problemsCsvParser.ts` cu coloane noi (opționale)

Adăugăm 4 coloane noi, toate opționale (rândurile vechi merg neschimbat):

| Coloană | Format | Pentru |
|---|---|---|
| `kind` | `execute` (default) sau `static` | Tip problemă |
| `input_files` | `nume1\|conținut1;;nume2\|conținut2` per caz, cazuri separate prin `;` (același separator ca `test_cases`) | Fișiere scrise în MEMFS înainte de rulare |
| `expected_files` | la fel ca `input_files` | Fișiere comparate după rulare |
| `static_checks` | `descriere>>type>>pattern>>hidden(0/1);...` cu `type ∈ {import, call, regex}` | Doar pentru `kind=static` |

Reguli:
- `\n`, `\t`, `\r` literale rămân escaped ca azi (`unescapeCell`).
- `input_files`/`expected_files` se aliniază cu cazurile din `test_cases` după index (cazul 1 din `test_cases` ↔ cazul 1 din `input_files`). Dacă lipsesc → caz pur stdin/stdout.
- Pentru `kind=static` se ignoră `test_cases`/`input_files`/`expected_files` și se folosește `static_checks`.
- `generateProblemsExportCSV` se extinde simetric ca exportul să fie round-trip.
- Template-ul (`getProblemsTemplateCSV`) primește 2-3 rânduri noi de exemplu.

### 2) Mic update în `ProblemsCsvImporter.tsx`

Doar trecem `kind`, `staticChecks` și fișierele în payload-ul scris în `test_cases` JSONB conform formei deja suportate de `useProblems.ts`:
- `kind=execute` cu fișiere → array de `TestCase` cu `inputFiles`/`expectedFiles`.
- `kind=static` → wrapper `{ kind: "static", staticChecks: [...] }`.

Fără migrații SQL.

### 3) Generez un CSV exemplu complet în `/mnt/documents/`

`probleme_exemplu_import.csv` cu 6 rânduri ce acoperă toate cazurile:

1. **Clasic stdin/stdout** — sumă a două numere (cazuri vizibile + ascunse).
2. **Doar fișiere** — citește din `date.in`, scrie în `date.out` (cap. 4).
3. **Hibrid** — citește din fișier + stdin, scrie în fișier + stdout.
4. **Multi-fișiere** — două fișiere de intrare, un fișier de ieșire.
5. **Premium + hint + competențe** — verifică `is_premium=true`, `hint`, `competencies=CG.1|CS.2.1`.
6. **Static Tkinter** — `kind=static` cu 4 `static_checks` (import tkinter, call `Tk`, regex pe `Button(...text="Click")`, call `mainloop`).

Fiecare rând are comentarii `#` deasupra cu ce demonstrează, exact ca în template-ul actual.

### 4) Fișiere atinse

- `src/components/admin/problemsCsvParser.ts` — parser + export + template.
- `src/components/admin/ProblemsCsvImporter.tsx` — mapare payload nou.
- `/mnt/documents/probleme_exemplu_import.csv` — artifact pentru tine.

Fără edge functions, fără SQL, fără schimbări la UI-ul existent al editorului.
