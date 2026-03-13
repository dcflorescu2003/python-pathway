export interface TestCase {
  input: string;
  expectedOutput: string;
  hidden?: boolean;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "ușor" | "mediu" | "greu";
  xpReward: number;
  testCases: TestCase[];
  hint?: string;
  chapter: string;
}

export interface ProblemChapter {
  id: string;
  title: string;
  icon: string;
}

export const problemChapters: ProblemChapter[] = [
  { id: "cap1", title: "Recapitulare & Fundamente", icon: "📘" },
  { id: "cap2", title: "Prelucrări Numerice", icon: "🔢" },
  { id: "cap3", title: "Liste", icon: "📋" },
  { id: "cap4", title: "Generare și Sortare", icon: "🔄" },
  { id: "cap5", title: "Subprograme", icon: "🧩" },
  { id: "cap6", title: "Fișiere și Interfețe", icon: "📂" },
];

export const problems: Problem[] = [
  // === Capitolul 1: Recapitulare & Fundamente ===
  {
    id: "sum-two",
    title: "Suma a două numere",
    description: `Se citesc două numere naturale **a** și **b**. Afișează suma lor.

**Intrare:** Două numere pe linii separate.
**Ieșire:** Suma celor două numere.

**Exemplu:**
\`\`\`
Intrare:
3
5
Ieșire:
8
\`\`\``,
    difficulty: "ușor",
    xpReward: 10,
    chapter: "cap1",
    testCases: [
      { input: "3\n5", expectedOutput: "8" },
      { input: "0\n0", expectedOutput: "0" },
      { input: "100\n200", expectedOutput: "300" },
      { input: "999\n1", expectedOutput: "1000" },
    ],
    hint: "Folosește input() pentru citire și print() pentru afișare.",
  },
  {
    id: "even-odd",
    title: "Par sau Impar",
    description: `Se citește un număr natural **n**. Afișează \`par\` dacă numărul este par, sau \`impar\` dacă este impar.

**Intrare:** Un număr natural.
**Ieșire:** \`par\` sau \`impar\`.

**Exemplu:**
\`\`\`
Intrare:
4
Ieșire:
par
\`\`\``,
    difficulty: "ușor",
    xpReward: 10,
    chapter: "cap1",
    testCases: [
      { input: "4", expectedOutput: "par" },
      { input: "7", expectedOutput: "impar" },
      { input: "0", expectedOutput: "par" },
      { input: "1", expectedOutput: "impar" },
      { input: "100", expectedOutput: "par", hidden: true },
    ],
    hint: "Folosește operatorul modulo (%) pentru a verifica paritatea.",
  },
  {
    id: "max-three",
    title: "Maximul a trei numere",
    description: `Se citesc trei numere întregi **a**, **b** și **c**. Afișează cel mai mare dintre ele.

**Intrare:** Trei numere pe linii separate.
**Ieșire:** Cel mai mare număr.

**Exemplu:**
\`\`\`
Intrare:
3
7
5
Ieșire:
7
\`\`\``,
    difficulty: "mediu",
    xpReward: 15,
    chapter: "cap1",
    testCases: [
      { input: "3\n7\n5", expectedOutput: "7" },
      { input: "10\n10\n10", expectedOutput: "10" },
      { input: "-1\n-5\n-3", expectedOutput: "-1" },
      { input: "100\n50\n75", expectedOutput: "100" },
    ],
    hint: "Poți folosi funcția max() sau comparații cu if/elif.",
  },

  // === Capitolul 2: Prelucrări Numerice ===
  {
    id: "digit-sum",
    title: "Suma cifrelor",
    description: `Se citește un număr natural **n**. Afișează suma cifrelor sale.

**Intrare:** Un număr natural.
**Ieșire:** Suma cifrelor.

**Exemplu:**
\`\`\`
Intrare:
1234
Ieșire:
10
\`\`\``,
    difficulty: "ușor",
    xpReward: 15,
    chapter: "cap2",
    testCases: [
      { input: "1234", expectedOutput: "10" },
      { input: "0", expectedOutput: "0" },
      { input: "9999", expectedOutput: "36" },
      { input: "100", expectedOutput: "1" },
      { input: "55", expectedOutput: "10", hidden: true },
    ],
    hint: "Extrage cifrele cu n % 10 și elimină ultima cifră cu n // 10.",
  },
  {
    id: "reverse-number",
    title: "Oglinditul unui număr",
    description: `Se citește un număr natural **n**. Afișează oglinditul său (inversul cifrelor).

**Intrare:** Un număr natural.
**Ieșire:** Numărul oglindit.

**Exemplu:**
\`\`\`
Intrare:
1234
Ieșire:
4321
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap2",
    testCases: [
      { input: "1234", expectedOutput: "4321" },
      { input: "100", expectedOutput: "1" },
      { input: "5", expectedOutput: "5" },
      { input: "9870", expectedOutput: "789" },
    ],
    hint: "Construiește numărul oglindit cifră cu cifră: oglindit = oglindit * 10 + n % 10.",
  },
  {
    id: "gcd",
    title: "CMMDC (Algoritmul lui Euclid)",
    description: `Se citesc două numere naturale **a** și **b**. Afișează cel mai mare divizor comun al lor.

**Intrare:** Două numere pe linii separate.
**Ieșire:** CMMDC-ul lor.

**Exemplu:**
\`\`\`
Intrare:
12
8
Ieșire:
4
\`\`\``,
    difficulty: "greu",
    xpReward: 25,
    chapter: "cap2",
    testCases: [
      { input: "12\n8", expectedOutput: "4" },
      { input: "7\n3", expectedOutput: "1" },
      { input: "100\n25", expectedOutput: "25" },
      { input: "17\n17", expectedOutput: "17" },
    ],
    hint: "Algoritmul lui Euclid: cât timp b != 0, a, b = b, a % b.",
  },

  // === Capitolul 3: Liste ===
  {
    id: "list-sum",
    title: "Suma elementelor unei liste",
    description: `Se citește un număr **n**, apoi **n** numere întregi. Afișează suma tuturor elementelor.

**Intrare:** Pe prima linie n, apoi n numere pe linii separate.
**Ieșire:** Suma elementelor.

**Exemplu:**
\`\`\`
Intrare:
4
3
7
2
8
Ieșire:
20
\`\`\``,
    difficulty: "ușor",
    xpReward: 15,
    chapter: "cap3",
    testCases: [
      { input: "4\n3\n7\n2\n8", expectedOutput: "20" },
      { input: "1\n5", expectedOutput: "5" },
      { input: "3\n0\n0\n0", expectedOutput: "0" },
      { input: "5\n-1\n2\n-3\n4\n-2", expectedOutput: "0", hidden: true },
    ],
    hint: "Citește numerele într-o listă, apoi folosește sum().",
  },
  {
    id: "list-max",
    title: "Maximul dintr-o listă",
    description: `Se citește un număr **n**, apoi **n** numere întregi. Afișează cel mai mare element.

**Intrare:** Pe prima linie n, apoi n numere pe linii separate.
**Ieșire:** Elementul maxim.

**Exemplu:**
\`\`\`
Intrare:
5
3
9
1
7
4
Ieșire:
9
\`\`\``,
    difficulty: "ușor",
    xpReward: 15,
    chapter: "cap3",
    testCases: [
      { input: "5\n3\n9\n1\n7\n4", expectedOutput: "9" },
      { input: "1\n42", expectedOutput: "42" },
      { input: "3\n-5\n-1\n-8", expectedOutput: "-1" },
      { input: "4\n10\n10\n10\n10", expectedOutput: "10", hidden: true },
    ],
    hint: "Citește numerele într-o listă, apoi folosește max().",
  },
  {
    id: "frequency-list",
    title: "Lista de frecvențe",
    description: `Se citesc **n** numere naturale între 0 și 9. Afișează frecvența fiecărei cifre care apare cel puțin o dată, în ordine crescătoare a cifrei, în formatul \`cifra:frecventa\`, separate prin spațiu.

**Intrare:** Pe prima linie n, apoi n numere pe linii separate.
**Ieșire:** Frecvențele, separate prin spațiu.

**Exemplu:**
\`\`\`
Intrare:
7
3
1
3
2
1
1
5
Ieșire:
1:3 2:1 3:2 5:1
\`\`\``,
    difficulty: "mediu",
    xpReward: 25,
    chapter: "cap3",
    testCases: [
      { input: "7\n3\n1\n3\n2\n1\n1\n5", expectedOutput: "1:3 2:1 3:2 5:1" },
      { input: "3\n0\n0\n0", expectedOutput: "0:3" },
      { input: "5\n9\n8\n7\n6\n5", expectedOutput: "5:1 6:1 7:1 8:1 9:1" },
      { input: "1\n4", expectedOutput: "4:1", hidden: true },
    ],
    hint: "Creează o listă de 10 elemente (index 0-9), incrementează la fiecare apariție.",
  },

  // === Capitolul 4: Generare și Sortare ===
  {
    id: "fibonacci",
    title: "Al n-lea termen Fibonacci",
    description: `Se citește un număr natural **n**. Afișează al **n**-lea termen din șirul Fibonacci (F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2)).

**Intrare:** Un număr natural n.
**Ieșire:** F(n).

**Exemplu:**
\`\`\`
Intrare:
6
Ieșire:
8
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap4",
    testCases: [
      { input: "6", expectedOutput: "8" },
      { input: "0", expectedOutput: "0" },
      { input: "1", expectedOutput: "1" },
      { input: "10", expectedOutput: "55" },
      { input: "20", expectedOutput: "6765", hidden: true },
    ],
    hint: "Folosește două variabile a și b, actualizate iterativ.",
  },
  {
    id: "sort-list",
    title: "Sortare crescătoare",
    description: `Se citește un număr **n**, apoi **n** numere întregi. Afișează numerele sortate crescător, separate prin spațiu.

**Intrare:** Pe prima linie n, apoi n numere pe linii separate.
**Ieșire:** Numerele sortate, separate prin spațiu.

**Exemplu:**
\`\`\`
Intrare:
5
3
1
4
1
5
Ieșire:
1 1 3 4 5
\`\`\``,
    difficulty: "mediu",
    xpReward: 25,
    chapter: "cap4",
    testCases: [
      { input: "5\n3\n1\n4\n1\n5", expectedOutput: "1 1 3 4 5" },
      { input: "3\n9\n2\n7", expectedOutput: "2 7 9" },
      { input: "1\n42", expectedOutput: "42" },
      { input: "4\n-3\n0\n5\n-1", expectedOutput: "-3 -1 0 5", hidden: true },
    ],
    hint: "Citește numerele într-o listă, apoi folosește sort() sau implementează bubble sort.",
  },
  {
    id: "selection-sort-steps",
    title: "Sortare prin selecție – pași",
    description: `Se citește un număr **n**, apoi **n** numere întregi. Aplică sortarea prin selecția minimului și afișează lista după fiecare pas (interschimbare), câte o linie.

**Intrare:** Pe prima linie n, apoi n numere pe linii separate.
**Ieșire:** Lista după fiecare pas, elementele separate prin spațiu.

**Exemplu:**
\`\`\`
Intrare:
4
4
2
3
1
Ieșire:
1 2 3 4
1 2 3 4
1 2 3 4
\`\`\``,
    difficulty: "greu",
    xpReward: 30,
    chapter: "cap4",
    testCases: [
      { input: "4\n4\n2\n3\n1", expectedOutput: "1 2 3 4\n1 2 3 4\n1 2 3 4" },
      { input: "3\n3\n1\n2", expectedOutput: "1 3 2\n1 2 3" },
      { input: "2\n2\n1", expectedOutput: "1 2" },
    ],
    hint: "La fiecare pas i, găsește minimul din sublista [i:] și interschimbă cu elementul de pe poziția i.",
  },

  // === Capitolul 5: Subprograme ===
  {
    id: "is-prime-func",
    title: "Funcție – Verificare prim",
    description: `Se citește un număr natural **n** (n ≥ 2). Scrie o funcție \`este_prim(n)\` care returnează True dacă n este prim. Afișează \`da\` sau \`nu\`.

**Intrare:** Un număr natural ≥ 2.
**Ieșire:** \`da\` sau \`nu\`.

**Exemplu:**
\`\`\`
Intrare:
7
Ieșire:
da
\`\`\``,
    difficulty: "ușor",
    xpReward: 15,
    chapter: "cap5",
    testCases: [
      { input: "7", expectedOutput: "da" },
      { input: "4", expectedOutput: "nu" },
      { input: "2", expectedOutput: "da" },
      { input: "15", expectedOutput: "nu" },
      { input: "97", expectedOutput: "da", hidden: true },
    ],
    hint: "Verifică dacă n are vreun divizor între 2 și √n.",
  },
  {
    id: "factorial-func",
    title: "Funcție – Factorial",
    description: `Se citește un număr natural **n**. Scrie o funcție \`factorial(n)\` și afișează rezultatul.

**Intrare:** Un număr natural n (0 ≤ n ≤ 20).
**Ieșire:** n! (factorial de n).

**Exemplu:**
\`\`\`
Intrare:
5
Ieșire:
120
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap5",
    testCases: [
      { input: "5", expectedOutput: "120" },
      { input: "0", expectedOutput: "1" },
      { input: "1", expectedOutput: "1" },
      { input: "10", expectedOutput: "3628800" },
      { input: "20", expectedOutput: "2432902008176640000", hidden: true },
    ],
    hint: "Factorial: f(0) = 1, f(n) = n * f(n-1). Poți folosi recursie sau iterativ.",
  },
  {
    id: "power-func",
    title: "Funcție – Putere",
    description: `Se citesc două numere naturale **baza** și **exp**. Scrie o funcție \`putere(baza, exp)\` care calculează baza^exp fără a folosi ** sau pow(). Afișează rezultatul.

**Intrare:** Două numere pe linii separate.
**Ieșire:** baza la puterea exp.

**Exemplu:**
\`\`\`
Intrare:
2
10
Ieșire:
1024
\`\`\``,
    difficulty: "greu",
    xpReward: 25,
    chapter: "cap5",
    testCases: [
      { input: "2\n10", expectedOutput: "1024" },
      { input: "5\n0", expectedOutput: "1" },
      { input: "3\n4", expectedOutput: "81" },
      { input: "7\n3", expectedOutput: "343", hidden: true },
    ],
    hint: "Înmulțește baza de exp ori într-o buclă for.",
  },

  // === Capitolul 6: Fișiere și Interfețe ===
  {
    id: "word-count",
    title: "Numără cuvintele",
    description: `Se citește un text pe o singură linie. Afișează numărul de cuvinte (separate prin spații).

**Intrare:** O linie de text.
**Ieșire:** Numărul de cuvinte.

**Exemplu:**
\`\`\`
Intrare:
Python este un limbaj frumos
Ieșire:
5
\`\`\``,
    difficulty: "ușor",
    xpReward: 15,
    chapter: "cap6",
    testCases: [
      { input: "Python este un limbaj frumos", expectedOutput: "5" },
      { input: "salut", expectedOutput: "1" },
      { input: "a b c d e f", expectedOutput: "6" },
      { input: "  spatii   multiple  ", expectedOutput: "2", hidden: true },
    ],
    hint: "Folosește split() pentru a împărți textul în cuvinte, apoi len().",
  },
  {
    id: "char-frequency",
    title: "Frecvența caracterelor",
    description: `Se citește un cuvânt format doar din litere mici. Afișează fiecare literă unică și frecvența ei, în ordinea primei apariții, în formatul \`litera:frecventa\`, separate prin spațiu.

**Intrare:** Un cuvânt (litere mici, fără spații).
**Ieșire:** Frecvențele, separate prin spațiu.

**Exemplu:**
\`\`\`
Intrare:
banana
Ieșire:
b:1 a:3 n:2
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap6",
    testCases: [
      { input: "banana", expectedOutput: "b:1 a:3 n:2" },
      { input: "abc", expectedOutput: "a:1 b:1 c:1" },
      { input: "aaa", expectedOutput: "a:3" },
      { input: "programare", expectedOutput: "p:1 r:3 o:1 g:1 a:2 m:1 e:1", hidden: true },
    ],
    hint: "Parcurge șirul și folosește un dicționar pentru frecvențe. Păstrează ordinea primei apariții.",
  },
  {
    id: "csv-parse",
    title: "Parsare date CSV",
    description: `Se citesc **n+1** linii: prima linie conține header-ul (ignorat), următoarele n linii conțin date în format CSV (separate prin virgulă): \`nume,nota\`. Afișează media notelor, rotunjită la 2 zecimale.

**Intrare:** Pe prima linie n+1 (numărul total de linii), apoi header-ul, apoi n linii de date.
**Ieșire:** Media notelor (2 zecimale).

**Exemplu:**
\`\`\`
Intrare:
4
nume,nota
Ana,9
Ion,7
Maria,10
Ieșire:
8.67
\`\`\``,
    difficulty: "greu",
    xpReward: 30,
    chapter: "cap6",
    testCases: [
      { input: "4\nnume,nota\nAna,9\nIon,7\nMaria,10", expectedOutput: "8.67" },
      { input: "3\nnume,nota\nA,10\nB,10", expectedOutput: "10.00" },
      { input: "2\nnume,nota\nX,5", expectedOutput: "5.00" },
    ],
    hint: "Ignoră prima linie (header), apoi split(',') pe fiecare linie și extrage nota.",
  },
];
