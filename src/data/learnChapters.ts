// Maparea capitolelor de teorie pe slug-uri publice pentru secțiunea „Învață Python".
// Conținutul propriu-zis vine din chapterTheory.ts (scris de noi, original).

export interface LearnChapter {
  slug: string;
  chapterId: string;
  number: number;
  title: string;
  description: string;
  grade: 9 | 10 | 11;
}

export const learnChapters: LearnChapter[] = [
  {
    slug: "recapitulare-fundamente",
    chapterId: "ch1",
    number: 1,
    grade: 9,
    title: "Recapitulare și fundamente",
    description:
      "Variabile și tipuri de date în Python, decizii cu if/elif/else, bucle for și while, gândire computațională și primii pași în algoritmi.",
  },
  {
    slug: "prelucrari-numerice",
    chapterId: "ch2",
    number: 2,
    grade: 9,
    title: "Prelucrări numerice",
    description:
      "Operații cu cifrele unui număr, palindroame și numere Armstrong, divizori, numere prime, CMMDC și CMMMC, descompunere în factori primi și conversii între baze de numerație.",
  },
  {
    slug: "liste-organizare",
    chapterId: "ch3",
    number: 3,
    grade: 9,
    title: "Liste și organizarea datelor",
    description:
      "Modelul conceptual de listă în Python, stiva și coada, liste de frecvență, parcurgeri liniare și metodele clasei list.",
  },
  {
    slug: "generare-sortare",
    chapterId: "ch4",
    number: 4,
    grade: 9,
    title: "Generare și sortare",
    description:
      "Generarea sistematică a secvențelor (Fibonacci, factorial), sortare prin selecție, metoda bulelor, sortarea cu liste de frecvență și compararea metodelor.",
  },
  {
    slug: "subprograme",
    chapterId: "ch5",
    number: 5,
    grade: 9,
    title: "Subprograme și funcții",
    description:
      "Funcții în Python, variabile locale și globale, parametri și returnare, funcții predefinite, proiectare modulară și introducere în clase și obiecte.",
  },
  {
    slug: "fisiere-interfete",
    chapterId: "ch6",
    number: 6,
    grade: 9,
    title: "Fișiere și interfețe grafice",
    description:
      "Lucrul cu fișiere text în Python și primele aplicații cu interfață grafică în Tkinter: ferestre, etichete, butoane, câmpuri de text și desen pe canvas.",
  },
  {
    slug: "siruri-de-caractere",
    chapterId: "x1",
    number: 7,
    grade: 10,
    title: "Șiruri de caractere",
    description:
      "Lucrul cu text în Python: indici pozitivi și negativi, slicing, metode str (split, join, strip, find, replace), ord și chr, cifrul lui Cezar și formatare cu f-strings.",
  },
  {
    slug: "matrice",
    chapterId: "x2",
    number: 8,
    grade: 10,
    title: "Matrice (tablouri bidimensionale)",
    description:
      "Matrice ca listă de liste în Python: creare corectă, citire, parcurgeri pe linii și coloane, diagonale, zone ale matricei pătratice și vecinii unei celule.",
  },
  {
    slug: "tupluri-dictionare-multimi",
    chapterId: "x3",
    number: 9,
    grade: 10,
    title: "Tupluri, dicționare și mulțimi",
    description:
      "Structuri de date Python: tupluri și despachetare, dicționare cheie-valoare, frecvențe cu dict și Counter, operații cu mulțimi și eficiența căutării.",
  },
  {
    slug: "recursivitate",
    chapterId: "x4",
    number: 10,
    grade: 10,
    title: "Recursivitate",
    description:
      "Funcții recursive în Python: cazul de bază, stiva de apeluri, exemple pe numere, liste și șiruri, memoizare pentru Fibonacci și alegerea între recursiv și iterativ.",
  },
  {
    slug: "greedy-divide-et-impera",
    chapterId: "xi1",
    number: 11,
    grade: 11,
    title: "Greedy și Divide et Impera",
    description:
      "Tehnici de programare: metoda Greedy cu exemple și contraexemple, Divide et Impera, căutarea binară și sortarea prin interclasare (Merge Sort) în Python.",
  },
  {
    slug: "backtracking-programare-dinamica",
    chapterId: "xi2",
    number: 12,
    grade: 11,
    title: "Backtracking și programare dinamică",
    description:
      "Backtracking în Python: schema generală, combinări și permutări. Programare dinamică: stări, recurențe, numărul de moduri și restul cu număr minim de monede.",
  },
];
