

User confirmed option (b): button still shows "Încarcă un APK nou", meaning the AAB doesn't declare the BILLING permission. Need to add it to AndroidManifest.xml, increment versionCode, then user rebuilds and uploads.

Current AndroidManifest.xml (from context) has:
- POST_NOTIFICATIONS
- INTERNET
But NOT `com.android.vending.BILLING`.

Current versionCode is 42 / versionName 1.42 (from build.gradle in context). But user just uploaded version 48 (1.48) to Alpha — so the gradle file in repo is behind. They've been bumping it locally. I should bump to 49 / 1.49.

Plan is simple, 2 file edits + user rebuild steps.

## Plan: Adăugare permission Billing + rebuild AAB

### Modificări cod (le fac eu)

**1. `android/app/src/main/AndroidManifest.xml`**
Adaug linia:
```xml
<uses-permission android:name="com.android.vending.BILLING" />
```
(lângă celelalte `uses-permission`, înainte de `<application>`)

**2. `android/app/build.gradle`**
Incrementez:
- `versionCode 42` → `versionCode 49`
- `versionName "1.42"` → `versionName "1.49"`

(Versiunea curentă în Play Console e 48, deci 49 e următoarea validă.)

### Pașii pe care îi faci tu după

```bash
git pull
npm install
npm run build
npx cap sync android
npx cap open android
```

În Android Studio:
1. **Build → Generate Signed App Bundle** → folosește același keystore ca pentru versiunea 48
2. Variant: **release**
3. Fișierul rezultat: `android/app/release/app-release.aab`

În Google Play Console:
1. **Testare → Testare închisă → Alpha → Creează versiune nouă**
2. Upload `app-release.aab` (versiunea 49)
3. Release notes: „Adăugat suport Google Play Billing"
4. **Lansează la Alpha**
5. Așteaptă procesarea (5-15 min)

Apoi:
1. **Monetizează → Produse → Abonamente**
2. Acum apare butonul **„Creează abonament"**
3. Spune-mi când ești acolo și continuăm cu cele 2 abonamente (`student_premium` + `teacher_premium`).

