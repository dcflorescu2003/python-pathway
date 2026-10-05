# Pasul A — reducerea consumului bazei de date (fără impact asupra aplicației)

## Ce facem
1. **Index nou pentru notificări** — `notifications(user_id, read, created_at DESC)`. Indexul existent `(read, created_at)` nu include utilizatorul, deci fiecare citire scanează mult. Creat cu `CONCURRENTLY`/fără blocarea tabelului; indexul vechi rămâne (nu ștergem nimic).
2. **Curățare istoric cron** — ștergem din `cron.job_run_details` intrările mai vechi de 7 zile (~1,9 GB) și adăugăm un job zilnic care păstrează doar ultimele 7 zile. Sunt doar jurnale tehnice; joburile programate (notificări, expirare Premium) nu sunt afectate.
3. **Cache mai lung pentru catalogul de lecții și probleme** — în `useChapters.ts` și `useProblems.ts`: `staleTime` 30s → 30 min, renunțăm la `refetchOnMount: "always"`. Progresul elevului (XP, lecții terminate) NU e afectat — vine din alte surse și rămâne la fel. Singurul efect: o lecție nouă adăugată din Admin apare la elevi în maxim 30 min (sau la repornirea aplicației).

## Siguranță
- Nicio modificare de structură a tabelelor, nicio ștergere de date ale utilizatorilor.
- Revenire ușoară din History dacă e nevoie.
- Verificare după: build OK, încărcare lecții/probleme/notificări în preview.

## Update în store?
**Nu.** Indexul și curățarea sunt pe server; aplicațiile mobile încarcă interfața de pe server la fiecare pornire doar dacă... — de fapt aplicațiile native au codul web inclus, deci cache-ul mai lung (punctul 3) ajunge pe telefoane doar cu un build nou. Punctele 1–2 (cele mai importante pentru cost) funcționează imediat pentru toți. Facem **bump la 1.228** (code 228) pe Android, iOS și `appVersion.ts`, ca să poți trimite build-ul când vrei — nu e urgent.
