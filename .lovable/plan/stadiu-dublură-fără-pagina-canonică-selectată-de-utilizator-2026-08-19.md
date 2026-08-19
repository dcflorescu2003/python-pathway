# Stadiu: „Dublură fără pagina canonică selectată de utilizator”

## Ce arată verificarea de acum

- Pe site, corecția este **live**: `https://pyroskill.info/` răspunde 200 și conține exact un `<link rel="canonical" href="https://pyroskill.info/" />` plus `og:url` identic.
- `https://www.pyroskill.info/` și `https://pyro-learn.lovable.app/` fac redirect 302 către `https://pyroskill.info/` — deci nu mai există două pagini servite în paralel.
- În Search Console, însă, versiunea **stocată** de Google pentru `https://pyroskill.info` este încă veche: stare „Pagină cu redirecționare”, canonic ales de Google `https://www.pyroskill.info/`, ultima accesare cu crawler **17.08.2026**, adică din jurul momentului în care s-a publicat corecția. Google nu a mai recitit pagina de atunci.
- Proprietatea verificată acoperă doar `https://pyroskill.info/`; varianta `www` nu este proprietate separată (inspecția ei returnează „nu deții acest site”).

Concluzie: da, cauza din cod este rezolvată, dar raportul din Search Console reflectă în continuare crawl-ul vechi. Nu am dovezi că mai există o problemă actuală pe site.

## Ce propun mai departe

1. **Recitirea stării după un nou crawl** — verificăm din nou inspecția URL peste câteva zile; dacă starea devine „URL este pe Google” cu canonic `https://pyroskill.info/`, problema e închisă și în raport.
2. **Retrimiterea sitemap-ului** ca semnal de recrawl (o singură trimitere, fără modificări de conținut).
3. **Opțional: adăugarea proprietății `https://www.pyroskill.info/`** în Search Console (verificare META, tag-ul e deja servit pe ambele gazde datorită redirectului către același HTML). Avantaj: putem inspecta direct varianta pe care Google o considera canonică și confirmăm că vede redirectul.
4. **Solicitarea reindexării manuale** pentru pagina principală — aceasta se face doar din interfața Search Console („Inspectează URL” → „Solicită indexarea”); API-ul nu poate declanșa reindexare. Îți spun exact unde să apeși.

## Ce nu schimbăm

Nu modificăm `index.html`, `sitemap.xml`, `robots.txt` sau canonicele din pagini — sunt deja corecte și consistente între ele. Fără modificări de backend sau de comportament în aplicație.
