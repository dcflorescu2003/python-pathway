# Verificare expirare componente push notifications (APNS)

## Context
Aplicația folosește `@capacitor/push-notifications` pe iOS. Pe device se înregistrează direct cu APNS, iar trimiterea de la server trece prin Firebase Cloud Messaging (prezent în `ios/App/App/GoogleService-Info.plist`). FCM are nevoie de o metodă de autentificare APNS configurată în Firebase Console.

## Ce expiră și ce nu

| Componentă | Expiră? | Detalii |
|------------|---------|---------|
| APNs Auth Key (.p8) | **Nu** | Cheia rămâne valabilă până e revocată manual în Apple Developer Portal. |
| Token JWT generat din cheia .p8 | **Da, la 60 min** | FCM/ serverul regenerază automat tokenul. |
| APNs Certificate | **Da, anual** | Trebuie reînnoit în Apple Developer Portal și re-uploadat în Firebase Console. |
| APNS device token | **Nu fix** | Poate fi invalidat la reinstall, logout sau dezactivare push, dar nu are dată de expirare. |

## Ce propun să verificăm

1. **Confirmăm metoda APNS din Firebase Console**: cheie .p8 sau certificat.
2. **Verificăm validitatea**: dacă e certificat, vedem data de expirare; dacă e .p8, confirmăm că nu e revocată.
3. **Documentăm pașii de reînnoire** într-un fișier intern pentru a evita întreruperi viitoare.

## Rezultat așteptat
- Clarificare pentru utilizator despre ce trebuie monitorizat.
- Eventual reminder calendaristic dacă se folosește certificat cu expirare anuală.
