## Problemă

~143 exerciții quiz/truefalse din capitolele 2, 3, 5, 6 au întrebări scurte („Ce se afișează?") fără `code_template`. Codul nu există în baza de date — singura sursă sunt CSV-urile originale ale lecțiilor.

## Soluție: script de „repair" pentru CSV-uri existente

Adaug un buton nou „🔧 Repară code_template din CSV" în `CsvLessonImporter` (alături de „Import lecție CSV"), care:

1. Cere un fișier CSV de lecție (`[META]` + `[EXERCISES]`).
2. Caută lecția existentă în baza de date după `title` (din `[META]`) și `chapter_id` curent — nu creează lecție nouă.
3. Parsează exercițiile cu parserul existent.
4. Le pune în ordine după `sort_order` și le aliniază 1-la-1 cu exercițiile existente din DB.
5. Pentru fiecare pereche, dacă tipul și întrebarea se potrivesc (match exact sau primele 60 caractere) și DB are `code_template = NULL` iar CSV-ul are valoare → face UPDATE doar pe `code_template`.
6. Afișează un preview înainte: „X exerciții vor fi reparate, Y sărite (deja au cod / nu se potrivesc)".
7. Nu atinge nimic altceva — nu opțiuni, nu explicații, nu competențe, nu sort_order.

## Workflow pentru tine

1. Mergi în Admin → Capitolul 2 → lecția X → click „Repară code_template".
2. Încarci CSV-ul original al lecției.
3. Vezi preview-ul (câte rânduri se repară).
4. Click „Repară" → UPDATE doar pe coloana `code_template`.
5. Repeți pentru fiecare lecție afectată (sau, dacă vrei bulk, putem extinde la „încarcă mai multe fișiere odată" într-un pas următor).

## Detalii tehnice

- Fișier nou: `src/components/admin/CsvCodeTemplateRepair.tsx`.
- Buton integrat în `LessonEditor` (sau acolo unde apare deja `CsvLessonImporter`).
- Folosește `parseLessonCSV` existent.
- Match conservator: tip identic + question normalizat (trim + lowercase + primele 80 char). Dacă nu se potrivește exact, exercițiul e marcat „skipped" și ți se arată în preview ca să decizi manual.
- Update SQL: `UPDATE exercises SET code_template = $1 WHERE id = $2 AND code_template IS NULL` (siguranță extra să nu suprascrie nimic).
- Batch: toate update-urile într-un `Promise.all`.

## Ce NU face

- Nu creează exerciții noi.
- Nu șterge nimic.
- Nu rescrie întrebări, opțiuni, explicații sau competențe.
- Nu atinge exercițiile care au deja `code_template`.

După ce confirmi planul și-l implementez, îmi încarci primul CSV ca să-l testăm pe o lecție.

Confirm, dar vezi sa nu se mai intample pentru viitoarele csv-uri. As mai vrea sa fie marcate lectiile care au nevoie de reparatie