## Problema

- Pe telefon ai toate cele **124 de lecții completate** (confirmat în baza de date pentru contul `dcflorescu2003@gmail.com`).
- Pe web (preview + pyroskill.info) apar **0 sau mai puține** lecții.

## Cauza

Două probleme se combină:

1. **Sesiune web invalidă, dar tăcută.** În log-urile de autentificare apar erori `403 bad_jwt: missing sub claim` și `refresh_token_not_found`. Când JWT-ul e invalid, Supabase respinge query-urile, iar regulile de securitate (RLS) pe tabela `completed_lessons` întorc 0 rânduri — exact ca pentru un utilizator neautentificat. Aplicația nu observă diferența dintre „cont nou, fără progres" și „sesiune expirată".

2. **Codul de încărcare suprascrie progresul local cu zero.** În `src/hooks/useProgress.ts`, dacă cloud-ul returnează lista goală (din cauza sesiunii invalide), heuristica `hasCloudProgress` devine `false` și aplicația înlocuiește local cu starea implicită (0 XP, 0 lecții). În plus, eventualele erori sunt prinse într-un `catch` care doar le scrie în consolă, fără a opri suprascrierea.

## Ce voi schimba

### 1. `src/hooks/useProgress.ts` — niciodată să nu pierdem progresul local când cloud-ul eșuează

- La `loadCloud()`, captez explicit `error` pentru fiecare query (`profiles`, `completed_lessons`, `skip_unlocked_lessons`).
- Dacă oricare query întoarce eroare **sau** dacă request-ul către `profiles` nu găsește nimic dar `auth.getUser()` confirmă că utilizatorul există → **nu suprascriu local** cu cloudProgress; păstrez ce era și mai încerc o dată după 2s.
- Dacă `auth.getUser()` întoarce `bad_jwt` / 401 → declanșez un `supabase.auth.signOut()` urmat de redirect la `/auth` (sesiunea e coruptă, trebuie re-login).
- Adaug un toast discret „Nu am putut sincroniza progresul. Reîncearcă logarea." pentru cazurile de eroare reală.
- Adaug log-uri în consolă cu prefix `[useProgress]` (câte lecții s-au încărcat din cloud, câte din local, dacă s-a făcut merge).

### 2. Auto-recuperare la sesiune coruptă

În `src/hooks/useAuth.ts` (sau echivalent) adaug un check periodic / la `INITIAL_SESSION`: dacă `getUser()` întoarce `bad_jwt` sau `session_not_found`, apelez `supabase.auth.signOut({ scope: 'local' })` și marchez nevoia de re-login. Asta previne starea „logat aparent, dar fără acces la date".

### 3. Buton manual de re-sincronizare în pagina Cont

În `src/components/account/AccountProfileTab.tsx` adaug un buton mic „Resincronizează progresul din cloud" care:
- Apelează direct `supabase.from("completed_lessons").select(...)` și reconstruiește `progress.completedLessons` din rezultat.
- Afișează toast cu „X lecții sincronizate".
- Util ca scăpare manuală dacă re-loginul automat nu rezolvă.

## Ce NU schimb

- Nu modific RLS-ul de pe `completed_lessons` — e corect așa, problema e doar JWT-ul invalid.
- Nu șterg date din cloud — cele 124 de lecții rămân intacte.
- Nu schimb logica de salvare (`syncToCloud`) — funcționează corect, doar citirea era problema.

## Cum verific că merge

1. Pe acest preview, după implementare → fac sign-out și re-login → în consolă apare `[useProgress] loaded 124 lessons from cloud`, iar pe pagina principală văd toate capitolele cu lecțiile bifate.
2. Provoc artificial o eroare de sesiune (șterg `sb-...-auth-token` din localStorage) → aplicația mă redirectează la `/auth` în loc să arate 0 lecții.
3. Apăs butonul „Resincronizează" → toast confirmă numărul corect.
