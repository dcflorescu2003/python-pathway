## Schimbare

În prezent, când utilizatorul rezolvă din nou cu succes o problemă deja marcată ca rezolvată, primește 3 XP bonus. Vrem să eliminăm complet acest bonus — nu mai oferim XP pentru probleme deja rezolvate corect.

## Fișiere modificate

### `src/pages/ProblemSolvePage.tsx`
În ambele ramuri (static și test cases), când `passed === total`:
- Dacă `solved` este `true` (problemă deja rezolvată corect): NU mai apelăm `completeLesson` cu XP. Afișăm doar un toast de confirmare ("Toate testele au trecut! ✅" / "Toate cerințele sunt îndeplinite! ✅"), fără mențiunea „+3 XP".
- Dacă `solved` este `false` (prima rezolvare corectă): comportament identic cu cel actual — `completeLesson(problem.xpReward, 100)` și toast cu XP-ul câștigat.

Restul logicii (competențe, static checks, dialog streak) rămâne neschimbat.

## Notă
`completeLesson` din `useProgress` este folosit și pentru a marca progresul. Pentru re-rezolvări, problema este deja în `completedLessons` cu scor 100, deci pur și simplu nu mai apelăm hook-ul — nu se pierde nimic din progres.
