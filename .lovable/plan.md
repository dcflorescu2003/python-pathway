## Problem

Pagina Admin → Teste se face neagră cu eroarea „Rendered more hooks than during the previous render".

În `src/components/admin/PredefinedTestEditor.tsx` apelurile de hook-uri `useSensors` / `useSensor` (liniile 74-77) sunt plasate **după** două return-uri timpurii:
- linia 51: `if (isLoading) return ...`
- linia 53: `if (editingTest || creating) return <TestForm ... />`

La primul render `isLoading` e `true` → React vede X hook-uri. La al doilea render (după ce datele se încarcă) se execută și `useSensors` → mai multe hook-uri decât înainte → crash. Asta încalcă Rules of Hooks.

## Fix

Mută blocul `useSensors(...)` (și orice alt hook) **înainte** de orice `return` timpuriu, imediat după celelalte hook-uri (`useState`-urile de la liniile 44-49). Logica `sortedChapters` / `noChapterTests` / `toggleChapter` rămâne unde e (nu sunt hook-uri).

Niciun alt fișier nu are nevoie de modificări — `TestManager` (testele profesorului) nu e afectat, problema e doar în editorul admin.

## Verificare

- Reîncarc tab-ul Teste din /admin în preview și confirm că lista se afișează fără eroare în consolă.
