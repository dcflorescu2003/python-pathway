# Provocări grupate

## Ce se schimbă
- Când profesorul atribuie mai multe lecții/probleme odată, ele devin **o singură provocare** (ex. „Provocare – 9 nov.”, cu nume opțional ales de profesor în dialogul de atribuire).
- **Profesor (pagina clasei):** vede un card per provocare cu nume, termen, număr de itemi și progres agregat (ex. „12/25 elevi au terminat tot”). Click → se extinde lista lecțiilor/problemelor, cu progresul fiecăreia, ca acum. Termenul se editează o dată pentru toată provocarea; se poate șterge toată provocarea sau un item individual.
- **Elev (Cont):** vede un card per provocare cu „3/5 rezolvate” și bara de progres. Click → se deschid itemii, fiecare cu butonul de start, ca acum.
- Active / Finalizate / Istoric (expirate) funcționează pe provocare: e „finalizată” când toți itemii sunt făcuți; expiră la termenul comun.
- Notificarea către elevi: una singură per provocare (nu per item).
- Provocările vechi (atribuite deja separat) se grupează automat după clasă + momentul atribuirii (aceeași atribuire = același grup).

## Detalii tehnice
- Migrație: coloane `group_id uuid` și `group_title text` pe `challenges`; backfill `group_id` pe (class_id, teacher, created_at rotunjit la minut, due_date).
- `ChallengeAssigner` generează un `group_id` comun + titlu; `useTeacher` adaugă update termen/ștergere pe grup.
- `useChallenges` și `ClassDetail`/`StudentTab` grupează pe `group_id` (helper pur `groupChallenges` cu test).
- RLS existentă rămâne neschimbată (aceleași rânduri).
