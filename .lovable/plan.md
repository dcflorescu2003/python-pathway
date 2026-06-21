# Recalibrare praguri XP

## Problemă
Cu formula curentă (`lessonsXP + 0.2 * problemsXP`, împărțit la 25 niveluri), poți atinge Master of Python făcând doar 2 capitole + 100 probleme. Vrei ca pragul maxim să corespundă efortului „toate lecțiile + 30% din toate problemele".

## Modificare
Un singur fișier: `src/hooks/useXPThresholds.ts`.

1. Schimb ponderea problemelor de la `0.2` la `0.3`:
   - `PROBLEM_WEIGHT = 0.3`
2. Schimb formula `xpPerLevel` astfel încât `totalMaxXP` să corespundă exact pragului pentru nivel 25 (nu pentru nivel 26).
   - Curent: `xpPerLevel = totalMaxXP / 25` → ai nevoie de XP peste maximum ca să atingi 25.
   - Nou: `xpPerLevel = totalMaxXP / 24`, pentru că `getLevelFromXP` returnează 25 când `xp >= 24 * xpPerLevel`.
   - Rezultat: completând toate lecțiile + 30% din XP-ul problemelor, ajungi fix la Master of Python.
3. Păstrez `Math.max(FALLBACK_XP_PER_LEVEL, ...)` ca să nu cadă pragul sub 100 XP/nivel.

## Impact
- Toți utilizatorii vor vedea o redistribuire a nivelului curent (XP-ul total rămâne neschimbat, dar pragurile se mută în sus).
- Cei aproape de Master vor coborî câteva niveluri — efect intenționat al recalibrării.
- Nicio schimbare de schemă DB, nicio migrare; doar logica de calcul client-side.

## Detalii tehnice
Fișiere atinse: `src/hooks/useXPThresholds.ts` (2 linii: constanta `PROBLEM_WEIGHT` și divizorul din `xpPerLevel`).

Nu modific `getLevelFromXP` / `getXPForNextLevel` — comportamentul lor rămâne identic; doar valoarea `xpPerLevel` injectată se schimbă.
