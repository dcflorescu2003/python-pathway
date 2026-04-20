

## Plan: Testare finală Play Billing cu loguri diagnostice

### Ce facem
Rebuild APK cu fix-ul actual → cumpărare de test → inspectăm logurile `playBilling` din Logcat și `verify-play-purchase` din Supabase pentru a confirma că `purchaseToken` are ~200+ caractere și verificarea Google Play reușește.

### Pașii utilizatorului (pe calculator)

1. **Rebuild APK cu codul nou:**
   ```bash
   npm run build
   npx cap sync android
   ```
2. **În Android Studio:** Build → Clean Project → Rebuild Project → Run (▶️) pe telefon.
3. **Deschide Logcat** în Android Studio, filtrează după `playBilling` (tag-ul logurilor noastre).
4. **Pe telefon:** login cu `maria.florescu2012@gmail.com` → Account → Restaurează achizițiile (sau cumpără din nou un plan test).
5. **Copiază din Logcat** liniile care încep cu `[playBilling] raw transaction` și `[playBilling] approved tx` și trimite-mi-le aici.

### Ce voi face eu după ce trimiți logurile

- Verific în Logcat ce câmp conține token-ul real (pentru că `cordova-plugin-purchase` variază între versiuni: uneori `nativePurchase.purchaseToken`, uneori `receipt.purchaseToken`, uneori într-un array `transactions[]`).
- Verific în `verify-play-purchase` logs dacă `tokenLen` > 100 și dacă `Play API response` întoarce `SUBSCRIPTION_STATE_ACTIVE`.
- Dacă token-ul tot nu apare corect, ajustez extractorul din `src/lib/playBilling.ts` pe baza structurii reale văzute în log.
- Dacă token-ul e corect dar Google API dă eroare, verific contul de service `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (permisiuni în Play Console).

### Plan B dacă nu poți rula Logcat

Adaug loguri care se trimit direct la `verify-play-purchase` chiar și când token-ul pare invalid, așa că putem diagnostica din Supabase logs fără Logcat. Asta e un mic edit în `playBilling.ts` + `verify-play-purchase/index.ts` pentru a accepta un mod "diagnostic".

### Rezultat așteptat
- Logcat: `hasToken: true`, `planId: "monthly"` sau `"yearly"`
- Supabase: `tokenLen: 200+`, `Play API response: SUBSCRIPTION_STATE_ACTIVE`
- DB: rând nou în `play_billing_subscriptions` cu `is_active: true`
- UI: status Premium activ pe contul Mariei, sursă `play_billing`

