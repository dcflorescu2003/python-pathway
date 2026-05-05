## Problema

În exercițiile Quiz (și în general în câmpurile rich-text), textul introdus în editorul admin păstrează indentarea Python (vezi imaginea 2: `    print(1)` cu 4 spații). Când userul îl vede (imaginea 1), Markdown colapsează spațiile de la începutul liniilor, așa că apare `print(1)` lipit de margine. Asta strică logica întrebării ("Ce se va afișa?" pentru `if x > 5: print(1)` indentat vs neindentat dă răspunsuri diferite).

## Cauza

`src/components/RichContent.tsx` folosește `ReactMarkdown` cu `remark-breaks`. Markdown-ul standard ignoră spațiile de la începutul liniilor care nu sunt într-un bloc de cod (` ``` `). Editorul admin (`RichTextEditor`) stochează conținutul ca text/markdown simplu, fără să încadreze automat snippet-urile de cod în fence-uri, așa că indentarea se pierde la randare.

## Soluția

Pre-procesare în `RichContent.tsx`: înainte de a trimite textul către `ReactMarkdown`, convertim spațiile de la începutul fiecărei linii în non-breaking spaces (`\u00A0`), DAR doar în afara blocurilor de cod fenced (` ``` `), pentru a nu strica syntax highlighting-ul. În interiorul fence-urilor indentarea se păstrează deja corect.

Algoritm:
1. Spargem textul în segmente alternând „normal" / „fenced code block" detectând liniile care încep cu ``` .
2. Pentru segmentele normale, pe fiecare linie înlocuim leading spaces cu `\u00A0` (păstrând și tab-urile ca 4× NBSP).
3. Pentru segmentele fenced, lăsăm neschimbat.
4. Concatenăm și trimitem rezultatul în `ReactMarkdown`.

Aceasta rezolvă problema în toate locurile care folosesc `RichContent` (Quiz, Fill, TrueFalse, Card, Order, Match, teorie, manual, etc.) fără modificări în editor sau în datele existente.

## Fișier modificat

- `src/components/RichContent.tsx` — adăugat helper `preserveIndentation(text)` și aplicat înainte de randare.

## Notă

Nu modificăm editorul admin — conținutul existent în baza de date va continua să funcționeze, iar indentarea va apărea corect la userul final imediat după deploy.