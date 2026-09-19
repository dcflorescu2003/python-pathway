# Rezolvarea neselectabilă (elevii trebuie să tasteze)

## Ce se schimbă

Textul afișat după butonul „Vezi rezolvarea" nu mai poate fi selectat sau copiat:
- nu se poate selecta prin tragere sau apăsare lungă (mobil),
- Ctrl/Cmd+C, tăierea și meniul contextual (click dreapta → Copy) sunt blocate doar pe acel bloc,
- lipirea în editorul de cod rămâne permisă (decizia utilizatorului).

Se aplică în cele două locuri unde elevii văd rezolvarea:
1. `src/pages/ProblemSolvePage.tsx` — cardul „O posibilă rezolvare" (problemele standalone).
2. `src/components/exercises/ProblemExercise.tsx` — același card, folosit în lecții și lecții manuale.

## Detalii tehnice

Pe elementul `<pre>` (sau `<code>`) cu rezolvarea, în ambele fișiere:
- clasa `select-none` plus `style={{ userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}` (WebkitTouchCallout blochează meniul de apăsare lungă pe iOS),
- `onCopy`, `onCut` și `onContextMenu` cu `e.preventDefault()` pe același element.

Nu se modifică backend-ul, editorul de cod, testele sau fluxul de XP/„A văzut rezolvarea".

## Limitări (de comunicat utilizatorului)

Protecția e la nivel de interfață: un elev determinat poate face screenshot, poate citi codul din sursa paginii sau din instrumentele dezvoltatorului. Scopul e să îngreuneze copierea mecanică, nu să o facă imposibilă.
