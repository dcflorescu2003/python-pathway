## Problema

1. **Notificări duplicate dimineața pe Android**: Există un singur cron (`send-streak-reminder-morning` la 06:00). Cauza dublării e că în `device_tokens` mulți useri au mai multe token-uri pentru același device (vechi + nou, sau duplicate exacte). Funcția trimite push pentru fiecare token în parte → 2+ notificări. Exemple găsite: utilizator cu 2 token-uri Android identice; alți useri cu 4 token-uri (Android+iOS amestecate).

2. **Reminder de seară greșit**: `send-evening-reminder` trimite acum useri-lor care **AU fost activi azi** (`last_activity_date = today`) și au făcut <3 lecții. Userul vrea exact invers — celor care **NU au fost activi azi**.

## Soluția

### 1. Deduplicare device_tokens (rezolvă notificarea dublă)

**Migrație SQL**:
- Șterge duplicate exacte (același `token`) — păstrează doar cel mai recent.
- Adaugă constraint `UNIQUE (token)` ca să nu se mai repete.
- Adaugă constraint `UNIQUE (user_id, platform, token)` ca backup.
- Pentru fiecare user, păstrează cel mult 1 token activ per (user_id, platform): la INSERT din client, dacă există un token mai vechi pe același device, să fie înlocuit. Asta se face prin upsert (vezi pasul 2) + trigger care șterge token-urile mai vechi de 60 zile pentru același user pe aceeași platformă când se introduce unul nou.

**Curățare imediată**:
```sql
-- păstrează doar cel mai recent token per valoare distinctă
DELETE FROM device_tokens a USING device_tokens b
WHERE a.token = b.token AND a.created_at < b.created_at;
```

### 2. Logică push robustă (deduplicare la trimitere)

În `_shared/push.ts` și în `send-streak-reminder/index.ts`:
- Înainte de send, deduplică token-urile per user (Set pe valoarea `token`).
- Limitează la **maxim un push per (user_id, platform)** — păstrează cel mai recent `created_at`. Asta garantează că, chiar dacă rămân token-uri vechi nesterse, userul primește o singură notificare pe Android și una pe iOS.
- Token-urile pentru care FCM/APNs returnează `UNREGISTERED` / `NOT_FOUND` / `BadDeviceToken` să fie șterse (deja se face în `send-push`, dar nu și în reminderele de cron — adăugăm aceeași curățare).

### 3. Inversare logică `send-evening-reminder`

Modific query-ul în `supabase/functions/send-evening-reminder/index.ts`:
- Înlocuiesc filtrul `eq("last_activity_date", todayStr)` cu **users care NU au activitate azi**: `last_activity_date < todayStr` (sau IS NULL).
- Păstrez idempotency-ul (`last_evening_reminder_at != todayStr`).
- Elimin verificarea „>= 3 lecții azi" (irelevantă pentru useri inactivi).
- Mesajele rămân generice „mai e timp pentru o lecție rapidă" — se potrivesc.
- Opțional: limitez la useri care au logat în ultimele 14 zile (`last_activity_date >= now()-14`) ca să nu spammăm conturile abandonate. Recomand să fie inclus.

### 4. Refolosire helper `sendFCMPushes`

`send-streak-reminder` are inline ~100 linii de cod FCM identic cu `_shared/push.ts`. Îl înlocuiesc cu apelul la helper-ul shared (modificat să facă deduplicare).

## Fișiere modificate

- `supabase/functions/_shared/push.ts` — deduplicare token-uri per (user, platform), cleanup token-uri invalide.
- `supabase/functions/send-streak-reminder/index.ts` — folosește `sendFCMPushes` în loc de logică inline.
- `supabase/functions/send-evening-reminder/index.ts` — query inversat (useri inactivi azi).
- Migrație nouă: deduplicare + UNIQUE constraint pe `device_tokens.token`.

## Notă

Cron job-urile rămân neschimbate — există deja o singură intrare pentru `send-streak-reminder-morning` (06:00 UTC) și una pentru `send-evening-reminder` (17:00 UTC). Dublarea pe Android nu vine din cron, ci din token-uri duplicate.
