## Problema

După ce userul vizionează complet reclama, apelul către `reward-life` întoarce non-2xx și apare toast-ul „Nu s-au putut acorda viețile". Nu există loguri pentru funcția `reward-life`, ceea ce indică faptul că request-ul este respins la gateway înainte să intre în handler — cauza tipică: funcția nu are `verify_jwt = false` în `supabase/config.toml`, deci gateway-ul cere JWT semnat cu vechiul secret. Funcția deja își validează singură token-ul cu `auth.getClaims()`, deci validarea la gateway trebuie dezactivată.

## Cauza tehnică

- `supabase/config.toml` nu are intrare pentru `[functions.reward-life]`. 
- Pe sistemul nou de signing keys din Lovable Cloud, funcțiile fără `verify_jwt = false` explicit pot eșua la verificarea JWT din gateway → răspuns non-2xx fără să se logheze nimic în funcție.
- În plus, în handler validarea token-ului poate eșua silențios dacă `getClaims` întoarce undefined în loc de eroare; vom adăuga loguri și răspunsuri mai clare.

## Soluție

1. **`supabase/config.toml`** — adaug:
   ```toml
   [functions.reward-life]
   verify_jwt = false
   ```
   Astfel funcția primește request-ul și validează JWT-ul intern (cum face deja).

2. **`supabase/functions/reward-life/index.ts`** — îmbunătățiri minore:
   - Adaug loguri (`[REWARD-LIFE] ...`) la fiecare pas (start, auth, profile fetch, update) pentru debugging viitor.
   - Returnez mesaj de eroare clar la fiecare cale de eșec.
   - Verific că `Authorization` header începe cu `Bearer ` înainte de a-l procesa.

Nu sunt necesare schimbări de schemă (coloanele `lives`, `ads_watched_today`, `ads_last_reset`, `lives_updated_at` există deja în `profiles`).

## Verificare după deploy

După aplicare, dacă userul mai întâlnește eroarea, logurile din `reward-life` vor arăta exact unde pică (auth invalid, profil lipsă, sau update eșuat), și putem corecta rapid.