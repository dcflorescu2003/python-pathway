

User got error: Play Billing AIDL version too old, needs >= 6.0.1. Plus deprecation warnings from Gradle/AdMob (these are just warnings, can ignore).

The app uses Capacitor. They haven't installed any billing plugin yet — Stripe is currently used. The error means Google Play scans the AAB and finds an old AIDL Billing library somewhere. This usually comes from:
- A Capacitor plugin that bundles old Play Billing (admob plugin sometimes?)
- Or Google Play Services version

Actually — the warning shows `@capacitor-community/admob` is compiled. AdMob plugin doesn't include billing. So where does AIDL billing come from?

Most likely: there's no billing library at all, and Google detects the BILLING permission we just added but no modern Billing library → flags it. OR there's an old transitive dependency.

Best fix: add the modern Google Play Billing library directly to `android/app/build.gradle`:
```
implementation 'com.android.billingclient:billing:7.1.1'
```
This satisfies the >= 6.0.1 requirement. Even if not used yet via code (RevenueCat will use it later), having it declared makes Play Console accept the AAB.

Also bump versionCode to 56.

Warnings in screenshot are deprecation warnings from Gradle 8 + AdMob plugin — purely cosmetic, don't block anything. I'll mention this so user doesn't worry.

## Plan: Fix Play Billing AIDL error

### Cauza
Am adăugat `<uses-permission BILLING />` dar nu există nicio librărie modernă Play Billing în AAB. Google Play detectează permisiunea + lipsa Billing Library nouă → respinge upload-ul.

### Modificări

**1. `android/app/build.gradle`** — adaug dependența Play Billing 7.1.1 (cea mai nouă, peste pragul 6.0.1):
```gradle
implementation 'com.android.billingclient:billing:7.1.1'
```
Și bump `versionCode 55 → 56`, `versionName "1.55" → "1.56"`.

### Despre avertismente (screenshot)
Toate sunt **warnings**, nu erori — nu blochează build-ul:
- `android.usesSdkInManifest.disallowed=false` etc. → setări Gradle deprecated în AGP 8.x, vor fi eliminate în viitor; nu afectează funcționalitatea
- `Using flatDir should be avoided` → modul în care Capacitor leagă plugin-urile native, nu putem schimba
- `SMART_BANNER deprecated` → AdMob plugin folosește un API vechi pentru bannere, dar funcționează

**Le ignorăm momentan.** Sunt zgomot, nu probleme reale.

### Pașii tăi
1. `npm run build && npx cap sync android`
2. Android Studio → **Generate Signed App Bundle** (versionCode 56)
3. Upload AAB pe Alpha în Play Console
4. Eroarea Billing AIDL dispare → poți crea abonamentele

