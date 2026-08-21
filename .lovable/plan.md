# Import și redare pachete SCORM 1.2 în lecții

## Cât de complicat e, pe scurt

Este realizabil, dar nu e o funcție mică. Complexitatea nu vine din redare (un `iframe`), ci din trei lucruri: despachetarea arhivei `.zip`, implementarea „API-ului” SCORM pe care conținutul îl caută în fereastra părinte, și legarea scorului raportat de sistemul de XP existent (care e acum strict server-side și anti-fraudă).

Estimare: o funcționalitate medie-mare — aproximativ 3 etape de lucru, cu partea de anti-fraudă ca element cel mai sensibil.

## Ce construim

Un nou tip de exercițiu, `scorm`, care apare într-o lecție ca orice alt exercițiu. Adminul încarcă un pachet `.zip` SCORM 1.2, iar elevul îl parcurge pe web; scorul raportat de pachet se transformă în procent și XP, cu reluare de unde a rămas.

### 1. Import (panou admin)
- Câmp nou de upload `.zip` în editorul de exerciții.
- Arhiva se despachetează, se citește `imsmanifest.xml` pentru a afla fișierul de start (`resource[adlcp:scormtype=sco] href`) și titlul.
- Fișierele se urcă într-un bucket de stocare, sub un prefix unic per pachet.
- Se validează: doar SCORM 1.2, dimensiune maximă, prezența manifestului.

### 2. Redare (elev, web)
- Componentă nouă `ScormExercise`, afișată în lecție ca celelalte tipuri.
- Rulează conținutul într-un `iframe` (sandbox controlat) și expune `window.API` — obiectul pe care conținutul SCORM 1.2 îl caută urcând în ierarhia de ferestre.
- Implementăm metodele: `LMSInitialize`, `LMSGetValue`, `LMSSetValue`, `LMSCommit`, `LMSFinish`, `LMSGetLastError`.
- Elemente urmărite: `cmi.core.lesson_status`, `cmi.core.score.raw` / `score.max`, `cmi.core.session_time`, `cmi.suspend_data`, `cmi.core.lesson_location`.
- Pe mobil (nativ) exercițiul se sare cu un mesaj „disponibil pe web”, conform deciziei tale.

### 3. Progres, scor și XP
- Tabel nou pentru starea SCORM per elev per exercițiu (status, scor, suspend_data, timp), cu RLS: elevul își vede/scrie doar rândul propriu.
- Salvare la `LMSCommit`/`LMSFinish` plus autosave periodic, ca să meargă reluarea după întrerupere.
- XP: nu se acordă direct din client. Scorul SCORM se normalizează în procent și intră prin fluxul server-side existent (`award_progress`), care rămâne idempotent — XP doar la prima trecere sau la scor îmbunătățit. Astfel protecțiile anti-inflație XP rămân intacte.

## Riscuri și limite

- Un pachet SCORM poate raporta orice scor din interiorul lui — e conținut necontrolat rulat în browser. Mitigare: XP tot prin `award_progress`, cu plafon per exercițiu egal cu XP-ul definit de admin, și acordare o singură dată.
- Pachetele mari (video, imagini) consumă stocare; punem o limită de dimensiune la import.
- Pachetele care presupun `window.parent` peste domenii pot avea probleme; iframe-ul trebuie servit de pe aceeași origine sau cu politici clare.
- SCORM 2004 și xAPI/cmi5 nu sunt incluse; se pot adăuga ulterior.

## Detalii tehnice

- Tip nou în `SUPPORTED_EXERCISE_TYPES` (`src/hooks/useChapters.ts`) și în constrângerea CHECK de tip exercițiu din baza de date.
- Coloane noi pe exerciții pentru pachetul SCORM (prefix stocare, fișier de start, versiune).
- Bucket de stocare dedicat: citire publică (sau semnată) pentru elevi, scriere doar pentru admin.
- Despachetarea `.zip` se face în client, în panoul de admin, cu o bibliotecă de zip, apoi upload fișier cu fișier — evită o funcție edge care ar trebui să scrie zeci de fișiere.
- `ScormExercise` montează `window.API` înainte de a seta `src`-ul iframe-ului, altfel conținutul nu găsește LMS-ul și se oprește la inițializare.
- Randarea se adaugă în `src/pages/LessonPage.tsx` lângă celelalte tipuri, cu aceeași `ExerciseErrorBoundary`.

## Ordinea de implementare

1. Schema (tip exercițiu, coloane, tabel de stare, bucket + RLS).
2. Import în admin: upload zip, parsare manifest, urcare fișiere, previzualizare.
3. Redare la elev: `ScormExercise` + `window.API` + salvare stare.
4. Legarea scorului la XP prin fluxul server-side existent și testare cap-coadă cu un pachet real.
