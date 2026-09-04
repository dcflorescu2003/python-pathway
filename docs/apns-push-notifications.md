# Push notifications pe iOS (APNS)

## Cum funcționează

Aplicația PyRo trimite push notifications pe iOS direct prin **APNs HTTP/2 API**, nu prin Firebase Cloud Messaging. Acest lucru este implementat în:

- `supabase/functions/_shared/push.ts` — helper comun folosit de majoritatea funcțiilor.
- `supabase/functions/send-push/index.ts` — funcție dedicată de trimitere.

## Autentificare

Se folosește **APNs Auth Key (.p8)**. Variabilele de mediu necesare:

- `APNS_AUTH_KEY` — conținutul cheii private .p8 (format PEM).
- `APNS_KEY_ID` — Key ID din Apple Developer Portal (ex: `ABCD123456`).
- `APNS_TEAM_ID` — Team ID al contului Apple Developer.
- `APNS_BUNDLE_ID` — bundle ID al aplicației (`ro.pythonpathway.app`).

## Ce expiră și ce nu

| Componentă | Expiră? | Detalii |
|------------|---------|---------|
| Cheia APNs (.p8) | **Nu** | Rămâne valabilă până când este revocată manual în Apple Developer Portal. |
| Tokenul JWT generat din cheie | **Da** | Are o durată de viață de **60 de minute**. Codul îl generează automat și îl cache-uiește ~50 de minute înainte de regenerare. |
| Certificat APNs (dacă s-ar folosi) | **Da, anual** | Noi nu folosim certificat, deci nu este cazul. |
| Device token APNS | **Nu fix** | Poate deveni invalid la reinstalare, logout sau dezactivare push, dar nu are dată de expirare. |

## Cum verifici starea cheii

1. Intră în [Apple Developer Portal](https://developer.apple.com/account) → **Keys**.
2. Caută cheia folosită pentru `APNS_KEY_ID`.
3. Dacă cheia apare ca **revoked** sau **disabled**, push notifications pe iOS vor înceta să funcționeze.
4. Dacă este activă, nu este nevoie de reînnoire.

## Ce se întâmplă dacă cheia este compromisă/revocată

1. Generezi o nouă cheie APNs în Apple Developer Portal.
2. Copiezi noul `Key ID` și conținutul .p8.
3. Actualizezi secretele de runtime:
   - `APNS_AUTH_KEY`
   - `APNS_KEY_ID`
   - `APNS_TEAM_ID` (rămâne același de obicei)
4. Re-deploiezi Edge Functions pentru a prelua noile valori.

## Notă despre FCM

Pentru Android se folosește **Firebase Cloud Messaging** cu un service account (`FIREBASE_SERVICE_ACCOUNT`). Tokenul de acces FCM expiră la 60 de minute și este regenerat automat. Cheia/service account-ul nu expiră, dar poate fi rotit din Google Cloud Console.

## Monitorizare recomandată

- Verifică periodic log-urile funcției `send-push` pentru erori de autentificare APNS (`Failed to build APNs JWT`).
- Dacă vezi erori `BadDeviceToken` sau `Unregistered`, sunt gestionate automat prin ștergerea tokenului invalid.
