# Editor Python formatat ca în PyCharm

## Obiectiv
Înlocuim câmpul simplu în care elevii scriu cod cu un editor Python modern, cu aspect și comportament apropiate de PyCharm, în toate problemele și testele.

## Modificări
1. **Evidențiere Python în timp real**
   - cuvinte-cheie, funcții, numere, șiruri de caractere și comentarii colorate distinct;
   - numere de linie și evidențierea liniei curente;
   - paranteze pereche și ghidaje vizuale pentru indentare.

2. **Scriere mai comodă și corectă**
   - păstrăm indentarea Python la 4 spații și comportamentul existent al tastei Tab;
   - adăugăm indentare automată după `:` și închidere automată pentru paranteze și ghilimele;
   - păstrăm lipirea permisă în editorul de cod din teste și dezactivăm corectorul/autocapitalizarea telefonului.

3. **Aplicare uniformă**
   - folosim același editor în problemele individuale, problemele din lecții și itemii de cod din teste;
   - răspunsurile, salvarea automată a testului, rularea codului și corectarea rămân neschimbate.

4. **Compatibilitate mobilă și accesibilitate**
   - editorul rămâne utilizabil pe ecrane mici, cu derulare orizontală pentru liniile lungi;
   - dimensiuni tactile potrivite și temă în acord cu aspectul întunecat PyRo;
   - starea blocată după trimitere/rulare rămâne disponibilă.

5. **Verificare**
   - testăm scrierea, Tab, Enter după `:`, selectarea și lipirea pe desktop și mobil;
   - verificăm o problemă normală, o problemă din lecție și un item de cod dintr-un test;
   - confirmăm că autosalvarea, reluarea testului și rularea Pyodide primesc exact textul introdus.

## Detalii tehnice
Vom folosi CodeMirror 6 cu extensia Python, încărcat doar în paginile care au nevoie de editor. Componenta comună `CodeEditor` își păstrează interfața actuală, astfel încât logica existentă pentru progres, teste și evaluare să nu fie rescrisă. Culorile editorului vor folosi tema PyRo, inspirată de PyCharm, nu o copie rigidă a interfeței din imagine.

## În afara scopului
Nu modificăm regulile testelor, cazurile de test, punctajul, soluțiile, baza de date sau editorii folosiți de profesori/admini pentru creare de conținut.
