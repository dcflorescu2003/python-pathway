

## Plan: Apple Sign-In nativ pe Android (la fel ca Google)

### Problema
Pe Android nativ, Apple Sign-In deschide un browser extern care nu se închide automat după autentificare. Google funcționează corect pentru că folosește SDK-ul nativ (`@capgo/capacitor-social-login`), dar Apple încă folosește fluxul vechi cu browser.

### Soluția
Folosim același plugin `@capgo/capacitor-social-login` și pentru Apple, identic cu Google. Pluginul gestionează intern fluxul Apple pe Android și returnează un `idToken` care se trimite la Supabase.

### Modificări fișiere

| Fișier | Schimbare |
|--------|-----------|
| `capacitor.config.ts` | Setează `apple: true` în `SocialLogin.providers` |
| `src/hooks/useAuth.tsx` | Adaugă funcția `signInWithNativeApple()` (similară cu `signInWithNativeGoogle`), care folosește `SocialLogin.login({ provider: "apple" })` și `supabase.auth.signInWithIdToken({ provider: "apple" })`. Actualizează `signInWithApple` să o apeleze pe Android nativ |

### Detalii tehnice
- `SocialLogin.login({ provider: "apple" })` pe Android deschide un dialog gestionat de plugin (nu browser extern), returnează `idToken`
- Token-ul se trimite direct la Supabase cu `signInWithIdToken({ provider: "apple", token: idToken })`
- Nu mai este nevoie de `Browser.open()` sau de mecanismul de deep link pentru Apple pe Android
- Inițializarea Apple în `SocialLogin.initialize()` nu necesită un `webClientId` ca Google

