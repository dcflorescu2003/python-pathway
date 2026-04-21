

## Plan: Fix header and bottom safe areas on Problems pages

### Problem
1. **Top**: The back button on ProblemsPage is covered by the Android status bar / notification area. The current `pt-[calc(env(safe-area-inset-top)+8px)]` padding may be insufficient.
2. **Bottom**: ProblemSolvePage (not wrapped in MobileLayout) has only `pb-8`, which doesn't account for Android phones without a navigation bar (gesture navigation), where content can be cut off.

### Changes

**1. `src/pages/ProblemsPage.tsx` — Increase top safe area padding**

Change the header `pt-[calc(env(safe-area-inset-top)+8px)]` to `pt-[calc(env(safe-area-inset-top)+16px)]` to push content further below the status bar and notification icons.

**2. `src/pages/ProblemSolvePage.tsx` — Fix both top and bottom safe areas**

- Header: same fix — increase from `+8px` to `+16px` (or ensure it matches the same pattern as ProblemsPage).
- Bottom: change `pb-8` to `pb-[calc(env(safe-area-inset-bottom)+32px)]` so content is not hidden behind the Android gesture bar.

**3. Quick audit of other non-MobileLayout pages**

Check if ProblemSolvePage's sticky header already uses the safe-area pattern (it does: line ~93 area). Apply the same bottom safe-area padding fix.

### No backend changes needed

