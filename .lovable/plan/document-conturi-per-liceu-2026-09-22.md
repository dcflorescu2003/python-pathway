# Document: conturi per liceu

Generăm un document (fișier descărcabil) cu numărul de conturi pe fiecare liceu.

## Conținut

Un tabel ordonat descrescător după total conturi, doar liceele cu **cel puțin 3 conturi** (am verificat: sunt 23 de licee care se califică), cu coloanele:

- Liceu (nume + oraș, din catalogul de licee)
- Conturi elevi
- Conturi profesori
- Total conturi

Conturile fără liceu sau marcate „skipped" se omit (sunt conturi care nu au ales liceul).

## Detalii tehnice

- Sursa: tabelul `profiles` (`school_id`, `is_teacher`), grupat pe liceu, cu filtrul `count(*) >= 3`.
- Numele liceelor se rezolvă din catalogul existent `src/data/schools` (school_id = `lic...`).
- Rezultatul se salvează ca document în Fișiere (format Markdown; pot adăuga și Excel dacă vrei).
- Fără modificări în aplicație sau bază de date — este doar un raport.
