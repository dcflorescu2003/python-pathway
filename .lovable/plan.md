## Schimbare logică regenerare inimi

### Comportament nou
- Când userul rămâne la **0 inimi**, după **25 de minute** de pauză toate cele 5 inimi se reumplu automat.
- Dacă userul are între 1 și 4 inimi, **nu mai există regenerare automată parțială** — singurul refill rapid este reclama (rewarded ad), care continuă să dea +5 (max 2 ori/zi).
- Premium continuă să aibă inimi ∞ (neschimbat).
- Alternativ la cele 25 de minute, userul poate viziona o reclamă pentru reumplere imediată.

### Fișiere modificate

**1. `src/hooks/useProgress.ts`** — refactor `regenerateLives`:
- Constante:
  - `MAX_LIVES = 5` (neschimbat)
  - `FULL_REGEN_MS = 25 * 60 * 1000` (înlocuiește `REGEN_INTERVAL_MS`)
- Logică nouă în `regenerateLives(p)`:
  - Dacă `isPremium` sau `lives >= MAX_LIVES` → return p (neschimbat).
  - Dacă `lives === 0` și au trecut ≥ 25 min de la `livesUpdatedAt` → set `lives = MAX_LIVES`, update `livesUpdatedAt`.
  - Altfel → return p neschimbat (fără regenerare parțială).
- Locul unde se setează `livesUpdatedAt` la pierderea unei inimi (linia 352) rămâne la fel, dar îl ajustez astfel încât marker-ul de 25 min să se ancoreze de momentul când userul ajunge la **0**, nu de la 5→4. Concret: setez `livesUpdatedAt = now` când `newLives === 0` (în loc de când `prev.lives === MAX_LIVES`). Asta garantează că cele 25 minute pornesc exact când rămâi fără inimi.

**2. `src/components/RefillLivesDialog.tsx`** — mesajul de pauză:
- Schimb textul: „Sau așteaptă **25 de minute** și toate cele 5 inimi se reîncarcă automat."
- Elimin partea cu „20 de minute / 100 de minute".
- Mesajul cu pauza apare doar dacă `lives === 0` (altfel nu se aplică); dacă userul are între 1–4, arăt o variantă: „Reumplerea automată are loc doar după ce rămâi fără inimi." — sau (mai simplu) păstrez un singur text universal: „După ce rămâi fără inimi, toate se reîncarcă în 25 de minute."

**3. `src/pages/LessonPage.tsx`** (linia 176) — mesajul afișat când userul rămâne fără inimi în lecție:
- Înlocuiesc: „Așteaptă **25 de minute** pentru a-ți reumple toate inimile sau vizionează o reclamă pentru reumplere imediată."

**4. `src/components/WatchAdForLivesButton.tsx`** (linia 80) — sub-textul butonului:
- Înlocuiesc: „Sau așteaptă **25 de minute** după ce rămâi fără inimi pentru reumplere completă."

### Detalii tehnice (technical)
- `livesUpdatedAt` continuă să fie persistat în Supabase (`profiles.lives_updated_at`) și local. Logica server-side rămâne neutră — regenerarea e calculată client-side la încărcare, ca acum.
- Update memory `mem://features/gamification/lives-system`: schimb regula din „regenerare graduală 1/20 min" în „regenerare completă după 25 min de la 0".
- Nu necesită migrație DB.
