## Modificări lecții: inimi Premium și logică XP

### Problema 1 — Premium rămâne cu 5 inimi în lecție

În prezent `loseLife()` în `useProgress.ts` returnează imediat dacă userul e Premium (`if (prev.isPremium) return prev`), iar în `LessonPage.tsx` afișarea folosește `lives = progress.isPremium ? 5 : progress.lives`. Deci Premium nu pierde niciodată inimi — nici măcar local pe durata lecției.

**Soluție:** introducem un contor de inimi **local lecției** (state în `LessonPage`), inițializat la 5, care scade pentru toți userii la fiecare răspuns greșit. Inimile reale din `progress.lives` (sincronizate cu DB) **rămân neatinse pentru Premium**. Când contorul local ajunge la 0:

- se afișează ecranul „Ai rămas fără vieți” (același UI ca la non-premium, dar fără reclama AdMob — pentru Premium punem un buton „Reîncepe lecția”)
- butonul **Reîncepe** resetează: `currentIndex=0`, `correctCount=0`, contor local de inimi=5, `feedback=null`, `isFinished=false` și permite reluarea lecției imediat
- pentru non-premium rămâne fluxul actual (await 20 min sau watch ad)

Pentru non-premium, scăderea inimilor reale din DB se face în continuare prin `loseLife()` (păstrăm comportamentul actual). Astfel inimile vizibile în header devin = `min(localLives, progress.lives)` pentru non-premium și `localLives` pentru Premium.

### Problema 2 — XP greșit la prima finalizare

În `useProgress.ts` `completeLesson()` calculează `alreadyCompleted = !!previousEntry?.completed`, deci dă XP-ul setat la prima finalizare reușită. Bug-ul observat (3 XP la prima finalizare) provine cel mai probabil din faptul că în `LessonPage.tsx` valoarea `wasFirstTime` se citește **înainte** ca lecția să fie completată, dar `xpEarned` afișat în ecranul final folosește `lesson.xpReward` doar dacă `wasFirstTime`, altfel hardcodat `3`. Dacă userul a mai deschis lecția anterior și `completedLessons[lessonId].completed` a ajuns cumva la `true` fără finalizare reală, primește 3.  
  
As vrea sa avem si un UI o alta iconita pentru lectiile pe care le-ai facut, dar nu le-ai terminat, semnul de Replay de la muzica

**Decizie agreată:** păstrăm regula actuală — *3 XP dacă lecția este deja marcată completă, XP-ul setat al lecției la prima finalizare reușită*. Modificările:

1. **Eliminăm complet componenta XP per-exercițiu** din calcul. În `LessonPage.tsx` apelul `completeLesson(lesson.id, lesson.xpReward, percent)` deja folosește `lesson.xpReward` (corect). Verificăm și înlăturăm orice acumulare de XP din exerciții individuale (există `xp` per exercițiu în DB dar nu este însumat în flux — doar confirmăm).
2. **Sursa unică de adevăr** pentru XP devine `lesson.xpReward` (XP-ul setat al lecției). Editorul admin pentru XP/exercițiu rămâne în DB pentru retro-compat dar nu e folosit în calcul.
3. **Asigurăm că marcajul `completed=true**` se setează **doar** când lecția se termină cu inimi rămase (= cazul în care `completeLesson` e apelat). Codul actual deja face asta — confirmăm că nu există cale prin care lecția să fie marcată completă fără finalizare. Dacă nu există bug aici, atunci 3 XP-ul vine din faptul că ai mai terminat lecția înainte (pe alt device / sincronizare cloud) — nu e bug, e logica corectă.

Vom adăuga un log de debug temporar pentru a vedea în consolă ce valoare are `previousEntry` la momentul `completeLesson`, ca să confirmăm exact ce s-a întâmplat în cazul descris.

### Fișiere modificate

- `src/pages/LessonPage.tsx` — contor local de inimi, ecran „fără vieți” pentru Premium cu buton Reîncepe, reset state la reîncepere
- `src/hooks/useProgress.ts` — fără modificări la logica XP; doar log de diagnostic în `completeLesson` pentru a confirma `previousEntry`

### Out of scope

- Modificarea sistemului de XP per-exercițiu din editorul admin (rămâne în DB, doar nu e folosit la totalul lecției)
- Schimbarea comportamentului non-premium (rămâne cu reclamă AdMob și await 20 min)