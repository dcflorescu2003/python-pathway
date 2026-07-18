## Ce construim

Două cartonașe animate care apar peste pagina Home (`/`), la un colț de sus, timp de ~2 secunde, cu fade-in + slide + slide-out. Fiecare are propria regulă de frecvență și propriul target de utilizatori.

### Cartonaș #1 — „Poți mai mult!" (lecții slabe)
- **Condiție**: userul are cel puțin o lecție completată cu scor < 70% (verificăm din `completed_lessons` — orice lecție completed cu score/best_score < 70).
- **Frecvență**: o dată la 3 zile per user.
- **Mesaj**: îndemn scurt să reia lecțiile slabe până ajunge la 100%. Ex: „Ai lecții unde poți face mai mult! Reia-le și urcă la 100% 💪".
- **Vizual**: gradient primary→accent, icon 🎯 sau ⚡, sparkle animat.

### Cartonaș #2 — „Rezolvă probleme pe web" (puține probleme)
- **Condiție**: userul are < 20 de probleme rezolvate (din `useProblems` sau count pe `completed_problems`/echivalent).
- **Frecvență**: o dată la 2 zile per user, diferit de #1 (nu apar în același load).
- **Mesaj**: „Antrenează-te la probleme pe PC la pyroskill.info — experiența e mai confortabilă pe ecran mare 💻".
- **Vizual**: gradient diferit (accent→primary sau cyan/verde), icon 💻 sau 🧩.
- **Platformă**: apare peste tot (mobil + web), conform răspunsului.

## Cum apar

- Poziționare: `fixed` top-center pe Home, sub header, `z-50`, `pointer-events-none` (nu blochează UI-ul).
- Animație framer-motion: `initial={{ y: -40, opacity: 0, scale: 0.9 }}` → `animate={{ y: 0, opacity: 1, scale: 1 }}` cu spring, hold ~1.6s, apoi `exit={{ y: -40, opacity: 0 }}`.
- Total pe ecran: ~2 secunde.
- Sparkle/pulse subtil pe icon (Tailwind `animate-pulse` sau motion loop).
- Doar unul apare per vizită Home (dacă ambele sunt eligibile, prioritate #1; #2 la următoarea vizită eligibilă).

## Persistență frecvență

Local storage namespaced per user (respectă regula din memory):
- `pyro-tip-lessons-lastshown:<user.id>` — timestamp last shown pt #1
- `pyro-tip-problems-lastshown:<user.id>` — timestamp last shown pt #2

Verificăm `Date.now() - stored >= 3*24*3600*1000` (resp. 2 zile). Doar userii autentificați văd cartonașele (fără user.id → skip).

## Fișiere

**Nou**: `src/components/tips/MotivationalTipCard.tsx`
- Componentă prezentare pură: primește `visible`, `icon`, `title`, `message`, `gradient`, cu animația framer-motion + auto-hide după 2s (callback `onDismiss`).

**Nou**: `src/hooks/useMotivationalTip.ts`
- Determină ce tip trebuie afișat (dacă vreunul): citește `completed_lessons` din React Query cache / hook existent (`useProgress`) pentru scoruri < 70%, și `useProblems`/count pentru probleme rezolvate.
- Aplică regulile de cooldown din localStorage.
- Returnează `{ type: 'lessons' | 'problems' | null }` și o funcție `markShown`.

**Modificat**: `src/pages/Index.tsx`
- Importă hook-ul și componenta. Randează `<MotivationalTipCard ... />` deasupra conținutului când `type !== null`. La montare, apelează `markShown` și pornește timer-ul de 2s pentru dismiss.

## Notă pe rate

- Cooldown separat per tip (3 zile / 2 zile). Dacă ambele eligibile în aceeași vizită, se afișează doar unul și se marchează doar acela ca „shown".
- Fără dependințe backend noi (fără migrări, fără edge functions) — totul e client-side pe baza datelor deja aduse de hook-urile existente.
