# Pagini web de prezentare PyRo

Adăugăm o secțiune publică, exclusiv web, care prezintă PyRo și ghidează utilizatorii noi. Conținutul actual al aplicației rămâne neschimbat — landing-ul curent (`/`) devine experiența logată/app, iar materialele de marketing trăiesc pe rute dedicate, ascunse complet de aplicațiile native.

## Structura rutelor

```
/about           Landing public — prezentare generală + facilități + CTA-uri
/tutoriale/elevi Articole pas-cu-pas pentru elevi (text + screenshots)
/tutoriale/profesori  Articole pas-cu-pas pentru profesori (text + screenshots)
```

Un `WebLayout` comun le împachetează cu:

- header web (logo PyRo + meniu: Despre · Tutoriale Elevi · Tutoriale Profesori · „Deschide aplicația")
- footer (linkuri legale existente, contact, social)
- *fără* BottomNav-ul mobil

## Izolare față de aplicațiile native

1. **Redirect automat în Capacitor**: la mount, fiecare pagină web verifică `Capacitor.isNativePlatform()` și face `navigate("/", { replace: true })`. Practic: un mic hook `useRedirectIfNative()` plasat în `WebLayout`.
2. **Zero linkuri** din UI-ul aplicației (BottomNav, Account, etc.) către aceste rute.
3. **Robots & sitemap**: paginile web sunt indexabile; rutele de app (`/lesson/...`, `/admin`, `/problem/...`, etc.) rămân neincluse în sitemap.

## Pagina 1 — `/about` (Despre PyRo)

Secțiuni:

1. **Hero**: titlu „Învață Python pas cu pas", subtitlu, 2 CTA-uri: „Începe gratuit" (→ `/auth`) și „Pentru profesori" (→ `/tutoriale/profesori`).
2. **Ce este PyRo**: 2-3 fraze + mockup screenshot din app.
3. **Facilități elevi** (grid de carduri cu iconițe Lucide):
  - Lecții în stil Duolingo (60 probleme, 6 capitole)
  - Editor cod Pyodide în browser
  - Sistem XP, nivele, vieți, streak
  - Clasamente naționale / oraș / școală
  - Provocări de la profesori
4. **Facilități profesori**:
  - Clase și roster elevi
  - Teste predefinite + custom
  - Notare automată + AI (Gemini)
  - Analitice clasă (CSV/PDF export)
  - Profil de competențe (CG/CS/M)
5. **Cum funcționează** (3 pași simpli cu iconițe).
6. **CTA final**: butoane Google Play / App Store / Deschide pe web.

## Pagina 2 — `/tutoriale/elevi`

Index cu articole (carduri), fiecare cu titlu, descriere scurtă, durată estimată. Structura conținutului în `src/data/tutorials/students.ts` (array de articole cu `slug`, `title`, `excerpt`, `sections[]` cu text + imagine). Rutele finale:

```
/tutoriale/elevi              → index (listă)
/tutoriale/elevi/:slug        → articol individual
```

Articole inițiale propuse:

- Cum îți creezi cont și alegi școala
- Cum funcționează lecțiile, XP și nivelele
- Sistemul de vieți și streak
- Cum rezolvi o problemă în editorul Python
- Cum te alături unei clase create de profesor
- Cum dai un test sau o provocare primită
- Premium: ce primești în plus

## Pagina 3 — `/tutoriale/profesori`

Aceeași structură ca la elevi (`src/data/tutorials/teachers.ts`), rute:

```
/tutoriale/profesori
/tutoriale/profesori/:slug
```

Articole inițiale propuse:

- Cum devii profesor verificat (4 metode de validare)
- Cum creezi o clasă și adaugi elevi
- Cum construiești un test (Eval Bank vs Custom)
- Cum trimiți o provocare individuală
- Cum funcționează notarea automată + AI
- Cum vezi analitice și exporți rapoarte
- Profilul de competențe (CG/CS/M)
- Premium Profesor: ce primești în plus

Screenshot-urile vor fi capturate ulterior și puse în `src/assets/tutorials/` (folder nou). Inițial pun placeholder-uri și marchez în plan locurile unde trebuie înlocuite.

## SEO complet

- `react-helmet-async` instalat și `<HelmetProvider>` adăugat în `src/main.tsx`.
- Fiecare pagină setează propriul `<title>`, `meta description`, `canonical`, `og:*`.
- JSON-LD: `Organization` în `index.html`, `Article` per tutorial, `BreadcrumbList` pe paginile copii.
- `scripts/generate-sitemap.ts` cu hook `predev`/`prebuild` care emite `public/sitemap.xml` cu: `/`, `/about`, `/tutoriale/elevi`, `/tutoriale/profesori` + un entry per slug de tutorial.
- `public/robots.txt`: `Allow: /` + `Sitemap: https://pyroskill.info/sitemap.xml`. Adăugăm `Disallow: /admin`, `/lesson/`, `/test/`, `/problem/`, `/skip-challenge/`, `/reset-password`, `/manual/`.
- Conținut semantic: un singur `<h1>` per pagină, `<article>`, `<nav>`, alt-text pe imagini.

## CTA-uri către app

Componentă reutilizabilă `<AppDownloadCTA />` în `src/components/web/`:

- Buton Google Play (link Play Store) — `ro.pythonpathway.app`
- Buton App Store (link App Store) — link când e disponibil
- Buton „Deschide aplicația web" → `/auth`

Apare în hero-ul `/about`, la finalul fiecărui articol și în footer.

## Design

Reutilizăm tokens din `index.css` (dark mode, monospace pentru cod, accente verde/cyan). Layout-ul web este mai „larg" decât mobile-first-ul aplicației: container `max-w-6xl`, grid pe desktop, stack pe mobile. Animații discrete cu Framer Motion (deja în proiect).

## Detalii tehnice

Fișiere noi:

- `src/components/web/WebLayout.tsx` — header + footer + redirect-if-native
- `src/components/web/WebHeader.tsx`
- `src/components/web/WebFooter.tsx`
- `src/components/web/AppDownloadCTA.tsx`
- `src/components/web/FeatureCard.tsx`
- `src/components/web/TutorialCard.tsx`
- `src/components/web/TutorialArticle.tsx` — renderer comun pentru slug
- `src/hooks/useRedirectIfNative.ts`
- `src/pages/web/AboutPage.tsx`
- `src/pages/web/StudentTutorialsIndex.tsx`
- `src/pages/web/StudentTutorialDetail.tsx`
- `src/pages/web/TeacherTutorialsIndex.tsx`
- `src/pages/web/TeacherTutorialDetail.tsx`
- `src/data/tutorials/types.ts`
- `src/data/tutorials/students.ts`
- `src/data/tutorials/teachers.ts`
- `src/assets/tutorials/.gitkeep` (placeholder pentru screenshots)
- `scripts/generate-sitemap.ts`
- `public/robots.txt` (sau update dacă există)

Fișiere modificate:

- `src/App.tsx` — adăugăm rutele noi (lazy-loaded, fără `MobileLayout`)
- `src/main.tsx` — `<HelmetProvider>`
- `index.html` — title/description/OG/JSON-LD Organization sitewide
- `package.json` — `predev`/`prebuild` + dependency `react-helmet-async`

## Out of scope (pot urma în iterații)

- Captura efectivă a screenshot-urilor reale (înlocuim placeholder-urile după)
- Video-uri / GIF-uri (ai zis doar text + screenshots)
- FAQ accordion (poate fi adăugat ușor în `/about` la cerere)
- Pricing page dedicată
- Testimoniale + statistici live  
  
Aici este linkul catre App Store: [https://apps.apple.com/us/app/pyro/id6762510941](https://apps.apple.com/us/app/pyro/id6762510941)  
