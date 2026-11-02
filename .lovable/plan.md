# Termen limită pentru provocări + istoric restrâns

## Ce se schimbă pentru utilizator
- **Profesor:** când atribuie o provocare (lecție sau problemă) poate alege opțional o dată limită. Poate modifica sau șterge termenul și pentru provocările deja atribuite.
- **Lista profesorului (pagina clasei):** provocările active (fără termen sau cu termen azi/în viitor) rămân afișate normal, cu „Termen: 15 nov.”. Cele expirate se mută într-un rând restrâns **„Istoric provocări (N)”**, care se deschide la click.
- **Elev (Acasă și Profil):** vede doar provocările active desfășurate, cu termenul afișat (și „Ultima zi” evidențiat când e ziua respectivă). Provocările expirate apar într-un rând restrâns „Istoric (N)”, cu scor/status, și pot fi încă deschise ca exercițiu obișnuit.
- O provocare expiră **după sfârșitul zilei** alese (ora României), deci ziua respectivă e inclusă integral.
- Provocările existente nu au termen, deci rămân active ca acum.

## Detalii tehnice
- Migrare: coloană nouă nullable `challenges.due_date date`; politică UPDATE pentru profesorul clasei (`is_class_teacher`) + GRANT UPDATE.
- `ChallengeAssigner`: date picker opțional, trimis la `useCreateChallenge`; în `ClassDetail` acțiune de editare termen (`useUpdateChallengeDueDate`).
- Helper comun `isChallengeExpired(due_date)` (comparare cu data curentă Europe/Bucharest) + test unitar.
- `useChallenges` / `useClassChallenges` returnează `due_date`; `Index.tsx`, `StudentTab.tsx`, `ClassDetail.tsx` împart lista în active vs istoric folosind `Collapsible`.
- Necesită build nou în magazine pentru aplicațiile mobile (bump 1.235); pe web apare imediat.
