# Plan: Cartonaș contextual pentru verificare profesor

## Obiectiv
Înlocuiesc mesajul generic din `TeacherVerificationTipCard` cu unul care arată **exact de ce** contul de profesor nu este verificat și **ce pași concreți** trebuie făcuți, în funcție de statusul real al cererii (`unverified` / `pending` / `rejected`).

## Modificări propuse

### 1. Hook `useTeacherVerificationTip.ts`
- Preia, pe lângă `profiles.is_teacher` și `profiles.teacher_status`, și cea mai recentă înregistrare din `teacher_verification_requests` pentru utilizatorul curent (exclusiv `approved`), ordonată descrescător după `created_at`.
- Returnează un obiect `details` care conține:
  - `profileStatus`: statusul din `profiles` (`unverified` / `pending` / `verified` / `null`)
  - `requestStatus`: statusul cererii (`pending` / `rejected` / `null`)
  - `method`: metoda folosită (`invite_code`, `public_link`, `document`, `referral` sau `null`)
  - `adminNotes`: notele administratorului (`admin_notes`)
  - `submittedAt`: data trimiterii
  - `reviewedAt`: data review-ului (pentru respingere)
- Păstrează logica existentă de throttling (maxim o dată pe zi) și de ascundere când `teacher_status === 'verified'`.

### 2. Componenta `TeacherVerificationTipCard.tsx`
- Primește prop-ul `details` returnat de hook.
- Afișează conținut diferit în funcție de combinația `profileStatus` / `requestStatus`:

#### a) `unverified` fără cerere respinsă recentă
- **Titlu:** "Verifică-ți contul de profesor 🎓"
- **Motiv:** "Nu ai trimis încă o cerere de verificare."
- **Pași:** pașii existenți (deschide Cont → Profesor, alege metodă, trimite dovada).
- **CTA:** "Verifică acum" → `/auth?tab=profile`.

#### b) `pending` (cerere în așteptare)
- **Titlu:** "Cererea ta este în așteptare ⏳"
- **Motiv:** "Ai trimis o cerere prin **{metodă}**. Administratorul o revizuiește și vei fi notificat."
- **Pași:**
  1. Răspunde în chat dacă ți se cer informații suplimentare.
  2. Așteaptă notificarea de aprobare.
- **CTA:** "Vezi conversația" → `/auth?tab=profile`.
- Dacă există `adminNotes`, le afișează vizibil într-un bloc de tip avertisment.

#### c) `rejected` (cerere respinsă, profil revenit la `unverified`)
- **Titlu:** "Cererea a fost respinsă ⚠️"
- **Motiv:** `adminNotes` sau, fallback, "Cererea ta nu a putut fi verificată."
- **Pași:**
  1. Corectează problema indicată mai sus.
  2. Retrimite o nouă cerere din pagina de cont.
- **CTA:** "Retrimite cererea" → `/auth?tab=profile`.

### 3. `Index.tsx`
- Destructură `details` din `useTeacherVerificationTip()`.
- Transmite `details` ca prop către `<TeacherVerificationTipCard details={details} />`.
- Păstrează prioritatea cartonașului de verificare față de sfaturile motivaționale.

### 4. Stil și UX
- Păstrează designul existent (gradient, progress bar, animație, buton închidere, durată 8s).
- Adaugă iconițe specifice fiecărui status (`Clock` pentru pending, `AlertTriangle` pentru rejected, `GraduationCap` pentru unverified).
- Asigur că textul motivului nu depășește înălțimea cartonașului pe ecran mic; dacă adminNotes este lung, se poate scrolla în interiorul cardului.

## Fără modificări backend
- Nu sunt necesare schimbări în baza de date sau funcții; se folosește tabela `teacher_verification_requests` care există deja și este citibilă pentru utilizatorul autentificat prin RLS.

## Verificare
- După implementare, voi testa vizual că:
  - Profesorul `unverified` vede pașii de început.
  - Profesorul `pending` vede mesajul de așteptare și, dacă există, notele adminului.
  - Profesorul cu cerere `rejected` vede motivul respingerii și pașii de retrimite.
