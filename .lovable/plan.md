

## Plan: PyRo Premium cu Stripe — Abonament lunar/anual

### Rezumat
Integrare Stripe pentru abonamente Premium cu două planuri:
- **Lunar**: 5 RON/lună
- **Anual**: 50 RON/an (economie ~17%)

### Pași

1. **Activare Stripe** — folosim tool-ul Stripe integrat în Lovable pentru a configura cheia secretă și a crea produsele/prețurile

2. **Edge function `create-checkout`** — primește `priceId` și `userId`, creează o sesiune Stripe Checkout cu `mode: "subscription"`, returnează URL-ul de plată

3. **Edge function `stripe-webhook`** — ascultă evenimentele `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` și actualizează `is_premium` în tabelul `profiles`

4. **Tabel DB: `subscriptions`** — stochează `user_id`, `stripe_customer_id`, `stripe_subscription_id`, `status`, `plan` (monthly/yearly), `current_period_end`

5. **UI — PremiumDialog actualizat**:
   - Două carduri de preț: 5 RON/lună și 50 RON/an cu badge "Economisești 17%"
   - Click → redirect la Stripe Checkout
   - Utilizatorul trebuie să fie autentificat (redirect la `/auth` dacă nu e)

6. **Verificare status premium** — la login, se verifică `is_premium` din `profiles` (setat de webhook)

### Flux utilizator
```text
[Dialog Premium] → Alege plan → [Stripe Checkout] → Plată → [Webhook] → profiles.is_premium = true → Funcționalități premium active
```

### Securitate
- Webhook-ul validează semnătura Stripe
- RLS pe tabelul `subscriptions` — utilizatorii văd doar propriile înregistrări
- `is_premium` se setează doar server-side (webhook), nu din client

