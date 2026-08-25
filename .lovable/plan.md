# Statistici de clasă mai relevante

Obiectiv: profesorul să vadă rapid cine are nevoie de ajutor și la ce, fără cifre înșelătoare.

## Ce se corectează (probleme actuale)

1. **Media clasei** include elevii care n-au făcut nimic (intră cu 0%) — trage media artificial în jos. Se calculează doar pe elevii activi, iar elevii inactivi apar separat.
2. **„Lecții completate"** amestecă lecțiile, lecțiile de Fixare și problemele rezolvate. Se separă în: lecții, recapitulări (Fixare), probleme.
3. **Lecțiile „arhivate"** (id-uri care nu mai există în curriculum) apar de mai multe ori în „Lecții cu cele mai multe greșeli". Se grupează într-un singur rând „Lecții arhivate" și se scot din topul de greșeli.
4. **Erori frecvente**: punctajul parțial e numărat drept „100% greșit". Se separă „greșit complet" (0 puncte) de „parțial", iar rata se calculează ca punctaj mediu obținut (%).
5. Se ia în calcul **doar activitatea de după înscrierea în clasă** pentru indicatorii de clasă (rămâne un comutator „tot istoricul" pentru context).

## Ce se adaugă

**Carduri KPI (rând nou)**
- Elevi activi în ultimele 7 zile (nu doar „au făcut vreodată ceva").
- Lecții finalizate în ultimele 7 zile (ritm de lucru al clasei).
- Elevi cu risc: fără activitate 14+ zile SAU medie sub 60%.
- Rată de predare a testelor: submisii predate / elevi × teste asignate.

**Tabel elevi (extins, sortabil)**
Coloane: elev, lecții, recapitulări, probleme, medie lecții, medie teste, teste predate/asignate, ultima activitate, streak, XP, semnal de risc. Sortare pe orice coloană; evidențiere pentru elevii în risc.

**Progres pe capitole (nou)**
Pentru fiecare capitol: procent mediu de parcurgere al clasei (lecții finalizate / lecții disponibile), medie scor, câți elevi l-au început. Arată clar unde s-a blocat clasa.

**Evoluția clasei în timp (nou)**
Grafic pe ultimele 30 de zile: lecții finalizate pe zi + elevi activi pe zi — arată dacă clasa lucrează constant sau doar înainte de test.

**Competențe slabe la nivel de clasă (nou)**
Media pe competențe generale/specifice agregată din profilurile elevilor (aceleași date folosite deja în fișa elevului), cu evidențierea celor sub nivelul „bază". Este secțiunea cea mai relevantă pentru raportarea la programă.

**Teste: detaliu mai util**
Pe fiecare test: medie, mediană, cel mai slab/cel mai bun scor, câți sub 50%, câți n-au predat.

**Erori frecvente, reformulat**
Pe item: punctaj mediu obținut (%), câți elevi 0 puncte, câți parțial, tipul itemului. Sortare după punctaj mediu crescut, top 8.

## Detalii tehnice

- Toate calculele rămân client-side în `ClassAnalytics.tsx`, dar logica de agregare se mută în `src/lib/classAnalytics.ts` (funcții pure, testabile cu vitest) — componenta rămâne de prezentare.
- Interogări noi/extinse: `class_members.joined_at` (există deja) pentru filtrul „din momentul înscrierii"; `test_assignments` pentru numărul de teste asignate (necesar la rata de predare); competențele per elev prin RPC existent `get_student_competency_profile` (apelat per elev, cache React Query 2 min), agregat în frontend.
- Progresul pe capitole folosește `useChapters()` (numărul de lecții per capitol) încrucișat cu `completed_lessons`.
- Separarea lecție / fixare / problemă se face după `lesson_id`: prefix `problem-` = problemă, sufix `f` peste un id existent = recapitulare, restul lecții; id-urile nerezolvabile → „arhivate".
- Graficul de evoluție: `recharts` `ComposedChart`, în stilul existent (fără culori hardcodate, doar tokeni).
- CSV și PDF (`exportCSV`, `exportPDF`, `buildStudentSectionHtml`) se actualizează să includă noile secțiuni, ca raportul să rămână sincron cu ecranul.
- Fără modificări de schemă și fără RLS nou: se folosesc doar tabelele și RPC-urile la care profesorul are deja acces.
