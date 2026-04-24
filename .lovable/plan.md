## Probleme identificate

**1. Reclama vizionată dar inimile nu s-au acordat.** În `useAdMob.ts`, `showRewardVideoAd()` se rezolvă când utilizatorul închide reclama, dar evenimentul `Rewarded` poate sosi *înainte sau imediat după* dismiss. Listener-ul `Rewarded` este detașat imediat, ceea ce produce un race condition și uneori `rewarded` rămâne `false` chiar dacă utilizatorul a vizionat complet.

**2. Inima din header (Index.tsx) e statică** — un simplu `<div>` care doar afișează numărul, fără click handler.

## Soluție

### Fix 1: `src/hooks/useAdMob.ts` — race condition la rewarded ads
Refactor `showRewarded` să aștepte explicit fie evenimentul `Rewarded` (succes), fie `Dismissed` (eșec/skip), prin Promise:

- Atașez listeneri pentru `Rewarded`, `Dismissed`, `FailedToLoad`, `FailedToShow`.
- `showRewarded` returnează un Promise care se rezolvă pe primul eveniment terminal.
- Curăț toți listenerii la final.
- Adaug un mic delay de siguranță (200ms) după `Dismissed` ca să prind un `Rewarded` întârziat.

### Fix 2: Inima din header devine clickabilă
- În `src/pages/Index.tsx`, transform `<div>`-ul cu inimă într-un `<button>` care, dacă utilizatorul nu e Premium și `lives < 5`, deschide un dialog nou.
- Pentru Premium (∞) sau lives = 5, butonul nu face nimic (sau afișează scurt un toast „Ai deja maxim de inimi").

### Componentă nouă: `src/components/RefillLivesDialog.tsx`
Dialog (shadcn) care:
- Afișează inimile curente (X / 5) și mesajul „O inimă se reumple automat la fiecare 20 de minute".
- Include butonul `WatchAdForLivesButton` existent (deja gestionează nativ vs web și limita zilnică).
- Pe web (non-native) afișează doar mesajul de regenerare automată.
- La succes, actualizează progress prin callback și închide dialogul.

### Cont de testare
Resetez din nou contul `florescu.cosmin.tr@gmail.com` la 0 inimi pentru un nou test (migrație SQL).

## Fișiere modificate
- `src/hooks/useAdMob.ts` — fix race condition rewarded
- `src/pages/Index.tsx` — fac inima din header clickabilă
- `src/components/RefillLivesDialog.tsx` — nou
- migrație nouă pentru reset profil de test