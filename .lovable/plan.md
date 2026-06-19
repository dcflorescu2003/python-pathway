
## Problemă

După o lecție terminată cu succes (de ex. 19/20, XP corect, lecția următoare deblocată), tile-ul lecției respective arată simbolul de reluare (RotateCcw) în loc de procentul obținut. Refresh-ul nu rezolvă afișarea.

## Cauza probabilă

În `src/pages/ChapterPage.tsx`:

```ts
const isCompleted = progress.completedLessons[lesson.id]?.completed;
const isStarted = !isCompleted && !!progress.startedLessons?.[lesson.id];
```

`isStarted` câștigă oricând `completed` e absent/`false` dar lecția e încă marcată ca „începută”. Există două căi prin care această desincronizare poate persista, chiar și după refresh:

1. **Merge cu cloud** (`mergeProgress` în `useProgress.ts`): `startedLessons` se face union între local și cloud, fără a-l curăța pentru lecțiile deja completate. Dacă în vreun moment intermediar a rămas un `startedLessons[id]=true` salvat local (de ex. dintr-o sesiune anterioară abandonată pe aceeași lecție), iar entry-ul `completedLessons[id]` din local nu a fost (re)scris la valoarea corectă într-un anumit pas de merge, tile-ul rămâne „început”.
2. **Cursă între `markLessonStarted` și `completeLesson`** la lecții cu flashcard-uri ca ultim exercițiu: `handleAnswer` apelează `markLessonStarted` chiar înainte ca `finishLesson` să fie invocat din altă cale, și updater-ele setProgress se pot serializa în ordine inversă în React 18 sub StrictMode, lăsând `startedLessons[id]=true` peste `completedLessons[id]={completed:true}`.

Indiferent de calea exactă, simptomul vizibil e același: există un `completedLessons[id]` valid în DB, dar UI-ul vede `startedLessons[id]=true` și nu invalidează acel flag.

## Plan de remediere

1. **`src/pages/ChapterPage.tsx`** — face render-ul defensiv:
   - `isCompleted` devine `!!progress.completedLessons[lesson.id]` (orice entry în completedLessons înseamnă completed — codul nostru nu mai scrie niciodată `completed:false`).
   - Procentul afișează `score` chiar dacă `completed` e absent dar entry-ul există.

2. **`src/hooks/useProgress.ts`**:
   - În `mergeProgress`, după calculul `mergedLessons`, filtrează `startedLessons` eliminând toate id-urile prezente în `mergedLessons` (lecție completă nu poate fi „început”).
   - În `markLessonStarted`, dublu-check: dacă există `prev.completedLessons[lessonId]` (cu sau fără flag), return prev — nu re-marcăm ca început.
   - În `completeLesson`, după update, șterge explicit cheia și din eventuale stări intermediare locale (deja se face, dar adăugăm și o curățare pentru cazul în care `markLessonStarted` rulează imediat după din cauza unei re-randări — folosim un guard în funcția în sine).
   - În load-ul inițial (`loadCloud`) și în `resyncFromCloud`, după ce setăm `completedLessons` din cloud, golim `startedLessons` pentru toate id-urile prezente în cloud.

3. **Validare**:
   - Adăugăm un log scurt în `ChapterPage` (eliminăm după confirmare) care raportează, pentru lecția afectată, `{ id, hasEntry, completedFlag, isStarted }` la primul render, ca să confirmăm dispariția cazului.
   - Verificăm vizual în preview pe lecția raportată că tile-ul afișează `★95%` (sau procentul real) imediat și după refresh.

## Out of scope

- Nu schimbăm logica de XP, de unlock, sau de salvare cloud — datele din `completed_lessons` sunt corecte (verificat: lecțiile recente există cu scoruri 93/100).
- Nu atingem `mergeProgress` în privința XP/lives/streak.
