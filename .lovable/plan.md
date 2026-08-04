# Optimizare cost la corectarea AI (grupare pe probleme)

## Stare curentă
Gruparea cerută există deja în `grade-submission`: itemii trimiși spre AI sunt grupați după problemă (titlu + soluție) sau după textul întrebării, contextul (enunț, soluție de referință, cazuri de test trunchiate la max. 3) apare o singură dată per grup, iar răspunsurile elevilor sunt listate la finalul grupului, fiecare cu ID-ul și punctajul maxim. Se face un singur apel AI per submisie.

## Ce mai optimizăm
1. **Un singur apel pentru toată clasa, nu per submisie** — momentan fiecare submisie corectată declanșează un apel separat, deci enunțul și testele se retrimit pentru fiecare elev. Se adaugă un mod „batch pe test”: când corectarea e declanșată pentru mai multe submisii ale aceluiași test (renotare în masă / închiderea testului), itemii tuturor elevilor intră în aceleași grupuri, deci contextul se trimite o singură dată pentru toată clasa.
2. **Deduplicare răspunsuri identice** — răspunsurile identice (după normalizare: spații, indentare) primesc un singur bloc în prompt și același scor/feedback se copiază pe toate ID-urile.
3. **Ieșire strict JSON** — se cere `response_format: json_object` cu un array sub o cheie fixă, ca să dispară textul de ambalaj și parsarea prin regex.
4. **Prompt mai scurt** — instrucțiunile de sistem se scurtează, iar limitele de trunchiere se coboară (soluție 800 caractere, cod elev 900, enunț 600), păstrând suficient context pentru notare.
5. **Model mai ieftin pentru itemi simpli** — răspunsurile deschise scurte (sub ~300 caractere) merg pe `google/gemini-2.5-flash-lite`, codul rămâne pe `google/gemini-2.5-flash`.

## Detalii tehnice
- Fișier: `supabase/functions/grade-submission/index.ts`.
- `batchAIReview` primește opțional un `sharedContextKey` deja calculat și returnează rezultate pe ID; dedup-ul se face înainte de construirea promptului, iar maparea invers (bloc → lista de answerIds) se aplică la scriere.
- Se păstrează limita existentă `MAX_AI_ITEMS_PER_TEST = 4` per test și fallback-ul curent (dacă AI-ul eșuează, itemii rămân pentru corectare manuală, fără scor eronat).
- Se adaugă log cu numărul de grupuri, numărul de răspunsuri și lungimea promptului, ca să se poată verifica economia în logurile funcției.
- După modificări, funcția se redeployează și se rulează o corectare reală pentru verificare.
