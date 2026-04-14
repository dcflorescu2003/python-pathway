

## Plan: Dialog de avertizare la dezactivarea modului profesor + ștergerea datelor

### Ce se schimbă

**1. UI — Dialog de confirmare (AuthPage.tsx)**

Înlocuim `confirm()` nativ cu un `AlertDialog` styled care afișează:
- Titlu: "Dezactivează modul profesor"
- Mesaj de avertizare cu lista consecințelor:
  - Toate clasele și elevii din clase vor fi șterse
  - Toate testele create vor fi șterse  
  - Procesul de verificare va trebui reluat de la zero
- Buton "Renunță" și buton roșu "Sunt de acord"

Adăugăm un state `showDeactivateDialog` pentru controlul dialogului.

**2. Backend — RPC `deactivate_teacher_mode` (migrare SQL)**

Modificăm funcția existentă să șteargă toate datele de profesor înainte de a reseta profilul:
- `DELETE FROM test_items WHERE test_id IN (SELECT id FROM tests WHERE teacher_id = uid)`
- `DELETE FROM test_assignments WHERE test_id IN (SELECT id FROM tests WHERE teacher_id = uid)`
- `DELETE FROM tests WHERE teacher_id = uid`
- `DELETE FROM challenges WHERE class_id IN (SELECT id FROM teacher_classes WHERE teacher_id = uid)`
- `DELETE FROM class_members WHERE class_id IN (SELECT id FROM teacher_classes WHERE teacher_id = uid)`
- `DELETE FROM teacher_classes WHERE teacher_id = uid`
- `DELETE FROM teacher_referral_codes WHERE teacher_id = uid`
- `DELETE FROM teacher_verification_requests WHERE user_id = uid`
- `DELETE FROM teacher_verification_messages WHERE request_id IN (SELECT id FROM teacher_verification_requests WHERE user_id = uid)`
- Reset profil: `teacher_status = NULL, is_teacher = false, verification_method = NULL`

Ordinea operațiilor respectă dependințele (items/assignments înaintea tests, members/challenges înaintea classes, messages înaintea requests).

### Fișiere modificate
- `src/pages/AuthPage.tsx` — AlertDialog în loc de `confirm()`
- Migrare SQL — `deactivate_teacher_mode` cu cascade delete

