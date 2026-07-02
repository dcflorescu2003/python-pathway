# Fix profil competențe — CS fără microcompetențe

## Diagnostic

Pentru `dcflorescu2003@gmail.com` datele reale (SUM(score)/SUM(max) pe CS) sunt:
CS 1.1=99%, 1.3=93%, 1.4=96%, 1.5=98%; CS 2.3=100%, 2.4=97%, 2.5=100%; toate CG3 96–99%; CG4: 4.1=99%, 4.2=100%, 4.3=100%; CG5: 5.2=97%, 5.4=98%; toate CG6 94–99%.

Cauza scorurilor mici pe CG este formula din `CompetencyProfileCard.tsx` (mastery CG = media procentelor CS, cu CS neatinse = 0%). Sunt **8 CS de grad 9 fără nicio microcompetență definită** în DB — ele nu pot primi scor niciodată dar contează 0% în numitor: CS 1.2, 2.1, 2.2, 4.4, 4.5, 5.1, 5.3, 5.5. Recalculând cu ele numărate 0% se obține exact 77 / 59 / 97 / 60 / 39 / 98% — identic cu poza.

## Ce facem

### A. Fix afișare (cod + RPC)

1. **Extindem `get_student_competency_profile`** să întoarcă `has_micro boolean` (există sau nu microcompetențe pentru CS-ul respectiv).
2. **`CompetencyProfileCard.tsx`** — la agregarea CG:
   - CS cu `has_micro=false` → **exclus** din numitor + badge „Neevaluat în platformă" (culoare muted).
   - CS cu `has_micro=true` dar `max_sum=0` → rămâne 0% (chiar nu a fost atins de elev).
   - Overall (procentul din antetul cardului) calculat pe aceeași bază.

### B. Seed microcompetențe lipsă (nu tagging)

Migration ce inserează câte 1 microcompetență-placeholder pentru fiecare din cele 8 CS goale, folosind titlul CS-ului. Categorie preluată din litera CG (A=Identificare, B=Explicare, C=Utilizare, D=Analiză, E=Evaluare, F=Elaborare — best-guess din datele existente; verific rapid distribuția la commit). Codurile M continuă seria existentă (`M` + max+1..max+8). `sort_order` = max+1 în cadrul CS-ului.

Efect imediat după seed: CS-urile respective apar în profil cu 0% (nu mai sunt „—"), iar CG-urile scad ușor pentru elevi care au avansat, dar formula devine consistentă. Tagging pe exerciții existente rămâne o etapă separată (nu în acest turn).

## Detalii tehnice

- Migration:
  - `CREATE OR REPLACE FUNCTION public.get_student_competency_profile(p_user_id, p_mode)` — adaug coloana `has_micro boolean` = `BOOL_OR(m.id IS NOT NULL)` per CS (folosind același LEFT JOIN existent).
  - `INSERT INTO public.microcompetencies (code, title, description, specific_id, category, grade, sort_order)` pentru cele 8 CS. Nu ating tabela `item_competencies`.
- Client (`src/components/account/CompetencyProfileCard.tsx`):
  - Adaug `has_micro` în `Row`.
  - În `generals` memo: filtrez `rowsAssessable = g.rows.filter(r => r.has_micro)`; `totalCs = rowsAssessable.length`; suma peste `rowsAssessable`.
  - În render CS-uri: pentru `!r.has_micro` afișez badge „Neevaluat" și bară dezactivată în loc de 0%.
- Fără modificări în `useCompetencies.ts` sau în `recalculate_competency_scores`.

## Ce NU se schimbă acum

- Nu se modifică datele agregate ale elevilor (`student_competency_scores`).
- Nu se face tagging pe exerciții/probleme existente pentru CS-urile nou-populate — micro-urile rămân la 0% până când etichetăm itemi (turn separat).
- Nu se atinge modul `tests_only` / `self_only` decât prin coloana `has_micro` (aceeași corecție se aplică tuturor modurilor).
