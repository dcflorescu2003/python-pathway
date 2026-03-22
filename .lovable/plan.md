

## Plan: Add 7 Problems per Chapter + "Vezi rezolvarea" Button

### Overview
1. **Add `solution` field** to the `Problem` interface in `src/data/problems.ts`
2. **Add 42 new problems** (7 per chapter × 6 chapters) with solutions, plus add solutions to existing 18 problems
3. **Add "Vezi rezolvarea" button** in `src/pages/ProblemSolvePage.tsx` that appears when tests fail, showing a collapsible code solution

### Changes

**File: `src/data/problems.ts`**
- Add `solution: string` field to `Problem` interface
- Add `solution` to all existing 18 problems
- Add 7 new problems per chapter (42 total), covering progressive difficulty (mix of ușor/mediu/greu), each with test cases, hints, and solutions
- New problem topics per chapter:
  - **Cap1 (Fundamente)**: absolute value, swap, min of two, divisibility check, last digit, digit count, number sign
  - **Cap2 (Prelucrări Numerice)**: palindrome number, count digits, first digit, perfect square, divisor count, digit product, power of 2
  - **Cap3 (Liste)**: count evens, second max, list average, remove duplicates, list intersection, rotate list, count negatives
  - **Cap4 (Generare/Sortare)**: generate evens, merge sorted, bubble sort steps, binary search, insertion sort, count sort, reverse list
  - **Cap5 (Subprograme)**: sum of divisors, perfect number, digit sum recursive, GCD recursive, lcm function, count vowels, palindrome string
  - **Cap6 (Fișiere/Interfețe)**: reverse string, uppercase count, replace char, longest word, sentence reverse, remove vowels, count sentences

**File: `src/pages/ProblemSolvePage.tsx`**
- Add `showSolution` state
- After results section, when `passedCount < totalCount`, show a "Vezi rezolvarea" button
- Clicking it reveals the solution code in a styled code block
- Reset `showSolution` when running new tests

### Technical Details
- Solution field contains Python code as a string
- Displayed in a `<pre><code>` block with monospace font styling
- Button uses `BookOpen` icon from lucide-react

