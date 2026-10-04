# Plan: secțiune „Cine a construit PyRo" în pagina Despre

## Summary
Adăugăm pe pagina publică „Despre" informația că PyRo este construit de Cosmin Florescu, profesor de informatică la Colegiul Național „Cantemir Vodă", autor al manualelor de informatică de clasa a IX-a de la Editura Litera, cu link către https://edulit.ro/collections/informatica.

## Ce se modifică
O singură pagină: `src/pages/web/AboutPage.tsx`.

### 1. Secțiune nouă „Cine a construit PyRo"
- Loc: imediat după secțiunea „De ce am construit PyRo" (înainte de „Facilități elevi").
- Aspect: fundal simplu, cu chenar, în continuarea stilului existent (fără carduri noi sau componente noi).
- Text (română):
  - Titlu: „Cine a construit PyRo"
  - Paragraf: „PyRo este construit de **Cosmin Florescu**, profesor de informatică la **Colegiul Național „Cantemir Vodă"** din București și autor al manualelor de informatică pentru clasa a IX-a publicate la **Editura Litera**."
  - Paragraf scurt: „Manualele pot fi consultate gratuit, în format digital, pe site-ul editurii."
  - Buton outline: „Manualele la Editura Litera" → `https://edulit.ro/collections/informatica` (deschis în filă nouă, `rel="noopener noreferrer"`, cu pictogramă de link extern).

### 2. Date structurate și descrierea paginii
- În blocul JSON-LD deja existent pe pagină adăugăm autorul ca `founder` (persoană: Cosmin Florescu, profesor de informatică, Colegiul Național „Cantemir Vodă", cu link către colecția de manuale).
- La descrierea meta și `og:description` adăugăm scurt: „Proiect construit de Cosmin Florescu, profesor de informatică și autor de manuale pentru clasa a IX-a."

Acestea susțin și examinarea AdSense (E-E-A-T: conținut semnat de o persoană reală, cu experiență verificabilă).

## Tehnic
- Doar editare de text și markup în `src/pages/web/AboutPage.tsx`; se folosește `Button asChild` + `Link` existent, `ExternalLink` din lucide-react.
- Nimic pe backend, nicio migrație, nicio schimbare în aplicația autentificată.
- Nu e necesar bump de versiune: e o pagină web, nu cod din aplicația mobilă.
- Verificare: `typecheck` + o încărcare a paginii `/about` în browser, cu captură de ecran a noii secțiuni.
- La final: publicare pe https://pyroskill.info (și www), ca să ajungă și în fața Google / AdSense.

## Opțional (nu fac dacă nu confirmi)
- Un rând în footer: „Proiect: Cosmin Florescu" (footer are deja contactul tău).
