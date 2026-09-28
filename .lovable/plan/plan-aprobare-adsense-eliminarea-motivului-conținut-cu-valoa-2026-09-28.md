# Plan: aprobare AdSense — eliminarea motivului „Conținut cu valoare scăzută"

## Diagnostic

Prima remediere (text mai bogat pe Landing, Despre, indexuri tutoriale) nu a fost suficientă. Cauza principală: site-ul public are doar ~22 de pagini, majoritatea pagini de prezentare/tutoriale despre aplicație — Google vede puțin conținut educațional real, original. Singura cale dovedită: **conținut educațional real, public, indexabil** (exact pasul de rezervă notat în planul anterior).

## Ce construim

### 1. Secțiune publică „Învață Python" — lecții gratuite, fără cont
- Publicăm teoria capitolelor (conținutul din `chapterTheory.ts`, deja scris de noi, original) ca pagini web publice: `/invata/:chapterSlug`.
- 6 pagini (câte una pe capitol: variabile, condiții, bucle, liste, funcții etc.), fiecare cu text complet, exemple de cod formatat și exerciții explicate.
- Pagină index `/invata` cu prezentarea fiecărui capitol.
- Fiecare pagină: titlu și descriere meta proprii (`useSeoHead`), linkuri interne către celelalte capitole și către pagina de înregistrare.

### 2. Lecțiile de manual publice devin indexabile
- Există deja ruta publică `/manual/:lessonId`; adăugăm o pagină index publică `/manual` care listează lecțiile publice, cu titlu/meta proprii, și o includem în sitemap doar dacă conținutul e substanțial.

### 3. Întărim paginile existente
- Landing: adăugăm o secțiune „Începe gratuit cu prima lecție" care leagă de `/invata`.
- Verificăm ca fiecare tutorial (15 pagini) să aibă minim câteva paragrafe de text real, nu doar capturi de ecran.

### 4. SEO tehnic
- Regenerăm `public/sitemap.xml` cu noile pagini (`scripts/generate-sitemap.mjs`).
- Verificăm `robots.txt` (permite crawl pe rutele noi) și că paginile nu cer autentificare.

### 5. Publicare și reexaminare
- Publicăm pe pyroskill.info, trimitem sitemap-ul în Search Console, așteptăm recrawl (câteva zile), apoi „Solicitați o examinare" în AdSense.

## Ce NU facem
- Nu generăm text artificial/umplutură — folosim conținutul educațional real deja scris pentru aplicație.
- Nu atingem aplicația autentificată, backend-ul, reclamele sau consimțământul cookie existent.
- Nu garantăm aprobarea (decizia e a Google), dar aceasta e remedierea directă a motivului comunicat.

## Fișiere
- `src/pages/web/LearnIndexPage.tsx`, `src/pages/web/LearnChapterPage.tsx` — noi
- `src/App.tsx` — rute publice noi
- `src/data/chapterTheory.ts` — reutilizat (doar citire)
- `src/pages/web/LandingPage.tsx` — secțiune de legătură
- `public/sitemap.xml`, `scripts/generate-sitemap.mjs` — actualizate

## Verificare
- Typecheck + testare browser: paginile `/invata` se deschid fără cont, cu conținut complet și meta corecte; sitemap-ul include noile URL-uri.
