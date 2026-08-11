# Verificare impact modificări de securitate asupra testării

## Concluzie: fluxul de testare NU este afectat

Verificări făcute pe cod și pe baza de date reală:

- **Itemii testelor**: toate cele 28 de `test_items` existente provin din banca de evaluare (`eval-...`) și se citesc prin RPC-urile SECURITY DEFINER (`get_test_items_for_student`, `get_eval_exercise_for_student`) — politicile noi pe `exercises` / `problems` nu intervin deloc.
- **Exerciții premium**: în prezent nu există nicio lecție marcată premium (0 lecții, 0 exerciții), deci noua politică pe `exercises` nu blochează nimic azi. Chiar și în viitor, elevul primește acces prin `source_in_accessible_test` dacă itemul e într-un test asignat clasei lui.
- **Corectarea testelor**: `grade-submission` rulează cu service role, deci ocolește complet RLS — notarea rămâne neschimbată.
- **Profesori**: `predefined_test_items` e restricționat la profesori verificați/admin; în baza de date sunt 5 profesori verificați și 0 în așteptare, deci niciun profesor activ nu pierde acces. Citirile din `TestResults` / `ClassAnalytics` trec prin `source_in_accessible_test` (`t.teacher_id = auth.uid()`).
- **Manual public**: lista de coloane permise pentru vizitatori anonimi corespunde exact structurii tabelei (18 coloane, doar `solution` exclusă), deci paginile publice funcționează.

## Două riscuri reziduale (mici) — recomand acoperirea lor

1. **Profesor neverificat + șablon predefinit**: dacă în viitor apare un profesor cu status `pending`, lista de teste predefinite îi apare, dar la aplicare primește „Acest test nu are itemi definiți". Propunere: ascunderea/blocarea explicită a șabloanelor predefinite pentru profesorii neverificați, cu mesaj clar („necesită cont verificat").
2. **Sincronizare `is_premium`**: `has_premium_access` se bazează pe `profiles.is_premium`. Dacă un abonat activ are flagul nesincronizat momentan, primește catalogul de probleme fără `test_cases` (nu poate rula soluția). Propunere: la deschiderea unei probleme premium fără cazuri de test, se reface `check-subscription` și se reîncarcă catalogul, în loc de eșec silențios.

## Detalii tehnice

- Fișiere vizate pentru punctul 1: `src/components/teacher/TestBuilder.tsx` (filtrare șabloane după `is_verified_teacher`).
- Fișiere vizate pentru punctul 2: `src/hooks/useProblems.ts` + `src/pages/ProblemSolvePage.tsx` (retry o singură dată după refresh abonament).
- Fără migrații noi de bază de date.
