## Problema

1. **Cron-ul există deja** (`send-streak-reminder-daily`) dar rulează la **17:00 UTC** (≈19:00–20:00 ora României) — adică seara, nu dimineața. De asta nu primești notificare dimineața.
2. **Logica funcției e prea strictă**: trimite doar utilizatorilor cu `last_activity_date = ieri`. Dacă ai sărit deja o zi (cum e cazul tău: ultima activitate 27-04, azi 29-04), nu mai primești nimic — exact când ai mai mare nevoie de un ghiont.
3. Mesajul actual spune "ai X zile consecutive", ceea ce sună ciudat dimineața când utilizatorul tocmai s-a trezit.

## Soluție

### 1. Schimbă ora cron-ului la dimineață (ora României)
- Nou orar: **`0 6 * * *`** = 06:00 UTC = **09:00 ora României** (08:00 iarna).
- E o oră caldă: după trezire, înainte de școală/muncă, când utilizatorul își poate încadra rapid o lecție.

### 2. Extinde logica funcției `send-streak-reminder`
Trimite notificare în 2 cazuri:
- **A. Streak în pericol**: `last_activity_date = ieri` AND `streak > 0` → mesaj „nu rupe seria de X zile!"
- **B. Streak deja rupt recent**: `last_activity_date` între acum 2 și 7 zile AND `streak > 0` (sau best_streak > 2) → mesaj de revenire „te așteaptă lecțiile, hai înapoi!"

Asta acoperă și cazul tău (27-04 → azi = 2 zile pauză).

### 3. Mesaje noi, prietenoase de dimineață
Pool de mesaje cu ton matinal:
- „Bună dimineața! ☀️ Streak-ul tău de {streak} zile te așteaptă"
- „O lecție rapidă cu cafeaua de dimineață? ☕ {streak} zile la rând!"
- „Trezește-te cu Python! 🐍 Nu lăsa seria de {streak} zile să se rupă"
- Pentru cei reveniri: „Ne-a fost dor de tine! 💚 Hai să recuperăm seria"

### 4. Idempotență — un singur mesaj/zi
Înainte de a insera în `notifications`, verificăm dacă utilizatorul a primit deja azi o notificare de tip „streak" (filtrăm pe titlu sau adăugăm o coloană `kind`). Evităm duplicatele dacă cron-ul e rulat manual.

## Modificări tehnice

### Migrare SQL
```sql
SELECT cron.unschedule('send-streak-reminder-daily');

SELECT cron.schedule(
  'send-streak-reminder-morning',
  '0 6 * * *',  -- 09:00 ora României
  $$ SELECT net.http_post(
       url := 'https://gcilflssbcswmgkrznot.supabase.co/functions/v1/send-streak-reminder',
       headers := '{"Content-Type":"application/json","Authorization":"Bearer <ANON>"}'::jsonb,
       body := '{}'::jsonb
     ); $$
);
```

### `supabase/functions/send-streak-reminder/index.ts`
- Lărgim query-ul: `last_activity_date BETWEEN today-7 AND today-1 AND streak > 0`.
- Două seturi de mesaje (în pericol vs revenire), alegem după câte zile au trecut.
- Înainte de insert, `SELECT 1 FROM notifications WHERE user_id=? AND created_at::date = today AND title LIKE '%streak%'` — skip dacă există.
- Trimitem și push (FCM/APNs) — codul există deja.

## Test rapid după deploy
Rulez funcția manual: `supabase.functions.invoke('send-streak-reminder')` și verific că tu (David Florescu) primești o notificare „revenire".

## Fișiere atinse
- `supabase/functions/send-streak-reminder/index.ts` (rewrite logic + mesaje)
- migrare SQL nouă (re-schedule cron)
