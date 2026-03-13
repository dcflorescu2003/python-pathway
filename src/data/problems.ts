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
  chapter?: string;
}

export const problems: Problem[] = [
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
    chapter: "Capitolul 1",
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
    chapter: "Capitolul 1",
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
    difficulty: "ușor",
    xpReward: 15,
    chapter: "Capitolul 1",
    testCases: [
      { input: "3\n7\n5", expectedOutput: "7" },
      { input: "10\n10\n10", expectedOutput: "10" },
      { input: "-1\n-5\n-3", expectedOutput: "-1" },
      { input: "100\n50\n75", expectedOutput: "100" },
    ],
    hint: "Poți folosi funcția max() sau comparații cu if/elif.",
  },
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
    difficulty: "mediu",
    xpReward: 20,
    chapter: "Capitolul 2",
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
    chapter: "Capitolul 2",
    testCases: [
      { input: "1234", expectedOutput: "4321" },
      { input: "100", expectedOutput: "1" },
      { input: "5", expectedOutput: "5" },
      { input: "9870", expectedOutput: "789" },
    ],
    hint: "Construiește numărul oglindit cifră cu cifră: oglindit = oglindit * 10 + n % 10.",
  },
  {
    id: "is-prime",
    title: "Verificare număr prim",
    description: `Se citește un număr natural **n** (n ≥ 2). Afișează \`da\` dacă numărul este prim, sau \`nu\` în caz contrar.

**Intrare:** Un număr natural ≥ 2.
**Ieșire:** \`da\` sau \`nu\`.

**Exemplu:**
\`\`\`
Intrare:
7
Ieșire:
da
\`\`\``,
    difficulty: "mediu",
    xpReward: 25,
    chapter: "Capitolul 2",
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
    difficulty: "mediu",
    xpReward: 25,
    chapter: "Capitolul 2",
    testCases: [
      { input: "12\n8", expectedOutput: "4" },
      { input: "7\n3", expectedOutput: "1" },
      { input: "100\n25", expectedOutput: "25" },
      { input: "17\n17", expectedOutput: "17" },
    ],
    hint: "Algoritmul lui Euclid: cât timp b != 0, a, b = b, a % b.",
  },
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
    difficulty: "greu",
    xpReward: 30,
    chapter: "Capitolul 4",
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
    difficulty: "greu",
    xpReward: 30,
    chapter: "Capitolul 4",
    testCases: [
      { input: "5\n3\n1\n4\n1\n5", expectedOutput: "1 1 3 4 5" },
      { input: "3\n9\n2\n7", expectedOutput: "2 7 9" },
      { input: "1\n42", expectedOutput: "42" },
      { input: "4\n-3\n0\n5\n-1", expectedOutput: "-3 -1 0 5", hidden: true },
    ],
    hint: "Citește numerele într-o listă, apoi folosește sort() sau implementează bubble sort.",
  },
];
