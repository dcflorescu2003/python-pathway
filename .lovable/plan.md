# Plan: Secțiuni vizuale „Start / Build / Master" în pagina capitolului

## Obiectiv

Pe pagina unui capitol (`/chapter/:id`), lecțiile se înșiră una sub alta într-o coloană verticală. Pentru a rupe monotonia, le împărțim **doar vizual** în 3 secțiuni egale, fiecare cu un marker de început (și implicit unul de sfârșit, marcat de începutul următoarei secțiuni).

**Foarte important**: e pur decorativ. Nicio schimbare la:

- logica de deblocare / completare lecții
- ordinea sau structura datelor (`chapter.lessons`)
- progres, XP, scor, provocări de skip
- tipul de lecții sau conținut

## Cum se împart lecțiile

Pentru un capitol cu N lecții:

- **Start** → primele `ceil(N/3)` lecții
- **Build** → următoarele `ceil(N/3)` lecții
- **Master** → restul

Exemple:

- 9 lecții → 3 / 3 / 3
- 10 lecții → 4 / 4 / 2
- 7 lecții → 3 / 3 / 1
- 1–2 lecții (capitol mic) → afișăm doar marker-ul „Start" sus, fără să introducem secțiuni goale

Un mic helper `getSectionForIndex(idx, total)` returnează `"start" | "build" | "master"` și un flag `isSectionStart` pentru a ști când să inserăm separatorul.

## Designul separatorului

Înaintea primei lecții din fiecare secțiune, inserăm un „chapter divider" care se integrează în coloana verticală:

```text
        ─── ✦ ───
         START
   Primii pași în capitol
        ─── ✦ ───
            │
          ( 1 )  Lecție 1
            │
          ( 2 )  Lecție 2
            │
        ─── ✦ ───
         BUILD
    Construim mai departe
        ─── ✦ ───
            │
          ( 3 )  Lecție 3
            ...
        ─── ✦ ───
         MASTER
       Provocarea finală
        ─── ✦ ───
            │
          ( N )  Lecția finală
```

Stil:

- Bandă orizontală subțire (linie + iconiță centrată) care se întinde peste lățimea coloanei lecțiilor.
- Iconițe distincte din `lucide-react`, deja importate sau ușor de adăugat:
  - **Start** → `Sparkles` (verde primary)
  - **Build** → `Hammer` (cyan/accent)
  - **Master** → `Crown` (auriu / yellow-500)
- Etichetă cu font mono uppercase + tracking lat (consistent cu „Capitol N" din header).
- Sub etichetă, un sub-titlu scurt în `text-muted-foreground` (vezi „microcopy" mai jos).
- Subtil glow în spatele iconiței folosind aceeași culoare pentru consistență cu ecranul de capitol terminat.
- Marja verticală: `mt-6 mb-2` la primul separator (lipit de header), `mt-10 mb-2` la următoarele, ca să separe clar grupurile.
- Linia verticală care leagă lecțiile (`h-8 w-0.5 bg-border`) **nu** se desenează imediat după un separator — separatorul preia rolul vizual de „pauză".

## Microcopy (RO)

- **Start** — „Primii pași în capitol"
- **Build** — „Construim pe ce am învățat"
- **Master** — „Provocarea finală"

Scurt, energic, în ton cu restul aplicației.

## Modificări tehnice

Un singur fișier: `src/pages/ChapterPage.tsx`.

1. Adaug un mic helper local (deasupra componentei sau în-componentă):
  ```ts
   type Section = "start" | "build" | "master";
   const getSectionBoundaries = (total: number) => {
     const a = Math.ceil(total / 3);
     const b = a + Math.ceil((total - a) / 2);
     return { startEnd: a, buildEnd: b }; // indici exclusivi
   };
  ```
2. Înainte de `chapter.lessons.map(...)`, calculez `boundaries` o dată.
3. În interiorul `.map((lesson, idx) => ...)`:
  - determin `section` și `isSectionStart` (true pentru `idx === 0`, `idx === startEnd`, `idx === buildEnd`).
  - dacă `isSectionStart`, randez `<SectionDivider section={section} />` ÎNAINTE de blocul lecției și **sar peste** linia verticală `h-8 w-0.5` care precede lecția (condiție: `idx > 0 && !isSectionStart`).
4. Componenta `SectionDivider` o definesc fie inline, fie ca sub-componentă în același fișier (fără fișier nou — păstrăm modificarea minimă):
  - Primește `section: Section`.
  - Conține iconiță, label, sub-titlu, două linii laterale.
  - Animație ușoară `motion.div` cu `initial opacity 0, y -8 → animate opacity 1, y 0` pentru continuitate cu lecțiile deja animate.
5. Capitole foarte mici (≤2 lecții): randez doar separatorul „Start" sus și gata, fără „Build" / „Master" goale. Logic: arăt un divider doar dacă există cel puțin o lecție în acea secțiune.

## Ce NU se schimbă

- `useChapters`, `useProgress`, `firstUncompletedId`, scroll-into-view, `chapterLock`, dialogul de „Lecție blocată", `SkipChallengeDialog`, ecranul „Capitol terminat", confetti.
- Nu adăugăm câmpuri în baza de date și nu atingem `chapterTheory` sau alte date.
- Nu schimbăm nimic în pagina lecției (`/lesson/:id`).

## Riscuri

Practic zero — schimbare pur prezentațională, izolată într-un singur fișier, fără efecte asupra stării sau navigării.  
  
Impartim asa primele 2 categori sunt total / 3 , a 3-a restul  
adica 10/3=3 -> 3, 3, 4  
7 / 3= 2 -> 2, 2, 3