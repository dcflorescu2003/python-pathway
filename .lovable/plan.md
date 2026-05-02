
## Problem

Pe unele iPhone-uri, după login utilizatorul vede lecțiile câteva secunde, apoi este delogat automat. Pe alte device-uri (inclusiv Android) merge perfect. Comportamentul este intermitent → simptom clasic de **persistență instabilă a sesiunii în WKWebView (Capacitor iOS)**.

## Cauze identificate

1. **`localStorage` direct ca storage pentru Supabase (`src/integrations/supabase/client.ts`)**
   În WKWebView (iOS), `localStorage` poate fi:
   - golit silențios la presiune de memorie / iOS reclamă spațiu;
   - scris asincron — după `signInWithIdToken`, refresh token-ul ajunge în memorie, dar nu mereu pe disc înainte de următorul tick de auto-refresh;
   - separat per WebView instance (poate diferi după update / reinstalare).
   Rezultat: Supabase auto-refresh (la pornire / la ~5s) nu găsește refresh token persistat → emite `SIGNED_OUT` → `useAuth` setează `user = null` → `Index.tsx` redirectează la `/auth`. Asta se vede exact ca în video: lecțiile apar, apoi user-ul e dat afară.

2. **Watchdog de pornire (`src/App.tsx`)**
   Reload forțat după 7s dacă `pyro-startup-ready` nu e setat. Pe iOS lent / la cold start după login, poate trage un reload în mijlocul restaurării sesiunii și amplifica problema.

3. **Posibilă dublă inițializare a clientului Supabase** prin `lovable` integration (`@lovable.dev/cloud-auth-js` cheamă `supabase.auth.setSession`) — pe web e ok, dar pe iOS native nu folosim acel flux pentru Apple/Google. Trebuie verificat că nu există două instanțe GoTrueClient care să se calce.

## Plan de implementare

### 1. Storage sigur pentru Supabase pe Capacitor iOS
Fișier: `src/integrations/supabase/client.ts`

Înlocuim `storage: localStorage` cu un adapter care:
- Pe **native (iOS/Android)** folosește `@capacitor/preferences` (key-value persistent, garantat scris pe disc, supraviețuiește închiderii app-ului și update-urilor).
- Pe **web** folosește `localStorage` (comportamentul actual).

```ts
// pseudo
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const nativeStorage = {
  getItem: async (key) => (await Preferences.get({ key })).value,
  setItem: async (key, value) => { await Preferences.set({ key, value }); },
  removeItem: async (key) => { await Preferences.remove({ key }); },
};

const storage = Capacitor.isNativePlatform() ? nativeStorage : localStorage;
```

Pachetul `@capacitor/preferences` se va adăuga ca dependință. După deploy, pe native rulăm `npx cap sync` (deja parte din workflow-ul utilizatorului).

**Migrare lină**: la prima pornire după update, sesiunea există doar în `localStorage`. Adăugăm un mic „bridge” care, la boot pe native, copiază cheile `sb-*-auth-token` din `localStorage` în Preferences dacă nu există deja, ca utilizatorii deja logați să nu fie deconectați la update.

### 2. Întărire `useAuth` împotriva fluctuațiilor tranzitorii
Fișier: `src/hooks/useAuth.tsx`

- Ignorăm primul `SIGNED_OUT` care vine în primele 2-3 secunde după ce `signInWithIdToken` a returnat fără eroare. Folosim un flag `recentlySignedIn` (timestamp). Dacă vine `SIGNED_OUT` în fereastra asta, facem un singur `supabase.auth.getSession()` retry înainte de a marca user-ul ca null.
- Logăm `_event` la `onAuthStateChange` (doar în native) ca să avem evidență dacă reapare.

### 3. Watchdog mai inteligent (`src/App.tsx`)
- Mărim timeout-ul de la 7s la 12s pe iOS.
- Nu mai facem reload dacă există o sesiune Supabase în storage (citim direct cu un get rapid). Reload-ul actual poate întrerupe restaurarea de sesiune pe device-uri lente.

### 4. Verificare clienți Supabase dubli
Confirmăm că `@lovable.dev/cloud-auth-js` nu instanțiază propriul GoTrueClient cu același storage. Pe native nu e folosit pentru Apple/Google (avem flux nativ), dar fluxul `signInWithOAuthNative` (Browser deep link) cheamă `supabase.auth.setSession` direct → ok. Adăugăm doar un `console.log` defensiv dacă e necesar.

### 5. Test
- Buton existent „Test push” + emitem un toast cu starea sesiunii curente într-un mic debug panel admin (opțional).
- Pașii de test: login Apple pe iPhone afectat → background app 30s → revino → trebuie să rămână logat. Cold start după 5 minute → trebuie să rămână logat.

## Files to change

- `src/integrations/supabase/client.ts` — storage adapter native vs web + migrare din localStorage.
- `src/hooks/useAuth.tsx` — protecție împotriva `SIGNED_OUT` tranzitoriu.
- `src/App.tsx` — watchdog mai blând.
- `package.json` — adăugare `@capacitor/preferences`.
- (opțional) `ios/App/Podfile.lock` — regenerat de `cap sync`.

## Risc / rollback
- Schimbarea storage-ului pe native deconectează utilizatorii existenți doar dacă migrarea din `localStorage` eșuează. Migrarea e best-effort și fail-safe (catch silent).
- Pe web nimic nu se schimbă.
