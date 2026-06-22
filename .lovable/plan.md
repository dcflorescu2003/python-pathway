## Context
Utilizatorul a raportat că în exercițiul de tip "Ordonare linii", două linii identice (`return False`) nu sunt acceptate ca interschimbabile în UI-ul elevului, deși admin-ul le afișează corect.

## Problemă
Logica curentă din `OrderExercise.tsx` verifică ordinea liniilor după câmpul `order` și folosește `group` pentru interschimbabilitate. Liniile identice cu `order` diferit sunt respinse dacă nu sunt explicit grupate cu același `group`.

## Soluție
Schimbă verificarea din `OrderExercise.tsx` să compare textul per poziție, nu ordinea.

### handleSubmit
1. Construiește secvența așteptată: `lines.sort(order).map(l => l.text)`
2. Construiește secvența curentă: `items.map(l => l.text)`
3. Acceptă răspunsul dacă textele coincid poziție cu poziție
4. Păstrează logica `group` ca fallback pentru cazurile intenționate (texte diferite, dar echivalente)

### Indicator vizual per-linie
- Compară `expectedSorted[idx]?.text === item.text` în loc de verificare pe `group`/`order`
- Verde dacă textul coincide cu cel așteptat pe poziția respectivă

## Ce nu se schimbă
- Schema de date (tabel `order_lines({id: number, text: string, order: number, group?: number})`)
- CSV importer
- Admin editor (formularul de adăugare/editare linii)
- Alte tipuri de exerciții
- Logica `group` pentru cazurile intenționate

## Test
Adaugă test în `OrderExercise.test.tsx`: două linii cu același text dar `order` diferit — verifică că ambele aranjamente sunt acceptate.
