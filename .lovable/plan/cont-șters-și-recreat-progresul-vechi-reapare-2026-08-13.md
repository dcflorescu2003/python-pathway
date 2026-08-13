# Cont șters și recreat: progresul vechi reapare

## Ce am verificat

- În baza de date nu există niciun cont cu email care conține „florescudavid” sau „david”, deci contul recreat **nu are date vechi în cloud** — nu e o ștergere incompletă pe server (cel puțin nu pentru acest cont).
- În aplicație, progresul se ține și local (`pyro-progress:<userId>` în localStorage). La ștergerea contului sau la delogare **nu se șterge nimic din datele locale** — nici progresul, nici școala aleasă, nici marcajele de dialoguri/nivel.
- În `useProgress` există o cale prin care progresul se scrie pe o cheie **fără user** (`pyro-progress`, fără id): ceasul de regenerare a vieților salvează cu `user?.id`, care e `undefined` imediat după delogare. Cheia fără user este exact cea citită la pornirea aplicației, înainte să se știe cine e utilizatorul — de aici XP-ul și lecțiile vechi apărute pe contul nou. Progresul afișat este apoi împins în cloud de mecanismul de sincronizare, deci contul nou chiar poate „moșteni” progresul.
- Funcția de ștergere cont curăță pe server doar o parte din tabele: lipsesc `skip_unlocked_lessons`, `student_competency_scores`, `student_competency_notes`, `class_members`, `test_submissions` / `test_answers` (ca elev), `user_email_reminders`, `email_change_otps`, `teacher_referral_codes`, `play_billing_subscriptions`.

## Ce propun

1. **Curățare locală completă la ștergerea contului și la delogare**
   - La ștergerea contului: se șterg toate cheile aplicației din localStorage (progres, școală, ciorne de test, marcaje de dialoguri, cooldown-uri) și copia nativă din Preferences, apoi se face reîncărcarea aplicației.
   - La delogare normală: aceeași curățare pentru datele contului curent, ca următorul cont să pornească gol.

2. **Eliminarea scrierii „fără utilizator”**
   - Progresul se salvează local doar când există un utilizator. Fără utilizator nu se mai scrie nimic și nu se mai citește cheia veche fără id (rămâne doar migrarea unică a datelor vechi pentru un cont deja logat).

3. **Ștergere completă pe server**
   - Se completează funcția de ștergere cu tabelele lipsă, ca un cont recreat pe același email să nu poată prelua nimic.

4. **Verificare**
   - Reproducem pe dispozitiv: cont nou → progres 0 XP, 0 lecții, școală necompletată; și verificăm în baza de date că nu apar rânduri vechi.

## Detalii tehnice

- `src/hooks/useProgress.ts`: `saveLocalProgress` devine no-op fără `userId`; intervalul de vieți și celelalte apeluri nu mai salvează când `user` lipsește; `loadLocalProgress()` inițial pornește de la starea implicită.
- Nou `src/lib/localWipe.ts`: `wipeLocalUserData()` — elimină cheile `pyro-*`, `pylearn-progress`, cheile de școală/ciorne/tip-uri și golește Preferences pe nativ (păstrând doar ce ține de instalare).
- `src/hooks/useAuth.tsx` (`signOut`) și `src/pages/DeleteAccountPage.tsx`: apel la `wipeLocalUserData()` înainte de redirect.
- `supabase/functions/delete-account/index.ts`: ștergeri suplimentare pentru tabelele enumerate mai sus, în ordinea corectă a dependențelor.
