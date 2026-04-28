## Obiectiv

Permite utilizatorilor logați cu Apple să-și seteze o parolă pentru a se putea loga și pe web (PC) folosind email + parolă, păstrând același cont.

## Cum funcționează

Apple Sign-In creează un user în Supabase cu:
- `provider: "apple"` în `app_metadata`
- `email`: fie email-ul real, fie un alias `xxxxx@privaterelay.appleid.com` (dacă user-ul a ales "Hide My Email")

Supabase permite `auth.updateUser({ password })` pe orice user autentificat — chiar și pe cei creați prin OAuth. După setare, user-ul are 2 metode de login active simultan, ambele duc la același cont (același user_id, același progres, același Premium).

## Modificări

### 1. Hook nou: `useAuthMethods` (`src/hooks/useAuthMethods.ts`)
Returnează:
- `hasApple` — dacă user-ul s-a logat vreodată cu Apple (din `user.identities` sau `app_metadata.providers`)
- `hasPassword` — dacă user-ul are parolă setată (deducem din `user.identities` — există identity de tip `email`)
- `email` — email-ul efectiv folosit la login (real sau alias `@privaterelay.appleid.com`)
- `isPrivateRelay` — boolean dacă e alias Apple

### 2. Componentă nouă: `WebLoginSetupCard` (`src/components/account/WebLoginSetupCard.tsx`)
Card vizibil în Account → tab Profil, DOAR dacă `hasApple && !hasPassword`. Conține:
- Titlu: „Activează login pe web"
- Explicație scurtă: „Te-ai logat cu Apple. Setează o parolă pentru a te putea loga și de pe PC."
- Email afișat (cu mențiune dacă e alias Apple privat)
- Buton „Setează parolă" → deschide dialog cu 2 inputuri (parolă + confirmare, min 8 caractere) → apel `supabase.auth.updateUser({ password })`
- După succes: toast + card devine „Login web activ ✓" cu badge verde și instrucțiuni: „Loghează-te pe PC cu: {email} + parola setată"

### 3. Avertisment pentru email privat (în același card)
Dacă `isPrivateRelay`, adăugăm o notă: „Email-ul tău Apple este privat (`xxx@privaterelay.appleid.com`). Apple va redirecționa email-urile către adresa ta reală. Folosește exact acest email la login pe web."

Opțional (faza 2, dacă cere): buton „Schimbă email-ul" care folosește `auth.updateUser({ email })` + flow de confirmare. NU e inclus acum pentru a păstra scope-ul mic.

### 4. Schimbare parolă (bonus, pentru toți userii)
În același card, dacă `hasPassword === true`, afișează un buton mai discret „Schimbă parola" care reutilizează același dialog. Util pentru toți userii, nu doar cei Apple.

### 5. Pe AuthPage — niciun cod nou
Tab-ul „Login cu email" deja există și funcționează. Doar adăugăm o mică notă sub el: „Te-ai logat cu Apple pe iPhone? Poți seta o parolă din Cont → Profil pentru a te loga și aici."

## Detalii tehnice

- `user.identities` (din Supabase) e un array cu provider-ele conectate. Dacă există unul cu `provider === "email"` și are timestamp, înseamnă că parola e setată. Altfel, doar OAuth.
- `supabase.auth.updateUser({ password: "..." })` funcționează fără re-autentificare deoarece sesiunea e deja activă.
- După setare, refresh la `user` via `supabase.auth.getUser()` pentru a actualiza `identities` în UI.
- Validare client: parolă minim 8 caractere, confirmarea trebuie să corespundă. Server-side validarea e făcută automat de Supabase.

## Ce nu se schimbă

- Configurația Apple Sign-In rămâne identică (BYOC cu Bundle ID).
- Edge functions, RLS, alte fluxuri — neatinse.
- Datele user-ului (progres, XP, Premium) sunt legate de `user_id`, deci rămân identice indiferent de metoda de login.