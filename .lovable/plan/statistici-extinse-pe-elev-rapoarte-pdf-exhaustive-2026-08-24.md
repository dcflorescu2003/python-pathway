# Statistici extinse pe elev + rapoarte PDF exhaustive

Obiectiv: profesorul vede clar, pe fiecare elev, unde se descurcă și unde greșește — atât în aplicație, cât și în PDF.

## 1. Pagină dedicată elev (în aplicație)

Click pe un elev din clasă deschide un ecran complet „Fișa elevului”:

- Antet: nume, XP, streak, nivel (badge), ultima activitate, medie lecții, medie teste.
- Profil de competențe (CG/CS) cu nivelurile existente (avansat / consolidat / bază / insuficient) și comutatorul teste / mediu / auto-învățare.
- Lecții: toate lecțiile completate cu procent, evidențiate cele sub 80%, plus lecțiile încă nefăcute din capitolele deblocate.
- Teste: fiecare test dat, scor total, apoi itemii greșiți cu enunț scurt și punctaj obținut/maxim.
- Probleme: număr rezolvat pe capitole, total XP, streak.
- Card „Recomandări”: 3-5 puncte generate din reguli simple (competențe slabe, lecții sub 80%, itemi greșiți repetat, probleme neîncercate din capitolele slabe).
- Buton „Export PDF elev”.

## 2. Raport PDF de clasă (extins)

Rămâne raportul actual (KPI, clasament, lecții problematice, performanță teste, erori frecvente), completat cu:

- Distribuția scorurilor și medii pe capitole.
- Secțiune „Harta competențelor clasei”: media pe fiecare competență generală/specifică, cu evidențierea celor slabe.
- La final, câte o pagină per elev (aceleași secțiuni ca fișa din aplicație), cu salt de pagină între elevi.

## 3. Raport PDF individual

Același conținut ca pagina elevului, exportabil separat din fișa elevului sau din tabelul clasei.

## Detalii tehnice

- Fișă nouă `src/components/teacher/StudentReport.tsx` (ecran, reutilizează `CompetencyProfileCard` / `StudentCompetencyView` și componentele de card existente), afișată din `ClassDetail.tsx` prin state `viewingStudentId` (fără rută nouă, ca la `TestResults`).
- Hook nou `src/hooks/useStudentReport.ts`: agregă într-o singură cerere per elev — `completed_lessons`, `test_submissions` + `test_answers` (via `get_submission_review` pentru enunțuri fără soluții), competențe via `get_student_competency_profile`, probleme rezolvate, profil via `get_students_for_teacher`. React Query cu `staleTime` 2 min.
- Recomandările sunt calculate client-side într-un helper `src/lib/studentInsights.ts` (reguli pure, testabile), fără AI, fără apeluri suplimentare.
- PDF: extindere `ClassAnalytics.tsx` — mut generarea HTML în `src/lib/classReportHtml.ts` (`buildClassReportHtml`, `buildStudentSectionHtml`), reutilizat de ambele exporturi; se păstrează fluxul actual print-to-PDF (window.open + print), cu `page-break-before` pe fiecare secțiune de elev.
- Fără schimbări de schemă sau RLS: se folosesc doar RPC-urile existente care respectă `can_teacher_view_student` și ascund răspunsurile corecte acolo unde e necesar.
- Datele elevilor rămân accesibile doar profesorului clasei; nicio interogare directă nouă pe `profiles`.
