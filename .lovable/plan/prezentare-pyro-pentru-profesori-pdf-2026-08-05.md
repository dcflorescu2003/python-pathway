# Prezentare PyRo pentru profesori (PDF)

## Obiectiv

Generez o prezentare PDF scurtă (5-7 slide-uri), în limba română, destinată profesorilor de informatică, care prezintă beneficiile principale ale aplicației PyRo pentru gestionarea claselor, testelor și evaluării elevilor.

## Conținut planificat

1. **Slide 1 — Copertă**
  - Logo PyRo, titlu "PyRo pentru profesori", subtitlu care anunță suita de unelte pentru clasă.
2. **Slide 2 — Clase și elevi**
  - Creezi clase, generezi cod scurt de înrolare, elevii se alătură cu numele real.
  - Screenshot: manager de clase / cod de înrolare.
3. **Slide 3 — Teste și Eval Bank**
  - Alegi din banca de exerciții predefinite sau construiești teste custom (quiz, true/false, fill-in, cod).
  - Screenshot: builder de teste / bancă de exerciții.
4. **Slide 4 — Corectare automată + AI**
  - Răspunsurile fixe se notează instant. Codul scris liber poate fi evaluat de AI (Gemini).
  - Screenshot: rezultate test cu feedback AI.
5. **Slide 5 — Date statistice și competențe**
  - Grafice per clasă și per elev, profil de competențe CG/CS/M, export CSV/PDF.
  - Screenshot: analitice clasă sau profil de competențe.
6. **Slide 6 — Planuri și început rapid**
  - Free / Premium / AI Teacher. Invitație la înregistrare gratuită.
  - CTA final: link către aplicație.

## Pași de execuție

1. **Capture screenshot-uri** din preview-ul aplicației pentru secțiunile profesorului:
  - Class Manager (creare clasă + cod)
  - Test Builder / Eval Bank
  - Test Results / AI grading
  - Class Analytics sau Competency Profile
2. **Opțional: aplică frame-uri de produs** pe screenshot-uri pentru un look consistent (product-shot skill).
3. **Generează PDF** cu reportlab, folosind paleta proiectului (fundal închis #0F1219, accente verde/cyan, font monospace pentru snippet-uri).
4. **QA vizual**: convertește fiecare pagină în imagine și verifică marginile, textul decupat, contrastul și alinierea.
5. **Livrare**: salvează în `/mnt/documents/` și arată artifactul.

## Notă de design

- Stilul urmează identitatea PyRo: dark mode, font monospace pentru elementele de cod, accente neon green/cyan.
- Textul este în română, concis, maxim 3-4 bullet-uri per slide.
- Fiecare slide cu screenshot pune imaginea pe partea dreaptă sau jos, iar textul pe stânga/sus, cu suficient spațiu de respirație.  
  
Din Slide 6 scoatem planurile si preturile