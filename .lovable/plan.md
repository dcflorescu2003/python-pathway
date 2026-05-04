# Plan: Limită 3 reclame/zi + auto-refill la 30 min

## Modificări

### 1. `supabase/functions/reward-life/index.ts`
- `MAX_ADS_PER_DAY`: 2 → **3**
- Când limita e atinsă, returnează un payload mai descriptiv (status `429`) cu un cod `LIMIT_REACHED` ca să-l putem trata frumos pe client.

### 2. `src/hooks/useProgress.ts`
- `FULL_REGEN_MS`: `25 * 60 * 1000` → **`30 * 60 * 1000`**
- Actualizez comentariile (25 min → 30 min).

### 3. `src/components/WatchAdForLivesButton.tsx`
- Înainte de `showRewarded`, fac un pre-check: dacă `data.error === "Daily ad limit reached"` (sau dacă încercăm și primim 429), arătăm un toast prietenos:
  > "Ai vizionat azi maximul de 3 reclame. Fă o pauză de 30 de minute — inimile se reîncarcă singure."
  
  În loc de mesajul actual "Edge Function returned a non-2xx status code".
- Schimb textul informativ: "25 de minute" → **"30 de minute"**.
- Opțional: dacă știm deja (din profile) că `ads_watched_today >= 3`, ascundem butonul și afișăm direct mesajul de pauză. Pentru asta, primim opțional `adsWatchedToday` din parent (RefillLivesDialog îl deține deja prin profile fetch — dar pentru simplitate, ne bazăm pe răspunsul edge function și gestionăm eroarea curat).

### 4. `src/components/RefillLivesDialog.tsx`
- Text: "25 de minute" → **"30 de minute"**.
- (Buton-ul interior se ocupă deja de logica de limită.)

## UX flow după limită atinsă
1. User apasă "Vizionează reclamă" a 4-a oară.
2. Edge function răspunde 429 cu `error: "Daily ad limit reached"`.
3. Client afișează toast neutru (nu roșu de eroare):
   > **"Limita zilnică atinsă"** — "Ai folosit toate cele 3 reclame de astăzi. Fă o pauză de 30 de minute — inimile se reîncarcă automat după ce rămâi fără ele."
4. Butonul rămâne, dar utilizatorul știe că trebuie să aștepte.

## Note tehnice
- Nu schimbăm schema DB — `ads_watched_today` și `ads_last_reset` există deja.
- Auto-refill timer (30 min) e ancorat de momentul în care `lives` ajunge la 0 (`lives_updated_at`), exact ca acum.
- Nu e nevoie de migrare; doar deploy edge function + redeploy mobil cu noul JS.
