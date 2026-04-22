

## Plan: Diagnosticare si reparare notificari push Android

### Problema identificata

Infrastructura push este corect configurata:
- `@capacitor/push-notifications` instalat si functional
- Device tokens se salveaza in baza de date (10+ token-uri active)
- `FIREBASE_SERVICE_ACCOUNT` secret configurat
- `google-services.json` prezent in proiectul Android
- Edge functions `send-push` si `send-streak-reminder` exista

Insa **`send-push` nu a fost apelata niciodata** (zero log-uri). Singurul loc care o invoca este `ChallengeAssigner.tsx` cand un profesor atribuie o provocare. Functia `send-streak-reminder` nu are niciun scheduler/cron care s-o apeleze automat.

### Pasi de rezolvare

#### 1. Test imediat: verificare ca FCM functioneaza
- Apelez `send-push` edge function manual cu un token real din baza de date pentru a confirma ca Firebase Cloud Messaging trimite cu succes notificari pe dispozitiv.
- Daca FCM returneaza eroare, diagnosticam problema din `FIREBASE_SERVICE_ACCOUNT` sau configurarea proiectului Firebase.

#### 2. Adaugare cron job pentru `send-streak-reminder`
- Activez `pg_cron` (daca nu e deja activ) si creez un cron job care apeleaza `send-streak-reminder` zilnic seara (de ex. ora 20:00 Romania, UTC+3 = 17:00 UTC).
- Asta va trimite automat notificari push utilizatorilor care au streak activ dar nu au invatat inca in ziua respectiva.

#### 3. Extindere notificari push la mai multe evenimente
- **Cand profesorul distribuie un test** -- adaug apel `send-push` in fluxul de atribuire teste (similar cu provocarile)
- **Cand profesorul publica rezultatele** -- notificare catre elevii clasei cand se deblocheaza notele

#### 4. Fisiere modificate
- `supabase/functions/send-streak-reminder/index.ts` -- eventual mici ajustari daca testul FCM releva probleme
- `src/components/teacher/ClassDetail.tsx` sau `TestManager.tsx` -- adaugare apel `send-push` la distribuirea testelor
- `src/components/teacher/TestResults.tsx` -- apel `send-push` la publicarea rezultatelor
- Migrare SQL noua -- cron job `pg_cron` pentru streak reminder

#### 5. Verificare
- Testez `send-push` direct prin `curl_edge_functions` cu token-ul tau real
- Confirm ca primesti notificarea pe telefon
- Confirm ca streak reminder-ul se programeaza corect

