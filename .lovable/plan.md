# Afișează locul userului pe toate clasamentele

## Problemă
În `src/pages/LeaderboardPage.tsx`, rândul „• • •" + propriul rând (când userul nu e în top 15) apare doar pe taburile Liceu / Oraș / Național:

```ts
const showUserBelow = tab !== "class" && !!userRankData && !userInTop15;
```

Tabul **Clasă** este exclus explicit. În plus, pe taburile non-clasă lista e limitată la primii 15, iar pe Clasă se afișează toți membrii — deci pe Clasă userul apare oricum în listă, dar logica nu e uniformă și nu e evident.

## Schimbare

1. Elimin restricția `tab !== "class"` din `showUserBelow`, ca pe toate taburile (Clasă, Liceu, Oraș, Național) să se afișeze rândul propriu sub „• • •" când userul nu e în lista vizibilă.
2. Calculez `userRankData` și pentru tabul Clasă (query-ul deja se activează pe `tab !== "class" || !!classData` — păstrăm).
3. Pe tabul Clasă, dacă userul e printre membri, `userInTop15` rămâne `true` și separatorul nu apare — comportament corect. Dacă (caz rar) profilul lipsește din `public_profiles`, va apărea sub separator.

## Tehnic
- Fișier: `src/pages/LeaderboardPage.tsx`
- Modific o singură linie: `const showUserBelow = !!userRankData && !userInTop15;`
- Restul logicii (query top, query rank, render) rămâne neschimbat.

## Out of scope
- Nicio modificare de date / RLS / edge functions.
- Fără schimbări de design.
