# Sitemap „nu a putut fi preluat" — verificare și refacere curată

## Ce am verificat acum, live

- `https://pyroskill.info/sitemap.xml` răspunde **200**, `content-type: text/xml; charset=utf-8`, fără redirect.
- Răspunde identic și cu User-Agent Googlebot (deci nu e blocat de Cloudflare).
- Fișierul începe direct cu `<?x` — fără BOM, fără spații înainte de declarația XML.
- Dimensiune 3.361 bytes, 23 URL-uri — mult sub limitele Google (50.000 URL / 50 MB).
- Toate URL-urile testate (`/`, `/about`, `/tutoriale/elevi`, `/support`, `/privacy-policy`, `/tutoriale/profesori/notare-ai`) răspund 200, fără redirect.
- `robots.txt` răspunde 200 și conține linia `Sitemap:`.

Concluzie: fișierul respectă regulile din protocolul sitemaps.org și e accesibil public. Search Console raportează „nu s-a putut prelua" fără un motiv explicit — API-ul GSC nu a putut fi citit în acest moment, deci nu pot confirma dacă eroarea e actuală sau rămasă din perioada avertismentului de securitate „Pagini înșelătoare".

## Ce propun să facem

### 1. Citirea stării reale din Search Console
Interoghez direct API-ul Search Console pentru intrarea `/sitemap.xml`: ultima dată de citire, numărul de erori/avertismente și tipul raportat. Asta ne spune dacă eroarea e din trecut (cache vechi în interfață) sau se repetă acum.

### 2. Refacerea sitemap-ului în forma cea mai „conservatoare" posibil
Chiar dacă e valid, îl regenerez într-o formă la care Google nu poate obiecta deloc:

- Scot `<changefreq>` și `<priority>` — Google le ignoră complet din 2023 și sunt cea mai frecventă sursă de zgomot inutil.
- Păstrez doar `<loc>` pentru fiecare pagină publică, cu URL-uri absolute, complet codificate, toate pe `https://pyroskill.info` (același domeniu ca proprietatea).
- Fără `<lastmod>` — nu avem o dată reală, per pagină, a ultimei modificări de conținut, iar o dată inventată (data build-ului) e un semnal fals pe care Google îl penalizează prin ignorarea completă a câmpului.
- Fișier fără BOM, encoding UTF-8, terminat cu newline.

Sursa rămâne generatorul existent `scripts/generate-sitemap.mjs` (rulează la `predev`/`prebuild`) — nu schimb mecanismul, doar conținutul generat. Duplicatul `scripts/generate-sitemap.ts`, care nu e folosit de nimeni și poate deruta la editări viitoare, îl șterg.

### 3. Retrimiterea curată în Search Console
După publicare: șterg intrarea `/sitemap.xml` din proprietate și o retrimit, ca Google să reia procesarea de la zero în loc să reafișeze un rezultat vechi eșuat. Apoi recitesc statusul și îți raportez ce spune.

## Detalii tehnice

- `scripts/generate-sitemap.mjs`: se elimină câmpurile `changefreq` și `priority` din `entries` și din funcția de serializare; lista de rute rămâne aceeași (7 pagini principale + 7 tutoriale elevi + 8 tutoriale profesori).
- `public/sitemap.xml`: regenerat cu noul format.
- `scripts/generate-sitemap.ts`: șters (duplicat nefolosit).
- `public/robots.txt`: neschimbat — e deja corect.
- Fără modificări de backend, bază de date sau logică de aplicație.

## Notă onestă

Dacă după retrimitere Google raportează în continuare eroare pe un fișier care demonstrabil răspunde 200 și e valid, cauza e de partea Google (crawler care nu a mai trecut de la ridicarea avertismentului de securitate) și singura acțiune rămasă e așteptarea — de obicei câteva zile. Nu are rost să modificăm repetat fișierul în acel caz.
