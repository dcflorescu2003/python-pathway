

## Plan: Sistem complet de verificare profesor (4 metode + admin îmbunătățit)

### Rezumat

Transformăm fluxul simplu "Devino Profesor" într-un formular cu 4 metode de verificare, adăugăm storage pentru documente, coduri de invitație în DB, sistem de referral între profesori, și îmbunătățim panoul admin pentru a gestiona toate aceste metode.

---

### Pasul 1 — Migrare bază de date

Creăm tabelele și coloanele noi:

1. **`teacher_verification_requests`** — stochează cererile detaliate:
   - `id`, `user_id`, `method` (enum: `invite_code`, `public_link`, `document`, `referral`), `status` (pending/approved/rejected), `data` (JSONB — conține link-ul, URL document, codul folosit, etc.), `admin_notes`, `reviewed_by`, `created_at`, `reviewed_at`

2. **`teacher_invite_codes`** — coduri de invitație gestionate de admin:
   - `id`, `code` (unique), `label` (ex: "CANTEMIR2026"), `max_uses`, `used_count`, `is_active`, `created_at`

3. **`teacher_referral_codes`** — coduri generate automat pentru profesori verificați (max 2 per profesor):
   - `id`, `teacher_id`, `code` (unique), `used_by` (nullable UUID), `used_at`, `created_at`

4. **Storage bucket** `teacher-documents` — pentru pozele cu legitimații/adeverințe.

5. Adăugăm coloană `verification_method` pe `profiles` (text, nullable) — pentru a ști cum a fost verificat.

RLS: cererile sunt vizibile doar utilizatorului propriu + admin; codurile de invitație admin-only; referral codes vizibile profesorului care le deține.

---

### Pasul 2 — Formular de verificare profesor (frontend)

Înlocuim butonul simplu "Devino Profesor" din `AuthPage.tsx` cu un dialog/pagină cu 4 opțiuni:

**Metoda A — Cod de invitație**: Input pentru cod. Validare instant pe `teacher_invite_codes`. Dacă e valid → status `verified` direct (sau `pending` cu review rapid).

**Metoda B — Link public**: Profesorul pune URL-ul paginii catedrei/site școlii unde apare numele lui. Se salvează în `teacher_verification_requests.data`.

**Metoda C — Document minim**: Upload poză legitimație/adeverință. Se salvează în storage bucket. Menționăm că pot ascunde CNP/serie.

**Metoda D — Cod de la un profesor verificat**: Input pentru codul de referral. Validare pe `teacher_referral_codes` — dacă e valid și nefolosit → verificare directă.

Fișier nou: `src/components/teacher/TeacherVerificationForm.tsx`

---

### Pasul 3 — Panou Admin îmbunătățit (`TeacherApproval.tsx`)

- **Tab "Cereri"**: afișează `teacher_verification_requests` cu status `pending`, grupate pe metodă. Pentru fiecare cerere se vede: metoda, datele furnizate (link clickabil, preview document, codul folosit), buton Aprobă/Respinge + câmp note admin.
- **Tab "Coduri invitație"**: CRUD pe `teacher_invite_codes` — creare cod nou, activare/dezactivare, vizualizare utilizări.
- **Tab "Profesori verificați"**: lista actuală + metoda de verificare + codurile lor de referral vizibile.
- Când se aprobă o cerere → se trimit notificări (in-app + push, ca acum) + se generează automat 2 coduri de referral pentru noul profesor.

---

### Pasul 4 — Coduri de referral pentru profesori verificați

- Pe `TeacherPage.tsx`, secțiune nouă: "Codurile tale de invitație" — afișează cele 2 coduri generate, cu status (folosit/disponibil) și buton copy.
- Când un coleg folosește un cod de referral valid → `used_by` se completează, profesorul nou e verificat automat.

---

### Pasul 5 — Edge function `request_teacher_status` actualizat

Transformăm RPC-ul existent într-o funcție mai complexă sau creăm o nouă funcție care:
- Validează codul de invitație / referral
- Creează înregistrarea în `teacher_verification_requests`
- Pentru coduri valide (A și D): aprobă automat

---

### Fișiere modificate/create

| Fișier | Acțiune |
|--------|---------|
| Migrare SQL | Nou — tabele + storage bucket + RLS |
| `src/components/teacher/TeacherVerificationForm.tsx` | Nou — formular cu 4 metode |
| `src/pages/AuthPage.tsx` | Modificat — înlocuire buton cu dialog verificare |
| `src/components/admin/TeacherApproval.tsx` | Rescris — cereri detaliate + coduri invitație + referrals |
| `src/pages/TeacherPage.tsx` | Modificat — secțiune coduri referral |
| `src/hooks/useTeacher.ts` | Modificat — hooks pentru referral codes |
| DB function `request_teacher_status` | Actualizat sau înlocuit |

