# Repararea sincronizării progresului telefon → cloud

## Ce am confirmat

- Telefonul afișează **203 lecții**, **391 probleme** și **33.218 XP**.
- În cloud, același cont are în acest moment doar **19 lecții** și **0 probleme** salvate; toate cele 19 au fost adăugate în aproximativ 4 secunde la pornirea sincronizării.
- Catalogul actual conține **203 lecții** și **373 probleme**. Diferența de 18 probleme de pe telefon reprezintă ID-uri vechi care nu mai există în catalogul actual.
- Sincronizarea procesează fiecare element local pe rând prin `award_progress`. Astfel, recuperarea câtorva sute de elemente este foarte lentă și, mai grav, acordă din nou XP pentru fiecare element absent din cloud. Acesta este motivul pentru care XP-ul a urcat din nou de la 17.600 la 33.218.
- Restaurarea sigură, fără XP (`restore_progress`), rulează abia după terminarea tuturor apelurilor individuale; de aceea sincronizarea pare blocată și poate fi întreruptă înainte să ajungă la restaurare.

## Modificări

1. **Oprirea acordării de XP la resincronizarea istoricului**
   - Butonul „Resincronizează progresul” și recuperarea automată a unei copii locale vor folosi direct restaurarea fără XP.
   - `award_progress` rămâne doar pentru finalizarea reală a unui item nou, nu pentru refacerea istoricului unui dispozitiv.

2. **Restaurare rapidă în loturi**
   - Trimiterea celor sute de elemente se face în loturi, nu prin câte un apel pentru fiecare item.
   - Funcția de restaurare acceptă atât lecții, cât și probleme în formatul folosit local și actualizează doar scorul maxim.
   - ID-urile vechi sunt ignorate explicit și raportate, fără să blocheze restul sincronizării.

3. **Raport de sincronizare corect**
   - Interfața va afișa separat: elemente locale, restaurate, deja existente și ID-uri vechi ignorate.
   - Nu va mai raporta toate elementele locale ca „trimise” dacă restaurarea nu s-a încheiat.
   - Butonul se finalizează numai după recitirea și confirmarea datelor din cloud.

4. **Repararea contului `dcflorescu2003@gmail.com`**
   - Restaurăm în cloud cele **203 lecții** și cele **373 probleme actuale** indicate de copia telefonului, fără XP suplimentar.
   - Revenim cu XP-ul la **17.600**, valoarea stabilită înainte ca sincronizarea defectă să-l acorde din nou.
   - Cele 18 probleme vechi rămân doar în raport ca ID-uri ieșite din catalog și nu influențează numărătoarea curentă.

5. **Verificare**
   - Confirmăm în baza de date exact 203 lecții + 373 probleme pentru cont.
   - Verificăm după refresh că browserul și telefonul afișează aceleași contoare și 17.600 XP.
   - Testăm o lecție nouă separat pentru a confirma că XP se acordă o singură dată prin fluxul normal.

## Detalii tehnice

- `src/hooks/useProgress.ts`: separarea restaurării istorice de acordarea XP, lotizare, rezultat verificat după push și raport fidel.
- Migrare backend: întărirea `restore_progress(jsonb)` pentru restaurare idempotentă și raport cu `restored`, `existing`, `skipped`, `unknown_ids`; fără modificarea XP-ului.
- Corecție controlată a datelor contului după ce noul flux este disponibil, pentru a evita o nouă creștere automată.