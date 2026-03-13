

## Plan: PyRo Premium cu Stripe — 5 RON/lună, 50 RON/an

### Produse Stripe create
- **Lunar**: `price_1TAd4JRsFs1XlxrbCSROnd55` (5 RON/lună)
- **Anual**: `price_1TAd4cRsFs1XlxrbtFW1sT6U` (50 RON/an)

### Ce se va implementa

#### 1. Edge Function: `create-checkout`
- Primește `priceId` din request body
- Autentifică utilizatorul via JWT
- Creează/reutilizează Stripe customer pe baza email-ului
- Returnează URL Stripe Checkout (`mode: "subscription"`)

#### 2. Edge Function: `check-subscription`
- Verifică dacă utilizatorul are un abonament activ în Stripe
- Returnează `{ subscribed, subscription_end }`
- Apelată la login, la încărcarea paginii, și periodic

#### 3. Edge Function: `customer-portal`
- Creează o sesiune Stripe Customer Portal
- Permite utilizatorului să-și gestioneze abonamentul (anulare, schimbare metodă de plată)

#### 4. Update `supabase/config.toml`
- Adaugă `[functions.create-checkout]`, `[functions.check-subscription]`, `[functions.customer-portal]` cu `verify_jwt = false`

#### 5. Update `PremiumDialog.tsx`
- Două carduri de preț: **5 RON/lună** și **50 RON/an** (cu badge "Economisești 17%")
- Click pe un plan → apelează `create-checkout` → redirect la Stripe
- Dacă utilizatorul nu e autentificat, redirect la `/auth`
- Dacă e deja premium, afișează detalii abonament + buton "Gestionează abonamentul"

#### 6. Update `useProgress.ts` / hook nou
- La login și periodic, apelează `check-subscription` pentru a seta `isPremium` din Stripe (nu doar din DB)
- Sincronizează `profiles.is_premium` pe baza răspunsului Stripe

### Flux utilizator
```text
PremiumDialog → Alege plan → create-checkout → Stripe Checkout → Plată → Redirect înapoi → check-subscription → isPremium = true
```

### Securitate
- Edge functions validează JWT-ul utilizatorului
- Prețurile sunt hardcodate server-side (nu se pot modifica din client)
- Premium status verificat direct din Stripe (sursa de adevăr)

