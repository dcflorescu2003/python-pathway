# De ce crește XP-ul necontrolat pe contul dcflorescu2003

## Ce am verificat în baza de date

- Profilul are acum **64.380 XP**, dar activitatea reală înregistrată este de **576 itemi** (203 lecții + 373 probleme), toți cu scor 100, inserați într-o singură operațiune pe 18 aug 10:22.
- XP-ul corect pentru exact aceste finalizări este **15.460**. Valoarea actuală este de ~4,16 ori mai mare.
- Singura funcție de server care mai poate scrie XP este `award_progress`, iar ea nu acordă XP de două ori pentru același item la același scor. Deci XP-ul suplimentar **nu vine din activitate**.
- Contul are rolul **admin** în `user_roles`.
- Triggerul anti-fraudă `protect_profile_privileged_columns` rescrie `xp`, `streak`, `best_streak` la valorile vechi **doar dacă utilizatorul nu este admin**. Pentru un cont admin, orice scriere directă pe `profiles.xp` din client trece nefiltrată.
- Codul web actual nu mai scrie XP direct (`syncToCloud` folosește doar `restore_progress`, fără XP), deci sursa scrierilor este un client mai vechi — aplicația instalată pe telefon, dintr-un build anterior schimbării anti-fraudă, care la fiecare sincronizare trimitea XP-ul local cumulat în profil.

Concluzie: excepția pentru admin din trigger lasă contul tău complet neprotejat, iar aplicația veche de pe telefon îi trimite periodic XP local umflat. Restul conturilor sunt protejate (al doilea cont cu tot 576 de itemi are 12.721 XP, valoare normală).

Rămâne de confirmat, la implementare, care build anume de pe telefon face scrierea; verificarea se face prin blocarea scrierii și urmărirea dacă XP-ul mai crește.

## Ce propun

1. **Eliminarea excepției de admin din protecția XP**
   - `protect_profile_privileged_columns` va bloca `xp`, `streak`, `best_streak` pentru orice utilizator autentificat, inclusiv admini. Modificările legitime rămân posibile doar prin funcțiile de server (`award_progress`, `record_activity`) și prin funcțiile de admin, care rulează cu bypass explicit.
   - Adminii păstrează controlul asupra Premium (`is_premium`, `premium_manual*`), care se acordă tot din panou.

2. **Funcție de recalculare a XP-ului (admin)**
   - `admin_recompute_xp(user_id)` — SECURITY DEFINER: recalculează XP-ul strict din `completed_lessons` (`lessons.xp_reward` / `problems.xp_reward`) și îl scrie cu bypass. Astfel, orice cont umflat poate fi readus la valoarea reală fără migrări manuale.
   - O rulez imediat pentru contul tău: XP devine **15.460** (valoarea reală a celor 576 de finalizări). Dacă preferi să rămână la 17.600 ca înainte, îmi spui și setez acea valoare.

3. **Verificare că nu mai crește**
   - După blocare, urmăresc XP-ul contului și confirm că, la o sincronizare de pe telefon, valoarea nu se mai modifică decât cu XP-ul lecției efectiv făcute.

4. **Curățare la sincronizare (protecție suplimentară)**
   - Semnal în panoul Admin: conturi la care XP-ul din profil diferă cu peste 10% de XP-ul calculat din finalizări, ca să se vadă imediat orice altă scurgere.

## Detalii tehnice

- Migrare SQL: `CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()` fără ramura `has_role(..., 'admin')` pentru coloanele de progres (păstrată doar pentru coloanele de Premium/profesor); funcție nouă `public.admin_recompute_xp(p_user_id uuid)` cu verificare `has_role(auth.uid(),'admin')` și `set_config('app.bypass_profile_protection','true',true)`.
- Fără modificări în `award_progress` / `restore_progress` — ambele sunt deja idempotente.
- Frontend: fără schimbări funcționale; opțional un buton „Recalculează XP” în panoul Admin, pe fișa utilizatorului, care apelează noul RPC.
