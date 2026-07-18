Plan: Afișarea iconului de rank în clasament

Scop: În pagina Clasament (`/leaderboard`), în dreptul fiecărui utilizator, să apară iconul corespunzător rankului său din „Drumul spre Master of Python" (Oul Misterios, Baby Python, Little Snake etc.), în loc de emoji-ul generic 🐍.

Unde se aplică: doar în `src/pages/LeaderboardPage.tsx` (toate taburile: Clasă, Liceu, Oraș, Național). Nu se modifică alte clasamente sau liste de elevi.

Implementare:
1. Importuri noi în `LeaderboardPage.tsx`:
   - `getLevelInfo` din `@/data/levels` (pentru imaginea și numele rankului).
   - `getLevelFromXP` și `useXPThresholds` din `@/hooks/useXPThresholds` (pentru a calcula nivelul din XP, ținând cont de curriculumul real).

2. Obținem pragurile XP comune în pagină:
   - `const { xpPerLevel } = useXPThresholds();`
   - Același `xpPerLevel` va fi folosit pentru toți utilizatorii, pentru consistență.

3. Creăm un mic helper în interiorul componentei sau inline în `renderRow`:
   - `const level = getLevelFromXP(entry.xp, xpPerLevel);`
   - `const tier = getLevelInfo(level);`

4. Înlocuim blocul de avatar existent:
   - De la: `<span className="text-xl">{entry.avatar_url || "🐍"}</span>`
   - La: `<img src={tier.image} alt={tier.name} title={tier.name} className="h-8 w-8 rounded-full object-cover bg-card border border-border" />`
   - Dimensiunea 32px păstrează înălțimea rândului, iar `rounded-full` păstrează look circular ca în pagina de teorie/roadmap.

5. Fallback (opțional, dar sigur):
   - Dacă imaginea nu se încarcă, rămâne spațiul gol. Se poate adăuga un `onError` care pune un emoji 🐍 în loc, dar nu este necesar deoarece asseturile există local.

6. Verificare: build TypeScript + vite pentru a ne asigura că importurile și tipurile sunt corecte.

Impact vizual:
- Rândul rămâne la aceeași înălțime.
- Emoji-ul generic este înlocuit cu iconul de rank, care adaugă context vizual (rank + nivel) pentru fiecare participant.
- Nu se schimbă tipografiile, culorile, badge-urile de medalie/XP sau layout-ul general.

Riscuri minime:
- Calculează nivelul din XP în frontend; pentru utilizatorii cu 0 XP va apărea Oul Misterios.
- Imaginile sunt deja importate în bundle; nu se adaugă asseturi noi.
