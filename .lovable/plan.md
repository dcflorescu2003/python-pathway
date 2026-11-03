# Clase împărțite între doi profesori (co-profesor)

## Ce va putea face profesorul
- Profesorul care a creat clasa (titularul) apasă în pagina clasei pe **„Adaugă co-profesor"** și primește un **cod de invitație** (ex. `PROF-K7Q2`), valabil 7 zile.
- Colegul introduce codul în contul lui de profesor verificat și clasa îi apare în lista lui, marcată „Co-profesor".
- Co-profesorul poate:
  - vedea elevii, progresul, statisticile și clasamentul clasei;
  - da provocări (teme) cu termen, ca titularul;
  - atribui clasei testele lui proprii;
  - vedea și **nota toate testele date la acea clasă**, inclusiv cele atribuite de titular (corectare manuală, eliberare note/răspunsuri).
- Co-profesorul NU poate: șterge clasa, scoate elevi, schimba codul de înscriere, modifica testele colegului (le vede doar în contextul clasei).
- Titularul vede lista co-profesorilor și îi poate elimina oricând; co-profesorul poate părăsi clasa.
- Fiecare primește notificare când e adăugat/eliminat.
- Limită: maxim 3 co-profesori pe clasă.

## Detalii tehnice
- Tabel nou `class_co_teachers (class_id, teacher_id, added_by, created_at)` + tabel `class_co_teacher_invites (class_id, code, expires_at, used_by)`, cu GRANT + RLS.
- RPC-uri SECURITY DEFINER: `create_co_teacher_invite`, `accept_co_teacher_invite(code)` (doar profesori verificați), `remove_co_teacher`, `leave_co_taught_class`.
- Extind `is_class_teacher` și `can_teacher_view_student` să includă co-profesorii — astfel politicile existente pentru provocări, membri, statistici, clasament funcționează automat.
- Funcție nouă `can_grade_assignment(assignment_id)` (titular test SAU profesor/co-profesor al clasei) folosită în politicile și RPC-urile pentru `test_submissions`, `test_answers`, `get_submission_review`, `get_test_roster_allocations`, eliberare note, și în funcția `grade-submission`.
- Acțiunile destructive (ștergere clasă, scoatere elevi) rămân verificate strict pe `teacher_classes.teacher_id`.
- Frontend: `useTeacher.ts` încarcă și clasele co-predate; `ClassDetail.tsx` primește secțiunea „Profesori" și ascunde acțiunile de titular pentru co-profesor; `useTests.ts` permite vizualizarea/notarea testelor clasei.
- Premium/limite AI: notarea AI pentru un test folosește limita titularului testului.
- Teste pentru: invitație expirată/folosită, co-profesor poate nota, co-profesor nu poate șterge clasa.
- Necesită build nou în store (bump 1.237) pentru aplicațiile mobile; pe web apare imediat.
