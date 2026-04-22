

## Plan: Restructure ClassDetail for teachers + reorder StudentTab sections

### Summary

**Teacher ClassDetail**: Replace the current flat layout (Students list + Challenges list) with three collapsible sections: **Elevi** (collapsed by default), **Teste** (collapsed, shows tests assigned to this class with a link to results), **Provocari** (collapsed, current challenge list). Remove the Tabs component since Analytics stays separate.

**Student tab**: Move the "Teste" section above "Provocari" (both active and completed) so tests appear first after the class info card.

---

### Changes

#### 1. `src/components/teacher/ClassDetail.tsx`

- Replace the flat Students + Challenges layout inside the "overview" TabsContent with three `Collapsible` sections (from `@/components/ui/collapsible`):
  1. **Elevi (N)** -- collapsed by default, clicking expands the student list
  2. **Teste** -- collapsed by default, fetches `test_assignments` filtered by `class_id`, shows each assigned test (title, date, time limit) as a card. Each card has a "Rezultate" button that navigates to `TestResults` inline (reuse existing pattern with `viewingResultsTestId` state)
  3. **Provocari (N)** -- collapsed by default, contains the current challenges UI with the "Atribuie" button and expandable per-student status

- Add a new query to fetch test assignments for this class:
  ```
  supabase.from("test_assignments")
    .select("*, tests(id, title, time_limit_minutes, created_at)")
    .eq("class_id", classId)
    .order("assigned_at", { ascending: false })
  ```

- Import `TestResults` component and add state for `viewingResultsTestId`. When viewing results, render `TestResults` with an `onBack` callback (same pattern as `TestManager`).

- Each collapsible header uses `CollapsibleTrigger` with a chevron icon and the section title.

#### 2. `src/components/account/StudentTab.tsx`

- Reorder the JSX so that the **Teste** section (currently inside "Istoric" at line 368) appears **before** the active challenges and completed challenges sections.
- Specifically: after the class info card (line 201-288), render in this order:
  1. **Teste** section (active tests to take + completed tests with expandable details) -- extracted from the current "Istoric" block
  2. **Provocari active** (current activeChallenges block, lines 291-317)
  3. **Istoric provocari** (current completedChallenges block, lines 326-365)
- Remove the "Istoric" wrapper heading since tests and challenges will be separate top-level sections.

---

### Files modified

- `src/components/teacher/ClassDetail.tsx` -- collapsible sections, test assignments query, TestResults integration
- `src/components/account/StudentTab.tsx` -- reorder tests above challenges

