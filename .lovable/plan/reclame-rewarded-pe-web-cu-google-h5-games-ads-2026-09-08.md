# Reclame rewarded pe web cu Google H5 Games Ads

## Scop
Pe web, când utilizatorul rămâne fără inimi, să poată urmări o reclamă video cu recompensă (echivalentul AdMob de pe mobil) și să primească +5 inimi prin același flux existent (`reward-life`), fără a instala aplicația mobilă.

## Prerechizit (parte manuală, în afara codului)
1. Cont Google AdSense aprobat pentru domeniul pyroskill.info.
2. Aplicare și aprobare în programul **H5 Games Ads** (formular Google; aprobarea nu e garantată — depinde de eligibilitate).
3. După aprobare, utilizatorul ne dă ID-ul de client AdSense (`ca-pub-XXXXXXXXXXXXXXXX`) — este o cheie publicabilă, o punem direct în cod, nu e secret.

Până la aprobare, codul e scris dar dezactivat printr-un flag; interfața web rămâne exact ca acum (blocul „instalează aplicația mobilă").

## Implementare

### 1. Script și inițializare (o singură dată, doar pe web)
- Încărcăm dinamic `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=<ca-pub>` doar când: platformă = web (`!Capacitor.isNativePlatform()`), flag-ul e activ și utilizatorul nu e Premium / profesor verificat (ei au deja ∞ inimi).
- Configurăm API-ul conform documentației Ad Placement: coada `adsbygoogle`, `adConfig({ preloadAdBreaks: 'on', sound: 'on' })`.

### 2. Hook nou `useWebRewardedAds.ts` (oglindă a `useAdMob`)
- Expune `showRewarded(): Promise<boolean>` care apelează `adBreak({ type: 'reward', beforeReward, adViewed, adDismissed, adBreakDone })`.
- Rezolvă `true` doar la `adViewed` (reclama s-a terminat); `false` la dismiss / eșec / lipsă fill.
- Protecții: timeout de siguranță, debounce la click, curățare stări.

### 3. Buton web în fluxul de reîncărcare inimi
- Refolosim structura din `WatchAdForLivesButton`, într-o variantă web: buton „Vizionează o reclamă pentru +5 inimi ❤️" afișat în `RefillLivesDialog` (ramura `!isNative`) și pe ecranul „Nu ai inimi" din `LessonPage`, doar când flag-ul H5 Games e activ.
- La succes (`adViewed`) → apel `supabase.functions.invoke("reward-life")` identic cu mobilul → se aplică automat limita zilnică existentă, înregistrarea în DB și mesajele de eroare prietenoase.
- La eșec/lipsă reclamă → toast „Reclama nu este disponibilă momentan, încearcă mai târziu" și rămâne vizibil blocul existent „instalează aplicația mobilă" ca fallback.
- Blocul actual cu Google Play / App Store rămâne afișat sub buton (nu îl eliminăm).

### 4. Flag de activare
- Constantă în cod (ex. `H5_GAMES_ADS_ENABLED` + client ID). Implicit `false` până la aprobarea Google; activarea e o schimbare de o linie.

## Ce NU se schimbă
- Nimic pe nativ (AdMob rămâne neschimbat), nimic în backend (`reward-life` e refolosit ca atare), nimic la vieți/XP/Premium.
- Nu promitem Premium gratuit.

## Verificare
- `tsgo` curat; test manual în preview cu flag oprit (UI neschimbat) și, cu un client ID de test AdSense, fluxul complet până la `reward-life` (inimi 0 → 5).
- Respectarea politicilor AdSense: buton opt-in clar, fără auto-play, fără reclame pe pagini fără conținut.

## Notă tehnică
- Confirmarea recompensei pe web e client-side (callback JS), mai puțin sigură decât server-side verification de la AdMob. Riscul e acoperit de limitele zilnice existente în `reward-life`; dacă Google oferă server-side verification pentru H5 Games, îl adăugăm ulterior.
