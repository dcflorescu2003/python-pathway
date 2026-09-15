# „Am uitat parola" pentru cine nu a avut niciodată parolă

## Răspuns scurt

Da, funcționează. Odată ce contul are o adresă reală de email, butonul „Am uitat parola" trimite un link de resetare, iar pe pagina de resetare utilizatorul își poate pune o parolă — chiar dacă nu a avut niciodată una. Nu e nevoie să fi setat parola înainte.

## Dar există o problemă

Verificat în cod: pagina de resetare salvează parola, dar **nu marchează contul ca „are parolă"**. Doar cartonașul din Profil face asta.

Consecință: cine își pune parola prin linkul de resetare va putea intra cu email + parolă, dar aplicația continuă să creadă că nu are parolă — deci:
- mesajul de la login „trebuie să îți setezi o parolă" rămâne;
- cartonașul din Profil rămâne afișat cu pasul „setează parola";
- dacă e cont Apple, blocarea la înscrierea în clasă rămâne activă.

## Soluția

După salvarea cu succes a parolei pe pagina de resetare, marcăm contul ca având parolă reală, exact ca la cartonașul din Profil. Astfel starea e aceeași indiferent pe unde a trecut utilizatorul.

## Detalii tehnice

- `src/pages/ResetPasswordPage.tsx`: după `supabase.auth.updateUser({ password })` reușit, `update profiles set has_real_password = true` pentru `user_id`-ul sesiunii de recovery (eroarea la update nu blochează mesajul de succes).
- Fără migrări, fără modificări de RLS sau funcții edge, fără modificări în `useAuthMethods` sau `RealEmailSetupCard`.

## Ce nu se atinge

Fluxul de trimitere a emailului de resetare, fluxul OTP pentru adresa reală, dialogul zilnic de reamintire, versiunea aplicației.
