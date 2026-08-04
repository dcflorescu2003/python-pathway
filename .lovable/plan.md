# Fix: afirmația lipsește la itemii Adevărat/Fals în exportul PDF

## Problema
În `src/lib/testPdfExport.ts`, textul itemului se scrie o singură dată cu
`ex.question || ex.statement || ex.title`. La exercițiile Adevărat/Fals, unde există
și `question` (cerința), și `statement` (afirmația de evaluat), se afișează doar
cerința — afirmația nu ajunge niciodată în PDF.

## Soluția
În ramura `type === "truefalse"`:
- după enunț (și după blocul de cod, dacă există), se scrie afirmația într-un bloc
  distinct, cu etichetă „Afirmație:” și text ușor evidențiat, folosind
  `stripMarkup(ex.statement ?? ex.custom_data?.statement)`;
- se evită dublarea când `question` și `statement` sunt identice sau când
  `question` lipsește (caz în care `statement` a fost deja scris ca enunț).

Nicio altă modificare de layout; se aplică automat atât la exportul de lecție din
Bancă, cât și la exportul testelor predefinite, pentru că ambele folosesc aceeași funcție.

## Fișier afectat
- `src/lib/testPdfExport.ts`
