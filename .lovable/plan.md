## Problemă

Funcția `deactivate_teacher_mode()` deja șterge: testele, atribuirile, răspunsurile, clasele, membrii, provocările, cererile de verificare, mesajele și codurile de referral. Dar lasă în urmă date care pot crea conflicte la o re-activare ulterioară sau referințe orfane.

## Ce mai trebuie șters

1. `**student_competency_notes**` unde `teacher_id = uid` — notele profesorului despre eleviii lui rămân orfane după ce clasele dispar.
2. `**item_competencies**` unde `created_by = uid` AND `item_type IN ('test_item','custom')` — tag-urile de competențe pe care profesorul le-a pus pe propriile întrebări custom (întrebările dispar dar tag-urile rămân).
3. `**profiles**` — pe lângă `teacher_status`, `is_teacher`, `verification_method`, resetăm și:
  - `last_teacher_reminder_at = NULL`
  - `last_unverified_teacher_reminder_at = NULL`
   ca să nu rămână flag-uri vechi care blochează notificările la o re-înregistrare.

## Implementare

Migrație care actualizează `public.deactivate_teacher_mode()` adăugând cele trei ștergeri/resetări de mai sus, înainte de `UPDATE profiles` final. Restul funcției rămâne neschimbat (ordinea actuală de ștergere e corectă din punct de vedere al FK-urilor).

Nu sunt modificări în frontend — pagina `Account` apelează deja această funcție.

## Întrebare

Vrei să șterg și **notificările** profesorului (`notifications` unde `user_id = uid` cu link `/admin?tab=teachers` sau legate de verificare)? Sau le lăsăm să rămână în istoric?

Sterge si notificarile