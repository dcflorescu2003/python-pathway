Add collision handling and clearer feedback when creating a class to guarantee that join codes stay globally unique and students cannot cross between classes.

Changes:
1. Update `src/hooks/useTeacher.ts`:
   - Keep `generateJoinCode()` unchanged.
   - In `useCreateClass`, wrap the insert in a retry loop (max 5 attempts). If the insert fails with a duplicate `join_code`, generate a new code and retry.
   - Throw a clear error message if all retries fail.
2. Update `src/components/teacher/ClassManager.tsx`:
   - Display a specific toast when the code collides and a new one is being generated.
   - Display a final clear error if creation fails after retries.

The database already enforces `UNIQUE (join_code)` on `teacher_classes`, so the goal is to make the frontend resilient to the rare collision and to surface meaningful messages to the user.