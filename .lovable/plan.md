## Plan

1. **Repar notarea automată pentru teste**
   - Fac funcția de notare să fie idempotentă: dacă răspunsurile există deja, nu mai eșuează la re-trimitere / autosubmit / renotare.
   - Corectez submiterea prin `sendBeacon`, care acum poate ajunge fără autentificare și lasă submiterea cu răspunsuri bifate dar `auto_graded=false`, `max_score=0`.
   - La renotare, recalculez mereu `score`, `total_score`, `max_score`, `status='submitted'`, inclusiv pentru submitteri vechi rămase într-o stare inconsistentă.

2. **Verific și aliniez formatele de răspuns**
   - Standardizez citirea pentru quiz / adevărat-fals: accept `selected`, `selected_option_id`, boolean/string unde e cazul.
   - Pentru completări, folosesc aceeași logică robustă ca în lecții: virgule în ghilimele/paranteze nu sunt tratate ca separator de variante.
   - Pentru match/order, păstrez punctaj parțial dar elimin situațiile în care UI arată „corect” iar scorul rămâne 0 din cauza unei chei diferite.

3. **Aplic logica de ordonare ca în lecții**
   - În `grade-submission`, pentru exercițiile `order`, liniile cu text identic vor fi interschimbabile.
   - Păstrez și suportul existent pentru grupuri, dacă există.
   - Ajustez și afișarea în rezultate ca liniile identice să nu fie marcate greșit când sunt inversate între ele.

4. **Îmbunătățesc afișarea rezultatelor pentru profesor și elev**
   - Profesorul și elevul vor vedea clar pentru fiecare item: cerință, răspuns elev, răspuns corect, feedback.
   - Pentru quiz, dacă opțiunea selectată este corectă dar scorul e 0, UI va semnala explicit „necesită renotare” în loc să pară contradicție.
   - Pentru elev, păstrez regula existentă: răspunsurile corecte apar doar după publicarea scorurilor.

5. **Corectez datele deja afectate**
   - Adaug o migrație/RPC de backfill care re-notează submitterile deja trimise dar rămase cu `auto_graded=false`, `max_score=0` sau `status` greșit.
   - Rulez verificări pe datele recente ca să confirm că itemul din screenshot nu mai rămâne bifat corect cu 0 puncte.

## Detalii tehnice

- Fișiere vizate: `supabase/functions/grade-submission/index.ts`, `src/hooks/useTests.ts`, `src/pages/TakeTestPage.tsx`, `src/components/account/SubmissionReviewRow.tsx`, `src/components/teacher/TestResults.tsx`.
- Backend: migrație pentru funcții/helper-e de recalcul sau backfill, fără expunerea soluțiilor către elev înainte de publicare.
- Cauză confirmată parțial în date: există submitere trimisă cu răspunsuri, dar `auto_graded=false`, `status='in_progress'`, `max_score=0`; deci problema nu pare cauzată doar de faptul că elevul a părăsit clasa, ci de un traseu de submit/autosubmit care nu finalizează notarea.