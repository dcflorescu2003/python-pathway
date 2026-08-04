# Export PDF în secțiunea Bancă

## Ce se modifică
Se adaugă un buton „Export PDF” în secțiunea **Bancă** (EvalBankEditor), la nivel de fiecare lecție, lângă butoanele existente de import/export CSV. Butonul va exporta toate exercițiile lecției respective într-un PDF complet cu cerințe, variante de răspuns și răspunsurile corecte marcate.

## Locația butonului
- În `src/components/admin/EvalBankEditor.tsx`, în bara de acțiuni de la baza fiecărei lecții (unde există deja butoanele „Exercițiu nou”, `CsvImporter`, `EvalProblemsCsvImporter`).
- Butonul va fi afișat doar pentru lecțiile care conțin cel puțin un exercițiu.

## Conținutul PDF-ului
- Antet: titlul capitolului, titlul lecției, numărul total de exerciții și punctaj total (suma punctelor implicit 10/exercițiu, sau punctele definite dacă există).
- Pentru fiecare exercițiu, în ordinea din lecție:
  - Numărul, tipul (Quiz, Completare, Ordonare, A/F, Problemă, Răspuns deschis), punctajul.
  - Enunțul complet (sau afirmația pentru A/F).
  - Codul/șablonul de cod, dacă există.
  - Opțiunile de răspuns cu răspunsul corect marcat inline (bifă + text îngroșat) pentru quiz și A/F.
  - Pentru completare: spațiile goale și răspunsurile corecte acceptate.
  - Pentru ordonare: liniile în ordinea corectă, numerotate.
  - Pentru problemă: cerința, cazurile de test și soluția de referință.
  - Pentru răspuns deschis: cerința + răspunsul model, dacă există.
- Subsol cu numerotarea paginilor și titlul lecției.

## Detalii tehnice
- Se extinde `src/lib/testPdfExport.ts` cu o funcție nouă `exportEvalLessonToPdf(lesson, exercises, chapterTitle?)` care reutilizează helperii existenți pentru layout, word-wrap, page-break, blocuri de cod monospace și marcarea răspunsurilor corecte.
- Se păstrează fontul DejaVu Sans înregistrat pentru diacritice românești.
- Se adaugă starea de încărcare (`exportingLessonId`) și toast-uri de succes/eroare în `EvalBankEditor`.
- Numele fișierului: `lectie-<titlu-normalizat>.pdf`.

## Fișiere afectate
- `src/lib/testPdfExport.ts` – funcție nouă de export pentru lecții din bancă.
- `src/components/admin/EvalBankEditor.tsx` – buton nou și gestionarea stării de export.
