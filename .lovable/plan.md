# Inimi fără așteptare pe web + Premium AI gratuit pentru profesori verificați (temporar)

## 1. Web: inimile se reîncarcă imediat

Pe web, cine rămâne fără inimi poate relua lecția pe loc: cele 5 inimi se refac
automat, fără cele 30 de minute de așteptare și fără Premium.

- Pe telefon (aplicația din Google Play / App Store) rămâne exact ca acum:
  30 de minute sau o reclamă.
- Contorul de inimi rămâne vizibil pe web și scade la greșeli, dar când ajunge
  la 0 se completează instant la 5.
- Textul din fereastra „Reîncarcă inimile" pe web se schimbă: în loc de
  „așteaptă 30 de minute", se spune că inimile se refac imediat. Blocul cu
  instalarea aplicației mobile și butonul de reclamă (dezactivat) rămân.

## 2. Profesori verificați: Premium AI gratuit până la 31 decembrie 2026

- Toți profesorii deja verificați primesc acum abonamentul Profesor AI gratuit,
  valabil până la 31 decembrie 2026.
- De acum înainte, la fiecare verificare a unui cont de profesor, acesta primește
  automat același abonament și o notificare în aplicație:
  „Ai primit gratuit abonamentul Profesor AI până la 31 decembrie 2026. După
  această dată se anulează automat."
- Anularea este automată: un proces care rulează în fiecare noapte scoate
  abonamentul gratuit expirat, iar verificarea abonamentului din aplicație îl
  consideră expirat din prima secundă după 31 decembrie. Nu se cere card și nu
  se face nicio plată — nu există risc de taxare.
- Profesorii care au deja un abonament plătit (Stripe / magazine) nu sunt
  afectați: abonamentul plătit are prioritate.

## Detalii tehnice

### Inimi pe web
- `src/hooks/useProgress.ts`: `regenerateLives` folosește `FULL_REGEN_MS = 0`
  când `!Capacitor.isNativePlatform()` (refill instant la `lives === 0`), restul
  logicii și scrierile în cloud rămân neschimbate.
- `src/components/RefillLivesDialog.tsx`: pe web, blocul „Clock" afișează
  „inimile se reîncarcă imediat"; ramura nativă rămâne identică.
- Funcția programată `refill-lives` și fereastra `LivesRefilledDialog` rămân
  neatinse (continuă să servească aplicația nativă).

### Premium AI pentru profesori verificați
- Migrare: funcție `expire_manual_premium()` (SECURITY DEFINER, setează
  `app.bypass_profile_protection`) care face
  `premium_manual = false, premium_manual_until = null, is_premium = false`
  pentru profilurile cu `premium_manual_until < now()`, plus un job `pg_cron`
  zilnic la 00:10 care o apelează. Cadență zilnică (1 rulare/zi) — suficient,
  pentru că verificarea abonamentului din aplicație tratează deja
  `premium_manual_until` trecut ca expirat; întârzierea maximă a curățării în
  baza de date este de 24h, fără efect pentru utilizator.
- Migrare: `approve_teacher_request` setează în plus
  `premium_manual = true, premium_manual_until = '2026-12-31 23:59:59+02',
  is_premium = true` (doar dacă nu există deja un `premium_manual_until` mai
  târziu) și inserează un rând în `notifications` cu mesajul de mai sus.
- `supabase/functions/check-subscription/index.ts`: când premiumul manual este
  activ și profilul are `teacher_status = 'verified'`, răspunsul include
  `coupon_type: "teacher"` alături de `source: "admin"`.
- `src/hooks/useSubscription.ts`: `isTeacherPremium` acceptă și
  `source === "admin" && couponType === "teacher"`, astfel încât limitele
  Profesor AI (itemi AI, teste salvate) se aplică corect.
- Backfill prin `run_sql`: aceleași câmpuri pentru profilurile existente cu
  `teacher_status = 'verified'` care nu au deja premium mai lung.

## Ce NU se atinge
- Nimic legat de R8 / builduri Android (rămâne programat pe 4 octombrie).
- Prețurile și produsele din magazine, Stripe, cupoanele.
- Logica de XP, progres, RLS pentru alte tabele.
