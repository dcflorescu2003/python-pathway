## Obiectiv

Uniformizez cele ~1500 de licee din `src/data/schools.ts` astfel încât toate să aibă același stil vizual când apar în selectoare (elev la onboarding, profesor la wizard, căutare etc.).

## Probleme actuale

Rulând pe date reale găsesc inconsistențe majore:
- **Majuscule**: aproape tot fișierul e ALL CAPS ("COLEGIUL NAȚIONAL...").
- **Ghilimele mixte**: `\"...\"`, `„..."`, `'...'`, `’...’` — 4 stiluri diferite.
- **Diacritice vechi**: `ş/ţ` (cu sedilă) amestecate cu `ș/ț` (cu virgulă) — mai ales în câmpul `city` (ex: "Iaşi", "Bucureşti", "Ploieşti").
- **Prefixe redundante în nume**: `MUNICIPIUL X`, `ORAȘUL X`, `COMUNA X` la sfârșit.
- **Virgule inconsistente** înainte de localitate: uneori cu virgulă, uneori fără.
- **Orașe ciudate**: câteva intrări au `city` greșit (ex. "Gheaba" pentru un colegiu din Măneciu) — le las neatinse, doar normalizez format.

## Ce fac

Rescriu `src/data/schools.ts` printr-un script one-shot care aplică următoarele reguli, păstrând **id-urile neschimbate** (ca să nu invalidez `profiles.school_id` existent în DB):

### Reguli pentru `name`
1. **Title Case românesc**: fiecare cuvânt cu inițială majusculă, cu excepția cuvintelor de legătură scurte (`de`, `din`, `și`, `cu`, `pe`, `la`, `a`, `al`, `ale`, `ai`) când nu sunt primul cuvânt.
2. **Ghilimele unificate** la stilul românesc `„...”` pentru numele proprii (Colegiul Național „Spiru Haret").
3. **Diacritice moderne** peste tot: `ș`, `ț` (nu `ş`, `ţ`); `Ș`, `Ț`.
4. **Curăț prefixele administrative** redundante de la coadă: `, MUNICIPIUL X` / `, ORAȘUL X` / `, COMUNA X` / `, SATUL X` — le elimin dacă `X` apare deja evident, altfel păstrez doar numele localității fără prefix.
5. **Elimin virgula finală** înainte de localitate când e trivial (păstrez spațiu simplu).
6. **Abrevieri păstrate uppercase**: `UTCB`, `USV`, `UCECOM`, `CFR`, `IT`, `TIC`, `PROF. UNIV. DR.` normalizat cu puncte și spații.

### Reguli pentru `city`
1. Diacritice moderne (`Iași`, `București`, `Ploiești`, `Bușteni`, `Mediaș`, `Constanța`, `Galați`, `Târgu Mureș`, `Petroșani`, `Făgăraș` etc.).
2. Sectoarele Bucureștiului: format uniform `București, Sector N`.
3. Title Case standard, fără prefixe (`Municipiul`, `Orașul`, `Comuna` scoase).

### Actualizări colaterale
- `filterAndSortSchools` deja normalizează pentru căutare (diacritic-insensitive), deci nu necesită modificări.
- Regex-ul `isBucharestSchool` (`/bucure/i`) continuă să funcționeze după normalizare.
- Nu ating baza de date — `profiles.school_id` folosește id-uri (`lic1`...`lic1500`) care rămân identice.

## Ce NU fac (dacă nu confirmi)

- Nu corectez erori factuale (city greșit tip "Gheaba" pentru Măneciu) — doar format.
- Nu adaug/șterg licee.
- Nu schimb `id`-urile.

## Detalii tehnice

Fișierul are 1530 linii. Voi rula un script Node local care parsează array-ul, aplică transformările și rescrie fișierul cu formatare Prettier-compatibilă (câte un obiect pe linie, la fel ca acum). Verific apoi cu `tsgo` că build-ul trece și că `filterAndSortSchools` încă returnează Bucureștiul primul într-un test rapid.

## Fișiere modificate

- `src/data/schools.ts` — rescris integral cu date normalizate (id-uri păstrate).
