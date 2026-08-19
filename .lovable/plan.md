# Pagina principală indexabilă: landing public pentru vizitatorii nelogați

## Cauza confirmată

Testul live din Search Console spune „s-a detectat regula «noindex»” pentru `https://pyroskill.info/`. Motivul, verificat în cod:

- `src/pages/Index.tsx` redirecționează automat orice vizitator nelogat către `/auth` (după 1,5 secunde).
- `src/pages/AuthPage.tsx` apelează `useSeoHead({ noindex: true })`.

Googlebot intră nelogat, ajunge pe ecranul de autentificare și citește `noindex` — deci pagina principală rămâne neindexabilă, iar canonical-ul corect nu ajută cu nimic.

## Ce construim

Un **landing public** afișat pe `/` doar pentru vizitatorii nelogați. Utilizatorii logați văd exact același tablou de bord ca acum, fără nicio schimbare de comportament.

Conținutul landing-ului (în română, în stilul paginilor web existente — `WebLayout`, `FeatureCard`, temă dark cu accente verzi):

- Hero: logo PyRo, un `<h1>` („Învață Python pas cu pas, exersând”), subtitlu scurt și butoane „Creează cont gratuit” (spre `/auth`) și „Vezi cum funcționează” (spre `/about`).
- Secțiune scurtă „Pentru elevi” și „Pentru profesori” — 3 carduri fiecare, reformulate din conținutul existent din `AboutPage`, fără afirmații noi.
- Legături spre `/about`, `/tutoriale/elevi`, `/tutoriale/profesori` (link-uri interne care ajută indexarea).
- CTA de descărcare a aplicației (`AppDownloadCTA`), la fel ca pe celelalte pagini publice.
- Footer-ul web standard, cu link-uri spre Suport, Confidențialitate și Termeni.

## Modificări tehnice

- `src/pages/Index.tsx`: se elimină redirectul automat spre `/auth` pentru vizitatorii nelogați; când `!user` după încărcarea sesiunii, se randează noua componentă publică. Restul logicii de dashboard (XP, capitole, dialoguri) rămâne intactă și rulează doar pentru utilizatorii logați.
- `src/pages/web/LandingPage.tsx` (nou): conținutul public descris mai sus, cu `useSeoHead({ title, description, canonicalPath: "/" })` — deci pe `/` rămâne un singur canonical corect și niciun `noindex`.
- În aplicația nativă (Capacitor) comportamentul rămâne cel de azi: dacă nu există sesiune, se merge direct la ecranul de autentificare — landing-ul e doar pentru web.
- `AuthPage` păstrează `noindex`, corect, pentru că acum se afișează doar pe `/auth`.
- Fără modificări de backend, de bază de date sau de logică de progres.

## Verificare după implementare

1. Verific în preview că `/` nelogat afișează landing-ul, are un `<h1>`, un singur `<link rel="canonical" href="https://pyroskill.info/">` și **niciun** `<meta name="robots" content="noindex">`.
2. Verific că `/` logat arată tabloul de bord exact ca înainte, iar `/auth` păstrează `noindex`.
3. După publicare: reiei „Inspectează URL” → „Testează adresa URL live” în Search Console și apoi „Solicită indexarea”. Sitemap-ul e deja retrimis.
