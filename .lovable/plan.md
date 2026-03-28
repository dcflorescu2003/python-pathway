

# XP dinamic bazat pe conținutul din DB

## Problema actuală
Nivelurile sunt calculate fix: `level = floor(xp / 100) + 1`. Master of Python necesită nivel 25 = 2400 XP, indiferent de câte lecții/probleme există. Dacă adaugi conținut nou, pragul rămâne același.

## Soluția
Calculăm XP-ul total disponibil din DB (toate lecțiile + 20% din probleme), apoi distribuim uniform pe 25 de nivele. Astfel, Master of Python = tot conținutul parcurs.

## Cum funcționează

```text
totalMaxXP = suma(xpReward lecții) + 0.2 × suma(xpReward probleme)
xpPerLevel = totalMaxXP / 25
level = floor(xp / xpPerLevel) + 1   (cap la 25)
xpToNext = xpPerLevel - (xp % xpPerLevel)
```

Exemplu: dacă avem 2000 XP din lecții + 500 XP din probleme (20% din 2500 total), totalMaxXP = 2500, xpPerLevel = 100. Dacă adaugi lecții noi, pragul crește automat.

## Modificări

### 1. `src/hooks/useChapters.ts`
- Exportăm o funcție `computeXPThresholds(chapters, problems)` care returnează `{ totalMaxXP, xpPerLevel }`
- `getLevelFromXP(xp, xpPerLevel)` și `getXPForNextLevel(xp, xpPerLevel)` primesc `xpPerLevel` ca parametru (default 100 ca fallback)

### 2. `src/hooks/useProblems.ts`
- Ne asigurăm că `xpReward` este expus pe interfața `Problem` (deja e acolo)

### 3. `src/pages/Index.tsx`
- Calculăm `xpPerLevel` din datele chapters + problems (ambele deja disponibile via hooks)
- Pasăm la `getLevelFromXP` și `getXPForNextLevel`

### 4. `src/pages/LeaderboardPage.tsx`
- Același calcul pentru afișarea nivelului corect al utilizatorilor din clasament

### 5. `src/components/LevelRoadmap.tsx`
- Afișăm XP-ul necesar per tier (ex: „Nivel 10–12 · 1000–1200 XP") calculat dinamic

### 6. `src/data/levels.ts`
- `getLevelInfo` rămâne la fel (depinde doar de nivel, nu de XP)

## Detalii tehnice
- Folosim un hook `useXPThresholds()` care combină datele din `useChapters` + `useProblems` și returnează `xpPerLevel`
- Fallback la 100 XP/nivel dacă datele nu sunt încă încărcate
- Ștergem duplicatul `getLevelFromXP` din `src/data/courses.ts`
- Fișiere modificate: `useChapters.ts`, `Index.tsx`, `LeaderboardPage.tsx`, `LevelRoadmap.tsx`

