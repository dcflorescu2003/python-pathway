# XP și clasamente identice pe web și pe telefon

## Ce am verificat

- Toate clasamentele (clasă, liceu, oraș, național) citesc XP din aceeași sursă: vizualizarea `public_profiles` peste tabelul `profiles`. Deci datele de pe server sunt identice pentru ambele platforme — diferențele vin din afișare/cache, nu din date diferite.
- În `useProgress.ts`, la revenirea în aplicație, XP-ul local este combinat cu `Math.max(local, cloud)`. Dacă dispozitivul are un XP local mai mare (optimist sau vechi), telefonul continuă să afișeze acea valoare, în timp ce webul arată valoarea reală din cloud. Funcția centrală `mergeProgress` face deja corect (cloud-ul câștigă) — doar acest refetch nu respectă regula.
- La finalizarea unei lecții se adaugă XP optimist local înainte de răspunsul serverului. Dacă apelul eșuează (offline pe telefon), XP-ul local rămâne umflat până la un resync reușit.
- Interogările clasamentului nu au reîmprospătare la revenirea aplicației native (nu există listener `appStateChange` în pagina de clasament), deci pe telefon se poate afișa un cache vechi după ce XP-ul s-a schimbat.
- După ce câștigi XP, nu se invalidează cache-ul clasamentului, deci intrarea proprie poate rămâne cu valoarea veche până la o navigare nouă.
- Clasamentul „oraș” grupează liceele după lista de licee inclusă în build (`src/data/schools`). Dacă versiunea din aplicația Android e mai veche decât cea de pe web, orașul asociat unui liceu poate diferi și lista pe oraș iese diferită.

## Ce voi face

1. **XP autoritar din cloud** — în `useProgress.ts`, refetch-ul la focus/vizibilitate va adopta valoarea din cloud pentru XP și streak (fără `Math.max`), la fel ca `mergeProgress`. XP-ul optimist rămâne doar până la răspunsul serverului, apoi este suprascris cu totalul returnat de `award_progress`.
2. **Reconciliere la revenirea în aplicație** — adaug un listener `appStateChange` (Capacitor) pe lângă `visibilitychange`, ca telefonul să reia profilul din cloud când aplicația revine în prim-plan.
3. **Clasamente mereu proaspete** — în `LeaderboardPage.tsx`: `staleTime` scurt, `refetchOnWindowFocus` și reîmprospătare la revenirea aplicației native, plus invalidarea cheilor `leaderboard-*` după fiecare câștig de XP (lecție/problemă), ca poziția proprie să se actualizeze imediat.
4. **Consistență oraș** — orașul folosit pentru clasamentul pe oraș va fi determinat pe baza `school_id` din profil, cu protecție când liceul nu există în lista locală (nu mai afișăm un oraș greșit; se cere reselectarea liceului). Astfel web și mobil ajung la aceeași grupare.
5. **Verificare** — comparație directă între ce afișează interfața și valorile din baza de date pentru contul de test, pe toate cele patru clasamente, plus verificarea faptului că poziția proprie apare identic pe ambele platforme.

## Detalii tehnice

- Fișiere atinse: `src/hooks/useProgress.ts`, `src/pages/LeaderboardPage.tsx` (eventual un mic hook comun pentru „app resumed”).
- Fără modificări de schemă în baza de date; `public_profiles` rămâne singura sursă pentru clasamente.
- Nicio schimbare a regulilor de acordare a XP-ului (`award_progress` rămâne sursa de adevăr, idempotentă).
