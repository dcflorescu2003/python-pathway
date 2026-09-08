# Statistică abonamente Premium din magazine (App Store / Play Store) în pagina de statistici admin

## Ce vrea utilizatorul
În pagina de statistici din Admin să apară numărul de abonamente Premium plătite prin Google Play și App Store — adică doar cele cumpărate real din magazine, fără Premium acordat manual de admin și fără cele din cupoane.

## Stare actuală (verificată)
- Pagina de statistici: `src/components/admin/StatsDashboard.tsx`, alimentată de funcția SQL `admin_get_stats(p_days)`.
- Abonamentele din magazine sunt în tabela `play_billing_subscriptions` (coloane: `platform` = `android`/`ios`, `product_id`, `is_active`, `expiry_time`, `user_id`).
- Date reale acum: 5 înregistrări (2 Android `student_premium`, 3 iOS `pyro_student_monthly_ios`). Notă: unele rânduri au `is_active = true` deși `expiry_time` e în trecut, deci "activ" trebuie calculat ca `is_active AND expiry_time > now()`.
- Premium din Stripe (web), cupoane și admin nu sunt în această tabelă, deci filtrarea cerută e automată prin sursa datelor.

## Modificări

### 1. Funcția SQL `admin_get_stats` (migrație nouă)
- Se extinde funcția existentă (CREATE OR REPLACE, rămâne SECURITY DEFINER, aceeași semnătură) cu un bloc nou `store_subscriptions` în JSON-ul returnat:
  - `android_active` — utilizatori unici cu abonament Android activ (`is_active = true AND expiry_time > now()`)
  - `ios_active` — idem pentru iOS
  - `android_total` / `ios_total` — total istoric înregistrări per platformă
- Admin-only, la fel ca restul funcției.

### 2. UI — `src/components/admin/StatsDashboard.tsx`
- Card nou în grila de statistici, icon `Smartphone` (sau `Crown` variant): „Abonamente magazine" cu valoarea totală activă și hint „X Google Play · Y App Store".
- Se actualizează interfața `StatsData` cu noul câmp.

## Detalii tehnice
- Filtrare exclusivă: doar `play_billing_subscriptions`; nu se ating `profiles.is_premium`, `premium_manual`, `coupon_redemptions` — deci Premium din admin/cupoane/Stripe nu intră în numărătoare.
- „Activ" = `is_active = true AND expiry_time > now()` (ca să nu numărăm rânduri marcate activ dar expirate).
- Numărătoare pe `DISTINCT user_id` per platformă (un utilizator poate avea mai multe rânduri istorice).
- Nu se schimbă nimic la RLS, vieți, XP sau fluxurile de plată.
- Verificare: `bunx tsgo --noEmit -p tsconfig.app.json` + interogare directă a funcției după migrație.
