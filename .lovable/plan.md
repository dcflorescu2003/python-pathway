

## Plan: Generez CSV-ul corect pentru importer-ul „Import CSV exerciții"

### Diagnoză
Există 2 importere în Admin:
1. **`CsvImporter`** (cel din screenshot tău, "Import CSV exerciții") — așteaptă **doar header + rânduri exerciții**, fără `[META]`/`[EXERCISES]`. Tu l-ai folosit pe ăsta.
2. **`CsvLessonImporter`** ("Import lecție") — așteaptă format cu `[META]` + `[EXERCISES]`. Pentru ăsta era CSV-ul meu anterior.

De aceea apare „Tip invalid: undefined" pe toate rândurile — parser-ul a citit `[META]` ca header și restul ca exerciții fără coloana `type`.

### Ce voi livra
Un singur **bloc CSV** (text plain, copy-paste într-un fișier `.csv`) cu **header standard** + 10 rânduri exerciții, gata de importat prin „Import CSV exerciții" din lecția 12 deja creată.

### Format folosit (exact ce așteaptă `CsvImporter`)
Header:
```
type,question,option_a,option_b,option_c,option_d,correct,explanation,code_template,blanks,lines,statement,is_true,groups,solution,test_cases
```

Conținut:
- 1 × **card** (cartonaș teoretic intro)
- 5 × **quiz** (cu opțiuni a-d și `correct`)
- 2 × **truefalse** (cu `statement` + `is_true`)
- 1 × **order** (cu `lines` separate prin `|` — ordinea din CSV = ordinea corectă)
- Tipul **match** îl convertesc într-un quiz, deoarece `CONTENT_TYPES` îl acceptă DAR parser-ul nu generează `pairs` din CSV (am verificat — doar `quiz/truefalse/fill/order/card/open_answer/problem` au logică în `rowToExercise`)

### Reguli aplicate
- Toate textele cu virgule → încadrate cu `"..."`
- Markdown rich text (`**bold**`, liste) păstrat în `question` și `explanation` (le va randa noul `RichContent`)
- Câmpurile irelevante → goale (separator-ele `,,` rămân)
- Pentru `order`: liniile în coloana `lines` separate prin `|`, în ordinea CORECTĂ (parser-ul generează `order: i+1`)

### Livrare
Voi posta CSV-ul într-un bloc ` ```csv ` în chat, gata de copy-paste într-un fișier `.csv` și importat prin butonul „Import CSV" de pe lecția 12. Nu e nevoie de nicio modificare de cod.

