## Inimi nelimitate pentru profesorii verificați

Profesorii cu `teacher_status = 'verified'` primesc automat inimi nelimitate, fără niciun mesaj sau promo în UI. Beneficiul se activează în momentul în care admin-ul aprobă (sau prin invite/referral/cupon care setează `teacher_status='verified'`).

### Ce primesc / nu primesc verificații

- **Da**: `lives` nu mai scade, afișaj `∞` la inimi, fără dialog „Fără vieți", fără reclamă-pentru-inimi.
- **Nu**: nu primesc Premium (nu apare coroana, nu primesc conținut Premium, nu primesc dragon gold).

### Modificări tehnice

**1. `src/hooks/useProgress.ts`**
- Adaugă `hasUnlimitedLives: boolean` în interfața `UserProgress` (default `false`).
- La `loadCloud` și la refetch pe focus, citește în plus `teacher_status` din `profiles` și calculează:
  `hasUnlimitedLives = (profile.is_premium ?? false) || profile.teacher_status === 'verified'`
- Înlocuiește în logica de vieți toate verificările `p.isPremium` cu `p.hasUnlimitedLives`:
  - `regenerateLives` (linia 71)
  - `loseLife` (linia 347)
  - `mergeProgress` (linia 504): `hasUnlimitedLives: a.hasUnlimitedLives || b.hasUnlimitedLives`
- `isPremium` rămâne intact (controlează coroana, conținut Premium etc.).

**2. `src/pages/LessonPage.tsx`**
- `lives = progress.hasUnlimitedLives ? localLives : Math.min(localLives, progress.lives)` (linia 64)
- `noLives = !progress.hasUnlimitedLives && progress.lives <= 0` (linia 71)
- Branch-ul `if (!progress.isPremium) loseLife()` → `if (!progress.hasUnlimitedLives) loseLife()` (linia 135)
- Ecranul „Lecție terminată fără vieți": `progress.hasUnlimitedLives ? Reîncepe : Vezi reclamă` (liniile 216-238)

**3. `src/pages/SkipChallengePage.tsx`**
- Linia 136: `if (progress.lives <= 0 && !progress.hasUnlimitedLives)`

**4. `src/pages/Index.tsx`**
- Afișaj inimi (linia 341): `{progress.hasUnlimitedLives ? "∞" : progress.lives}`
- Click handler inimi (linia 327): toast „Inimi nelimitate" doar dacă `hasUnlimitedLives` (text neutru, nu menționează „Premium" pentru profesori). Vom împărți: dacă e `isPremium` → mesaj Premium; dacă e doar verificat → mesaj scurt „Ai inimi nelimitate ❤️" fără să pomenească rolul.
- `RefillLivesDialog` se deschide doar când nu are `hasUnlimitedLives`.

**5. `src/components/RefillLivesDialog.tsx`** și **`src/components/WatchAdForLivesButton.tsx`**
- Adaugă prop `hasUnlimitedLives` (sau înlocuiește `isPremium`-ul existent care decide ascunderea reclamei) — ascund butonul de reclamă și pentru verificați. Cea mai mică schimbare: păstrăm `isPremium` ca prop dar îi pasăm de fapt valoarea `hasUnlimitedLives` din locurile care îl invocă.

**6. Memorie**
- Adăugăm `mem://features/teacher-platform/verified-unlimited-lives` cu regula: „Profesorii verificați primesc inimi nelimitate silențios; nu apare nicăieri ca beneficiu/reclamă; nu primesc alte avantaje Premium".
- Actualizăm `mem://index.md` cu referința.

### Fără modificări de DB / RLS
Coloana `teacher_status` există deja, RLS-ul actual permite citirea profilului propriu. Nicio migrație necesară.
