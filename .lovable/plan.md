# Premium acordat din Admin nu rămâne activ

## Ce se întâmplă acum

Când din panoul de admin treci un cont de la Free la Premium, se schimbă doar bifa `is_premium` din profil. Nu se salvează nicăieri faptul că Premium-ul a fost acordat manual de un admin.

Ulterior, când utilizatorul respectiv deschide aplicația, rulează verificarea automată de abonament (`check-subscription`). Aceasta recalculează statusul strict din sursele plătite — Stripe, Google Play / App Store, cupoane — și, negăsind niciuna, scrie la loc `is_premium = false`. De aceea contul reapare ca Free la refresh.

## Soluția

Introducem "Premium manual (admin)" ca sursă legitimă de premium, la fel ca un cupon.

1. Profilul primește două câmpuri noi: dacă premium-ul a fost acordat manual și până când (opțional, gol = nelimitat), plus cine l-a acordat.
2. Funcția prin care adminul acordă/retrage premium setează sau șterge aceste câmpuri, nu doar bifa.
3. Verificarea automată de abonament ia în calcul și acest grant manual: dacă e activ, contul rămâne Premium; dacă adminul l-a retras sau a expirat, se comportă ca înainte.
4. În lista de utilizatori din Admin, la coloana "Sursă" apare un badge distinct "Manual · Admin", ca să știi de unde vine Premium-ul.

Retragerea manuală (Premium → Free) rămâne instantanee și definitivă, cu excepția conturilor cu abonament nativ activ, unde resincronizarea din magazin are prioritate (comportament deja existent, semnalat în dialogul de confirmare).

## Detalii tehnice

- Migrare: `profiles.premium_manual boolean not null default false`, `profiles.premium_manual_until timestamptz null`, `profiles.premium_manual_by uuid null`. Câmpurile sunt protejate de scriere din client prin trigger-ul existent `protect_profile_privileged_columns`.
- `admin_set_premium(p_user_id, p_premium)`: la acordare setează `is_premium = true`, `premium_manual = true`, `premium_manual_by = auth.uid()`; la retragere setează `is_premium = false` și curăță flagurile manuale.
- `supabase/functions/check-subscription/index.ts`: se citește profilul (`premium_manual`, `premium_manual_until`) și `manualActive` intră în `isPremium = stripeActive || couponActive || playActive || manualActive`. Când `manualActive` e singura sursă, `source` devine `"admin"` în răspuns.
- `supabase/functions/admin-list-users/index.ts`: se returnează `premium_source: "manual"` când profilul are grant manual activ (prioritate sub native/stripe/cupon).
- `src/components/admin/UsersManager.tsx`: badge nou pentru sursa `manual`.
- `src/hooks/useSubscription.ts`: tipul `source` primește varianta `"admin"`.
