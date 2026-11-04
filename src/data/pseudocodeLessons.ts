export interface PseudoLessonSection {
  heading: string;
  paragraphs: string[];
  code?: string;
  input?: string;
}

export interface PseudoLesson {
  slug: string;
  number: number;
  title: string;
  description: string;
  sections: PseudoLessonSection[];
}

export const pseudoLessons: PseudoLesson[] = [
  {
    slug: "algoritmi-variabile-citire-scriere",
    number: 1,
    title: "Algoritmi, variabile, citire și scriere",
    description: "Ce este un algoritm, cum memorăm date în variabile și cum comunicăm cu utilizatorul.",
    sections: [
      {
        heading: "Ce este un algoritm?",
        paragraphs: [
          "Un algoritm este o succesiune finită și clară de pași care, pornind de la niște date de intrare, ajunge la un rezultat. O rețetă de prăjitură, indicațiile pentru a ajunge la școală sau metoda prin care împărțim două numere pe hârtie sunt toate algoritmi.",
          "Un algoritm bun are câteva proprietăți: este finit (se termină după un număr de pași), este clar (fiecare pas are un singur sens), este general (rezolvă o întreagă clasă de probleme, nu un singur caz) și este eficient.",
          "Pseudocodul este un limbaj intermediar între limba română și un limbaj de programare. Nu are reguli la fel de stricte ca Python sau C++, dar este suficient de precis încât oricine îl poate traduce ulterior în cod real. La examenul de bacalaureat și în manualele de clasa a IX-a algoritmii sunt descriși în pseudocod.",
        ],
      },
      {
        heading: "Variabile și atribuire",
        paragraphs: [
          "O variabilă este un „sertar” cu nume în care memorăm o valoare. Numele variabilei începe cu o literă și poate conține litere, cifre și caracterul _.",
          "Instrucțiunea de atribuire se scrie cu săgeata <- (sau ←). Expresia din dreapta se calculează întâi, iar rezultatul se memorează în variabila din stânga, înlocuind valoarea veche. De aceea x <- x + 1 este perfect corectă: înseamnă „crește valoarea lui x cu 1”.",
        ],
        code: `x <- 5\ny <- x * 2\nx <- x + 1\nscrie x, y`,
      },
      {
        heading: "Citirea și scrierea datelor",
        paragraphs: [
          "Instrucțiunea citeste preia valori de la utilizator și le memorează în variabile. Putem citi mai multe variabile deodată, separându-le prin virgulă: citeste a, b.",
          "Instrucțiunea scrie afișează valori de expresii sau texte între ghilimele. Fiecare scrie începe un rând nou. Rulează exemplul de mai jos și modifică datele de intrare pentru a vedea cum se schimbă rezultatul.",
        ],
        code: `citeste a, b\nscrie "Suma este", a + b\nscrie "Produsul este", a * b`,
        input: "6\n7",
      },
    ],
  },
  {
    slug: "operatori-si-expresii",
    number: 2,
    title: "Operatori și expresii",
    description: "Operatori aritmetici, div și mod, operatori relaționali și logici.",
    sections: [
      {
        heading: "Operatori aritmetici",
        paragraphs: [
          "În pseudocod folosim operatorii obișnuiți: + (adunare), - (scădere), * (înmulțire) și / (împărțire reală). Împărțirea reală poate produce zecimale: 7 / 2 = 3.5.",
          "Pentru numere întregi avem doi operatori foarte importanți: div calculează câtul împărțirii întregi (7 div 2 = 3), iar mod calculează restul (7 mod 2 = 1). Partea întreagă a unei expresii se poate scrie și cu paranteze drepte: [7 / 2] = 3.",
          "Cu div și mod putem lucra cu cifrele unui număr: n mod 10 este ultima cifră, iar n div 10 este numărul fără ultima cifră.",
        ],
        code: `n <- 2475\nscrie n mod 10\nscrie n div 10\nscrie n mod 100\nscrie n div 1000`,
      },
      {
        heading: "Prioritatea operatorilor",
        paragraphs: [
          "Ca la matematică, înmulțirea, împărțirea, div și mod se efectuează înaintea adunării și scăderii. Parantezele rotunde schimbă ordinea: (a + b) / 2 este media, dar a + b / 2 nu este.",
        ],
        code: `a <- 4\nb <- 10\nscrie a + b / 2\nscrie (a + b) / 2`,
      },
      {
        heading: "Operatori relaționali și logici",
        paragraphs: [
          "Operatorii relaționali compară două valori și dau rezultatul adevărat sau fals: = (egal), <> (diferit), <, <=, >, >=.",
          "Operatorii logici combină condiții: si (ambele adevărate), sau (cel puțin una adevărată), nu (negație). De exemplu, un număr x este în intervalul [1, 10] dacă x >= 1 si x <= 10.",
        ],
        code: `x <- 7\nscrie x >= 1 si x <= 10\nscrie x mod 2 = 0 sau x > 100\nscrie nu (x = 7)`,
      },
    ],
  },
  {
    slug: "structura-alternativa-daca",
    number: 3,
    title: "Structura alternativă: dacă…atunci…altfel",
    description: "Cum ia un algoritm decizii în funcție de o condiție.",
    sections: [
      {
        heading: "Sintaxa",
        paragraphs: [
          "Structura alternativă permite executarea unor instrucțiuni doar când o condiție este adevărată. Forma completă are două ramuri: dacă condiția este adevărată se execută blocul de după atunci, altfel se execută blocul de după altfel.",
          "Ramura altfel este opțională. Blocul se încheie cu sfarsit daca. În manuale se folosește și scrierea grafică cu bare verticale | și marcajul de final |[], pe care interpretorul nostru o recunoaște de asemenea.",
        ],
        code: `citeste n\ndaca n mod 2 = 0 atunci\n  scrie "par"\naltfel\n  scrie "impar"\nsfarsit daca`,
        input: "14",
      },
      {
        heading: "Decizii imbricate",
        paragraphs: [
          "În interiorul unei ramuri putem pune o altă structură dacă. Astfel tratăm mai mult de două cazuri, de exemplu semnul unui număr: pozitiv, negativ sau zero.",
          "Indentarea (alinierea cu spații) nu este obligatorie pentru interpretor, dar face algoritmul mult mai ușor de citit și de verificat.",
        ],
        code: `citeste x\ndaca x > 0 atunci\n  scrie "pozitiv"\naltfel\n  daca x < 0 atunci\n    scrie "negativ"\n  altfel\n    scrie "zero"\n  sfarsit daca\nsfarsit daca`,
        input: "-3",
      },
    ],
  },
  {
    slug: "structura-repetitiva-cat-timp",
    number: 4,
    title: "Structura repetitivă cât timp…execută",
    description: "Bucla cu test inițial și algoritmii pe cifrele unui număr.",
    sections: [
      {
        heading: "Cum funcționează",
        paragraphs: [
          "Structura cât timp…execută repetă un bloc de instrucțiuni atâta timp cât o condiție este adevărată. Condiția se verifică înaintea fiecărei repetări, de aceea se numește structură cu test inițial: dacă la început condiția este falsă, blocul nu se execută niciodată.",
          "În corpul buclei trebuie să existe o instrucțiune care modifică variabilele din condiție; altfel bucla nu se va termina (buclă infinită). Interpretorul nostru oprește execuția după 10.000 de repetări.",
        ],
        code: `citeste n\ns <- 0\ncat timp n > 0 executa\n  s <- s + n mod 10\n  n <- n div 10\nsfarsit cat timp\nscrie s`,
        input: "9045",
      },
      {
        heading: "Algoritmul de descompunere în cifre",
        paragraphs: [
          "Modelul de mai sus — extragem ultima cifră cu mod 10 și o eliminăm cu div 10 — stă la baza multor probleme: suma cifrelor, numărul de cifre, oglinditul, verificarea palindromului, cifra maximă.",
          "Când avem nevoie la final și de valoarea inițială a lui n, o salvăm înainte de buclă într-o copie.",
        ],
      },
    ],
  },
  {
    slug: "structura-repetitiva-pentru",
    number: 5,
    title: "Structura repetitivă pentru…execută",
    description: "Bucla cu număr cunoscut de pași, sume, produse și contoare.",
    sections: [
      {
        heading: "Sintaxa",
        paragraphs: [
          "Atunci când știm dinainte de câte ori trebuie repetat un bloc, folosim structura pentru. Contorul primește pe rând toate valorile de la valoarea inițială la cea finală: pentru i <- 1, n executa.",
          "Blocul se încheie cu sfarsit pentru. Orice buclă pentru poate fi rescrisă cu cât timp, dar pentru este mai scurtă și mai greu de greșit.",
        ],
        code: `citeste n\npentru i <- 1, n executa\n  scrie i * i\nsfarsit pentru`,
        input: "5",
      },
      {
        heading: "Acumulatori și contoare",
        paragraphs: [
          "Un acumulator adună (sau înmulțește) valori la fiecare pas: suma se inițializează cu 0, produsul cu 1. Un contor numără câte valori îndeplinesc o condiție și crește mereu cu 1.",
          "Exemplul de mai jos citește n numere și afișează suma lor și câte dintre ele sunt negative.",
        ],
        code: `citeste n\ns <- 0\nk <- 0\npentru i <- 1, n executa\n  citeste x\n  s <- s + x\n  daca x < 0 atunci\n    k <- k + 1\n  sfarsit daca\nsfarsit pentru\nscrie s, k`,
        input: "4\n5\n-2\n8\n-1",
      },
    ],
  },
  {
    slug: "structura-repetitiva-repeta-pana-cand",
    number: 6,
    title: "Structura repetitivă repetă…până când",
    description: "Bucla cu test final și diferențele față de cât timp.",
    sections: [
      {
        heading: "Testul la final",
        paragraphs: [
          "Structura repetă…până când execută întâi blocul și abia apoi verifică condiția. Repetarea se oprește când condiția devine adevărată — exact invers față de cât timp, care continuă cât timp condiția este adevărată.",
          "Deoarece testul este la final, blocul se execută cel puțin o dată. Acest lucru este util, de exemplu, la numărarea cifrelor: numărul 0 are o cifră, iar repetă…până când îl tratează corect fără un caz special.",
        ],
        code: `citeste n\nk <- 0\nrepeta\n  k <- k + 1\n  n <- n div 10\npana cand n = 0\nscrie k`,
        input: "0",
      },
      {
        heading: "Transformări între structuri",
        paragraphs: [
          "La bacalaureat apare des cerința de a rescrie un algoritm înlocuind o structură repetitivă cu alta. Regula: repeta B pana cand C este echivalent cu executarea lui B o dată, urmată de cat timp nu C executa B.",
          "Exersează aceste transformări pe problemele din capitolul 2: rezolvă aceeași problemă o dată cu cât timp și o dată cu repetă, apoi compară rezultatele în editor.",
        ],
      },
    ],
  },
];

export const getPseudoLesson = (slug?: string) => pseudoLessons.find((l) => l.slug === slug);
