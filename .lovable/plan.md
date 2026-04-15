

## Plan: Animație streak la prima activitate din zi

### Concept
Când utilizatorul completează primul exercițiu sau problemă din ziua curentă (și streak-ul crește), apare un dialog celebrativ cu animație de foc, confetti și noul număr de streak.

### Detectare
În `useProgress`, `completeLesson` deja calculează noul streak via `computeNewStreak()`. Trebuie să detectăm momentul exact când `lastActivityDate` se schimbă de la o zi anterioară la azi (prima activitate din zi). Hook-ul va returna un nou state `streakJustIncreased` care se setează pe `true` în `completeLesson` când streak-ul crește, și se resetează manual din UI.

### Componente

**1. `StreakCelebrationDialog.tsx`** (nou)
- Dialog modal cu animație de foc centrală (Flame icon animat cu scale + rotate + glow pulsant)
- Confetti particles (similar cu LevelUpDialog)
- Mesaj: „🔥 Serie de {N} zile!" cu numărul animat (spring scale-in)
- Mesaj motivațional variabil: „Continuă tot așa!", „Ești de neoprit!", etc.
- Buton „Continuă" pentru a închide
- Auto-close după 4 secunde
- Stil consistent cu tema dark mode existentă

**2. `useProgress.ts`** (modificat)
- Adaug state `streakJustIncreased: boolean` și noul streak number
- În `completeLesson`, detectez dacă `prev.lastActivityDate !== today` (prima completare din zi) → setez flag-ul
- Export `dismissStreakCelebration()` pentru reset
- Aceeași logică și în `recordActivity`

**3. `LessonPage.tsx`** și `ProblemSolvePage.tsx`** (modificate)
- Când `isFinished` și `streakJustIncreased === true`, afișez `StreakCelebrationDialog`
- La dismiss, apelez `dismissStreakCelebration()`

### Fișiere modificate

| Fișier | Ce |
|--------|-----|
| `src/components/StreakCelebrationDialog.tsx` | Nou — dialog animat celebrativ |
| `src/hooks/useProgress.ts` | Adaug `streakJustIncreased` state + dismiss |
| `src/pages/LessonPage.tsx` | Afișare dialog la finish |
| `src/pages/ProblemSolvePage.tsx` | Afișare dialog la rezolvare |

