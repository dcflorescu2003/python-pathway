## Cont reperat

Utilizatorul din clip este **`dragosdimitrie.faceit@yahoo.com`** (Apple, id `8fdd571f-…`). Are 2 identități Apple linkate la același user (re-link pe 30 apr 2026), iar ultimul `last_sign_in_at` este tot 30 apr. Nu există sesiuni active în `auth.sessions` și nu apar logs în `auth_logs` pentru request-uri recente — adică device-ul nu mai ajunge să facă vreun apel autentificat înainte de a fi delogat.

## Ce se întâmplă

1. La pornire, shim-ul nostru `installNativeAuthPersistence` rehidratează corect `sb-*` din `Preferences` în `localStorage` → Supabase emite `INITIAL_SESSION` cu user → ecranul Home apare (se vede „Oul Misterios" în clip).
2. Imediat după, Supabase încearcă **refresh** al access tokenului. Pentru contul ăsta (refresh token vechi / invalidat de re-link-ul de identitate Apple) request-ul eșuează → Supabase emite `SIGNED_OUT` și **șterge `sb-*` din `localStorage`**.
3. Shim-ul nostru propagă orbește orice `removeItem` pe chei `sb-*` și în `Preferences` → backup-ul nativ e șters și el. Nu mai există nicio cale de recuperare.
4. UI-ul ajunge la `/auth` — exact cum se vede în film.

Deci „fix-ul anterior" pentru iOS adresa cazul WebView-evicts-localStorage, dar **nu** cazul refresh-failed (Supabase însuși cere ștergerea).

## Schimbări propuse

**1. `src/integrations/supabase/native-persistence.ts`** — nu mai propaga „shadow delete" în Preferences pe baza unui simplu `removeItem`. În schimb:
- Mirror-ăm `setItem` în Preferences ca acum (păstrează tokenul „bun" în storage durabil).
- La `removeItem` pe o cheie `sb-*`, **nu** o mai ștergem din Preferences imediat. Marcăm timestamp-ul ultimei ștergeri într-o cheie auxiliară (`sb-cleared-at`) și păstrăm valoarea în Preferences pentru o eventuală recuperare ulterioară (TTL 7 zile, după care o curățăm la următorul boot).
- Asta urmărește pattern-ul „write-through cache, lazy eviction" — Supabase poate șterge din WebView, dar device-ul reține ultima sesiune validă.

**2. `src/hooks/useAuth.tsx`** — extindere logică `SIGNED_OUT` pe nativ:
- Pe `SIGNED_OUT` care vine la **mai puțin de ~5s după** primul `INITIAL_SESSION`/`TOKEN_REFRESHED` valid (adică un „logout fals"/eroare de refresh), facem un singur retry: rehidratăm explicit din Preferences în localStorage și apelăm `supabase.auth.setSession(...)` cu valorile din Preferences. Dacă merge, păstrăm user-ul logat și marcăm un flag de „recovered".
- Dacă retry-ul tot dă eroare de refresh (refresh token cu adevărat invalidat), atunci abia atunci tratăm `SIGNED_OUT` ca real, ștergem cheile din Preferences și ducem la `/auth`. Asta evită delogările silențioase pe rețea slabă / clock skew, dar nu blochează cazurile reale.
- Adăugăm log-uri (`console.warn`) cu prefix `[auth-recovery]` ca să fie ușor de văzut în logs viitoare.

**3. (opțional, doar dacă punctul 2 nu rezolvă pentru contul ăsta)** — la pornirea native, dacă refresh tokenul citit din Preferences are `expires_at` deja trecut cu mai mult de o oră, NU mai încercăm să-l hidratăm; afișăm direct `/auth`. Astfel evităm flash-ul scurt de Home → logout pe care îl vede user-ul.

## Verificare după aplicare

- Bump versiune iOS (build) și se trimite TestFlight pe device-ul din clip.
- Re-login Apple cu același cont → ar trebui să rămână logat după restart.
- Pentru conturi sănătoase: comportamentul rămâne identic.

## Fișiere atinse

- `src/integrations/supabase/native-persistence.ts`
- `src/hooks/useAuth.tsx`

Confirmi și aplicăm?
