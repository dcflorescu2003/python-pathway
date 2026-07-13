## Audit flux testare + îmbunătățiri

### 1. Ce merge bine astăzi

- **Scalabilitate 30 elevi**: fiecare elev are un rând propriu în `test_submissions` (unique per assignment+student), grading rulează per‑submisie într‑un edge function, nu există puncte de contenție. 30 elevi simultan = ~30 request‑uri independente, fără probleme.
- **Rezultate automate**: la submit se cheamă `grade-submission`, care corectează automat quiz/fill/order/truefalse/problem și pune scorurile. Profesorul le vede în timp real în `TestResults`.
- **Anti‑cheat existent**: fullscreen opțional, blocare Esc/F11/DevTools, auto‑submit la ieșire din tab / blur / app background (Capacitor pause + polling `hasFocus`), sendBeacon la închidere browser, listener nativ Android pt. window focus.
- **Timer rezistent la refresh**: `started_at` e salvat pe submisie și timer‑ul se recalculează din el la fiecare load — deci refresh sau schimb de device în timpul testului păstrează timpul rămas corect.
- **Draft local**: răspunsurile se salvează în `localStorage` la fiecare 30s + pe visibilitychange + pe beforeunload.

### 2. Probleme și riscuri identificate

1. **Reluare după pierdere internet e blocată**: dacă elevul rămâne fără net și iese din tab (sau intră un apel), `triggerLeave` cheamă `handleSubmit` → `mutateAsync` eșuează pe rețea → `submitted` revine la `false`, dar `beforeunload` sendBeacon poate marca deja `submitted_at` server‑side cu răspunsuri parțiale. Când revine online, `submitted_at` există → e trimis pe pagina finală, fără șansă de reluare. Singura opțiune azi: profesorul apasă „Permite reluarea", care **șterge tot** și pornește de la zero.
2. **Nu există „reluare de unde a rămas"**: `useAllowRetake` face doar reset total (delete answers + submission). Profesorul nu poate alege între „restart" și „continuă cu timpul rămas".
3. **Variantă A/B aleasă client‑side** (`Math.random()`): elevii pot refresha până primesc varianta dorită înainte să existe rândul de submisie. Ar trebui hotărâtă server‑side, deterministic (hash pe user_id+assignment) sau setată exclusiv la INSERT prin RPC.
4. **Fetch item‑uri secvențial** (`for…await` pe fiecare exercițiu/problem în `TakeTestPage`): la teste cu 20+ itemi și rețea slabă, load‑ul durează. Ar trebui `Promise.all`.
5. **Auto‑submit prea agresiv**: 1s afară din tab = submit final. O notificare push, un apel scurt, o schimbare de rețea WiFi→4G care întrerupe focusul → test pierdut. Ar trebui: (a) grace period configurabil (5–10s), (b) număr de avertismente înainte de submit final (2 warnings + al 3‑lea = submit), (c) diferențiere între „ecran stins scurt" și „schimbat aplicația".
6. **Fără enforcement server al timpului**: `grade-submission` acceptă și submisii trimise după `time_limit_minutes`. Un client modificat poate trimite oricând. Trebuie verificat `started_at + time_limit + grace` pe server și respins/tăiat scor dacă e depășit masiv.
7. **Draft rămâne doar local**: dacă elevul schimbă device (telefon → laptop), pierde răspunsurile. Idempotent draft push în `test_answers` (fără `submitted_at`) sau într‑o coloană `draft_answers jsonb` ar rezolva.
8. **Beacon fără auth**: `navigator.sendBeacon` nu trimite headerele Supabase; edge function `grade-submission` acceptă anonim doar via body‑ul submission_id. Un elev poate declanșa submit forțat pentru altă submisie dacă ghicește UUID‑ul. De verificat/închis.

### 3. Ce vreau să construiesc

**A. Reluare test după deconectare (feature cheie)**

