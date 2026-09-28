// Maparea capitolelor de teorie pe slug-uri publice pentru secțiunea „Învață Python".
// Conținutul propriu-zis vine din chapterTheory.ts (scris de noi, original).

export interface LearnChapter {
  slug: string;
  chapterId: string;
  number: number;
  title: string;
  description: string;
}

export const learnChapters: LearnChapter[] = [
  {
    slug: "recapitulare-fundamente",
    chapterId: "ch1",
    number: 1,
    title: "Recapitulare și fundamente",
    description:
      "Variabile și tipuri de date în Python, decizii cu if/elif/else, bucle for și while, gândire computațională și primii pași în algoritmi.",
  },
  {
    slug: "prelucrari-numerice",
    chapterId: "ch2",
    number: 2,
    title: "Prelucrări numerice",
    description:
      "Operații cu cifrele unui număr, palindroame și numere Armstrong, divizori, numere prime, CMMDC și CMMMC, descompunere în factori primi și conversii între baze de numerație.",
  },
  {
    slug: "liste-organizare",
    chapterId: "ch3",
    number: 3,
    title: "Liste și organizarea datelor",
    description:
      "Modelul conceptual de listă în Python, stiva și coada, liste de frecvență, parcurgeri liniare și metodele clasei list.",
  },
  {
    slug: "generare-sortare",
    chapterId: "ch4",
    number: 4,
    title: "Generare și sortare",
    description:
      "Generarea sistematică a secvențelor (Fibonacci, factorial), sortare prin selecție, metoda bulelor, sortarea cu liste de frecvență și compararea metodelor.",
  },
  {
    slug: "subprograme",
    chapterId: "ch5",
    number: 5,
    title: "Subprograme și funcții",
    description:
      "Funcții în Python, variabile locale și globale, parametri și returnare, funcții predefinite, proiectare modulară și introducere în clase și obiecte.",
  },
  {
    slug: "fisiere-interfete",
    chapterId: "ch6",
    number: 6,
    title: "Fișiere și interfețe grafice",
    description:
      "Lucrul cu fișiere text în Python și primele aplicații cu interfață grafică în Tkinter: ferestre, etichete, butoane, câmpuri de text și desen pe canvas.",
  },
];
