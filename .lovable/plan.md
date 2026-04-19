

## Plan: Exclud cartonașele (`card`) din contorizare

### Diagnoză
Memoria `lesson-scoring-logic` confirmă comportamentul actual: cartonașele **se contorizează** ca răspunsuri corecte (`correctCount++`) și fac parte din `lesson.exercises.length` (numitor). Asta înseamnă că dacă o lecție are 1 card + 9 quiz-uri, scorul afișat e „10/10" chiar dacă elevul a răspuns la 9.

User vrea: cartonașele = pur teoretice, **invizibile** în statistici.

### Soluție — modificări în 2 fișiere

**1. `src/pages/LessonPage.tsx`**
- Calculez `totalScored = lesson.exercises.filter(e => e.type !== "card").length` (numitor real)
- În `handleAnswer` case `card`: scot `setCorrectCount(c => c + 1)` și recalculul percent — la final folosesc `correctCount` (deja exclude card-uri)
- Înlocuiesc `lesson.exercises.length` cu `totalScored` în:
  - calculul `percent` (la `completeLesson`)
  - afișarea „{correctCount}/{lesson.exercises.length} exerciții" → `{correctCount}/{totalScored}`
- `progressPercent` rămâne pe `currentIndex / total exerciții` (bara de progres trebuie să arate pașii reali parcurși, inclusiv cardurile — UX-ul rămâne corect)

**2. `src/pages/ManualLessonPage.tsx`**
- Identic: case `card` în `handleAnswer` nu mai modifică `correctCount` (deja nu o face — OK)
- Afișarea finală „X/Y" trebuie să folosească `totalScored` (exclude card-uri)

### Locuri NEafectate
- `progressPercent` (bara) — rămâne pe total ca să reflecte pașii vizibili
- XP-ul lecției — rămâne `lesson.xpReward` integral; logica „first time vs replay" nu se schimbă
- Memoria `lesson-scoring-logic` — voi actualiza după aplicare ca să reflecte noua regulă

### Edge case
Dacă o lecție conține DOAR cartonașe (`totalScored === 0`), forțez `percent = 100` și afișez „Lecție completă" fără fracție „X/0".

### Memory update
Actualizez `mem://features/gamification/lesson-scoring-logic` cu noua regulă: cartonașele NU se contorizează nici la total, nici la corecte.

