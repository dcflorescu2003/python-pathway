## Problem

În baza de date, întrebarea are linii separate prin `\n` (verificat cu psql — 154 caractere, primul `\n` la poziția 23). Totuși, în:

- editorul de teste predefinite (Admin)
- preview-ul din `TestBuilder` profesor
- pagina `TakeTestPage` văzută de elev

textul apare pe o singură linie. Toate cele trei locuri folosesc deja `RichContent`, deci problema e în lanțul de randare al `RichContent.tsx` (`react-markdown` + `remark-breaks` + `rehype-raw`): la conținut care nu este Markdown formatat (cod Python liber, fără gard ` ``` `), single-line breaks nu sunt transformate fiabil în `<br>` în toate cazurile (interacțiune între `rehype-raw` și nodurile `break` produse de `remark-breaks`).

## Soluție

Forțăm păstrarea line-break-urilor la nivel de pre-procesare în `RichContent`, în loc să ne bazăm pe `remark-breaks`.

### `src/components/RichContent.tsx`

Modific funcția `preserveIndentation` (sau adaug una nouă `preserveLineBreaks`) care, **în afara blocurilor cu gard ` ``` `**:

1. Normalizează `\r\n` → `\n`.
2. La fiecare linie care nu e ultima dintr-un paragraf și nu e linie goală, adaugă două spații înainte de `\n` (sintaxa Markdown pentru hard break: `"  \n"`). Asta garantează că `react-markdown` produce `<br>` indiferent de plugin.
3. Păstrează în continuare conversia spațiilor de la început în NBSP (există deja).

Rezultat: chiar și fără `remark-breaks`, fiecare `\n` din text → break vizibil.

### Verificare după implementare

- Reîncarc pagina `/test/...` cu testul predefinit; întrebarea cu `for i in range(1, 6)` trebuie să apară pe mai multe rânduri, cu indentare păstrată.
- Verific că în `TestBuilder` preview-ul afișează aceeași formatare.
- Verific că în `PredefinedTestEditor` (Admin) textul în preview e formatat corect.
- Verific că fișierele cu blocuri ` ```python ` continuă să randeze corect (nu adăugăm hard breaks în interiorul fence-urilor).
- Verific că exercițiile existente din lecții (care folosesc `RichContent inline`) nu se strică — `inline` păstrează comportamentul curent (`prose-p:inline`).

## Detalii tehnice

```ts
const preserveFormatting = (raw: string): string => {
  const NBSP = "\u00A0";
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  let inFence = false;
  return lines
    .map((line, i) => {
      if (/^\s*```/.test(line)) { inFence = !inFence; return line; }
      if (inFence) return line;
      // Convert leading spaces to NBSP
      const withIndent = line.replace(/^[ \t]+/, (lead) =>
        lead.replace(/\t/g, "    ").replace(/ /g, NBSP)
      );
      // Force hard break: append two spaces if next line exists and isn't blank
      const next = lines[i + 1];
      if (next !== undefined && next.trim() !== "" && withIndent.trim() !== "") {
        return withIndent + "  ";
      }
      return withIndent;
    })
    .join("\n");
};
```

Nu sunt necesare modificări de date sau migrații — fix curat doar în componenta de randare.
