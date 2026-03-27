

# Fix: Google OAuth „redirect_uri is not allowed" pe Android

## Problema

Când aplicația rulează ca APK nativ (prin Capacitor), `window.location.origin` returnează ceva de genul `http://localhost` sau `capacitor://localhost`. Acest URI nu este în lista de redirect URI-uri autorizate din Google OAuth, de aceea apare eroarea `invalid_request`.

## Soluția

Trebuie să ne asigurăm că `redirect_uri` trimis la Google OAuth este unul valid — adică URL-ul publicat al aplicației web (`https://pyro-learn.lovable.app`), nu `localhost`.

### Modificări

**Fișier: `src/hooks/useAuth.tsx`**

- Detectăm dacă aplicația rulează în Capacitor (nativ) verificând dacă `window.location.origin` conține `localhost` sau `capacitor://`
- Dacă da, folosim URL-ul publicat (`https://pyro-learn.lovable.app`) ca `redirect_uri`
- Dacă nu (web normal), păstrăm `window.location.origin`

```typescript
const getRedirectUri = () => {
  const origin = window.location.origin;
  // In Capacitor (native app), origin is localhost or capacitor://
  if (origin.includes('localhost') || origin.includes('capacitor://')) {
    return 'https://pyro-learn.lovable.app';
  }
  return origin;
};
```

Apoi folosim `getRedirectUri()` în loc de `window.location.origin` în `signInWithGoogle` și `signInWithApple`.

**Fișier: `android/app/src/main/AndroidManifest.xml`**

- Adăugăm un `intent-filter` pentru deep links, astfel încât după autentificarea Google, Android-ul să redirecționeze înapoi în aplicație:

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="pyro-learn.lovable.app" />
</intent-filter>
```

**Fișier: `capacitor.config.ts`**

- Adăugăm configurare pentru server URL în producție, permițând Capacitor să intercepteze redirect-urile:

```typescript
server: {
  androidScheme: 'https',
}
```

### Notă importantă
După rebuild-ul APK-ului, URL-ul `https://pyro-learn.lovable.app` trebuie să fie adăugat ca **Authorized redirect URI** în consola Google Cloud (dacă folosești credențiale proprii). Dacă folosești Lovable Cloud managed Google OAuth, acesta ar trebui să fie deja autorizat automat.

