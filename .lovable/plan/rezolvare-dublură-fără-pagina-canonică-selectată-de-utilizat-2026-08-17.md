# Rezolvare „Dublură fără pagina canonică selectată de utilizator”

Search Console raportează pagini neindexate cu motivul *Dublură fără pagina canonică selectată de utilizator*, sursa „Site”.

## Ce am verificat

- `https://www.pyroskill.info/` și `https://pyro-learn.lovable.app/` fac deja redirect 302 către `https://pyroskill.info/` — deci nu duplicatele de domeniu sunt problema principală.
- `index.html` **nu conține niciun `<link rel="canonical">`**. Toate rutele servesc același HTML inițial, cu același `<title>` și aceeași descriere.
- Canonical există doar prin Helmet pe: `/about`, `/tutoriale/elevi`, `/tutoriale/profesori` și articolele de tutorial.
- Nu au canonical și nici titlu/descriere proprii: `/` (homepage), `/support`, `/privacy-policy`, `/terms-of-use`.

Fără canonical, Google vede mai multe URL-uri cu conținut HTML identic la crawl și alege singur o pagină reprezentativă, restul rămân „dublură”.

## Ce corectăm

1. **Canonical implicit în `index.html`** — `<link rel="canonical" href="https://pyroskill.info/" />` plus `<meta property="og:url" content="https://pyroskill.info/" />`, ca fiecare pagină să pornească de la un canonical valid.
2. **Canonical + metadate unice pe fiecare pagină publică** prin Helmet (suprascriu valoarea din `index.html`):
   - `/` — titlu și descriere proprii, canonical `https://pyroskill.info/`
   - `/support` — „Suport PyRo”
   - `/privacy-policy` — „Politica de confidențialitate”
   - `/terms-of-use` — „Termeni de utilizare”
3. **Consistență cu sitemap-ul** — canonical-urile folosesc exact aceleași URL-uri ca în `public/sitemap.xml` (fără `www`, fără slash final în plus), ca Google să nu primească semnale contradictorii.
4. **Rutele private** (`/auth`, `/lesson/*`, `/test/*` etc.) rămân blocate din `robots.txt`, dar le adăugăm `noindex` prin Helmet acolo unde e cazul, ca să nu mai fie candidate de duplicat.

## Detalii tehnice

- `index.html`: adăugare `link rel="canonical"` și `og:url`.
- `src/pages/Index.tsx`, `src/pages/SupportPage.tsx`, `src/pages/PrivacyPolicyPage.tsx`, `src/pages/TermsOfUsePage.tsx`: bloc `<Helmet>` cu `title`, `meta description`, `link canonical`, `og:*`.
- `src/pages/AuthPage.tsx` și paginile de aplicație: `<meta name="robots" content="noindex" />`.
- Fără modificări de backend, logică de business sau comportament pe mobil (Helmet afectează doar `<head>` în web).

## După publicare

Retrimitem sitemap-ul și cerem reindexarea din Search Console. Google reprocesează în câteva zile; raportul „Indexarea paginilor” se actualizează cu întârziere.
