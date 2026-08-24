# Ordonarea liniilor în teste: amestecare aleatorie

## Ce am confirmat

În pagina de testare, exercițiul de tip „ordonează liniile" pornește de la ordinea în care liniile vin din baza de date (`TestOrderRenderer`: `answer?.order || lines.map(l => l.id)`). Deoarece în baza de date liniile sunt salvate în ordinea corectă, elevul vede de fiecare dată aranjamentul deja corect — poate trimite fără să miște nimic. În lecții (`OrderExercise`) liniile sunt amestecate la montare, deci comportamentul diferă.

Notă: funcțiile de backend care servesc itemii elevului elimină câmpul `order` din fiecare linie, dar păstrează ordinea din array — deci cheia de răspuns rămâne implicit vizibilă chiar și în rețea.

## Ce se schimbă

1. **Amestecare la server** — funcțiile care returnează itemii/exercițiile pentru elev amestecă array-ul de linii înainte de a-l trimite, astfel încât nici în răspunsul de rețea să nu apară ordinea corectă. Amestecarea este deterministă pe (încercare, item), ca la reîncărcarea paginii sau la revenire după pierderea internetului elevul să vadă aceeași aranjare, nu una nouă.

2. **Amestecare defensivă în frontend** — la prima afișare a unui item de ordonare fără răspuns salvat, ordinea iniţială se amestecă o singură dată (memorat per item, nu la fiecare randare) și se salvează imediat ca răspuns-draft. Astfel ordinea rămâne stabilă între randări, la schimbarea întrebării și după sincronizarea draftului.

3. **Garanție anti-„deja corect"** — dacă amestecarea produce exact ordinea originală (posibil la 2-3 linii), se reamestecă/rotește o dată, ca elevul să nu primească aranjamentul corect din start.

4. **Notarea rămâne neschimbată** — se face pe server prin compararea id-urilor trimise cu ordinea corectă, deci amestecarea afișării nu afectează punctajele. Verific și pagina de review de după eliberarea notelor.

## Detalii tehnice

- SQL: în `get_test_items_for_student` și `get_exercises_for_student`, construcția `lines` (`jsonb_agg(l - 'order')`) primește un `ORDER BY md5(<attempt/item seed> || l->>'id')` pentru amestecare deterministă, fără a reintroduce câmpul `order`.
- `src/pages/TakeTestPage.tsx`: în `TestOrderRenderer`, ordinea iniţială se calculează într-un `useState`/`useRef` seedat (fără `Math.random()` în corpul randării) și se propagă prin `onAnswer({ order })` într-un `useEffect` de inițializare, doar când `answer?.order` lipsește.
- Se adaugă un test unitar care verifică: (a) ordinea iniţială diferă de ordinea sursă, (b) rămâne stabilă la re-randare, (c) un draft existent nu este suprascris.
