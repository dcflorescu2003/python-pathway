## Problemă

Build-ul Android eșuează la `:capacitor-community-admob` cu:
> `getDefaultProguardFile('proguard-android.txt')` is no longer supported since it includes `-dontoptimize`

Cauza: AGP 9.1.0 + Gradle 9.4 nu mai acceptă fișierul `proguard-android.txt` (deprecat). Plugin-ul `@capacitor-community/admob@7.0.3` încă îl referențiază în `node_modules/.../android/build.gradle` linia 39. Nu putem edita `node_modules` — se pierde la `npm install`.

## Soluție

Aplicăm un patch la nivel de Gradle root, care, după ce sub-proiectele sunt evaluate, înlocuiește în `release.proguardFiles` referința deprecată cu `proguard-android-optimize.txt` pentru oricare modul afectat (în special `capacitor-community-admob`).

### Modificare în `android/build.gradle`

Adăugăm în blocul `allprojects { ... }` (sau imediat după el) un hook:

```gradle
subprojects { subproject ->
    subproject.afterEvaluate {
        if (subproject.hasProperty('android')) {
            subproject.android.buildTypes.all { bt ->
                def fixed = bt.proguardFiles.collect { f ->
                    f.name == 'proguard-android.txt'
                        ? android.getDefaultProguardFile('proguard-android-optimize.txt')
                        : f
                }
                bt.proguardFiles.clear()
                bt.proguardFiles.addAll(fixed)
            }
        }
    }
}
```

Acest fix:
- rulează automat la fiecare build, fără modificări în `node_modules`
- supraviețuiește `npm install` / `npx cap sync`
- nu afectează modulele care deja folosesc varianta corectă (inclusiv `app`)
- e neinvaziv: schimbă doar referința la fișierul ProGuard implicit

## Pași după aplicare

1. În Android Studio: **Build → Clean Project**, apoi **Rebuild Project**
2. Rulează din nou Generate Signed App Bundle

Dacă mai apar warnings legate de Gradle 10 deprecation, sunt din alte plugin-uri și nu blochează build-ul.