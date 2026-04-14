

## Plan: Import CSV pentru exerciții și lecții

### Funcționalitate

Se adaugă import CSV în două locuri din panoul de administrare:

1. **ContentEditor (Lecții)** — buton „Importă CSV" pe fiecare lecție existentă → adaugă exerciții la lecția respectivă (fără a le înlocui pe cele existente)
2. **ContentEditor (Capitol)** — buton „Importă lecție din CSV" pe fiecare capitol → creează o lecție nouă cu titlu + exerciții din CSV
3. **EvalBankEditor (Bancă Evaluare)** — același mecanism pe lecțiile din bancă

### Format CSV propus

**CSV exerciții** (import pe lecție existentă):
```
type,question,option_a,option_b,option_c,option_d,correct,explanation,code_template,blanks,lines,statement,is_true,groups
quiz,Ce returnează len([1 2 3])?,1,2,3,4,c,len() returnează nr de elemente,,,,,,
truefalse,,,,,,,Python e compilat,,,,False,,
fill,Completează codul:,,,,,,,x = ___,answer1|answer2,,,,
order,Ordonează liniile:,,,,,,,,,"for i in range(3)|  print(i)|print('gata')",,,"1|1|2"
card,**Teoria:**\nListele sunt mutabile,,,,,,,,,,,,
open_answer,Explică diferența dintre liste și tupluri,,,,,,,,,,,,
```

Reguli:
- Separator: virgulă (CSV standard), cu ghilimele pentru valori cu virgulă
- **quiz**: `option_a..d` + `correct` (a/b/c/d)
- **truefalse**: `statement` + `is_true` (True/False)
- **fill**: `code_template` (cu `___` pentru spații) + `blanks` (variante separate prin `|`, blank-uri separate prin `;`)
- **order**: `lines` separate prin `|` + `groups` opțional (numere separate prin `|`)
- **card**: doar `question` (suport Markdown)
- **open_answer**: doar `question`
- **problem**: `question` + `code_template` + `solution` (în coloane adiționale)
- `explanation` opțional pe toate tipurile
- XP implicit: 5

**CSV lecție completă** (creează lecție + exerciții):
```
[META]
title,Introducere în liste
description,Lecțiile despre liste în Python
xp_reward,20
[EXERCISES]
type,question,option_a,...
quiz,Ce este o listă?,...
```

Prima secțiune `[META]` conține titlul și descrierea lecției, apoi `[EXERCISES]` cu exercițiile în formatul de mai sus.

### Modificări

**1. Componenta nouă `CsvImporter.tsx`** (src/components/admin/)

- Componenta primește props: `targetTable` ("exercises" | "eval_exercises"), `lessonId`, `onSuccess`
- Buton care deschide un dialog cu:
  - Input file `.csv`
  - Preview tabel cu exercițiile parsate
  - Buton „Importă X exerciții"
- Parser CSV cu validare pe tipuri
- La import: calculează `sort_order` pornind de la max-ul existent + 1
- Generează ID-uri unice per exercițiu

**2. Componenta `CsvLessonImporter.tsx`** (src/components/admin/)

- Primește props: `targetTables` (lessons/exercises sau manual), `chapterId`, `onSuccess`
- Parsează formatul cu `[META]` + `[EXERCISES]`
- Creează lecția, apoi inserează exercițiile

**3. `ContentEditor.tsx`**

- Adaugă buton „📥 Importă CSV" pe fiecare lecție (lângă butonul + Exercițiu)
- Adaugă buton „📥 Importă lecție din CSV" pe fiecare capitol (lângă + Lecție)

**4. `EvalBankEditor.tsx`**

- Adaugă buton „📥 Importă CSV" pe fiecare lecție din bancă

### Îmbunătățiri propuse

- **Preview înainte de import** — afișează un tabel cu exercițiile parsate, evidențiind erorile de validare
- **Export CSV** — buton mic de export pe fiecare lecție, generează CSV-ul în formatul corect (util ca template)
- **Detecție automată separator** — suport și pentru `;` ca separator (comun în Europa cu Excel)

### Fișiere

| Fișier | Ce |
|--------|----|
| `src/components/admin/CsvImporter.tsx` | Componenta de import exerciții pe lecție |
| `src/components/admin/CsvLessonImporter.tsx` | Componenta de import lecție completă |
| `src/components/admin/ContentEditor.tsx` | Integrare butoane import |
| `src/components/admin/EvalBankEditor.tsx` | Integrare buton import |

Fără migrări SQL necesare — se folosesc tabelele existente.

