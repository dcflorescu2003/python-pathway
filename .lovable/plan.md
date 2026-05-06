# Prag de promovare 75% pentru lecții

## Logica curentă

În `LessonPage.tsx`, când termini exercițiile (sau rămâi fără inimi), apelăm `completeLesson(lesson.id, xpEarned, percent)` indiferent de scor. Asta marchează lecția ca `completed: true` în `completed_lessons`, deci poți merge mai departe în capitol chiar și cu 0% corect.

## Schimbare propusă

Lecția se consideră **promovată** doar dacă scorul ≥ **75%**. Sub 75%:

- nu se salvează ca finalizată (nu se deblochează lecția următoare)
- nu se acordă XP din lecție (păstrăm doar XP-ul pe stradă deja câștigat per răspuns corect, dacă există — în prezent XP-ul vine din `completeLesson`, deci pur și simplu nu îl acordăm)
- ecranul final devine „Nu ai promovat — reia lecția" cu butoane **Reia** și **Înapoi**
- inima se pierde normal pe parcurs (mecanica nu se schimbă)

Peste 75% → flow-ul actual rămâne identic (se salvează scor, se acordă XP, se afișează „Lecție completă").

### Edge cases

- **Lives = 0 înainte de 75%**: în prezent se finalizează cu 1 XP de consolare. Noua logică: dacă scorul < 75%, NU se finalizează — același ecran „Reia lecția" (cu opțiunea de a urmări reclamă pentru inimi pentru a putea reîncerca). Fără XP de consolare.
- **Redo cu scor mai bun**: păstrăm comportamentul existent (`Math.max(previousEntry.score, score)` în `useProgress`) — dacă ai luat 80% acum și 60% data viitoare, rămâne 80% și completed.
- **Scor ≥ 75% dar < 100%**: finalizat, XP normal (cu penalizare per greșeală).
- **Lecții fără exerciții non-card** (doar carduri): rămân la 100% automat (deja așa e).

## Modificări în cod

`**src/pages/LessonPage.tsx**`

- Constantă `PASSING_THRESHOLD = 75`.
- În `handleAnswer` (ramura `card` finală) și `handleContinue`, când se atinge finalul:
  - calculează `percent` ca acum
  - dacă `percent >= 75` → `completeLesson(...)` ca acum
  - dacă `percent < 75` → setează `isFinished = true`, dar **nu** apelează `completeLesson`. Salvăm într-un state nou `passed: boolean` pentru ecranul final.
- Aceeași logică pentru cazul `lives <= 0` cu scor sub prag (în prezent acordă 1 XP — eliminăm).
- Ecranul `isFinished`:
  - dacă `passed` → ecranul actual de succes
  - dacă `!passed` → ecran nou:
    - „Nu ai promovat lecția"
    - „Ai răspuns corect la X/Y (Z%). Pentru a finaliza ai nevoie de minim 75%."
    - Buton **Reia lecția** (apelează `restartLesson()`, care există deja) — dezactivat dacă `noLives` și nu e Premium, cu CTA la reclamă
    - Buton **Înapoi**

**Niciun alt fișier nu necesită modificări** — `useProgress.completeLesson` rămâne intact, `ChapterPage` deja respectă `completedLessons[id].completed`, deci dacă nu apelăm completeLesson, lecția următoare rămâne blocată automat.

## Întrebări

- **Activitate zilnică / streak**: în prezent `recordActivity()` se apelează la primul răspuns corect. Îl păstrăm așa (chiar și cu lecție nepromovată) sau îl mutăm să se înregistreze doar la promovare? Recomand să-l las cum e — userul a făcut efort, streak-ul e meritat.
- **Pragul 75%**: îl fac constantă în cod (ușor de schimbat). OK?  
  
Da, pastram streak, si da fa pragul constanta