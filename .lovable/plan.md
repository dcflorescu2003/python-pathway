## Problem

Regenerarea inimilor (0 → 5 după 30 min) se face **doar pe client**, în `useProgress.ts`:
- `parseStoredProgress` (la încărcarea din localStorage)
- un `setInterval` la fiecare 60s, cât timp aplicația e deschisă

Consecințe pentru un user free care rămâne fără inimi și închide aplicația:
1. Pe cloud, `profiles.lives = 0` și `lives_updated_at` rămân la valoarea din momentul epuizării — nimic nu le actualizează cât timp app-ul e închis.
2. La redeschidere, `loadCloud` face `mergeProgress(local, cloud)` care e **cloud-authoritative pe `lives`** (linia 651) — deci dacă local s-a auto-refăcut, cloud-ul „0" îl suprascrie înapoi la 0.
3. Refill-ul apare abia la următorul tick de 60s al intervalului — dacă userul stă pe ecranul de start câteva secunde și iese, rămâne tot cu 0.

Asta explică perfect simptomul: „ieri 0 inimi, azi tot 0".

## Soluție (două straturi)

### 1. Client: aplică `regenerateLives` imediat după merge-ul cu cloud-ul

În `src/hooks/useProgress.ts`:
- după `mergeProgress(localProgress, cloudProgress)` în `loadCloud` (în jurul liniei 263), rulează `regenerateLives` pe rezultat înainte de `setProgress` / `saveLocalProgress`. Dacă refill-ul se aplică, scrie și în cloud (`lives`, `lives_updated_at`).
- același tratament în path-ul `refetch` din focus/visibility (liniile 288-322): după ce construiește `merged`, treci-l prin `regenerateLives` și sincronizează în cloud dacă lives s-a schimbat.

Efect: la prima deschidere a app-ului după 30+ min cu 0 inimi, userul vede instant 5/5, fără să aștepte tick-ul de 60s.

### 2. Server: cron care reface inimile chiar dacă app-ul nu e deschis

Edge function nouă `refill-lives` (cu `verify_jwt = false`, ca celelalte joburi programate, folosind `checkSchedulerSecret`):

```ts
UPDATE profiles
SET lives = 5, lives_updated_at = now()
WHERE lives = 0
  AND is_premium = false
  AND lives_updated_at < now() - interval '30 minutes';
```

Trigger-ul existent `mark_lives_refilled` setează automat `last_life_refill_at`, iar jobul existent `send-lives-refilled` va trimite notificarea push „Vieți pline ❤️".

Programare cu `pg_cron` la fiecare 5 minute (rezoluție suficientă pentru un timer de 30 min), via `supabase--insert` (nu migration, conține anon key project-specific).

## Fișiere atinse

- `src/hooks/useProgress.ts` — apel `regenerateLives` în `loadCloud` și în `refetch`, cu writeback condiționat în Supabase.
- `supabase/functions/refill-lives/index.ts` — nou; UPDATE bulk pe `profiles`.
- `supabase/config.toml` — `verify_jwt = false` pentru `refill-lives`.
- Cron `pg_cron` (rulat o singură dată prin `supabase--insert`): apel la `refill-lives` la 5 minute.

## Out of scope

- Logica nativă (Capacitor) și fluxul „reward ad" rămân neschimbate.
- Premium / verified teachers (`hasUnlimitedLives`) nu sunt afectați — UPDATE-ul filtrează `is_premium = false` și nu atinge `teacher_status`; clientul deja ignoră `lives` când `hasUnlimitedLives` e true.
