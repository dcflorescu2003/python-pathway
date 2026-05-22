# Acceptare automată variante fără spații la Fill

## Problema
În `FillExercise.tsx`, funcția `normalize` colapsează spațiile multiple într-unul singur, dar nu le elimină. Așa că `s + d` (răspuns) ≠ `s+d` (input user). Profesorul trebuie să adauge manual ambele variante.

## Soluția
În `src/components/exercises/FillExercise.tsx`, modific `normalize` să elimine **toate** spațiile (inclusiv cele interne), nu doar să le colapseze. Pentru cod Python, spațiile între operatori/identificatori sunt opționale, deci `s+d`, `s + d`, `s  +  d` devin echivalente.

```ts
// înainte
.replace(/\s+/g, " ")
// după
.replace(/\s+/g, "")
```

## Impact
- ✅ `s+d` == `s + d` == `s  +  d` → toate corecte
- ✅ Profesorul nu mai trebuie să listeze variante cu/fără spații
- ⚠️ Trade-off: răspunsuri text cu spații semnificative (ex: `"hello world"` ca string literal) ar deveni egale cu `"helloworld"`. Pentru exerciții Python de completare cod, acest caz e rar/inexistent (blank-urile sunt expresii scurte: operatori, nume, apeluri).

## Teste
Actualizez `FillExercise.test.tsx` adăugând cazuri:
- `s+d` acceptat când răspunsul e `s + d`
- `n%d==0` acceptat când răspunsul e `n % d == 0`
- păstrez testele existente (toate trec, separatorul `|`/`,` rămâne neschimbat)

## Fișiere modificate
- `src/components/exercises/FillExercise.tsx` — o linie în `normalize`
- `src/components/exercises/FillExercise.test.tsx` — 2 teste noi