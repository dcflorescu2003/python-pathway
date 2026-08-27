# Mesaj clar la reluarea lecțiilor + streak pentru probleme

## 1. Mesaj când reluarea nu mai acordă XP

Pe ecranul de final de lecție se afișează mereu „+X XP”, chiar dacă serverul nu a acordat nimic (la reluare cu scor egal sau mai mic decât cel salvat, XP-ul acordat este 0).

Ce se schimbă:
- Ecranul de final va afișa XP-ul real acordat, nu estimarea locală.
- Trei situații distincte:
  - Prima finalizare: „+X XP” (ca acum).
  - Reluare cu scor mai bun: „+3 XP pentru scor îmbunătățit”.
  - Reluare fără scor mai bun: în loc de „+X XP”, un mesaj clar de tipul „Ai deja scorul maxim la această lecție ({scor}%), așa că reluarea nu mai acordă XP. Progresul rămâne salvat.”

Aceeași logică se aplică și pe ecranul unei probleme rezolvate din nou (mesaj scurt în locul toast-ului actual „Toate testele au trecut”).

## 2. Streak-ul să țină cont și de problemele rezolvate

Comportament actual în cod: la o problemă, XP-ul și streak-ul se înregistrează doar prin `completeLesson`, care este apelat **exclusiv** când problema nu era deja rezolvată. Deci:
- problemă nouă rezolvată → serverul actualizează streak-ul (de confirmat că ajunge corect în UI);
- problemă deja rezolvată → nu se înregistrează nicio activitate.

Cauza exactă a observației tale nu e încă confirmată (datele contului tău au toate finalizările pe aceeași zi, din import, deci nu se poate deduce din istoric). Primul pas al implementării este verificarea reală a fluxului.

Ce se face:
1. Verificare: se rulează fluxul de rezolvare a unei probleme noi și se confirmă dacă `award_progress` întoarce `streak_increased` și dacă valoarea ajunge în interfață (Acasă / cartonaș streak).
2. Înregistrarea activității pentru probleme: la o problemă nouă rezolvată corect, ziua se marchează ca zi activă și, dacă streak-ul crește, apare dialogul de felicitare (ca la lecții).
3. Reluările de probleme deja rezolvate rămân fără XP și fără efect asupra streak-ului, conform cerinței tale.

## Detalii tehnice

- `src/hooks/useProgress.ts`: `completeLesson` va returna rezultatul serverului (`awarded_xp`, `first_time`, `score`, `streak_increased`) sau se expune un `lastAward` pentru consumatori.
- `src/pages/LessonPage.tsx`: ecranul `isFinished` folosește rezultatul real în locul lui `xpEarned` calculat local; se păstrează fallback-ul optimist până sosește răspunsul serverului (offline / coadă de sincronizare).
- `src/pages/ProblemSolvePage.tsx`: la prima rezolvare se declanșează și înregistrarea activității (`recordActivity` / rezultatul din `award_progress`) și se afișează `StreakCelebrationDialog`; la reluare, mesaj explicit „fără XP”.
- Fără modificări de schemă sau de RPC: `award_progress` deja actualizează `last_activity_date` și streak-ul și pentru itemi `problem-%`.
