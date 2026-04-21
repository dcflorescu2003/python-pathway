

## Plan: Fix test auto-submit on mobile + proper exercise/problem rendering in tests

### Problem 1: Auto-submit does NOT trigger when checking notifications on mobile

The auto-submit logic relies on `document.visibilitychange` and `window.blur/focus`. On many mobile browsers (especially in Capacitor WebView), pulling down the notification shade does **not** fire `visibilitychange` or `blur`. The Capacitor `appStateChange` listener also doesn't fire for the notification shade — only for full app backgrounding.

**Fix:** Add the `pause`/`resume` events from the Capacitor `App` plugin, which fire more reliably on Android. Also add a `touchend` + `setTimeout` heuristic: if a touch ends and no interaction happens for 1.5s while the page is not focused, treat it as a leave. Additionally, ensure `handleSubmitRef` always has the latest closure by using refs for `items` and `answers` (already done with `answersRef`/`itemsRef`).

**File:** `src/pages/TakeTestPage.tsx`, lines 314-385

### Problem 2: Exercise types render incorrectly in tests (especially Match)

The `ExerciseRenderer` (lines 611-791) uses crude inline renderers:
- **Match**: text inputs instead of two-column tap-to-match
- **Order**: basic drag with `onDragStart`/`onDragOver` (doesn't work on mobile touch)
- **Problem**: plain `Textarea` instead of `CodeEditor` component

**Fix:** Rewrite `ExerciseRenderer` and `ProblemRenderer` to use test-adapted versions of the real components. Since the lesson components report `onAnswer(isCorrect: boolean)` but tests need the actual answer data, we build test-specific renderers that replicate the same visual UI but store answer data instead:

| Type | Current (broken) | Fixed |
|------|------------------|-------|
| **match** | Text inputs per pair | Two-column tap-to-match (replicating `MatchExercise` UI) without submit button, storing `{ matches: { pairId: rightId } }` |
| **order** | Desktop-only drag + arrow buttons | Same arrow buttons but with proper touch support, storing `{ order: [...ids] }` |
| **quiz** | Plain buttons (OK but basic) | Keep similar, add proper selected styling |
| **truefalse** | Inline buttons (OK) | Keep, minor styling alignment |
| **fill** | Inline inputs in code template | Keep current implementation (works) |
| **problem** | Plain `<Textarea>` | Use `CodeEditor` component, same as `ProblemExercise` |

For **match** specifically: build a test-specific two-column matcher that:
- Shows left items in original order, right items shuffled
- Tap left then right to match (or vice versa)
- Shows link icon and muted style on matched pairs
- Tap a matched pair to unmatch
- Stores `{ matches: { [pairId]: rightPairId } }` in answer state
- No "Verifică" button (test has its own submit)

For **problem**: Replace `<Textarea>` with `CodeEditor` component, keeping the same Pyodide test runner when `allowRunTests` is true.

**Files modified:**
- `src/pages/TakeTestPage.tsx` — rewrite `ExerciseRenderer` match/order sections and `ProblemRenderer`

### Technical details

**Auto-submit fix (lines 314-385):**
- Keep `visibilitychange` and `window.blur/focus` listeners
- In the Capacitor section, also listen for `pause`/`resume` events (more granular than `appStateChange`)
- Add a `document.hasFocus()` check on a 2-second interval as a fallback: if focus is lost for >1s, trigger auto-submit

**Match renderer rewrite (lines 760-778):**
- Replace text inputs with interactive two-column UI
- Use `useState` for `selectedLeft`, `selectedRight`, `matched` map
- Shuffle right column with `useMemo`
- Show progress bar and reset button
- Store matches in answer state on each change via `onAnswer`

**Problem renderer rewrite (lines 794-855):**
- Import `CodeEditor` from `@/components/CodeEditor`
- Replace `<Textarea>` with `<CodeEditor value={...} onChange={...} />`
- Keep Pyodide test runner logic unchanged

