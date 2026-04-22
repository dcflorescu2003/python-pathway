

## Plan: Toggle raw `answer_data` in TestResults

### What changes

Add a small "Debug" toggle button in the `AnswerDetail` header that, when active, renders the raw `answer_data` JSON below the human-readable answer section. This lets teachers inspect both the resolved text and the stored data structure side by side.

### Implementation

**File: `src/components/teacher/TestResults.tsx`**

1. Add a `showRaw` boolean state inside `AnswerDetail` (local per-item toggle).
2. In the header bar (line ~596, next to the score), add a small icon button (`Code` icon from lucide-react) that toggles `showRaw`.
3. At the bottom of the answer details section (after the last exercise-type block, before the feedback section around line 733), conditionally render:
   ```tsx
   {showRaw && (
     <div>
       <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Date brute (answer_data)</p>
       <pre className="text-[10px] font-mono bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
         {JSON.stringify(answer.answer_data, null, 2)}
       </pre>
     </div>
   )}
   ```
4. Import `Code` from `lucide-react` (add to existing import on line 19).

### No other files modified. No migrations needed.

