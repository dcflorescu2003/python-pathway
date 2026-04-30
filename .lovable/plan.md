
# Apple Login: păstrăm iOS nativ, reparăm web-ul cu flux custom

## Obiectiv

Repararea login-ului Apple pe web (`pyroskill.info` și pe `*.lovable.app`) fără să atingem deloc fluxul iOS nativ care funcționează. Eliminăm complet dependența de configurarea Apple din Lovable Cloud, eliminând astfel conflictul de Client ID între Bundle ID iOS și Services ID web.

## Arhitectură

```text
iOS (NEATINS)
  SocialLogin.login({ provider: "apple" })
  → identityToken cu aud = ro.pythonpathway.app (Bundle ID)
  → supabase.auth.signInWithIdToken({ provider: "apple" })
  → sesiune Supabase (merge prin config-ul nativ Apple din Supabase)

Web (NOU)
  Buton "Sign in with Apple"
  → /functions/v1/apple-web-initiate?return_to=https://pyroskill.info
     (creează state + PKCE, redirect către Apple)
  → user se autentifică pe appleid.apple.com
  → Apple POST către /functions/v1/apple-web-callback
     - validează state
     - schimbă code pe id_token (semnează JWT client_secret la zbor cu .p8)
     - validează id_token (issuer, audience, exp, semnătura JWKS)
     - găsește/creează user în auth.users prin Admin API
     - generează magiclink Supabase pentru user
  → redirect către `${return_to}/auth/apple-finish?token_hash=...`
  → frontend cheamă supabase.auth.verifyOtp({ token_hash, type: "magiclink" })
  → sesiune setată, user redirectionat în app
```

Lovable Cloud Apple OAuth se dezactivează — câmpul Client ID din Cloud devine irelevant.

## Pași

### 1. Apple Developer Console (manual, de către utilizator)

Verificare/configurare Services ID `ro.pythonpathway.app.web`:
- Sign In with Apple: enabled
- Primary App ID: `ro.pythonpathway.app`
- Domains and Subdomains: `pyroskill.info`, `www.pyroskill.info`, `pyro-learn.lovable.app`, `id-preview--*.lovable.app`
- Return URL: `https://gcilflssbcswmgkrznot.supabase.co/functions/v1/apple-web-callback`

### 2. Secrete (folosind add_secret)

- `APPLE_TEAM_ID` — Team ID din Apple Developer (10 caractere)
- `APPLE_KEY_ID` — Key ID al cheii .p8 (10 caractere)
- `APPLE_PRIVATE_KEY` — conținutul .p8 (PEM, cu BEGIN/END PRIVATE KEY)
- `APPLE_WEB_CLIENT_ID` — `ro.pythonpathway.app.web`

JWT-ul de client_secret se generează în edge function la fiecare apel, deci nu mai expiră la 6 luni.

### 3. Migration: tabel `apple_oauth_states`

Stochează state + code_verifier pentru PKCE între initiate și callback.

```sql
create table public.apple_oauth_states (
  state text primary key,
  code_verifier text not null,
  return_to text not null,
  created_at timestamptz default now()
);
-- TTL 10 min, RLS: nimeni acces direct (folosit doar din edge functions cu service role)
alter table public.apple_oauth_states enable row level security;
```

### 4. Edge Function: `apple-web-initiate`

`supabase/functions/apple-web-initiate/index.ts`
- Public (verify_jwt = false)
- Generează `state` (random 32 bytes) și `code_verifier` + `code_challenge` (PKCE S256)
- Salvează state-ul cu `return_to` în `apple_oauth_states`
- Redirect 302 către `https://appleid.apple.com/auth/authorize?...` cu:
  - `client_id=ro.pythonpathway.app.web`
  - `redirect_uri=https://gcilflssbcswmgkrznot.supabase.co/functions/v1/apple-web-callback`
  - `response_type=code`
  - `response_mode=form_post`
  - `scope=name email`
  - `state`, `code_challenge`, `code_challenge_method=S256`

### 5. Edge Function: `apple-web-callback`

`supabase/functions/apple-web-callback/index.ts`
- Public (verify_jwt = false), acceptă POST form-encoded de la Apple
- Citește `code`, `state`, eventual `user` (la primul login Apple trimite și name)
- Recuperează state-ul din DB; șterge după folosire
- Generează client_secret JWT la zbor:
  - alg ES256, header `kid = APPLE_KEY_ID`
  - claims: `iss=APPLE_TEAM_ID, aud=https://appleid.apple.com, sub=APPLE_WEB_CLIENT_ID, iat, exp(+5min)`
  - semnat cu `APPLE_PRIVATE_KEY` folosind `jose` din npm
