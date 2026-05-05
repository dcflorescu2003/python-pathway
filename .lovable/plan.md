## Combinăm pașii 2 și 3 într-unul singur

În loc să fie 3 pași (email → cod → parolă), vor fi doar 2:

1. **Email** → trimite cod
2. **Cod + Parolă** → confirmă codul ȘI setează parola simultan

### Modificări

`**src/components/account/RealEmailSetupCard.tsx**`

- Elimin `Step = "password"` separat. Rămân doar `"email"` și `"code"`.
- În pasul 2 adaug câmpurile parolă + confirmare parolă lângă codul de 6 cifre.
- Buton unic „Confirmă și finalizează":
  1. Apelează `verify-email-change` cu codul
  2. Dacă userul nu are parolă, apelează `supabase.auth.updateUser({ password })`
  3. Toast „Cont configurat!" și refresh
- Header arată „Pasul X din 2" (sau „1 din 1" dacă deja are parolă).
- Dacă userul are deja parolă (caz rar), pasul 2 nu mai cere parolă — doar codul.

`**useEffect` simplificat**

- Dacă `hasVerifiedRealEmail && !hasPassword` → momentan duce la pasul „password". După refactor, acest caz nu mai există ca pas separat. În schimb, dacă userul a verificat deja emailul dar n-are parolă (cont legacy), arăt direct un mini-form doar cu parolă (fără cod) — caz edge pentru utilizatori existenți ca tine acum.

### De ce nu apare la tine acum

`useEffect`-ul setează `step = "password"` doar dacă `hasVerifiedRealEmail && !hasPassword`. Probabil `useRealEmailReminder` nu returnează `true` pentru `hasVerifiedRealEmail` imediat după verificare (sau `refreshReminder` nu propagă rapid). Cu noul flux în 2 pași, parola se setează în aceeași tranzacție cu codul → problema dispare complet.

### Pentru contul tău actual ([cosmin.florescu@fglorca.ro](mailto:cosmin.florescu@fglorca.ro) deja șters)

După deploy, faci din nou flow-ul: introduci emailul, primești codul, în același ecran completezi codul + parola dorită, apeși „Finalizează" și gata — te poți loga pe web cu email + parolă.

### Fișier modificat

- `src/components/account/RealEmailSetupCard.tsx`

Niciun edge function nou; logica backend existentă (`request-email-change` + `verify-email-change` + `supabase.auth.updateUser`) rămâne.  
  
Sa stergi din nou contul [cosmin.florescu@fglorca.ro](mailto:cosmin.florescu@fglorca.ro) si sa imi spui daca trebuie sa fac build nou