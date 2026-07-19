## Diagnostic

Am verificat testul din imagine (`38c4cff6…`, „2 Test functii – 2 numere, grile 1 poblema"):
- Are 22 de itemi în DB (11 pentru varianta A, 11 pentru B) — deci itemii **există**.
- Ambele assignments ale acestui test au `window_minutes = 10`, iar `assigned_at` a fost 18:17 / 18:20.
- RPC-ul `get_test_items_for_student` returnează 0 rânduri când `assigned_at + window_minutes < now()`.

Rezultat: fereastra de 10 minute a expirat înainte ca elevul să deschidă testul, iar RPC-ul nu mai trimite niciun item → în UI apare „1/0" și niciun conținut, dar cu buton „Trimite testul" activ.

Sunt două probleme reale:

1. **Backend**: `window_minutes` blochează și submissions deja începute. Un elev care a intrat în test la minutul 9 și încă mai are timp pe cronometru (ex. `time_limit_minutes`) pierde brusc toate întrebările la minutul 10. La fel, dacă elevul deschide testul chiar după expirare, ecranul e complet gol fără nicio explicație.
2. **Frontend**: când RPC-ul întoarce 0 itemi, `TakeTestPage` continuă să randeze UI-ul de test (header, „0/0", buton „Trimite"), în loc să afișeze un mesaj clar.

## Modificări propuse

### 1. Migrație SQL — `get_test_items_for_student`
- Dacă elevul are deja un `test_submissions` **nesubmis** pentru acest assignment (`submitted_at IS NULL`), returnează itemii indiferent de `window_minutes` (cronometrul propriu al testului rămâne singura limită).
- Dacă nu are submission, păstrează gate-ul pe fereastră (fereastra e „interval de start", nu „interval de rezolvare").
- Comportamentul pentru assignments fără `window_minutes` rămâne neschimbat.

### 2. `src/pages/TakeTestPage.tsx`
- După apelul RPC, când `testItems.length === 0` **și nu există** o submission în derulare, afișează un ecran dedicat (card centrat) cu mesajul:
  - „Testul nu mai este disponibil. Fereastra de începere a expirat. Contactează profesorul pentru redeschidere."
  - Buton „Înapoi acasă".
- Nu mai randa header-ul cu „0/0" și nu afișa butonul „Trimite testul" pe test gol.

### 3. Verificare finală
- Confirmare cu un query rapid că RPC-ul returnează itemii pentru un submission în curs după expirare.
- Fără schimbări de schemă în afara funcției; fără impact pe teacher UI.

Nu ating logica de anti-cheat, draft-uri, roster sau grading.