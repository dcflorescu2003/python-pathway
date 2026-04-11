

## Plan: Replay XP reduction, score updates, and fill exercise multi-answer

### Changes

**1. Reduced XP on lesson replay (`src/hooks/useProgress.ts`)**
- In `completeLesson`, check if `completedLessons[lessonId]` already exists
- If already completed, override `xpEarned` to 3 XP (instead of the full lesson reward)
- If first time, use the full `xpEarned` as before

**2. Always update correct count in completed_lessons (`src/hooks/useProgress.ts`)**
- Change the merge logic: when a lesson is re-completed, always store the latest `score` (not `Math.max`)
- This ensures the database reflects how many exercises the user got correct on their most recent attempt
- Update `syncToCloud` to use upsert instead of delete+re-insert for efficiency

**3. Update the completion screen to show replay XP (`src/pages/LessonPage.tsx`)**
- Pass whether the lesson was already completed to determine displayed XP
- Show "+3 XP" on replay instead of the full amount

**4. Fill exercise: support multiple accepted answers (`src/components/exercises/FillExercise.tsx`)**
- Change the validation in `handleSubmit` to split each blank's `answer` by comma
- A blank is correct if the user's normalized input matches any of the comma-separated alternatives
- Example: if `b.answer` is `"print,Print"`, both `print` and `Print` are accepted
- When showing the correct answer on wrong feedback, display only the first alternative

### Database
No schema changes needed — the existing `completed_lessons.score` column already stores the correct count.

### Technical details

```typescript
// FillExercise - multi-answer validation
const isBlankCorrect = (userAnswer: string, acceptedAnswers: string) => {
  const alternatives = acceptedAnswers.split(",").map(a => normalize(a));
  return alternatives.includes(normalize(userAnswer));
};

// useProgress - replay XP
const alreadyCompleted = !!prev.completedLessons[lessonId]?.completed;
const finalXP = Math.round((alreadyCompleted ? 3 : xpEarned) * bonusMultiplier);
```

