# Cartonașul de parolă lipsește din tabul Profil

## Problema

Un utilizator care s-a înregistrat cu Apple și și-a pus deja adresa reală de email primește pe ecranul de login mesajul că trebuie să își seteze o parolă, dar în tabul Profil nu apare nicio zonă unde să o poată seta. Rămâne blocat: i se cere ceva ce nu poate face.

Verificat în baza de date: există utilizatori Apple cu adresă reală de email și fără parolă setată — exact situația descrisă.

## Cauza

Cartonașul din Profil se afișează doar dacă adresa este încă una ascunsă Apple, sau dacă email-ul real a fost confirmat prin fluxul cu cod din aplicație. Cine și-a schimbat adresa pe altă cale (sau înainte de introducerea fluxului) nu bifează niciuna dintre condiții, deci cartonașul dispare — deși mesajul de la login se afișează în continuare, pentru că acela se uită doar la „cont Apple + fără parolă".

## Soluția

Aliniem cele două locuri la aceeași regulă: **cont Apple + fără parolă setată ⇒ arată zona de setare a parolei în Profil.**

1. Cartonașul din Profil apare și când adresa este deja reală, dar parola lipsește — direct pe pasul „setează parola", fără să mai ceară cod pe email.
2. Când adresa este încă una ascunsă Apple, comportamentul rămâne exact ca acum (email real + parolă, în doi pași).
3. După setarea parolei, cartonașul trece pe starea „Cont complet configurat", iar mesajul de la login nu mai apare.
4. Cartonașul devine vizibil și pe web, nu doar pe iPhone, ca utilizatorii Apple care intră de pe web să poată finaliza contul.

## Detalii tehnice

- `src/components/account/RealEmailSetupCard.tsx`:
  - condiția de randare devine: afișează dacă `isPrivateRelay`, sau dacă `hasApple && !hasPassword` (indiferent de `hasVerifiedRealEmail`);
  - selecția pasului: dacă adresa nu e private relay și `!hasPassword` ⇒ `password_only`;
  - se scoate gardul `isIOS` (păstrăm gardul pe cont Apple).
- `src/hooks/useAuthMethods.ts`: rămâne sursa de adevăr (`profiles.has_real_password`); fără modificări de logică.
- `useRealEmailReminder` rămâne neschimbat pentru dialogul zilnic (acesta ține doar de adresele ascunse Apple).
- Fără migrări, fără modificări de RLS sau de funcții edge.

## Ce nu se atinge

Fluxul cu cod OTP pentru schimbarea adresei, dialogul zilnic de reamintire, gating-ul pentru înscrierea în clasă, versiunea aplicației.
