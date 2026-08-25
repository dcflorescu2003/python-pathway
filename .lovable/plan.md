# Blindarea notificărilor Apple (apple_jws_chain)

## Cât de probabil / cât de greu (răspuns scurt)

- **Cât de greu tehnic:** mediu-scăzut pentru cineva cu experiență. Nu are nevoie de nicio cheie Apple: generează un certificat propriu, pune la finalul lanțului certificatul public al Apple Root CA (descărcabil de oricine), semnează un payload cu cheia lui și trimite un POST la webhook. Practic 30-60 minute de muncă pentru un atacator competent.
- **Cât de probabil:** scăzut în practică. Necesită ca atacatorul (1) să știe adresa exactă a webhook-ului, (2) să înțeleagă formatul App Store Server Notifications V2, (3) să cunoască un ID de utilizator (UUID) din aplicație. Nu e ceva ce nimeresc scanere automate; e un atac țintit.
- **Impact dacă se întâmplă:** mare — premium/profesor gratuit pentru orice cont, sau anularea abonamentului unui utilizator real.

Concluzie: risc real, probabilitate mică, dar merită reparat pentru că remedierea e simplă.

## Ce propun să facem

Nu încercăm validare completă de lanț X.509 în JavaScript (fragil). Folosim aceeași abordare deja validată în funcția de verificare a cumpărăturilor iOS: **nu ne bazăm pe semnătura din payload, ci re-confirmăm tranzacția direct la Apple**.

1. La primirea unei notificări, decodăm payload-ul doar pentru a afla `transactionId` și mediul (sandbox/producție).
2. Interogăm API-ul Apple App Store Server (cu cheia noastră privată de API, deja configurată) pentru acea tranzacție.
3. Aplicăm modificări în baza de date **numai** dacă Apple confirmă tranzacția, și folosim exclusiv datele returnate de Apple (produs, expirare, revocare, appAccountToken) — nu cele din payload-ul primit.
4. Dacă Apple nu confirmă, răspundem 200 (ca să nu retrimită Apple la infinit) dar nu schimbăm nimic și logăm respingerea.
5. Verificăm în plus `bundleId` și că `appAccountToken` corespunde unui utilizator existent.

## Detalii tehnice

- `supabase/functions/appstore-notifications-v2/index.ts`: înlocuim dependența de `verifyAppleJWS` ca sursă de încredere; extragem `transactionId`/`environment`, apoi refolosim logica de `makeAppleJWT()` + `fetchTransactionInfo()` din `verify-ios-purchase` (mutată în `supabase/functions/_shared/apple-store-api.ts`) pentru a obține datele autoritative.
- `supabase/functions/_shared/apple-jws.ts`: rămâne doar ca decodor/verificare preliminară, cu comentariu explicit că nu e sursă de încredere.
- `supabase/functions/verify-ios-purchase/index.ts`: se refactorizează să importe helperul comun (fără schimbare de comportament).
- Fără modificări de schemă în baza de date.

## Verificare

- Test cu payload forjat (certificat propriu + root Apple public) → trebuie respins, fără modificări în `profiles` / `play_billing_subscriptions`.
- Test cu tranzacție reală sandbox → premium/profesor se aplică corect.
