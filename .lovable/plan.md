## Problema

La exercițiul din imagine, răspunsul corect este `range(2, n)`. În `FillExercise.tsx`, lista de variante acceptate este împărțită cu regex `/[,|;]/`, deci `range(2, n)` devine două „variante": `range(2` și `n)`. Niciuna nu se potrivește cu ce tastează utilizatorul, așa că răspunsul corect apare ca greșit.

Aceeași problemă afectează orice fill-in care conține virgulă în interiorul răspunsului (apeluri de funcții cu mai multe argumente, tuple, liste etc.).

## Soluție

În `src/components/exercises/FillExercise.tsx`:

1. Înlocuiesc separatorul de variante alternative: nu mai folosesc virgula. Variantele acceptate se separă doar cu `|` sau `;` (rămân compatibile cu conținutul existent care folosea `|`/`;`; răspunsurile care conțin `,` ca parte din cod nu se mai sparg).
2. Aceeași schimbare se aplică și la afișarea răspunsului corect în feedback (`split(/[,|;]/)` → `split(/[|;]/)`).
3. Actualizez comentariul din cod ca să reflecte regula nouă.

## Detalii tehnice

- Funcția `isBlankCorrect`: regex schimbat din `/[,|;]/` în `/[|;]/`.
- Randarea hint-ului `wrong`: regex schimbat din `/[,|;]/` în `/[|;]/`.
- Nu modific normalizarea (care deja ignoră spațiile albe), deci `range(2,n)` și `range(2, n)` continuă să fie echivalente.
- Memoria `mem://features/exercise-logic/fill-in-multi-variant` va trebui actualizată ulterior ca să spună că separatorii pentru variante sunt `|` și `;` (nu virgulă), pentru a nu se sparge răspunsurile cu virgule în interior.

## Risc

Dacă există conținut existent în baza de date care folosește `,` ca separator între variante alternative la fill-in, acele variante secundare nu vor mai fi recunoscute (vor fi tratate ca un singur răspuns literal). Pot rula o căutare ulterioară prin `exercises.blanks` pentru a verifica/migra dacă este cazul — confirmă dacă vrei să fac și asta.

Sunt foarte multe exercitii care in prezent au , care separa variantele. Vreau sa ne asiguram ca si acelea raman ok. Tot ce este pana la lectia aceasta este ok asa cum e. Momentan cele care contin virgula in raspuns sunt rang(ceva, altceva). Poate ne putem folosi de asta