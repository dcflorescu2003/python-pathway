## Modificare sistem XP la lecții

### Reguli noi
- **Perfect (0 greșeli)**: primești XP-ul integral al lecției (`lesson.xpReward`)
- **Cu greșeli**: scade 1 XP pentru fiecare greșeală (răspuns greșit)
- **Pierdere toate inimile**: primești 1 XP (consolare), indiferent de câte greșeli ai făcut
- **XP minim**: niciodată sub 1 (chiar dacă greșelile depășesc xpReward, nu coboară sub 1 când lecția e finalizată)

### Comportament la recapitulare (lecție deja completată)
**Întrebare pentru tine**: păstrăm regula veche de „3 XP fix la recapitulare" sau aplicăm aceeași formulă nouă (perfect = xpReward, -1/greșeală)?

Default propus în plan: aplicăm aceeași formulă și la recapitulare — e mai simplu și mai consistent. (Spune-mi dacă vrei altfel.)

### Implementare

**Fișier: `src/pages/LessonPage.tsx`**

1. Adaug state `wrongCount` (resetat în `restartLesson`)
2. Incrementez `wrongCount` în `handleAnswer` la fiecare răspuns greșit
3. Înlocuiesc calculul `xpEarned`:
   ```
   xpEarned = lives <= 0 
     ? 1 
     : Math.max(1, lesson.xpReward - wrongCount)
   ```
4. Apelez `completeLesson(lesson.id, xpEarned, percent)` — trec XP-ul calculat în loc de `lesson.xpReward`
5. Actualizez ecranul de finish să afișeze `+{xpEarned} XP` cu noua valoare (afișat și când lives=0, fiindcă acum primește 1 XP)
6. Adaug în UI o mică explicație opțională ("−1 XP per greșeală") sub badge-ul de XP

**Fișier: `src/hooks/useProgress.ts`** — verific că `completeLesson` acceptă XP-ul ca parametru (deja face asta din apelul existent).

**Manual lessons (`src/pages/ManualLessonPage.tsx`)**: lecțiile manuale publice nu acordă XP (no auth tracking) — nu necesită modificări.

**Teste / probleme** (problems, predefined tests): scopul nu le acoperă — rămân neschimbate.

### Edge cases
- Lecție doar cu card-uri (theory): perfect → xpReward integral (nu sunt greșeli posibile)
- `xpReward = 5`, 7 greșeli, supraviețuiește → 1 XP (clamp minim)
- `xpReward = 20`, 0 greșeli, lives=0 la final → imposibil (dacă a făcut perfect nu pierde inimi); dacă cumva apare → 1 XP (regula lives≤0 are prioritate)

### Memorie
Voi actualiza `mem://features/gamification/lesson-scoring-logic` cu noua formulă XP.
