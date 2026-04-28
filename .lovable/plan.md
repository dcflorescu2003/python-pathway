## Problema reală

Setup-ul push pe iOS este 95% complet, dar **tokenul salvat în `device_tokens` pentru iOS este token APNs brut** (ex: `826A955E0F6044DBDCF4C9C24EFDEF...`), NU token FCM. Edge function-ul `send-push` îl trimite spre FCM HTTP v1, iar FCM îl respinge pentru că nu e un token Firebase valid — el rutează către APNs **doar dacă** tokenul a fost emis de Firebase iOS SDK.

Pe Android merge pentru că `@capacitor/push-notifications` returnează direct token FCM (Firebase e integrat prin `google-services.json` + plugin gradle). Pe iOS nu există echivalent integrat → returnează tokenul APNs brut de la Apple.

## Soluție: integrare Firebase iOS SDK

Adăugăm `FirebaseMessaging` în iOS pod, iar în `AppDelegate` interceptăm tokenul APNs, îl pasăm la Firebase, apoi expunem tokenul FCM rezultat către pluginul Capacitor printr-un eveniment custom (sau direct salvare).

### Pași tehnici

1. **`ios/App/Podfile`** — adăugăm:
   ```ruby
   pod 'Firebase/Messaging'
   ```

2. **`ios/App/App/AppDelegate.swift`** — adaptări:
   - `import Firebase` și `import FirebaseMessaging`
   - În `didFinishLaunchingWithOptions`: `FirebaseApp.configure()`
   - Implementăm `MessagingDelegate` și în `didRegisterForRemoteNotificationsWithDeviceToken`:
     - setăm `Messaging.messaging().apnsToken = deviceToken`
     - cerem token FCM cu `Messaging.messaging().token { ... }`
     - postăm notificarea `capacitorDidRegisterForRemoteNotifications` cu **tokenul FCM** (string convertit în Data) în loc de tokenul APNs brut
   - Fallback pentru `messaging:didReceiveRegistrationToken:` ca să prindem refresh-urile.

3. **`ios/App/App/GoogleService-Info.plist`** — deja există, verificăm că `BUNDLE_ID = ro.pythonpathway.app` corespunde cu Xcode project.

4. **Cleanup token-uri vechi APNs**: ștergem manual din `device_tokens` rândul iOS curent (`826A955E...`) ca la următorul login să se salveze tokenul FCM corect. Edge function-ul deja face cleanup automat la `UNREGISTERED`/`NOT_FOUND` de la FCM, dar curățăm preventiv.

5. **`pod install`** se rulează automat la build-ul iOS de către Capacitor (`npx cap sync ios`).

### Ce NU se modifică

- `usePushNotifications.tsx` — rămâne identic (pluginul va primi acum tokenul FCM, salvat la fel în `device_tokens`).
- `send-push` edge function — rămâne identic (deja trimite payload corect cu blocul `apns` pentru sound + badge).
- `device_tokens` schema + RLS — corecte.
- Entitlements + Info.plist — deja au `aps-environment` și `remote-notification`.

### Verificare după deploy

1. Build iOS nou → reinstalare app pe device
2. Login → `device_tokens` ar trebui să conțină acum un token de forma `xxx:APA91b...` (format FCM) pentru `platform=ios`
3. Trigger un push (ex. notificare de la profesor) → ar trebui să sosească pe iPhone chiar și cu app închisă

### Notă

În Firebase Console → Project Settings → Cloud Messaging → iOS app, trebuie încărcată **APNs Authentication Key (.p8)** (sau certificat APNs) ca Firebase să poată reda mai departe la APNs. Dacă nu e încă încărcată, push-urile vor pleca dar nu vor ajunge. Te anunț după deploy să verifici și asta în Firebase Console (singurul pas care nu se poate face din cod).
