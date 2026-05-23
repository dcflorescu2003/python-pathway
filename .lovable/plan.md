## Problemă
La finalul unei lecții reușite, peste ecranul "Lecție completă!" se deschide `StreakCelebrationDialog`. Butonul "Continuă" din dialog nu răspunde la click — utilizatorul e forțat să aștepte cele ~4s până dialogul se auto-închide.

## Cauză
În `src/components/StreakCelebrationDialog.tsx`:
1. `ConfettiParticle` (linia 23) randează `<motion.div className="absolute rounded-full">` **fără `pointer-events-none`**. Animația durează 1.5s + delay (până la ~0.85s), apoi particulele rămân în DOM la opacitate 0 dar continuă să capteze pointer events, acoperind zona butonului.
2. Div-ul de glow (linia 67) — `motion.div className="absolute inset-0"` — la fel, acoperă tot containerul și captează click-uri.

Ambele sunt pur decorative și nu trebuie să intercepteze input.

## Fix
În `src/components/StreakCelebrationDialog.tsx`:
- Adaug `pointer-events-none` pe `<motion.div>` din `ConfettiParticle` (linia 24-26).
- Adaug `pointer-events-none` pe glow `motion.div` (linia 67-72).
- Adaug `pointer-events-none` și pe wrapper-ul flame icon (linia 75-78) pentru siguranță — e tot decorativ.

Nicio altă modificare de logică, timing, sau text.

## Fișier modificat
- `src/components/StreakCelebrationDialog.tsx` — 3 adăugări de `pointer-events-none` pe elemente decorative absolute.
