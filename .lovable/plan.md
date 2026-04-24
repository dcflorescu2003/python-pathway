## Problema

În `LessonPage.tsx` linia 55: `const [lives, setLives] = useState(5);` — viețile sunt state local inițializat mereu la 5. Când greșești, scade doar local; când reintri în lecție pornești iar de la 5. `loseLife()` actualizează totuși DB, dar UI-ul nu citește din `progress.lives`.

Mai există un bug colateral: la „heart granted" se apela `setLives(newLives)`, dar acum nu mai există acel state local.

## Soluție

În `src/pages/LessonPage.tsx`:

1. Elimin state-ul local `lives`. Folosesc direct `progress.lives` (sau `5` dacă e Premium):
   ```ts
   const lives = progress.isPremium ? 5 : progress.lives;
   ```

2. La greșeală, scot `setLives((l) => l - 1)` și păstrez doar `loseLife()` (care actualizează deja `progress.lives` în Supabase + state global).

3. La refill prin reclamă, scot `setLives(newLives)` din callback — `setLivesFromReward` actualizează deja `progress.lives` și UI-ul reflectează automat.

4. Dacă utilizatorul intră în lecție cu `progress.lives === 0` și nu e Premium, redirecționez instant la pagina capitolului cu un toast „Nu ai inimi. Așteaptă 20 min sau vizionează o reclamă". Asta previne situația în care lecția pornește deja terminată cu „Ai rămas fără vieți".

## Fișier modificat
- `src/pages/LessonPage.tsx`