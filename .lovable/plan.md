## Problemă

La exercițiul „Ordonare linii" cu funcția `este_prim`, există două linii cu textul identic `return False` (pozițiile 3 și 6). Sunt vizual și textual identice, deci utilizatorul nu are cum să le distingă — dar verificarea curentă compară `order`-ul intern al fiecărei linii, așa că dacă „nimerește" linia greșită pe o poziție, primește răspuns greșit chiar dacă secvența de text e corectă.

## Soluție

Modific verificarea în `src/components/exercises/OrderExercise.tsx` să compare **textul** pe fiecare poziție, nu `order`-ul intern.

Logica nouă:
1. Construiesc secvența de text așteptată: `expected = lines.sort(order).map(l => l.text)`
2. Construiesc secvența curentă: `current = items.map(l => l.text)`
3. Corect dacă `current[i] === expected[i]` pentru toate `i`.

Astfel, două linii cu același text devin automat interschimbabile fără configurare suplimentară în admin.

Logica de `group` existentă (linii diferite ca text dar marcate explicit interschimbabile) rămâne și se aplică în plus: dacă textele diferă dar sunt în același group, e tot acceptat. Ordinea de evaluare:
- Întâi check pe text (rezolvă cazul liniilor duplicate).
- Dacă pică, fallback pe logica de group existentă.

Indicatorul vizual per linie (chenar verde/roșu pe feedback) se actualizează în același mod: o linie e „corectă pe poziție" dacă textul ei se potrivește cu textul așteptat la acel index (sau dacă logica de group o validează).

## Ce NU modific

- Schema datelor (`Exercise.lines`), CSV importer, admin editor.
- Alte tipuri de exerciții.
- Logica de `group` rămâne intactă pentru cazurile unde a fost setată intenționat.

## Test

Adaug test în `OrderExercise` (sau extind unul existent) cu două linii având același text dar `order` diferit — verific că ambele aranjamente sunt acceptate.
