// 30 probleme publice de pseudocod (capitolele 1–2). Rezultatele așteptate se
// calculează rulând `solution` prin interpretor pe fiecare intrare din `tests`.

export interface PseudoProblem {
  slug: string;
  chapter: 1 | 2;
  title: string;
  difficulty: "ușor" | "mediu" | "dificil";
  statement: string;
  inputFormat: string;
  outputFormat: string;
  /** Prima intrare este exemplul afișat; restul sunt teste ascunse. Valorile sunt pe linii separate. */
  tests: string[];
  hint: string;
  explanation: string[];
  solution: string;
  starter?: string;
}

export const pseudoChapters = {
  1: {
    title: "Structura liniară și structura alternativă",
    description:
      "Citire, atribuire, operatori aritmetici (div, mod) și decizia dacă…atunci…altfel.",
  },
  2: {
    title: "Structuri repetitive",
    description:
      "Algoritmi cu cât timp, pentru și repetă…până când: cifrele unui număr, divizori, șiruri de valori.",
  },
} as const;

export const pseudoProblems: PseudoProblem[] = [
  // ───────── Capitolul 1 ─────────
  {
    slug: "suma-a-doua-numere",
    chapter: 1,
    title: "Suma a două numere",
    difficulty: "ușor",
    statement:
      "Se citesc două numere întregi a și b. Scrieți un algoritm care afișează suma lor. Este cea mai simplă problemă cu structură liniară: citire, calcul, afișare.",
    inputFormat: "Pe primele două linii se află numerele întregi a și b.",
    outputFormat: "Se afișează un singur număr: a + b.",
    tests: ["3\n5", "-7\n7", "1000\n2345", "0\n0"],
    hint: "Folosește o variabilă s în care atribui valoarea a + b, apoi afișeaz-o.",
    explanation: [
      "Orice algoritm liniar are trei etape: citirea datelor de intrare, prelucrarea lor și afișarea rezultatului.",
      "Instrucțiunea de atribuire s <- a + b calculează întâi expresia din dreapta, apoi memorează valoarea în variabila s.",
    ],
    solution: `citeste a, b\ns <- a + b\nscrie s`,
  },
  {
    slug: "perimetrul-si-aria-dreptunghiului",
    chapter: 1,
    title: "Perimetrul și aria dreptunghiului",
    difficulty: "ușor",
    statement:
      "Se citesc lungimea L și lățimea l ale unui dreptunghi (numere naturale). Afișați perimetrul și aria dreptunghiului, separate printr-un spațiu.",
    inputFormat: "Două numere naturale L și l, pe linii separate.",
    outputFormat: "Perimetrul și aria, separate prin spațiu.",
    tests: ["5\n3", "10\n10", "1\n7", "12\n4"],
    hint: "Perimetrul este 2·(L + l), iar aria este L·l.",
    explanation: [
      "Formula perimetrului adună toate cele patru laturi: P = 2·(L + l).",
      "Instrucțiunea scrie poate afișa mai multe valori, separate prin virgulă; ele apar pe aceeași linie, despărțite de un spațiu.",
    ],
    solution: `citeste L, l\nP <- 2 * (L + l)\nA <- L * l\nscrie P, A`,
  },
  {
    slug: "interschimbarea-a-doua-variabile",
    chapter: 1,
    title: "Interschimbarea a două variabile",
    difficulty: "ușor",
    statement:
      "Se citesc două numere a și b. Interschimbați valorile celor două variabile, apoi afișați a și b. Problema ilustrează celebra „regulă a paharelor”.",
    inputFormat: "Două numere întregi a și b, pe linii separate.",
    outputFormat: "Valorile lui a și b după interschimbare, separate prin spațiu.",
    tests: ["4\n9", "1\n2", "-5\n10", "7\n7"],
    hint: "Ai nevoie de o a treia variabilă auxiliară: aux <- a, a <- b, b <- aux.",
    explanation: [
      "Dacă am scrie direct a <- b, valoarea veche a lui a s-ar pierde. De aceea o salvăm întâi într-un „pahar gol”, variabila aux.",
      "Ordinea instrucțiunilor contează: aux <- a, apoi a <- b, apoi b <- aux.",
    ],
    solution: `citeste a, b\naux <- a\na <- b\nb <- aux\nscrie a, b`,
  },
  {
    slug: "ultima-cifra-a-unui-numar",
    chapter: 1,
    title: "Ultima cifră a unui număr",
    difficulty: "ușor",
    statement:
      "Se citește un număr natural n. Afișați ultima cifră a lui n (cifra unităților).",
    inputFormat: "Un număr natural n.",
    outputFormat: "Ultima cifră a lui n.",
    tests: ["2024", "7", "130", "98765"],
    hint: "Restul împărțirii la 10 este exact ultima cifră: n mod 10.",
    explanation: [
      "Operatorul mod calculează restul împărțirii întregi. Orice număr împărțit la 10 dă ca rest cifra unităților.",
      "Exemplu: 2024 mod 10 = 4, deoarece 2024 = 202·10 + 4.",
    ],
    solution: `citeste n\nscrie n mod 10`,
  },
  {
    slug: "suma-cifrelor-unui-numar-de-trei-cifre",
    chapter: 1,
    title: "Suma cifrelor unui număr de trei cifre",
    difficulty: "ușor",
    statement:
      "Se citește un număr natural n cu exact trei cifre. Afișați suma cifrelor sale, fără a folosi structuri repetitive.",
    inputFormat: "Un număr natural n, 100 ≤ n ≤ 999.",
    outputFormat: "Suma cifrelor lui n.",
    tests: ["472", "100", "999", "305"],
    hint: "Unitățile: n mod 10. Zecile: (n div 10) mod 10. Sutele: n div 100.",
    explanation: [
      "Operatorul div dă câtul împărțirii întregi. n div 10 „taie” ultima cifră a numărului.",
      "Combinând div și mod putem extrage orice cifră: cifra zecilor este ultima cifră a lui n div 10.",
    ],
    solution: `citeste n\nu <- n mod 10\nz <- (n div 10) mod 10\ns <- n div 100\nscrie u + z + s`,
  },
  {
    slug: "inversul-unui-numar-de-trei-cifre",
    chapter: 1,
    title: "Inversul unui număr de trei cifre",
    difficulty: "mediu",
    statement:
      "Se citește un număr natural n cu exact trei cifre. Afișați numărul obținut prin scrierea cifrelor lui n în ordine inversă (de exemplu, din 472 se obține 274).",
    inputFormat: "Un număr natural n, 100 ≤ n ≤ 999.",
    outputFormat: "Numărul invers.",
    tests: ["472", "123", "909", "500"],
    hint: "Extrage cele trei cifre, apoi construiește u·100 + z·10 + s.",
    explanation: [
      "După ce am extras cifrele, le recompunem în ordinea inversă folosind puterile lui 10.",
      "Atenție: pentru 500 rezultatul este 5, deoarece zerourile din față nu se scriu.",
    ],
    solution: `citeste n\nu <- n mod 10\nz <- (n div 10) mod 10\ns <- n div 100\nscrie u * 100 + z * 10 + s`,
  },
  {
    slug: "media-aritmetica-a-doua-numere",
    chapter: 1,
    title: "Media aritmetică a două numere",
    difficulty: "ușor",
    statement:
      "Se citesc două numere întregi a și b. Afișați media lor aritmetică (poate fi un număr real).",
    inputFormat: "Două numere întregi a și b.",
    outputFormat: "Media aritmetică (a + b) / 2.",
    tests: ["4\n7", "10\n20", "-3\n3", "1\n2"],
    hint: "Parantezele sunt obligatorii: (a + b) / 2, nu a + b / 2.",
    explanation: [
      "În expresii, împărțirea are prioritate față de adunare. Fără paranteze, a + b / 2 ar împărți doar pe b.",
      "Operatorul / face împărțire reală, deci rezultatul poate avea zecimale, spre deosebire de div.",
    ],
    solution: `citeste a, b\nm <- (a + b) / 2\nscrie m`,
  },
  {
    slug: "transformarea-secundelor-in-ore-minute-secunde",
    chapter: 1,
    title: "Transformarea secundelor în ore, minute și secunde",
    difficulty: "mediu",
    statement:
      "Se citește un număr natural s reprezentând o durată în secunde. Afișați câte ore, minute și secunde întregi conține această durată.",
    inputFormat: "Un număr natural s.",
    outputFormat: "Trei numere: ore, minute, secunde, separate prin spațiu.",
    tests: ["3725", "59", "3600", "86399"],
    hint: "O oră are 3600 de secunde. Minutele rămase sunt (s mod 3600) div 60.",
    explanation: [
      "Împărțim succesiv: întâi aflăm orele întregi cu s div 3600, apoi lucrăm cu restul.",
      "Din restul rămas, minutele sunt rest div 60, iar secundele rest mod 60.",
    ],
    solution: `citeste s\nh <- s div 3600\nr <- s mod 3600\nm <- r div 60\nsec <- r mod 60\nscrie h, m, sec`,
  },
  {
    slug: "numar-par-sau-impar",
    chapter: 1,
    title: "Număr par sau impar",
    difficulty: "ușor",
    statement:
      "Se citește un număr natural n. Afișați mesajul par dacă n este par, altfel afișați impar.",
    inputFormat: "Un număr natural n.",
    outputFormat: "Cuvântul par sau impar.",
    tests: ["8", "13", "0", "1001"],
    hint: "Un număr este par dacă restul împărțirii la 2 este 0.",
    explanation: [
      "Structura alternativă dacă…atunci…altfel alege una dintre două ramuri în funcție de o condiție.",
      "Condiția n mod 2 = 0 este adevărată exact pentru numerele pare.",
    ],
    solution: `citeste n\ndaca n mod 2 = 0 atunci\n  scrie "par"\naltfel\n  scrie "impar"\nsfarsit daca`,
  },
  {
    slug: "maximul-a-doua-numere",
    chapter: 1,
    title: "Maximul a două numere",
    difficulty: "ușor",
    statement: "Se citesc două numere întregi a și b. Afișați cel mai mare dintre ele.",
    inputFormat: "Două numere întregi a și b.",
    outputFormat: "Valoarea maximă.",
    tests: ["3\n9", "12\n-4", "5\n5", "-8\n-2"],
    hint: "Compară a cu b într-o structură dacă.",
    explanation: [
      "Dacă a > b, maximul este a; în caz contrar (inclusiv la egalitate) maximul este b.",
    ],
    solution: `citeste a, b\ndaca a > b atunci\n  scrie a\naltfel\n  scrie b\nsfarsit daca`,
  },
  {
    slug: "maximul-a-trei-numere",
    chapter: 1,
    title: "Maximul a trei numere",
    difficulty: "mediu",
    statement: "Se citesc trei numere întregi a, b și c. Afișați cea mai mare valoare dintre ele.",
    inputFormat: "Trei numere întregi, pe linii separate.",
    outputFormat: "Valoarea maximă.",
    tests: ["4\n11\n7", "20\n3\n5", "1\n2\n30", "6\n6\n6"],
    hint: "Presupune că maximul este a, apoi actualizează-l dacă b sau c sunt mai mari.",
    explanation: [
      "Metoda „maximului curent” se extinde ușor la oricâte valori: inițializăm max cu prima valoare și o comparăm pe rând cu celelalte.",
      "Aceeași idee va fi folosită în capitolul 2, unde comparăm un întreg șir de valori într-o buclă.",
    ],
    solution: `citeste a, b, c\nmx <- a\ndaca b > mx atunci\n  mx <- b\nsfarsit daca\ndaca c > mx atunci\n  mx <- c\nsfarsit daca\nscrie mx`,
  },
  {
    slug: "an-bisect",
    chapter: 1,
    title: "An bisect",
    difficulty: "mediu",
    statement:
      "Se citește un an a. Afișați DA dacă anul este bisect și NU în caz contrar. Un an este bisect dacă se divide cu 4 și nu cu 100, sau dacă se divide cu 400.",
    inputFormat: "Un număr natural a.",
    outputFormat: "DA sau NU.",
    tests: ["2024", "1900", "2000", "2026"],
    hint: "Combină condițiile cu operatorii logici si și sau.",
    explanation: [
      "Condiția completă este: (a mod 4 = 0 si a mod 100 <> 0) sau a mod 400 = 0.",
      "Anul 1900 se divide cu 4, dar și cu 100 și nu cu 400, deci nu este bisect. Anul 2000 se divide cu 400, deci este bisect.",
    ],
    solution: `citeste a\ndaca (a mod 4 = 0 si a mod 100 <> 0) sau a mod 400 = 0 atunci\n  scrie "DA"\naltfel\n  scrie "NU"\nsfarsit daca`,
  },
  {
    slug: "divizibilitate",
    chapter: 1,
    title: "Divizibilitate",
    difficulty: "ușor",
    statement:
      "Se citesc două numere naturale nenule a și b. Afișați DA dacă a se divide cu b și NU în caz contrar.",
    inputFormat: "Două numere naturale nenule a și b.",
    outputFormat: "DA sau NU.",
    tests: ["12\n4", "13\n5", "100\n10", "7\n14"],
    hint: "a se divide cu b când a mod b = 0.",
    explanation: [
      "Divizibilitatea se verifică întotdeauna prin rest: dacă restul împărțirii lui a la b este zero, b este divizor al lui a.",
    ],
    solution: `citeste a, b\ndaca a mod b = 0 atunci\n  scrie "DA"\naltfel\n  scrie "NU"\nsfarsit daca`,
  },
  {
    slug: "ordonarea-crescatoare-a-trei-numere",
    chapter: 1,
    title: "Ordonarea crescătoare a trei numere",
    difficulty: "dificil",
    statement:
      "Se citesc trei numere întregi a, b, c. Afișați-le în ordine crescătoare, separate prin spațiu.",
    inputFormat: "Trei numere întregi.",
    outputFormat: "Cele trei numere, în ordine crescătoare.",
    tests: ["9\n2\n5", "1\n2\n3", "3\n2\n1", "4\n4\n1"],
    hint: "Compară perechile (a,b), (b,c), (a,b) și interschimbă când sunt în ordine greșită.",
    explanation: [
      "Trei comparații cu interschimbare sunt suficiente: după primele două, cel mai mare număr ajunge în c; a treia comparație ordonează a și b.",
      "Este, de fapt, metoda bulelor aplicată pe trei valori.",
    ],
    solution: `citeste a, b, c\ndaca a > b atunci\n  aux <- a\n  a <- b\n  b <- aux\nsfarsit daca\ndaca b > c atunci\n  aux <- b\n  b <- c\n  c <- aux\nsfarsit daca\ndaca a > b atunci\n  aux <- a\n  a <- b\n  b <- aux\nsfarsit daca\nscrie a, b, c`,
  },
  {
    slug: "triunghi-valid",
    chapter: 1,
    title: "Pot forma un triunghi?",
    difficulty: "mediu",
    statement:
      "Se citesc trei numere naturale nenule a, b, c. Afișați DA dacă pot fi lungimile laturilor unui triunghi și NU în caz contrar.",
    inputFormat: "Trei numere naturale nenule.",
    outputFormat: "DA sau NU.",
    tests: ["3\n4\n5", "1\n2\n3", "10\n1\n1", "7\n7\n7"],
    hint: "Fiecare latură trebuie să fie mai mică decât suma celorlalte două.",
    explanation: [
      "Inegalitatea triunghiului: a < b + c, b < a + c și c < a + b, toate simultan.",
      "Pentru 1, 2, 3 avem 3 = 1 + 2, deci punctele sunt coliniare și nu formează un triunghi.",
    ],
    solution: `citeste a, b, c\ndaca a < b + c si b < a + c si c < a + b atunci\n  scrie "DA"\naltfel\n  scrie "NU"\nsfarsit daca`,
  },

  // ───────── Capitolul 2 ─────────
  {
    slug: "suma-primelor-n-numere",
    chapter: 2,
    title: "Suma primelor n numere naturale",
    difficulty: "ușor",
    statement: "Se citește un număr natural n. Calculați suma 1 + 2 + … + n.",
    inputFormat: "Un număr natural n.",
    outputFormat: "Suma calculată.",
    tests: ["10", "1", "100", "0"],
    hint: "Folosește pentru i <- 1, n executa și adună i la o sumă inițializată cu 0.",
    explanation: [
      "Structura pentru repetă un bloc pentru fiecare valoare a contorului, de la valoarea inițială la cea finală.",
      "Variabila s este un acumulator: o inițializăm cu 0 și la fiecare pas îi adăugăm valoarea curentă.",
    ],
    solution: `citeste n\ns <- 0\npentru i <- 1, n executa\n  s <- s + i\nsfarsit pentru\nscrie s`,
  },
  {
    slug: "factorialul-unui-numar",
    chapter: 2,
    title: "Factorialul unui număr",
    difficulty: "ușor",
    statement: "Se citește un număr natural n (n ≤ 15). Afișați n! = 1 · 2 · … · n. Prin convenție, 0! = 1.",
    inputFormat: "Un număr natural n.",
    outputFormat: "Valoarea lui n!.",
    tests: ["5", "0", "10", "1"],
    hint: "Un produs se inițializează cu 1, nu cu 0.",
    explanation: [
      "Ca și la sumă, folosim un acumulator, dar pentru produs elementul neutru este 1.",
      "Dacă n = 0, bucla nu se execută deloc și rezultatul rămâne 1, exact conform convenției.",
    ],
    solution: `citeste n\np <- 1\npentru i <- 1, n executa\n  p <- p * i\nsfarsit pentru\nscrie p`,
  },
  {
    slug: "suma-cifrelor-unui-numar",
    chapter: 2,
    title: "Suma cifrelor unui număr",
    difficulty: "mediu",
    statement: "Se citește un număr natural n. Afișați suma cifrelor lui n, oricâte cifre ar avea.",
    inputFormat: "Un număr natural n.",
    outputFormat: "Suma cifrelor.",
    tests: ["12345", "7", "1000", "98989"],
    hint: "Cât timp n > 0: adaugă n mod 10 la sumă, apoi n <- n div 10.",
    explanation: [
      "Acesta este algoritmul clasic de „descompunere în cifre”: extragem ultima cifră și apoi o eliminăm.",
      "Bucla cât timp se oprește când n devine 0, adică atunci când am consumat toate cifrele.",
    ],
    solution: `citeste n\ns <- 0\ncat timp n > 0 executa\n  s <- s + n mod 10\n  n <- n div 10\nsfarsit cat timp\nscrie s`,
  },
  {
    slug: "numarul-de-cifre",
    chapter: 2,
    title: "Numărul de cifre",
    difficulty: "ușor",
    statement: "Se citește un număr natural n. Afișați câte cifre are n. Numărul 0 are o cifră.",
    inputFormat: "Un număr natural n.",
    outputFormat: "Numărul de cifre.",
    tests: ["2026", "0", "9", "1000000"],
    hint: "repeta…pana cand execută corpul cel puțin o dată, ceea ce rezolvă cazul n = 0.",
    explanation: [
      "Structura repetă…până când are testul la final, deci corpul se execută cel puțin o dată.",
      "Dacă am folosi cât timp n > 0, pentru n = 0 am obține 0 cifre, ceea ce este greșit.",
    ],
    solution: `citeste n\nk <- 0\nrepeta\n  k <- k + 1\n  n <- n div 10\npana cand n = 0\nscrie k`,
  },
  {
    slug: "oglinditul-unui-numar",
    chapter: 2,
    title: "Oglinditul unui număr",
    difficulty: "mediu",
    statement:
      "Se citește un număr natural n. Afișați oglinditul (inversul) său, adică numărul cu cifrele în ordine inversă.",
    inputFormat: "Un număr natural n.",
    outputFormat: "Oglinditul lui n.",
    tests: ["12345", "100", "7", "9080"],
    hint: "ogl <- ogl * 10 + n mod 10, apoi n <- n div 10.",
    explanation: [
      "La fiecare pas „mutăm” ultima cifră a lui n la finalul lui ogl: înmulțim ogl cu 10 și adunăm cifra.",
      "Pentru 100 oglinditul este 1, deoarece zerourile de la început dispar.",
    ],
    solution: `citeste n\nogl <- 0\ncat timp n > 0 executa\n  ogl <- ogl * 10 + n mod 10\n  n <- n div 10\nsfarsit cat timp\nscrie ogl`,
  },
  {
    slug: "numar-palindrom",
    chapter: 2,
    title: "Număr palindrom",
    difficulty: "mediu",
    statement:
      "Se citește un număr natural n. Afișați DA dacă n este palindrom (se citește la fel de la stânga la dreapta și invers) și NU în caz contrar.",
    inputFormat: "Un număr natural n.",
    outputFormat: "DA sau NU.",
    tests: ["12321", "123", "7", "4554"],
    hint: "Păstrează o copie a lui n, calculează oglinditul și compară-le.",
    explanation: [
      "Algoritmul de oglindire distruge valoarea lui n, de aceea salvăm întâi o copie: cn <- n.",
      "Numărul este palindrom exact atunci când este egal cu oglinditul său.",
    ],
    solution: `citeste n\ncn <- n\nogl <- 0\ncat timp n > 0 executa\n  ogl <- ogl * 10 + n mod 10\n  n <- n div 10\nsfarsit cat timp\ndaca ogl = cn atunci\n  scrie "DA"\naltfel\n  scrie "NU"\nsfarsit daca`,
  },
  {
    slug: "numar-prim",
    chapter: 2,
    title: "Număr prim",
    difficulty: "mediu",
    statement:
      "Se citește un număr natural n ≥ 2. Afișați DA dacă n este prim și NU în caz contrar.",
    inputFormat: "Un număr natural n ≥ 2.",
    outputFormat: "DA sau NU.",
    tests: ["17", "21", "2", "97", "100"],
    hint: "Caută un divizor d între 2 și √n. Dacă găsești unul, numărul nu este prim.",
    explanation: [
      "Un număr prim are exact doi divizori: 1 și el însuși.",
      "Este suficient să verificăm divizorii până la radicalul lui n (condiția d * d <= n), deoarece divizorii apar în perechi.",
    ],
    solution: `citeste n\nprim <- 1\nd <- 2\ncat timp d * d <= n executa\n  daca n mod d = 0 atunci\n    prim <- 0\n  sfarsit daca\n  d <- d + 1\nsfarsit cat timp\ndaca prim = 1 atunci\n  scrie "DA"\naltfel\n  scrie "NU"\nsfarsit daca`,
  },
  {
    slug: "divizorii-unui-numar",
    chapter: 2,
    title: "Divizorii unui număr",
    difficulty: "ușor",
    statement:
      "Se citește un număr natural nenul n. Afișați toți divizorii lui n, în ordine crescătoare, fiecare pe câte o linie.",
    inputFormat: "Un număr natural nenul n.",
    outputFormat: "Divizorii lui n, câte unul pe linie.",
    tests: ["12", "7", "1", "36"],
    hint: "Parcurge d de la 1 la n și afișează d când n mod d = 0.",
    explanation: [
      "Combinăm o structură repetitivă cu o structură alternativă: bucla trece prin toți candidații, iar dacă filtrează doar divizorii.",
      "Fiecare instrucțiune scrie afișează pe un rând nou.",
    ],
    solution: `citeste n\npentru d <- 1, n executa\n  daca n mod d = 0 atunci\n    scrie d\n  sfarsit daca\nsfarsit pentru`,
  },
  {
    slug: "cmmdc-algoritmul-lui-euclid",
    chapter: 2,
    title: "CMMDC — algoritmul lui Euclid",
    difficulty: "mediu",
    statement:
      "Se citesc două numere naturale nenule a și b. Afișați cel mai mare divizor comun al lor, folosind algoritmul lui Euclid cu resturi.",
    inputFormat: "Două numere naturale nenule a și b.",
    outputFormat: "cmmdc(a, b).",
    tests: ["48\n18", "17\n5", "100\n75", "9\n9"],
    hint: "Cât timp b ≠ 0: r <- a mod b, a <- b, b <- r. Rezultatul este a.",
    explanation: [
      "Algoritmul lui Euclid se bazează pe proprietatea cmmdc(a, b) = cmmdc(b, a mod b).",
      "Restul scade la fiecare pas, deci algoritmul se termină sigur, iar ultimul rest nenul este cmmdc-ul.",
    ],
    solution: `citeste a, b\ncat timp b <> 0 executa\n  r <- a mod b\n  a <- b\n  b <- r\nsfarsit cat timp\nscrie a`,
  },
  {
    slug: "suma-a-n-numere-citite",
    chapter: 2,
    title: "Suma a n numere citite",
    difficulty: "ușor",
    statement:
      "Se citește un număr natural n, apoi n numere întregi. Afișați suma celor n numere.",
    inputFormat: "Pe prima linie n, apoi n numere întregi, câte unul pe linie.",
    outputFormat: "Suma numerelor.",
    tests: ["4\n3\n8\n-2\n10", "1\n5", "3\n0\n0\n0", "5\n1\n2\n3\n4\n5"],
    hint: "Citește x în interiorul buclei pentru, la fiecare pas.",
    explanation: [
      "Spre deosebire de problemele anterioare, aici datele se citesc treptat: instrucțiunea citeste x se află în corpul buclei.",
      "Nu trebuie să memorăm toate numerele, ci doar suma lor parțială.",
    ],
    solution: `citeste n\ns <- 0\npentru i <- 1, n executa\n  citeste x\n  s <- s + x\nsfarsit pentru\nscrie s`,
  },
  {
    slug: "maximul-dintr-un-sir-de-numere",
    chapter: 2,
    title: "Maximul dintr-un șir de numere",
    difficulty: "mediu",
    statement:
      "Se citește n, apoi n numere întregi. Afișați cea mai mare valoare citită.",
    inputFormat: "Pe prima linie n (n ≥ 1), apoi n numere întregi.",
    outputFormat: "Valoarea maximă.",
    tests: ["5\n3\n17\n-4\n9\n12", "1\n-6", "3\n-5\n-2\n-9", "4\n8\n8\n1\n8"],
    hint: "Inițializează maximul cu primul număr citit, nu cu 0 (numerele pot fi negative).",
    explanation: [
      "Dacă am inițializa maximul cu 0, pentru un șir de numere negative am afișa greșit 0.",
      "Soluția corectă citește primul număr înaintea buclei și îl folosește ca maxim inițial.",
    ],
    solution: `citeste n\nciteste mx\npentru i <- 2, n executa\n  citeste x\n  daca x > mx atunci\n    mx <- x\n  sfarsit daca\nsfarsit pentru\nscrie mx`,
  },
  {
    slug: "cate-numere-pare",
    chapter: 2,
    title: "Câte numere pare?",
    difficulty: "ușor",
    statement:
      "Se citește n, apoi n numere naturale. Afișați câte dintre ele sunt pare.",
    inputFormat: "Pe prima linie n, apoi n numere naturale.",
    outputFormat: "Numărul de valori pare.",
    tests: ["6\n1\n2\n3\n4\n5\n6", "3\n1\n3\n5", "2\n0\n10", "1\n7"],
    hint: "Folosește un contor k <- 0 pe care îl crești cu 1 la fiecare număr par.",
    explanation: [
      "Un contor este un acumulator care crește mereu cu 1, doar atunci când o condiție este îndeplinită.",
    ],
    solution: `citeste n\nk <- 0\npentru i <- 1, n executa\n  citeste x\n  daca x mod 2 = 0 atunci\n    k <- k + 1\n  sfarsit daca\nsfarsit pentru\nscrie k`,
  },
  {
    slug: "ridicarea-la-putere",
    chapter: 2,
    title: "Ridicarea la putere",
    difficulty: "ușor",
    statement:
      "Se citesc două numere naturale a și b. Calculați a la puterea b prin înmulțiri repetate, fără operatorul de putere.",
    inputFormat: "Două numere naturale a și b.",
    outputFormat: "Valoarea lui a^b.",
    tests: ["2\n10", "5\n0", "3\n4", "10\n6"],
    hint: "p <- 1, apoi înmulțește p cu a de b ori.",
    explanation: [
      "Ridicarea la putere înseamnă înmulțirea repetată a bazei cu ea însăși.",
      "Orice număr la puterea 0 dă 1, iar bucla cu b = 0 nu se execută, deci rezultatul rămâne corect.",
    ],
    solution: `citeste a, b\np <- 1\npentru i <- 1, b executa\n  p <- p * a\nsfarsit pentru\nscrie p`,
  },
  {
    slug: "sirul-lui-fibonacci",
    chapter: 2,
    title: "Șirul lui Fibonacci",
    difficulty: "dificil",
    statement:
      "Șirul lui Fibonacci începe cu 1, 1, iar fiecare termen următor este suma celor doi anteriori: 1, 1, 2, 3, 5, 8, … Se citește n (n ≥ 1). Afișați al n-lea termen.",
    inputFormat: "Un număr natural n ≥ 1.",
    outputFormat: "Al n-lea termen al șirului.",
    tests: ["7", "1", "2", "20"],
    hint: "Păstrează doar ultimii doi termeni în variabilele a și b și avansează-i la fiecare pas.",
    explanation: [
      "Nu avem nevoie să memorăm tot șirul: la fiecare pas calculăm c <- a + b, apoi a <- b și b <- c.",
      "Este un exemplu clasic de „fereastră glisantă” peste un șir recurent.",
    ],
    solution: `citeste n\na <- 1\nb <- 1\npentru i <- 3, n executa\n  c <- a + b\n  a <- b\n  b <- c\nsfarsit pentru\ndaca n = 1 atunci\n  scrie a\naltfel\n  scrie b\nsfarsit daca`,
  },
  {
    slug: "numar-perfect",
    chapter: 2,
    title: "Număr perfect",
    difficulty: "mediu",
    statement:
      "Un număr este perfect dacă este egal cu suma divizorilor săi mai mici decât el (de exemplu 6 = 1 + 2 + 3). Se citește n. Afișați DA dacă n este perfect și NU în caz contrar.",
    inputFormat: "Un număr natural n ≥ 2.",
    outputFormat: "DA sau NU.",
    tests: ["6", "28", "12", "496"],
    hint: "Adună divizorii d de la 1 la n - 1, apoi compară suma cu n.",
    explanation: [
      "Problema combină două idei învățate: găsirea divizorilor și acumularea unei sume.",
      "Primele numere perfecte sunt 6, 28, 496 și 8128 — sunt foarte rare.",
    ],
    solution: `citeste n\ns <- 0\npentru d <- 1, n - 1 executa\n  daca n mod d = 0 atunci\n    s <- s + d\n  sfarsit daca\nsfarsit pentru\ndaca s = n atunci\n  scrie "DA"\naltfel\n  scrie "NU"\nsfarsit daca`,
  },
];

export const getPseudoProblem = (slug?: string) => pseudoProblems.find((p) => p.slug === slug);
