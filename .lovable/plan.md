

# Eliminarea API-urilor depreciate pentru edge-to-edge (Android 15)

## Problema
Android 15 marchează `setStatusBarColor`, `setNavigationBarColor` și `getStatusBarColor` ca depreciate. Avertismentul vine din XML-ul temei (`android:statusBarColor`, `android:navigationBarColor`) și din biblioteca `androidbrowserhelper` (care e o dependență tranzitivă a Capacitor).

## Soluția

### 1. Eliminare `statusBarColor` și `navigationBarColor` din XML-uri
**Fișiere:** `values/styles.xml` și `values-v28/styles.xml`

Eliminăm liniile:
```xml
<item name="android:statusBarColor">@android:color/transparent</item>
<item name="android:navigationBarColor">@android:color/transparent</item>
```
Pe Android 15+, barele sunt deja transparente implicit. Pe versiuni mai vechi, le setăm programatic prin `WindowInsetsControllerCompat` (care nu folosește API-urile depreciate).

### 2. Creare `values-v35/styles.xml` (Android 15+)
Fișier nou cu tema curată, fără referințe la culorile barelor:
```xml
<style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
    <item name="windowActionBar">false</item>
    <item name="windowNoTitle">true</item>
    <item name="android:background">@null</item>
    <item name="android:windowDrawsSystemBarBackgrounds">true</item>
    <item name="android:windowLayoutInDisplayCutoutMode">always</item>
</style>
```

### 3. Actualizare `MainActivity.java`
Folosim `EdgeToEdge.enable(this)` din `androidx.activity` (metoda modernă recomandată de Google) în loc de `WindowCompat.setDecorFitsSystemWindows`. Dacă `EdgeToEdge` nu e disponibil (Capacitor BridgeActivity nu extinde `ComponentActivity`), rămânem pe `WindowCompat` dar adăugăm `WindowInsetsControllerCompat` pentru a seta barele transparente programatic fără API-uri depreciate:

```java
WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
WindowInsetsControllerCompat controller = 
    WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
controller.setAppearanceLightStatusBars(false);
controller.setAppearanceLightNavigationBars(false);
```

### 4. Nota despre `androidbrowserhelper`
Avertismentele din `com.google.androidbrowserhelper.trusted.Utils` vin dintr-o dependență tranzitivă a Capacitor. Nu le putem controla direct — se vor rezolva când Capacitor actualizează acea dependență. Eliminarea din propriul cod este tot ce putem face.

## Fișiere modificate
1. `android/app/src/main/res/values/styles.xml` — eliminare statusBarColor/navigationBarColor
2. `android/app/src/main/res/values-v28/styles.xml` — eliminare statusBarColor/navigationBarColor
3. `android/app/src/main/res/values-v35/styles.xml` — nou, temă curată pentru Android 15+
4. `android/app/src/main/java/ro/pythonpathway/app/MainActivity.java` — WindowInsetsControllerCompat

