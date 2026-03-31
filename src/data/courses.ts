export type ExerciseType = "quiz" | "fill" | "order" | "truefalse" | "match" | "card";

export interface ExerciseOption {
  id: string;
  text: string;
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
  // quiz
  options?: ExerciseOption[];
  correctOptionId?: string;
  // fill
  codeTemplate?: string;
  blanks?: { id: string; answer: string }[];
  // order
  lines?: { id: string; text: string; order: number }[];
  // truefalse
  statement?: string;
  isTrue?: boolean;
  explanation?: string;
  pairs?: { id: string; left: string; right: string }[];
  xp: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  exercises: Exercise[];
  xpReward: number;
  isPremium?: boolean;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  lessons: Lesson[];
}

// Helper to generate IDs
const eid = (ch: number, le: number, ex: number) => `c${ch}-l${le}-e${ex}`;

const rawChapters: Chapter[] = [
  {
    id: "ch1",
    number: 1,
    title: "Recapitulare & Fundamente",
    description: "Variabile, structuri de control, gândire computațională și introducere în algoritmi",
    icon: "🧱",
    color: "160 100% 50%",
    lessons: [
      {
        id: "c1-l1",
        title: "Variabile și atribuire",
        description: "Tipuri de date, operatorul =, conversii (int, float, str)",
        xpReward: 20,
        exercises: [
          {
            id: eid(1,1,1), type: "quiz", xp: 5,
            question: "Ce tip de dată are variabila x după: x = 3.14?",
            options: [
              { id: "a", text: "int" },
              { id: "b", text: "float" },
              { id: "c", text: "str" },
              { id: "d", text: "bool" },
            ],
            correctOptionId: "b",
            explanation: "3.14 conține un punct zecimal, deci Python îl stochează ca float.",
          },
          {
            id: eid(1,1,2), type: "truefalse", xp: 5,
            question: "Adevărat sau Fals?",
            statement: "În Python, variabila x = '5' este de tip int.",
            isTrue: false,
            explanation: "Ghilimelele fac ca '5' să fie un string (str), nu un int.",
          },
          {
            id: eid(1,1,3), type: "fill", xp: 5,
            question: "Completează codul pentru a converti string-ul în număr întreg:",
            codeTemplate: "varsta = '16'\nvarsta_numar = ___(varsta)\nprint(varsta_numar)",
            blanks: [{ id: "b1", answer: "int" }],
            explanation: "Funcția int() convertește un string numeric într-un număr întreg.",
          },
          {
            id: eid(1,1,4), type: "order", xp: 5,
            question: "Aranjează liniile pentru a crea o variabilă, a o converti și a o afișa:",
            lines: [
              { id: "l1", text: "x = '42'", order: 1 },
              { id: "l2", text: "x = int(x)", order: 2 },
              { id: "l3", text: "print(x + 8)", order: 3 },
            ],
            explanation: "Mai întâi creăm string-ul, apoi îl convertim la int, și abia apoi putem face operații matematice.",
          },
          {
            id: eid(1,1,5), type: "quiz", xp: 5,
            question: "Ce afișează: print(type(10))?",
            options: [
              { id: "a", text: "<class 'float'>" },
              { id: "b", text: "<class 'int'>" },
              { id: "c", text: "<class 'str'>" },
              { id: "d", text: "10" },
            ],
            correctOptionId: "b",
            explanation: "Funcția type() returnează tipul datei. 10 este un întreg, deci <class 'int'>.",
          },
        ],
      },
      {
        id: "c1-l2",
        title: "Structura if/elif/else",
        description: "Condiții, operatori logici, ramificări",
        xpReward: 20,
        exercises: [
          {
            id: eid(1,2,1), type: "quiz", xp: 5,
            question: "Ce afișează acest cod?\nx = 15\nif x > 10:\n    print('mare')\nelse:\n    print('mic')",
            options: [
              { id: "a", text: "mare" },
              { id: "b", text: "mic" },
              { id: "c", text: "15" },
              { id: "d", text: "Eroare" },
            ],
            correctOptionId: "a",
            explanation: "x = 15 > 10 este adevărat, deci se execută ramura 'if' și se afișează 'mare'.",
          },
          {
            id: eid(1,2,2), type: "fill", xp: 5,
            question: "Completează condiția pentru a verifica dacă un număr este par:",
            codeTemplate: "n = 8\nif n ___ 2 == 0:\n    print('par')",
            blanks: [{ id: "b1", answer: "%" }],
            explanation: "Operatorul % (modulo) returnează restul împărțirii. Dacă n % 2 == 0, numărul este par.",
          },
          {
            id: eid(1,2,3), type: "truefalse", xp: 5,
            question: "Adevărat sau Fals?",
            statement: "Cuvântul cheie 'elif' este prescurtarea pentru 'else if' în Python.",
            isTrue: true,
            explanation: "elif este echivalentul lui 'else if' din alte limbaje.",
          },
          {
            id: eid(1,2,4), type: "order", xp: 5,
            question: "Aranjează liniile pentru a verifica dacă un număr este pozitiv, negativ sau zero:",
            lines: [
              { id: "l1", text: "x = -5", order: 1 },
              { id: "l2", text: "if x > 0:", order: 2 },
              { id: "l3", text: "    print('pozitiv')", order: 3 },
              { id: "l4", text: "elif x < 0:", order: 4 },
              { id: "l5", text: "    print('negativ')", order: 5 },
              { id: "l6", text: "else:", order: 6 },
              { id: "l7", text: "    print('zero')", order: 7 },
            ],
            explanation: "Ordinea corectă: declarăm variabila, verificăm dacă e pozitiv, apoi negativ, apoi zero (else).",
          },
          {
            id: eid(1,2,5), type: "quiz", xp: 5,
            question: "Ce operator logic folosim pentru a verifica dacă AMBELE condiții sunt adevărate?",
            options: [
              { id: "a", text: "or" },
              { id: "b", text: "and" },
              { id: "c", text: "not" },
              { id: "d", text: "xor" },
            ],
            correctOptionId: "b",
            explanation: "'and' verifică dacă ambele condiții sunt adevărate simultan.",
          },
        ],
      },
      {
        id: "c1-l3",
        title: "Structura for",
        description: "Iterare prin range(), parcurgere liste",
        xpReward: 20,
        exercises: [
          {
            id: eid(1,3,1), type: "quiz", xp: 5,
            question: "Câte valori generează range(5)?",
            options: [
              { id: "a", text: "4" },
              { id: "b", text: "5" },
              { id: "c", text: "6" },
              { id: "d", text: "3" },
            ],
            correctOptionId: "b",
            explanation: "range(5) generează valorile 0, 1, 2, 3, 4 – adică 5 valori.",
          },
          {
            id: eid(1,3,2), type: "fill", xp: 5,
            question: "Completează codul pentru a afișa numerele de la 1 la 10:",
            codeTemplate: "for i in ___(1, 11):\n    print(i)",
            blanks: [{ id: "b1", answer: "range" }],
            explanation: "range(1, 11) generează numerele de la 1 la 10 (11 este exclus).",
          },
          {
            id: eid(1,3,3), type: "truefalse", xp: 5,
            question: "Adevărat sau Fals?",
            statement: "range(1, 5) generează valorile 1, 2, 3, 4, 5.",
            isTrue: false,
            explanation: "range(1, 5) generează 1, 2, 3, 4 – limita superioară este exclusă.",
          },
          {
            id: eid(1,3,4), type: "order", xp: 5,
            question: "Aranjează liniile pentru a calcula suma numerelor de la 1 la 5:",
            lines: [
              { id: "l1", text: "suma = 0", order: 1 },
              { id: "l2", text: "for i in range(1, 6):", order: 2 },
              { id: "l3", text: "    suma = suma + i", order: 3 },
              { id: "l4", text: "print(suma)", order: 4 },
            ],
            explanation: "Inițializăm suma cu 0, iterăm de la 1 la 5, adunăm fiecare valoare, apoi afișăm.",
          },
          {
            id: eid(1,3,5), type: "quiz", xp: 5,
            question: "Ce afișează:\nfor i in range(0, 6, 2):\n    print(i, end=' ')",
            options: [
              { id: "a", text: "0 1 2 3 4 5" },
              { id: "b", text: "0 2 4" },
              { id: "c", text: "2 4 6" },
              { id: "d", text: "0 2 4 6" },
            ],
            correctOptionId: "b",
            explanation: "range(0, 6, 2) generează 0, 2, 4 – cu pas de 2, fără 6 (exclus).",
          },
        ],
      },
      {
        id: "c1-l4",
        title: "Structura while",
        description: "Bucle condiționale, controlul execuției",
        xpReward: 20,
        exercises: [
          {
            id: eid(1,4,1), type: "quiz", xp: 5,
            question: "De câte ori se execută bucla?\nx = 3\nwhile x > 0:\n    x -= 1",
            options: [
              { id: "a", text: "2" },
              { id: "b", text: "3" },
              { id: "c", text: "4" },
              { id: "d", text: "Infinit" },
            ],
            correctOptionId: "b",
            explanation: "x pornește de la 3 și scade cu 1 la fiecare iterație: x=3→2→1→0, deci 3 execuții.",
          },
          {
            id: eid(1,4,2), type: "fill", xp: 5,
            question: "Completează condiția pentru a repeta cât timp n este pozitiv:",
            codeTemplate: "n = 10\nwhile n ___ 0:\n    n -= 1",
            blanks: [{ id: "b1", answer: ">" }],
            explanation: "Operatorul > verifică dacă n este strict mai mare decât 0.",
          },
          {
            id: eid(1,4,3), type: "truefalse", xp: 5,
            question: "Adevărat sau Fals?",
            statement: "Instrucțiunea 'break' oprește complet execuția programului.",
            isTrue: false,
            explanation: "'break' oprește doar bucla curentă, nu întregul program.",
          },
          {
            id: eid(1,4,4), type: "order", xp: 5,
            question: "Aranjează liniile pentru a afișa cifrele unui număr:",
            lines: [
              { id: "l1", text: "n = 1234", order: 1 },
              { id: "l2", text: "while n > 0:", order: 2 },
              { id: "l3", text: "    print(n % 10)", order: 3 },
              { id: "l4", text: "    n = n // 10", order: 4 },
            ],
            explanation: "n % 10 extrage ultima cifră, iar n // 10 elimină ultima cifră. Repetăm până n devine 0.",
          },
          {
            id: eid(1,4,5), type: "quiz", xp: 5,
            question: "Ce face 'continue' într-o buclă while?",
            options: [
              { id: "a", text: "Oprește bucla" },
              { id: "b", text: "Sare la următoarea iterație" },
              { id: "c", text: "Restartează programul" },
              { id: "d", text: "Nu face nimic" },
            ],
            correctOptionId: "b",
            explanation: "'continue' sare peste restul corpului buclei și trece direct la verificarea condiției.",
          },
        ],
      },
      {
        id: "c1-l5",
        title: "Gândire computațională",
        description: "Etapele rezolvării unei probleme: analiză, proiectare, implementare, testare",
        xpReward: 20,
        exercises: [
          {
            id: eid(1,5,1), type: "quiz", xp: 5,
            question: "Care este prima etapă în rezolvarea unei probleme computaționale?",
            options: [
              { id: "a", text: "Implementare" },
              { id: "b", text: "Testare" },
              { id: "c", text: "Analiza problemei" },
              { id: "d", text: "Optimizare" },
            ],
            correctOptionId: "c",
            explanation: "Întotdeauna începem prin a înțelege problema înainte de a scrie cod.",
          },
          {
            id: eid(1,5,2), type: "truefalse", xp: 5,
            question: "Adevărat sau Fals?",
            statement: "Descompunerea problemei în subprobleme mai mici este o tehnică de gândire computațională.",
            isTrue: true,
            explanation: "Descompunerea (decomposition) este una dintre cele 4 piloane ale gândirii computaționale.",
          },
          {
            id: eid(1,5,3), type: "order", xp: 5,
            question: "Aranjează etapele rezolvării unei probleme în ordinea corectă:",
            lines: [
              { id: "l1", text: "1. Analiza problemei", order: 1 },
              { id: "l2", text: "2. Proiectarea soluției", order: 2 },
              { id: "l3", text: "3. Implementarea codului", order: 3 },
              { id: "l4", text: "4. Testarea și depanarea", order: 4 },
            ],
            explanation: "Ordinea corectă: analiză → proiectare → implementare → testare.",
          },
          {
            id: eid(1,5,4), type: "quiz", xp: 5,
            question: "Ce înseamnă 'abstractizarea' în gândirea computațională?",
            options: [
              { id: "a", text: "Scrierea codului abstract" },
              { id: "b", text: "Ignorarea detaliilor neimportante pentru a se concentra pe esențial" },
              { id: "c", text: "Crearea de clase abstracte" },
              { id: "d", text: "Folosirea variabilelor globale" },
            ],
            correctOptionId: "b",
            explanation: "Abstractizarea înseamnă simplificarea problemei prin eliminarea detaliilor irelevante.",
          },
          {
            id: eid(1,5,5), type: "truefalse", xp: 5,
            question: "Adevărat sau Fals?",
            statement: "Recunoașterea pattern-urilor înseamnă identificarea similitudinilor între probleme diferite.",
            isTrue: true,
            explanation: "Pattern recognition este procesul de identificare a tiparelor comune.",
          },
        ],
      },
      {
        id: "c1-l6",
        title: "Introducere în algoritmi",
        description: "Pseudocod, eficiență de bază, notația O",
        xpReward: 25,
        exercises: [
          {
            id: eid(1,6,1), type: "quiz", xp: 5,
            question: "Ce este un algoritm?",
            options: [
              { id: "a", text: "Un limbaj de programare" },
              { id: "b", text: "O secvență finită de pași pentru rezolvarea unei probleme" },
              { id: "c", text: "Un tip de dată" },
              { id: "d", text: "O funcție Python" },
            ],
            correctOptionId: "b",
            explanation: "Un algoritm este un set finit de instrucțiuni clare care rezolvă o problemă pas cu pas.",
          },
          {
            id: eid(1,6,2), type: "truefalse", xp: 5,
            question: "Adevărat sau Fals?",
            statement: "Un algoritm cu complexitate O(n) este mai rapid decât unul cu O(n²) pentru date mari.",
            isTrue: true,
            explanation: "O(n) crește liniar, pe când O(n²) crește mult mai rapid.",
          },
          {
            id: eid(1,6,3), type: "quiz", xp: 5,
            question: "Ce complexitate are căutarea unui element într-o listă neordonată?",
            options: [
              { id: "a", text: "O(1)" },
              { id: "b", text: "O(log n)" },
              { id: "c", text: "O(n)" },
              { id: "d", text: "O(n²)" },
            ],
            correctOptionId: "c",
            explanation: "Trebuie să parcurgem fiecare element pe rând, deci complexitatea este liniară O(n).",
          },
          {
            id: eid(1,6,4), type: "order", xp: 5,
            question: "Ordonează complexitățile de la cea mai rapidă la cea mai lentă:",
            lines: [
              { id: "l1", text: "O(1) - constantă", order: 1 },
              { id: "l2", text: "O(log n) - logaritmică", order: 2 },
              { id: "l3", text: "O(n) - liniară", order: 3 },
              { id: "l4", text: "O(n²) - pătratică", order: 4 },
            ],
            explanation: "O(1) < O(log n) < O(n) < O(n²) – de la cea mai eficientă la cea mai costisitoare.",
          },
          {
            id: eid(1,6,5), type: "fill", xp: 5,
            question: "Completează: pseudocodul folosește limbaj ___ pentru a descrie algoritmul.",
            codeTemplate: "Pseudocodul folosește limbaj ___",
            blanks: [{ id: "b1", answer: "natural" }],
            explanation: "Pseudocodul descrie algoritmi în limbaj natural, ușor de înțeles de oricine.",
          },
        ],
      },
      // --- PRACTICE LESSONS ---
      {
        id: "c1-l7", title: "Practică: Condiții și bucle", description: "Exerciții combinate if + for + while", xpReward: 30, isPremium: true,
        exercises: [
          { id: eid(1,7,1), type: "quiz", xp: 5, question: "Ce afișează?\nfor i in range(1, 6):\n    if i % 2 == 0:\n        print(i, end=' ')",
            options: [{ id: "a", text: "1 3 5" }, { id: "b", text: "2 4" }, { id: "c", text: "2 4 6" }, { id: "d", text: "1 2 3 4 5" }], correctOptionId: "b",
            explanation: "Parcurgem 1-5, afișăm doar numerele pare (i%2==0): 2 și 4." },
          { id: eid(1,7,2), type: "fill", xp: 5, question: "Completează pentru a calcula factorialul lui n:",
            codeTemplate: "n = 5\nfact = 1\nfor i in range(1, n+1):\n    fact ___ i\nprint(fact)", blanks: [{ id: "b1", answer: "*=" }],
            explanation: "fact *= i este echivalent cu fact = fact * i. 5! = 1×2×3×4×5 = 120." },
          { id: eid(1,7,3), type: "order", xp: 5, question: "Aranjează codul pentru a găsi primul număr prim > 10:",
            lines: [
              { id: "l1", text: "n = 11", order: 1 },
              { id: "l2", text: "while True:", order: 2 },
              { id: "l3", text: "    prim = True", order: 3 },
              { id: "l4", text: "    for d in range(2, n):", order: 4 },
              { id: "l5", text: "        if n % d == 0: prim = False", order: 5 },
              { id: "l6", text: "    if prim: break", order: 6 },
              { id: "l7", text: "    n += 1", order: 7 },
            ],
            explanation: "Testăm fiecare număr începând de la 11 dacă e prim. Primul prim > 10 este 11." },
          { id: eid(1,7,4), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Expresia 'for i in range(10, 0, -1)' parcurge de la 10 la 1.", isTrue: true,
            explanation: "range(10, 0, -1) generează: 10, 9, 8, ..., 1 (0 exclus)." },
          { id: eid(1,7,5), type: "quiz", xp: 5, question: "Ce afișează?\nx = 100\nwhile x > 1:\n    x //= 2\nprint(x)",
            options: [{ id: "a", text: "0" }, { id: "b", text: "1" }, { id: "c", text: "2" }, { id: "d", text: "50" }], correctOptionId: "b",
            explanation: "100→50→25→12→6→3→1. Când x=1, condiția x>1 e falsă, se oprește. x=1." },
          { id: eid(1,7,6), type: "fill", xp: 5, question: "Completează pentru a verifica dacă n este prim:",
            codeTemplate: "n = 17\nprim = True\nfor d in range(2, n):\n    if n % d ___ 0:\n        prim = False", blanks: [{ id: "b1", answer: "==" }],
            explanation: "Dacă n % d == 0, atunci d este un divizor al lui n, deci n nu e prim." },
        ],
      },
      {
        id: "c1-l8", title: "Practică: Probleme cu numere", description: "Numere perfecte, palindroame, Fibonacci", xpReward: 35, isPremium: true,
        exercises: [
          { id: eid(1,8,1), type: "quiz", xp: 5, question: "Un număr perfect este egal cu suma divizorilor săi (fără el). Care este un număr perfect?",
            options: [{ id: "a", text: "12" }, { id: "b", text: "6" }, { id: "c", text: "8" }, { id: "d", text: "10" }], correctOptionId: "b",
            explanation: "6 = 1 + 2 + 3. Suma divizorilor proprii este egală cu numărul." },
          { id: eid(1,8,2), type: "order", xp: 5, question: "Aranjează codul pentru a verifica dacă un număr este palindrom:",
            lines: [
              { id: "l1", text: "n = 121", order: 1 },
              { id: "l2", text: "original = n", order: 2 },
              { id: "l3", text: "invers = 0", order: 3 },
              { id: "l4", text: "while n > 0:", order: 4 },
              { id: "l5", text: "    invers = invers * 10 + n % 10", order: 5 },
              { id: "l6", text: "    n //= 10", order: 6 },
              { id: "l7", text: "print(original == invers)", order: 7 },
            ],
            explanation: "Construim inversul cifră cu cifră. 121 inversat = 121, deci e palindrom." },
          { id: eid(1,8,3), type: "fill", xp: 5, question: "Completează formula pentru inversarea numărului:",
            codeTemplate: "invers = invers * ___ + n % 10", blanks: [{ id: "b1", answer: "10" }],
            explanation: "Înmulțim cu 10 pentru a face loc noii cifre, apoi adăugăm ultima cifră cu n%10." },
          { id: eid(1,8,4), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Numărul 12321 este palindrom.", isTrue: true,
            explanation: "Citit de la dreapta la stânga: 12321. E identic, deci e palindrom." },
          { id: eid(1,8,5), type: "quiz", xp: 5, question: "Ce afișează?\ns = 0\nfor i in range(1, 101):\n    if i % 3 == 0 and i % 5 == 0:\n        s += 1\nprint(s)",
            options: [{ id: "a", text: "6" }, { id: "b", text: "33" }, { id: "c", text: "20" }, { id: "d", text: "15" }], correctOptionId: "a",
            explanation: "Numărăm multiplii lui 15 (div cu 3 ȘI 5) de la 1 la 100: 15,30,45,60,75,90 = 6." },
        ],
      },
      {
        id: "c1-l9", title: "Practică: Bucle imbricate", description: "Matrici de caractere, tabele, pattern-uri", xpReward: 35, isPremium: true,
        exercises: [
          { id: eid(1,9,1), type: "quiz", xp: 5, question: "Câte * afișează?\nfor i in range(3):\n    for j in range(3):\n        print('*', end='')",
            options: [{ id: "a", text: "3" }, { id: "b", text: "6" }, { id: "c", text: "9" }, { id: "d", text: "12" }], correctOptionId: "c",
            explanation: "3 iterații exterioare × 3 interioare = 9 steluțe." },
          { id: eid(1,9,2), type: "fill", xp: 5, question: "Completează pentru un triunghi de *:\n(linia i are i+1 steluțe)",
            codeTemplate: "for i in range(5):\n    print('*' * (___))", blanks: [{ id: "b1", answer: "i+1" }],
            explanation: "Pe linia 0 afișăm 1 stea, pe linia 1 afișăm 2, etc. Deci i+1 steluțe per linie." },
          { id: eid(1,9,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Două bucle for imbricate au complexitate O(n²).", isTrue: true,
            explanation: "Fiecare iterație a buclei externe execută n iterații ale celei interne: n×n = n²." },
          { id: eid(1,9,4), type: "order", xp: 5, question: "Aranjează codul pentru tabla înmulțirii (1-3):",
            lines: [
              { id: "l1", text: "for i in range(1, 4):", order: 1 },
              { id: "l2", text: "    for j in range(1, 4):", order: 2 },
              { id: "l3", text: "        print(i*j, end='\\t')", order: 3 },
              { id: "l4", text: "    print()", order: 4 },
            ],
            explanation: "Bucla externă = rândul, internă = coloana. print() face newline după fiecare rând." },
          { id: eid(1,9,5), type: "quiz", xp: 5, question: "Ce afișează?\nfor i in range(3):\n    print(i * '* ')",
            options: [{ id: "a", text: "* \\n* * \\n* * *" }, { id: "b", text: "(nimic)\\n* \\n* *" }, { id: "c", text: "* * *\\n* *\\n*" }, { id: "d", text: "0\\n1\\n2" }], correctOptionId: "b",
            explanation: "i=0: string gol, i=1: '* ', i=2: '* * '. Înmulțirea repetă stringul." },
        ],
      },
      {
        id: "c1-l10", title: "Test recapitulativ", description: "Probleme complexe din tot capitolul", xpReward: 40, isPremium: true,
        exercises: [
          { id: eid(1,10,1), type: "quiz", xp: 5, question: "Ce afișează?\nx = 0\nfor i in range(5):\n    for j in range(i):\n        x += 1\nprint(x)",
            options: [{ id: "a", text: "10" }, { id: "b", text: "15" }, { id: "c", text: "5" }, { id: "d", text: "20" }], correctOptionId: "a",
            explanation: "j parcurge: 0,0+1,0+1+2,0+1+2+3 = 0+1+2+3+4 = 10 incrementări." },
          { id: eid(1,10,2), type: "fill", xp: 5, question: "Completează pentru a verifica dacă un string este palindrom:",
            codeTemplate: "s = 'aba'\nprint(s == s[___])", blanks: [{ id: "b1", answer: "::-1" }],
            explanation: "s[::-1] inversează stringul. Dacă e egal cu originalul, e palindrom." },
          { id: eid(1,10,3), type: "order", xp: 5, question: "Aranjează codul pentru a genera primele n numere prime:",
            lines: [
              { id: "l1", text: "n, count, num = 10, 0, 2", order: 1 },
              { id: "l2", text: "while count < n:", order: 2 },
              { id: "l3", text: "    if all(num % d != 0 for d in range(2, num)):", order: 3 },
              { id: "l4", text: "        print(num); count += 1", order: 4 },
              { id: "l5", text: "    num += 1", order: 5 },
            ],
            explanation: "Verificăm fiecare număr dacă e prim cu all(), numărăm până avem n prime." },
          { id: eid(1,10,4), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Expresia all([True, True, False]) returnează False.", isTrue: true,
            explanation: "all() returnează True doar dacă TOATE elementele sunt True." },
          { id: eid(1,10,5), type: "quiz", xp: 5, question: "Ce complexitate are verificarea dacă n este prim (metoda naivă)?",
            options: [{ id: "a", text: "O(1)" }, { id: "b", text: "O(n)" }, { id: "c", text: "O(√n)" }, { id: "d", text: "O(n²)" }], correctOptionId: "b",
            explanation: "Metoda naivă verifică toți posibilii divizori de la 2 la n-1, deci O(n). Optimizat: O(√n)." },
          { id: eid(1,10,6), type: "fill", xp: 5, question: "Completează pentru suma numerelor impare de la 1 la n:",
            codeTemplate: "n = 20\ns = sum(i for i in range(1, n+1) if i % 2 ___ 0)", blanks: [{ id: "b1", answer: "!=" }],
            explanation: "Filtrăm numerele impare cu i % 2 != 0 și le sumăm." },
        ],
      },
    ],
  },
  {
    id: "ch2",
    number: 2,
    title: "Prelucrări Numerice",
    description: "Operații cu cifre, algoritmi cu divizori, Euclid, factori primi, conversii",
    icon: "🔢",
    color: "200 100% 50%",
    lessons: [
      {
        id: "c2-l1",
        title: "Operații cu cifrele unui număr",
        description: "Acces la cifre, adăugare cifre la stânga/dreapta",
        xpReward: 25,
        exercises: [
          {
            id: eid(2,1,1), type: "quiz", xp: 5,
            question: "Ce returnează 1234 % 10?",
            options: [
              { id: "a", text: "123" }, { id: "b", text: "4" },
              { id: "c", text: "1" }, { id: "d", text: "34" },
            ],
            correctOptionId: "b",
            explanation: "Operatorul % 10 returnează restul împărțirii la 10, adică ultima cifră: 4.",
          },
          {
            id: eid(2,1,2), type: "quiz", xp: 5,
            question: "Ce returnează 1234 // 10?",
            options: [
              { id: "a", text: "123" }, { id: "b", text: "4" },
              { id: "c", text: "123.4" }, { id: "d", text: "1" },
            ],
            correctOptionId: "a",
            explanation: "Operatorul // 10 face împărțire întreagă, eliminând ultima cifră: 1234 // 10 = 123.",
          },
          {
            id: eid(2,1,3), type: "fill", xp: 5,
            question: "Completează pentru a obține ultima cifră a lui n:",
            codeTemplate: "n = 567\nultima_cifra = n ___ 10",
            blanks: [{ id: "b1", answer: "%" }],
            explanation: "n % 10 returnează ultima cifră a numărului (restul împărțirii la 10).",
          },
          {
            id: eid(2,1,4), type: "order", xp: 5,
            question: "Aranjează liniile pentru a număra cifrele unui număr:",
            lines: [
              { id: "l1", text: "n = 12345", order: 1 },
              { id: "l2", text: "count = 0", order: 2 },
              { id: "l3", text: "while n > 0:", order: 3 },
              { id: "l4", text: "    count += 1", order: 4 },
              { id: "l5", text: "    n = n // 10", order: 5 },
            ],
            explanation: "Eliminăm ultima cifră cu // 10 și incrementăm contorul la fiecare pas, până n devine 0.",
          },
          {
            id: eid(2,1,5), type: "truefalse", xp: 5,
            question: "Adevărat sau Fals?",
            statement: "Operatorul // în Python face împărțire întreagă.",
            isTrue: true,
            explanation: "// returnează câtul împărțirii (partea întreagă).",
          },
        ],
      },
      {
        id: "c2-l2",
        title: "Parcurgerea cifrelor și divizorilor",
        description: "Algoritmi de bază pentru cifre și divizori",
        xpReward: 25,
        exercises: [
          {
            id: eid(2,2,1), type: "quiz", xp: 5,
            question: "Care sunt divizorii lui 12?",
            options: [
              { id: "a", text: "1, 2, 3, 4, 6, 12" },
              { id: "b", text: "2, 3, 4, 6" },
              { id: "c", text: "1, 12" },
              { id: "d", text: "2, 4, 6, 12" },
            ],
            correctOptionId: "a",
            explanation: "Divizorii lui 12 sunt toate numerele care îl împart exact: 1, 2, 3, 4, 6, 12.",
          },
          {
            id: eid(2,2,2), type: "fill", xp: 5,
            question: "Completează condiția pentru a verifica dacă d este divizor al lui n:",
            codeTemplate: "if n ___ d == 0:\n    print(d, 'este divizor')",
            blanks: [{ id: "b1", answer: "%" }],
            explanation: "Dacă n % d == 0, atunci d divide pe n exact (fără rest).",
          },
          {
            id: eid(2,2,3), type: "truefalse", xp: 5,
            question: "Adevărat sau Fals?",
            statement: "Un număr prim are exact 2 divizori: 1 și el însuși.",
            isTrue: true,
            explanation: "Definiția numerelor prime: exact doi divizori.",
          },
          {
            id: eid(2,2,4), type: "order", xp: 5,
            question: "Aranjează codul pentru a afișa suma cifrelor:",
            lines: [
              { id: "l1", text: "n = 456", order: 1 },
              { id: "l2", text: "s = 0", order: 2 },
              { id: "l3", text: "while n > 0:", order: 3 },
              { id: "l4", text: "    s += n % 10", order: 4 },
              { id: "l5", text: "    n //= 10", order: 5 },
              { id: "l6", text: "print(s)", order: 6 },
            ],
            explanation: "Extragem ultima cifră cu % 10, o adăugăm la sumă, apoi eliminăm cifra cu //= 10.",
          },
          {
            id: eid(2,2,5), type: "quiz", xp: 5,
            question: "Ce este suma cifrelor lui 987?",
            options: [
              { id: "a", text: "24" }, { id: "b", text: "25" },
              { id: "c", text: "23" }, { id: "d", text: "27" },
            ],
            correctOptionId: "a",
            explanation: "9 + 8 + 7 = 24.",
          },
        ],
      },
      {
        id: "c2-l3",
        title: "Algoritmul lui Euclid",
        description: "CMMDC cu scăderi și cu împărțiri",
        xpReward: 30,
        exercises: [
          {
            id: eid(2,3,1), type: "quiz", xp: 5,
            question: "Cât este CMMDC(12, 8)?",
            options: [
              { id: "a", text: "2" }, { id: "b", text: "4" },
              { id: "c", text: "8" }, { id: "d", text: "6" },
            ],
            correctOptionId: "b",
            explanation: "Cel mai mare număr care divide și pe 12 și pe 8 este 4.",
          },
          {
            id: eid(2,3,2), type: "order", xp: 5,
            question: "Aranjează algoritmul lui Euclid cu împărțiri:",
            lines: [
              { id: "l1", text: "a, b = 48, 18", order: 1 },
              { id: "l2", text: "while b != 0:", order: 2 },
              { id: "l3", text: "    a, b = b, a % b", order: 3 },
              { id: "l4", text: "print(a)", order: 4 },
            ],
            explanation: "La fiecare pas înlocuim (a, b) cu (b, a%b) până b devine 0. Rezultatul este a.",
          },
          {
            id: eid(2,3,3), type: "fill", xp: 5,
            question: "Completează linia cheie din algoritmul lui Euclid:",
            codeTemplate: "while b != 0:\n    a, b = b, a ___ b",
            blanks: [{ id: "b1", answer: "%" }],
            explanation: "Operatorul % calculează restul împărțirii, esențial pentru algoritmul lui Euclid.",
          },
          {
            id: eid(2,3,4), type: "truefalse", xp: 5,
            question: "Adevărat sau Fals?",
            statement: "Algoritmul lui Euclid cu împărțiri este mai rapid decât cel cu scăderi.",
            isTrue: true,
            explanation: "Varianta cu împărțiri converge mai rapid deoarece reduce numerele mai eficient.",
          },
          {
            id: eid(2,3,5), type: "quiz", xp: 5,
            question: "CMMDC(17, 5) = ?",
            options: [
              { id: "a", text: "5" }, { id: "b", text: "1" },
              { id: "c", text: "17" }, { id: "d", text: "2" },
            ],
            correctOptionId: "b",
            explanation: "17 și 5 sunt coprime (nu au factori comuni), deci CMMDC = 1.",
          },
        ],
      },
      {
        id: "c2-l4",
        title: "Descompunere în factori primi",
        description: "Algoritmul de descompunere în factori primi",
        xpReward: 30,
        exercises: [
          {
            id: eid(2,4,1), type: "quiz", xp: 5,
            question: "Care este descompunerea lui 12 în factori primi?",
            options: [
              { id: "a", text: "2² × 3" }, { id: "b", text: "4 × 3" },
              { id: "c", text: "2 × 6" }, { id: "d", text: "2 × 3²" },
            ],
            correctOptionId: "a",
            explanation: "12 = 2 × 2 × 3 = 2² × 3. Folosim doar factori primi (2 și 3).",
          },
          {
            id: eid(2,4,2), type: "truefalse", xp: 5,
            question: "Adevărat sau Fals?",
            statement: "Orice număr natural > 1 poate fi descompus în factori primi.",
            isTrue: true,
            explanation: "Teorema fundamentală a aritmeticii garantează unicitatea descompunerii.",
          },
          {
            id: eid(2,4,3), type: "order", xp: 5,
            question: "Aranjează algoritmul de descompunere:",
            lines: [
              { id: "l1", text: "n = 60", order: 1 },
              { id: "l2", text: "d = 2", order: 2 },
              { id: "l3", text: "while n > 1:", order: 3 },
              { id: "l4", text: "    while n % d == 0:", order: 4 },
              { id: "l5", text: "        print(d)", order: 5 },
              { id: "l6", text: "        n //= d", order: 6 },
              { id: "l7", text: "    d += 1", order: 7 },
            ],
            explanation: "Împărțim repetat la d cât timp se poate, apoi creștem d. 60 = 2² × 3 × 5.",
          },
          {
            id: eid(2,4,4), type: "fill", xp: 5,
            question: "Completează condiția internă a descompunerii:",
            codeTemplate: "while n ___ d == 0:\n    n //= d",
            blanks: [{ id: "b1", answer: "%" }],
            explanation: "Verificăm dacă n este divisibil cu d folosind operatorul modulo (%).",
          },
          {
            id: eid(2,4,5), type: "quiz", xp: 5,
            question: "Câți factori primi are 30 (2×3×5)?",
            options: [
              { id: "a", text: "2" }, { id: "b", text: "3" },
              { id: "c", text: "4" }, { id: "d", text: "5" },
            ],
            correctOptionId: "b",
            explanation: "30 = 2 × 3 × 5, deci are 3 factori primi distincți.",
          },
        ],
      },
      {
        id: "c2-l5",
        title: "Conversii între baze",
        description: "Baza 10 ↔ baza 2",
        xpReward: 30,
        exercises: [
          {
            id: eid(2,5,1), type: "quiz", xp: 5,
            question: "Cât este 13 în baza 2?",
            options: [
              { id: "a", text: "1101" }, { id: "b", text: "1011" },
              { id: "c", text: "1110" }, { id: "d", text: "1100" },
            ],
            correctOptionId: "a",
            explanation: "13 = 8+4+1 = 1×2³ + 1×2² + 0×2¹ + 1×2⁰ = 1101 în baza 2.",
          },
          {
            id: eid(2,5,2), type: "quiz", xp: 5,
            question: "Ce funcție Python convertește un număr în binar?",
            options: [
              { id: "a", text: "binary()" }, { id: "b", text: "bin()" },
              { id: "c", text: "toBin()" }, { id: "d", text: "base2()" },
            ],
            correctOptionId: "b",
            explanation: "Funcția built-in bin() convertește un număr întreg în reprezentarea sa binară.",
          },
          {
            id: eid(2,5,3), type: "truefalse", xp: 5,
            question: "Adevărat sau Fals?",
            statement: "bin(10) returnează '1010'.",
            isTrue: false,
            explanation: "bin(10) returnează '0b1010' – cu prefixul '0b'.",
          },
          {
            id: eid(2,5,4), type: "fill", xp: 5,
            question: "Completează pentru a converti din binar în zecimal:",
            codeTemplate: "binar = '1010'\nzecimal = ___(binar, 2)\nprint(zecimal)",
            blanks: [{ id: "b1", answer: "int" }],
            explanation: "int(string, baza) convertește un string din baza specificată în zecimal. int('1010', 2) = 10.",
          },
          {
            id: eid(2,5,5), type: "order", xp: 5,
            question: "Aranjează pașii conversiei lui 10 din baza 10 în baza 2:",
            lines: [
              { id: "l1", text: "10 ÷ 2 = 5 rest 0", order: 1 },
              { id: "l2", text: "5 ÷ 2 = 2 rest 1", order: 2 },
              { id: "l3", text: "2 ÷ 2 = 1 rest 0", order: 3 },
              { id: "l4", text: "1 ÷ 2 = 0 rest 1", order: 4 },
            ],
            explanation: "Împărțim repetat la 2 și citim resturile de jos în sus: 1010.",
          },
        ],
      },
      // --- PRACTICE LESSONS ---
      {
        id: "c2-l6", title: "Practică: Cifre avansate", description: "Oglinditul, suma cifrelor pare, produsul cifrelor", xpReward: 30, isPremium: true,
        exercises: [
          { id: eid(2,6,1), type: "quiz", xp: 5, question: "Care este oglinditul numărului 4567?",
            options: [{ id: "a", text: "7654" }, { id: "b", text: "4567" }, { id: "c", text: "7456" }, { id: "d", text: "6754" }], correctOptionId: "a",
            explanation: "Oglinditul se obține inversând ordinea cifrelor: 4567 → 7654." },
          { id: eid(2,6,2), type: "fill", xp: 5, question: "Completează pentru produsul cifrelor lui n:",
            codeTemplate: "n = 234\np = 1\nwhile n > 0:\n    p *= n ___ 10\n    n //= 10", blanks: [{ id: "b1", answer: "%" }],
            explanation: "Extragem fiecare cifră cu %10 și o înmulțim la produs. 2×3×4 = 24." },
          { id: eid(2,6,3), type: "order", xp: 5, question: "Aranjează codul pentru a număra cifrele pare ale unui număr:",
            lines: [
              { id: "l1", text: "n = 2468", order: 1 },
              { id: "l2", text: "count = 0", order: 2 },
              { id: "l3", text: "while n > 0:", order: 3 },
              { id: "l4", text: "    if (n % 10) % 2 == 0:", order: 4 },
              { id: "l5", text: "        count += 1", order: 5 },
              { id: "l6", text: "    n //= 10", order: 6 },
            ],
            explanation: "Extragem fiecare cifră cu %10, verificăm paritatea, numărăm cifrele pare." },
          { id: eid(2,6,4), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Suma cifrelor lui 999 este 27.", isTrue: true,
            explanation: "9 + 9 + 9 = 27." },
          { id: eid(2,6,5), type: "quiz", xp: 5, question: "Ce este un număr Armstrong de 3 cifre?",
            options: [{ id: "a", text: "Suma cifrelor = numărul" }, { id: "b", text: "Suma cuburilor cifrelor = numărul" }, { id: "c", text: "Produsul cifrelor = numărul" }, { id: "d", text: "Cifrele sunt crescătoare" }], correctOptionId: "b",
            explanation: "Ex: 153 = 1³+5³+3³ = 1+125+27 = 153. Suma puterilor cifrelor egal cu numărul." },
        ],
      },
      {
        id: "c2-l7", title: "Practică: Divizori complexi", description: "Numere prime, abundente, deficiente", xpReward: 35, isPremium: true,
        exercises: [
          { id: eid(2,7,1), type: "quiz", xp: 5, question: "Câți divizori are 24?",
            options: [{ id: "a", text: "6" }, { id: "b", text: "8" }, { id: "c", text: "4" }, { id: "d", text: "10" }], correctOptionId: "b",
            explanation: "Divizorii lui 24: 1,2,3,4,6,8,12,24 = 8 divizori." },
          { id: eid(2,7,2), type: "fill", xp: 5, question: "Completează pentru a calcula CMMMC(a,b):",
            codeTemplate: "# cmmdc deja calculat\ncmmmc = a * b // ___", blanks: [{ id: "b1", answer: "cmmdc" }],
            explanation: "CMMMC(a,b) = a × b / CMMDC(a,b). Formulă fundamentală." },
          { id: eid(2,7,3), type: "order", xp: 5, question: "Aranjează codul pentru a verifica dacă n este prim eficient:",
            lines: [
              { id: "l1", text: "from math import sqrt", order: 1 },
              { id: "l2", text: "def este_prim(n):", order: 2 },
              { id: "l3", text: "    if n < 2: return False", order: 3 },
              { id: "l4", text: "    for d in range(2, int(sqrt(n))+1):", order: 4 },
              { id: "l5", text: "        if n % d == 0: return False", order: 5 },
              { id: "l6", text: "    return True", order: 6 },
            ],
            explanation: "Verificăm doar până la √n, deoarece dacă n=a×b, cel puțin un factor e ≤ √n." },
          { id: eid(2,7,4), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Un număr abundent are suma divizorilor proprii mai mare decât el. 12 este abundent.", isTrue: true,
            explanation: "Divizorii proprii ai lui 12: 1+2+3+4+6 = 16 > 12, deci e abundent." },
          { id: eid(2,7,5), type: "quiz", xp: 5, question: "CMMMC(4, 6) = ?",
            options: [{ id: "a", text: "24" }, { id: "b", text: "12" }, { id: "c", text: "2" }, { id: "d", text: "6" }], correctOptionId: "b",
            explanation: "CMMDC(4,6)=2. CMMMC = 4×6/2 = 12." },
        ],
      },
      {
        id: "c2-l8", title: "Practică: Baze de numerație", description: "Conversii baza 2, 8, 16 și operații", xpReward: 35, isPremium: true,
        exercises: [
          { id: eid(2,8,1), type: "quiz", xp: 5, question: "Cât este 0b1111 în baza 10?",
            options: [{ id: "a", text: "16" }, { id: "b", text: "15" }, { id: "c", text: "14" }, { id: "d", text: "8" }], correctOptionId: "b",
            explanation: "1111₂ = 8+4+2+1 = 15." },
          { id: eid(2,8,2), type: "fill", xp: 5, question: "Completează pentru a converti în octal:",
            codeTemplate: "n = 64\nprint(___(n))", blanks: [{ id: "b1", answer: "oct" }],
            explanation: "oct() convertește un număr în reprezentare octală (baza 8). oct(64) = '0o100'." },
          { id: eid(2,8,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "hex(255) returnează '0xff'.", isTrue: true,
            explanation: "255 = 15×16+15 = FF în hexazecimal, deci '0xff'." },
          { id: eid(2,8,4), type: "quiz", xp: 5, question: "Ce bază folosește sistemul hexazecimal?",
            options: [{ id: "a", text: "2" }, { id: "b", text: "8" }, { id: "c", text: "10" }, { id: "d", text: "16" }], correctOptionId: "d",
            explanation: "Hexazecimal = baza 16, folosind cifrele 0-9 și literele A-F." },
          { id: eid(2,8,5), type: "order", xp: 5, question: "Aranjează pașii conversiei 26 din baza 10 în baza 2:",
            lines: [
              { id: "l1", text: "26 ÷ 2 = 13 rest 0", order: 1 },
              { id: "l2", text: "13 ÷ 2 = 6 rest 1", order: 2 },
              { id: "l3", text: "6 ÷ 2 = 3 rest 0", order: 3 },
              { id: "l4", text: "3 ÷ 2 = 1 rest 1", order: 4 },
              { id: "l5", text: "1 ÷ 2 = 0 rest 1", order: 5 },
            ],
            explanation: "Citim resturile de jos în sus: 11010₂ = 26₁₀." },
        ],
      },
      {
        id: "c2-l9", title: "Test: Prelucrări numerice", description: "Probleme complexe combinate", xpReward: 40, isPremium: true,
        exercises: [
          { id: eid(2,9,1), type: "quiz", xp: 5, question: "Ce afișează?\nn = 123\ns = 0\nwhile n:\n    s += n % 10\n    n //= 10\nprint(s % 9)",
            options: [{ id: "a", text: "6" }, { id: "b", text: "0" }, { id: "c", text: "3" }, { id: "d", text: "9" }], correctOptionId: "a",
            explanation: "s = 1+2+3 = 6. 6 % 9 = 6." },
          { id: eid(2,9,2), type: "fill", xp: 5, question: "Completează ciurul lui Eratostene:",
            codeTemplate: "ciur = [True] * 100\nfor i in range(2, 10):\n    if ciur[i]:\n        for j in range(i*i, 100, ___):\n            ciur[j] = False", blanks: [{ id: "b1", answer: "i" }],
            explanation: "Marcăm multiplii lui i (i², i²+i, i²+2i...) ca neprimi. Pasul este i." },
          { id: eid(2,9,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Două numere sunt coprime dacă CMMDC-ul lor este 1.", isTrue: true,
            explanation: "Coprime = nu au factori comuni, deci CMMDC = 1. Ex: 8 și 15." },
          { id: eid(2,9,4), type: "order", xp: 5, question: "Aranjează codul pentru a verifica dacă n este palindrom numeric:",
            lines: [
              { id: "l1", text: "n = 12321", order: 1 },
              { id: "l2", text: "s = str(n)", order: 2 },
              { id: "l3", text: "if s == s[::-1]:", order: 3 },
              { id: "l4", text: "    print('Palindrom')", order: 4 },
            ],
            explanation: "Convertim la string și comparăm cu inversul. Alternativ: construim inversul numeric." },
          { id: eid(2,9,5), type: "quiz", xp: 5, question: "Câte numere prime sunt între 1 și 20?",
            options: [{ id: "a", text: "6" }, { id: "b", text: "7" }, { id: "c", text: "8" }, { id: "d", text: "9" }], correctOptionId: "c",
            explanation: "Primele: 2,3,5,7,11,13,17,19 = 8 numere prime." },
          { id: eid(2,9,6), type: "fill", xp: 5, question: "Completează pentru a afla cifra maximă a lui n:",
            codeTemplate: "n = 3917\nmax_c = 0\nwhile n > 0:\n    c = n % 10\n    if c > max_c:\n        max_c = ___\n    n //= 10", blanks: [{ id: "b1", answer: "c" }],
            explanation: "Comparăm fiecare cifră cu maximul curent și actualizăm. max_c = c când găsim o cifră mai mare." },
        ],
      },
    ],
  },
  {
    id: "ch3",
    number: 3,
    title: "Liste – Organizare",
    description: "Model conceptual, stivă, coadă, frecvențe, clasa list și metodele sale",
    icon: "📋",
    color: "270 100% 65%",
    lessons: [
      {
        id: "c3-l1", title: "Modelul conceptual de listă", description: "Caracteristici, acces secvențial vs direct", xpReward: 20,
        exercises: [
          { id: eid(3,1,1), type: "quiz", xp: 5, question: "Ce index are primul element dintr-o listă Python?",
            options: [{ id: "a", text: "0" }, { id: "b", text: "1" }, { id: "c", text: "-1" }, { id: "d", text: "first" }], correctOptionId: "a",
            explanation: "Python folosește indexare de la 0. Primul element este lista[0]." },
          { id: eid(3,1,2), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Listele Python pot conține elemente de tipuri diferite.", isTrue: true, explanation: "Python permite liste heterogene: [1, 'abc', True]." },
          { id: eid(3,1,3), type: "quiz", xp: 5, question: "Ce returnează len([10, 20, 30])?",
            options: [{ id: "a", text: "2" }, { id: "b", text: "3" }, { id: "c", text: "30" }, { id: "d", text: "60" }], correctOptionId: "b",
            explanation: "len() returnează numărul de elemente din listă. Lista are 3 elemente." },
          { id: eid(3,1,4), type: "fill", xp: 5, question: "Completează pentru a accesa ultimul element:",
            codeTemplate: "lista = [1, 2, 3, 4, 5]\nultimul = lista[___]", blanks: [{ id: "b1", answer: "-1" }],
            explanation: "Indexul -1 accesează ultimul element al listei în Python." },
          { id: eid(3,1,5), type: "quiz", xp: 5, question: "Ce tip de acces este lista[2]?",
            options: [{ id: "a", text: "Secvențial" }, { id: "b", text: "Direct (random)" }, { id: "c", text: "Serial" }, { id: "d", text: "Binar" }], correctOptionId: "b",
            explanation: "Accesul prin index (lista[2]) este acces direct – ajungem imediat la element fără a parcurge lista." },
        ],
      },
      {
        id: "c3-l2", title: "Stiva și coada", description: "LIFO, FIFO, exemple practice", xpReward: 25,
        exercises: [
          { id: eid(3,2,1), type: "quiz", xp: 5, question: "Ce principiu folosește stiva?",
            options: [{ id: "a", text: "FIFO" }, { id: "b", text: "LIFO" }, { id: "c", text: "FILO" }, { id: "d", text: "Random" }], correctOptionId: "b",
            explanation: "LIFO = Last In, First Out. Ultimul element adăugat este primul scos." },
          { id: eid(3,2,2), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "La o coadă, elementul care intră primul iese primul.", isTrue: true, explanation: "FIFO = First In, First Out." },
          { id: eid(3,2,3), type: "quiz", xp: 5, question: "Ce metodă Python simulează pop din stivă?",
            options: [{ id: "a", text: "list.pop()" }, { id: "b", text: "list.remove()" }, { id: "c", text: "list.delete()" }, { id: "d", text: "list.pop(0)" }], correctOptionId: "a",
            explanation: "pop() fără argument scoate ultimul element, exact ca la o stivă (LIFO)." },
          { id: eid(3,2,4), type: "fill", xp: 5, question: "Completează pentru a scoate primul element (ca la o coadă):",
            codeTemplate: "coada = [1, 2, 3]\nelement = coada.pop(___)", blanks: [{ id: "b1", answer: "0" }],
            explanation: "pop(0) scoate primul element, simulând comportamentul FIFO al unei cozi." },
          { id: eid(3,2,5), type: "order", xp: 5, question: "Aranjează operațiile pe o stivă (push 1, push 2, pop, push 3):",
            lines: [
              { id: "l1", text: "stiva.append(1)", order: 1 },
              { id: "l2", text: "stiva.append(2)", order: 2 },
              { id: "l3", text: "stiva.pop()", order: 3 },
              { id: "l4", text: "stiva.append(3)", order: 4 },
            ],
            explanation: "append() adaugă la sfârșit (push), pop() scoate de la sfârșit. Stiva finală: [1, 3]." },
        ],
      },
      {
        id: "c3-l3", title: "Lista de frecvențe", description: "Construire și utilizare", xpReward: 25,
        exercises: [
          { id: eid(3,3,1), type: "quiz", xp: 5, question: "Ce stochează o listă de frecvențe?",
            options: [{ id: "a", text: "Elementele sortate" }, { id: "b", text: "De câte ori apare fiecare valoare" }, { id: "c", text: "Indexul elementelor" }, { id: "d", text: "Media valorilor" }], correctOptionId: "b",
            explanation: "Lista de frecvențe contorizează aparițiile fiecărei valori pe poziția corespunzătoare." },
          { id: eid(3,3,2), type: "fill", xp: 5, question: "Completează pentru a incrementa frecvența:",
            codeTemplate: "freq = [0] * 10\nn = 5\nfreq[___] += 1", blanks: [{ id: "b1", answer: "n" }],
            explanation: "freq[n] accesează poziția corespunzătoare valorii n și incrementează contorul." },
          { id: eid(3,3,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Lista de frecvențe este utilă când valorile sunt într-un interval cunoscut.", isTrue: true, explanation: "Funcționează optim când cunoaștem domeniul valorilor." },
          { id: eid(3,3,4), type: "quiz", xp: 5, question: "Pentru lista [1,2,1,3,2,1], freq[1] = ?",
            options: [{ id: "a", text: "1" }, { id: "b", text: "2" }, { id: "c", text: "3" }, { id: "d", text: "0" }], correctOptionId: "c",
            explanation: "Valoarea 1 apare de 3 ori în lista [1,2,1,3,2,1], deci freq[1] = 3." },
          { id: eid(3,3,5), type: "order", xp: 5, question: "Aranjează codul pentru a construi lista de frecvențe:",
            lines: [
              { id: "l1", text: "lista = [1, 3, 2, 1, 3]", order: 1 },
              { id: "l2", text: "freq = [0] * 4", order: 2 },
              { id: "l3", text: "for x in lista:", order: 3 },
              { id: "l4", text: "    freq[x] += 1", order: 4 },
            ],
            explanation: "Creăm lista de frecvențe cu zerouri, apoi parcurgem și incrementăm la fiecare apariție." },
        ],
      },
      {
        id: "c3-l4", title: "Parcurgere liniară", description: "Cu și fără memorare", xpReward: 20,
        exercises: [
          { id: eid(3,4,1), type: "quiz", xp: 5, question: "Ce înseamnă parcurgere cu memorare?",
            options: [{ id: "a", text: "Salvezi rezultate intermediare" }, { id: "b", text: "Memorezi codul" }, { id: "c", text: "Folosești RAM" }, { id: "d", text: "Copiezi lista" }], correctOptionId: "a",
            explanation: "Parcurgerea cu memorare salvează rezultate (ex: maxim, sumă) pe parcurs." },
          { id: eid(3,4,2), type: "fill", xp: 5, question: "Completează pentru a găsi maximul:",
            codeTemplate: "lista = [3, 7, 2, 9, 1]\nmax_val = lista[0]\nfor x in lista:\n    if x ___ max_val:\n        max_val = x", blanks: [{ id: "b1", answer: ">" }],
            explanation: "Comparăm fiecare element cu maximul curent. Dacă x > max_val, actualizăm." },
          { id: eid(3,4,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Parcurgerea liniară are complexitate O(n).", isTrue: true, explanation: "Vizităm fiecare element o singură dată." },
          { id: eid(3,4,4), type: "order", xp: 5, question: "Aranjează codul pentru a număra elementele pare:",
            lines: [
              { id: "l1", text: "lista = [1, 4, 6, 3, 8]", order: 1 },
              { id: "l2", text: "count = 0", order: 2 },
              { id: "l3", text: "for x in lista:", order: 3 },
              { id: "l4", text: "    if x % 2 == 0:", order: 4 },
              { id: "l5", text: "        count += 1", order: 5 },
            ],
            explanation: "Parcurgem lista, verificăm paritatea cu % 2 și numărăm elementele pare." },
          { id: eid(3,4,5), type: "quiz", xp: 5, question: "Parcurgerea fără memorare înseamnă:",
            options: [{ id: "a", text: "Afișezi direct fiecare element" }, { id: "b", text: "Nu folosești variabile suplimentare" }, { id: "c", text: "Procesezi și afișezi pe loc, fără a salva rezultate" }, { id: "d", text: "Nu parcurgi lista" }], correctOptionId: "c",
            explanation: "Fără memorare = procesăm elementele imediat, fără a acumula rezultate într-o variabilă." },
        ],
      },
      {
        id: "c3-l5", title: "Clasa list în Python", description: "Operatori: [], in, +, *", xpReward: 20,
        exercises: [
          { id: eid(3,5,1), type: "quiz", xp: 5, question: "Ce returnează [1,2] + [3,4]?",
            options: [{ id: "a", text: "[1,2,3,4]" }, { id: "b", text: "[4,6]" }, { id: "c", text: "10" }, { id: "d", text: "Eroare" }], correctOptionId: "a",
            explanation: "Operatorul + concatenează listele: [1,2] + [3,4] = [1,2,3,4]." },
          { id: eid(3,5,2), type: "quiz", xp: 5, question: "Ce returnează [0] * 3?",
            options: [{ id: "a", text: "[0,0,0]" }, { id: "b", text: "[3]" }, { id: "c", text: "[0,3]" }, { id: "d", text: "0" }], correctOptionId: "a",
            explanation: "Operatorul * repetă lista: [0] * 3 = [0, 0, 0]." },
          { id: eid(3,5,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Expresia '5 in [1,2,3,4,5]' returnează True.", isTrue: true, explanation: "Operatorul 'in' verifică apartenența la listă." },
          { id: eid(3,5,4), type: "fill", xp: 5, question: "Completează pentru a obține sublistă (slice):",
            codeTemplate: "lista = [10,20,30,40,50]\nsub = lista[1___3]", blanks: [{ id: "b1", answer: ":" }],
            explanation: "Operatorul : (slice) extrage o sublistă. lista[1:3] returnează elementele de pe pozițiile 1 și 2." },
          { id: eid(3,5,5), type: "quiz", xp: 5, question: "Ce returnează lista[1:4] pentru [10,20,30,40,50]?",
            options: [{ id: "a", text: "[20,30,40]" }, { id: "b", text: "[10,20,30,40]" }, { id: "c", text: "[20,30]" }, { id: "d", text: "[10,20,30]" }], correctOptionId: "a",
            explanation: "lista[1:4] returnează elementele de la indexul 1 până la 3 (4 exclus): [20, 30, 40]." },
        ],
      },
      {
        id: "c3-l6", title: "Metode ale clasei list", description: "append, insert, pop, remove, sort, etc.", xpReward: 25,
        exercises: [
          { id: eid(3,6,1), type: "quiz", xp: 5, question: "Ce face lista.append(5)?",
            options: [{ id: "a", text: "Adaugă 5 la început" }, { id: "b", text: "Adaugă 5 la sfârșit" }, { id: "c", text: "Înlocuiește ultimul cu 5" }, { id: "d", text: "Șterge 5" }], correctOptionId: "b",
            explanation: "append() adaugă elementul la sfârșitul listei." },
          { id: eid(3,6,2), type: "fill", xp: 5, question: "Completează pentru a insera 99 pe poziția 2:",
            codeTemplate: "lista = [1, 2, 3]\nlista.___(2, 99)", blanks: [{ id: "b1", answer: "insert" }],
            explanation: "insert(index, valoare) inserează valoarea pe poziția specificată." },
          { id: eid(3,6,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "lista.sort() returnează o nouă listă sortată.", isTrue: false, explanation: "sort() modifică lista in-place și returnează None. Pentru copie sortată, folosiți sorted()." },
          { id: eid(3,6,4), type: "quiz", xp: 5, question: "Ce face lista.pop(0)?",
            options: [{ id: "a", text: "Șterge ultimul element" }, { id: "b", text: "Șterge și returnează primul element" }, { id: "c", text: "Adaugă 0" }, { id: "d", text: "Returnează 0" }], correctOptionId: "b",
            explanation: "pop(0) scoate și returnează elementul de pe poziția 0 (primul element)." },
          { id: eid(3,6,5), type: "order", xp: 5, question: "Aranjează operațiile pentru a crea, adăuga și sorta:",
            lines: [
              { id: "l1", text: "lista = []", order: 1 },
              { id: "l2", text: "lista.append(3)", order: 2 },
              { id: "l3", text: "lista.append(1)", order: 3 },
              { id: "l4", text: "lista.append(2)", order: 4 },
              { id: "l5", text: "lista.sort()", order: 5 },
            ],
            explanation: "Creăm lista goală, adăugăm elemente cu append(), apoi sortăm. Rezultat: [1, 2, 3]." },
        ],
      },
      // --- PRACTICE LESSONS ---
      {
        id: "c3-l7", title: "Practică: Operații cu liste", description: "Filtrare, transformare, căutare", xpReward: 30, isPremium: true,
        exercises: [
          { id: eid(3,7,1), type: "quiz", xp: 5, question: "Ce returnează [x**2 for x in range(5)]?",
            options: [{ id: "a", text: "[0,1,4,9,16]" }, { id: "b", text: "[1,4,9,16,25]" }, { id: "c", text: "[0,2,4,6,8]" }, { id: "d", text: "[0,1,2,3,4]" }], correctOptionId: "a",
            explanation: "List comprehension: 0²=0, 1²=1, 2²=4, 3²=9, 4²=16." },
          { id: eid(3,7,2), type: "fill", xp: 5, question: "Completează list comprehension pentru numerele pare:",
            codeTemplate: "pare = [x for x in range(20) if x % 2 ___ 0]", blanks: [{ id: "b1", answer: "==" }],
            explanation: "Filtrăm cu if x % 2 == 0 pentru a păstra doar numerele pare." },
          { id: eid(3,7,3), type: "order", xp: 5, question: "Aranjează codul pentru a elimina duplicatele păstrând ordinea:",
            lines: [
              { id: "l1", text: "lista = [3, 1, 2, 3, 1, 4]", order: 1 },
              { id: "l2", text: "vazute = []", order: 2 },
              { id: "l3", text: "for x in lista:", order: 3 },
              { id: "l4", text: "    if x not in vazute:", order: 4 },
              { id: "l5", text: "        vazute.append(x)", order: 5 },
            ],
            explanation: "Parcurgem și adăugăm doar elementele nevăzute. Rezultat: [3, 1, 2, 4]." },
          { id: eid(3,7,4), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "list(range(3)) returnează [0, 1, 2].", isTrue: true,
            explanation: "range(3) generează 0,1,2 iar list() le convertește în listă." },
          { id: eid(3,7,5), type: "quiz", xp: 5, question: "Ce face lista.reverse()?",
            options: [{ id: "a", text: "Returnează lista inversată" }, { id: "b", text: "Inversează lista in-place" }, { id: "c", text: "Sortează descrescător" }, { id: "d", text: "Șterge lista" }], correctOptionId: "b",
            explanation: "reverse() modifică lista in-place (nu returnează nimic). Pentru copie: lista[::-1]." },
        ],
      },
      {
        id: "c3-l8", title: "Practică: Liste 2D", description: "Matrice, parcurgere pe linii și coloane", xpReward: 35, isPremium: true,
        exercises: [
          { id: eid(3,8,1), type: "quiz", xp: 5, question: "Cum accesăm elementul de pe linia 1, coloana 2?\nm = [[1,2,3],[4,5,6]]",
            options: [{ id: "a", text: "m[1][2]" }, { id: "b", text: "m[2][1]" }, { id: "c", text: "m(1,2)" }, { id: "d", text: "m[1,2]" }], correctOptionId: "a",
            explanation: "m[1][2] = al 2-lea rând, al 3-lea element = 6." },
          { id: eid(3,8,2), type: "fill", xp: 5, question: "Completează pentru a crea o matrice 3×3 cu zerouri:",
            codeTemplate: "m = [[0]*3 for _ in range(___)]", blanks: [{ id: "b1", answer: "3" }],
            explanation: "Creăm 3 rânduri, fiecare cu 3 zerouri, folosind list comprehension." },
          { id: eid(3,8,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "[[0]*3]*3 creează corect o matrice 3×3 independentă.", isTrue: false,
            explanation: "* repetă REFERINȚA la aceeași listă. Modificarea unui rând le modifică pe toate!" },
          { id: eid(3,8,4), type: "order", xp: 5, question: "Aranjează codul pentru suma elementelor unei matrice:",
            lines: [
              { id: "l1", text: "m = [[1,2],[3,4]]", order: 1 },
              { id: "l2", text: "s = 0", order: 2 },
              { id: "l3", text: "for linie in m:", order: 3 },
              { id: "l4", text: "    for elem in linie:", order: 4 },
              { id: "l5", text: "        s += elem", order: 5 },
            ],
            explanation: "Parcurgem fiecare linie, apoi fiecare element din linie. s = 1+2+3+4 = 10." },
          { id: eid(3,8,5), type: "quiz", xp: 5, question: "Câte elemente are matricea m cu len(m)=3 și len(m[0])=4?",
            options: [{ id: "a", text: "7" }, { id: "b", text: "12" }, { id: "c", text: "3" }, { id: "d", text: "4" }], correctOptionId: "b",
            explanation: "3 rânduri × 4 coloane = 12 elemente." },
        ],
      },
      {
        id: "c3-l9", title: "Practică: Algoritmi pe liste", description: "Interclasare, rotire, secvențe", xpReward: 35, isPremium: true,
        exercises: [
          { id: eid(3,9,1), type: "quiz", xp: 5, question: "Ce face zip([1,2,3], ['a','b','c'])?",
            options: [{ id: "a", text: "[(1,'a'),(2,'b'),(3,'c')]" }, { id: "b", text: "[1,'a',2,'b',3,'c']" }, { id: "c", text: "Eroare" }, { id: "d", text: "{1:'a',2:'b'}" }], correctOptionId: "a",
            explanation: "zip() combină elementele de pe aceeași poziție în tupluri." },
          { id: eid(3,9,2), type: "fill", xp: 5, question: "Completează pentru a roti lista la stânga cu 1 poziție:",
            codeTemplate: "lista = [1,2,3,4,5]\nlista = lista[1:] + lista[___]", blanks: [{ id: "b1", answer: ":1" }],
            explanation: "lista[1:] = [2,3,4,5], lista[:1] = [1]. Concatenate: [2,3,4,5,1]." },
          { id: eid(3,9,3), type: "order", xp: 5, question: "Aranjează interclasarea a două liste sortate:",
            lines: [
              { id: "l1", text: "a, b = [1,3,5], [2,4,6]", order: 1 },
              { id: "l2", text: "result = []", order: 2 },
              { id: "l3", text: "i = j = 0", order: 3 },
              { id: "l4", text: "while i < len(a) and j < len(b):", order: 4 },
              { id: "l5", text: "    if a[i] <= b[j]: result.append(a[i]); i+=1", order: 5 },
              { id: "l6", text: "    else: result.append(b[j]); j+=1", order: 6 },
            ],
            explanation: "Comparăm elementele curente din ambele liste și adăugăm pe cel mai mic." },
          { id: eid(3,9,4), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "enumerate(['a','b','c']) generează (0,'a'), (1,'b'), (2,'c').", isTrue: true,
            explanation: "enumerate() adaugă un contor automat la fiecare element." },
          { id: eid(3,9,5), type: "quiz", xp: 5, question: "Ce returnează sorted([3,1,2], reverse=True)?",
            options: [{ id: "a", text: "[1,2,3]" }, { id: "b", text: "[3,2,1]" }, { id: "c", text: "[3,1,2]" }, { id: "d", text: "None" }], correctOptionId: "b",
            explanation: "sorted() returnează o nouă listă sortată. reverse=True = ordine descrescătoare." },
        ],
      },
      {
        id: "c3-l10", title: "Test: Liste", description: "Probleme complexe cu liste și algoritmi", xpReward: 40, isPremium: true,
        exercises: [
          { id: eid(3,10,1), type: "quiz", xp: 5, question: "Ce afișează?\na = [1,2,3]\nb = a\nb.append(4)\nprint(len(a))",
            options: [{ id: "a", text: "3" }, { id: "b", text: "4" }, { id: "c", text: "Eroare" }, { id: "d", text: "None" }], correctOptionId: "b",
            explanation: "b = a creează o referință, nu o copie! Modificarea lui b modifică și a. len(a) = 4." },
          { id: eid(3,10,2), type: "fill", xp: 5, question: "Completează pentru o copie independentă a listei:",
            codeTemplate: "a = [1,2,3]\nb = a.___()", blanks: [{ id: "b1", answer: "copy" }],
            explanation: "copy() creează o copie superficială independentă. Alternativ: b = a[:]." },
          { id: eid(3,10,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "[x for x in range(10) if x%3==0] returnează [0,3,6,9].", isTrue: true,
            explanation: "Filtrăm multiplii lui 3 de la 0 la 9: 0, 3, 6, 9." },
          { id: eid(3,10,4), type: "order", xp: 5, question: "Aranjează codul pentru a găsi al 2-lea cel mai mare element:",
            lines: [
              { id: "l1", text: "lista = [5, 3, 8, 1, 8, 7]", order: 1 },
              { id: "l2", text: "unice = list(set(lista))", order: 2 },
              { id: "l3", text: "unice.sort()", order: 3 },
              { id: "l4", text: "print(unice[-2])", order: 4 },
            ],
            explanation: "Eliminăm duplicatele cu set(), sortăm, luăm penultimul element. Rezultat: 7." },
          { id: eid(3,10,5), type: "quiz", xp: 5, question: "Ce returnează list(set([1,2,2,3,3,3]))?",
            options: [{ id: "a", text: "[1,2,3]" }, { id: "b", text: "[1,2,2,3,3,3]" }, { id: "c", text: "{1,2,3}" }, { id: "d", text: "[3,2,1]" }], correctOptionId: "a",
            explanation: "set() elimină duplicatele, list() convertește înapoi. Ordinea poate varia." },
        ],
      },
    ],
  },
  {
    id: "ch4",
    number: 4,
    title: "Generare și Sortare",
    description: "Secvențe, Fibonacci, selecție minim, bubble sort, comparare metode",
    icon: "🔄",
    color: "45 100% 51%",
    lessons: [
      {
        id: "c4-l1", title: "Generarea secvențelor", description: "Șiruri recurente, Fibonacci", xpReward: 25,
        exercises: [
          { id: eid(4,1,1), type: "quiz", xp: 5, question: "Ce este al 7-lea termen Fibonacci? (0,1,1,2,3,5,8,...)",
            options: [{ id: "a", text: "8" }, { id: "b", text: "13" }, { id: "c", text: "5" }, { id: "d", text: "21" }], correctOptionId: "b",
            explanation: "Termenii sunt: 0,1,1,2,3,5,8,13. Al 7-lea (de la 0) este 13." },
          { id: eid(4,1,2), type: "fill", xp: 5, question: "Completează relația de recurență Fibonacci:",
            codeTemplate: "a, b = 0, 1\nfor i in range(10):\n    a, b = b, a ___ b", blanks: [{ id: "b1", answer: "+" }],
            explanation: "Fiecare termen Fibonacci este suma celor doi anteriori: F(n) = F(n-1) + F(n-2)." },
          { id: eid(4,1,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Primul termen al șirului Fibonacci este 1.", isTrue: false, explanation: "Primul termen este 0 (sau 1, depinde de convenție), dar secvența clasică începe cu 0, 1." },
          { id: eid(4,1,4), type: "order", xp: 5, question: "Aranjează codul pentru a genera primii n termeni Fibonacci:",
            lines: [
              { id: "l1", text: "a, b = 0, 1", order: 1 },
              { id: "l2", text: "for i in range(n):", order: 2 },
              { id: "l3", text: "    print(a)", order: 3 },
              { id: "l4", text: "    a, b = b, a + b", order: 4 },
            ],
            explanation: "Inițializăm cu 0 și 1, afișăm a, apoi actualizăm simultan: a devine b, b devine a+b." },
          { id: eid(4,1,5), type: "quiz", xp: 5, question: "Ce tip de secvență este 2, 4, 8, 16, 32?",
            options: [{ id: "a", text: "Aritmetică" }, { id: "b", text: "Geometrică" }, { id: "c", text: "Fibonacci" }, { id: "d", text: "Primes" }], correctOptionId: "b",
            explanation: "Fiecare termen se obține prin înmulțirea cu 2 (rație constantă), deci e progresie geometrică." },
        ],
      },
      {
        id: "c4-l2", title: "Sortare prin selecția minimului", description: "Algoritm pas cu pas", xpReward: 30,
        exercises: [
          { id: eid(4,2,1), type: "quiz", xp: 5, question: "Ce complexitate are sortarea prin selecție?",
            options: [{ id: "a", text: "O(n)" }, { id: "b", text: "O(n log n)" }, { id: "c", text: "O(n²)" }, { id: "d", text: "O(1)" }], correctOptionId: "c",
            explanation: "Sortarea prin selecție compară fiecare element cu toate celelalte, deci O(n²)." },
          { id: eid(4,2,2), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Sortarea prin selecție găsește minimul și îl plasează pe poziția corectă, pe rând.", isTrue: true, explanation: "La fiecare pas selectează minimul din sublista nesortată." },
          { id: eid(4,2,3), type: "order", xp: 5, question: "Aranjează pașii sortării prin selecție pentru [3,1,2]:",
            lines: [
              { id: "l1", text: "Găsește min din [3,1,2] → 1", order: 1 },
              { id: "l2", text: "Interschimbă: [1,3,2]", order: 2 },
              { id: "l3", text: "Găsește min din [3,2] → 2", order: 3 },
              { id: "l4", text: "Interschimbă: [1,2,3]", order: 4 },
            ],
            explanation: "La fiecare pas găsim minimul din porțiunea nesortată și îl punem pe poziția corectă." },
          { id: eid(4,2,4), type: "fill", xp: 5, question: "Completează interschimbarea în sortare:",
            codeTemplate: "lista[i], lista[min_idx] = lista[min_idx], lista[___]", blanks: [{ id: "b1", answer: "i" }],
            explanation: "Interschimbarea (swap) în Python: a, b = b, a. Aici schimbăm elementul curent cu minimul." },
          { id: eid(4,2,5), type: "quiz", xp: 5, question: "Câte comparări face selecția minimului pentru n=5?",
            options: [{ id: "a", text: "5" }, { id: "b", text: "10" }, { id: "c", text: "25" }, { id: "d", text: "15" }], correctOptionId: "b",
            explanation: "Formula: n(n-1)/2 = 5×4/2 = 10 comparări." },
        ],
      },
      {
        id: "c4-l3", title: "Sortare cu lista de frecvențe", description: "Când și cum se aplică", xpReward: 25,
        exercises: [
          { id: eid(4,3,1), type: "quiz", xp: 5, question: "Când este eficientă sortarea cu frecvențe?",
            options: [{ id: "a", text: "Întotdeauna" }, { id: "b", text: "Când valorile sunt într-un interval mic" }, { id: "c", text: "Doar pentru stringuri" }, { id: "d", text: "Când lista e mare" }], correctOptionId: "b",
            explanation: "Sortarea cu frecvențe e eficientă când domeniul valorilor e limitat (ex: note de la 1 la 10)." },
          { id: eid(4,3,2), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Sortarea cu frecvențe poate avea complexitate O(n).", isTrue: true, explanation: "Dacă domeniul valorilor e mic, complexitatea e O(n + k) ≈ O(n)." },
          { id: eid(4,3,3), type: "order", xp: 5, question: "Aranjează pașii sortării cu frecvențe pentru [2,1,2,0,1]:",
            lines: [
              { id: "l1", text: "Construiește freq: [1, 2, 2]", order: 1 },
              { id: "l2", text: "Parcurge freq de la 0 la max", order: 2 },
              { id: "l3", text: "Afișează fiecare valoare de freq[i] ori", order: 3 },
              { id: "l4", text: "Rezultat: [0, 1, 1, 2, 2]", order: 4 },
            ],
            explanation: "Construim frecvențele, apoi reconstruim lista parcurgând freq de la 0 la valoarea maximă." },
          { id: eid(4,3,4), type: "fill", xp: 5, question: "Completează reconstrucția listei din frecvențe:",
            codeTemplate: "for i in range(len(freq)):\n    for j in range(freq[___]):\n        result.append(i)", blanks: [{ id: "b1", answer: "i" }],
            explanation: "freq[i] ne spune de câte ori apare valoarea i. Adăugăm i de freq[i] ori în rezultat." },
          { id: eid(4,3,5), type: "quiz", xp: 5, question: "Ce complexitate spațială are sortarea cu frecvențe?",
            options: [{ id: "a", text: "O(1)" }, { id: "b", text: "O(n)" }, { id: "c", text: "O(k) - dimensiunea domeniului" }, { id: "d", text: "O(n²)" }], correctOptionId: "c",
            explanation: "Avem nevoie de o listă de frecvențe de dimensiune k, unde k este domeniul valorilor." },
        ],
      },
      {
        id: "c4-l4", title: "Metoda bulelor (Bubble Sort)", description: "Comparare și interschimbare", xpReward: 25,
        exercises: [
          { id: eid(4,4,1), type: "quiz", xp: 5, question: "Ce face Bubble Sort la fiecare trecere?",
            options: [{ id: "a", text: "Duce maximul la final" }, { id: "b", text: "Găsește minimul" }, { id: "c", text: "Împarte lista în două" }, { id: "d", text: "Inversează lista" }], correctOptionId: "a",
            explanation: "La fiecare trecere, cel mai mare element 'urcă' la finalul listei, ca un balon." },
          { id: eid(4,4,2), type: "fill", xp: 5, question: "Completează condiția de interschimbare:",
            codeTemplate: "if lista[j] ___ lista[j+1]:\n    lista[j], lista[j+1] = lista[j+1], lista[j]", blanks: [{ id: "b1", answer: ">" }],
            explanation: "Dacă elementul curent e mai mare decât următorul, le interschimbăm." },
          { id: eid(4,4,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Bubble Sort are complexitatea O(n²) în cel mai rău caz.", isTrue: true, explanation: "Necesită n×(n-1)/2 comparări în cel mai rău caz." },
          { id: eid(4,4,4), type: "order", xp: 5, question: "Aranjează algoritmul Bubble Sort:",
            lines: [
              { id: "l1", text: "for i in range(len(lista)-1):", order: 1 },
              { id: "l2", text: "    for j in range(len(lista)-1-i):", order: 2 },
              { id: "l3", text: "        if lista[j] > lista[j+1]:", order: 3 },
              { id: "l4", text: "            lista[j], lista[j+1] = lista[j+1], lista[j]", order: 4 },
            ],
            explanation: "Două bucle imbricate: externă pentru treceri, internă pentru comparări adiacente." },
          { id: eid(4,4,5), type: "quiz", xp: 5, question: "Câte treceri complete face Bubble Sort pentru [4,3,2,1]?",
            options: [{ id: "a", text: "2" }, { id: "b", text: "3" }, { id: "c", text: "4" }, { id: "d", text: "6" }], correctOptionId: "b",
            explanation: "Pentru n=4 elemente, Bubble Sort face cel mult n-1=3 treceri." },
        ],
      },
      {
        id: "c4-l5", title: "Compararea sortărilor", description: "Eficiență, număr de operații", xpReward: 20,
        exercises: [
          { id: eid(4,5,1), type: "quiz", xp: 5, question: "Care sortare este cea mai rapidă în medie?",
            options: [{ id: "a", text: "Bubble Sort" }, { id: "b", text: "Selecție" }, { id: "c", text: "Cu frecvențe (dacă se aplică)" }, { id: "d", text: "Toate sunt la fel" }], correctOptionId: "c",
            explanation: "Sortarea cu frecvențe are O(n+k) – liniară – față de O(n²) pentru celelalte." },
          { id: eid(4,5,2), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Bubble Sort și Selection Sort au aceeași complexitate O(n²).", isTrue: true, explanation: "Ambele au complexitate pătratică în cel mai rău caz." },
          { id: eid(4,5,3), type: "order", xp: 5, question: "Ordonează metodele de sortare de la cea mai lentă la cea mai rapidă (caz general):",
            lines: [
              { id: "l1", text: "Bubble Sort - O(n²)", order: 1 },
              { id: "l2", text: "Selection Sort - O(n²)", order: 2 },
              { id: "l3", text: "Counting Sort - O(n+k)", order: 3 },
            ],
            explanation: "Bubble Sort și Selection Sort sunt O(n²), Counting Sort este O(n+k) – cel mai rapid." },
          { id: eid(4,5,4), type: "quiz", xp: 5, question: "Ce sortare din Python folosește funcția sorted()?",
            options: [{ id: "a", text: "Bubble Sort" }, { id: "b", text: "Timsort" }, { id: "c", text: "Selection Sort" }, { id: "d", text: "Counting Sort" }], correctOptionId: "b",
            explanation: "Python folosește Timsort – un algoritm hibrid eficient cu complexitate O(n log n)." },
          { id: eid(4,5,5), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Sortarea cu frecvențe funcționează eficient pentru orice tip de date.", isTrue: false, explanation: "Funcționează eficient doar pentru valori întregi cu domeniu limitat." },
        ],
      },
      // --- PRACTICE LESSONS ---
      {
        id: "c4-l6", title: "Practică: Sortare pas cu pas", description: "Simularea manuală a algoritmilor", xpReward: 30, isPremium: true,
        exercises: [
          { id: eid(4,6,1), type: "quiz", xp: 5, question: "După prima trecere Bubble Sort pe [5,3,1,4,2], care element ajunge la final?",
            options: [{ id: "a", text: "1" }, { id: "b", text: "5" }, { id: "c", text: "2" }, { id: "d", text: "4" }], correctOptionId: "b",
            explanation: "Bubble Sort 'urcă' maximul la final. 5 este cel mai mare, ajunge pe ultima poziție." },
          { id: eid(4,6,2), type: "fill", xp: 5, question: "Completează sortarea prin selecție:",
            codeTemplate: "for i in range(len(lista)):\n    min_idx = i\n    for j in range(i+1, len(lista)):\n        if lista[j] < lista[___]:\n            min_idx = j", blanks: [{ id: "b1", answer: "min_idx" }],
            explanation: "Comparăm cu elementul de pe poziția min_idx (minimul curent), nu cu i." },
          { id: eid(4,6,3), type: "order", xp: 5, question: "Aranjează pașii selecției minimului pentru [4,2,3,1]:",
            lines: [
              { id: "l1", text: "Pas 1: min=1, swap(4,1) → [1,2,3,4]", order: 1 },
              { id: "l2", text: "Pas 2: min=2, deja pe loc → [1,2,3,4]", order: 2 },
              { id: "l3", text: "Pas 3: min=3, deja pe loc → [1,2,3,4]", order: 3 },
            ],
            explanation: "La fiecare pas găsim minimul din sublista nesortată și îl punem în față." },
          { id: eid(4,6,4), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Bubble Sort optimizat se poate opri mai devreme dacă lista e deja sortată.", isTrue: true,
            explanation: "Dacă într-o trecere nu se face nicio interschimbare, lista e sortată → oprire." },
          { id: eid(4,6,5), type: "quiz", xp: 5, question: "Care este cel mai bun caz (best case) pentru Bubble Sort optimizat?",
            options: [{ id: "a", text: "O(n²)" }, { id: "b", text: "O(n)" }, { id: "c", text: "O(n log n)" }, { id: "d", text: "O(1)" }], correctOptionId: "b",
            explanation: "Dacă lista e deja sortată, face o singură trecere fără swap → O(n)." },
        ],
      },
      {
        id: "c4-l7", title: "Practică: Generare avansată", description: "Permutări, combinații, secvențe speciale", xpReward: 35, isPremium: true,
        exercises: [
          { id: eid(4,7,1), type: "quiz", xp: 5, question: "Câte permutări are mulțimea {1,2,3}?",
            options: [{ id: "a", text: "3" }, { id: "b", text: "6" }, { id: "c", text: "9" }, { id: "d", text: "8" }], correctOptionId: "b",
            explanation: "Permutări de n elemente = n! = 3! = 3×2×1 = 6." },
          { id: eid(4,7,2), type: "fill", xp: 5, question: "Completează generarea termenilor șirului: 1, 1, 2, 3, 5, 8...",
            codeTemplate: "a, b = 1, 1\nfor _ in range(10):\n    print(a)\n    a, b = b, a ___ b", blanks: [{ id: "b1", answer: "+" }],
            explanation: "Acesta este șirul Fibonacci. Fiecare termen = suma celor 2 anteriori." },
          { id: eid(4,7,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Numărul de submulțimi ale unei mulțimi cu n elemente este 2^n.", isTrue: true,
            explanation: "Fiecare element poate fi inclus sau nu: 2 opțiuni × n elemente = 2^n submulțimi." },
          { id: eid(4,7,4), type: "quiz", xp: 5, question: "Ce generează range(10, 0, -2)?",
            options: [{ id: "a", text: "10,8,6,4,2" }, { id: "b", text: "10,8,6,4,2,0" }, { id: "c", text: "8,6,4,2,0" }, { id: "d", text: "10,9,8,7,6" }], correctOptionId: "a",
            explanation: "De la 10, pas -2, oprim la 0 (exclus): 10, 8, 6, 4, 2." },
          { id: eid(4,7,5), type: "order", xp: 5, question: "Aranjează codul pentru a genera primele n triunghiulare (1,3,6,10...):",
            lines: [
              { id: "l1", text: "n = 5", order: 1 },
              { id: "l2", text: "t = 0", order: 2 },
              { id: "l3", text: "for i in range(1, n+1):", order: 3 },
              { id: "l4", text: "    t += i", order: 4 },
              { id: "l5", text: "    print(t)", order: 5 },
            ],
            explanation: "Numerele triunghiulare: T(n) = 1+2+...+n. Adunăm progresiv: 1, 3, 6, 10, 15." },
        ],
      },
      {
        id: "c4-l8", title: "Practică: Sortare aplicată", description: "Sortare cu chei, stabilitate, cazuri practice", xpReward: 35, isPremium: true,
        exercises: [
          { id: eid(4,8,1), type: "quiz", xp: 5, question: "Ce face sorted(['banana','ana','mar'], key=len)?",
            options: [{ id: "a", text: "['ana','mar','banana']" }, { id: "b", text: "['ana','banana','mar']" }, { id: "c", text: "['banana','ana','mar']" }, { id: "d", text: "['mar','ana','banana']" }], correctOptionId: "a",
            explanation: "key=len sortează după lungime: 'ana'(3), 'mar'(3), 'banana'(6)." },
          { id: eid(4,8,2), type: "fill", xp: 5, question: "Completează sortarea descrescătoare:",
            codeTemplate: "lista = [3,1,4,1,5]\nlista.sort(reverse=___)", blanks: [{ id: "b1", answer: "True" }],
            explanation: "reverse=True sortează în ordine descrescătoare: [5,4,3,1,1]." },
          { id: eid(4,8,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Timsort (sorted() din Python) este un algoritm stabil.", isTrue: true,
            explanation: "Stabil = elementele egale păstrează ordinea relativă din lista originală." },
          { id: eid(4,8,4), type: "order", xp: 5, question: "Aranjează codul pentru a sorta elevii după notă descrescător:",
            lines: [
              { id: "l1", text: "elevi = [('Ana',9),('Bob',7),('Cris',10)]", order: 1 },
              { id: "l2", text: "elevi.sort(key=lambda x: x[1], reverse=True)", order: 2 },
              { id: "l3", text: "for nume, nota in elevi:", order: 3 },
              { id: "l4", text: "    print(nume, nota)", order: 4 },
            ],
            explanation: "lambda x: x[1] extrage nota. reverse=True = descrescător: Cris 10, Ana 9, Bob 7." },
          { id: eid(4,8,5), type: "quiz", xp: 5, question: "Ce sortare este stabilă?",
            options: [{ id: "a", text: "Selection Sort" }, { id: "b", text: "Bubble Sort" }, { id: "c", text: "Ambele" }, { id: "d", text: "Niciuna" }], correctOptionId: "b",
            explanation: "Bubble Sort este stabil (nu interschimbă elemente egale). Selection Sort nu e stabil." },
        ],
      },
      {
        id: "c4-l9", title: "Test: Generare și sortare", description: "Probleme complexe finale", xpReward: 40, isPremium: true,
        exercises: [
          { id: eid(4,9,1), type: "quiz", xp: 5, question: "Ce afișează?\na = [3,1,4,1,5]\nprint(sorted(set(a)))",
            options: [{ id: "a", text: "[1,3,4,5]" }, { id: "b", text: "[1,1,3,4,5]" }, { id: "c", text: "[5,4,3,1]" }, { id: "d", text: "{1,3,4,5}" }], correctOptionId: "a",
            explanation: "set() elimină duplicatele, sorted() returnează lista sortată: [1,3,4,5]." },
          { id: eid(4,9,2), type: "fill", xp: 5, question: "Completează verificarea dacă lista e sortată:",
            codeTemplate: "def e_sortata(lst):\n    return all(lst[i] <= lst[i+1] for i in range(len(lst)___))", blanks: [{ id: "b1", answer: "-1" }],
            explanation: "Parcurgem până la len-1 pentru a nu depăși lista. Comparăm perechi consecutive." },
          { id: eid(4,9,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "sorted() creează o nouă listă, sort() modifică lista existentă.", isTrue: true,
            explanation: "sorted() → nouă listă. lista.sort() → modifică in-place, returnează None." },
          { id: eid(4,9,4), type: "order", xp: 5, question: "Aranjează Bubble Sort optimizat (cu oprire anticipată):",
            lines: [
              { id: "l1", text: "for i in range(len(lista)-1):", order: 1 },
              { id: "l2", text: "    schimbat = False", order: 2 },
              { id: "l3", text: "    for j in range(len(lista)-1-i):", order: 3 },
              { id: "l4", text: "        if lista[j]>lista[j+1]: lista[j],lista[j+1]=lista[j+1],lista[j]; schimbat=True", order: 4 },
              { id: "l5", text: "    if not schimbat: break", order: 5 },
            ],
            explanation: "Dacă într-o trecere nu s-a făcut nicio schimbare, lista e sortată → break." },
          { id: eid(4,9,5), type: "quiz", xp: 5, question: "Ce complexitate are sorted() din Python?",
            options: [{ id: "a", text: "O(n)" }, { id: "b", text: "O(n log n)" }, { id: "c", text: "O(n²)" }, { id: "d", text: "O(log n)" }], correctOptionId: "b",
            explanation: "Timsort are O(n log n) în medie și cel mai rău caz." },
        ],
      },
    ],
  },
  {
    id: "ch5",
    number: 5,
    title: "Subprograme",
    description: "Funcții, parametri, variabile locale/globale, funcții predefinite",
    icon: "⚙️",
    color: "340 80% 55%",
    lessons: [
      {
        id: "c5-l1", title: "Conceptul de subprogram", description: "def, parametri, corp, apel", xpReward: 20,
        exercises: [
          { id: eid(5,1,1), type: "quiz", xp: 5, question: "Cu ce cuvânt cheie definim o funcție în Python?",
            options: [{ id: "a", text: "function" }, { id: "b", text: "def" }, { id: "c", text: "func" }, { id: "d", text: "define" }], correctOptionId: "b",
            explanation: "În Python, funcțiile se definesc cu cuvântul cheie 'def'." },
          { id: eid(5,1,2), type: "fill", xp: 5, question: "Completează definirea funcției:",
            codeTemplate: "___ salut(nume):\n    print('Salut', nume)", blanks: [{ id: "b1", answer: "def" }],
            explanation: "Sintaxa pentru definirea unei funcții: def nume_funcție(parametri):" },
          { id: eid(5,1,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "O funcție Python trebuie să aibă cel puțin un parametru.", isTrue: false, explanation: "Funcțiile pot fi definite fără parametri: def salut():" },
          { id: eid(5,1,4), type: "order", xp: 5, question: "Aranjează codul pentru a defini și apela o funcție:",
            lines: [
              { id: "l1", text: "def patrat(x):", order: 1 },
              { id: "l2", text: "    return x * x", order: 2 },
              { id: "l3", text: "rezultat = patrat(5)", order: 3 },
              { id: "l4", text: "print(rezultat)", order: 4 },
            ],
            explanation: "Mai întâi definim funcția, apoi o apelăm cu un argument și afișăm rezultatul." },
          { id: eid(5,1,5), type: "quiz", xp: 5, question: "Ce afișează patrat(4) dacă def patrat(x): return x*x?",
            options: [{ id: "a", text: "8" }, { id: "b", text: "16" }, { id: "c", text: "4" }, { id: "d", text: "None" }], correctOptionId: "b",
            explanation: "patrat(4) = 4 * 4 = 16." },
        ],
      },
      {
        id: "c5-l2", title: "Variabile locale și globale", description: "Domeniu de vizibilitate", xpReward: 25,
        exercises: [
          { id: eid(5,2,1), type: "quiz", xp: 5, question: "O variabilă definită în interiorul unei funcții este:",
            options: [{ id: "a", text: "Globală" }, { id: "b", text: "Locală" }, { id: "c", text: "Publică" }, { id: "d", text: "Statică" }], correctOptionId: "b",
            explanation: "Variabilele definite în funcții sunt locale – accesibile doar în interiorul funcției." },
          { id: eid(5,2,2), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Cuvântul cheie 'global' permite modificarea unei variabile globale din interiorul unei funcții.", isTrue: true, explanation: "Fără 'global', Python creează o variabilă locală cu același nume." },
          { id: eid(5,2,3), type: "fill", xp: 5, question: "Completează pentru a accesa variabila globală:",
            codeTemplate: "x = 10\ndef modifica():\n    ___ x\n    x = 20", blanks: [{ id: "b1", answer: "global" }],
            explanation: "Cuvântul cheie 'global' declară că variabila x din funcție e aceeași cu cea globală." },
          { id: eid(5,2,4), type: "quiz", xp: 5, question: "Ce afișează?\nx = 5\ndef f():\n    x = 10\nf()\nprint(x)",
            options: [{ id: "a", text: "10" }, { id: "b", text: "5" }, { id: "c", text: "Eroare" }, { id: "d", text: "None" }], correctOptionId: "b",
            explanation: "x = 10 din funcție creează o variabilă locală, fără a afecta x-ul global. Afișează 5." },
          { id: eid(5,2,5), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Variabilele locale nu pot fi accesate în afara funcției.", isTrue: true, explanation: "Domeniul lor de vizibilitate e limitat la corpul funcției." },
        ],
      },
      {
        id: "c5-l3", title: "Parametri și returnare", description: "return, argumente", xpReward: 25,
        exercises: [
          { id: eid(5,3,1), type: "quiz", xp: 5, question: "Ce returnează o funcție fără 'return'?",
            options: [{ id: "a", text: "0" }, { id: "b", text: "None" }, { id: "c", text: "''" }, { id: "d", text: "Eroare" }], correctOptionId: "b",
            explanation: "Dacă nu există return explicit, funcția returnează None implicit." },
          { id: eid(5,3,2), type: "fill", xp: 5, question: "Completează funcția care returnează suma:",
            codeTemplate: "def suma(a, b):\n    ___ a + b", blanks: [{ id: "b1", answer: "return" }],
            explanation: "return trimite rezultatul înapoi la apelant. Fără return, funcția returnează None." },
          { id: eid(5,3,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "O funcție Python poate returna mai multe valori simultan.", isTrue: true, explanation: "Python permite: return a, b – returnează un tuplu." },
          { id: eid(5,3,4), type: "order", xp: 5, question: "Aranjează funcția care returnează min și max:",
            lines: [
              { id: "l1", text: "def min_max(lista):", order: 1 },
              { id: "l2", text: "    return min(lista), max(lista)", order: 2 },
              { id: "l3", text: "a, b = min_max([3,1,7,2])", order: 3 },
              { id: "l4", text: "print(a, b)", order: 4 },
            ],
            explanation: "Funcția returnează un tuplu (min, max) pe care îl despachetăm în a și b." },
          { id: eid(5,3,5), type: "quiz", xp: 5, question: "Ce afișează?\ndef f(x=5): return x*2\nprint(f())",
            options: [{ id: "a", text: "10" }, { id: "b", text: "5" }, { id: "c", text: "Eroare" }, { id: "d", text: "None" }], correctOptionId: "a",
            explanation: "f() folosește valoarea implicită x=5, deci returnează 5*2 = 10." },
        ],
      },
      {
        id: "c5-l4", title: "Funcții matematice", description: "abs(), round(), sqrt(), int()", xpReward: 20,
        exercises: [
          { id: eid(5,4,1), type: "quiz", xp: 5, question: "Ce returnează abs(-7)?",
            options: [{ id: "a", text: "-7" }, { id: "b", text: "7" }, { id: "c", text: "0" }, { id: "d", text: "Eroare" }], correctOptionId: "b",
            explanation: "abs() returnează valoarea absolută – distanța față de 0. abs(-7) = 7." },
          { id: eid(5,4,2), type: "fill", xp: 5, question: "Completează pentru a rotunji la 2 zecimale:",
            codeTemplate: "x = 3.14159\nrezultat = ___(x, 2)", blanks: [{ id: "b1", answer: "round" }],
            explanation: "round(x, 2) rotunjește x la 2 zecimale: 3.14159 → 3.14." },
          { id: eid(5,4,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Funcția sqrt() este disponibilă direct fără import.", isTrue: false, explanation: "sqrt() necesită: from math import sqrt." },
          { id: eid(5,4,4), type: "quiz", xp: 5, question: "Ce returnează int(3.9)?",
            options: [{ id: "a", text: "4" }, { id: "b", text: "3" }, { id: "c", text: "3.0" }, { id: "d", text: "Eroare" }], correctOptionId: "b",
            explanation: "int() trunchiază (taie zecimalele), nu rotunjește. int(3.9) = 3." },
          { id: eid(5,4,5), type: "quiz", xp: 5, question: "Ce returnează round(2.5)?",
            options: [{ id: "a", text: "2" }, { id: "b", text: "3" }, { id: "c", text: "2.5" }, { id: "d", text: "Depinde" }], correctOptionId: "a",
            explanation: "Python folosește 'banker's rounding' – rotunjește la numărul par cel mai apropiat. round(2.5) = 2." },
        ],
      },
      {
        id: "c5-l5", title: "Funcții pentru colecții", description: "len(), min(), max(), sum()", xpReward: 20,
        exercises: [
          { id: eid(5,5,1), type: "quiz", xp: 5, question: "Ce returnează sum([1,2,3,4])?",
            options: [{ id: "a", text: "4" }, { id: "b", text: "10" }, { id: "c", text: "[1,2,3,4]" }, { id: "d", text: "1234" }], correctOptionId: "b",
            explanation: "sum() adună toate elementele: 1+2+3+4 = 10." },
          { id: eid(5,5,2), type: "fill", xp: 5, question: "Completează pentru a afla lungimea listei:",
            codeTemplate: "lista = [1, 2, 3]\nn = ___(lista)", blanks: [{ id: "b1", answer: "len" }],
            explanation: "len() returnează numărul de elemente dintr-o colecție." },
          { id: eid(5,5,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "max('abc') returnează 'c'.", isTrue: true, explanation: "'c' are codul ASCII cel mai mare dintre a, b, c." },
          { id: eid(5,5,4), type: "quiz", xp: 5, question: "Ce returnează min([5, 2, 8, 1, 9])?",
            options: [{ id: "a", text: "5" }, { id: "b", text: "1" }, { id: "c", text: "9" }, { id: "d", text: "2" }], correctOptionId: "b",
            explanation: "min() returnează cel mai mic element din colecție: 1." },
          { id: eid(5,5,5), type: "order", xp: 5, question: "Aranjează codul pentru a calcula media:",
            lines: [
              { id: "l1", text: "lista = [10, 20, 30]", order: 1 },
              { id: "l2", text: "total = sum(lista)", order: 2 },
              { id: "l3", text: "n = len(lista)", order: 3 },
              { id: "l4", text: "media = total / n", order: 4 },
            ],
            explanation: "Media = suma elementelor / numărul de elemente. Folosim sum() și len()." },
        ],
      },
      {
        id: "c5-l6", title: "Proiectare modulară", description: "Descompunerea problemelor în module", xpReward: 25,
        exercises: [
          { id: eid(5,6,1), type: "quiz", xp: 5, question: "Ce avantaj principal are proiectarea modulară?",
            options: [{ id: "a", text: "Codul rulează mai rapid" }, { id: "b", text: "Codul e mai ușor de înțeles și reutilizat" }, { id: "c", text: "Folosește mai puțină memorie" }, { id: "d", text: "Nu are avantaje" }], correctOptionId: "b",
            explanation: "Modularitatea permite reutilizarea codului și ușurează înțelegerea și mentenanța." },
          { id: eid(5,6,2), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Proiectarea modulară presupune împărțirea programului în funcții specializate.", isTrue: true, explanation: "Fiecare modul/funcție rezolvă o subproblemă specifică." },
          { id: eid(5,6,3), type: "quiz", xp: 5, question: "Care NU este un principiu al proiectării modulare?",
            options: [{ id: "a", text: "Reutilizare" }, { id: "b", text: "Responsabilitate unică" }, { id: "c", text: "Duplicare cod" }, { id: "d", text: "Coeziune" }], correctOptionId: "c",
            explanation: "Duplicarea codului este exact ce proiectarea modulară vrea să elimine prin reutilizare." },
          { id: eid(5,6,4), type: "order", xp: 5, question: "Aranjează pașii descompunerii modulare:",
            lines: [
              { id: "l1", text: "Identifică subproblemele", order: 1 },
              { id: "l2", text: "Creează funcții pentru fiecare", order: 2 },
              { id: "l3", text: "Definește interfețele (parametri/return)", order: 3 },
              { id: "l4", text: "Integrează modulele", order: 4 },
            ],
            explanation: "Descompunerea modulară: identificare → creare funcții → definire interfețe → integrare." },
          { id: eid(5,6,5), type: "fill", xp: 5, question: "Completează apelul funcției modulare:",
            codeTemplate: "def citeste_date():\n    return input().split()\n\ndef proceseaza(date):\n    return [int(x) for x in date]\n\ndate = citeste_date()\nnumere = ___(date)", blanks: [{ id: "b1", answer: "proceseaza" }],
            explanation: "Apelăm funcția proceseaza() cu datele citite, conform principiului modular." },
        ],
      },
      // --- PRACTICE LESSONS ---
      {
        id: "c5-l7", title: "Practică: Funcții recursive", description: "Recursivitate, cazuri de bază, stiva de apeluri", xpReward: 30, isPremium: true,
        exercises: [
          { id: eid(5,7,1), type: "quiz", xp: 5, question: "Ce afișează?\ndef f(n):\n    if n==0: return 1\n    return n*f(n-1)\nprint(f(4))",
            options: [{ id: "a", text: "4" }, { id: "b", text: "10" }, { id: "c", text: "24" }, { id: "d", text: "120" }], correctOptionId: "c",
            explanation: "f(4) = 4×f(3) = 4×3×f(2) = 4×3×2×f(1) = 4×3×2×1×f(0) = 4×3×2×1×1 = 24." },
          { id: eid(5,7,2), type: "fill", xp: 5, question: "Completează funcția recursivă pentru suma 1+2+...+n:",
            codeTemplate: "def suma(n):\n    if n == 0: return 0\n    return n + ___(n-1)", blanks: [{ id: "b1", answer: "suma" }],
            explanation: "Funcția se autoapelează cu n-1 până ajunge la cazul de bază n==0." },
          { id: eid(5,7,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "O funcție recursivă fără caz de bază va genera RecursionError.", isTrue: true,
            explanation: "Fără condiția de oprire, funcția se apelează la infinit până depășește limita stivei." },
          { id: eid(5,7,4), type: "order", xp: 5, question: "Aranjează Fibonacci recursiv:",
            lines: [
              { id: "l1", text: "def fib(n):", order: 1 },
              { id: "l2", text: "    if n <= 1: return n", order: 2 },
              { id: "l3", text: "    return fib(n-1) + fib(n-2)", order: 3 },
              { id: "l4", text: "print(fib(6))", order: 4 },
            ],
            explanation: "Cazul de bază: fib(0)=0, fib(1)=1. Recurența: fib(n) = fib(n-1)+fib(n-2). fib(6)=8." },
          { id: eid(5,7,5), type: "quiz", xp: 5, question: "Ce complexitate are Fibonacci recursiv naiv?",
            options: [{ id: "a", text: "O(n)" }, { id: "b", text: "O(n²)" }, { id: "c", text: "O(2^n)" }, { id: "d", text: "O(n log n)" }], correctOptionId: "c",
            explanation: "Fibonacci recursiv naiv recalculează aceleași valori, ducând la complexitate exponențială O(2^n)." },
        ],
      },
      {
        id: "c5-l8", title: "Practică: Funcții avansate", description: "Lambda, map, filter, funcții de ordin superior", xpReward: 35, isPremium: true,
        exercises: [
          { id: eid(5,8,1), type: "quiz", xp: 5, question: "Ce returnează list(map(str, [1,2,3]))?",
            options: [{ id: "a", text: "['1','2','3']" }, { id: "b", text: "[1,2,3]" }, { id: "c", text: "'123'" }, { id: "d", text: "Eroare" }], correctOptionId: "a",
            explanation: "map(str, lista) aplică str() fiecărui element: 1→'1', 2→'2', 3→'3'." },
          { id: eid(5,8,2), type: "fill", xp: 5, question: "Completează funcția lambda pentru dublare:",
            codeTemplate: "dublu = ___ x: x * 2\nprint(dublu(5))", blanks: [{ id: "b1", answer: "lambda" }],
            explanation: "lambda creează o funcție anonimă. lambda x: x*2 este echivalent cu def f(x): return x*2." },
          { id: eid(5,8,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "filter(None, [0, 1, '', 'a', False]) returnează [1, 'a'].", isTrue: true,
            explanation: "filter(None, ...) păstrează doar valorile 'truthy'. 0, '', False sunt 'falsy'." },
          { id: eid(5,8,4), type: "order", xp: 5, question: "Aranjează codul cu map și filter:",
            lines: [
              { id: "l1", text: "numere = [1, 2, 3, 4, 5, 6]", order: 1 },
              { id: "l2", text: "pare = filter(lambda x: x%2==0, numere)", order: 2 },
              { id: "l3", text: "patrate = map(lambda x: x**2, pare)", order: 3 },
              { id: "l4", text: "print(list(patrate))", order: 4 },
            ],
            explanation: "Filtrăm pare: [2,4,6], ridicăm la pătrat: [4,16,36]." },
          { id: eid(5,8,5), type: "quiz", xp: 5, question: "Ce face reduce(lambda a,b: a+b, [1,2,3,4])?",
            options: [{ id: "a", text: "10" }, { id: "b", text: "[1,2,3,4]" }, { id: "c", text: "4" }, { id: "d", text: "24" }], correctOptionId: "a",
            explanation: "reduce aplică funcția cumulativ: ((1+2)+3)+4 = 10. Necesită: from functools import reduce." },
        ],
      },
      {
        id: "c5-l9", title: "Practică: Design modular", description: "Proiecte cu funcții multiple colaborative", xpReward: 35, isPremium: true,
        exercises: [
          { id: eid(5,9,1), type: "quiz", xp: 5, question: "Ce principiu spune că o funcție ar trebui să facă un singur lucru?",
            options: [{ id: "a", text: "DRY" }, { id: "b", text: "Single Responsibility" }, { id: "c", text: "KISS" }, { id: "d", text: "YAGNI" }], correctOptionId: "b",
            explanation: "Single Responsibility Principle: fiecare funcție are o singură responsabilitate." },
          { id: eid(5,9,2), type: "fill", xp: 5, question: "Completează docstring-ul funcției:",
            codeTemplate: "def aria_cerc(raza):\n    ___\"\"\"Calculează aria cercului.\"\"\"___\n    return 3.14 * raza ** 2", blanks: [{ id: "b1", answer: "\n    " }],
            explanation: "Docstring-urile documentează funcția. Se accesează cu help(aria_cerc) sau aria_cerc.__doc__." },
          { id: eid(5,9,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "DRY (Don't Repeat Yourself) înseamnă evitarea codului duplicat prin funcții.", isTrue: true,
            explanation: "DRY: nu repeta codul. Extrage logica comună în funcții reutilizabile." },
          { id: eid(5,9,4), type: "order", xp: 5, question: "Aranjează un program modular pentru calculul mediei:",
            lines: [
              { id: "l1", text: "def citeste_note(): return [int(x) for x in input().split()]", order: 1 },
              { id: "l2", text: "def calculeaza_media(note): return sum(note)/len(note)", order: 2 },
              { id: "l3", text: "def afiseaza(media): print(f'Media: {media:.2f}')", order: 3 },
              { id: "l4", text: "note = citeste_note()", order: 4 },
              { id: "l5", text: "afiseaza(calculeaza_media(note))", order: 5 },
            ],
            explanation: "3 funcții separate: citire, calcul, afișare. Programul principal le orchestrează." },
          { id: eid(5,9,5), type: "quiz", xp: 5, question: "De ce e bine ca funcțiile să aibă parametri în loc de variabile globale?",
            options: [{ id: "a", text: "E mai rapid" }, { id: "b", text: "Testabilitate și reutilizabilitate" }, { id: "c", text: "Folosește mai puțină memorie" }, { id: "d", text: "Nu contează" }], correctOptionId: "b",
            explanation: "Funcțiile cu parametri sunt independente, ușor de testat și reutilizat în alte contexte." },
        ],
      },
      {
        id: "c5-l10", title: "Test: Subprograme", description: "Probleme complexe cu funcții", xpReward: 40, isPremium: true,
        exercises: [
          { id: eid(5,10,1), type: "quiz", xp: 5, question: "Ce afișează?\ndef f(lst=[]):\n    lst.append(1)\n    return lst\nprint(f())\nprint(f())",
            options: [{ id: "a", text: "[1]\\n[1]" }, { id: "b", text: "[1]\\n[1,1]" }, { id: "c", text: "Eroare" }, { id: "d", text: "[1,1]\\n[1,1]" }], correctOptionId: "b",
            explanation: "Lista mutabilă ca parametru implicit este partajată între apeluri! Al 2-lea apel: [1,1]." },
          { id: eid(5,10,2), type: "fill", xp: 5, question: "Completează decoratorul simplu:",
            codeTemplate: "def decorator(func):\n    def wrapper():\n        print('Înainte')\n        ___()\n        print('După')\n    return wrapper", blanks: [{ id: "b1", answer: "func" }],
            explanation: "wrapper() apelează funcția originală (func) între cele două print-uri." },
          { id: eid(5,10,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Funcțiile în Python sunt obiecte de primă clasă (pot fi transmise ca argumente).", isTrue: true,
            explanation: "Python permite: f = len; f([1,2,3]) → 3. Funcțiile sunt obiecte." },
          { id: eid(5,10,4), type: "order", xp: 5, question: "Aranjează codul cu *args:",
            lines: [
              { id: "l1", text: "def suma(*args):", order: 1 },
              { id: "l2", text: "    total = 0", order: 2 },
              { id: "l3", text: "    for n in args:", order: 3 },
              { id: "l4", text: "        total += n", order: 4 },
              { id: "l5", text: "    return total", order: 5 },
            ],
            explanation: "*args colectează orice număr de argumente poziționale într-un tuplu." },
          { id: eid(5,10,5), type: "quiz", xp: 5, question: "Ce returnează (lambda x,y: x+y)(3,4)?",
            options: [{ id: "a", text: "7" }, { id: "b", text: "(3,4)" }, { id: "c", text: "Eroare" }, { id: "d", text: "None" }], correctOptionId: "a",
            explanation: "Lambda cu 2 parametri, apelată imediat cu 3 și 4: 3+4 = 7." },
        ],
      },
    ],
  },
  {
    id: "ch6",
    number: 6,
    title: "Fișiere și Interfețe",
    description: "Fișiere text, Tkinter, MessageBox, introducere OOP",
    icon: "📁",
    color: "15 90% 55%",
    lessons: [
      {
        id: "c6-l1", title: "Fișiere text", description: "open(), read(), write(), close()", xpReward: 25,
        exercises: [
          { id: eid(6,1,1), type: "quiz", xp: 5, question: "Ce mod de deschidere folosim pentru citire?",
            options: [{ id: "a", text: "'w'" }, { id: "b", text: "'r'" }, { id: "c", text: "'a'" }, { id: "d", text: "'x'" }], correctOptionId: "b",
            explanation: "'r' = read. Este și modul implicit dacă nu specificăm altceva." },
          { id: eid(6,1,2), type: "fill", xp: 5, question: "Completează pentru a deschide fișierul:",
            codeTemplate: "f = ___('date.txt', 'r')\ncontinut = f.read()\nf.close()", blanks: [{ id: "b1", answer: "open" }],
            explanation: "Funcția open() deschide un fișier și returnează un obiect fișier." },
          { id: eid(6,1,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Modul 'w' suprascrie conținutul fișierului existent.", isTrue: true, explanation: "'w' deschide pentru scriere și șterge conținutul anterior." },
          { id: eid(6,1,4), type: "order", xp: 5, question: "Aranjează pașii lucrului cu fișiere:",
            lines: [
              { id: "l1", text: "f = open('date.txt', 'r')", order: 1 },
              { id: "l2", text: "continut = f.read()", order: 2 },
              { id: "l3", text: "print(continut)", order: 3 },
              { id: "l4", text: "f.close()", order: 4 },
            ],
            explanation: "Ordinea: deschidere → citire → procesare → închidere. close() este obligatoriu!" },
          { id: eid(6,1,5), type: "quiz", xp: 5, question: "Ce mod adaugă text la sfârșitul fișierului?",
            options: [{ id: "a", text: "'r'" }, { id: "b", text: "'w'" }, { id: "c", text: "'a'" }, { id: "d", text: "'rw'" }], correctOptionId: "c",
            explanation: "'a' = append. Adaugă text la sfârșit fără a șterge conținutul existent." },
        ],
      },
      {
        id: "c6-l2", title: "Citire și scriere fișiere", description: "Moduri de deschidere, with statement", xpReward: 25,
        exercises: [
          { id: eid(6,2,1), type: "quiz", xp: 5, question: "Ce avantaj are 'with open(...) as f'?",
            options: [{ id: "a", text: "E mai rapid" }, { id: "b", text: "Închide automat fișierul" }, { id: "c", text: "Citește mai mult" }, { id: "d", text: "Nu are avantaje" }], correctOptionId: "b",
            explanation: "Blocul 'with' asigură închiderea automată a fișierului, chiar dacă apar erori." },
          { id: eid(6,2,2), type: "fill", xp: 5, question: "Completează construcția with:",
            codeTemplate: "___ open('date.txt') as f:\n    print(f.read())", blanks: [{ id: "b1", answer: "with" }],
            explanation: "with este un context manager care gestionează automat resursele." },
          { id: eid(6,2,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "readlines() returnează o listă cu liniile din fișier.", isTrue: true, explanation: "Fiecare element al listei este o linie din fișier." },
          { id: eid(6,2,4), type: "order", xp: 5, question: "Aranjează codul pentru a scrie în fișier:",
            lines: [
              { id: "l1", text: "with open('output.txt', 'w') as f:", order: 1 },
              { id: "l2", text: "    f.write('Linia 1\\n')", order: 2 },
              { id: "l3", text: "    f.write('Linia 2\\n')", order: 3 },
            ],
            explanation: "Deschidem fișierul cu 'w', scriem liniile cu write(), iar with-ul închide automat." },
          { id: eid(6,2,5), type: "quiz", xp: 5, question: "Ce metodă citește o singură linie?",
            options: [{ id: "a", text: "read()" }, { id: "b", text: "readline()" }, { id: "c", text: "readlines()" }, { id: "d", text: "readone()" }], correctOptionId: "b",
            explanation: "readline() citește o singură linie, read() citește tot, readlines() returnează lista tuturor liniilor." },
        ],
      },
      {
        id: "c6-l3", title: "Introducere în Tkinter", description: "Ferestre, butoane, etichete", xpReward: 25,
        exercises: [
          { id: eid(6,3,1), type: "quiz", xp: 5, question: "Ce este Tkinter?",
            options: [{ id: "a", text: "Un IDE" }, { id: "b", text: "O bibliotecă pentru interfețe grafice" }, { id: "c", text: "Un framework web" }, { id: "d", text: "Un joc" }], correctOptionId: "b",
            explanation: "Tkinter este biblioteca standard Python pentru crearea interfețelor grafice (GUI)." },
          { id: eid(6,3,2), type: "fill", xp: 5, question: "Completează importul Tkinter:",
            codeTemplate: "import ___ as tk\nroot = tk.Tk()", blanks: [{ id: "b1", answer: "tkinter" }],
            explanation: "Modulul se numește 'tkinter' (cu literă mică) în Python 3." },
          { id: eid(6,3,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "mainloop() menține fereastra deschisă și ascultă evenimentele.", isTrue: true, explanation: "mainloop() pornește bucla de evenimente a ferestrei." },
          { id: eid(6,3,4), type: "order", xp: 5, question: "Aranjează codul pentru o fereastră cu buton:",
            lines: [
              { id: "l1", text: "import tkinter as tk", order: 1 },
              { id: "l2", text: "root = tk.Tk()", order: 2 },
              { id: "l3", text: "btn = tk.Button(root, text='Click')", order: 3 },
              { id: "l4", text: "btn.pack()", order: 4 },
              { id: "l5", text: "root.mainloop()", order: 5 },
            ],
            explanation: "Import → creare fereastră → creare widget → plasare cu pack() → pornire buclă." },
          { id: eid(6,3,5), type: "quiz", xp: 5, question: "Ce widget afișează text static în Tkinter?",
            options: [{ id: "a", text: "Button" }, { id: "b", text: "Label" }, { id: "c", text: "Entry" }, { id: "d", text: "Text" }], correctOptionId: "b",
            explanation: "Label afișează text sau imagini statice. Entry este pentru input text." },
        ],
      },
      {
        id: "c6-l4", title: "Casete text și MessageBox", description: "Entry, Text, messagebox", xpReward: 25,
        exercises: [
          { id: eid(6,4,1), type: "quiz", xp: 5, question: "Ce widget folosim pentru input pe o singură linie?",
            options: [{ id: "a", text: "Text" }, { id: "b", text: "Entry" }, { id: "c", text: "Label" }, { id: "d", text: "Input" }], correctOptionId: "b",
            explanation: "Entry este widgetul pentru introducerea textului pe o singură linie." },
          { id: eid(6,4,2), type: "fill", xp: 5, question: "Completează pentru a obține textul din Entry:",
            codeTemplate: "entry = tk.Entry(root)\nentry.pack()\ntext = entry.___()", blanks: [{ id: "b1", answer: "get" }],
            explanation: "Metoda get() returnează textul introdus de utilizator în Entry." },
          { id: eid(6,4,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "messagebox.showinfo() afișează o fereastră pop-up cu un mesaj.", isTrue: true, explanation: "showinfo() afișează un dialog informativ." },
          { id: eid(6,4,4), type: "quiz", xp: 5, question: "Ce diferență e între Entry și Text?",
            options: [{ id: "a", text: "Entry = o linie, Text = mai multe linii" }, { id: "b", text: "Sunt identice" }, { id: "c", text: "Text = o linie, Entry = mai multe" }, { id: "d", text: "Entry nu acceptă text" }], correctOptionId: "a",
            explanation: "Entry este pentru o singură linie de text, Text permite mai multe linii." },
          { id: eid(6,4,5), type: "order", xp: 5, question: "Aranjează codul pentru input cu Entry:",
            lines: [
              { id: "l1", text: "entry = tk.Entry(root)", order: 1 },
              { id: "l2", text: "entry.pack()", order: 2 },
              { id: "l3", text: "def afiseaza():", order: 3 },
              { id: "l4", text: "    print(entry.get())", order: 4 },
              { id: "l5", text: "btn = tk.Button(root, command=afiseaza)", order: 5 },
            ],
            explanation: "Creăm Entry, îl plasăm, definim funcția care citește cu get(), apoi legăm butonul." },
        ],
      },
      {
        id: "c6-l5", title: "Introducere OOP", description: "Clasă, obiect, instanțiere, metode", xpReward: 30,
        exercises: [
          { id: eid(6,5,1), type: "quiz", xp: 5, question: "Cu ce cuvânt cheie definim o clasă în Python?",
            options: [{ id: "a", text: "def" }, { id: "b", text: "class" }, { id: "c", text: "object" }, { id: "d", text: "new" }], correctOptionId: "b",
            explanation: "Clasele se definesc cu 'class NumeClasă:' în Python." },
          { id: eid(6,5,2), type: "fill", xp: 5, question: "Completează constructorul clasei:",
            codeTemplate: "class Elev:\n    def ___(self, nume):\n        self.nume = nume", blanks: [{ id: "b1", answer: "__init__" }],
            explanation: "__init__ este metoda constructor – se apelează automat la crearea unui obiect." },
          { id: eid(6,5,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "Parametrul 'self' se referă la instanța curentă a clasei.", isTrue: true, explanation: "self este referința la obiectul curent, similar cu 'this' din alte limbaje." },
          { id: eid(6,5,4), type: "order", xp: 5, question: "Aranjează codul pentru a defini și folosi o clasă:",
            lines: [
              { id: "l1", text: "class Cerc:", order: 1 },
              { id: "l2", text: "    def __init__(self, raza):", order: 2 },
              { id: "l3", text: "        self.raza = raza", order: 3 },
              { id: "l4", text: "    def aria(self):", order: 4 },
              { id: "l5", text: "        return 3.14 * self.raza ** 2", order: 5 },
              { id: "l6", text: "c = Cerc(5)", order: 6 },
            ],
            explanation: "Definim clasa cu constructor și metodă, apoi creăm o instanță cu Cerc(5)." },
          { id: eid(6,5,5), type: "quiz", xp: 5, question: "Ce este o instanță?",
            options: [{ id: "a", text: "O copie a codului" }, { id: "b", text: "Un obiect creat din clasă" }, { id: "c", text: "O funcție specială" }, { id: "d", text: "Un tip de date" }], correctOptionId: "b",
            explanation: "O instanță este un obiect concret creat pe baza unui șablon (clasă). Ex: c = Cerc(5)." },
        ],
      },
      // --- PRACTICE LESSONS ---
      {
        id: "c6-l6", title: "Practică: Procesare fișiere", description: "Citire avansată, CSV, procesare text", xpReward: 30, isPremium: true,
        exercises: [
          { id: eid(6,6,1), type: "quiz", xp: 5, question: "Ce face f.readlines()?",
            options: [{ id: "a", text: "Citește prima linie" }, { id: "b", text: "Returnează o listă cu toate liniile" }, { id: "c", text: "Numără liniile" }, { id: "d", text: "Citește un caracter" }], correctOptionId: "b",
            explanation: "readlines() returnează o listă unde fiecare element este o linie din fișier (cu \\n)." },
          { id: eid(6,6,2), type: "fill", xp: 5, question: "Completează pentru a citi un fișier linie cu linie:",
            codeTemplate: "with open('date.txt') as f:\n    for linie in ___:\n        print(linie.strip())", blanks: [{ id: "b1", answer: "f" }],
            explanation: "Obiectul fișier f este iterabil – putem parcurge direct liniile cu for linie in f." },
          { id: eid(6,6,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "strip() elimină spațiile și newline de la capetele string-ului.", isTrue: true,
            explanation: "strip() elimină whitespace (spații, \\n, \\t) de la început și sfârșit." },
          { id: eid(6,6,4), type: "order", xp: 5, question: "Aranjează codul pentru a număra cuvintele dintr-un fișier:",
            lines: [
              { id: "l1", text: "with open('text.txt') as f:", order: 1 },
              { id: "l2", text: "    continut = f.read()", order: 2 },
              { id: "l3", text: "    cuvinte = continut.split()", order: 3 },
              { id: "l4", text: "    print(len(cuvinte))", order: 4 },
            ],
            explanation: "Citim tot conținutul, îl despărțim în cuvinte cu split(), numărăm cu len()." },
          { id: eid(6,6,5), type: "quiz", xp: 5, question: "Ce face 'linia'.split(',')?",
            options: [{ id: "a", text: "Împarte după virgulă" }, { id: "b", text: "Adaugă virgulă" }, { id: "c", text: "Elimină virgulele" }, { id: "d", text: "Numără virgulele" }], correctOptionId: "a",
            explanation: "split(',') desparte stringul în listă folosind virgula ca separator. Util pentru CSV." },
        ],
      },
      {
        id: "c6-l7", title: "Practică: GUI cu Tkinter", description: "Layout, grid, bind, variabile Tk", xpReward: 35, isPremium: true,
        exercises: [
          { id: eid(6,7,1), type: "quiz", xp: 5, question: "Ce manager de layout plasează widget-uri într-o grilă?",
            options: [{ id: "a", text: "pack()" }, { id: "b", text: "grid()" }, { id: "c", text: "place()" }, { id: "d", text: "layout()" }], correctOptionId: "b",
            explanation: "grid() plasează widget-uri pe rânduri și coloane. pack() le stivuiește." },
          { id: eid(6,7,2), type: "fill", xp: 5, question: "Completează plasarea pe rândul 1, coloana 2:",
            codeTemplate: "btn.grid(row=1, ___=2)", blanks: [{ id: "b1", answer: "column" }],
            explanation: "grid(row=rând, column=coloană) plasează widget-ul în grila specificată." },
          { id: eid(6,7,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "StringVar() în Tkinter permite legarea automată a variabilelor la widget-uri.", isTrue: true,
            explanation: "StringVar, IntVar, etc. sunt variabile reactive – actualizează automat widget-urile." },
          { id: eid(6,7,4), type: "order", xp: 5, question: "Aranjează un calculator simplu cu Tkinter:",
            lines: [
              { id: "l1", text: "root = tk.Tk()", order: 1 },
              { id: "l2", text: "entry = tk.Entry(root)", order: 2 },
              { id: "l3", text: "entry.grid(row=0, column=0)", order: 3 },
              { id: "l4", text: "def calcul(): result.set(eval(entry.get()))", order: 4 },
              { id: "l5", text: "tk.Button(root, text='=', command=calcul).grid(row=0, column=1)", order: 5 },
            ],
            explanation: "Entry pentru input, buton cu command pentru calcul, afișare rezultat." },
          { id: eid(6,7,5), type: "quiz", xp: 5, question: "Ce face widget.bind('<Button-1>', func)?",
            options: [{ id: "a", text: "Leagă click stânga la funcție" }, { id: "b", text: "Creează un buton" }, { id: "c", text: "Dezactivează widget-ul" }, { id: "d", text: "Schimbă textul" }], correctOptionId: "a",
            explanation: "bind() asociază un eveniment (click stânga) cu o funcție handler." },
        ],
      },
      {
        id: "c6-l8", title: "Practică: OOP avansat", description: "Moștenire, metode speciale, încapsulare", xpReward: 35, isPremium: true,
        exercises: [
          { id: eid(6,8,1), type: "quiz", xp: 5, question: "Ce este moștenirea în OOP?",
            options: [{ id: "a", text: "Copierea codului" }, { id: "b", text: "O clasă preia atributele și metodele altei clase" }, { id: "c", text: "Ștergerea unei clase" }, { id: "d", text: "Importul unui modul" }], correctOptionId: "b",
            explanation: "Moștenirea permite unei clase copil să preia proprietățile clasei părinte." },
          { id: eid(6,8,2), type: "fill", xp: 5, question: "Completează moștenirea clasei:",
            codeTemplate: "class Animal:\n    def sunet(self): pass\n\nclass Caine(___):\n    def sunet(self): return 'Ham!'", blanks: [{ id: "b1", answer: "Animal" }],
            explanation: "class Caine(Animal) moștenește din Animal. Caine supradefinește metoda sunet()." },
          { id: eid(6,8,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "__str__ este metoda specială apelată de print() și str().", isTrue: true,
            explanation: "__str__ returnează reprezentarea textuală a obiectului." },
          { id: eid(6,8,4), type: "order", xp: 5, question: "Aranjează o clasă cu moștenire și super():",
            lines: [
              { id: "l1", text: "class Vehicul:", order: 1 },
              { id: "l2", text: "    def __init__(self, marca): self.marca = marca", order: 2 },
              { id: "l3", text: "class Masina(Vehicul):", order: 3 },
              { id: "l4", text: "    def __init__(self, marca, nr_usi):", order: 4 },
              { id: "l5", text: "        super().__init__(marca)", order: 5 },
              { id: "l6", text: "        self.nr_usi = nr_usi", order: 6 },
            ],
            explanation: "super().__init__() apelează constructorul părintelui. Masina extinde Vehicul cu nr_usi." },
          { id: eid(6,8,5), type: "quiz", xp: 5, question: "Ce face super() în Python?",
            options: [{ id: "a", text: "Creează un super-obiect" }, { id: "b", text: "Accesează metode din clasa părinte" }, { id: "c", text: "Șterge clasa" }, { id: "d", text: "Importă module" }], correctOptionId: "b",
            explanation: "super() returnează un proxy către clasa părinte, permițând apelul metodelor moștenite." },
        ],
      },
      {
        id: "c6-l9", title: "Test: Fișiere și OOP", description: "Probleme finale complexe", xpReward: 40, isPremium: true,
        exercises: [
          { id: eid(6,9,1), type: "quiz", xp: 5, question: "Ce afișează?\nclass A:\n    x = 1\nclass B(A):\n    x = 2\nprint(B.x, A.x)",
            options: [{ id: "a", text: "2 1" }, { id: "b", text: "1 1" }, { id: "c", text: "2 2" }, { id: "d", text: "Eroare" }], correctOptionId: "a",
            explanation: "B.x = 2 (propriu), A.x = 1. Fiecare clasă are propriul atribut x." },
          { id: eid(6,9,2), type: "fill", xp: 5, question: "Completează metoda __len__ pentru a funcționa cu len():",
            codeTemplate: "class Grup:\n    def __init__(self): self.membri = []\n    def _____(self): return len(self.membri)", blanks: [{ id: "b1", answer: "__len__" }],
            explanation: "__len__ permite utilizarea len(obiect). Este o metodă specială (dunder method)." },
          { id: eid(6,9,3), type: "truefalse", xp: 5, question: "Adevărat sau Fals?", statement: "with open('f.txt') as f: garantează închiderea fișierului chiar dacă apare o eroare.", isTrue: true,
            explanation: "Context manager-ul with asigură apelarea __exit__ (close) indiferent de excepții." },
          { id: eid(6,9,4), type: "order", xp: 5, question: "Aranjează codul pentru o clasă care scrie în fișier:",
            lines: [
              { id: "l1", text: "class Logger:", order: 1 },
              { id: "l2", text: "    def __init__(self, fisier): self.fisier = fisier", order: 2 },
              { id: "l3", text: "    def scrie(self, mesaj):", order: 3 },
              { id: "l4", text: "        with open(self.fisier, 'a') as f:", order: 4 },
              { id: "l5", text: "            f.write(mesaj + '\\n')", order: 5 },
            ],
            explanation: "Clasa Logger combină OOP cu lucrul cu fișiere. Metoda scrie() adaugă mesaje cu append." },
          { id: eid(6,9,5), type: "quiz", xp: 5, question: "Ce este polimorfismul?",
            options: [{ id: "a", text: "Ascunderea datelor" }, { id: "b", text: "Aceeași metodă, comportament diferit în clase diferite" }, { id: "c", text: "Moștenirea multiplă" }, { id: "d", text: "Crearea de obiecte" }], correctOptionId: "b",
            explanation: "Polimorfism = aceeași interfață, implementări diferite. Ex: sunet() în Caine vs Pisica." },
        ],
      },
    ],
  },
];

// Transform an exercise into a different type for fixare lessons
function transformExercise(ex: Exercise, index: number): Exercise {
  const fid = ex.id + "f";

  // Quiz → TrueFalse: take the correct answer and make a statement
  if (ex.type === "quiz" && ex.options && ex.correctOptionId) {
    const correctOption = ex.options.find(o => o.id === ex.correctOptionId);
    const wrongOption = ex.options.find(o => o.id !== ex.correctOptionId);
    // Alternate between true and false statements
    const useTrue = index % 2 === 0;
    const chosenOption = useTrue ? correctOption : wrongOption;
    return {
      id: fid, type: "truefalse", xp: ex.xp,
      question: "Adevărat sau Fals?",
      statement: `Răspunsul la „${ex.question}" este: ${chosenOption?.text || "necunoscut"}.`,
      isTrue: useTrue,
      explanation: ex.explanation,
    };
  }

  // TrueFalse → Quiz: convert statement into a multiple choice
  if (ex.type === "truefalse") {
    return {
      id: fid, type: "quiz", xp: ex.xp,
      question: `Ce este corect despre afirmația: „${ex.statement}"?`,
      options: [
        { id: "a", text: "Afirmația este adevărată" },
        { id: "b", text: "Afirmația este falsă" },
        { id: "c", text: "Depinde de context" },
        { id: "d", text: "Nu se poate determina" },
      ],
      correctOptionId: ex.isTrue ? "a" : "b",
      explanation: ex.explanation,
    };
  }

  // Fill → Order: convert blanks into ordering lines
  if (ex.type === "fill" && ex.codeTemplate && ex.blanks && ex.blanks.length > 0) {
    const templateLines = ex.codeTemplate.split("\n").filter(l => l.trim());
    const filledLines = templateLines.map(line => {
      let result = line;
      (ex.blanks || []).forEach(b => {
        result = result.replace("___", b.answer);
      });
      return result;
    });
    return {
      id: fid, type: "order", xp: ex.xp,
      question: "Aranjează liniile de cod în ordinea corectă:",
      lines: filledLines.map((text, i) => ({
        id: `l${i + 1}`, text, order: i + 1,
      })),
      explanation: ex.explanation,
    };
  }

  // Order → Fill: convert ordered lines into a fill exercise
  if (ex.type === "order" && ex.lines && ex.lines.length > 0) {
    const sorted = [...ex.lines].sort((a, b) => a.order - b.order);
    // Pick one line to blank out a keyword
    const targetIdx = index % sorted.length;
    const targetLine = sorted[targetIdx];
    // Find a word to blank (pick longest word)
    const words = targetLine.text.split(/([a-zA-Z_]+)/).filter(w => /^[a-zA-Z_]+$/.test(w));
    const blankWord = words.length > 0 ? words.reduce((a, b) => a.length >= b.length ? a : b) : targetLine.text;
    const template = sorted.map((l, i) =>
      i === targetIdx ? l.text.replace(blankWord, "___") : l.text
    ).join("\n");
    return {
      id: fid, type: "fill", xp: ex.xp,
      question: "Completează cuvântul lipsă din cod:",
      codeTemplate: template,
      blanks: [{ id: "b1", answer: blankWord }],
      explanation: ex.explanation,
    };
  }

  // Fallback: return a truefalse based on the question
  return {
    id: fid, type: "truefalse", xp: ex.xp,
    question: "Adevărat sau Fals?",
    statement: ex.question,
    isTrue: true,
    explanation: ex.explanation,
  };
}

// Auto-generate "Fixare" lessons after each non-practice, non-test lesson
function addFixareLessons(chs: Chapter[]): Chapter[] {
  return chs.map(ch => {
    const newLessons: Lesson[] = [];
    const nonPracticeLessons = ch.lessons.filter(l =>
      !l.title.startsWith("Practică:") && !l.title.startsWith("Test")
    );
    const practiceLessons = ch.lessons.filter(l =>
      l.title.startsWith("Practică:") || l.title.startsWith("Test")
    );

    nonPracticeLessons.forEach(lesson => {
      newLessons.push(lesson);
      const fixareLesson: Lesson = {
        id: lesson.id + "f",
        title: "Fixare: " + lesson.title,
        description: "Exerciții de fixare – " + lesson.description.charAt(0).toLowerCase() + lesson.description.slice(1),
        xpReward: lesson.xpReward,
        exercises: lesson.exercises.map((ex, i) => transformExercise(ex, i)),
      };
      newLessons.push(fixareLesson);
    });

    newLessons.push(...practiceLessons);
    return { ...ch, lessons: newLessons };
  });
}

export const chapters: Chapter[] = addFixareLessons(rawChapters);

export const getTotalXP = (chapters: Chapter[]) =>
  chapters.reduce((sum, ch) => sum + ch.lessons.reduce((s, l) => s + l.xpReward, 0), 0);

export const getLevelFromXP = (xp: number): number => Math.floor(xp / 100) + 1;
export const getXPForNextLevel = (xp: number): number => 100 - (xp % 100);
