

## Plan: Prețuri noi — Elev Premium + Profesor AI

### Rezumat

Creăm produse și prețuri noi în Stripe, actualizăm dialogul Premium pentru elevi cu noile prețuri, adăugăm un dialog separat de abonament pentru profesori, și actualizăm `check-subscription` + `create-checkout` pentru a diferenția între cele două tipuri de abonament.

---

### Pasul 1 — Creare produse Stripe noi

**4 prețuri noi:**
- **Elev Premium Lunar**: 14.99 RON/lună (1499 bani)
- **Elev Premium Anual**: 99 RON/an (9900 bani)
- **Profesor AI Lunar**: 29 RON/lună (2900 bani)
- **Profesor AI Anual**: 299 RON/an (29900 bani)

Produse noi: „Elev Premium" și „Profesor AI". Prețurile vechi (5 RON/50 RON) rămân active în Stripe pentru abonații existenți, dar nu mai sunt afișate în UI.

### Pasul 2 — Actualizare `create-checkout`

Adăugăm noile price ID-uri în lista `PRICE_IDS` validată în edge function.

### Pasul 3 — Actualizare `check-subscription`

Edge function-ul returnează deja `source` și `subscribed`. Adăugăm un câmp `product_id` în răspuns pentru a ști dacă e abonament elev sau profesor. Frontend-ul va folosi asta pentru a afișa corect starea.

### Pasul 4 — Actualizare `useSubscription` hook

Adăugăm `productId` în state pentru a ști tipul de abonament (student vs teacher).

### Pasul 5 — Actualizare `PremiumDialog` (Elevi)

- Prețuri: **14,99 RON/lună** și **99 RON/an** (reducere ~45%)
- Beneficii actualizate:
  - Inimi nelimitate
  - Fără reclame  
  - Experiență mai fluidă
  - **Sumar personalizat**: lecții unde te descurci bine vs. unde ai nevoie de exercițiu
  - Challenge-uri și funcții premium
- Mențiune „Preț de fondator, valabil în 2027"

### Pasul 6 — Creare `TeacherPremiumDialog` (Profesori)

Dialog nou, afișat din `TeacherPage.tsx`, cu:
- **Free**: funcționalitate de bază (clase, provocări)
- **Profesor AI**: 29 RON/lună sau 299 RON/an
- Beneficii: până la 10 teste/lună, max 3 itemi AI/test, feedback AI, statistici avansate, corectura probleme cu AI
- Mențiune „Preț de fondator, valabil în 2026"

### Pasul 7 — Integrare în `TeacherPage.tsx`

Buton/banner „Upgrade la Profesor AI" vizibil pentru profesorii verificați care nu au abonament profesor activ.

---

### Fișiere modificate

- `supabase/functions/create-checkout/index.ts` — adăugare price IDs noi
- `supabase/functions/check-subscription/index.ts` — returnare `product_id`
- `src/hooks/useSubscription.ts` — adăugare `productId` în state
- `src/components/PremiumDialog.tsx` — prețuri noi elev + beneficii actualizate
- `src/components/TeacherPremiumDialog.tsx` — dialog nou profesor
- `src/pages/TeacherPage.tsx` — buton upgrade profesor AI

