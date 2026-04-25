# Plan: CSV exemplu complet + competențe vizibile + fix erori frecvente

## 1. Model CSV complet (toate tipurile de itemi)

Înlocuiesc `getLessonTemplateCSV()` în `src/components/admin/csvParser.ts` cu un exemplu COMPLET care conține câte un rând valid pentru fiecare tip suportat: `card`, `quiz`, `truefalse`, `fill`, `order`, `match`*, `open_answer`, `problem`. Fiecare rând are:

- toate coloanele relevante completate corect,
- comentarii inline (linii prefixate `#` care vor fi ignorate la parsare — adaug suport pentru asta în parser),
- coloana `competencies` populată cu coduri reale (M1, M21, M61, M82, …),
- exemple de blanks cu mai multe variante (`print('Salut')|print("Salut");valoare2`),
- `order` cu `groups` (pentru linii interschimbabile),
- `problem` cu `code_template`, `solution` și `test_cases`.

Apoi:
- adaug în `CsvLessonImporter.tsx` un buton secundar **„Descarcă exemplu complet”** lângă „Vezi microcompetențele”, care livrează acest CSV.
- afișez modelul și sub formă de bloc preformatat scurt în panoul de instrucțiuni (cu scroll), ca utilizatorul să-l vadă fără descărcare.

*Notă: `match` nu e încă în parser — dacă vrei suport, îl adăugăm separat. În exemplu îl includ doar dacă confirmi. Implicit îl exclud.

## 2. Afișarea competențelor detectate

În `CsvLessonImporter.tsx`:
- după parsare, sub bara de sumar, adaug o secțiune compactă **„Competențe detectate în această lecție”** care listează codurile unice agregate (cu count exerciții pentru fiecare cod), ex: `M61 (3) · M21 (2) · M82 (1)`.
- în lista de previzualizare a exercițiilor, badge-urile existente devin clickabile (tooltip cu denumirea microcompetenței, încărcată odată din `microcompetencies`).
- coduri necunoscute (care nu există în DB) primesc badge roșu cu warning tooltip; deja le tratam în toast — acum sunt vizibile și inline înainte de import.
- în mesajul toast de succes adaug rezumat: „X mapări create pentru Y microcompetențe distincte (Z coduri ignorate)”.

## 3. Fix „Erori frecvente în teste” (afișează slug-uri precum `c2-l2-e4`, `sum-two`)

Cauza: în `ClassAnalytics.tsx::frequentErrors`, când `source_type !== "custom"`, fallback-ul folosește `source_id` (slug intern) ca text al întrebării. Pentru itemii din lecții (`exercise`), eval bank (`exercise` în `eval_exercises`) și probleme (`problem`), nu se încarcă textul real.

Fix:
- modific query-ul `analytics-tests` ca după ce am `answers` cu `test_items(source_type, source_id, custom_data)`, să fac un al doilea fetch:
  - `exercises` și `eval_exercises` pentru `source_id`-urile cu `source_type='exercise'` → folosesc `question` sau `statement`.
  - `problems` pentru `source_type='problem'` → folosesc `title` (mai scurt decât description).
- construiesc un map `{source_id → questionText}` și îl folosesc în `frequentErrors` în locul fallback-ului pe `source_id`.
- dacă tot nu se găsește (item șters), afișez `"Item șters"` în loc de slug.
- aplic același tratament în `exportPDF` (`frequentErrors` deja primește textul curățat, deci nu mai e nevoie de modificări acolo).

## Rezumat fișiere modificate
- `src/components/admin/csvParser.ts` — template CSV complet + suport linii comentariu (`#`)
- `src/components/admin/CsvLessonImporter.tsx` — buton „Descarcă exemplu complet”, panou „Competențe detectate”, badge tooltips
- `src/components/teacher/ClassAnalytics.tsx` — îmbogățire `answers` cu textul real al întrebărilor (lecție/eval/problemă)

Confirmă și aplic.
