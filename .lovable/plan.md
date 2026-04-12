

## Plan: Restructurare flux profesor cu 3 statusuri

### Situația curentă
- `teacher_status` are valorile: `null`, `pending`, `verified`
- "Devino Profesor" deschide direct formularul de verificare
- Profesorii `pending` au acces limitat (doar teste demo)

### Ce se schimbă

**Noul flux cu 3 statusuri:**
1. **`unverified`** — Click pe "Devino Profesor" → setează instant `teacher_status = 'unverified'`, `is_teacher = true`. Profesorul poate crea clase, provocări, teste cu exerciții existente + custom. Vede un banner în TeacherPage explicând că pentru acces la subiecte predefinite trebuie să se verifice.
2. **`pending`** — Profesorul completează formularul de verificare → status devine `pending`. Mesajele admin apar în secțiunea profesor din pagina de cont, cu posibilitate de răspuns + documente atașate. Profesorul primește notificare când adminul trimite mesaj.
3. **`verified`** — Acces complet.

### Modificări tehnice

**1. Migrare DB**
- Actualizare `request_teacher_status()` RPC: setează `teacher_status = 'unverified'` (nu `pending`)
- Actualizare `submit_teacher_verification()`: verifică dacă user este `unverified`, schimbă în `pending` (pentru metode manual-review) sau `verified` (pentru coduri)
- Actualizare `protect_profile_privileged_columns()` să permită și valoarea `unverified`
- Actualizare `reject_teacher_request()`: resetează la `unverified` (nu `null`), ca profesorul să rămână profesor dar neverificat

**2. AuthPage.tsx (pagina de cont)**
- "Devino Profesor": apelează `request_teacher_status()` direct (fără formular) → setează `unverified`
- Secțiunea profesor pentru `unverified`: buton "Panou Profesor" + buton "Începe verificarea" care deschide formularul
- Secțiunea profesor pentru `pending`: buton "Panou Profesor" + `PendingTeacherSection` cu chat/mesaje admin
- Secțiunea profesor pentru `verified`: buton "Panou Profesor" (ca acum)

**3. TeacherPage.tsx**
- Adaugă status `unverified` (lângă `pending` și `verified`)
- Banner nou pentru `unverified`: explică facilitățile disponibile și mesaj că pentru subiecte predefinite trebuie verificare
- Banner pentru `pending`: mesaj că verificarea este în curs
- `unverified` și `pending` au acces la clase, provocări, teste custom (dar NU la biblioteca de teste predefinite complete)

**4. Notificări admin → profesor**
- În `TeacherApproval.tsx` (admin), la trimiterea unui mesaj: inserează o notificare in-app în tabelul `notifications` pentru profesorul respectiv

**5. Vizibilitate conținut**
- TestBuilder/TestManager: păstrează restricția existentă — doar `verified` vede biblioteca completă de teste predefinite. `unverified` și `pending` văd doar demo + pot crea teste custom.

