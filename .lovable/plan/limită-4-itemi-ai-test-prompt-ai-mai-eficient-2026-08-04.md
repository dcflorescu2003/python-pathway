# Limită 4 itemi AI/test + prompt AI mai eficient

## Ce se schimbă

1. Profesorii cu abonament **Profesor AI** pot marca până la **4 itemi** per test pentru corectare cu AI (în loc de 3). Profesorii fără abonament AI nu au corectare AI deloc (comportament păstrat).
2. Toate mesajele și textele care menționează „3 itemi” devin „4 itemi”.
3. Promptul trimis modelului la corectare devine mai compact, pentru cost mai mic per test, păstrând corectarea la momentul predării fiecărui elev.

## Backend

`supabase/functions/grade-submission/index.ts`
- `MAX_AI_ITEMS_PER_TEST` 3 → 4.
- Se păstrează gardul existent `teacherHasAI` (fără abonament AI nu se colectează niciun item pentru AI).
- Optimizare prompt (un singur apel per predare, ca acum, dar mai mic):
  - se grupează itemii pe problemă/întrebare: enunțul, soluția corectă și cazurile de test apar **o singură dată** per problemă, iar răspunsurile elevului vin la final, sub secțiunea problemei;
  - `test_cases` se trimit trunchiat (max. ~3 cazuri, valori scurtate), nu întregul JSON;
  - soluția corectă se trunchiază la o limită de caractere;
  - system prompt scurt + cerere de JSON strict, cu instrucțiune de feedback scurt (limită de lungime), ca să scadă și tokenii de ieșire;
  - se păstrează maparea pe `answerId` și fallback-ul actual dacă răspunsul AI e invalid.

## UI

- `src/components/teacher/TestBuilder.tsx`: `MAX_AI_ITEMS_PER_TEST` 3 → 4 (badge „Itemi AI”, toast-uri de limită, checkbox ✨ disabled, mesajul „Bifează ✨ … (x/4 selectați)”).
- `src/components/TeacherPremiumDialog.tsx`: „max. 3 itemi AI/test” → „max. 4 itemi AI/test”.
- `src/pages/TermsOfUsePage.tsx`: „max. 3 itemi evaluați AI/test” → 4.
- `src/data/tutorials/teachers.ts`: textul tutorialului și alt-text-ul imaginii dialogului premium → 4 itemi.

## Note

- Nu se modifică prețurile, planurile sau logica de abonament.
- Limita rămâne per test (nu lunară).
