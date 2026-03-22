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
  solution: string;
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
  // =============================================
  // === Capitolul 1: Recapitulare & Fundamente ===
  // =============================================
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
    solution: `a = int(input())
b = int(input())
print(a + b)`,
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
    solution: `n = int(input())
if n % 2 == 0:
    print("par")
else:
    print("impar")`,
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
    solution: `a = int(input())
b = int(input())
c = int(input())
print(max(a, b, c))`,
  },
  // --- Cap1 new problems ---
  {
    id: "absolute-value",
    title: "Valoarea absolută",
    description: `Se citește un număr întreg **n**. Afișează valoarea sa absolută, fără a folosi funcția abs().

**Intrare:** Un număr întreg.
**Ieșire:** Valoarea absolută.

**Exemplu:**
\`\`\`
Intrare:
-5
Ieșire:
5
\`\`\``,
    difficulty: "ușor",
    xpReward: 10,
    chapter: "cap1",
    testCases: [
      { input: "-5", expectedOutput: "5" },
      { input: "3", expectedOutput: "3" },
      { input: "0", expectedOutput: "0" },
      { input: "-100", expectedOutput: "100", hidden: true },
    ],
    hint: "Dacă n < 0, afișează -n, altfel afișează n.",
    solution: `n = int(input())
if n < 0:
    print(-n)
else:
    print(n)`,
  },
  {
    id: "swap-numbers",
    title: "Interschimbă două numere",
    description: `Se citesc două numere întregi **a** și **b**. Afișează-le în ordine inversă, pe linii separate.

**Intrare:** Două numere pe linii separate.
**Ieșire:** Cele două numere interschimbate, pe linii separate.

**Exemplu:**
\`\`\`
Intrare:
3
7
Ieșire:
7
3
\`\`\``,
    difficulty: "ușor",
    xpReward: 10,
    chapter: "cap1",
    testCases: [
      { input: "3\n7", expectedOutput: "7\n3" },
      { input: "0\n0", expectedOutput: "0\n0" },
      { input: "-1\n5", expectedOutput: "5\n-1" },
      { input: "100\n200", expectedOutput: "200\n100", hidden: true },
    ],
    hint: "Citește ambele numere, apoi afișează-le în ordine inversă.",
    solution: `a = int(input())
b = int(input())
print(b)
print(a)`,
  },
  {
    id: "min-two",
    title: "Minimul a două numere",
    description: `Se citesc două numere întregi **a** și **b**. Afișează cel mai mic dintre ele, fără a folosi funcția min().

**Intrare:** Două numere pe linii separate.
**Ieșire:** Cel mai mic număr.

**Exemplu:**
\`\`\`
Intrare:
8
3
Ieșire:
3
\`\`\``,
    difficulty: "ușor",
    xpReward: 10,
    chapter: "cap1",
    testCases: [
      { input: "8\n3", expectedOutput: "3" },
      { input: "5\n5", expectedOutput: "5" },
      { input: "-2\n-7", expectedOutput: "-7" },
      { input: "0\n1", expectedOutput: "0", hidden: true },
    ],
    hint: "Compară cele două numere cu if/else.",
    solution: `a = int(input())
b = int(input())
if a < b:
    print(a)
else:
    print(b)`,
  },
  {
    id: "divisibility-check",
    title: "Verificare divisibilitate",
    description: `Se citesc două numere naturale **a** și **b** (b ≠ 0). Afișează \`da\` dacă a este divisibil cu b, altfel \`nu\`.

**Intrare:** Două numere pe linii separate.
**Ieșire:** \`da\` sau \`nu\`.

**Exemplu:**
\`\`\`
Intrare:
12
4
Ieșire:
da
\`\`\``,
    difficulty: "ușor",
    xpReward: 10,
    chapter: "cap1",
    testCases: [
      { input: "12\n4", expectedOutput: "da" },
      { input: "7\n3", expectedOutput: "nu" },
      { input: "0\n5", expectedOutput: "da" },
      { input: "100\n10", expectedOutput: "da", hidden: true },
    ],
    hint: "Folosește operatorul modulo: a % b == 0.",
    solution: `a = int(input())
b = int(input())
if a % b == 0:
    print("da")
else:
    print("nu")`,
  },
  {
    id: "last-digit",
    title: "Ultima cifră",
    description: `Se citește un număr natural **n**. Afișează ultima sa cifră.

**Intrare:** Un număr natural.
**Ieșire:** Ultima cifră.

**Exemplu:**
\`\`\`
Intrare:
1234
Ieșire:
4
\`\`\``,
    difficulty: "ușor",
    xpReward: 10,
    chapter: "cap1",
    testCases: [
      { input: "1234", expectedOutput: "4" },
      { input: "0", expectedOutput: "0" },
      { input: "7", expectedOutput: "7" },
      { input: "990", expectedOutput: "0", hidden: true },
    ],
    hint: "Ultima cifră se obține cu n % 10.",
    solution: `n = int(input())
print(n % 10)`,
  },
  {
    id: "digit-count",
    title: "Numărul de cifre",
    description: `Se citește un număr natural **n** (n ≥ 1). Afișează câte cifre are.

**Intrare:** Un număr natural ≥ 1.
**Ieșire:** Numărul de cifre.

**Exemplu:**
\`\`\`
Intrare:
12345
Ieșire:
5
\`\`\``,
    difficulty: "mediu",
    xpReward: 15,
    chapter: "cap1",
    testCases: [
      { input: "12345", expectedOutput: "5" },
      { input: "7", expectedOutput: "1" },
      { input: "100", expectedOutput: "3" },
      { input: "9999999", expectedOutput: "7", hidden: true },
    ],
    hint: "Împarte numărul la 10 repetitiv până devine 0 și numără pașii.",
    solution: `n = int(input())
count = 0
while n > 0:
    count += 1
    n //= 10
print(count)`,
  },
  {
    id: "number-sign",
    title: "Semnul numărului",
    description: `Se citește un număr întreg **n**. Afișează \`pozitiv\`, \`negativ\` sau \`zero\`.

**Intrare:** Un număr întreg.
**Ieșire:** \`pozitiv\`, \`negativ\` sau \`zero\`.

**Exemplu:**
\`\`\`
Intrare:
-3
Ieșire:
negativ
\`\`\``,
    difficulty: "ușor",
    xpReward: 10,
    chapter: "cap1",
    testCases: [
      { input: "-3", expectedOutput: "negativ" },
      { input: "5", expectedOutput: "pozitiv" },
      { input: "0", expectedOutput: "zero" },
      { input: "-100", expectedOutput: "negativ", hidden: true },
    ],
    hint: "Folosește if/elif/else pentru cele trei cazuri.",
    solution: `n = int(input())
if n > 0:
    print("pozitiv")
elif n < 0:
    print("negativ")
else:
    print("zero")`,
  },

  // =============================================
  // === Capitolul 2: Prelucrări Numerice ===
  // =============================================
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
    solution: `n = int(input())
s = 0
while n > 0:
    s += n % 10
    n //= 10
print(s)`,
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
    solution: `n = int(input())
og = 0
while n > 0:
    og = og * 10 + n % 10
    n //= 10
print(og)`,
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
    solution: `a = int(input())
b = int(input())
while b != 0:
    a, b = b, a % b
print(a)`,
  },
  // --- Cap2 new problems ---
  {
    id: "palindrome-number",
    title: "Număr palindrom",
    description: `Se citește un număr natural **n**. Afișează \`da\` dacă este palindrom (citit de la stânga la dreapta este la fel ca de la dreapta la stânga), altfel \`nu\`.

**Intrare:** Un număr natural.
**Ieșire:** \`da\` sau \`nu\`.

**Exemplu:**
\`\`\`
Intrare:
12321
Ieșire:
da
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap2",
    testCases: [
      { input: "12321", expectedOutput: "da" },
      { input: "123", expectedOutput: "nu" },
      { input: "7", expectedOutput: "da" },
      { input: "1001", expectedOutput: "da" },
      { input: "10", expectedOutput: "nu", hidden: true },
    ],
    hint: "Calculează oglinditul și compară cu originalul.",
    solution: `n = int(input())
original = n
og = 0
while n > 0:
    og = og * 10 + n % 10
    n //= 10
if og == original:
    print("da")
else:
    print("nu")`,
  },
  {
    id: "count-digits-num",
    title: "Numără cifrele pare",
    description: `Se citește un număr natural **n**. Afișează câte cifre pare are.

**Intrare:** Un număr natural.
**Ieșire:** Numărul de cifre pare.

**Exemplu:**
\`\`\`
Intrare:
24680
Ieșire:
5
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap2",
    testCases: [
      { input: "24680", expectedOutput: "5" },
      { input: "13579", expectedOutput: "0" },
      { input: "123456", expectedOutput: "3" },
      { input: "0", expectedOutput: "1" },
      { input: "2", expectedOutput: "1", hidden: true },
    ],
    hint: "Extrage fiecare cifră și verifică dacă e pară.",
    solution: `n = int(input())
if n == 0:
    print(1)
else:
    count = 0
    while n > 0:
        if (n % 10) % 2 == 0:
            count += 1
        n //= 10
    print(count)`,
  },
  {
    id: "first-digit",
    title: "Prima cifră",
    description: `Se citește un număr natural **n** (n ≥ 1). Afișează prima sa cifră (cea mai semnificativă).

**Intrare:** Un număr natural ≥ 1.
**Ieșire:** Prima cifră.

**Exemplu:**
\`\`\`
Intrare:
5432
Ieșire:
5
\`\`\``,
    difficulty: "ușor",
    xpReward: 15,
    chapter: "cap2",
    testCases: [
      { input: "5432", expectedOutput: "5" },
      { input: "7", expectedOutput: "7" },
      { input: "100", expectedOutput: "1" },
      { input: "999", expectedOutput: "9", hidden: true },
    ],
    hint: "Împarte la 10 până rămâne o singură cifră.",
    solution: `n = int(input())
while n >= 10:
    n //= 10
print(n)`,
  },
  {
    id: "perfect-square",
    title: "Pătrat perfect",
    description: `Se citește un număr natural **n**. Afișează \`da\` dacă este pătrat perfect, altfel \`nu\`.

**Intrare:** Un număr natural.
**Ieșire:** \`da\` sau \`nu\`.

**Exemplu:**
\`\`\`
Intrare:
16
Ieșire:
da
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap2",
    testCases: [
      { input: "16", expectedOutput: "da" },
      { input: "15", expectedOutput: "nu" },
      { input: "0", expectedOutput: "da" },
      { input: "1", expectedOutput: "da" },
      { input: "144", expectedOutput: "da", hidden: true },
    ],
    hint: "Calculează radicalul și verifică dacă ridicat la pătrat dă n.",
    solution: `n = int(input())
i = 0
while i * i < n:
    i += 1
if i * i == n:
    print("da")
else:
    print("nu")`,
  },
  {
    id: "divisor-count",
    title: "Numărul de divizori",
    description: `Se citește un număr natural **n** (n ≥ 1). Afișează câți divizori are.

**Intrare:** Un număr natural ≥ 1.
**Ieșire:** Numărul de divizori.

**Exemplu:**
\`\`\`
Intrare:
12
Ieșire:
6
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap2",
    testCases: [
      { input: "12", expectedOutput: "6" },
      { input: "1", expectedOutput: "1" },
      { input: "7", expectedOutput: "2" },
      { input: "100", expectedOutput: "9", hidden: true },
    ],
    hint: "Parcurge de la 1 la n și numără câte numere îl divid pe n.",
    solution: `n = int(input())
count = 0
for i in range(1, n + 1):
    if n % i == 0:
        count += 1
print(count)`,
  },
  {
    id: "digit-product",
    title: "Produsul cifrelor",
    description: `Se citește un număr natural **n** (n ≥ 1). Afișează produsul cifrelor sale.

**Intrare:** Un număr natural ≥ 1.
**Ieșire:** Produsul cifrelor.

**Exemplu:**
\`\`\`
Intrare:
234
Ieșire:
24
\`\`\``,
    difficulty: "ușor",
    xpReward: 15,
    chapter: "cap2",
    testCases: [
      { input: "234", expectedOutput: "24" },
      { input: "5", expectedOutput: "5" },
      { input: "100", expectedOutput: "0" },
      { input: "111", expectedOutput: "1", hidden: true },
    ],
    hint: "Similar cu suma cifrelor, dar înmulțești în loc să aduni.",
    solution: `n = int(input())
p = 1
while n > 0:
    p *= n % 10
    n //= 10
print(p)`,
  },
  {
    id: "power-of-two",
    title: "Putere a lui 2",
    description: `Se citește un număr natural **n** (n ≥ 1). Afișează \`da\` dacă n este o putere a lui 2, altfel \`nu\`.

**Intrare:** Un număr natural ≥ 1.
**Ieșire:** \`da\` sau \`nu\`.

**Exemplu:**
\`\`\`
Intrare:
8
Ieșire:
da
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap2",
    testCases: [
      { input: "8", expectedOutput: "da" },
      { input: "6", expectedOutput: "nu" },
      { input: "1", expectedOutput: "da" },
      { input: "1024", expectedOutput: "da" },
      { input: "12", expectedOutput: "nu", hidden: true },
    ],
    hint: "Împarte la 2 cât timp e par. Dacă ajungi la 1, e putere a lui 2.",
    solution: `n = int(input())
while n > 1:
    if n % 2 != 0:
        print("nu")
        break
    n //= 2
else:
    print("da")`,
  },

  // =============================================
  // === Capitolul 3: Liste ===
  // =============================================
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
    solution: `n = int(input())
lst = []
for _ in range(n):
    lst.append(int(input()))
print(sum(lst))`,
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
    solution: `n = int(input())
lst = []
for _ in range(n):
    lst.append(int(input()))
print(max(lst))`,
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
    solution: `n = int(input())
freq = [0] * 10
for _ in range(n):
    x = int(input())
    freq[x] += 1
parts = []
for i in range(10):
    if freq[i] > 0:
        parts.append(f"{i}:{freq[i]}")
print(" ".join(parts))`,
  },
  // --- Cap3 new problems ---
  {
    id: "count-evens",
    title: "Numără elementele pare",
    description: `Se citește un număr **n**, apoi **n** numere întregi. Afișează câte numere pare sunt.

**Intrare:** Pe prima linie n, apoi n numere pe linii separate.
**Ieșire:** Numărul de elemente pare.

**Exemplu:**
\`\`\`
Intrare:
5
1
2
3
4
5
Ieșire:
2
\`\`\``,
    difficulty: "ușor",
    xpReward: 15,
    chapter: "cap3",
    testCases: [
      { input: "5\n1\n2\n3\n4\n5", expectedOutput: "2" },
      { input: "3\n1\n3\n5", expectedOutput: "0" },
      { input: "4\n2\n4\n6\n8", expectedOutput: "4" },
      { input: "1\n0", expectedOutput: "1", hidden: true },
    ],
    hint: "Parcurge lista și numără elementele cu rest 0 la împărțirea la 2.",
    solution: `n = int(input())
count = 0
for _ in range(n):
    x = int(input())
    if x % 2 == 0:
        count += 1
print(count)`,
  },
  {
    id: "second-max",
    title: "Al doilea maxim",
    description: `Se citește un număr **n** (n ≥ 2), apoi **n** numere întregi distincte. Afișează al doilea cel mai mare element.

**Intrare:** Pe prima linie n, apoi n numere pe linii separate.
**Ieșire:** Al doilea maxim.

**Exemplu:**
\`\`\`
Intrare:
4
3
9
1
7
Ieșire:
7
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap3",
    testCases: [
      { input: "4\n3\n9\n1\n7", expectedOutput: "7" },
      { input: "2\n5\n3", expectedOutput: "3" },
      { input: "5\n-1\n-5\n-3\n-2\n-4", expectedOutput: "-2" },
      { input: "3\n100\n50\n75", expectedOutput: "75", hidden: true },
    ],
    hint: "Sortează lista descrescător și ia al doilea element, sau parcurge și ține primele două maxime.",
    solution: `n = int(input())
lst = []
for _ in range(n):
    lst.append(int(input()))
lst.sort(reverse=True)
print(lst[1])`,
  },
  {
    id: "list-average",
    title: "Media elementelor",
    description: `Se citește un număr **n**, apoi **n** numere întregi. Afișează media aritmetică, rotunjită la 2 zecimale.

**Intrare:** Pe prima linie n, apoi n numere pe linii separate.
**Ieșire:** Media rotunjită la 2 zecimale.

**Exemplu:**
\`\`\`
Intrare:
4
3
7
2
8
Ieșire:
5.00
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap3",
    testCases: [
      { input: "4\n3\n7\n2\n8", expectedOutput: "5.00" },
      { input: "3\n1\n2\n3", expectedOutput: "2.00" },
      { input: "2\n5\n6", expectedOutput: "5.50" },
      { input: "5\n1\n1\n1\n1\n1", expectedOutput: "1.00", hidden: true },
    ],
    hint: "Calculează suma și împarte la n. Formatează cu f'{media:.2f}'.",
    solution: `n = int(input())
lst = []
for _ in range(n):
    lst.append(int(input()))
media = sum(lst) / n
print(f"{media:.2f}")`,
  },
  {
    id: "remove-duplicates",
    title: "Elimină duplicatele",
    description: `Se citește un număr **n**, apoi **n** numere întregi. Afișează elementele unice, în ordinea primei apariții, separate prin spațiu.

**Intrare:** Pe prima linie n, apoi n numere pe linii separate.
**Ieșire:** Elementele unice, separate prin spațiu.

**Exemplu:**
\`\`\`
Intrare:
6
3
1
3
2
1
5
Ieșire:
3 1 2 5
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap3",
    testCases: [
      { input: "6\n3\n1\n3\n2\n1\n5", expectedOutput: "3 1 2 5" },
      { input: "3\n1\n1\n1", expectedOutput: "1" },
      { input: "4\n4\n3\n2\n1", expectedOutput: "4 3 2 1" },
      { input: "5\n5\n5\n5\n5\n5", expectedOutput: "5", hidden: true },
    ],
    hint: "Parcurge lista și adaugă într-o nouă listă doar dacă elementul nu a fost deja adăugat.",
    solution: `n = int(input())
lst = []
for _ in range(n):
    lst.append(int(input()))
seen = []
for x in lst:
    if x not in seen:
        seen.append(x)
print(" ".join(str(x) for x in seen))`,
  },
  {
    id: "list-intersection",
    title: "Intersecția a două liste",
    description: `Se citesc două liste de numere. Prima linie: n, apoi n numere. Apoi m, apoi m numere. Afișează elementele comune (fără duplicate), în ordine crescătoare, separate prin spațiu. Dacă nu sunt elemente comune, afișează \`gol\`.

**Intrare:** n, apoi n numere, apoi m, apoi m numere.
**Ieșire:** Elementele comune sortate, sau \`gol\`.

**Exemplu:**
\`\`\`
Intrare:
4
1
2
3
4
3
2
4
6
Ieșire:
2 4
\`\`\``,
    difficulty: "greu",
    xpReward: 25,
    chapter: "cap3",
    testCases: [
      { input: "4\n1\n2\n3\n4\n3\n2\n4\n6", expectedOutput: "2 4" },
      { input: "2\n1\n2\n2\n3\n4", expectedOutput: "gol" },
      { input: "3\n5\n5\n5\n3\n5\n5\n5", expectedOutput: "5" },
      { input: "3\n1\n2\n3\n3\n1\n2\n3", expectedOutput: "1 2 3", hidden: true },
    ],
    hint: "Folosește set-uri pentru a găsi intersecția, apoi sortează rezultatul.",
    solution: `n = int(input())
a = set()
for _ in range(n):
    a.add(int(input()))
m = int(input())
b = set()
for _ in range(m):
    b.add(int(input()))
common = sorted(a & b)
if common:
    print(" ".join(str(x) for x in common))
else:
    print("gol")`,
  },
  {
    id: "rotate-list",
    title: "Rotire listă la stânga",
    description: `Se citesc **n** numere, apoi un număr **k**. Rotește lista la stânga cu **k** poziții și afișează rezultatul, elementele separate prin spațiu.

**Intrare:** Pe prima linie n, apoi n numere, apoi k.
**Ieșire:** Lista rotită, separată prin spațiu.

**Exemplu:**
\`\`\`
Intrare:
5
1
2
3
4
5
2
Ieșire:
3 4 5 1 2
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap3",
    testCases: [
      { input: "5\n1\n2\n3\n4\n5\n2", expectedOutput: "3 4 5 1 2" },
      { input: "4\n10\n20\n30\n40\n1", expectedOutput: "20 30 40 10" },
      { input: "3\n1\n2\n3\n3", expectedOutput: "1 2 3" },
      { input: "3\n1\n2\n3\n0", expectedOutput: "1 2 3", hidden: true },
    ],
    hint: "Rotirea cu k poziții: lst[k:] + lst[:k]. Nu uita k = k % n.",
    solution: `n = int(input())
lst = []
for _ in range(n):
    lst.append(int(input()))
k = int(input())
k = k % n
result = lst[k:] + lst[:k]
print(" ".join(str(x) for x in result))`,
  },
  {
    id: "count-negatives",
    title: "Numără negativele",
    description: `Se citește un număr **n**, apoi **n** numere întregi. Afișează câte numere negative sunt.

**Intrare:** Pe prima linie n, apoi n numere pe linii separate.
**Ieșire:** Numărul de elemente negative.

**Exemplu:**
\`\`\`
Intrare:
5
-3
4
-1
0
-7
Ieșire:
3
\`\`\``,
    difficulty: "ușor",
    xpReward: 15,
    chapter: "cap3",
    testCases: [
      { input: "5\n-3\n4\n-1\n0\n-7", expectedOutput: "3" },
      { input: "3\n1\n2\n3", expectedOutput: "0" },
      { input: "4\n-1\n-2\n-3\n-4", expectedOutput: "4" },
      { input: "1\n0", expectedOutput: "0", hidden: true },
    ],
    hint: "Parcurge lista și numără elementele mai mici decât 0.",
    solution: `n = int(input())
count = 0
for _ in range(n):
    x = int(input())
    if x < 0:
        count += 1
print(count)`,
  },

  // =============================================
  // === Capitolul 4: Generare și Sortare ===
  // =============================================
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
    solution: `n = int(input())
a, b = 0, 1
for _ in range(n):
    a, b = b, a + b
print(a)`,
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
    solution: `n = int(input())
lst = []
for _ in range(n):
    lst.append(int(input()))
lst.sort()
print(" ".join(str(x) for x in lst))`,
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
    solution: `n = int(input())
lst = []
for _ in range(n):
    lst.append(int(input()))
for i in range(n - 1):
    min_idx = i
    for j in range(i + 1, n):
        if lst[j] < lst[min_idx]:
            min_idx = j
    lst[i], lst[min_idx] = lst[min_idx], lst[i]
    print(" ".join(str(x) for x in lst))`,
  },
  // --- Cap4 new problems ---
  {
    id: "generate-evens",
    title: "Generează numere pare",
    description: `Se citește un număr natural **n**. Afișează primele **n** numere pare (începând de la 2), separate prin spațiu.

**Intrare:** Un număr natural n.
**Ieșire:** Primele n numere pare, separate prin spațiu.

**Exemplu:**
\`\`\`
Intrare:
5
Ieșire:
2 4 6 8 10
\`\`\``,
    difficulty: "ușor",
    xpReward: 15,
    chapter: "cap4",
    testCases: [
      { input: "5", expectedOutput: "2 4 6 8 10" },
      { input: "1", expectedOutput: "2" },
      { input: "3", expectedOutput: "2 4 6" },
      { input: "10", expectedOutput: "2 4 6 8 10 12 14 16 18 20", hidden: true },
    ],
    hint: "Generează numere de la 2 la 2*n, din 2 în 2.",
    solution: `n = int(input())
result = []
for i in range(1, n + 1):
    result.append(str(i * 2))
print(" ".join(result))`,
  },
  {
    id: "merge-sorted",
    title: "Interclasare liste sortate",
    description: `Se citesc două liste sortate crescător. Afișează lista rezultată din interclasarea lor (tot sortată crescător), elementele separate prin spațiu.

**Intrare:** n, apoi n numere sortate, apoi m, apoi m numere sortate.
**Ieșire:** Lista interclasată, separată prin spațiu.

**Exemplu:**
\`\`\`
Intrare:
3
1
3
5
3
2
4
6
Ieșire:
1 2 3 4 5 6
\`\`\``,
    difficulty: "greu",
    xpReward: 30,
    chapter: "cap4",
    testCases: [
      { input: "3\n1\n3\n5\n3\n2\n4\n6", expectedOutput: "1 2 3 4 5 6" },
      { input: "2\n1\n2\n2\n3\n4", expectedOutput: "1 2 3 4" },
      { input: "1\n5\n1\n3", expectedOutput: "3 5" },
      { input: "3\n1\n1\n1\n3\n1\n1\n1", expectedOutput: "1 1 1 1 1 1", hidden: true },
    ],
    hint: "Folosește doi indici i și j, compară elementele și avansează indicele mai mic.",
    solution: `n = int(input())
a = [int(input()) for _ in range(n)]
m = int(input())
b = [int(input()) for _ in range(m)]
i = j = 0
result = []
while i < n and j < m:
    if a[i] <= b[j]:
        result.append(a[i])
        i += 1
    else:
        result.append(b[j])
        j += 1
result.extend(a[i:])
result.extend(b[j:])
print(" ".join(str(x) for x in result))`,
  },
  {
    id: "bubble-sort-steps",
    title: "Bubble Sort – pași",
    description: `Se citește un număr **n**, apoi **n** numere întregi. Aplică Bubble Sort și afișează lista după fiecare trecere completă în care a avut loc cel puțin o interschimbare, câte o linie.

**Intrare:** Pe prima linie n, apoi n numere pe linii separate.
**Ieșire:** Lista după fiecare trecere cu interschimbări.

**Exemplu:**
\`\`\`
Intrare:
4
4
3
2
1
Ieșire:
3 2 1 4
2 1 3 4
1 2 3 4
\`\`\``,
    difficulty: "greu",
    xpReward: 30,
    chapter: "cap4",
    testCases: [
      { input: "4\n4\n3\n2\n1", expectedOutput: "3 2 1 4\n2 1 3 4\n1 2 3 4" },
      { input: "3\n3\n1\n2", expectedOutput: "1 2 3" },
      { input: "3\n1\n2\n3", expectedOutput: "" },
    ],
    hint: "La fiecare trecere, compară perechi adiacente și interschimbă dacă sunt în ordine greșită.",
    solution: `n = int(input())
lst = [int(input()) for _ in range(n)]
lines = []
for i in range(n - 1):
    swapped = False
    for j in range(n - 1 - i):
        if lst[j] > lst[j + 1]:
            lst[j], lst[j + 1] = lst[j + 1], lst[j]
            swapped = True
    if swapped:
        lines.append(" ".join(str(x) for x in lst))
    else:
        break
print("\\n".join(lines))`,
  },
  {
    id: "binary-search",
    title: "Căutare binară",
    description: `Se citesc **n** numere întregi sortate crescător, apoi un număr **x**. Afișează poziția (indexul de la 0) lui x în listă, sau \`-1\` dacă nu există.

**Intrare:** n, apoi n numere sortate, apoi x.
**Ieșire:** Indexul lui x sau -1.

**Exemplu:**
\`\`\`
Intrare:
5
1
3
5
7
9
5
Ieșire:
2
\`\`\``,
    difficulty: "mediu",
    xpReward: 25,
    chapter: "cap4",
    testCases: [
      { input: "5\n1\n3\n5\n7\n9\n5", expectedOutput: "2" },
      { input: "5\n1\n3\n5\n7\n9\n4", expectedOutput: "-1" },
      { input: "1\n10\n10", expectedOutput: "0" },
      { input: "4\n2\n4\n6\n8\n8", expectedOutput: "3", hidden: true },
    ],
    hint: "Împarte intervalul în jumătate la fiecare pas: st, dr, mijloc.",
    solution: `n = int(input())
lst = [int(input()) for _ in range(n)]
x = int(input())
st, dr = 0, n - 1
result = -1
while st <= dr:
    mij = (st + dr) // 2
    if lst[mij] == x:
        result = mij
        break
    elif lst[mij] < x:
        st = mij + 1
    else:
        dr = mij - 1
print(result)`,
  },
  {
    id: "insertion-sort",
    title: "Sortare prin inserție",
    description: `Se citește un număr **n**, apoi **n** numere întregi. Sortează-le crescător folosind sortarea prin inserție și afișează rezultatul, elementele separate prin spațiu.

**Intrare:** Pe prima linie n, apoi n numere pe linii separate.
**Ieșire:** Lista sortată, separată prin spațiu.

**Exemplu:**
\`\`\`
Intrare:
5
5
2
4
1
3
Ieșire:
1 2 3 4 5
\`\`\``,
    difficulty: "mediu",
    xpReward: 25,
    chapter: "cap4",
    testCases: [
      { input: "5\n5\n2\n4\n1\n3", expectedOutput: "1 2 3 4 5" },
      { input: "3\n3\n2\n1", expectedOutput: "1 2 3" },
      { input: "4\n1\n2\n3\n4", expectedOutput: "1 2 3 4" },
      { input: "4\n-5\n3\n-1\n2", expectedOutput: "-5 -1 2 3", hidden: true },
    ],
    hint: "La fiecare pas i, inserează lst[i] în poziția corectă în sublista sortată [0:i].",
    solution: `n = int(input())
lst = [int(input()) for _ in range(n)]
for i in range(1, n):
    key = lst[i]
    j = i - 1
    while j >= 0 and lst[j] > key:
        lst[j + 1] = lst[j]
        j -= 1
    lst[j + 1] = key
print(" ".join(str(x) for x in lst))`,
  },
  {
    id: "counting-sort",
    title: "Sortare prin numărare",
    description: `Se citesc **n** numere naturale între 0 și 99. Sortează-le crescător folosind sortarea prin numărare și afișează rezultatul, elementele separate prin spațiu.

**Intrare:** Pe prima linie n, apoi n numere pe linii separate.
**Ieșire:** Lista sortată, separată prin spațiu.

**Exemplu:**
\`\`\`
Intrare:
6
4
2
2
8
3
3
Ieșire:
2 2 3 3 4 8
\`\`\``,
    difficulty: "greu",
    xpReward: 30,
    chapter: "cap4",
    testCases: [
      { input: "6\n4\n2\n2\n8\n3\n3", expectedOutput: "2 2 3 3 4 8" },
      { input: "3\n0\n0\n0", expectedOutput: "0 0 0" },
      { input: "4\n99\n1\n50\n25", expectedOutput: "1 25 50 99" },
      { input: "5\n5\n4\n3\n2\n1", expectedOutput: "1 2 3 4 5", hidden: true },
    ],
    hint: "Creează o listă de frecvențe de 100 elemente și reconstituie lista sortată.",
    solution: `n = int(input())
lst = [int(input()) for _ in range(n)]
freq = [0] * 100
for x in lst:
    freq[x] += 1
result = []
for i in range(100):
    result.extend([str(i)] * freq[i])
print(" ".join(result))`,
  },
  {
    id: "reverse-list",
    title: "Inversare listă",
    description: `Se citește un număr **n**, apoi **n** numere întregi. Afișează lista inversată (în ordine inversă), elementele separate prin spațiu, fără a folosi slicing ([::-1]) sau reverse().

**Intrare:** Pe prima linie n, apoi n numere pe linii separate.
**Ieșire:** Lista inversată, separată prin spațiu.

**Exemplu:**
\`\`\`
Intrare:
5
1
2
3
4
5
Ieșire:
5 4 3 2 1
\`\`\``,
    difficulty: "ușor",
    xpReward: 15,
    chapter: "cap4",
    testCases: [
      { input: "5\n1\n2\n3\n4\n5", expectedOutput: "5 4 3 2 1" },
      { input: "1\n42", expectedOutput: "42" },
      { input: "3\n-1\n0\n1", expectedOutput: "1 0 -1" },
      { input: "4\n10\n20\n30\n40", expectedOutput: "40 30 20 10", hidden: true },
    ],
    hint: "Parcurge lista de la final la început cu un for descrescător.",
    solution: `n = int(input())
lst = [int(input()) for _ in range(n)]
result = []
for i in range(n - 1, -1, -1):
    result.append(str(lst[i]))
print(" ".join(result))`,
  },

  // =============================================
  // === Capitolul 5: Subprograme ===
  // =============================================
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
    solution: `def este_prim(n):
    if n < 2:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True

n = int(input())
print("da" if este_prim(n) else "nu")`,
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
    solution: `def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)

n = int(input())
print(factorial(n))`,
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
    solution: `def putere(baza, exp):
    result = 1
    for _ in range(exp):
        result *= baza
    return result

baza = int(input())
exp = int(input())
print(putere(baza, exp))`,
  },
  // --- Cap5 new problems ---
  {
    id: "sum-of-divisors",
    title: "Funcție – Suma divizorilor",
    description: `Se citește un număr natural **n** (n ≥ 1). Scrie o funcție \`suma_div(n)\` care returnează suma tuturor divizorilor lui n. Afișează rezultatul.

**Intrare:** Un număr natural ≥ 1.
**Ieșire:** Suma divizorilor.

**Exemplu:**
\`\`\`
Intrare:
12
Ieșire:
28
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap5",
    testCases: [
      { input: "12", expectedOutput: "28" },
      { input: "1", expectedOutput: "1" },
      { input: "7", expectedOutput: "8" },
      { input: "28", expectedOutput: "56", hidden: true },
    ],
    hint: "Parcurge de la 1 la n și adună divizorii.",
    solution: `def suma_div(n):
    s = 0
    for i in range(1, n + 1):
        if n % i == 0:
            s += i
    return s

n = int(input())
print(suma_div(n))`,
  },
  {
    id: "perfect-number",
    title: "Funcție – Număr perfect",
    description: `Se citește un număr natural **n** (n ≥ 2). Un număr este perfect dacă este egal cu suma divizorilor săi (exclusiv el însuși). Afișează \`da\` sau \`nu\`.

**Intrare:** Un număr natural ≥ 2.
**Ieșire:** \`da\` sau \`nu\`.

**Exemplu:**
\`\`\`
Intrare:
6
Ieșire:
da
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap5",
    testCases: [
      { input: "6", expectedOutput: "da" },
      { input: "28", expectedOutput: "da" },
      { input: "12", expectedOutput: "nu" },
      { input: "496", expectedOutput: "da", hidden: true },
    ],
    hint: "Calculează suma divizorilor proprii (fără n) și compară cu n.",
    solution: `def este_perfect(n):
    s = 0
    for i in range(1, n):
        if n % i == 0:
            s += i
    return s == n

n = int(input())
print("da" if este_perfect(n) else "nu")`,
  },
  {
    id: "digit-sum-recursive",
    title: "Funcție – Suma cifrelor (recursiv)",
    description: `Se citește un număr natural **n**. Scrie o funcție recursivă \`suma_cifre(n)\` care returnează suma cifrelor. Afișează rezultatul.

**Intrare:** Un număr natural.
**Ieșire:** Suma cifrelor.

**Exemplu:**
\`\`\`
Intrare:
9876
Ieșire:
30
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap5",
    testCases: [
      { input: "9876", expectedOutput: "30" },
      { input: "0", expectedOutput: "0" },
      { input: "5", expectedOutput: "5" },
      { input: "11111", expectedOutput: "5", hidden: true },
    ],
    hint: "Caz de bază: n == 0 → 0. Altfel: n % 10 + suma_cifre(n // 10).",
    solution: `def suma_cifre(n):
    if n == 0:
        return 0
    return n % 10 + suma_cifre(n // 10)

n = int(input())
print(suma_cifre(n))`,
  },
  {
    id: "gcd-recursive",
    title: "Funcție – CMMDC (recursiv)",
    description: `Se citesc două numere naturale **a** și **b**. Scrie o funcție recursivă \`cmmdc(a, b)\` folosind algoritmul lui Euclid. Afișează rezultatul.

**Intrare:** Două numere pe linii separate.
**Ieșire:** CMMDC-ul lor.

**Exemplu:**
\`\`\`
Intrare:
48
18
Ieșire:
6
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap5",
    testCases: [
      { input: "48\n18", expectedOutput: "6" },
      { input: "7\n3", expectedOutput: "1" },
      { input: "100\n100", expectedOutput: "100" },
      { input: "54\n24", expectedOutput: "6", hidden: true },
    ],
    hint: "cmmdc(a, 0) = a; cmmdc(a, b) = cmmdc(b, a % b).",
    solution: `def cmmdc(a, b):
    if b == 0:
        return a
    return cmmdc(b, a % b)

a = int(input())
b = int(input())
print(cmmdc(a, b))`,
  },
  {
    id: "lcm-func",
    title: "Funcție – CMMMC",
    description: `Se citesc două numere naturale **a** și **b**. Scrie funcții pentru CMMDC și CMMMC. Afișează CMMMC-ul lor. (CMMMC = a * b / CMMDC)

**Intrare:** Două numere pe linii separate.
**Ieșire:** CMMMC-ul lor.

**Exemplu:**
\`\`\`
Intrare:
4
6
Ieșire:
12
\`\`\``,
    difficulty: "greu",
    xpReward: 25,
    chapter: "cap5",
    testCases: [
      { input: "4\n6", expectedOutput: "12" },
      { input: "3\n7", expectedOutput: "21" },
      { input: "12\n8", expectedOutput: "24" },
      { input: "5\n5", expectedOutput: "5", hidden: true },
    ],
    hint: "CMMMC(a, b) = a * b // CMMDC(a, b).",
    solution: `def cmmdc(a, b):
    while b != 0:
        a, b = b, a % b
    return a

def cmmmc(a, b):
    return a * b // cmmdc(a, b)

a = int(input())
b = int(input())
print(cmmmc(a, b))`,
  },
  {
    id: "count-vowels",
    title: "Funcție – Numără vocalele",
    description: `Se citește un cuvânt format din litere mici. Scrie o funcție \`nr_vocale(s)\` care returnează numărul de vocale (a, e, i, o, u). Afișează rezultatul.

**Intrare:** Un cuvânt (litere mici).
**Ieșire:** Numărul de vocale.

**Exemplu:**
\`\`\`
Intrare:
programare
Ieșire:
4
\`\`\``,
    difficulty: "ușor",
    xpReward: 15,
    chapter: "cap5",
    testCases: [
      { input: "programare", expectedOutput: "4" },
      { input: "aeiou", expectedOutput: "5" },
      { input: "bcd", expectedOutput: "0" },
      { input: "python", expectedOutput: "1", hidden: true },
    ],
    hint: "Parcurge fiecare caracter și verifică dacă e în 'aeiou'.",
    solution: `def nr_vocale(s):
    count = 0
    for c in s:
        if c in "aeiou":
            count += 1
    return count

s = input()
print(nr_vocale(s))`,
  },
  {
    id: "palindrome-string",
    title: "Funcție – Palindrom (text)",
    description: `Se citește un cuvânt format din litere mici. Scrie o funcție \`este_palindrom(s)\` care returnează True dacă cuvântul este palindrom. Afișează \`da\` sau \`nu\`.

**Intrare:** Un cuvânt (litere mici).
**Ieșire:** \`da\` sau \`nu\`.

**Exemplu:**
\`\`\`
Intrare:
radar
Ieșire:
da
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap5",
    testCases: [
      { input: "radar", expectedOutput: "da" },
      { input: "python", expectedOutput: "nu" },
      { input: "aba", expectedOutput: "da" },
      { input: "a", expectedOutput: "da" },
      { input: "abba", expectedOutput: "da", hidden: true },
    ],
    hint: "Compară șirul cu inversul său, sau compară caracterele de la capete spre mijloc.",
    solution: `def este_palindrom(s):
    i, j = 0, len(s) - 1
    while i < j:
        if s[i] != s[j]:
            return False
        i += 1
        j -= 1
    return True

s = input()
print("da" if este_palindrom(s) else "nu")`,
  },

  // =============================================
  // === Capitolul 6: Fișiere și Interfețe ===
  // =============================================
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
    solution: `text = input()
print(len(text.split()))`,
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
    solution: `s = input()
freq = {}
order = []
for c in s:
    if c not in freq:
        freq[c] = 0
        order.append(c)
    freq[c] += 1
print(" ".join(f"{c}:{freq[c]}" for c in order))`,
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
    solution: `n = int(input())
header = input()
total = 0
count = n - 1
for _ in range(count):
    line = input()
    parts = line.split(",")
    total += int(parts[1])
print(f"{total / count:.2f}")`,
  },
  // --- Cap6 new problems ---
  {
    id: "reverse-string",
    title: "Inversare șir",
    description: `Se citește un cuvânt. Afișează cuvântul inversat, fără a folosi slicing ([::-1]) sau reversed().

**Intrare:** Un cuvânt.
**Ieșire:** Cuvântul inversat.

**Exemplu:**
\`\`\`
Intrare:
python
Ieșire:
nohtyp
\`\`\``,
    difficulty: "ușor",
    xpReward: 15,
    chapter: "cap6",
    testCases: [
      { input: "python", expectedOutput: "nohtyp" },
      { input: "a", expectedOutput: "a" },
      { input: "abcdef", expectedOutput: "fedcba" },
      { input: "racecar", expectedOutput: "racecar", hidden: true },
    ],
    hint: "Parcurge cuvântul de la final și construiește un nou șir.",
    solution: `s = input()
result = ""
for i in range(len(s) - 1, -1, -1):
    result += s[i]
print(result)`,
  },
  {
    id: "uppercase-count",
    title: "Numără majusculele",
    description: `Se citește un text pe o linie. Afișează câte litere majuscule conține.

**Intrare:** O linie de text.
**Ieșire:** Numărul de majuscule.

**Exemplu:**
\`\`\`
Intrare:
Hello World Python
Ieșire:
3
\`\`\``,
    difficulty: "ușor",
    xpReward: 15,
    chapter: "cap6",
    testCases: [
      { input: "Hello World Python", expectedOutput: "3" },
      { input: "abc", expectedOutput: "0" },
      { input: "ABC", expectedOutput: "3" },
      { input: "aAbBcC", expectedOutput: "3", hidden: true },
    ],
    hint: "Parcurge fiecare caracter și verifică cu isupper().",
    solution: `text = input()
count = 0
for c in text:
    if c.isupper():
        count += 1
print(count)`,
  },
  {
    id: "replace-char",
    title: "Înlocuiește caracterul",
    description: `Se citesc trei linii: un text, un caracter vechi și un caracter nou. Înlocuiește toate aparițiile caracterului vechi cu cel nou și afișează rezultatul, fără a folosi replace().

**Intrare:** Text, caracter vechi, caracter nou (pe linii separate).
**Ieșire:** Textul modificat.

**Exemplu:**
\`\`\`
Intrare:
banana
a
o
Ieșire:
bonono
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap6",
    testCases: [
      { input: "banana\na\no", expectedOutput: "bonono" },
      { input: "hello\nl\nr", expectedOutput: "herro" },
      { input: "abc\nz\nx", expectedOutput: "abc" },
      { input: "aaa\na\nb", expectedOutput: "bbb", hidden: true },
    ],
    hint: "Parcurge fiecare caracter: dacă e cel vechi, adaugă cel nou, altfel adaugă originalul.",
    solution: `text = input()
old = input()
new = input()
result = ""
for c in text:
    if c == old:
        result += new
    else:
        result += c
print(result)`,
  },
  {
    id: "longest-word",
    title: "Cel mai lung cuvânt",
    description: `Se citește un text pe o singură linie. Afișează cel mai lung cuvânt. Dacă sunt mai multe cu aceeași lungime maximă, afișează primul.

**Intrare:** O linie de text.
**Ieșire:** Cel mai lung cuvânt.

**Exemplu:**
\`\`\`
Intrare:
Python este un limbaj frumos
Ieșire:
Python
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap6",
    testCases: [
      { input: "Python este un limbaj frumos", expectedOutput: "Python" },
      { input: "a bb ccc", expectedOutput: "ccc" },
      { input: "test", expectedOutput: "test" },
      { input: "ab cd ef gh", expectedOutput: "ab", hidden: true },
    ],
    hint: "Împarte textul în cuvinte cu split() și caută pe cel cu lungimea maximă.",
    solution: `text = input()
words = text.split()
longest = words[0]
for w in words:
    if len(w) > len(longest):
        longest = w
print(longest)`,
  },
  {
    id: "sentence-reverse",
    title: "Inversare ordine cuvinte",
    description: `Se citește un text pe o singură linie. Afișează cuvintele în ordine inversă, separate prin spațiu.

**Intrare:** O linie de text.
**Ieșire:** Cuvintele în ordine inversă.

**Exemplu:**
\`\`\`
Intrare:
Python este super
Ieșire:
super este Python
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap6",
    testCases: [
      { input: "Python este super", expectedOutput: "super este Python" },
      { input: "salut", expectedOutput: "salut" },
      { input: "a b c d", expectedOutput: "d c b a" },
      { input: "un doi trei patru", expectedOutput: "patru trei doi un", hidden: true },
    ],
    hint: "Împarte în cuvinte cu split(), inversează lista și unește cu join().",
    solution: `text = input()
words = text.split()
words.reverse()
print(" ".join(words))`,
  },
  {
    id: "remove-vowels",
    title: "Elimină vocalele",
    description: `Se citește un cuvânt format din litere mici. Afișează cuvântul fără vocale (a, e, i, o, u).

**Intrare:** Un cuvânt (litere mici).
**Ieșire:** Cuvântul fără vocale.

**Exemplu:**
\`\`\`
Intrare:
programare
Ieșire:
prgrmr
\`\`\``,
    difficulty: "ușor",
    xpReward: 15,
    chapter: "cap6",
    testCases: [
      { input: "programare", expectedOutput: "prgrmr" },
      { input: "aeiou", expectedOutput: "" },
      { input: "bcd", expectedOutput: "bcd" },
      { input: "python", expectedOutput: "pythn", hidden: true },
    ],
    hint: "Parcurge fiecare caracter și adaugă-l la rezultat doar dacă nu e vocală.",
    solution: `s = input()
result = ""
for c in s:
    if c not in "aeiou":
        result += c
print(result)`,
  },
  {
    id: "count-sentences",
    title: "Numără propozițiile",
    description: `Se citește un text pe o singură linie. Numără câte propoziții conține (o propoziție se termină cu '.', '!' sau '?').

**Intrare:** O linie de text.
**Ieșire:** Numărul de propoziții.

**Exemplu:**
\`\`\`
Intrare:
Salut! Cum esti? Bine.
Ieșire:
3
\`\`\``,
    difficulty: "mediu",
    xpReward: 20,
    chapter: "cap6",
    testCases: [
      { input: "Salut! Cum esti? Bine.", expectedOutput: "3" },
      { input: "O singura propozitie.", expectedOutput: "1" },
      { input: "Una! Doua! Trei!", expectedOutput: "3" },
      { input: "Test. Test? Test!", expectedOutput: "3", hidden: true },
    ],
    hint: "Numără aparițiile caracterelor '.', '!' și '?'.",
    solution: `text = input()
count = 0
for c in text:
    if c in ".!?":
        count += 1
print(count)`,
  },
];
