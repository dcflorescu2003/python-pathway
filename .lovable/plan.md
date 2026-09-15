# După update: pot utilizatorii de iPhone să intre în clasă?

## Răspuns scurt

În mare parte da, dar mai lipsește o piesă: un cont are deja parolă setată, iar aplicația nu o „vede", deci ar rămâne blocat degeaba.

## Ce e deja rezolvat prin update

- Cine s-a logat cu Apple și are adresă reală de email vede acum în Profil zona de setare a parolei (și pe iPhone, și pe web) — înainte nu apărea nimic.
- Cine își pune parola prin „Am uitat parola" e recunoscut corect ca având parolă, deci mesajul de la login și cartonașul din Profil dispar.
- După setarea parolei, înscrierea în clasă se deblochează imediat.

## Situația reală a conturilor Apple (verificată în baza de date)

- 36 de conturi create cu Apple.
- 14 folosesc încă adresa ascunsă Apple → trebuie să pună un email real + parolă (comportament intenționat, pașii apar în Profil).
- 13 au deja adresă reală, dar fără parolă → după update văd direct câmpul de parolă în Profil și se pot înscrie în clasă imediat după ce o setează.
- 9 sunt complet configurate → intră în clasă fără nicio piedică.
- **1 cont are deja parolă setată, dar marcajul intern lipsește** → i s-ar cere în continuare să „seteze o parolă" și ar fi blocat la înscrierea în clasă, deși are deja una.

## Ce propun în plus

Corectăm marcajul pentru conturile care au deja parolă reală, ca aplicația să nu le mai ceară ceva ce au făcut deja. Fără asta, acel utilizator (și oricine ajunge în aceeași situație) rămâne blocat la intrarea în clasă.

## Detalii tehnice

- Backfill unic: `update public.profiles p set has_real_password = true` pentru `user_id`-urile unde `auth.users.encrypted_password` este setat și `p.has_real_password` e `false`/`null`.
- Fără modificări de cod, fără migrări de schemă, fără RLS, fără funcții edge.
- Verificare după rulare: numărul de conturi cu parolă în auth și marcaj lipsă trebuie să fie 0.

## Ce nu se atinge

Regula pentru adresele ascunse Apple (rămân obligatorii email real + parolă), fluxul OTP, dialogul zilnic de reamintire, versiunea aplicației.
