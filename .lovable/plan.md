Schimbă ordinea și culoarea secțiunii "Poți mai mult" în sumarul personalizat.

Modificări:
1. Adaugă un nou token semantic `improve` (culoare între galben și verde — chartreuse/lime) în `src/index.css` și în `tailwind.config.ts`.
2. În `src/components/PersonalizedSummary.tsx`:
   - Reordonează secțiunile expandate: după "Ai nevoie de exercițiu", să apară "Poți mai mult", iar apoi "Te descurci excelent".
   - Afișează "Poți mai mult" oricând există lecții cu scor < 100%, nu doar când nu există slăbiciuni.
   - Schimbă iconița și accente de la `primary` la noul token `improve` pentru secțiunea "Poți mai mult".
   - Păstrează mesajul de felicitare doar când nu există nici slăbiciuni, nici lecții de îmbunătățit, dar există puncte forte.

Fără modificări de business logic sau de backend.