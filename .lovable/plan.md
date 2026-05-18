## Modificări

### 1. Buton „Înapoi la Tutoriale Elevi/Profesori" mai vizibil

În `src/components/web/TutorialArticleView.tsx` — transformă link-ul subtil (text muted) într-un buton vizibil:
- Stilizare ca buton cu border + bg-card, padding mai mare, icon mai mare
- text-base (în loc de text-sm), font-medium
- hover state cu bg-primary/10 și border-primary
- Aplicat atât în starea „articol negăsit" cât și în header-ul articolului

### 2. Eliminare „Duolingo"

Înlocuiri (păstrând tonul):
- `src/pages/web/AboutPage.tsx:24` — „Lecții în stil Duolingo" → „Lecții interactive scurte"
- `src/pages/web/AboutPage.tsx:47` (meta description) — „în stil Duolingo" → „prin lecții interactive"
- `src/pages/web/AboutPage.tsx:93` — „platformă educațională în stil Duolingo" → „platformă educațională cu lecții interactive scurte"
- `src/data/tutorials/students.ts:45` — „lecții scurte, în stil Duolingo" → „lecții scurte și interactive"
- `src/components/web/WebFooter.tsx:11` — „pas cu pas, în stil Duolingo" → „pas cu pas, prin lecții practice"

Doar text + stilizare frontend, fără logică.