# Linkurile din cererile de verificare nu se deschid

## Cauza (verificată în date)
Nu e problemă la documentele încărcate (link semnat funcționează), ci la metoda **„Link public”**. În baza de date există cereri cu link salvat fără schemă, de exemplu `www.liccuza.ro`, iar unele cereri conțin text care nu e link deloc (`Colega de catedra :) love!`).

Fără `https://`, browserul tratează valoarea ca rută internă în aplicație → se deschide pagina 404 a aplicației (exact ecranul din captură).

## Ce se schimbă
1. **Normalizare la afișare (Admin > Profesori > Cereri)**: dacă linkul nu începe cu `http://` sau `https://`, se prefixează automat cu `https://` înainte de deschidere. Se afișează textul original, dar se navighează la URL-ul corect.
2. **Text care nu e link**: dacă valoarea nu arată ca un domeniu/URL valid, nu se mai randează ca link; se afișează ca text simplu cu nota „nu este un link valid”.
3. **Validare la trimitere (formularul profesorului)**: la metoda „Link public” se normalizează linkul înainte de salvare (adăugare `https://`) și se respinge cu mesaj clar textul care nu conține un domeniu valid.
4. Aceeași normalizare se aplică și oriunde altundeva se afișează linkul cererii (ex. detaliile din conversația de verificare, dacă apare).

## Detalii tehnice
- Se adaugă un helper mic (ex. `src/lib/normalizeUrl.ts`) cu `normalizeExternalUrl(value)` → `string | null` și test unitar pentru cazuri: cu schemă, fără schemă, `mailto:`, text liber.
- Fișiere atinse: `src/lib/normalizeUrl.ts` (nou), `src/components/admin/TeacherApproval.tsx`, `src/components/teacher/TeacherVerificationForm.tsx`.
- Fără migrații; datele vechi rămân neschimbate, fiind corectate la afișare.
