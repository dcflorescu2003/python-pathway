# Raport activitate pe clase (ultimele 7 zile)

## Ce vezi

În tabul Clase, imediat sub butonul „Creează clasă nouă", apare un tabel compact:

```text
Clasa   17 SEP  18 SEP  19 SEP  20 SEP  21 SEP  22 SEP  23 SEP
9B         0      12      8       0       4      10      6
10A        5      20      14      2       0       7      9
```

- Un rând pentru fiecare clasă a profesorului.
- Șapte coloane: ultimele 7 zile, de la cea mai veche la ziua de azi.
- Fiecare valoare = numărul total de lecții și probleme finalizate în acea zi de toți elevii clasei.
- Tabel simplu, fără evidențieri de culoare; pe telefon se poate derula orizontal.
- Sub tabel, o linie de explicație: „Lecții și probleme finalizate de elevii clasei."
- Dacă profesorul nu are încă nicio clasă, raportul nu apare.
- Dacă o clasă nu are elevi înscriși, rândul apare cu 0 pe toate zilele.

## Detalii tehnice

- Hook nou `src/hooks/useClassActivityReport.ts`:
  - ia clasele din `useTeacherClasses`, apoi `class_members` (class_id, student_id) pentru acele clase;
  - un singur select pe `completed_lessons` (`user_id, completed_at`) filtrat cu `.in("user_id", studentIds)` și `completed_at >= ` începutul zilei de acum 6 zile (fus orar local);
  - agregă în client pe (class_id, zi locală) și returnează matricea + lista de zile;
  - `staleTime` 5 minute, `enabled` doar când există clase, ca să nu crească consumul.
- Politicile RLS existente acoperă deja citirea: „Teachers can see class members" și „Teachers can view student completed lessons". Fără migrații, fără RPC nou.
- Componentă nouă `src/components/teacher/ClassActivityReport.tsx` (tabel `overflow-x-auto`, tokeni semantici existenți), randată în `src/components/account/TeacherClassesTab.tsx` sub `<ClassManager />`.
- Elevii cu mai multe clase sunt numărați la fiecare clasă în care sunt înscriși.
