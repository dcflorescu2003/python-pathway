## Adăugare tab "Utilizatori" în Admin

Un tab nou în pagina `/admin` care îți permite să cauți useri (după nume / nickname / email), să vezi tipul contului și să comuți între **Free** și **Premium**, cu indicator pentru cei care au plătit.

### 1. Backend — Edge Function `admin-list-users`

Avem nevoie de email-urile din `auth.users`, care nu sunt accesibile din client. Creez o edge function (verify_jwt = true) care:

- Verifică că apelantul are rolul `admin` (via `has_role`).
- Folosește `SUPABASE_SERVICE_ROLE_KEY` ca să facă join între:
  - `auth.users` (id, email, created_at, providers din identities)
  - `public.profiles` (display_name, first_name, last_name, nickname, is_premium, is_teacher, teacher_status, school_id)
  - `public.play_billing_subscriptions` (is_active, expiry_time, platform) — pentru badge "Plătit (App Store / Google Play)"
  - `public.coupon_redemptions` (count, ultima `premium_until`, coupon_type) — pentru badge "Cupon"
- Acceptă parametri: `search` (string, caută în email / display_name / nickname / first_name / last_name, case-insensitive), `filter` (`all` | `premium` | `free` | `paid` | `coupon` | `teacher`), `limit` (default 50), `offset` (paginare).
- Întoarce listă + total count.

Pentru detectarea sursei Premium întoarce un câmp `premium_source`:

- `play` / `appstore` — abonament nativ activ
- `stripe` — `is_premium = true`, fără play billing și fără cupon activ → considerat plătit (best-effort, vezi nota la final)
- `coupon` — există redemption activă (`premium_until > now()`)
- `none` — `is_premium = false`

### 2. Backend — RPC `admin_set_premium`

Funcție Postgres `SECURITY DEFINER`:

```
admin_set_premium(p_user_id uuid, p_premium boolean)
```

- Cere ca `auth.uid()` să aibă rolul `admin`, altfel raise.
- Setează `app.bypass_profile_protection = 'true'` (ca să treacă de triggerul `protect_profile_privileged_columns`).
- `UPDATE profiles SET is_premium = p_premium WHERE user_id = p_user_id`.
- Logare opțională în `notifications` pentru user (titlu: "Cont actualizat de admin").

Nu modificăm abonamentele native — doar flag-ul `is_premium`. Notă pentru utilizator: dacă userul are un abonament Apple/Google activ, `check-subscription` va recalcula `is_premium = true` la următorul apel; pentru down-grade real trebuie ca abonamentul nativ să fie deja inactiv.

### 3. UI — `src/components/admin/UsersManager.tsx`

Componentă nouă cu:

- **Toolbar**: input de search (debounced 300ms), select pentru filter (Toți / Premium / Free / Plătit / Cupon / Profesori), buton "Refresh".
- **Tabel** (folosind `Table` din shadcn):
  - Coloane: Nume, Email, Tip cont (badges), Sursă Premium, Acțiuni.
  - Badges: `Premium` (auriu), `Free` (gri), `Plătit` (verde, dacă `premium_source ∈ {play, appstore, stripe}`), `Cupon` (albastru), `Profesor` (badge separat).
  - Acțiune per rând: buton toggle (`Promovează la Premium` / `Retrogradează la Free`) cu `AlertDialog` de confirmare.
- **Paginare** simplă (Prev / Next, 50 per pagină) cu total count afișat.
- Folosește React Query (`useQuery` cu `queryKey: ["admin-users", search, filter, page]`) și invalidează după mutație.

### 4. Integrare

- În `src/pages/AdminPage.tsx` adaug un tab nou `users` cu icon `Users` din `lucide-react`, înainte de "Setări".

### Detalii tehnice

```text
AdminPage tabs
└── Lecții | Probleme | Cupoane | Manual | Bancă | Teste | Profesori | Utilizatori | Setări
                                                                       └── UsersManager
                                                                            ├── search + filter + paginare
                                                                            ├── React Query → invoke('admin-list-users')
                                                                            └── Toggle Premium → rpc('admin_set_premium')
```

**Migrație SQL:**

- Funcție `admin_set_premium(uuid, boolean)` `SECURITY DEFINER` cu `set_config('app.bypass_profile_protection','true', true)`.
- `GRANT EXECUTE ... TO authenticated`.

**Edge function `admin-list-users`:**

- `verify_jwt = true` (default).
- Verifică admin via service-role query în `user_roles`.
- Folosește `auth.admin.listUsers()` paginat sau direct `select` pe `auth.users` cu service role + filtrare în SQL pentru search.

### Limitări (notă pentru tine)

- Nu putem distinge 100% sigur "Stripe paid" vs "promovat manual de admin", pentru că nu stocăm `stripe_customer_id` local. Heuristica: `is_premium = true` + fără play billing + fără cupon activ → marcat ca "Plătit (web)". Dacă ai nevoie 100% precis, ar trebui să adăugăm o coloană `premium_granted_by` (`stripe` / `admin` / `coupon` / `play` / `appstore`) — îți pot face asta separat.
- Toggle-ul setează doar `profiles.is_premium`. Pentru useri cu abonament nativ activ, valoarea va fi rescrisă la următoarea sincronizare. Voi afișa un warning în dialogul de confirmare pentru cazul ăsta.  
  
