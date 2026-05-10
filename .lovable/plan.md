## Obiectiv
ID-uri ușor de memorat pentru probleme, după capitol: prefix + număr consecutiv.

## Mapare prefixe

| Capitol | Prefix |
|---|---|
| cap1 — Recapitulare & Fundamente | `rec` |
| cap2 — Prelucrări Numerice | `pr` |
| cap3 — Liste | `lst` |
| cap4 — Generare și Sortare | `gs` |
| cap5 — Subprograme | `sub` |
| cap6 — Fișiere și Interfețe | `fis` |

Format final: `rec1`, `rec2`, …, `pr1`, `pr2`, … (fără separator, lowercase).

## 1. Migrare ID-uri existente (62 probleme)

Numerotare după `sort_order` în fiecare capitol → `rec1..rec12`, `pr1..pr10`, `lst1..lst10`, `gs1..gs10`, `sub1..sub10`, `fis1..fis10`.

Migrare SQL într-o singură tranzacție care actualizează în cascadă:
- `problems.id`
- `item_competencies.item_id` (181 rânduri, where `item_type='problem'`)
- `completed_lessons.lesson_id` (61 rânduri, formatul `problem-<oldId>` → `problem-<newId>`)
- `test_items.source_id` (1 rând, where `source_type='problem'`)
- `predefined_test_items.source_id` (0, dar aplicăm pentru siguranță)
- `challenges.item_id` (0, dar aplicăm pentru siguranță)

Strategia tehnică: tabel temporar `_problem_id_map(old_id, new_id)`, apoi `UPDATE` pe fiecare tabel folosind map-ul. Pentru `completed_lessons`/`skip_unlocked_lessons` se aplică prefixul `problem-`.

## 2. Generator nou pentru ID-uri (probleme noi)

În `src/components/admin/ProblemsEditor.tsx`:

- Înlocuiesc `generateProblemId()` cu o funcție care primește `chapterId` + lista existentă și întoarce `<prefix><N+1>`, unde `N` este max-ul numerelor existente cu prefixul respectiv. Ex.: dacă `rec12` există, următoarea este `rec13`.
- Map prefix definit ca obiect `CHAPTER_PREFIX: Record<string, string>`.
- `emptyProblem(chapterId)` recalculează ID-ul pe baza listei curente la deschiderea formularului de creare.
- Când utilizatorul schimbă capitolul în formular pentru o problemă **nouă**, ID-ul se regenerează automat cu noul prefix. Pentru editare (problemă existentă), ID-ul rămâne neschimbat.
- Fallback dacă apare un capitol fără prefix definit: folosesc primele 3 litere din `chapter_id` (ex. `cap`) + număr — improbabil cu maparea de mai sus, dar safe.

## 3. Fără modificări în alte zone

- `useProblems`, `ProblemSolvePage`, `ProblemsPage`, `ChallengeAssigner` etc. tratează `id` ca string opac — nu necesită modificări.
- `progress.completedLessons["problem-<id>"]` continuă să funcționeze (ID-ul nou e tot string).
- Cache-ul local `localStorage` pentru progress se sincronizează din cloud la următorul login (memoria spune cloud-first), deci datele migrate vor fi corecte. Nu e nevoie să curăț cache-ul.

## Detalii tehnice

Pașii de execuție în ordine strictă:
1. Rulez migrația SQL (tabel temp + UPDATE-uri în cascadă) — un singur fișier de migrare.
2. După aprobarea migrației, modific `ProblemsEditor.tsx` cu noul generator.

## Riscuri și mitigare

- **Progress local stale**: dacă un user a deschis app-ul recent, `localStorage` poate avea key-urile vechi `problem-absolute-value`. Cloud-ul are deja `problem-rec1` post-migrare, deci la următorul refetch se sincronizează. Nu intervine niciun blocaj.
- **Ordine `sort_order` egală**: dacă există ties în `sort_order`, folosesc `ORDER BY sort_order, id` ca tie-breaker stabil.
