# Remediere respingeri AdSense: „Conținut cu valoare scăzută"

## Context
Google a respins cererea AdSense pentru pyroskill.info cu motivul „Conținut cu valoare scăzută": paginile publice sunt considerate prea sărace. Acest lucru blochează și accesul la H5 Games Ads (reclamele rewarded pe web pentru inimi).

Diagnosticul nostru (verificat în cod):
- Landing page-ul public are ~130 de linii: un titlu, un paragraf și 6 cartonașe scurte — prea puțin text unic.
- Pagina „Despre" și indexurile de tutoriale sunt la fel de sumare.
- Restul aplicației e în spatele autentificării, deci Google vede doar aceste pagini.
- Sitemap-ul are 22 de URL-uri — bine, dar majoritatea duc la pagini cu conținut subțire.

## Plan de remediere

### 1. Îmbogățim pagina principală publică (LandingPage)
Adăugăm secțiuni de text real, în română, unic (nu copy-paste din alte site-uri):
- „Cum funcționează" — 3-4 pași explicați pe îndelete (cont → lecții → XP → clasamente).
- „Ce înveți" — prezentarea celor 6 capitole din programa de clasa a IX-a, cu 2-3 fraze fiecare (variabile, condiții, bucle, liste, funcții etc.).
- „Pentru elevi" și „Pentru profesori" — câte un paragraf de 4-6 fraze, nu doar cartonașe.
- Întrebări frecvente (FAQ): 5-6 întrebări/răspunsuri reale (e gratuit? ce clasă acoperă? am nevoie de instalare? cum intru în clasă? etc.).

### 2. Îmbogățim pagina „Despre"
- Povestea proiectului, cine l-a făcut și de ce, cum se aliniază la programa școlară — câteva paragrafe complete.

### 3. Îmbogățim paginile de tutoriale
- Pe indexurile de tutoriale (elevi/profesori): un paragraf introductiv real peste lista de carduri.
- Verificăm că fiecare tutorial are conținut suficient (paragrafe, nu doar titluri); completăm unde e subțire.

### 4. SEO de bază
- Verificăm că fiecare pagină publică are titlu și descriere meta proprii (există deja `useSeoHead`).
- Regenerăm sitemap-ul dacă apar pagini noi (`scripts/generate-sitemap.mjs`).

### 5. Republicare și reexaminare
- Publicăm site-ul actualizat, așteptăm câteva zile ca Google să recrawleze, apoi bifăm „Confirm faptul că am remediat problemele" și apăsăm „Solicitați o examinare" în AdSense.

## Ce NU facem
- Nu umplem paginile cu text artificial doar pentru motorul de căutare (Google penalizează asta).
- Nu atingem aplicația autentificată, backend-ul sau reclamele existente.
- Nu garantăm aprobarea — decizia finală e a Google; dar conținutul mai bogat e singura cale de a rezolva motivul indicat.

## Notă
Dacă a doua examinare eșuează tot pe „valoare scăzută", pasul următor ar fi o secțiune de articole/lecții publice complete (conținut educațional real, indexabil), dar propunem să începem cu pasul de mai sus, care e mai rapid.
