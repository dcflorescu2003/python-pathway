## Problemă identificată

Aplicația folosește deja `env(safe-area-inset-*)` în multe pagini, dar:

1. **Android**: deși `MainActivity.java` activează edge-to-edge (`setDecorFitsSystemWindows(false)`), WebView-ul Android **nu populează automat** `env(safe-area-inset-*)` în CSS. Rezultă inseturi `0px` → conținutul intră sub status bar și sub bara de navigație software (3 butoane). E nevoie de plugin-ul oficial `@capacitor/status-bar` + setare programatică a `--safe-area-inset-*` ca CSS variables.
2. **iOS fără notch (SE, iPhone 8)**: `env(safe-area-inset-bottom)` = `0px` → BottomNav-ul lipit de marginea de jos, fără respirație. Lipsește un minim de siguranță.
3. **Android cu butoane software**: bara de navigație acoperă BottomNav-ul (16px insetul nu e suficient pentru 48px de butoane).
4. Header-uri inconsistente: unele folosesc `pt-[env(safe-area-inset-top)]` fără minim, altele cu `+8px` — variabil.

## Soluție

### A. Injectare safe-area pe Android (la nivel nativ)

Adăugăm un mic snippet în `MainActivity.java` care citește `WindowInsets` (status bar + navigation bar) și le injectează în WebView ca CSS custom properties:

```text
--safe-area-inset-top
--safe-area-inset-right
--safe-area-inset-bottom
--safe-area-inset-left
```

Se actualizează la `onCreate` și pe `setOnApplyWindowInsetsListener` (rotire, schimbare bară).

### B. CSS: fallback unificat cu minim garantat

Definim în `src/index.css` variabile globale care folosesc fie `env(safe-area-inset-*)` (iOS) fie `var(--safe-area-inset-*)` (Android, injectat nativ), cu un **minim de siguranță**:

```text
--sat: max(env(safe-area-inset-top),  var(--safe-area-inset-top, 0px), 12px)
--sab: max(env(safe-area-inset-bottom), var(--safe-area-inset-bottom, 0px), 16px)
```

Pe device-uri fără notch/home indicator (iPhone SE, multe Androids vechi) → minim 12px sus / 16px jos.
Pe iPhone cu notch → folosește notch-ul real (47px).
Pe Android cu navbar software → folosește înălțimea reală a barei (≈48px).

### C. Refactor componente comune

- **`BottomNav.tsx`**: înlocuim `pb-[env(safe-area-inset-bottom)]` cu `pb-[var(--sab)]`. Mărim înălțimea efectivă cu min. 16px față de margine.
- **`MobileLayout.tsx`**: schimbăm `pb-20` în `pb-[calc(5rem+var(--sab))]` ca lista din spatele BottomNav-ului să nu fie acoperită.
- **Header-uri** (Index, AuthPage, ChapterPage, LeaderboardPage, ProblemsPage, etc.): înlocuim variantele inconsistente cu `pt-[var(--sat)]` (sau `+8px` unde e nevoie de aer suplimentar).
- **`SkipChallengePage` + `LessonPage` + `ManualLessonPage`**: bara de jos cu butoane „Verifică / Continuă" → `pb-[var(--sab)]` în loc de `pb-[max(env(...),16px)]`.

### D. Android theme

În `android/app/src/main/res/values/styles.xml` ne asigurăm că tema NU are `windowTranslucentNavigation` care ar interfera, și adăugăm `android:fitsSystemWindows="false"` ca să forțăm edge-to-edge corect.

### E. Verificare manuală (după build)

Testăm pe:
- iPhone cu notch (Dynamic Island) — header-ul evită notch-ul, BottomNav peste home indicator.
- iPhone SE / 8 — header are min. 12px aer, BottomNav are min. 16px aer.
- Android cu gesture bar — BottomNav peste gesture bar, conținut nu e tăiat.
- Android cu 3 butoane software — BottomNav vizibil **deasupra** butoanelor.

## Fișiere modificate

- `android/app/src/main/java/ro/pythonpathway/app/MainActivity.java` — injectare WindowInsets în CSS
- `src/index.css` — definire `--sat`, `--sab`, `--sal`, `--sar`
- `src/components/layout/BottomNav.tsx`
- `src/components/layout/MobileLayout.tsx`
- ~14 pagini cu header sticky → unificare la `var(--sat)`
- `android/app/src/main/res/values/styles.xml` — verificare/fixe edge-to-edge

## Notă

Nu e nevoie de instalare de pachete noi. Tot ce avem nevoie există în `androidx.core` (deja inclus prin Capacitor 8). După merge:

```bash
npx cap sync
```

Și un build nou (Android Studio + Xcode). Nu trebuie reîncărcat în store decât la următoarea versiune planificată.
