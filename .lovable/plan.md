Răspuns la întrebare: **Nu, în aplicație nu se poate trece mai departe după o lecție cu sub 75%**.

Comportamentul actual:
- Pragul de promovare este `PASSING_THRESHOLD = 75` în `src/pages/LessonPage.tsx`.
- Dacă scorul final este sub 75%, lecția nu este marcată ca `completed` (nu se apelează `completeLesson`), iar utilizatorul vede ecranul „Nu ai promovat lecția” cu opțiunea de a reîncerca.
- Pe `ChapterPage`, următoarea lecție este blocată (`isLocked`) dacă lecția anterioară nu apare în `progress.completedLessons`.
- Singura alternativă rămâne **Skip Challenge** (provocarea cu fulger), care deblochează lecția fără a o parcurge pe cea anterioară.

Decizie: **Nu facem nicio modificare** — regulă de 75% rămâne în vigoare.