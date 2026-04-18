

## Plan: Push iOS + checklist App Store

### Modificări cod (le fac eu)

| Fișier | Schimbare |
|---|---|
| `ios/App/App/Info.plist` | Adaug `UIBackgroundModes: [remote-notification]` + `ITSAppUsesNonExemptEncryption: false` |
| `ios/App/App/AppDelegate.swift` | Handlere APNs (`didRegister...DeviceToken`, `didFailToRegister...`) ca să trimită tokenul către plugin-ul Capacitor |
| `supabase/functions/send-push/index.ts` | Adaug bloc `apns` în payload-ul FCM (priority 10, sound default) pentru livrare iOS |

### Document checklist (îl generez în `/mnt/documents/`)

Creez `PyRo-iOS-Push-AppStore-Checklist.md` (Markdown, lizibil în orice editor) cu următoarele secțiuni numerotate:

1. **Apple Developer Portal**
   - Activare Push Notifications pe App ID `ro.pythonpathway.app`
   - Generare APNs Auth Key (.p8) → notare Key ID + Team ID

2. **Firebase Console** (proiect `pyro-89b9f`)
   - Adăugare app iOS cu bundle id `ro.pythonpathway.app`
   - Descărcare `GoogleService-Info.plist` → plasare în `ios/App/App/`
   - Upload .p8 + Key ID + Team ID în Cloud Messaging

3. **Xcode (după `npx cap sync ios`)**
   - Signing & Capabilities → Push Notifications + Background Modes (Remote notifications)
   - Adăugare `GoogleService-Info.plist` la target App
   - Setare `MARKETING_VERSION` și `CURRENT_PROJECT_VERSION`

4. **App Store Connect**
   - Creare aplicație nouă (bundle id, SKU, limbă RO)
   - Privacy: declarare email + push token
   - Privacy Policy URL: `https://pyroskill.info/privacy-policy`
   - Cont demo pentru App Review (email + parolă elev)
   - Screenshots iPhone 6.7" / 6.5" / 5.5" (minim 3 fiecare)
   - Categorie Education, age rating, descriere, keywords

5. **Build & Submit**
   - Product → Archive → Distribute → App Store Connect
   - TestFlight intern înainte de submit
   - Submit for Review

6. **Troubleshooting** — erori frecvente (token nu apare, FCM 404, missing entitlement)

### Ce-mi trebuie de la tine pentru document
- **Cont demo elev** (email + parolă) pe care să-l includ direct în checklist pentru secțiunea App Review? (Sau să las placeholder `[de completat]`)

