# Export PDF pentru testele din Bancă (Admin)

## Ce se adaugă
Un buton nou „Export PDF” lângă butoanele de previzualizare/editare/ștergere ale fiecărui test predefinit din secțiunea Bancă a interfeței de admin. La click, se generează și se descarcă direct un PDF cu testul complet.

## Conținutul PDF-ului
- Antet: titlul testului, capitolul, dificultatea, limita de timp, punctajul total.
- Pentru fiecare item, în ordinea din test: numărul, tipul (Quiz, Adevărat/Fals, Completare, Ordonare, Cod, Răspuns deschis), punctajul, enunțul complet și, unde există, template-ul de cod.
- Variantele de răspuns listate integral, cu răspunsul corect marcat inline (bifă + text îngroșat), conform tipului:
  - Quiz: toate opțiunile, cea corectă bifată.
  - Adevărat/Fals: afirmația + valoarea corectă marcată.
  - Completare: codul cu spații, urmat de răspunsurile corecte pentru fiecare spațiu (inclusiv variantele acceptate separate prin virgulă).
  - Ordonare: liniile în ordinea corectă, numerotate.
  - Cod/Problemă: cerința, cazurile de test și soluția de referință.
  - Răspuns deschis: cerința + răspunsul model, dacă există.
- Testele cu variante (A/B, Nr.1/Nr.2) se exportă în același PDF, cu secțiuni separate și titlu de variantă înainte de fiecare grup de itemi.
- Subsol cu numerotarea paginilor.

## Detalii tehnice
- Librărie nouă: `jspdf` (generare text-based, nu screenshot) — text selectabil, fișiere mici, fără dependență de randarea DOM.
- Font Unicode înregistrat (DejaVu Sans) pentru diacriticele românești; fonturile implicite jsPDF le strică.
- Fișier nou `src/lib/testPdfExport.ts` cu funcția `exportTestToPdf(test, items, exercises)`: layout, word-wrap, page-break automat, blocuri de cod cu font monospace și fundal gri.
- În `src/components/admin/PredefinedTestEditor.tsx`: buton nou pe rândul testului; datele se preiau cu hook-urile existente (`usePredefinedTestItems`, `useAllEvalExercises`) pentru testul selectat, apoi se apelează exportul. Toast de succes/eroare.
- Numele fișierului: titlul testului normalizat, ex. `test-liste-cap2.pdf`.
- Marcarea răspunsurilor corecte reutilizează aceleași câmpuri folosite deja la corectare, ca să nu apară diferențe față de barem.
