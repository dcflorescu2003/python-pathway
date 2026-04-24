

## Problemă

Când refaci o lecție din **Sumar personalizat**, streak-ul se actualizează doar la finalul lecției (în `completeLesson`). Dacă utilizatorul abandonează refacerea, închide app-ul, sau pierde toate viețile, activitatea de azi NU este înregistrată — deși a făcut efectiv exerciții.

În plus, `useProgress` este instanțiat separat în fiecare pagină (Index, LessonPage), deci după ce LessonPage face update-ul, Index se bazează pe re-mount + citire localStorage. Dacă, dintr-un motiv anume, sincronizarea cloud rămâne în urmă, contoarele afișate pe Acasă pot părea „înghețate".

## Plan de remediere

**1. Înregistrează activitatea la primul răspuns corect din `LessonPage`**

În `src/pages/LessonPage.tsx`:
- Importă `recordActivity` din `useProgress()`.
- Apelează-l o singură dată per montare a paginii, la primul exercițiu rezolvat corect (folosind un `useRef` flag).
- Asta garantează că orice exercițiu făcut prin Sumarul Personalizat (sau orice replay de lecție) bumpează streak-ul imediat, exact ca la `ProblemSolvePage`.

**2. Re-sincronizare la revenire pe Index**

În `src/hooks/useProgress.ts`:
- Adaugă un listener `visibilitychange` + `focus` pe `window` care re-citește `profiles` (xp, streak, lives, last_activity_date) când tab-ul redevine vizibil.
- Update local state doar dacă valorile cloud sunt mai recente (compară `last_activity_date` sau `streak`).
- Asta aliniază Index cu modificările făcute în LessonPage chiar și fără re-mount.

**3. Verificare consistență**

- Streak-ul se actualizează deja corect în `completeLesson` și `recordActivity` — nu schimbăm logica de calcul.
- Toate conturile cu acces la Sumar (Premium) folosesc același flux `LessonPage`, deci fix-ul acoperă toți userii vizați automat.

## Fișiere modificate

- `src/pages/LessonPage.tsx` — apel `recordActivity()` la primul exercițiu corect
- `src/hooks/useProgress.ts` — listener `visibilitychange`/`focus` pentru refetch profile

Niciun schimbări de schemă DB, nicio migrație.

