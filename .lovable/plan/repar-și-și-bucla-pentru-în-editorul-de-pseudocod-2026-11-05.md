# Repar „și” și bucla „pentru” în editorul de pseudocod

## Ce am găsit (verificat rulând exemplul „număr perfect” cu n = 6)
1. **Bucla `pentru d <- 1, n div 2 executa` nu rulează deloc.** Editorul acceptă ca limită doar un cuvânt fără spații (ex. `n`), deci `n div 2` nu e recunoscut. Suma rămâne greșită, așa că rezultatul iese mereu NU. Aceasta este cauza principală.
2. **`și` scris cu diacritică nu e recunoscut** (merge doar `si`). Când elevul scrie `și`, condiția dă eroare internă și editorul o consideră automat adevărată, deci poate afișa răspunsuri greșite fără niciun avertisment.
3. Același lucru e valabil pentru `sau`/`nu` cu forme similare, iar `nu` are o problemă de prioritate (`nu a = b` se citește greșit).

## Ce schimb
- Bucla `pentru` acceptă expresii complete la start, limită și pas (`n div 2`, `n - 1`, `[n/2]` etc.).
- `și`, `si`, `ȘI`, `sau`, `nu` (cu și fără diacritice) funcționează în orice condiție; `nu` neagă corect toată expresia de după el.
- O condiție care nu poate fi calculată afișează o eroare clară în loc să fie tratată ca adevărată.
- Verific toate cele 11 lecții și 30 de probleme să dea în continuare rezultatele corecte.

## Detalii tehnice
- `src/lib/pseudocode/interpreter.ts`: regex-ul pentru `pentru` tradițional folosește `(.+?)` delimitat de virgule de nivel superior în loc de `(\S+)`; înlocuire `\bs[iîi]\b` → `&&` tolerantă la `ș`/`ş` (fără `\b` pe caractere Unicode, folosesc lookaround); `nu` → `!(...)` pe restul operandului; în `daca`/`cat timp`/`pana cand`, eșecul evaluării aruncă eroare în loc să returneze șirul.
- Teste noi în `pseudocode.test.ts`: număr perfect 6 → DA, 8 → NU, cu `si` și `și`; `pentru` cu `n div 2`; condiție combinată cu `nu`.
