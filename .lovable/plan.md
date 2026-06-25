## Modificare PersonalizedSummary

Când nu există lecții cu scor < 80% (toate "excelente"), în loc de mesajul final "Felicitări! Toate lecțiile tale au scor excelent!", afișez o secțiune nouă **"Poți mai mult"** cu primele 3 lecții cu cel mai mic scor sub 100% (deci care nu au punctaj maxim), sortate crescător după scor.

### Schimbări în `src/components/PersonalizedSummary.tsx`

1. În `useMemo`, calculez suplimentar `improvable`: lecții cu `score < 100`, sortate crescător, primele 3 — folosit doar când `weaknesses.length === 0`.
2. Înlocuiesc blocul final `weaknesses.length === 0 && strengths.length > 0` cu:
   - Dacă `improvable.length > 0`: card cu titlu "Poți mai mult — încearcă să obții 100%" + lista celor 3 lecții (același UI ca `weaknesses`, dar icon/accent neutru-primary, nu warning).
   - Altfel (toate sunt 100%): mesajul actual de felicitare.

Nu schimb logica pentru `weaknesses`/`strengths`, doar adaug fallback-ul motivațional.
