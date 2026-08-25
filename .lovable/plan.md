# Punctaj parțial mai bun la corectarea AI a problemelor de cod

## Ce se întâmplă acum
Corectarea AI trimite codul elevului plus soluția de referință și cere un singur număr ("score"), fără criterii. Modelul dă de obicei ori punctaj maxim, ori aproape zero, iar scorul se rotunjește la număr întreg — deci logica parțial corectă rămâne nepunctată. Fallback-ul fără AI dă doar un punctaj „structural" generic (max 50%).

## Ce schimbăm

### 1. Barem explicit pe criterii
AI-ul va nota fiecare cod după un barem fix, cu ponderi din punctajul maxim al itemului:
- Citire/declarare corectă a datelor de intrare și a variabilelor necesare — 20%
- Structuri de control și algoritm (bucle, condiții, formule) corecte — 35%
- Prelucrarea corectă a cazurilor din enunț (inclusiv cazuri limită) — 25%
- Afișarea rezultatului în formatul cerut (print, mesaj, ordine) — 15%
- Cod care rulează fără erori de sintaxă — 5%

Un program greșit ca rezultat final, dar cu elemente corecte, primește suma criteriilor îndeplinite, nu 0.

### 2. Răspuns AI structurat
Modelul returnează pentru fiecare cod un obiect cu punctajul pe fiecare criteriu (`intrare`, `algoritm`, `cazuri`, `afisare`, `sintaxa`) plus feedback scurt. Scorul final = suma criteriilor, limitat la punctajul maxim. Astfel notarea devine reproductibilă și verificabilă, nu o singură cifră „din burtă".

### 3. Punctaj parțial cu jumătăți de punct
Rotunjirea la 0,5 puncte (în loc de întreg), ca diferențele de calitate să nu dispară la itemii de 1-2 puncte.

### 4. Feedback pe criterii pentru elev și profesor
Feedback-ul salvat va arăta scurt ce a luat și ce a pierdut, ex.: „Variabile OK, buclă corectă; lipsește tratarea listei goale; afișare fără formatul cerut. 3,5/5".

### 5. Fallback fără AI mai echitabil
Când AI-ul nu răspunde, punctajul structural se recalibrează pe aceleași criterii detectabile static (input/variabile, buclă/condiție, print), cu plafon 50% și mesaj clar că necesită verificare manuală.

## Detalii tehnice
- Fișier: `supabase/functions/grade-submission/index.ts` — funcțiile `batchAIReview` (prompt + parsare) și `basicCodeReview` (fallback).
- Promptul păstrează gruparea pe probleme și deduplicarea răspunsurilor identice (economie de tokeni); se adaugă doar baremul, o dată per cerere.
- Parsarea: `{"results":[{"id","criterii":{...},"score","feedback"}]}`; dacă lipsesc criteriile, se folosește `score` ca acum (compatibilitate).
- Se păstrează regula existentă: scorul AI nu poate coborî sub punctajul de bază calculat automat, și limita de itemi AI per test.
- Se păstrează modelul curent (`google/gemini-2.5-flash` pentru cod).
- Verificare: redeploy al funcției și o renotare reală pe o submisie cu cod parțial corect, cu citirea logurilor.
