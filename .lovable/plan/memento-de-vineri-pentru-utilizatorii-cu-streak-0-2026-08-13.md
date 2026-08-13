# Memento de vineri pentru utilizatorii cu streak 0

## Ce vom construi

În fiecare vineri la 19:00 (ora României), utilizatorii care au streak 0 primesc:

- o notificare push pe telefon,
- o notificare în aplicație (clopoțelul), cu un mesaj motivant care îi invită să revină.

Mesajele sunt alese aleator dintr-un set de 5-6 variante, ca să nu pară repetitive.

Reguli de trimitere:

- doar conturi de elev (profesorii sunt excluși, la fel ca la celelalte mementouri),
- doar conturi care au avut măcar puțină activitate (XP > 0), ca să nu deranjăm conturile complet noi,
- maximum o dată pe săptămână per utilizator (protecție împotriva dublurilor).

## Despre partea de email

Emailurile de tip „revino pe platformă" sunt considerate emailuri de re-engagement/marketing și nu pot fi trimise prin infrastructura de email a aplicației (care este destinată strict emailurilor tranzacționale: confirmări, resetări de parolă, notificări declanșate de o acțiune a utilizatorului). Trimiterea în masă a unui astfel de mesaj ar afecta reputația domeniului `notify.pyroskill.info` și livrabilitatea emailurilor importante (verificare cont, resetare parolă).

Recomandare: păstrăm mementoul pe push + notificare în aplicație. Dacă vrei totuși email de re-engagement, se face printr-un serviciu dedicat de email marketing, pe un alt subdomeniu, cu dezabonare gestionată acolo.

## Detalii tehnice

1. **Funcție nouă `send-friday-streak-boost**` (Edge Function), pe modelul `send-weekly-comeback`:
  - protejată cu `checkSchedulerSecret`,
  - selectează din `profiles`: `is_teacher = false`, `streak = 0`, `xp > 0`,
  - filtru anti-duplicat pe o coloană nouă `last_friday_boost_at` (mai veche de 6 zile sau NULL),
  - inserează rânduri în `notifications` și trimite push prin `sendFCMPushes`,
  - actualizează `last_friday_boost_at` pentru cei notificați.
2. **Migrație DB**: adăugare coloană `last_friday_boost_at date` în `profiles`.
3. **Config**: `verify_jwt = false` pentru noua funcție în `supabase/config.toml`.
4. **Cron job**: `0 16 * * 5` (UTC) = vineri 19:00 ora României pe timpul verii. Notă: iarna (ora standard, UTC+2) ar cădea la 18:00; dacă vrei fix 19:00 tot anul, programăm două joburi sau facem un job orar care verifică ora locală — spune-mi dacă preferi asta.
5. **Deploy** funcției și verificarea unei rulări de test manuale.

Renuntam la emailuri