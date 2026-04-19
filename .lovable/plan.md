

## Plan: Skip Challenge — sări peste lecții cu o provocare de 20 de întrebări

### Concept
Click pe o lecție blocată din față → dialog explicativ → provocare cu 20 întrebări random din lecțiile anterioare. 3 vieți de challenge (separate) + greșelile scad și din cele 5 vieți reale. Succes = lecția țintă devine accesibilă, iar elevul poate continua normal de acolo înainte (lecția următoare se deblochează doar după ce o termină pe cea sărită).

### Confirmare comportament „continuă de la lecția deblocată”
Lecția țintă deblocată prin skip se comportă **identic** cu o lecție normal accesibilă: elevul intră, o face, primește XP, iar lecția următoare se deblochează prin completarea ei (ca de obicei). Lecțiile intermediare sărite rămân marcate ca nefăcute, dar pot fi accesate oricând (capătă acelaşi tratament — sunt „deblocate” de skip).

**Detaliu logic important**: când fac skip la lecția N, marchez ca „deblocate prin skip” lecțiile de la prima nefăcută până la N (toate cele intermediare + N), ca elevul să poată naviga liber printre ele. După aceea, progresul normal continuă: completarea lecției N deblochează N+1 prin mecanismul existent.

### Modificare în `ChapterPage.tsx`
```ts
const isLocked = idx > 0 
  && !progress.completedLessons[chapter.lessons[idx - 1].id]?.completed
  && !progress.skipUnlockedLessons?.[lesson.id];
```
Click pe lecție blocată → deschide `SkipChallengeDialog` (nu mai e inert).

### Componente noi

**`SkipChallengeDialog.tsx`** — dialog cu explicații + warning dacă vieți reale < 3 + CTA „Începe provocarea” → navighează la `/skip-challenge/:lessonId`.

**`SkipChallengePage.tsx`**:
- Header: progress bar (X/20) + 3 inimi galbene (challenge) + 5 inimi roșii (reale).
- Pool: toate exercițiile din lecțiile cu `sort_order` strict mai mic decât lecția țintă (cross-chapter), filtrate `type !== "card"`.
- 20 random (Fisher-Yates). Dacă pool < 20: folosesc câte sunt + repetări shuffled.
- Reutilizează componentele existente (`QuizExercise`, `FillExercise`, `OrderExercise`, `TrueFalseExercise`, `MatchExercise`).
- Greșeală: `challengeLives--` ȘI `loseLife()` (vieți reale).
- 0 challenge lives → ecran „Eșuat” + cooldown 30 min (localStorage per lecție).
- 0 vieți reale → același ecran lives-out ca în lecții.
- Succes (toate 20 răspunse fără să consume cele 3) → `unlockLessonViaSkip(lessonId)` + ecran „Lecție deblocată!” cu buton „Mergi la lecție”.

### Modificări în `useProgress.ts`
- Câmp nou `skipUnlockedLessons: Record<string, true>`.
- Funcție `unlockLessonViaSkip(targetLessonId, allLessonsToUnlock[])` care marchează toate lecțiile dintre prima nefăcută și țintă ca deblocate.
- Persistență local + cloud.

### Migrație DB
```sql
CREATE TABLE public.skip_unlocked_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
ALTER TABLE public.skip_unlocked_lessons ENABLE ROW LEVEL SECURITY;
-- SELECT/INSERT own only.
```

### Sugestii suplimentare INCLUSE (confirmate)
- **Cooldown 30 min** la eșec (localStorage).
- **Badge „⚡ Sărită”** pe lecțiile deblocate prin skip dar încă nefăcute.
- **Warning** dacă vieți reale < 3 înainte de start.

### Fișiere

| Fișier | Schimbare |
|---|---|
| `supabase/migrations/...` | Tabel `skip_unlocked_lessons` + RLS |
| `src/hooks/useProgress.ts` | Câmp + funcție `unlockLessonViaSkip` + cloud sync |
| `src/pages/ChapterPage.tsx` | Logică unlock + handler click pe lecție blocată + badge „Sărită” |
| `src/components/SkipChallengeDialog.tsx` | NOU |
| `src/pages/SkipChallengePage.tsx` | NOU |
| `src/App.tsx` | Rută `/skip-challenge/:lessonId` |

