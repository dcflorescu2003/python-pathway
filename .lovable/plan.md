
## Problemă

`daviflorescu40` (Google, cont curat, fără clase, fără status profesor) primește „Eroare la înscriere." după dialogul cu numele. Datele din DB arată sănătoase (RPC, grants, constraints, RLS pe `profiles`/`class_members` toate OK), iar contul nu are gating Apple. Codul curent din `AuthPage.tsx` ascunde mesajul real al erorii într-un `else` generic și nu verifică rezultatul update-ului de profil — deci nu putem ști dacă pică `.update(profiles)` sau `.rpc(join_class_with_code)`.

## Plan

1. **`src/pages/AuthPage.tsx` – `handleNameConfirm`**
   - Capturez `{ error }` din `supabase.from("profiles").update(...)`; dacă vine cu eroare, `console.error("[profile update]", error)` + `toast.error("Eroare la salvarea numelui: " + error.message)` și opresc flow-ul înainte de `joinClassDirect`.

2. **`src/pages/AuthPage.tsx` – `joinClassDirect`**
   - Păstrez cazurile speciale existente („Invalid join code", „Already enrolled" / unique constraint).
   - Pentru orice altă eroare: `console.error("[joinClassDirect]", error)` + `toast.error("Eroare la înscriere: " + (msg || "necunoscută"))` ca mesajul real să apară pe mobil.

Nicio schimbare de schemă sau logică. După ce apare mesajul real, revin cu fix-ul țintit (probabil RLS/trigger pe profiles sau caz specific în RPC).
