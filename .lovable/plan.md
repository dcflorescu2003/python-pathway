

## Plan: Diagnosticare send-push cu logging detaliat

### Problema curenta

Edge function `send-push` returneaza 401 la fiecare apel. Log-urile functiei nu contin niciun mesaj (doar boot/shutdown), ceea ce inseamna ca functia nu logheaza inainte de a returna eroarea. Trebuie adaugat logging detaliat pentru a identifica exact unde pica.

### Pasi

#### 1. Adaugare logging in `send-push/index.ts`

Adaugam `console.log` la fiecare pas critic:
- La intrarea in functie (confirmare ca se executa)
- Daca lipseste Authorization header
- Rezultatul `getUser()` (eroarea exacta)
- Dupa parsarea body-ului
- Numarul de device tokens gasite
- Rezultatul fiecarui apel FCM

#### 2. Redeploy si test manual

- Redeployam functia
- Apelam `send-push` prin `curl_edge_functions` cu un body valid (student_ids din `device_tokens`)
- Citim log-urile pentru a vedea exact unde pica

#### 3. Fix bazat pe diagnostic

Cele mai probabile cauze:
- **getUser() esueaza** -- token-ul JWT din header nu este valid (posibil `supabase.functions.invoke` nu trimite header-ul corect din mediul nativ Capacitor)
- **Body-ul nu se parseaza** -- `req.json()` ar putea esua daca body-ul e malformat

Daca `getUser()` e problema, solutia va fi sa facem functia sa accepte apeluri autentificate cu service role key (verificand doar ca apelantul e profesor), sau sa adaugam header-ul explicit in apelurile din frontend.

### Fisiere modificate

- `supabase/functions/send-push/index.ts` -- adaugare console.log-uri la fiecare pas

