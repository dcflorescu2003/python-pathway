# Plan: Replace “analitice” with “date statistice” on About page

## Summary
In the presentation site About page, replace every remaining occurrence of the word "analitice" with "date statistice" to keep terminology consistent with the rest of the app.

## Scope
- Only the public About page: `src/pages/web/AboutPage.tsx`.
- Two occurrences still use the old word:
  1. `og:description` meta tag (line 51): `AI grading și analitice.` → `AI grading și date statistice.`
  2. Teacher features paragraph (line 99): `notare cu AI și analitice detaliate pe elevi.` → `notare cu AI și date statistice detaliate pe elevi.`

## Notes
- The feature card title on line 36 is already `Date statistice`, so this plan only fixes the leftover spots.
- Related pages (e.g., TeacherTutorialsIndex.tsx) also contain "analitice", but they are outside the requested "pagina about" scope. We can extend the fix if you confirm.

## Implementation
Edit `src/pages/web/AboutPage.tsx` with two targeted string replacements. No other components, database, or backend changes are needed.
