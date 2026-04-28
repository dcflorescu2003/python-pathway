## Problema

Pe iOS, la apăsarea „Sign in with Apple" apare eroarea **„Missing provider or options"**.

Cauza: pluginul `@capgo/capacitor-social-login` (v8) cere pe iOS ca metoda `login()` să primească **două** câmpuri obligatorii: `provider` ȘI `options` (un obiect, chiar și gol). În `src/hooks/useAuth.tsx` trimitem doar `{ provider: "apple" }`, fără `options`, iar partea nativă Swift respinge apelul imediat:

```swift
guard let provider = call.getString("provider"),
      let payload = call.getObject("options") else {
    call.reject("Missing provider or options")
    return
}
```

Pe Android nu apare pentru că folosim `signInWithNativeGoogle` (alt path) și pentru că implementarea Apple pe Android e mai tolerantă.

## Modificări

### 1. `src/hooks/useAuth.tsx` — `signInWithNativeApple`
Adăugăm câmpul `options` cu scopurile standard Apple:

```ts
const response = await SocialLogin.login({
  provider: "apple",
  options: {
    scopes: ["email", "fullName"],
    // nonce opțional — Supabase nu îl impune când trimitem idToken
  },
} as any);
```

### 2. `src/hooks/useAuth.tsx` — `signInWithNativeGoogle` (preventiv)
Aceeași librărie, aceeași cerință. Adăugăm și aici `options: {}` ca să nu apară aceeași eroare pe Android dacă plugin-ul devine și mai strict într-un viitor update:

```ts
const response = await SocialLogin.login({
  provider: "google",
  options: {},
} as any);
```

## Configurare iOS necesară (în afara codului)

Aceste setări trebuie făcute manual în Xcode pentru ca Apple Sign In să funcționeze pe device real (nu sunt parte din cod):

1. **Capability „Sign In with Apple"** activată pe target-ul `App` în Xcode (Signing & Capabilities), atât pentru build Debug cât și Release.
2. Entitlement `com.apple.developer.applesignin = ["Default"]` (deja există în `AppRelease.entitlements`; trebuie adăugat și un `App.entitlements` pentru Debug, sau setat același file pentru ambele configurații).
3. În Apple Developer Portal: App ID-ul `ro.pythonpathway.app` să aibă „Sign In with Apple" activat și provisioning profile regenerat.
4. După modificare: `npx cap sync ios` + `pod install` în `ios/App`.

## Fișiere modificate
- `src/hooks/useAuth.tsx`

## După implementare
1. Build din Xcode pe device fizic (Apple Sign In nu merge pe simulator decât pe iOS 13+ cu cont Apple ID logat).
2. Apasă „Continuă cu Apple" — ar trebui să apară sheet-ul nativ Apple.
