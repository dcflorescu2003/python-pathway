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
  {
    slug: "numarul-de-cifre-si-suma-cifrelor",
    number: 7,
    title: "Numărul de cifre și suma cifrelor unui număr",
    description: "Algoritmul clasic de extragere a cifrelor cu mod 10 și div 10: numărul de cifre și suma cifrelor în pseudocod.",
    sections: [
      {
        heading: "Ideea: extragem cifrele de la coadă",
        paragraphs: [
          "Orice număr natural n își „dă” ultima cifră prin n mod 10 și o pierde prin n div 10. Repetând acești doi pași cât timp n este diferit de 0, vizităm toate cifrele numărului, de la dreapta la stânga.",
          "Exemplu pentru n = 352: cifra 2, n devine 35; cifra 5, n devine 3; cifra 3, n devine 0 și ne oprim. Au fost 3 pași, deci numărul are 3 cifre, iar suma lor este 2 + 5 + 3 = 10.",
        ],
      },
      {
        heading: "Numărul de cifre",
        paragraphs: [
          "Folosim un contor k, inițializat cu 0, care crește cu 1 la fiecare cifră tăiată. Cu repetă…până când, numărul 0 este tratat corect (are o cifră), fără un caz special.",
        ],
        code: `citeste n\nk <- 0\nrepeta\n  k <- k + 1\n  n <- n div 10\npana cand n = 0\nscrie k`,
        input: "352",
      },
      {
        heading: "Suma cifrelor",
        paragraphs: [
          "Acum folosim un acumulator s, inițializat cu 0, la care adunăm fiecare cifră extrasă. Tabelul de urmărire pentru n = 352: (c=2, s=2, n=35), (c=5, s=7, n=3), (c=3, s=10, n=0).",
          "Variații frecvente: produsul cifrelor (inițializăm cu 1 și înmulțim), suma cifrelor pare (adunăm doar dacă c mod 2 = 0), cifra maximă (comparăm fiecare c cu maximul curent).",
        ],
        code: `citeste n\ns <- 0\ncat timp n <> 0 executa\n  c <- n mod 10\n  s <- s + c\n  n <- n div 10\nsfarsit cat timp\nscrie s`,
        input: "352",
      },
    ],
  },
  {
    slug: "oglinditul-unui-numar-si-palindrom",
    number: 8,
    title: "Oglinditul unui număr și numere palindrom",
    description: "Cum construim inversul unui număr cifră cu cifră și cum verificăm dacă un număr este palindrom, în pseudocod.",
    sections: [
      {
        heading: "Construirea oglinditului",
        paragraphs: [
          "Oglinditul (inversul) lui 1234 este 4321. Extragem cifrele de la coadă, ca la suma cifrelor, dar le „lipim” la dreapta unui număr nou: ogl <- ogl * 10 + c. Înmulțirea cu 10 face loc unei cifre noi la final.",
          "Urmărire pentru n = 123: ogl = 0*10+3 = 3; ogl = 3*10+2 = 32; ogl = 32*10+1 = 321.",
        ],
        code: `citeste n\nogl <- 0\ncat timp n <> 0 executa\n  ogl <- ogl * 10 + n mod 10\n  n <- n div 10\nsfarsit cat timp\nscrie ogl`,
        input: "1234",
      },
      {
        heading: "Verificarea palindromului",
        paragraphs: [
          "Un număr este palindrom dacă se citește la fel în ambele sensuri (121, 4554, 7). Asta înseamnă că este egal cu oglinditul său.",
          "Atenție: bucla distruge valoarea lui n (la final n = 0). De aceea salvăm înainte o copie, iar la sfârșit comparăm copia cu oglinditul.",
        ],
        code: `citeste n\ncopie <- n\nogl <- 0\ncat timp n <> 0 executa\n  ogl <- ogl * 10 + n mod 10\n  n <- n div 10\nsfarsit cat timp\ndaca copie = ogl atunci\n  scrie "DA"\naltfel\n  scrie "NU"\nsfarsit daca`,
        input: "12321",
      },
    ],
  },
  {
    slug: "divizorii-si-multiplii-unui-numar",
    number: 9,
    title: "Divizorii și multiplii unui număr",
    description: "Afișarea divizorilor, numărul și suma divizorilor și generarea multiplilor unui număr natural în pseudocod.",
    sections: [
      {
        heading: "Divizorii unui număr",
        paragraphs: [
          "d este divizor al lui n dacă împărțirea lui n la d nu dă rest: n mod d = 0. Cea mai simplă metodă este să încercăm toate valorile d de la 1 la n.",
        ],
        code: `citeste n\npentru d <- 1, n executa\n  daca n mod d = 0 atunci\n    scrie d\n  sfarsit daca\nsfarsit pentru`,
        input: "12",
      },
      {
        heading: "Numărul și suma divizorilor",
        paragraphs: [
          "Combinăm parcurgerea cu un contor și un acumulator. Pentru n = 12, divizorii sunt 1, 2, 3, 4, 6, 12: sunt 6 divizori, cu suma 28.",
          "Optimizare: divizorii vin în perechi (d și n div d), deci este suficient să mergem cu d până la radicalul lui n — util pentru numere mari.",
        ],
        code: `citeste n\nk <- 0\ns <- 0\npentru d <- 1, n executa\n  daca n mod d = 0 atunci\n    k <- k + 1\n    s <- s + d\n  sfarsit daca\nsfarsit pentru\nscrie k, s`,
        input: "12",
      },
      {
        heading: "Multiplii unui număr",
        paragraphs: [
          "Multiplii lui n sunt n·1, n·2, n·3, … Primii k multipli se obțin direct cu o buclă pentru. Ca să numărăm multiplii lui n dintr-un interval [a, b], verificăm x mod n = 0 pentru fiecare x.",
        ],
        code: `citeste n, k\npentru i <- 1, k executa\n  scrie n * i\nsfarsit pentru`,
        input: "7\n5",
      },
    ],
  },
  {
    slug: "numar-prim-si-numar-perfect",
    number: 10,
    title: "Număr prim și număr perfect",
    description: "Verificarea primalității și a numerelor perfecte în pseudocod, cu varianta optimizată până la radical.",
    sections: [
      {
        heading: "Număr prim",
        paragraphs: [
          "Un număr natural n ≥ 2 este prim dacă are exact doi divizori: 1 și el însuși (2, 3, 5, 7, 11…). 0 și 1 nu sunt prime.",
          "Căutăm un divizor d între 2 și radicalul lui n (condiția d * d <= n). Dacă găsim unul, numărul nu este prim și ne oprim. Variabila prim funcționează ca un „steguleț”.",
        ],
        code: `citeste n\nprim <- 1\ndaca n < 2 atunci\n  prim <- 0\nsfarsit daca\nd <- 2\ncat timp d * d <= n si prim = 1 executa\n  daca n mod d = 0 atunci\n    prim <- 0\n  sfarsit daca\n  d <- d + 1\nsfarsit cat timp\ndaca prim = 1 atunci\n  scrie "DA"\naltfel\n  scrie "NU"\nsfarsit daca`,
        input: "97",
      },
      {
        heading: "Număr perfect",
        paragraphs: [
          "Un număr este perfect dacă este egal cu suma divizorilor săi proprii (toți divizorii, mai puțin el însuși). Exemple: 6 = 1 + 2 + 3 și 28 = 1 + 2 + 4 + 7 + 14.",
          "Adunăm divizorii de la 1 la n div 2 (niciun divizor propriu nu e mai mare decât jumătatea) și comparăm suma cu n.",
        ],
        code: `citeste n\ns <- 0\npentru d <- 1, n div 2 executa\n  daca n mod d = 0 atunci\n    s <- s + d\n  sfarsit daca\nsfarsit pentru\ndaca s = n si n > 1 atunci\n  scrie "DA"\naltfel\n  scrie "NU"\nsfarsit daca`,
        input: "28",
      },
    ],
  },
  {
    slug: "cmmdc-si-cmmmc",
    number: 11,
    title: "CMMDC și CMMMC — algoritmul lui Euclid",
    description: "Cel mai mare divizor comun prin scăderi și prin împărțiri repetate (Euclid) și calculul celui mai mic multiplu comun.",
    sections: [
      {
        heading: "Euclid prin scăderi repetate",
        paragraphs: [
          "Observația lui Euclid: cmmdc(a, b) = cmmdc(a − b, b) dacă a > b. Scădem mereu numărul mai mic din cel mai mare până când devin egale; valoarea comună este cmmdc-ul. Funcționează pentru a, b > 0.",
          "Urmărire pentru 48 și 18: (30, 18), (12, 18), (12, 6), (6, 6) → cmmdc = 6.",
        ],
        code: `citeste a, b\ncat timp a <> b executa\n  daca a > b atunci\n    a <- a - b\n  altfel\n    b <- b - a\n  sfarsit daca\nsfarsit cat timp\nscrie a`,
        input: "48\n18",
      },
      {
        heading: "Euclid prin împărțiri repetate",
        paragraphs: [
          "Varianta rapidă înlocuiește scăderile succesive cu restul împărțirii: cât timp b ≠ 0, calculăm r = a mod b, apoi a devine b și b devine r. Când b ajunge 0, răspunsul este a.",
          "Urmărire pentru 48 și 18: r = 12 → (18, 12); r = 6 → (12, 6); r = 0 → (6, 0) → cmmdc = 6. Această variantă funcționează și când unul dintre numere este 0.",
        ],
        code: `citeste a, b\ncat timp b <> 0 executa\n  r <- a mod b\n  a <- b\n  b <- r\nsfarsit cat timp\nscrie a`,
        input: "48\n18",
      },
      {
        heading: "Cel mai mic multiplu comun",
        paragraphs: [
          "Între cmmdc și cmmmc există relația a · b = cmmdc(a, b) · cmmmc(a, b). Deci cmmmc = a · b div cmmdc. Salvăm produsul înainte de buclă, pentru că a și b se modifică.",
          "Pentru 4 și 6: cmmdc = 2, cmmmc = 24 div 2 = 12. Două numere cu cmmdc = 1 se numesc prime între ele.",
        ],
        code: `citeste a, b\np <- a * b\ncat timp b <> 0 executa\n  r <- a mod b\n  a <- b\n  b <- r\nsfarsit cat timp\nscrie "cmmdc =", a\nscrie "cmmmc =", p div a`,
        input: "4\n6",
      },
    ],
  },
];

export const getPseudoLesson = (slug?: string) => pseudoLessons.find((l) => l.slug === slug);
