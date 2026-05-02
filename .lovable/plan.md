## Scop

Pe Android, bara de status (sus) și bara de gesturi/navigație (jos) se suprapun cu interfața pe unele ecrane. Pagina **Acasă** are deja un spațiu corect deasupra headerului. Vrem **același comportament** pe toate ecranele: header fix puțin coborât sub bara de status, iar footer/bottom-nav puțin ridicat de bara de gesturi.

## Diagnostic

Variabilele safe-area sunt deja definite în `src/index.css`:
- `--sat` (top) cu un minim de 12px
- `--sab` (bottom) cu un minim de 16px

Dar headerele nu folosesc același padding peste tot:
- ✅ `Index` (Acasă), `LessonPage`, `ManualLessonPage`, `SkipChallengePage` → `pt-[var(--sat)]` (corect, dar uneori prea aproape)
- ⚠️ `ProblemsPage`, `ProblemSolvePage` → padding pe `<div>` interior, nu pe `<header>` → marginea fundalului headerului se pierde sub status bar
- ⚠️ Pagini cu `pt-[calc(var(--sat)+8px)]` (Auth/Cont, Chapter, ChapterTheory, Admin, Support, Privacy, Reset, DeleteAccount, Leaderboard, TakeTest) — sunt aproape ok, dar inconsistente între ele

`MobileLayout` (Acasă/Probleme/Clasament/Cont) are deja `pb-[calc(4rem+var(--sab))]` și `BottomNav` are `pb-[var(--sab)]` — dar bara însăși are doar 16px minim, ceea ce pe telefoane cu gesture bar (majoritatea Android 13+) nu lasă suficient spațiu vizual.

## Soluție

### 1. Mărește minimele safe-area pentru un aspect mai aerisit (`src/index.css`)

```text
--sat: max(env(safe-area-inset-top, 0px), var(--android-sait, 0px), 16px);
--sab: max(env(safe-area-inset-bottom, 0px), var(--android-saib, 0px), 24px);
```

Astfel chiar și pe device-uri care nu raportează insets (Android edge-to-edge fără cutout), header și footer rămân deplasate clar față de marginile fizice.

### 2. Standardizează headerul pe toate paginile

Folosește o singură formulă: `pt-[calc(var(--sat)+8px)]` pe elementul `<header>` (nu pe div-ul interior). Pagini de aliniat:

- `src/pages/Index.tsx` (linia 286): `pt-[var(--sat)]` → `pt-[calc(var(--sat)+8px)]`
- `src/pages/LessonPage.tsx` (linia 252): la fel
- `src/pages/ManualLessonPage.tsx` (linia 275): la fel
- `src/pages/SkipChallengePage.tsx` (linia 227): la fel
- `src/pages/LeaderboardPage.tsx` (linia 214): la fel
- `src/pages/ProblemsPage.tsx` (47–48): mută `pt-[calc(var(--sat)+8px)]` de pe div pe `<header>`
- `src/pages/ProblemSolvePage.tsx` (108–109): la fel

Restul (`AuthPage`, `ChapterPage`, `ChapterTheoryPage`, `AdminPage`, `SupportPage`, `PrivacyPolicyPage`, `ResetPasswordPage`, `DeleteAccountPage`, `TakeTestPage`) sunt deja ok cu `+8px`.

### 3. Footer / BottomNav

- `src/components/layout/BottomNav.tsx`: rămâne `pb-[var(--sab)]` (acum 24px minim → ridicat vizibil de marginea jos).
- `src/components/layout/MobileLayout.tsx`: păstrează `pb-[calc(4rem+var(--sab))]` (auto-adaptă datorită noului `--sab`).
- Footere fixe de feedback din `LessonPage`/`ManualLessonPage`/`SkipChallengePage` deja folosesc `pb-[var(--sab)]` → vor beneficia automat.
- `ProblemSolvePage`: are `pb-[calc(var(--sab)+32px)]` pe container — corect, fără modificări.

### 4. Pagina Cont — taburile

`AccountPage` (în `AuthPage.tsx`) folosește un singur header sticky. Tab-urile (`AccountProfileTab`, `StudentTab`, `TeacherClassesTab`, `TeacherTestsTab`) randează doar conținut sub header, deci moștenesc automat spacingul corect. Verificăm că niciun tab nu are propriul `header` cu padding diferit.

## Rezumat fișiere modificate

```text
src/index.css                       (--sat 12→16, --sab 16→24)
src/pages/Index.tsx                 (header pt)
src/pages/LessonPage.tsx            (header pt)
src/pages/ManualLessonPage.tsx      (header pt)
src/pages/SkipChallengePage.tsx     (header pt)
src/pages/LeaderboardPage.tsx       (header pt)
src/pages/ProblemsPage.tsx          (mută pt pe <header>)
src/pages/ProblemSolvePage.tsx      (mută pt pe <header>)
```

## Validare

După aplicare, vom verifica vizual pe Android (status bar + gesture bar) că:
1. Logo/iconițe header nu intră sub status bar pe nicio pagină.
2. BottomNav și butoanele de „Continuă" stau clar deasupra barei de gesturi.
3. Aspectul este identic între Acasă, Lecții, Lecție, Cont (toate taburile), Probleme, Clasament.
