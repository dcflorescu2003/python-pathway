# XP-ul sărit la ~48.000 după o lecție pe telefon (build Android vechi)

## Ce am verificat acum în baza de date

- Contul `dcflorescu2003@gmail.com` are în cloud **15.460 XP** — deci valoarea de ~48.000 pe care ai văzut-o pe telefon **nu există pe server**.
- Același cont are acum **0 rânduri** în istoricul de finalizări (`completed_lessons`), deși alt cont cu același parcurs are 576. Istoricul lui a dispărut la un moment dat.
- Triggerul anti-fraudă blochează acum scrierea directă a `xp`, `streak`, `best_streak` din client pentru **toți** utilizatorii, inclusiv admini. Singura cale de XP este `award_progress` (care e idempotentă: la reluare dă XP doar dacă scorul crește).
- Există totuși o politică `DELETE` pe `completed_lessons` care permite clientului să-și șteargă istoricul — o rutină veche de „reset/sync” de pe telefon poate goli istoricul.

Consecința importantă: **cu istoricul gol în cloud, orice item reluat este considerat „prima dată” și primește XP integral.** Dacă telefonul vechi retrimite sute de itemi după o astfel de golire, XP-ul poate exploda legitim din punctul de vedere al serverului. Momentan nu s-a întâmplat (0 finalizări, 15.460 XP), dar riscul e real la următoarea sincronizare de pe build-ul vechi.

Ce nu pot afirma încă cu certitudine: dacă cei ~48.000 afișați pe telefon au fost doar valoarea locală a build-ului vechi (foarte probabil, pentru că serverul nu i-a înregistrat) sau o scriere respinsă. Prima verificare din plan clarifică asta din jurnalele bazei de date.

## Ce propun

1. **Blocarea ștergerii istoricului din client**
   - Eliminarea politicii `DELETE` de pe `completed_lessons`. Ștergerea rămâne posibilă doar prin funcția de ștergere a contului (rulează cu drepturi de serviciu).
   - Asta închide scenariul „istoric golit → replay → XP integral din nou”.

2. **Plafon de siguranță în `award_progress`**
   - Limită de XP acordat pe zi și pe utilizator (ex. maximum echivalentul a ~15 itemi noi/zi la XP integral, restul se înregistrează ca finalizare fără XP).
   - Motiv: chiar dacă un client vechi retrimite istoric, profilul nu mai poate sări cu zeci de mii de XP într-o singură sesiune.

3. **Refuzul XP pentru clienți vechi**
   - `award_progress` primește un parametru de versiune a aplicației; apelurile fără versiune sau sub versiunea minimă (build-urile de dinaintea corecțiilor) înregistrează finalizarea, dar **nu acordă XP**.
   - Versiunea nouă trimite versiunea și funcționează normal.

4. **Reconciliere XP ↔ istoric**
   - Rularea `admin_recompute_xp` pentru contul tău după ce restaurăm istoricul real (203 lecții + 373 probleme), ca XP-ul să corespundă din nou finalizărilor.
   - În panoul Admin, semnal pentru conturile la care XP-ul diferă cu peste 10% de XP-ul calculat din istoric.

5. **Verificare**
   - Verific jurnalele bazei de date pentru sesiunea de azi de pe telefon, ca să confirm ce apel a produs afișarea 48.000.
   - După actualizarea aplicației: fac o lecție pe telefon și confirm că XP-ul crește exact cu valoarea lecției, identic pe web.
   - Bump de versiune Android + iOS, ca telefonul să iasă din build-ul vechi.

## Detalii tehnice

- Migrare SQL: `DROP POLICY "Users can delete their own completed lessons" ON public.completed_lessons`; `CREATE OR REPLACE FUNCTION public.award_progress(...)` cu parametru opțional `p_client_version text`, plafon zilnic de XP calculat din `completed_lessons` de azi, și returnare `awarded_xp = 0` pentru clienți sub versiunea minimă.
- Frontend: `src/hooks/useProgress.ts` trimite versiunea aplicației la fiecare apel `award_progress` (inclusiv din coada offline).
- Restaurare date cont: `restore_progress` cu lista curentă de lecții/probleme (fără XP), apoi `admin_recompute_xp`.
- `android/app/build.gradle` + `ios` — bump de versiune.
