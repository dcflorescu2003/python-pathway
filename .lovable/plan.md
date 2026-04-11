

## Plan: Mobile keyboard lowercase + Tab indent fix

### Changes

**1. FillExercise.tsx — Add `autoCapitalize="none"` to Input fields**
- Add `autoCapitalize="none"` to the `<Input>` elements in the fill-in-the-blank exercises so mobile keyboards default to lowercase.

**2. CodeEditor.tsx — Fix Tab key in textarea**
- The Tab handler calls `e.preventDefault()` correctly and inserts spaces, but the cursor repositioning via `requestAnimationFrame` references `e.currentTarget` which may be null after the async frame. Fix by capturing the element reference before the RAF callback.
- Also ensure the textarea has `autoCapitalize="none"` for mobile.

### Technical details

- `FillExercise.tsx` line ~46: add `autoCapitalize="none"` prop to `<Input>`
- `CodeEditor.tsx` line ~34-44: capture `const target = e.currentTarget` before `requestAnimationFrame`, use `target` inside the callback to reliably set cursor position

