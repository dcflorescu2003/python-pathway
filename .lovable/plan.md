# Verificare „fill" cu virgulă în paranteze

## Context

Răspunsul salvat în DB pentru exercițiul tău (lecția `l1778872386686`) este:

```
range(2, n), range(2,n)
```

`FillExercise.tsx` are deja un `splitAlternatives` care urmărește adâncimea parantezelor, deci virgula dintre `2` și `n` din `range(2, n)` NU ar trebui să spargă răspunsul. Și `normalize()` scoate toate spațiile, deci `range(2,n)` ar trebui acceptat ca răspuns corect.

Cu alte cuvinte: cu codul curent, comportamentul pe care îl descrii NU ar trebui să se mai întâmple. Înainte să umblu la logică (și să risc să stric alte exerciții care merg), vreau să confirm cu un test real pe exact șirul din DB.

## Pași

1. **Adaug un test în `FillExercise.test.tsx`** cu exact stringul din DB:
   - `submit("range(2,n)", "range(2, n), range(2,n)")` → așteptat `true`
   - `submit("range(2, n)", "range(2, n), range(2,n)")` → așteptat `true`
2. **Rulez `bunx vitest run FillExercise`** pentru rezultat.
3. **Două scenarii:**
   - **Testul trece** → logica e corectă, problema e că ai un build vechi pe device. Îți spun să faci hard refresh (web) sau să reinstalezi (mobil). Nu schimb cod.
   - **Testul pică** → identific exact unde se rupe (split, normalize, sau altundeva) și fac fix minimal doar acolo, fără să ating alte tipuri de exerciții.

## Detalii tehnice

Logica curentă din `splitAlternatives`:
- Numără paranteze `()[]{}`; doar virgulele/`|`/`;` la `depth === 0` separă variantele.
- `normalize()` apoi scoate diacritice, zero-width, NBSP, TOATE spațiile, lowercase.

Deci `range(2, n), range(2,n)` → `["range(2, n)", "range(2,n)"]` → normalizate `["range(2,n)", "range(2,n)"]`. Input `range(2,n)` → `range(2,n)` → match.

## Ce NU fac

- Nu modific `splitAlternatives` sau `normalize` până nu confirm că pică testul.
- Nu ating alte componente (Quiz, Match, Order, Problem).
