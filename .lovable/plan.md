## 1) Verificare: provocările afișează cerința completă

Am verificat fluxul provocărilor pentru elevi:
- Lista de provocări apare pe Home (`src/pages/Index.tsx`) și în Cont (`StudentTab.tsx`).
- Click pe o provocare navighează la `/lesson/:id` (LessonPage) sau `/problem/:id` (ProblemSolvePage).
- Aceste pagini sunt **exact aceleași** folosite pentru lecțiile/problemele normale, fără gardă de blocare sau trunchiere — randează enunțul integral, toate exercițiile/testele vizibile.
- Singurul loc unde apare conținut „scurtat" (line-clamp, doar primul test) este `ChallengeAssigner.tsx` — dar acela e previzualizarea pentru **profesor**, nu pentru elev.

Concluzie: elevii văd deja cerința completă, identic cu o lecție normală. Nu e nevoie de schimbare la acest punct.

## 2) Skip challenge pentru capitole blocate

Momentan, în `src/pages/Index.tsx` (linia ~448-460), un capitol blocat (`isLocked`) e doar opac și `cursor-not-allowed`, fără click. Vrem ca el să devină clickabil și să ofere o provocare de skip pe modelul celei existente la lecție.

Logica de skip există deja: `SkipChallengePage` primește un `lessonId` țintă și deblochează toate lecțiile anterioare ne-completate până la el (inclusiv). Deci e suficient să-l pornim cu **prima lecție a capitolului blocat**.

### Modificări în `src/pages/Index.tsx`

- Importă `SkipChallengeDialog`, `AlertDialog*`, iconițe `Lock`, `Zap`, `Info`.
- Stare nouă: `lockedChapterInfo` (chapterId, chapterTitle, firstLessonId, firstLessonTitle, cooldownMs) și `skipDialog` (lessonId, title, cooldownMs).
- Cardul de capitol blocat:
  - Eliminăm `cursor-not-allowed`; lăsăm aspect dim + iconiță `Lock` + badge `Zap` (galben) pentru a sugera că se poate forța deblocarea.
  - `onClick`: dacă `isLocked` și capitolul are cel puțin o lecție, calculează `cooldownMs` din `localStorage` (cheia `pyro-skip-cooldown:{firstLessonId}`, aceeași folosită în `SkipChallengePage`) și setează `lockedChapterInfo`.
- Adăugăm `AlertDialog` „Capitol blocat" — text explicativ: trebuie să termini ≥50% din capitolul anterior, sau încearcă provocarea de skip cu 20 întrebări din lecțiile parcurse.
- Butonul „Încearcă skip challenge" închide alert-ul și deschide `SkipChallengeDialog` cu `lessonId = firstLessonId`. La succes, `SkipChallengePage` deblochează automat tot lanțul până la prima lecție a capitolului, iar logica existentă `previousDone || skipUnlocked` din `ChapterPage.tsx` va permite accesul normal la lecții.

### Detalii tehnice

- Nu modificăm `SkipChallengePage` — funcționează deja generic.
- Reutilizăm `SkipChallengeDialog` și constanta de cooldown existentă (30 min, cheia `pyro-skip-cooldown:`).
- Aceleași reguli: 3 vieți speciale, fiecare greșeală scade și 1 viață reală, 20 întrebări din pool-ul lecțiilor anterioare lui `firstLessonId` (adică din capitolele anterioare — exact „întrebări din capitolul anterior").
- Dacă pool-ul are <20 întrebări, `SkipChallengePage` repetă întrebări (comportament existent).
- Nu schimbăm nimic la chapterele neblocate.

### Fișiere atinse
- `src/pages/Index.tsx` (singurul)
