## Plan: Mesaj prietenos pentru email duplicat + curățare cont test

### 1. `verify-email-change/index.ts` — mesaj clar pe conflict
În blocul `updateUserById`, detectez codul `email_exists` / mesajul `users_email_partial_key` / status 422 și returnez 409 cu mesaj:
> „Acest email este deja folosit de alt cont. Loghează-te direct cu el sau folosește altă adresă."

### 2. `request-email-change/index.ts` — pre-flight check
Înainte să generez OTP-ul, verific dacă emailul nou există deja folosind `admin.auth.admin.listUsers` (paginare cu filtru) sau o interogare directă în `auth.users` via service client. Dacă există → 409 cu același mesaj prietenos. Evită trimiterea inutilă de email.

### 3. `RealEmailSetupCard.tsx` — afișare eroare
Toast-urile existente deja afișează `data.error`, deci mesajul backend va apărea direct. Nu sunt modificări UI necesare.

### 4. Migrație SQL — șterge cont test
```sql
DELETE FROM auth.users WHERE email = 'cosmin.florescu@fglorca.ro';
```
Cascadează automat la `profiles` și restul tabelelor cu FK pe `auth.users`.

### 5. Deploy
Redeploy `request-email-change` și `verify-email-change`.
