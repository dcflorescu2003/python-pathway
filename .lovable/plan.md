# Statistici corecte + tabel „Situația elevilor” lizibil pe PC

## Ce am găsit (verificat în baza de date, clasa ta IX A)
| Indicator | Pe ecran | Real |
|---|---|---|
| Activitate în ultimele 7 zile | 0 | 534 finalizări |
| Probleme rezolvate | 355 | 1.094 |
| Lecții + probleme total | ~1.000 | 1.646 (de la înscriere) |

Cifrele de pe ecran sunt exact ce se obține când se citesc doar primele 1.000 de rânduri (cele mai vechi) — deci „0 în 7 zile” și „11 elevi cu risc inactivi” sunt false. Remedierea pentru asta e deja făcută în proiect, dar site-ul public (pyroskill.info) rulează probabil versiunea dinainte, nepublicată.

## Ce facem
1. Verific pagina de statistici în previzualizare, logat ca tine, și compar fiecare cartonaș cu cifrele reale din baza de date (elevi activi, 7 zile, lecții, probleme, teste predate, elevi cu risc, parcurgere, competența slabă). Corectez orice diferență rămasă.
2. Cartonașul „Recapitulări” arată 0 — verific dacă recapitulările sunt salvate cu alt format de identificare și, dacă da, le număr corect.
3. Tabelul „Situația elevilor”:
   - înălțime limitată (aprox. 60% din ecran) cu derulare internă și capul de tabel fix sus;
   - coloana „Elev” fixă în stânga la derularea orizontală;
   - text mai compact, numere aliniate, „Ultima activ.” afișat scurt (ex. „acum 3 zile”);
   - coloanele mai puțin importante (Recap., Streak, XP) ascunse pe ecrane mai înguste, cu indicatorul de risc păstrat.
4. Test automat pentru regula „activitate în ultimele 7 zile” și numărarea problemelor.
5. La final îți spun să publici site-ul ca să apară corect pe pyroskill.info. Nu e nevoie de update în magazine pentru web; aplicațiile primesc la următorul update.

## Detalii tehnice
- `src/components/teacher/ClassAnalytics.tsx`: wrapper `max-h-[60vh] overflow-auto`, `TableHeader` sticky, prima coloană `sticky left-0 bg-card`, `hidden xl:table-cell` pentru coloane secundare.
- `src/lib/classAnalytics.ts`: verificare `classifyCompletion` pentru recapitulări; test în `src/lib/classAnalytics.test.ts`.
