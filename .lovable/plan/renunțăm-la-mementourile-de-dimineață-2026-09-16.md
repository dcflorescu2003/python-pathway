# Renunțăm la mementourile de dimineață

## Situația verificată

- Mementoul de dimineață rulează zilnic la ora 6 (UTC) și trimite notificări elevilor cu serie activă care nu au lucrat ieri.
- Mementoul de seară rulează la ora 17 (UTC) și **deja** trimite doar celor care nu au lucrat în ziua respectivă (și care au fost activi în ultimele 14 zile), o singură dată pe zi per cont.

Deci partea a doua a cererii este deja implementată; nu e nevoie de nicio schimbare acolo.

## Ce facem

1. Oprim definitiv jobul programat de dimineață, ca să nu mai ruleze niciodată.
2. Ștergem funcția din spatele lui, ca să nu rămână cod nefolosit.
3. Lăsăm neatinse: mementoul de seară, cel de vineri, revenirea săptămânală și mementourile pentru profesori.

## Ajută la consumul de credite?

Da, puțin: dispare o rulare zilnică plus interogările și inserările ei în baza de date. Economia reală e modestă, pentru că este o singură rulare pe zi — sursele mari de consum sunt verificările repetate din aplicație (deja optimizate). Beneficiul secundar, poate mai important: elevii primesc mai puține notificări, deci scade riscul să le dezactiveze.

## Detalii tehnice

- `select cron.unschedule('send-streak-reminder-morning');` prin run_sql (nu migrare — jobul conține date specifice proiectului).
- Ștergerea funcției edge `send-streak-reminder` și a intrării ei din `supabase/config.toml`.
- `send-evening-reminder` rămâne exact cum este (filtrul `last_activity_date < azi` acoperă cerința „doar cei care nu au lucrat”).
