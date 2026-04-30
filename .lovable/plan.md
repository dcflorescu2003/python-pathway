# Plan: Ghidaj Apple pe web (login + signup)

## Scop
- Pe **signup web**: butonul "Continuă cu Apple" dispare. Cont nou cu Apple pe web ar fi blocat oricum la înscrierea în clasă (privaterelay + fără parolă), deci nu are sens să-l oferim.
- Pe **login web**: butonul rămâne (cei care au setat parolă pe iOS pot alterna).
- Adaug un link discret sub buton: *"Te-ai logat cu Apple pe telefon și nu poți intra aici?"* → deschide un dialog cu pașii de finalizare cont.
- Pe iOS / Android nativ, totul rămâne neatins.

## Modificări

### 1. `src/pages/AuthPage.tsx` — vizibilitate buton Apple
Condiția devine:
```ts
const showAppleButton =
  !(Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android")  // ascuns pe Android
  && (Capacitor.isNativePlatform() || isLogin);                              // pe web doar pe login, nu signup
```

### 2. Link "Cont Apple de pe telefon?" + dialog explicativ
- Doar pe web (`!Capacitor.isNativePlatform()`), sub butonul Apple.
- Click → deschide un nou dialog `AppleHelpDialog` cu 3 pași:
  1. Loghează-te din **aplicația iOS** cu Apple
  2. Mergi la **Cont → Login pe web** și setează: parolă + email real (dacă folosești Hide My Email)
  3. Revino aici și loghează-te cu **email + parolă**
- Buton "Am înțeles" închide dialogul.

### 3. Mesajul existent de sub form rămâne
Linia "Te-ai logat cu Apple sau Google pe telefon? Setează o parolă din Cont → Profil…" e ok — poate fi puțin reformulată să trimită spre același dialog, dar nu e critic.

## Pași de execuție
1. Modific condiția de afișare a butonului Apple (un singur if combinat).
2. Adaug state `showAppleHelpDialog` + componenta Dialog cu cei 3 pași.
3. Adaug link "Cont Apple de pe telefon? Vezi pașii" sub butonul Apple, vizibil doar pe web.

Niciun edge function, nicio migrație — pur frontend.
