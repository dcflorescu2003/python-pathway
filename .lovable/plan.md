# Plan: Elimină Google login pe iOS

## Scop
Pe **iOS nativ**, butonul "Continuă cu Google" dispare complet, atât pe login cât și pe signup. Pe web și pe Android nativ rămâne neschimbat. Apple și email/parolă rămân disponibile pe iOS.

## Modificări

### `src/pages/AuthPage.tsx`
Wrap butonul Google (în jurul liniei 552-560) într-o condiție care îl ascunde pe iOS nativ:

```tsx
{!(Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") && (
  <Button variant="outline" className="w-full gap-2" onClick={handleGoogleLogin} type="button">
    {/* ... iconul Google + text ... */}
    Continuă cu Google
  </Button>
)}
```

Mesajul de sub form ("Te-ai logat cu Apple sau Google pe telefon?") rămâne neschimbat — pe iOS oricum nu mai apare butonul Google, deci nu induce în eroare (utilizatorii iOS care s-au înrolat cu Google din versiuni vechi încă pot folosi alternativa email+parolă pe care o setează din Cont).

## Ce NU schimb
- `useAuth.tsx` — păstrez logica `signInWithGoogle` intactă (utilizatorii existenți care au cont Google rămân funcționali pe alte platforme și pentru cazuri viitoare).
- Inițializarea `SocialLogin` Google pe iOS — o las pentru compatibilitate, costul e zero dacă butonul nu mai e apelat.
- Android, web — neschimbate.

## Pași execuție
1. Editez condiția de afișare a butonului Google din `AuthPage.tsx`.
2. Verific rapid că butonul Apple rămâne vizibil pe iOS (deja e: condiția existentă exclude doar Android nativ).

Niciun edge function, nicio migrație.
