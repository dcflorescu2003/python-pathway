# Rezolvare avertisment „Pagini înșelătoare” (Google Safe Browsing)

Google a marcat pyroskill.info la categoria *Social engineering / Pagini înșelătoare*, fără URL specific („nu e cazul”), deci flagul e la nivel de site. Nu există fișiere de descărcat pe site, doar linkuri către Play Store și App Store — deci cauza probabilă ține de comportamentul paginii, nu de conținut malițios.

## Ce verificăm și corectăm

### 1. Redirect automat către altă schemă (suspectul principal)

`index.html` conține un script inline care, pe ORICE URL de pe domeniu care are parametri `access_token` / `refresh_token` / `code`, face `window.location.replace()` către `intent://auth?...#Intent;scheme=pyro;package=ro.pythonpathway.app;end`.

Redirectul automat cross-scheme, executat înainte de randarea aplicației, este un tipar clasic pe care Safe Browsing îl clasifică drept înșelător.

Corecție:

- Restrângem scriptul astfel încât să ruleze doar pe ruta `/auth` (nu pe rădăcină sau orice altă pagină).
- Înlocuim redirectul automat cu o pagină intermediară vizibilă: un mesaj scurt „Te ducem înapoi în aplicația PyRo” + buton explicit de continuare, cu fallback automat doar după interacțiune sau cu delay și text vizibil.
- Redirectul nu se declanșează niciodată pentru user-agenți fără parametrul `state` de tip `native:` (deja e cazul, dar îl validăm strict).

### 2. Identitate clară a site-ului pentru un vizitator nelogat

Rădăcina `/` servește direct dashboard-ul aplicației / ecranul de autentificare. O pagină care cere email și parolă, cu butoane „Continuă cu Google” / „Continuă cu Apple”, fără branding și context clar, poate fi interpretată drept pagină de phishing.

Corecție:

- Pe `/auth` adăugăm antet clar cu logo PyRo, numele complet al serviciului, o frază despre ce este PyRo și linkuri vizibile către Termeni, Confidențialitate și Suport.
- Butoanele sociale primesc text explicit („Autentificare cu contul Google”), fără logo-uri Google/Apple folosite în mod care sugerează că pagina aparține acestora.
- Ne asigurăm că pagina de autentificare nu apare ca fereastră izolată fără navigație către site-ul public.

### 3. Transparență despre proprietar

Adăugăm în footer-ul web (și pe `/support`) date de contact vizibile: nume operator, email de contact, link către politica de confidențialitate. Lipsa acestor informații pe un site care colectează credențiale crește riscul de clasificare drept înșelător.

### 4. Verificarea linkurilor externe

Confirmăm că singurele linkuri externe sunt cele oficiale către Play Store (`ro.pythonpathway.app`) și App Store (`id6762510941`) și că sunt etichetate clar, cu `rel="noopener noreferrer"`.

### 5. Solicitarea reexaminării

După publicare:

- Verificăm live paginile modificate.
- Din Search Console → Probleme de securitate → „Solicită o examinare”, cu descrierea corecțiilor (redirect automat eliminat, identitate și date de contact clarificate). Această acțiune trebuie făcută de tine din contul Google; îți pregătesc textul de trimis.

## Detalii tehnice

- `index.html`: scriptul inline de bootstrap OAuth se restrânge pe path `/auth` și devine non-automat.
- `src/pages/AuthPage.tsx`: antet de brand, descriere, linkuri legale, etichete explicite pe butoanele sociale.
- `src/components/web/WebFooter.tsx`: bloc de contact/operator.
- `src/components/web/AppDownloadCTA.tsx`: atribute `rel` pe linkurile către magazine.
- Fără modificări de backend, RLS sau logică de business.

## Notă

Google nu comunică regula exactă declanșată. Planul elimină toate tiparele cunoscute care produc această clasificare; verdictul final vine după reexaminarea manuală (de obicei câteva zile).  
  
Vreau sa te asiguri ca aceste modificari nu afecteaza functionalitatea siteului si in mod deosebit a aplicatiilor de mobil