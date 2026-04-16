
Problema vine din două surse separate, ambele în fluxul de provocări:

1. Pentru lecții, în `completed_lessons.score` se salvează numărul de exerciții corecte, dar în UI acel număr este afișat ca procent.
   - Exemplu: dacă lecția are 8 exerciții și elevul a făcut 6 corecte, acum se vede `6%` în loc de `75%`.
   - Afectează:
     - `src/components/account/StudentTab.tsx`
     - `src/components/teacher/ClassDetail.tsx`
     - și probabil și analytics-ul profesorului din `src/components/teacher/ClassAnalytics.tsx`

2. Pentru probleme, există un mismatch de identificator:
   - provocarea salvată are `item_id = problem.id`
   - progresul/completarea se salvează cu cheia `lesson_id = problem-${problem.id}`
   - deci la profesor/elev se citește uneori scorul de pe cheia greșită și statusul/afișarea devin inconsistente la reluări.

### Ce voi modifica

#### 1. Normalizez citirea scorului pentru provocări
În componentele elev/profesor nu voi mai afișa direct `score%`.
Voi introduce logică de transformare:
- pentru `lesson`: procent = `Math.round((score / totalExercises) * 100)`
- pentru `problem`: procent = `score` (deja este 100 la completare reușită)

Asta se aplică în:
- `src/components/account/StudentTab.tsx`
- `src/components/teacher/ClassDetail.tsx`

#### 2. Corectez maparea pentru provocările de tip problemă
Voi folosi cheia corectă pentru lookup:
- lesson challenge: `item_id`
- problem challenge: `problem-${item_id}`

Asta trebuie făcut atât la elev, cât și la profesor, ca să citească din `completed_lessons` aceeași cheie pe care o scrie `useProgress`.

#### 3. Corectez și analytics-ul profesorului
În `src/components/teacher/ClassAnalytics.tsx`, scorurile agregate pentru lecții sunt acum tratate ca procente deși sunt brute.
Voi normaliza și acolo valorile, altfel rapoartele profesorului rămân greșite chiar dacă lista provocărilor e corectă.

### Fișiere vizate

| Fișier | Schimbare |
|--------|-----------|
| `src/components/account/StudentTab.tsx` | Afișare procent real + lookup corect pentru problems |
| `src/components/teacher/ClassDetail.tsx` | Afișare procent real pe elev + lookup corect pentru problems |
| `src/components/teacher/ClassAnalytics.tsx` | Normalizare scoruri lecții/probleme pentru statistici |

### Detalii tehnice
- Voi adăuga un helper de tip:
  - rezolvă cheia de progres pentru challenge (`item_id` vs `problem-${item_id}`)
  - calculează procentul real în funcție de tipul provocării
- Pentru lecții, totalul exercițiilor îl iau din `chapters -> lessons -> exercises.length`
- Pentru probleme, procentul rămâne scorul stocat
- Pagina Home rămâne neschimbată

### Rezultat așteptat după implementare
- Când elevul reia o provocare, procentul afișat în tabul elev va fi corect
- Profesorul va vedea procentul corect pentru acel elev în clasa lui
- Problemele reluate vor continua să apară corect ca status și scor
- Statisticile profesorului nu vor mai fi distorsionate de scorurile brute ale lecțiilor
