## Versiuni curente

- **package.json**: `1.108.0`
- **Android** (`android/app/build.gradle`): `versionName "1.110"`, `versionCode 110`
- **iOS** (`project.pbxproj`): `MARKETING_VERSION 1.110`, `CURRENT_PROJECT_VERSION 110`

Android și iOS sunt aliniate la **1.110**. `package.json` a rămas în urmă la `1.108.0`.

## Plan de aliniere

Actualizez `package.json` de la `1.108.0` → `1.110.0` ca să corespundă cu Android/iOS. Singura modificare:

```json
"version": "1.110.0"
```

Fără alte schimbări (Android și iOS sunt deja corecte).