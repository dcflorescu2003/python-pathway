

## Plan: Fix card counting + XP display bugs

### Problems found

**Bug 1: Cards not counted as correct**
In `handleAnswer`, when `exercise.type === "card"`, it returns early WITHOUT incrementing `correctCount`. The finish screen shows "Ai răspuns corect la X/Y" with cards excluded from both numerator and denominator (they should count as correct).

**Bug 2: XP shows wrong value (race condition)**
`completeLesson` is called which updates `progress.completedLessons[lessonId].completed = true` via `setProgress`. Then the finish screen checks `progress.completedLessons[lesson.id]?.completed` — but by now the state has already been updated, so `wasAlreadyCompleted` is always `true`, showing 3 XP even on first completion.

**Bug 3: Score passed to completeLesson excludes cards**
`correctCount` never includes cards, so the score saved to the database is lower than actual.

### Fix (single file: `LessonPage.tsx`)

1. **Count cards as correct**: In the card branch of `handleAnswer`, call `setCorrectCount(c => c + 1)` before advancing.

2. **Capture `wasAlreadyCompleted` before completing**: Add a state variable `wasAlreadyCompleted` (boolean, initially computed from progress). Set it BEFORE calling `completeLesson` so the finish screen uses the pre-update value. Compute it once when the lesson starts (from `progress.completedLessons`).

3. **Fix exercise count display**: On the finish screen, exclude card exercises from the denominator (since they're always "correct" and not really answerable), OR include them in both — I'll include cards in `correctCount` and keep denominator as `lesson.exercises.length`.

### Technical details

| Change | Where |
|--------|-------|
| Add `setCorrectCount(c => c + 1)` in the card branch | `handleAnswer`, line ~59-69 |
| Add `const [wasFirstTime] = useState(() => !progress.completedLessons[lessonId]?.completed)` | State init, after line 54 |
| Use `wasFirstTime` instead of computing `wasAlreadyCompleted` in the render | Finish screen, line 104 |
| Ensure `completeLesson` receives correct `correctCount` (including card +1) | Both call sites |

