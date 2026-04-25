Voi trata problema ca pe o combinație de două lucruri: splash-ul nativ poate rămâne blocat dacă React/auth se inițializează greu, iar un simplu restart după 7 secunde ar trebui să fie doar plasă de siguranță, nu soluția principală.

## Ce voi modifica

1. **Voi adăuga un watchdog de pornire pentru aplicația nativă**
   - La startup, aplicația va porni un timer de 7 secunde.
   - Dacă după 7 secunde încă nu a trecut de splash/loading-ul inițial, va face automat un reload controlat al WebView-ului.
   - Pentru a evita bucle infinite, reload-ul se va face o singură dată per pornire/interval scurt, folosind un flag în `sessionStorage`.

2. **Voi face ascunderea splash-ului nativ mai robustă**
   - În `App.tsx`, voi încerca să ascund splash-ul nativ imediat ce React se montează, dar și încă o dată după un mic delay.
   - Astfel acoperim cazurile în care pluginul de splash nu e pregătit exact în primul moment.

3. **Voi schimba configurația Capacitor SplashScreen**
   - În `capacitor.config.ts`, `launchAutoHide: false` poate lăsa splash-ul nativ blocat dacă apelul JS de hide nu rulează.
   - Voi seta o variantă mai sigură: auto-hide nativ după un timp scurt, cu fallback prin JS.
   - Păstrez branding-ul și fundalul actual, dar reduc riscul ca ecranul nativ să rămână permanent blocat.

4. **Voi întări inițializarea auth**
   - În `useAuth.tsx`, `getSession()` nu are fallback de timeout; dacă promisiunea rămâne blocată, `loading` rămâne `true` și anumite ecrane pot părea înghețate.
   - Voi adăuga un timeout sigur care marchează auth ca „gata” după câteva secunde dacă restaurarea sesiunii nu răspunde, fără să afișeze flash de login înainte de timp.
   - Evenimentele ulterioare de auth vor putea actualiza în continuare sesiunea corect.

5. **Voi adăuga teste automate pentru startup blocat**
   - Voi crea/actualiza teste care simulează:
     - prima deschidere cu splash vizibil;
     - auth restore care întârzie;
     - trecerea peste 7 secunde;
     - reload-ul de siguranță fără buclă infinită.

## Rezultatul așteptat

- Dacă totul pornește normal, utilizatorul vede splash-ul scurt și apoi aplicația.
- Dacă startup-ul rămâne blocat, aplicația se reîncarcă automat după 7 secunde.
- Dacă problema este doar splash-ul nativ rămas agățat, acesta va fi ascuns și de fallback-ul nativ/JS.
- Nu ar trebui să reapară flash-ul de login la utilizatorii autentificați.

## Detalii tehnice

Fișiere vizate:
- `src/App.tsx`
- `src/hooks/useAuth.tsx`
- `capacitor.config.ts`
- eventual un test nou pentru `App`/startup, plus ajustări la testele existente dacă e nevoie

După implementare, pentru Android/iOS va trebui sincronizat proiectul nativ:
```text
npm run build
npx cap sync android
```
Pentru iOS similar:
```text
npx cap sync ios
```
