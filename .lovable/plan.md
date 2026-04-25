## Refactorizare import CSV lecții cu suport pentru competențe

### Scop
La importul unei lecții din CSV, fiecare exercițiu poate include o listă de coduri de microcompetențe (ex: `M61;M21`). După inserarea exercițiilor în DB, se vor crea automat și mapările în `item_competencies` (greutate 1.0 pentru fiecare).

### Format CSV (nou)

Adăugăm o **nouă coloană opțională** `competencies` în secțiunea `[EXERCISES]`:
- Conține coduri de microcompetențe separate prin `;` (ex: `M61;M21;M29`)
- Codurile invalide sunt afișate ca avertisment, dar nu blochează importul
- Coloana lipsă sau goală = exercițiu fără mapare (comportament actual)

Exemplu rând:
```
quiz,"Care e tipul lui 3.14?",int,float,str,bool,b,"...",,,,,,,,M21;M29
```

### Modificări pe componente

**1. `src/components/admin/csvParser.ts`**
- Adaug câmpul `competencies?: string[]` în `ParsedExercise`
- În `rowToExercise`: parsez `row.competencies` → split pe `;`, trim, uppercase, filtrare gol
- Adaug `competencies` în lista headers din `getContentLessonTemplateCSV`, `getLessonTemplateCSV`, `generateExportCSV`
- Actualizez exemplele din template să includă coduri reale (M21, M29, M61 etc.)

**2. `src/components/admin/CsvLessonImporter.tsx`**
- După `INSERT` în `exercises`/`eval_exercises`: colectez perechile `(exercise_id, competency_codes[])`
- Fac `SELECT id, code FROM microcompetencies WHERE code IN (...)` pentru a rezolva codurile la UUID-uri
- `INSERT` în `item_competencies` cu `item_type='exercise'`, `weight=1.0`
- Avertizez în toast cu numărul de mapări create + codurile necunoscute
- În UI, în lista de exerciții parsate, afișez badge-uri cu codurile de competențe detectate (ex: `M21 M29`)

**3. UI — instrucțiuni vizibile în dialog**
Înlocuiesc footer-ul actual cu un panou explicativ care conține:
- Format coloană `competencies`: `M21;M29;M61`
- Linkul pentru descărcare template (rămâne)
- Un buton secundar nou: **„Vezi lista microcompetențelor"** care deschide un sub-dialog cu tabel filtrabil (`cod | titlu | competență specifică`) — preluat din `microcompetencies`
- Notă: codurile necunoscute sunt ignorate cu avertisment

### Detalii tehnice

**Validare coduri**:
- La parsing nu validăm (nu avem acces la DB), doar la submit
- La submit: un singur SELECT pentru toate codurile unice din toată lecția
- Codurile necunoscute apar într-un toast warning separat, dar importul continuă

**Mode `eval`**: aceeași logică, dar cu `item_type='exercise'` (mapările sunt pe ID-ul exercițiului din `eval_exercises`).

**ID-uri**: păstrez logica actuală — ID-ul exercițiului este generat înainte de insert, deci am perechile direct fără re-query.

### Exemplu CSV complet (va fi în template descărcabil)

```
[META]
title,Liste în Python
description,Introducere în liste
xp_reward,25
[EXERCISES]
type,question,option_a,option_b,option_c,option_d,correct,explanation,code_template,blanks,lines,statement,is_true,groups,solution,test_cases,competencies
quiz,"Ce este o listă?",Un șir,O colecție ordonată,Un dicționar,Un tuplu,b,"Listele sunt colecții ordonate",,,,,,,,,M61
truefalse,,,,,,,"Listele sunt mutabile",,,,Listele sunt mutabile,True,,,,M61;M21
fill,"Adaugă un element:",,,,,,"append() adaugă la sfârșit","l.___(5)",append,,,,,,,M61
```

### Rezultat așteptat
- La import, exercițiile primesc automat mapări de competențe
- Profilul de competențe al elevului se umple corect după parcurgerea lecției
- Profesorii pot vedea exact ce competențe acoperă fiecare lecție importată

Confirmă-mi dacă formatul `M21;M29` e ce vrei (separator `;`, fără ponderi). Dacă e ok, aplic.