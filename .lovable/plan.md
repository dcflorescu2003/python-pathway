## Problema

Pe web, capitolul 2 arată 8 lecții completate (corect — atât e în cloud), dar pe Android arată 7. Cauza este combinația dintre date vechi din `localStorage` (de pe Android, dinaintea fix-urilor recente) și un bug în logica de merge cloud↔local.

## Cauza reală

În `src/hooks/useProgress.ts`, funcția `mergeProgress` combină lecțiile completate astfel:

```ts
for (const [id, data] of Object.entries(b.completedLessons)) {
  if (!mergedLessons[id] || data.score > mergedLessons[id].score) {
    mergedLessons[id] = data;
  }
}
```

Dacă pe Android există în `localStorage` o intrare veche `{ score: X, completed: false }` (rămasă dinaintea fix-urilor) și cloud returnează aceeași lecție cu `{ score: X, completed: true }`, condiția `data.score > mergedLessons[id].score` este `false` la egalitate de scor → se păstrează intrarea locală cu `completed: false`.

Apoi:
- `Index.tsx` (linia 466) numără cu `progress.completedLessons[l.id]?.completed` → lecția nu mai e numărată → afișează 7 în loc de 8.
- Pe web, `localStorage` nu avea intrarea coruptă, deci numărătoarea iese 8.

## Plan

1. **`src/hooks/useProgress.ts` — `mergeProgress`**: când cloud (param `b`) marchează o lecție drept `completed: true`, intrarea din cloud câștigă întotdeauna față de o intrare locală cu `completed: false`, chiar și la scoruri egale. Regulă nouă pentru fiecare id din `b`:
   - dacă local nu are intrarea → ia din cloud;
   - dacă local are `completed: false` și cloud `completed: true` → ia cloud;
   - dacă ambele au `completed: true` → păstrează scorul mai mare;
   - altfel păstrează local.

2. **`src/pages/Index.tsx` (linia 466, 472)**: fă numărătoarea defensivă, identică cu cea din `ChapterPage`: `!!progress.completedLessons[l.id]` (orice intrare = completed). Astfel, dacă au mai rămas date vechi pe device-uri instalate, UI-ul nu mai e afectat.

3. Fără schimbări de DB. Fără schimbări de UI vizibile dincolo de corectarea numărătorii.

## Validare

- Verific în preview că `Index` listează 8/X la capitolul 2 (deja corect).
- Pentru a confirma pe Android e suficient ca user-ul să redeschidă app-ul: la următorul `loadCloud`, `mergeProgress` repară starea, salvează în `localStorage` și `Index.tsx` arată numărătoarea corectă.
