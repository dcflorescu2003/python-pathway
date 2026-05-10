# Web: CTA Premium în loc de reclamă AdMob

Pe web, `@capacitor-community/admob` nu rulează, așa că mesajul „watch ad" nu are sens. Înlocuim cu un CTA spre Premium. Pe iOS/Android totul rămâne neschimbat.

## Modificări (doar `src/pages/LessonPage.tsx`)

1. Import `Capacitor` din `@capacitor/core` și `PremiumDialog`.
2. Stare nouă: `const [showPremium, setShowPremium] = useState(false)`.
3. `const isNative = Capacitor.isNativePlatform()`.
4. **Start gate** (când `noLives && !lessonStarted`):
   - Native: păstrează textul curent + `WatchAdForLivesButton`.
   - Web: text „Vieți epuizate. Se reîncarcă automat în 30 de minute. Sau treci pe Premium pentru vieți nelimitate." + buton „Activează Premium" care deschide `PremiumDialog`.
5. **Failure screen** (`!passed && !canRestart`):
   - Native: păstrează mesajul curent cu reclamă.
   - Web: înlocuiește cu același tip de mesaj + buton „Activează Premium".
6. Adaugă `<PremiumDialog open={showPremium} onOpenChange={setShowPremium} />` în pagină.

## Ce NU se schimbă

- Logica vieților (deja corectată în `useProgress`).
- Comportamentul native (AdMob rewarded continuă să funcționeze).
- Nu se integrează AdSense pe web (ar necesita setup separat + consent GDPR).
- Fără buton secundar.
