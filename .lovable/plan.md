## Problema

Pe web, dacă rămâi fără inimi, un refresh aparent "resetează" contorul și poți continua la nesfârșit. Cauza nu e că web-ul are inimi infinite by design — în cod inimile se decrementează și pe web. Problema reală e în `mergeProgress` / load flow din `src/hooks/useProgress.ts`:

1. `loadCloud()` citește `lives` din DB (sursa adevărului, ex: `0` + `lives_updated_at` = momentul când ai rămas fără).
2. `mergeProgress()` combină progresul local cu cel cloud și pentru `lives` ia `Math.max(local, cloud)`. Local storage are de obicei `5` (sau o valoare mai mare, niciodată redusă), deci rezultatul devine `5`.
3. Imediat după, `syncToCloud` rescrie în DB `lives = 5` și `lives_updated_at = now`. Cei 30 de minute se pierd la fiecare refresh.

Aceasta e și fereastra prin care un user își poate "regenera" inimile instantaneu pe web.

## Soluția

Tratăm `lives` și `lives_updated_at` drept câmpuri **server-authoritative**: clientul nu mai are voie să "ridice" inimile prin merge sau prin scriere localStorage→cloud. Singurele scrieri valide sunt:
- decrementare la greșeală (`loseLife`)
- reset la 5 după 30 min real (regenerare bazată pe `lives_updated_at` din DB)
- recompensă explicită (ad / coupon / premium)

### Modificări (un singur fișier: `src/hooks/useProgress.ts`)

1. **`mergeProgress`**: pentru `lives` și `livesUpdatedAt` nu mai folosim `Math.max` / "cel mai recent". Le luăm direct din parametrul `b` (cloudProgress) — sursa autoritară. Adăugăm un comentariu explicit ca să nu mai fie reintroduse în viitor.

2. **`loadCloud()`**: după ce facem `setProgress(finalProgress)`, dacă `hasCloudProgress` e adevărat și apelăm `syncToCloud`, ne asigurăm că trimitem `lives` și `lives_updated_at` exact cele din cloud (nu cele merge-uite). Cel mai curat: NU mai trimitem deloc `lives` / `lives_updated_at` în `syncToCloud` — separăm scrierile de inimi în funcțiile dedicate (`loseLife`, `setLivesFromReward`, regenerare).

3. **`syncToCloud`**: scoatem `lives` și `lives_updated_at` din `update`. Astfel niciun refresh, niciun merge, niciun device secundar nu mai poate suprascrie contorul real al inimilor. Inimile rămân controlate doar de:
   - `loseLife` (scade + setează `lives_updated_at` doar la trecerea la 0)
   - `setLivesFromReward` (din `reward-life` edge function, deja server-side)
   - intervalul de regenerare locală care, doar dacă au trecut 30 min reale de la `lives_updated_at` din cloud, scrie `lives = 5`

4. **Regenerare**: `regenerateLives` deja folosește `livesUpdatedAt` ca anchor și 30 min reale → corect, dar trebuie să se bazeze pe valoarea din cloud, nu pe localStorage. După fix-ul la merge, valoarea din state vine din cloud.

5. **localStorage**: păstrăm cache-ul ca să avem UI instant la încărcare, dar imediat ce vine cloud-ul, lives din cloud îl suprascrie pe cel local (deja se întâmplă, doar că merge-ul îl strica). Nimic în plus de făcut aici.

### De ce e sigur împotriva tampering-ului

- `lives_updated_at` e setat în DB doar atunci când lives ajunge la 0 (logica din `loseLife`, linia ~367). Refresh-ul nu mai poate atinge acest câmp.
- RLS pe `profiles` permite update doar pentru `auth.uid() = user_id`, dar coloanele privilegiate (is_premium, is_teacher, teacher_status) sunt deja protejate prin triggerul `protect_profile_privileged_columns`. **Nu** protejăm `lives` la nivel de trigger pentru că `loseLife`/regenerare scriu legitim din client — însă atacul "scriu lives=5 manual din devtools" rămâne posibil. Dacă vrei să închidem și asta complet, putem adăuga un trigger care interzice client-ul să scrie `lives > OLD.lives` decât prin RPC (vezi opțional mai jos).

### Opțional (recomandare, pas viitor)

Mutăm decrementul / reset-ul de lives într-un RPC `consume_life()` SECURITY DEFINER care:
- citește `lives` și `lives_updated_at` curent;
- aplică regula de regenerare (30 min);
- decrementează atomic și setează `lives_updated_at` doar la trecerea la 0;
- returnează noua stare.

Și un trigger care blochează orice `UPDATE` direct la `lives` / `lives_updated_at` dacă nu vine prin bypass flag (cum e deja `app.bypass_profile_protection`). Asta închide complet tampering-ul din devtools.

Pot face și pasul opțional în această rundă dacă vrei — spune-mi.

## Test plan

- Pe web, fă o lecție și greșește până ajungi la 0 inimi → vezi gate-ul "Nu ai inimi".
- Refresh pagina → inimile rămân 0, contorul de 30 min nu se resetează.
- Așteaptă 30 min (sau setezi manual `lives_updated_at` în trecut în DB) → la următoarea reîncărcare inimile devin 5.
- Premium / teacher verificat → ∞ inimi, nu se modifică nimic.