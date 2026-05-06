## Problemă

Lista utilizatorilor e goală pentru că edge function-ul `admin-list-users` crapă cu:
```
TypeError: userClient.auth.getClaims is not a function
```

Versiunea `@supabase/supabase-js@2.45.0` folosită în edge function nu expune `auth.getClaims()` (apărută în versiuni mai noi). Astfel, fiecare apel întoarce 500, iar UI afișează 0 utilizatori.

## Fix

În `supabase/functions/admin-list-users/index.ts`, înlocuim validarea identității cu `auth.getUser(token)`, care e disponibilă în 2.45 și e pattern-ul standard:

```ts
const { data: userData, error: userErr } = await userClient.auth.getUser(token);
if (userErr || !userData?.user?.id) return 401;
const callerId = userData.user.id;
```

Restul logicii (verificare rol admin, listare profiluri, agregare emailuri / play subs / cupoane) rămâne neschimbată.

## Pași
1. Înlocuire `getClaims` → `getUser` în `admin-list-users/index.ts`.
2. Redeploy automat.
3. Verificare în tab-ul „Utilizatori" că lista se populează.