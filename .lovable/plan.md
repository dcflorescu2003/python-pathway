## Problema

Pe iOS, după Sign in with Apple, Supabase adaugă automat o identitate `email` în `auth.identities` (cu Hide-My-Email). Hook-ul `useAuthMethods` interpretează asta drept "userul are parolă", deci în `RealEmailSetupCard` câmpurile de parolă din pasul 2 sunt ascunse — și flow-ul nu poate fi finalizat niciodată.

## Soluție

Înlocuim detecția fragilă din client cu un steag salvat explicit pe profil când userul setează cu adevărat o parolă, plus afișăm întotdeauna câmpurile de parolă în pasul 2 dacă nu suntem siguri.

### 1. Sursă de adevăr pentru "are parolă"

- Adăugăm coloana `profiles.has_real_password BOOLEAN DEFAULT false`.
- Backfill: setăm `true` pentru userii care au în `auth.identities` un provider `email` ȘI **nu** au și provider `apple` sau `google` (deci s-au înregistrat clasic cu parolă).
- Trigger sau update la finalul flow-ului de mai jos pentru a-l comuta pe `true`.

### 2. `useAuthMethods` citește din profil

- Pe lângă `auth.getUser()`, hook-ul face `select has_real_password from profiles where user_id = ...`.
- `hasPassword` devine `profile.has_real_password === true` (nu mai derivă din identities).
- Expunem și `hasPasswordKnown` ca să distingem "nu știm încă" de "nu are".

### 3. `RealEmailSetupCard` — pasul 2 afișează mereu parola când e nevoie

- Condiția pentru afișarea câmpurilor de parolă în pasul "code" devine `!hasPassword` calculată din noua sursă.
- În `verifyAndSetPassword`, după ce `supabase.auth.updateUser({ password })` reușește, facem `update profiles set has_real_password = true where user_id = ...`.
- Same în `savePasswordOnly`.

### 4. Curățare cont test

Ștergem `cosmin.florescu@fglorca.ro` din nou, ca să poți relua flow-ul de la zero pe iOS cu codul nou.

## Fișiere atinse

- migration: adăugare coloană + backfill
- `src/hooks/useAuthMethods.ts` — citire `has_real_password` din `profiles`
- `src/components/account/RealEmailSetupCard.tsx` — folosește noul `hasPassword`, scrie `has_real_password = true` după success
- ștergere user test prin SQL

## Memory

Voi salva o notă în `mem://auth/has-real-password` despre cum se detectează prezența parolei (din `profiles.has_real_password`, nu din `auth.identities`), pentru că Apple/Google adaugă identități `email` care induc în eroare.  
  
Vreau ca toata treaba asta cu acest cartonas cu emailul real, cod si parola sa apara doar pe iOS