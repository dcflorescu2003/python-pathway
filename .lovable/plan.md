## Obiectiv
Adăugarea suportului nativ pentru Sign in with Google pe iOS (și Android), folosind iOS Client ID-ul nou creat în Google Cloud Console, fără a strica login-ul Web existent.

## Context
- Web OAuth folosește deja Web Client ID configurat în Lovable Cloud → Google Provider (BYOK).
- iOS nativ NU poate folosi același redirect web, are nevoie de un iOS Client ID dedicat (deja creat: `500659609573-544m8gs54gukhl5vn1so298rvuvaif67.apps.googleusercontent.com`).
- Lovable Cloud acceptă orice idToken Google valid emis pentru același Google Cloud Project, deci tokenul nativ obținut pe iOS va fi acceptat la `signInWithIdToken`.

## Modificări de cod

### 1. Instalare plugin nativ
- Adaugă `@capgo/capacitor-social-login` în `package.json` (suportă Apple + Google nativ).

### 2. Detectare platformă în componenta de login
- În `useGoogleAuth` (sau echivalentul folosit în butonul Google):
  - Dacă `Capacitor.isNativePlatform()` și `getPlatform() === 'ios'` → folosește fluxul nativ.
  - Altfel (web sau Android pentru moment) → păstrează fluxul existent `lovable.auth.signInWithOAuth("google", …)`.

### 3. Flux nativ iOS
```ts
import { SocialLogin } from '@capgo/capacitor-social-login';
import { supabase } from '@/integrations/supabase/client';

await SocialLogin.initialize({
  google: {
    iOSClientId: '500659609573-544m8gs54gukhl5vn1so298rvuvaif67.apps.googleusercontent.com',
  },
});

const res = await SocialLogin.login({
  provider: 'google',
  options: { scopes: ['email', 'profile'] },
});

const idToken = res.result.idToken;
await supabase.auth.signInWithIdToken({
  provider: 'google',
  token: idToken,
});
```

### 4. Configurare iOS native
- În `ios/App/App/Info.plist` adaugă `CFBundleURLSchemes` cu reverse client ID:
  `com.googleusercontent.apps.500659609573-544m8gs54gukhl5vn1so298rvuvaif67`
- Notă către user: după `git pull`, va trebui să ruleze `npx cap sync ios` pentru ca plugin-ul să se înregistreze nativ.

### 5. Memory update
- Actualizează `mem://auth/native-social-login` cu noul iOS Client ID și plugin-ul folosit (`@capgo/capacitor-social-login`).

## Detalii tehnice

### Fișiere modificate
- `package.json` – adaugă dependency
- `src/hooks/useGoogleAuth.ts` (sau locul unde se cheamă `signInWithOAuth("google")`) – ramificare nativ vs web
- `ios/App/App/Info.plist` – URL scheme pentru Google
- `mem://auth/native-social-login` – update memory

### Fișiere NEafectate
- `supabase/config.toml` – nimic
- `src/integrations/supabase/client.ts` – nimic (regulă fixă)
- Configurația Google din Lovable Cloud – nimic (rămâne BYOK Web)

## Pași pe care îi va face user-ul după implementare
1. `git pull` în repo local pe Mac
2. `npm install`
3. `npx cap sync ios`
4. Deschide `ios/App/App.xcworkspace` în Xcode
5. Rebuild + run pe iPhone
6. Test Sign in with Google → trebuie să apară sheet-ul nativ Google iOS, nu browser

## Riscuri / nesiguranțe
- Pe Android nu schimbăm nimic acum – continuă pe fluxul web existent (funcționează).
- Dacă `signInWithIdToken` e respins, înseamnă că iOS Client ID-ul nu e în același Google Cloud Project ca Web Client ID-ul – dar din ce ai trimis (același prefix `500659609573-`), e același proiect, deci va merge.
