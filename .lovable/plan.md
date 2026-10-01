# Tabul „Statistici" lipsește la unii profesori verificați

## Ce am găsit
Tabul „Statistici" din clasă apare doar pentru profesorii cu abonament **Profesor AI** activ (în prezent, cel gratuit până la 31 decembrie). Verificat în baza de date:

- Cei care au fost verificați de tine din panoul Admin (cerere aprobată) primesc automat abonamentul gratuit, deci văd tabul.
- Cei verificați prin **cod de invitație** (ex. TESTER2026) sau prin **cod de recomandare** NU primesc abonamentul, pentru că acele două căi de verificare nu trec prin aprobarea din Admin. Rezultat: 10 profesori verificați (septembrie 2026) nu au Premium și nu văd „Statistici"; 6 dintre ei au verificarea prin cod de invitație, iar restul au același profil.
- Profesorii încă neverificați (unverified/pending) nu primesc abonamentul, conform regulii stabilite (doar profesori verificați).

## Ce vom face
1. Verificarea prin cod de invitație și prin cod de recomandare acordă același abonament gratuit Profesor AI până la 31 decembrie 2026, cu aceeași notificare „Abonament Profesor AI gratuit" ca la aprobarea din Admin. Anularea automată de la 31 decembrie rămâne cea existentă.
2. Reparăm retroactiv cei 10 profesori verificați care nu au primit abonamentul (același abonament, aceeași notificare).
3. Nu se schimbă nimic pentru profesorii neverificați și nu se schimbă aplicațiile mobile (modificarea e doar pe server; nu e nevoie de bump de versiune).

## Detalii tehnice
- Migrație SQL: `CREATE OR REPLACE FUNCTION public.submit_teacher_verification` — în ramurile `invite_code` și `referral`, la `UPDATE profiles` se adaugă `is_premium = true, premium_manual = true, premium_manual_until = GREATEST(COALESCE(premium_manual_until, '2026-12-31 23:59:59+02'), '2026-12-31 23:59:59+02'), premium_manual_by = NULL` (trigger-ul de protecție e deja ocolit prin `app.bypass_profile_protection`), plus `INSERT INTO notifications` cu textul existent.
- Backfill în aceeași migrație: pentru `profiles` cu `is_teacher AND teacher_status='verified' AND premium_manual = false` se setează aceleași câmpuri și se inserează notificarea.
- `expire_manual_premium()` și cron-ul zilnic rămân neschimbate (vor reseta `premium_manual` la expirare).
- Nu se modifică `ClassDetail.tsx` (condiția `isTeacherPremium` rămâne), nici funcția `check-subscription`.
- După aplicare: verificare prin interogare că nu mai există profesori verificați fără Premium activ.
