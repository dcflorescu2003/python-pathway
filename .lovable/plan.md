

# Fix: Revenire în aplicație după Google OAuth pe Android

## Problema
După autentificarea Google în browser, redirect-ul ajunge pe `https://pyro-learn.lovable.app` dar rămâi în Chrome — aplicația nativă nu interceptează link-ul. Cauza: `android:autoVerify="true"` necesită un fișier `/.well-known/assetlinks.json` pe domeniu, pe care nu-l controlăm.

## Soluția

### 1. Instalare `@capacitor/app` și `@capacitor/browser`
- `@capacitor/app` — permite ascultarea evenimentelor de deep link (`appUrlOpen`)
- `@capacitor/browser` — deschide OAuth într-un In-App Browser (Custom Tab) în loc de Chrome extern, ceea ce permite revenirea automată în app

### 2. Modificare `useAuth.tsx` — OAuth nativ cu In-App Browser
- Detectăm dacă rulăm pe Capacitor (via `@capacitor/core` → `Capacitor.isNativePlatform()`)
- Pe nativ: deschidem URL-ul OAuth în In-App Browser (`Browser.open()`) cu redirect_uri setat la un custom scheme (ex: `pyro://auth`)
- Pe web: păstrăm flow-ul actual cu `lovable.auth.signInWithOAuth`

### 3. Custom URL scheme în `AndroidManifest.xml`
- Adăugăm un `intent-filter` cu scheme-ul `pyro` (fără `autoVerify`, care nu necesită assetlinks.json):
```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="pyro" android:host="auth" />
</intent-filter>
```

### 4. Listener deep link în `App.tsx`
- La pornirea aplicației, înregistrăm un listener pe `App.addListener('appUrlOpen')` 
- Când primim un URL de tipul `pyro://auth?...` sau `https://pyro-learn.lovable.app/...`, extragem token-urile din URL și apelăm `supabase.auth.setSession()` pentru a finaliza autentificarea

### 5. Păstrăm intent-filter-ul `https` existent
- Eliminăm `autoVerify="true"` (nu funcționează fără `assetlinks.json`)
- Păstrăm ca fallback pentru cazuri în care utilizatorul deschide manual link-ul

## Detalii tehnice
- `@capacitor/browser` folosește Chrome Custom Tabs pe Android — browserul apare ca un overlay peste app, nu ca o fereastră separată, și se închide automat la redirect
- Capacitor `App` plugin interceptează automat URL-urile care match-uiesc scheme-ul custom
- Flow-ul web rămâne neschimbat — modificările afectează doar build-ul nativ
- După implementare: `npx cap sync` + rebuild APK

