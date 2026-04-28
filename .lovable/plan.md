## Obiectiv

Pentru utilizatorii care s-au logat cu Apple folosind "Hide My Email" (adresă `@privaterelay.appleid.com`), introducem un flux care îi încurajează (fără să-i blocheze) să adauge un email real verificat pentru recuperarea contului și pentru login pe web. Cardul de reminder reapare zilnic după ora 14:00 până când userul fie:
- adaugă un email real verificat, sau
- bifează "Nu îmi mai aminti".

## Cum va arăta pentru utilizator

### 1. Pe pagina **Cont → Profil** (vizibil mereu pentru useri Apple cu private relay)

Card nou "Adaugă email pentru recuperare" — apare deasupra cardului existent "Activează login pe web". Conține:
- Mesaj explicativ: "Email-ul Apple e privat. Adaugă o adresă reală pentru a putea recupera contul și loga pe web."
- Câmp pentru email + buton "Trimite cod"
- După trimitere: câmp pentru codul de 6 cifre + buton "Verifică"
- După verificare cu succes: badge verde "Email verificat" + cardul existent de parolă

### 2. **Cartonaș zilnic** (după ora 14:00, doar dacă nu a fost dismis azi)

Apare ca dialog modal central (dark mode, stil PyRo) când userul deschide app-ul, cu:
- Titlu: "Adaugă un email real"
- Descriere scurtă despre de ce
- Două butoane:
  - "Adaugă acum" → navighează la `/account` și deschide cardul
  - "Mai târziu" → ascunde dialogul până mâine după 14:00
- Checkbox jos: "Nu îmi mai aminti niciodată" → marchează permanent ca dismis

### 3. **Hint pe AuthPage** (deja există, păstrăm)

Sub tab-ul Email există deja mesajul că userii sociali pot activa login pe web din profil. Îl extindem ușor pentru a menționa că pot folosi și un email real verificat.

## Reguli de afișare a cartonașului

Cartonașul apare **o singură dată pe zi**, după ora 14:00 (ora device-ului), dacă:
- userul are `@privaterelay.appleid.com` ca email principal, ȘI
- nu a verificat încă un email real, ȘI
- nu a apăsat "Nu îmi mai aminti niciodată" în trecut, ȘI
- nu a fost arătat azi (după 14:00 local).

După apăsarea "Mai târziu" se setează data de ultima afișare. Următoarea zi, după 14:00, reapare.

## Detalii tehnice

### Database (migrație nouă)

Tabel nou `user_email_reminders`:
```text
user_id           uuid PK ref auth.users
last_shown_date   date    -- data ultimei afișări a cartonașului (UTC)
dismissed_forever boolean default false
real_email        text    -- email-ul real adăugat (după verificare)
verified_at       timestamptz
created_at        timestamptz default now()
updated_at        timestamptz default now()
```
RLS: user vede/modifică doar propriul rând. Self-insert permis.

### Edge function nouă: `request-email-change`

Input: `{ new_email: string }`
- Validează formatul
- Generează cod 6 cifre + token (hash în DB)
- Salvează în tabel temporar `email_change_otps` (user_id, code_hash, new_email, expires_at = +15min, attempts = 0)
- Trimite email cu codul folosind `send-transactional-email` (template nou `email-change-verification`)
- Rate limit: 1 cerere per minut per user

### Edge function nouă: `verify-email-change`

Input: `{ code: string }`
- Verifică codul împotriva ultimei cereri active a userului
- Max 5 încercări, după care se invalidează codul
- La succes:
  - Apelează `supabase.auth.admin.updateUserById()` cu `email: new_email` și `email_confirm: true` (folosește `SUPABASE_SERVICE_ROLE_KEY`)
  - Marchează `user_email_reminders.real_email` și `verified_at`
  - Șterge OTP-ul

### Email template nou: `email-change-verification`

Template React Email cu codul de 6 cifre afișat mare, brand PyRo. Adăugat în `supabase/functions/_shared/transactional-email-templates/registry.ts`.

### Componente React noi

1. `src/components/account/RealEmailSetupCard.tsx` — cardul cu form de email + OTP (folosit în `AccountProfileTab.tsx`).
2. `src/components/RealEmailReminderDialog.tsx` — dialogul modal zilnic (montat în `App.tsx` sau `MobileLayout.tsx`).
3. `src/hooks/useRealEmailReminder.ts` — hook care:
   - Returnează `shouldShow: boolean`
   - Logica: după 14:00 local, query `user_email_reminders` → dacă `dismissed_forever=false` ȘI `verified_at IS NULL` ȘI (`last_shown_date IS NULL` SAU `last_shown_date < azi`) → arată
   - Funcții `markShown()`, `dismissForever()`

### Modificări în `useAuthMethods.ts`

Extindem cu `hasVerifiedRealEmail: boolean` (citit din tabelul `user_email_reminders`) ca să ascundem cardul după verificare.

### Mount-ul dialogului

În `App.tsx` adăugăm `<RealEmailReminderDialog />` care:
- Se auto-evaluează la mount și la `visibilitychange`
- Nu se afișează pe rute publice (`/auth`, `/reset-password`, `/privacy-policy`, etc.)
- Nu se afișează pe rute de lecție/test în desfășurare (evităm întreruperi)

## Ce NU facem

- NU forțăm logout dacă userul refuză.
- NU blocăm accesul la features.
- NU schimbăm fluxul de login Apple existent.
- NU atingem login-ul Google/email/parolă.

## Pași de implementare

1. Migrație DB: tabel `user_email_reminders` + tabel `email_change_otps` + RLS.
2. Edge function `request-email-change` + email template nou.
3. Edge function `verify-email-change`.
4. Hook `useRealEmailReminder` + extindere `useAuthMethods`.
5. Componenta `RealEmailSetupCard` integrată în `AccountProfileTab.tsx`.
6. Componenta `RealEmailReminderDialog` montată în `App.tsx`.
7. Memorie nouă: `mem://features/account-management/real-email-enforcement` cu logica completă.

## Riscuri & note

- Dacă userul schimbă email-ul, `auth.users.email` se actualizează direct — orice notificare viitoare merge la noul email (private relay-ul Apple devine inactiv pentru recuperare în Supabase, dar Apple Sign In continuă să meargă pe iOS pentru că folosește Apple ID intern).
- OTP-urile expiră la 15 minute pentru securitate.
- Email-urile de verificare folosesc infrastructura existentă (`notify.pyroskill.info`).
