

# Plan: Transformare PyLearn in aplicație mobilă Android-ready

## Sumar

Transformarea aplicației PyLearn dintr-un web app responsive într-o experiență mobile-first pregătită pentru Google Play, incluzând: bottom navigation, PWA config, Capacitor readiness, splash screen, lazy loading, stări de eroare/loading, și comportament nativ.

## Pagini existente (5 ecrane)
- **Index** — lista capitole + profil
- **ChapterPage** — lista lecții (path vertical)
- **ChapterTheoryPage** — teorie capitol
- **LessonPage** — exerciții interactive
- **LeaderboardPage** — clasament
- **AdminPage** — editor întrebări

## Structura nouă de navigație mobilă

```text
┌─────────────────────────────┐
│  Status Bar (safe area)     │
├─────────────────────────────┤
│                             │
│     Page Content            │
│     (scrollable)            │
│                             │
├─────────────────────────────┤
│  🏠    📚    🏆    ⚙️      │
│  Acasă Lecții Clasam. Admin │
│  (Bottom Navigation Bar)    │
└─────────────────────────────┘
```

- Paginile Chapter, Theory, Lesson = ecrane secundare fără bottom nav (cu back header)
- LessonPage rămâne full-screen (fără nav, doar progress + close)

## Modificări tehnice planificate

### 1. Layout & Bottom Navigation
- **Creez `src/components/layout/MobileLayout.tsx`** — wrapper cu bottom tab bar pentru paginile principale (Home, Leaderboard, Admin)
- **Creez `src/components/layout/BottomNav.tsx`** — 4 tab-uri: Acasă, Lecții (merge pe /, scrollează la capitole), Clasament, Editor
- Safe area padding (env(safe-area-inset-*)) pe header și bottom nav
- Paginile secundare (Chapter, Theory, Lesson) nu au bottom nav

### 2. Redesign pagini mobile-first
- **Index.tsx**: Reproiectare card-uri capitole cu touch targets >= 48px, spacing mai generos, profil card compact
- **ChapterPage.tsx**: Path vertical optimizat, butoane mai mari (80px → touch-friendly), spacing
- **LessonPage.tsx**: Butoane răspuns mai mari, feedback overlay full-width, bottom-anchored continue button
- **LeaderboardPage.tsx**: Items mai compacte, pull-to-refresh vizual
- **AdminPage.tsx**: Form inputs touch-friendly, spacing crescut, confirmări dialog pentru ștergere

### 3. Stări aplicație
- **Creez `src/components/states/LoadingScreen.tsx`** — skeleton/spinner cu logo
- **Creez `src/components/states/EmptyState.tsx`** — mesaj + icon când nu sunt date
- **Creez `src/components/states/ErrorState.tsx`** — eroare + retry button
- **Creez `src/components/states/OfflineState.tsx`** — detectare navigator.onLine, banner offline
- **Creez `src/hooks/useOnlineStatus.ts`** — hook pentru starea conexiunii
- Splash screen logic în `src/components/states/SplashScreen.tsx` — apare 1.5s la prima încărcare

### 4. PWA Configuration
- **Instalez `vite-plugin-pwa`** ca dependință
- **Configurez în `vite.config.ts`**: manifest complet cu name, short_name, icons, theme_color (#0f1219), background_color (#0f1219), display: standalone, start_url, navigateFallbackDenylist pentru /~oauth
- **Creez icon placeholders**: `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png` (SVG placeholder-uri)
- **Actualizez `index.html`**: meta tags (theme-color, apple-mobile-web-app-capable, viewport cu viewport-fit=cover), apple-touch-icon
- Service worker cu runtime caching pentru assets și fallback offline

### 5. Capacitor Readiness
- **Instalez**: `@capacitor/core`, `@capacitor/cli` (dev)
- **Creez `capacitor.config.ts`** cu appId, appName, server URL pentru dev
- Documentez pașii post-export: `npx cap add android`, `npx cap sync`, build AAB
- Evit dependințe problematice (nu sunt cazuri în proiectul curent)
- Toate rutele sunt hash-free (deja folosesc BrowserRouter — OK pentru Capacitor)

### 6. Performanță
- **Lazy load** paginile cu `React.lazy` + `Suspense` în App.tsx
- **Memo-izare** componente exerciții cu `React.memo`
- Elimină `src/App.css` (neutilizat, e template-ul default Vite)
- Bundle splitting automat prin lazy loading

### 7. UX nativ
- Tranziții page cu framer-motion (slide stânga/dreapta)
- Haptic feedback vizual pe butoane (scale animation la tap)
- Confirmări AlertDialog pentru acțiuni destructive (ștergere exerciții/lecții în admin)
- Pull-down visual pe main pages
- Disable zoom pe inputs (font-size >= 16px)

### 8. Actualizări index.html
- `<meta name="theme-color" content="#0f1219">`
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">`
- Title: "PyLearn - Învață Python"
- Link manifest.json

## Fișiere noi (~10)
- `src/components/layout/MobileLayout.tsx`
- `src/components/layout/BottomNav.tsx`
- `src/components/states/SplashScreen.tsx`
- `src/components/states/LoadingScreen.tsx`
- `src/components/states/EmptyState.tsx`
- `src/components/states/ErrorState.tsx`
- `src/components/states/OfflineState.tsx`
- `src/hooks/useOnlineStatus.ts`
- `capacitor.config.ts`

## Fișiere modificate (~9)
- `vite.config.ts` — PWA plugin
- `index.html` — meta tags, manifest link, title
- `src/App.tsx` — lazy loading, MobileLayout wrapper, Suspense
- `src/pages/Index.tsx` — mobile redesign, remove admin button from here
- `src/pages/ChapterPage.tsx` — touch optimization
- `src/pages/LessonPage.tsx` — bottom-anchored buttons, larger targets
- `src/pages/LeaderboardPage.tsx` — compact mobile layout
- `src/pages/AdminPage.tsx` — touch-friendly forms, confirm dialogs
- `src/index.css` — safe area utilities, touch utilities
- `package.json` — new dependencies

## Dependințe noi
- `vite-plugin-pwa` — PWA support
- `@capacitor/core` — Capacitor runtime
- `@capacitor/cli` (dev) — Capacitor CLI

## Permisiuni
- Nu sunt necesare permisiuni de device. Aplicația este pur educațională (text + interacțiuni touch). Nici camera, nici notificări, nici locația nu sunt necesare.

## Lista de verificare post-export pentru Google Play
La final voi furniza:
1. Lista completă a modificărilor implementate
2. Pașii exacti: git pull → npm install → npx cap add android → npx cap sync → Android Studio → build AAB
3. Ce trebuie completat în Android Studio (signing key, version code, privacy policy URL)
4. Checklist final pentru publicare Play Store

