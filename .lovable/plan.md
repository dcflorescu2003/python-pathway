

## Plan: Uniformizare logo PyRo în toată aplicația

### Probleme identificate

| Locație | Logo image | Wordmark | Inconsistență |
|---|---|---|---|
| `SplashScreen` | `splash-logo.png` h-32 rounded-2xl | text-3xl font-mono | folosește alt fișier (splash-logo) |
| `AuthPage` (login) | `logo.png` h-16 rounded-2xl | — fără wordmark | lipsă wordmark |
| `AuthPage` (profil) | `logo.png` h-16 rounded-2xl | — | lipsă wordmark |
| `Index` (header home) | `logo.png` h-7 **rounded-md** | text-xl font-mono | rounded diferit, foarte mic |
| `ManualLessonPage` (header) | `logo.png` h-10 rounded-xl | text-xl font-black font-mono | font-weight diferit |
| `ManualLessonPage` (progress) | `logo.png` h-8 rounded-lg | — | doar icon |
| `SchoolOnboarding` | — fără imagine | text-3xl | lipsă imagine logo |

### Soluție: componentă unică `<PyroLogo />`

Creez `src/components/brand/PyroLogo.tsx` cu API consistent:

```tsx
type Props = {
  size?: "sm" | "md" | "lg" | "xl";   // h-7 / h-10 / h-16 / h-32
  showWordmark?: boolean;              // default true
  showTagline?: boolean;               // default false (doar splash)
  premium?: boolean;                   // adaugă badge "PRO" galben
  className?: string;
};
```

Reguli vizuale unificate (sursă unică de adevăr):
- **Imagine**: întotdeauna `logo.png` (elimin `splash-logo.png` din uz — rămâne în assets dar nu mai e referit; logo-ul principal e la rezoluție suficientă pentru toate dimensiunile)
- **Border radius**: scalat cu mărimea — `sm: rounded-lg`, `md: rounded-xl`, `lg: rounded-2xl`, `xl: rounded-3xl` (consistent, raport ~1/6 din lățime)
- **Wordmark**: mereu `font-mono font-bold`, gradient verde-cyan pe „Py” + tricolor pe „Ro”, mărime scalată cu icon-ul (`text-base/xl/2xl/4xl`)
- **Tagline** (opțional): „Învață Python pas cu pas” `text-sm text-muted-foreground`
- **Spațiere icon ↔ wordmark**: `gap-2` (sm/md), `gap-3` (lg/xl)
- **PRO badge**: `text-xs text-yellow-500 font-bold ml-1` (pentru utilizatori Premium, doar pe header-ul Home)

### Fișiere modificate

| Fișier | Schimbare |
|---|---|
| `src/components/brand/PyroLogo.tsx` | **NOU** — componentă unificată |
| `src/components/states/SplashScreen.tsx` | înlocuiesc cu `<PyroLogo size="xl" showTagline />` |
| `src/pages/AuthPage.tsx` | 2 locuri → `<PyroLogo size="lg" />` (cu wordmark) |
| `src/pages/Index.tsx` | header → `<PyroLogo size="sm" premium={progress.isPremium} />` |
| `src/pages/ManualLessonPage.tsx` | 2 locuri → `<PyroLogo size="md" />` și `<PyroLogo size="sm" showWordmark={false} />`; șterg `PyRoLogo` local |
| `src/components/onboarding/SchoolOnboarding.tsx` | adaug `<PyroLogo size="lg" />` deasupra titlului „Bine ai venit” |

### Beneficii
- O singură sursă pentru identitatea vizuală — schimbare viitoare într-un singur loc
- Border radius consistent (raport 1/6 indiferent de mărime)
- Toate aparițiile au wordmark uniform (font, gradient, tricolor) sau doar icon-ul când spațiul e limitat
- Splash și restul aplicației folosesc aceeași imagine (un singur logo „canonic”)

