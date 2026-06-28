Adaug în `src/components/web/TutorialArticleView.tsx`, deasupra (sau imediat sub) CTA-ul "Gata să încerci?", o secțiune de navigare între articolele din aceeași categorie (Elevi sau Profesori).

## Comportament

- Determin indexul articolului curent în `articles`.
- Calculez `prev` și `next` (fără wrap; dacă nu există, slotul rămâne gol).
- Afișez două carduri-link pe rândul de jos:
  - Stânga: "← Articolul anterior" + titlul prev
  - Dreapta: "Articolul următor →" + titlul next
- Pe mobil: stivuite vertical; pe desktop: grid 2 coloane.
- Folosesc `<Link to={`${basePath}/${slug}`}>` cu stiluri consistente (border, bg-card, hover ușor, text-primary pentru titlu).
- Dacă lipsește unul dintre ele, slotul gol păstrează grid-ul (sau e omis pe mobil).
- La click se face scroll-to-top (`window.scrollTo(0,0)` în onClick) ca să nu rămână în jos pe noul articol.

Se aplică automat și pentru elevi și pentru profesori, fiindcă ambele rute folosesc același component.

## Detalii tehnice

- Un singur fișier modificat: `TutorialArticleView.tsx`.
- Iconițe `ArrowLeft` / `ArrowRight` din lucide-react (ArrowLeft e deja importat).
- Fără modificări de date sau rute.
