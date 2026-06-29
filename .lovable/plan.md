## Diagnoză

Verificat cloud-ul pentru `dcflorescu2003@gmail.com`:

- **Capitol 5** (`ch3`): 27 lecții completate în cloud, exact ce vede web-ul. Mobile arată 28 → lecția a 28-a există DOAR în `localStorage`-ul telefonului, nu a ajuns niciodată în baza de date.
- Toate cele 27 înregistrări cloud au scor 100; ultima netrecută în ordine este "Stiva – idee generală" (sort_order 27). Probabil aceea este lecția făcută pe mobil.

Cauza:
1. `completeLesson` (din `useProgress.ts`) face `syncToCloud` într-un `.catch(console.error)` fire-and-forget. Dacă upload-ul cade (rețea slabă, JWT expirat, switch de tab Android), eroarea se loghează și lecția rămâne doar local. Nu există retry, nu există queue.
2. `resyncFromCloud` (butonul "Sincronizează lecțiile" din Cont) este **doar cloud → local**. Apăsarea lui pe web nu poate „aduce” o lecție care există doar pe telefon.
3. Pe web nu apare niciodată pentru că web-ul nu are local entry-ul respectiv — nimeni nu „împinge” progresul telefonului spre cloud retroactiv.

## Plan

### 1. Sincronizare bidirecțională la `resyncFromCloud`
Înainte de a citi din cloud, parcurge `completedLessons` din local; orice intrare cu `completed: true` care lipsește din cloud (sau are scor mai mic) → `upsert` în `completed_lessons` (reutilizează helper-ul `syncToCloud` existent care deja face „best score wins"). Apoi continuă cu fetch-ul normal cloud → local. Butonul devine astfel "Sincronizare completă" (push + pull).

### 2. Push automat la pornirea aplicației pe mobil
În `loadCloud` (`useEffect` care rulează la login), condiția `localHasExtras` deja sesizează când local are mai multe completări decât cloud și cheamă `syncToCloud`. Dar `syncToCloud` doar face `upsert` pe lecțiile din lista finală — funcționează doar dacă lecția există și în merged state. Confirm: merge-ul face union, deci OK. Voi adăuga totuși logging explicit ("[useProgress] pushing N local-only lessons to cloud") și mă asigur că rulează și pe focus/visibility (acum rulează doar la primul login per sesiune), ca la următoarea deschidere a aplicației pe mobil să se uploadeze automat lecțiile rămase în urmă.

### 3. Retry minim la `completeLesson`
Înfășurăm apelul `syncToCloud` într-un wrapper cu 1-2 reîncercări exponențiale (1s, 3s). Dacă tot eșuează, marcăm un flag în `localStorage` (`pyro-progress-pending-sync:<userId>`) pe care `loadCloud` și `resyncFromCloud` îl folosesc pentru a forța un push complet la următoarea ocazie.

### 4. Recuperare manuală pentru contul curent
După deploy, utilizatorul deschide aplicația pe telefon o singură dată (cu net) → push-ul automat va trimite lecția lipsă în cloud, iar pe web va apărea la următorul refresh / resync.

## Detalii tehnice

Fișiere modificate:
- `src/hooks/useProgress.ts` — `resyncFromCloud` devine push + pull; `completeLesson` primește retry + pending flag; `loadCloud` (useEffect login) și handler-ul de visibility verifică flag-ul `pending-sync` și forțează push.
- Niciun schimb de schemă DB (RLS pe `completed_lessons` deja permite INSERT/UPDATE pentru `auth.uid()=user_id`).

Verificare după implementare:
- Log în consolă: "[useProgress] pushed N local-only lessons" când se face push.
- Test: pe un cont gol creezi local un entry fals (`completedLessons["test"] = {score:100, completed:true}`), apeși "Sincronizează" → entry-ul apare în `completed_lessons` în DB.
