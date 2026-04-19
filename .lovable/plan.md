

## Diagnoză confirmată

### Bug 1: Statusul de profesor se resetează la elev

**Cauză exactă (verificată în DB):** Niciun user nu a reușit să devină profesor în ultimele 24h, deși 4 useri au încercat. Toți au `teacher_status=NULL`, `is_teacher=false`. Cauza este trigger-ul `protect_profile_privileged_columns` care **blochează scrierea pe `teacher_status` și `is_teacher`** chiar și din funcțiile `SECURITY DEFINER` (pentru că `auth.uid()` este non-null și nu e admin).

Doar `deactivate_teacher_mode` setează corect flag-ul de bypass:
```sql
PERFORM set_config('app.bypass_profile_protection', 'true', true);
```

Funcțiile **lipsite de bypass** (toate eșuează silent prin trigger):
- `request_teacher_status` → utilizatorul rămâne elev după Wizard
- `submit_teacher_verification` (în branch-urile `invite_code`, `referral` care fac auto-approve, și în `public_link`/`document` care setează `teacher_status='pending'`)
- `approve_teacher_request` (admin nu poate aproba)
- `reject_teacher_request`
- `revoke_teacher_status`

Frontend-ul afișează mesajul de succes („Ești acum profesor!") fără să verifice că update-ul a avut efect → la primul `focus`/`visibilitychange`, `loadAccountFlags` recitește profilul din DB, găsește `teacher_status=NULL` → revine la UI de elev.

### Bug 2: Liceul nu apare pre-selectat în formularul de verificare

În `TeacherVerificationForm`, state-ul local `selectedSchool` pornește gol. `TeacherWizard` salvează `school_id` în profil, dar formularul de verificare nu îl citește înapoi.

---

## Plan reparare

### 1. Migrație SQL: bypass în toate funcțiile SECURITY DEFINER care mută `teacher_status`/`is_teacher`

Adaug `PERFORM set_config('app.bypass_profile_protection', 'true', true);` înainte de UPDATE pe `profiles` în:
- `request_teacher_status`
- `submit_teacher_verification` (înainte de fiecare UPDATE pe profiles, în toate branch-urile)
- `approve_teacher_request`
- `reject_teacher_request`
- `revoke_teacher_status`

### 2. `TeacherWizard.tsx` — verifică rezultatul RPC

După `request_teacher_status`, recitesc profilul și verific dacă `teacher_status='unverified'`. Dacă nu → arunc eroare și nu cheamă `onComplete()`. Asta previne mesaje false de succes pe viitor.

### 3. `TeacherVerificationForm.tsx` — pre-populează liceul

Pe mount, citesc `school_id` din `profiles` al userului curent. Dacă există, găsesc școala în `schools[]` și setez `selectedSchool = "${name}, ${city}"`. Dacă userul vrea altă școală, butonul „Schimbă" rămâne funcțional.

### Fișiere modificate (3) + 1 migrație SQL
- migrație SQL nouă (5 funcții actualizate)
- `src/components/account/TeacherWizard.tsx`
- `src/components/teacher/TeacherVerificationForm.tsx`

### Nu modific
- Trigger-ul `protect_profile_privileged_columns` (e corect — blochează modificări neautorizate, doar funcțiile trusted trebuie să-l ocolească explicit)
- RLS policies (nu sunt cauza)