- POST la `https://appleid.apple.com/auth/token` cu `code`, `client_id`, `client_secret`, `grant_type=authorization_code`, `redirect_uri`, `code_verifier`
- Primește `id_token`, îl decodează și verifică:
  - semnătura cu cheile de la `https://appleid.apple.com/auth/keys` (jose JWKS)
  - `iss=https://appleid.apple.com`, `aud=APPLE_WEB_CLIENT_ID`, `exp` valid
- Extrage `sub` (Apple user ID) și `email`
- Caută user existent cu `supabase.auth.admin.listUsers` filtrat pe email; dacă nu există, `admin.createUser({ email, email_confirm: true, app_metadata: { provider: "apple", apple_sub: sub } })`
- Generează `admin.generateLink({ type: "magiclink", email })` — extrage `properties.hashed_token`
- Redirect 302 către `${return_to}/auth/apple-finish#token_hash=...&type=magiclink`

### 6. Pagină frontend: `/auth/apple-finish`

`src/pages/AppleFinishPage.tsx`
- Citește `token_hash` din hash params
- `await supabase.auth.verifyOtp({ token_hash, type: "magiclink" })`
- Pe success: `navigate("/")` (sau `return_to` original stocat în sessionStorage înainte de redirect)
- Pe eroare: toast + navigate la `/auth`

Adaugi ruta în `App.tsx` ca rută publică.

### 7. Modificare `useAuth.tsx`

Doar branch-ul web (linia 261). Înlocuim:
```ts
const result = await lovable.auth.signInWithOAuth("apple", {
  redirect_uri: window.location.origin,
});
```
cu redirect către edge function:
```ts
window.location.href =
  `${SUPABASE_URL}/functions/v1/apple-web-initiate?return_to=${encodeURIComponent(window.location.origin)}`;
return { error: null };
```

Branch-urile pentru `isNativeIOS`/`isNativeAndroid` rămân exact cum sunt.

### 8. Lovable Cloud → dezactivare Apple

După ce funcționează web-ul nou: în Cloud → Auth Settings → Apple, fie dezactivezi providerul, fie rezolvi câmpul Client ID — nu mai contează, nu-l mai folosește nimeni. Recomand să-l lași dezactivat ca să fie clar care e flow-ul activ.

## Detalii tehnice

**Librării edge function:**
- `jose` (npm:jose@5) pentru semnare ES256 + verificare JWKS
- `@supabase/supabase-js` pentru Admin API
- CORS nu e necesar (sunt redirect-uri 302 / form POST de la Apple, nu fetch din browser)

**verify_jwt:** ambele functions sunt publice, însă Apple semnează callback-ul cu state + PKCE — protecție echivalentă.

**Hide My Email:** dacă userul ascunde emailul, Apple trimite un email de tip `xxx@privaterelay.appleid.com`. Logica existentă `RealEmailReminderDialog` continuă să se aplice.

**Userii existenți:** match doar după email. Dacă cineva are deja cont email/password cu același email, login-ul Apple va lega de acel cont (același UUID). Acceptabil per răspunsul tău.

**State TTL:** edge function-ul `apple-web-callback` ignoră state-uri mai vechi de 10 minute.

## Fișiere modificate / create

- `supabase/migrations/<timestamp>_apple_oauth_states.sql` (nou)
- `supabase/functions/apple-web-initiate/index.ts` (nou)
- `supabase/functions/apple-web-callback/index.ts` (nou)
- `src/pages/AppleFinishPage.tsx` (nou)
- `src/App.tsx` (rută nouă)
- `src/hooks/useAuth.tsx` (1 branch înlocuit)
- secrete: `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_WEB_CLIENT_ID`

## Riscuri

- Dacă Services ID-ul nu e configurat corect în Apple Developer Console (domeniu lipsă, return URL greșit), Apple va respinge cu `invalid_redirect_uri` sau `invalid_client`. Pasul 1 e critic — verifică înainte de deploy.
- Cheia .p8 trebuie pusă cu newline-uri reale când e setat secretul.
- iOS-ul nu se atinge deloc, deci risc zero pe app-ul mobil.
