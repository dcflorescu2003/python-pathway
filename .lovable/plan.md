

# Fix: OAuth Android cu domeniu propriu `pyroskill.info`

Domeniul `pyroskill.info` este deja conectat. Implementăm bridge-ul web→native pentru ca login-ul Google să revină în aplicație.

## Modificări

### 1. `src/hooks/useAuth.tsx`
- Schimbăm `PRODUCTION_URL` de la `https://pyro-learn.lovable.app` la `https://pyroskill.info`
- `getRedirectUri()` pe nativ returnează `https://pyroskill.info?native_callback=1` (nu mai folosim `pyro://auth` — broker-ul îl respinge)

### 2. `index.html`
- Adăugăm un script inline **înainte** de `<div id="root">` care:
  - Verifică dacă URL-ul conține `?native_callback=1` ȘI `#access_token=...`
  - Dacă da, redirecționează instant la `pyro://auth#access_token=...&refresh_token=...`
  - Android interceptează `pyro://auth`, listener-ul `appUrlOpen` din `App.tsx` preia token-urile și face `setSession()` + `Browser.close()`
  - Pe web (fără `native_callback`), script-ul nu face nimic

### 3. `android/app/src/main/AndroidManifest.xml`
- Actualizăm intent-filter-ul HTTPS de la `pyro-learn.lovable.app` la `pyroskill.info`
- Păstrăm intent-filter-ul `pyro://auth` (custom scheme)

## Flow complet

```text
App → Browser.open(https://pyroskill.info/~oauth/initiate?provider=google&redirect_uri=https://pyroskill.info?native_callback=1)
  → Google OAuth consent
  → Redirect la https://pyroskill.info?native_callback=1#access_token=...
  → Script inline din index.html detectează native_callback + tokens
  → window.location.href = pyro://auth#access_token=...
  → Android interceptează pyro://auth (intent-filter)
  → appUrlOpen → setSession() → Browser.close()
  → Utilizatorul e logat în app
```

## Fișiere modificate
1. `src/hooks/useAuth.tsx` — PRODUCTION_URL + redirect nativ
2. `index.html` — script bridge web→native
3. `android/app/src/main/AndroidManifest.xml` — domeniu HTTPS actualizat

După implementare: rebuild APK cu `npx cap sync`.