- Coloană nouă `test_submissions.status` cu valori `in_progress | submitted | interrupted`.
- Când auto‑submit eșuează pe rețea sau elevul iese și apoi revine în app cu submisie ne‑finalizată → marcăm `status='interrupted'`, NU setăm `submitted_at`.
- Elevul care deschide din nou linkul unei submisii `interrupted` → primește ecran „Testul tău a fost întrerupt. Timp rămas: X:XX. Continuă." Timer‑ul continuă din `started_at` (deja funcționează).
- Profesorul, în `TestResults`, primește pentru submisii `interrupted` **două** butoane în loc de unul:
  - `Permite reluare de unde a rămas` (păstrează answers + started_at, doar clear `status`);
  - `Restart complet` (comportamentul actual `useAllowRetake`).
- Beacon `browser_closed` NU mai marchează `submitted_at` — doar `status='interrupted'` + salvează answers ca draft server‑side.

**B. Draft server‑side**

- Coloană `test_submissions.draft_answers jsonb`.
- Salvare la fiecare 30s și pe visibilitychange (upsert idempotent, RLS: doar owner poate scrie propria submisie in_progress).
- La load, dacă există draft → hidratează `answers` state cu union (server > local).

**C. Anti‑cheat mai puțin ostil**

- Grace 3s (nu 1s) înainte de trigger. Configurabil per test în `TestBuilder` (`strict / normal / relaxed`).
- Contor de avertismente: primele 2 ieșiri = toast avertisment „Ai părăsit testul de N ori. La a 3‑a, testul va fi trimis." A 3‑a = submit forțat. Contorul salvat în submission (`leave_count`).
- Profesorul vede în rezultate câte avertismente a primit fiecare elev.

**D. Hardening server**

- `grade-submission`: verifică `started_at + time_limit + 30s grace` — dacă e depășit cu > 5 min, respinge; între time_limit și +5min, acceptă dar marchează `late_submission=true`.
- Variant assignment mutat într‑un RPC `start_test_submission(p_assignment_id)` care alege deterministic (hash) și insertează cu SECURITY DEFINER.
- Beacon: trimite `submission_id` + un `session_token` scurt generat la start; validat pe server.

**E. Micro‑optimizări scalabilitate 30+**

- Fetch itemi cu `Promise.all` în loc de secvențial.
- Query batch pentru `exercises`/`problems`: un singur `.in('id', ids)` în loc de N.

### 4. Ce răspund direct fără cod

- **Ajung rezultatele automat?** Da, imediat ce elevul apasă „Trimite" (sau la auto‑submit). Corectarea rulează pe server; profesorul vede scorurile fără să facă nimic — cu excepția itemilor cu evaluare AI (cod deschis) unde AI‑ul propune scor și profesorul poate corecta manual.
- **Rezistă la 30 elevi?** Da, arhitectura e per‑submisie. Singura optimizare notabilă e evitarea celor N queries secvențiale la load (punctul E).

### Tehnic

- Migrare: `ALTER TABLE test_submissions ADD COLUMN status text DEFAULT 'in_progress', ADD COLUMN draft_answers jsonb, ADD COLUMN leave_count int DEFAULT 0, ADD COLUMN late_submission boolean DEFAULT false;`
- RPC nou: `start_test_submission(uuid) RETURNS test_submissions` (variant deterministic + INSERT).
- RPC nou: `resume_interrupted_submission(uuid)` (teacher-only, clear status).
- Edit `TakeTestPage.tsx`: draft push server, resume screen, warning counter, Promise.all pentru itemi.
- Edit `grade-submission/index.ts`: verificare timp server, session_token.
- Edit `TestResults.tsx`: 2 butoane (reluare parțială / restart total) + afișare `leave_count`.
- Edit `TestBuilder.tsx`: opțiune strictețe anti‑cheat.
- Edit `useTests.ts`: hooks noi `useAllowResume`, `useUpdateSubmissionDraft`.

### Ce NU includ (rămân deciziile tale)

- Blocare copy‑paste (poate deveni frustrantă pt. cod).
- Webcam proctoring.
- Randomizare ordine răspunsuri quiz per elev (există shuffle pe itemi).