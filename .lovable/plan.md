## Problema

- În DB, `florescudiana67@gmail.com` are `profiles.school_id = 'skipped'` (valoare pusă la onboarding când se sare peste alegere), dar `xp = 143`.
- În `LeaderboardPage`, tab-ul „Liceu" filtrează Top 15 și rangul după `userSchool` din `localStorage`. Când userul apasă „Schimbă", state-ul local + `localStorage` se actualizează imediat, dar `supabase.from("profiles").update({ school_id })` e apelat fără verificare de eroare. Dacă update-ul eșuează (sau nu s-a produs încă), profilul rămâne cu vechiul `school_id` (`'skipped'`), în timp ce filtrul folosește liceul nou.
- Rezultat: Top 15 conține 15 elevi din liceul „nou" (userul nu e printre ei, pentru că `public_profiles.school_id` e `'skipped'`), iar `userRankData` calculează totuși un rang (locul 8) numărând userii din liceul „nou" cu XP > 143 — de aici discrepanța din poză: „locul 8 cu ..." și un alt user afișat pe locul 8 în listă.

## Soluție

Corectăm două lucruri, ambele frontend:

### 1. `handleSelectSchool` — update robust în DB
- Așteptăm rezultatul `update()` pe `profiles` și verificăm `error`.
- Dacă eroare: `toast.error(...)`, NU setăm `localStorage`, NU schimbăm `userSchool`, ieșim.
- Dacă succes: setăm `localStorage` + state + invalidăm query-urile.

### 2. Sursa de adevăr pentru `userSchool` = profilul din DB
- Adăugăm un query mic (sau reutilizăm `userRankData`) care citește `school_id` curent al userului din `public_profiles` la mount și după orice schimbare de liceu.
- Preferăm `profile.school_id` peste `localStorage` pentru:
  - filtrul din Top 15 (`.eq("school_id", ...)`),
  - filtrul de oraș (derivat din același `school_id`),
  - condiția „liceu necunoscut" (ecranul cu căutare).
- Tratăm `'skipped'` la fel ca `null` — nu e un liceu valid, deci afișăm ecranul de alegere liceu.

### 3. Guard defensiv pe rang
- Nu calculăm/afișăm `userRankData` pentru tab-urile `school`/`city` dacă `myProfile.school_id` (din DB) nu se potrivește cu filtrul aplicat. Elimină definitiv „locul 8 cu …" fals când datele sunt tranzitorii.

## Fișiere modificate

- `src/pages/LeaderboardPage.tsx`:
  - `handleSelectSchool`: error handling pe update + toast, invalidare doar la succes.
  - Deriva `effectiveSchoolId` din profilul DB (nu `localStorage`), tratând `'skipped'` ca lipsă.
  - `userRankData`: skip calcul dacă `myProfile.school_id !== effectiveSchoolId` pe tab-urile filtrate pe liceu/oraș.

## Fișiere neatinse

- Fără migrări. `'skipped'` rămâne o valoare validă istorică; e tratată ca „fără liceu" în UI.
- Datele curente ale userului nu sunt modificate — după ce alege un liceu în UI-ul reparat, `profiles.school_id` se va salva corect.

## Verificare

1. Cu `florescudiana67@gmail.com`: după plan, deschis Clasament → tab „Liceu" va arăta ecranul „Alege liceul tău" (pentru că DB e `'skipped'`).
2. După alegere, dacă update-ul reușește, apare Top 15 corect și rangul propriu.
3. Dacă update-ul eșuează (RLS/rețea), primește toast și rămâne pe ecranul de alegere — fără rang fantomă.