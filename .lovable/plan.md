# Reducere suplimentară a consumului de credite Cloud (runda 2)

## Ce am găsit acum

Baza de date e sănătoasă (memorie 19%, disc 28%), dar lista interogărilor lente arată două puncte clare de irosire:

1. **Notificările nu au index.** Citirea notificărilor necitite și marcarea lor ca citite scanează toată tabela: ~164 ms per citire, ~149 ms per „marchează ca citit". E cea mai costisitoare interogare a aplicației și rulează la fiecare 60 s pentru fiecare utilizator cu aplicația deschisă.
2. **Exercițiile nu au index pe ordonare.** Încărcarea listei de exerciții (sortate după `sort_order`) s-a executat de peste 2000 de ori și sortează de fiecare dată toată tabela.
3. **Verificarea abonamentului** mai face o actualizare în baza de date la fiecare rulare (1233 de execuții) — la 5 minute cât e fila vizibilă, plus la fiecare focus.
4. **Două sarcini programate rulează des**: reîncărcarea inimilor în cloud la fiecare 5 minute (288 de apeluri/zi) și notificarea „inimile s-au reîncărcat" la fiecare 30 de minute (48/zi). Pe web inimile se reîncarcă acum instant, deci aceste sarcini mai contează doar pentru aplicația mobilă.

## Modificări propuse

1. **Index pe notificări** — `notifications(read, created_at DESC)`. Citirile și marcările ca citit devin de zeci de ori mai ieftine ca timp de procesor. Fără nicio schimbare vizibilă.
2. **Index pe exerciții** — `exercises(sort_order, id)`. Elimină sortarea completă a tabelei la fiecare încărcare.
3. **Verificarea abonamentului: 5 min → 15 min** — reîmprospătarea la focus și după plată rămâne neschimbată, deci Premium-ul se activează la fel de repede; dispar 2 din 3 verificări de fond.
4. **Reîncărcarea inimilor în cloud: la 5 min → la 15 min** — pe web nu se simte deloc (reîncărcare instant), iar pe mobil inimile oricum se reîncarcă după 30 de minute, deci granularitatea de 15 minute nu schimbă experiența.
5. **Notificarea „inimile s-au reîncărcat": la 30 min → la 60 min** — se taie la jumătate apelurile; utilizatorul poate primi memento-ul cu până la 30 de minute mai târziu decât momentul exact.

## Ce NU atingem

- Notificările din aplicație (deja la 60 s, oprite în fundal), memento-urile de seară/săptămânale (retenție), cronul de expirare a Premium-ului manual (zilnic, necesar).
- Nu schimbăm dimensiunea instanței Cloud.

## Detalii tehnice

- Migrare nouă: `CREATE INDEX idx_notifications_read_created ON public.notifications (read, created_at DESC);` și `CREATE INDEX idx_exercises_sort_order ON public.exercises (sort_order, id);` — indexul nu modifică date, doar accelerează citirile.
- `src/hooks/useSubscription.ts`: interval 300_000 → 900_000.
- Cron: `cron.alter_job` pentru `refill-lives-every-5-min` → `*/15 * * * *` și `send-lives-refilled` → `0 * * * *`.
- Verificare: după migrare, re-rulez statistica interogărilor lente ca să confirm că cele două interogări nu mai apar sus în clasament; typecheck pentru hook.

## Rezultat așteptat

Cea mai mare economie vine de la indexuri (timp de procesor per cerere mult mai mic) și din cele ~340 de apeluri de funcții/zi eliminate. Cifra exactă în credite depinde de trafic și nu poate fi garantată.
