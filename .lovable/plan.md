# Plan: Apple iOS rămâne, Web folosește gating "email real + parolă"

## Obiective

1. **Renunțăm la flow-ul custom Apple Web** (`apple-web-initiate` / `apple-web-callback`) — produce `invalid_client` și complică inutil.
2. **iOS rămâne neatins** (login nativ Apple via Capacitor, deja funcțional).
3. **Web Apple**: revine la `lovable.auth.signInWithOAuth("apple", …)` (cum era inițial).
4. **Cartonașul "Adaugă email real"** (`RealEmailSetupCard`) rămâne așa cum e — deja merge.
5. **Nou: gating la înscrierea în clasă** — un elev logat cu Apple care are încă `@privaterelay.appleid.com` SAU nu are parolă setată **nu poate** intra într-o clasă; e blocat cu un mesaj clar care îl trimite la Cont → setează email real + parolă.

## Modificări

### 1. `src/hooks/useAuth.tsx` — `signInWithApple` (web)

Înlocuim ramura web custom cu varianta originală:

```ts
// Web: revenim la flow-ul Lovable Cloud (cum era înainte)
const result = await lovable.auth.signInWithOAuth("apple", {
  redirect_uri: window.location.origin,
});
return { error: result.error || null };
```

iOS / Android nativ rămân neschimbate.

### 2. Curățăm flow-ul Apple custom

- Șterg `supabase/functions/apple-web-initiate/index.ts`
- Șterg `supabase/functions/apple-web-callback/index.ts`
- Șterg `src/pages/AppleFinishPage.tsx`
- Scot ruta `/auth/apple-finish` din `src/App.tsx`
- Migrație: `DROP TABLE public.apple_oauth_states`
- Scot blocurile aferente din `supabase/config.toml`
- Secretele Apple (`APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_WEB_CLIENT_ID`) le lăsăm pe loc — nu strică, pot folosi mai târziu.

### 3. Gating la "Alătură-te clasei" (`src/pages/AuthPage.tsx`)

În `joinClassDirect` (și înainte de `handleNameConfirm`) verificăm prin `useAuthMethods()`:

```text
needsRealEmail = isPrivateRelay (email-ul curent e @privaterelay.appleid.com)
needsPassword  = !hasPassword (utilizatorul nu și-a setat parolă încă)
```

Dacă `needsRealEmail || needsPassword`:

- Blocăm `joinClassDirect` / `handleNameConfirm` cu un dialog/toast clar:
  > "Pentru a te înscrie într-o clasă cu contul Apple, trebuie să adaugi un email real și o parolă (poți recupera contul și pe web). Mergi la **Cont → Login pe web**."
- Buton "Mergi la Cont" care duce la tab-ul `profile` din pagina curentă (deja existent — `setActiveTab("profile")`), unde sunt vizibile `RealEmailSetupCard` + `WebLoginSetupCard`.
- Nu rulăm INSERT în `class_members`.

Regula se aplică **doar pentru elevi cu identitate Apple** (via `hasApple`). Pentru Google / email+parolă nu facem gating.

### 4. Mesaj contextual în `StudentTab` (opțional — UX)

Dacă elevul e deja membru al unei clase și **între timp** redevine "private relay fără parolă" (caz rar), afișăm un banner discret în StudentTab care îi cere să își finalizeze contul. Doar text + link spre cardurile existente — nimic distructiv.

## Pași de execuție (în ordine)

1. Modific `useAuth.tsx` (revenire la `lovable.auth.signInWithOAuth("apple")` pe web).
2. Șterg pagina/funcțiile/tabela custom Apple + ruta din `App.tsx` + secțiuni din `config.toml`.
3. Migrație SQL: `DROP TABLE IF EXISTS public.apple_oauth_states`.
4. Adaug logica de gating Apple în `AuthPage.tsx` (un helper `assertCanJoinClass()` apelat înainte de orice INSERT în `class_members`).
5. Banner contextual în `StudentTab` (opțional, doar dacă vrei UX-ul în plus — confirmă-mi).

## Pași manuali pentru tine după implementare

- În **Lovable Cloud → Users → Auth Settings → Apple** asigură-te că Apple e activ pe varianta managed (BYOC dacă ai configurat-o, altfel default). Asta e ce funcționa inițial.
- Nu mai e nevoie de Return URL custom în Apple Developer Console pentru flow-ul nostru (Lovable Cloud îl gestionează intern).

## Întrebare înainte de execuție

Vrei și **bannerul contextual în StudentTab** (pasul 4 din "Modificări"), sau e suficient gating-ul la momentul join-ului?  
  
Nu inteleg intrebarea de executie. Explica-mi mai detaliat inainte de a aplica planul