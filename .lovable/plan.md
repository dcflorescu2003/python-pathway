

## Plan: Migrate Content to Database + Privacy Policy + Account Deletion

### 1. Migrate Chapters, Lessons, Exercises & Problems to Database

**New tables** (via migration):

- **`chapters`** — id, number, title, description, icon, color, created_at
- **`lessons`** — id, chapter_id (FK), title, description, xp_reward, is_premium, sort_order
- **`exercises`** — id, lesson_id (FK), type, question, options (jsonb), correct_option_id, code_template, blanks (jsonb), lines (jsonb), statement, is_true, explanation, xp, sort_order
- **`problem_chapters`** — id, title, icon
- **`problems`** — id, chapter_id (FK to problem_chapters), title, description, difficulty, xp_reward, test_cases (jsonb), hint, solution

All tables with RLS: SELECT open to all authenticated users (content is public). INSERT/UPDATE/DELETE restricted to admins only (via `has_role` function + `user_roles` table).

**Seed data**: A migration will INSERT all current hardcoded data from `courses.ts` and `problems.ts` into the new tables.

**Code changes**:
- Create `src/hooks/useChapters.ts` — fetches chapters/lessons/exercises from DB using React Query, with caching
- Create `src/hooks/useProblems.ts` — fetches problems/problem chapters from DB
- Update `Index.tsx`, `ChapterPage.tsx`, `LessonPage.tsx`, `ProblemsPage.tsx`, `ProblemSolvePage.tsx`, `AuthPage.tsx` to use the new hooks instead of `getStoredChapters()` and static imports
- Remove `useExerciseStore.ts` dependency from main pages (keep for admin editing if needed)
- Remove direct imports of `problems` and `problemChapters` from data files in pages

### 2. Privacy Policy Page

- Create `src/pages/PrivacyPolicyPage.tsx` — static page with GDPR-compliant privacy policy in Romanian
- Add route `/privacy-policy` in `App.tsx`
- Add link to it from the account page (AuthPage) and optionally from the auth/signup form

### 3. Account Deletion

- Create `src/pages/DeleteAccountPage.tsx` — confirmation flow with warning, password re-entry, and final confirmation
- Add route `/delete-account` in `App.tsx`
- Create edge function `supabase/functions/delete-account/index.ts` that:
  - Validates the user's JWT
  - Deletes user data from `profiles`, `completed_lessons`, `coupon_redemptions`
  - Calls Supabase Admin API to delete the auth user
- Add "Șterge contul" button in the account view (AuthPage)

### Technical Details

**Database migration** will create 5 new content tables + seed ~1950 lines of course data and ~2200 lines of problem data as INSERT statements. Tables use `jsonb` columns for complex nested data (options, blanks, lines, test_cases) to keep the schema flat.

**React Query** will cache the content data, so it loads once and stays in memory. The `staleTime` will be set high (e.g., 1 hour) since content rarely changes.

**Edge function for deletion** uses the service role key to perform admin-level deletion of the auth user, which cannot be done client-side.

**Files to create**: `src/hooks/useChapters.ts`, `src/hooks/useProblems.ts`, `src/pages/PrivacyPolicyPage.tsx`, `src/pages/DeleteAccountPage.tsx`, `supabase/functions/delete-account/index.ts`

**Files to modify**: `src/App.tsx` (routes), `src/pages/Index.tsx`, `src/pages/ChapterPage.tsx`, `src/pages/LessonPage.tsx`, `src/pages/ProblemsPage.tsx`, `src/pages/ProblemSolvePage.tsx`, `src/pages/AuthPage.tsx`

