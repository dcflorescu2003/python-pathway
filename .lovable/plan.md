

## Plan: Fix text overflow + support equivalent orderings

### Problem 1: Text overflow on mobile
The `<code>` element uses `whitespace-pre` which prevents wrapping, causing long lines to overflow on small screens.

**Fix**: Change `whitespace-pre` to `whitespace-pre-wrap` and add `break-all` or `overflow-wrap: anywhere` so text wraps within the container while preserving leading indentation.

Apply to both the draggable items and the "correct order" display.

### Problem 2: Lines with interchangeable order
Currently each line has a single `order` number, so only one exact sequence is accepted. Some lines (e.g., two independent statements) could be in either order.

**Solution**: Add an optional `group` field to the line type. Lines sharing the same `group` value are considered interchangeable -- their relative order among each other doesn't matter, only their position within the correct group matters.

**Changes**:
- **`src/data/courses.ts`** (type definition): Add `group?: number` to the `lines` array item type
- **`src/components/exercises/OrderExercise.tsx`** (validation logic): Update `handleSubmit` to check correctness by grouping lines with the same `group` value and only requiring correct ordering between different groups. Lines in the same group at consecutive positions are all accepted.
- **Existing exercise data**: No changes needed now -- exercises without `group` work exactly as before. You can add `group` to specific exercises later when needed.

### Technical details

**Wrap fix** in OrderExercise.tsx:
- Line 123: `whitespace-pre` → `whitespace-pre-wrap break-words`  
- Line 149: same change for correct order display

**Validation logic**:
```
// Instead of: item.order === idx + 1
// New: assign each position an "effective order", 
// where items in the same group share the same order value,
// then check the sequence is non-decreasing
```

If no lines have `group`, behavior is identical to current (exact match on `order`).

