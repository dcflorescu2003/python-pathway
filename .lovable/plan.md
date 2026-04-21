

## Plan: Retake permission for teachers + Auto-save on browser close

### Problem
1. When a test is auto-submitted (student left screen), the teacher has no way to let that student retake it.
2. If the browser crashes or power goes out, the answers are lost because they only exist in React state until manual submit.

### Changes

#### 1. Database migration — Allow teachers to delete submissions + answers

Add DELETE RLS policies so teachers can remove a student's submission (enabling retake):

```sql
-- Allow teachers to delete submissions for their tests
CREATE POLICY "Teachers can delete submissions for their tests"
ON public.test_submissions FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM test_assignments ta
  JOIN tests t ON t.id = ta.test_id
  WHERE ta.id = test_submissions.assignment_id AND t.teacher_id = auth.uid()
));

-- Allow teachers to delete answers for their tests
CREATE POLICY "Teachers can delete answers for their tests"
ON public.test_answers FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM test_submissions ts
  JOIN test_assignments ta ON ta.id = ts.assignment_id
  JOIN tests t ON t.id = ta.test_id
  WHERE ts.id = test_answers.submission_id AND t.teacher_id = auth.uid()
));
```

#### 2. `src/hooks/useTests.ts` — Add `useAllowRetake` mutation

New hook that deletes a student's submission + answers, effectively resetting their test so they can retake it:

```typescript
export function useAllowRetake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (submissionId: string) => {
      // Delete answers first (FK-like dependency)
      await supabase.from("test_answers").delete().eq("submission_id", submissionId);
      // Delete submission
      await supabase.from("test_submissions").delete().eq("id", submissionId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["test-submissions"] });
      qc.invalidateQueries({ queryKey: ["student-test-assignments"] });
    },
  });
}
```

#### 3. `src/components/teacher/TestResults.tsx` — Add "Permite reluarea" button

For each submission that was auto-submitted (has `auto_submitted_reason`), show a small button next to the student's name that calls `useAllowRetake`. Include a confirmation dialog to prevent accidental clicks. The button deletes the submission so the student sees the test as available again.

#### 4. `src/pages/TakeTestPage.tsx` — Auto-save draft answers + beacon submit on close

**Periodic autosave (every 30 seconds):**
- Save current answers to `localStorage` keyed by `submission_id`
- On page load, restore any saved draft answers

**`beforeunload` + `sendBeacon` for browser close:**
- On `beforeunload`, use `navigator.sendBeacon` to POST answers to the `grade-submission` edge function (or a new lightweight endpoint)
- This handles intentional browser close and some crash scenarios

**`visibilitychange` immediate save:**
- When tab becomes hidden, immediately persist draft answers to localStorage
- The existing 1-second auto-submit logic already handles tab switching, but this adds a safety net

**Power loss / crash recovery:**
- Since answers are periodically saved to localStorage, if the student reopens the test after a crash, their draft answers are restored
- If they never return, the teacher can see the submission was started but not submitted ("In curs") and can handle it manually

### Summary of files changed
- **Migration**: New RLS policies for DELETE on `test_submissions` and `test_answers`
- **`src/hooks/useTests.ts`**: New `useAllowRetake` hook
- **`src/components/teacher/TestResults.tsx`**: "Permite reluarea" button per auto-submitted student
- **`src/pages/TakeTestPage.tsx`**: localStorage draft autosave every 30s, `sendBeacon` on `beforeunload`, draft restore on load

