## Problema

Pe iPhone, după mărirea minimelor safe-area (`--sat` 16px, `--sab` 24px) și adăugarea `+8px` la headere via `pt-[calc(var(--sat)+8px)]`:

- iOS raportează deja `env(safe-area-inset-top)` ≈ 44-59px (notch/Dynamic Island) și `safe-area-inset-bottom` ≈ 34px (home indicator).
- `+8px` se cumulează → header ajunge la ~52-67px de la marginea fizică, prea spațiat sus.
- Identic jos: BottomNav cu `pb-[var(--sab)]` (=34px pe iPhone) + 4rem înălțime e ok, dar feedback-ul de la lecții cu `pb-[var(--sab)]` se ridică prea mult.

## Soluție

Eliminăm complet `+8px` din padding-uri și ne bazăm pe `--sat` / `--sab` cu un **minim suficient prin ele însele**. Astfel:

- **iPhone**: insetul real (44-59px sus, 34px jos) = padding-ul efectiv → niciun adaos.
- **Android cu cutout**: la fel, insetul real e deja ok.
- **Android edge-to-edge fără insets** (sau iPhone SE fără notch): minimul intră în joc → ~24px sus, 28px jos.

### Pas 1: Tunează minimele în `src/index.css`

```css
:root {
  --sat-raw: max(env(safe-area-inset-top, 0px), var(--android-sait, 0px));
  --sab-raw: max(env(safe-area-inset-bottom, 0px), var(--android-saib, 0px));

  /* Floor de 24/28px se aplică DOAR când raw < floor (device fără notch/home bar).
     Pe iPhone, raw-ul (44-59 / 34) câștigă oricum → fără spațiu suplimentar. */
  --sat: max(var(--sat-raw), 24px);
  --sab: max(var(--sab-raw), 28px);
  --sal: max(env(safe-area-inset-left, 0px), var(--android-sail, 0px), 0px);
  --sar: max(env(safe-area-inset-right, 0px), var(--android-sair, 0px), 0px);
}
```

### Pas 2: Înlocuiește `pt-[calc(var(--sat)+8px)]` cu `pt-[var(--sat)]`

Pe toate paginile cu header sticky — adaosul de 8px nu mai e necesar acum că floor-ul e 24px:

- `src/pages/Index.tsx`
- `src/pages/AuthPage.tsx` (2 ocurențe — login + AccountView)
- `src/pages/ChapterPage.tsx` (2 ocurențe)
- `src/pages/ChapterTheoryPage.tsx`
- `src/pages/AdminPage.tsx`
- `src/pages/SupportPage.tsx`
- `src/pages/PrivacyPolicyPage.tsx`
- `src/pages/ResetPasswordPage.tsx`
- `src/pages/DeleteAccountPage.tsx`
- `src/pages/LeaderboardPage.tsx`
- `src/pages/LessonPage.tsx`
- `src/pages/ManualLessonPage.tsx`
- `src/pages/SkipChallengePage.tsx`
- `src/pages/ProblemsPage.tsx`
- `src/pages/ProblemSolvePage.tsx`
- `src/pages/TakeTestPage.tsx`

Toate devin `pt-[var(--sat)]`.

### Pas 3: `ProblemSolvePage` — ajustează padding-bottom-ul de containerul scroll

Linia 107: `pb-[calc(var(--sab)+32px)]` → `pb-[calc(var(--sab)+16px)]` (acum că `--sab` e 28px minim, +32 e prea mult).

## Rezultat

| Device | Top header | Bottom |
|---|---|---|
| iPhone 14/15 (Dynamic Island) | 59px (real inset) | 34px (real inset) |
| iPhone X-13 (notch) | 47px | 34px |
| iPhone SE (no notch) | 24px (floor) | 28px (floor) |
| Android cu cutout | inset real | inset real |
| Android edge-to-edge | 24px | 28px |

Aspectul „identic Acasă" rămâne pe Android (24/28px), iar pe iPhone nu se mai adaugă spațiu artificial peste ce iOS oferă deja prin notch/home indicator.

## Fișiere modificate

```text
src/index.css                         (redefinire --sat/--sab cu floor 24/28)
src/pages/*.tsx (16 fișiere)          (pt-[calc(var(--sat)+8px)] → pt-[var(--sat)])
src/pages/ProblemSolvePage.tsx        (pb +32 → +16)
```
