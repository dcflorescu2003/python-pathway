

## Plan: Rich text pentru întrebări, cartonașe, explicații + cod Python

### Ce devine rich text și cum

Convertesc câmpurile relevante din `<Textarea>` simplu în **editor rich-text bazat pe Markdown** (extind `MarkdownEditor` existent). Markdown e perfect pentru cazul tău: păstrează rândurile, are bold, culori (prin `<span>` HTML), iar pentru cod folosim ` ``` ` (block) sau `` ` `` (inline). În plus, pentru cod Python adaug suport special pentru paste din PyCharm: păstrează indentarea + syntax highlighting la randare.

### Câmpuri afectate

| Câmp | Înainte | După |
|---|---|---|
| **Întrebare** (toate tipurile) | Textarea | RichTextEditor |
| **Cartonaș – titlu** (`question` la card) | Textarea | RichTextEditor (compact, 1 rând) |
| **Cartonaș – conținut** (`explanation` la card) | MarkdownEditor (deja există) | RichTextEditor extins |
| **Explicație post-răspuns** (toate celelalte tipuri) | Textarea | RichTextEditor |
| **Afirmație** (truefalse `statement`) | Textarea | RichTextEditor |
| **Cod Python** (`codeTemplate` la card / problem / fill) | Textarea simplă | **CodeBlockEditor** nou (păstrează indentare la paste, syntax highlighting în preview) |

Câmpuri care **rămân plain** (n-are sens rich text): opțiuni quiz (`option_a-d`), perechi match (`left/right`), linii order, blanks, test cases, hint, solution.

### Componente noi / extinse

#### 1. `RichTextEditor.tsx` (extins din `MarkdownEditor`)
Toolbar îmbogățit:
- **Bold** (`**text**`)
- **Italic** (`*text*`)
- **Listă** (`- item`)
- **Linie nouă** / **Paragraf**
- **Cod inline** (`` `cod` ``)
- **Bloc cod Python** (` ```python ... ``` `)
- **Culoare text** (5 culori, deja există)
- **Preview** toggle

**Paste smart din Word**: handler `onPaste` care detectează HTML din clipboard (Word pune `text/html`) și-l convertește la Markdown folosind `turndown` (lib mică, ~10kb). Astfel bold/italic/liste/culori se păstrează automat fără ca profesorul să apese butoane.

#### 2. `CodeBlockEditor.tsx` (nou, pentru câmpurile cod)
- Textarea cu `font-mono`, tab = 4 spații (deja avem pattern-ul în `CodeEditor.tsx`).
- **Paste smart din PyCharm**: detectează dacă paste-ul vine cu indentare (tab-uri sau spații consistente) și o normalizează la 4 spații. Elimină prefixul comun de indentare dacă tot blocul e indentat.
- Preview opțional cu **syntax highlighting Python** folosind `react-syntax-highlighter` (deja folosit indirect prin `prismjs` patterns sau adăugat ca dep nouă, ~30kb).

### Randare în lecții (consum)

Toate componentele de exerciții (`QuizExercise`, `FillExercise`, `OrderExercise`, `TrueFalseExercise`, `MatchExercise`, `ProblemExercise`, `CardExercise`) trebuie să randeze câmpurile rich-text **prin `<ReactMarkdown>`** în loc de text simplu, cu plugin `rehype-raw` ca să accepte `<span style="color">` din Word.

Și feedback-ul „💡 explicație” din `LessonPage`, `ManualLessonPage`, `SkipChallengePage` la fel.

Pentru blocurile de cod Python, ReactMarkdown va folosi `react-syntax-highlighter` ca renderer custom pentru ` ```python ``` `.

### Compatibilitate cu conținutul existent

Markdown pur text rămâne text — toate exercițiile vechi continuă să funcționeze identic. Schimbarea e aditivă: ce-i text simplu se afișează la fel, ce-i Markdown se randează frumos.

### Dependențe noi
- `turndown` (~10kb) — HTML → Markdown la paste din Word
- `rehype-raw` (~5kb) — permite `<span style>` în ReactMarkdown
- `react-syntax-highlighter` (~80kb gzipped, lazy-loaded doar unde e nevoie) — colorare Python

### Fișiere

| Fișier | Schimbare |
|---|---|
| `src/components/admin/RichTextEditor.tsx` | **NOU** — editor extins cu toolbar complet + paste-from-Word |
| `src/components/admin/CodeBlockEditor.tsx` | **NOU** — editor cod cu paste-from-PyCharm + highlight |
| `src/components/admin/MarkdownEditor.tsx` | Devine alias către `RichTextEditor` (back-compat) |
| `src/components/admin/ExerciseEditor.tsx` | Înlocuiesc Textarea pe câmpurile: question, statement, explanation, codeTemplate (la card/problem/fill) |
| `src/components/admin/EvalBankEditor.tsx` | Aceleași înlocuiri (dacă există câmpurile) |
| `src/components/admin/PredefinedTestEditor.tsx` | Aceleași înlocuiri (dacă există câmpurile) |
| `src/components/exercises/QuizExercise.tsx` | Randez `question` prin ReactMarkdown |
| `src/components/exercises/FillExercise.tsx` | Idem `question` |
| `src/components/exercises/OrderExercise.tsx` | Idem `question` |
| `src/components/exercises/TrueFalseExercise.tsx` | Idem `question` + `statement` |
| `src/components/exercises/MatchExercise.tsx` | Idem `question` |
| `src/components/exercises/ProblemExercise.tsx` | Idem `question` + `explanation` (înlocuiesc split-ul manual pe `\n`) |
| `src/components/exercises/CardExercise.tsx` | Titlul `question` și codul cu syntax highlighting |
| `src/pages/LessonPage.tsx` | Feedback `lastExplanation` randat ca Markdown |
| `src/pages/ManualLessonPage.tsx` | Idem |
| `src/pages/SkipChallengePage.tsx` | Idem |

### Ce funcționează după implementare
- ✅ Copy-paste din Word: bold, italic, liste, culori, paragrafe — păstrate automat
- ✅ Copy-paste din PyCharm: indentare păstrată, fără tab/space mixt, highlighting Python la afișare
- ✅ Toolbar manual pentru când scrii direct (Bold, italic, listă, culoare, cod)
- ✅ Preview live ca să vezi cum apare în lecție
- ✅ Conținutul vechi (text simplu) continuă să funcționeze fără migrare

