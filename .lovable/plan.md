# Reducerea consumului de credite pentru Cloud (fără riscuri)

## Situația actuală
- În perioada de facturare curentă (11 sep – 11 oct), Cloud a consumat ~34 de credite. Fiecare workspace primește 20 de credite gratuite lunar pentru Cloud, deci costul real este mic, dar crește odată cu numărul de utilizatori.
- Baza de date este sănătoasă (memorie 38%, disc 28%, conexiuni puține), deci nu e nevoie de o instanță mai mare — nici de una mai mică.
- Cum se calculează: Cloud consumă credite după dimensiunea instanței, activitate (interogări, apeluri de funcții) și transfer de date. Nu putem reduce dimensiunea instanței fără risc, dar putem reduce activitatea inutilă.

## Ce am găsit în cod (surse de consum repetitiv)
1. **Notificările se reîncarcă automat la fiecare 30 de secunde** (`useNotifications.ts`, `refetchInterval: 30000`) pentru fiecare utilizator cu aplicația deschisă — chiar dacă fereastra e în fundal.
2. **Verificarea abonamentului rulează la fiecare 60 de secunde** (`useSubscription.ts`) — are deja cache de 15 secunde, dar intervalul forțat de 60s generează apeluri constante cât timp aplicația e deschisă.
3. **Reîncărcarea inimilor pe web verifică la fiecare 5 secunde** (`useProgress.ts`) — scrie în baza de date doar când inimile se schimbă, deci impact mic, dar intervalul poate fi mai relaxat fără efect vizibil.
4. Sarcinile programate (reîncărcare inimi la 5 minute, memento-uri zilnice) sunt rezonabile — nu le atingem.

## Modificări propuse (toate fără risc, comportament identic pentru utilizator)
1. **Notificările se reîncarcă doar când fila e vizibilă** și intervalul crește de la 30s la 60s. Bonus: la revenirea pe filă se face o reîmprospătare imediată, deci nimic nu se percepe ca întârziere.
2. **Verificarea abonamentului trece de la 60s la 5 minute**, cu reîmprospătare imediată la focus/achiziție (există deja). Premium-ul se activează oricum instant după plată prin mecanismul existent.
3. **Intervalul de inimi pe web trece de la 5s la 15s** — inimile se reîncarcă oricum instant pe web după ultima modificare, deci diferența e invizibilă.
4. Toate reîmprospătările periodice se opresc când fila/aplicația e în fundal (`document.visibilityState`), nu doar notificările.

## Ce NU facem (ar avea risc sau economie nesemnificativă)
- Nu schimbăm dimensiunea instanței Cloud (risc de încetinire; economia e mică la acest trafic).
- Nu reducem frecvența sarcinilor programate de trimitere a notificărilor push/email (afectează retenția).
- Nu introducem cache agresiv pe clasamente sau progres (risc de date învechite — experiența elevilor primează).

## Detalii tehnice
- Fișiere: `src/hooks/useNotifications.ts` (refetchInterval + `refetchIntervalInBackground: false`), `src/hooks/useSubscription.ts` (interval 60s → 300s), `src/hooks/useProgress.ts` (interval web 5s → 15s, oprire în fundal).
- Fără migrări, fără schimbări de backend, fără redeploy de funcții.
- Verificare: typecheck + observarea panoului de rețea în preview (mai puține cereri repetate cu fila deschisă, zero cu fila în fundal).

## Rezultat așteptat
Reducere estimată a activității repetitive de fundal cu ~50-70% per sesiune deschisă, ceea ce se traduce direct în credite Cloud mai puține pe măsură ce numărul de utilizatori crește. Economia exactă depinde de trafic și nu poate fi garantată ca cifră.
