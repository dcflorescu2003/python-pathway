export interface TheorySection {
  title: string;
  content: string;
  code?: string;
}

export interface ChapterTheory {
  chapterId: string;
  sections: TheorySection[];
}

export const chapterTheories: ChapterTheory[] = [
  {
    chapterId: "ch1",
    sections: [
      {
        title: "Variabile și tipuri de date",
        content: "O variabilă este un nume care stochează o valoare în memorie. În Python, nu trebuie să declari tipul — el se deduce automat.\n\nTipuri principale:\n• int — numere întregi (ex: 5, -3)\n• float — numere reale (ex: 3.14)\n• str — șiruri de caractere (ex: 'salut')\n• bool — True sau False",
        code: "x = 10        # int\ny = 3.14      # float\nnume = 'Ana'  # str\nactiv = True  # bool\n\n# Conversii\nvarsta = int('16')    # str → int\npret = float('9.99')  # str → float",
      },
      {
        title: "Structura if / elif / else",
        content: "Instrucțiunea if permite executarea condițională a codului. Se pot adăuga ramuri cu elif (else if) și else.\n\nOperatori de comparare: ==, !=, <, >, <=, >=\nOperatori logici: and, or, not",
        code: "nota = 8\n\nif nota >= 9:\n    print('Foarte bine')\nelif nota >= 7:\n    print('Bine')\nelif nota >= 5:\n    print('Suficient')\nelse:\n    print('Insuficient')",
      },
      {
        title: "Bucla for",
        content: "Bucla for iterează printr-o secvență (range, listă, string). Funcția range(start, stop, step) generează numere — stop este exclus!\n\n• range(5) → 0, 1, 2, 3, 4\n• range(1, 6) → 1, 2, 3, 4, 5\n• range(0, 10, 2) → 0, 2, 4, 6, 8",
        code: "# Suma numerelor de la 1 la 10\nsuma = 0\nfor i in range(1, 11):\n    suma += i\nprint(suma)  # 55\n\n# Parcurgere string\nfor ch in 'Python':\n    print(ch)",
      },
      {
        title: "Bucla while",
        content: "Bucla while repetă un bloc cât timp condiția este adevărată. Atenție la buclele infinite!\n\n• break — oprește bucla\n• continue — sare la următoarea iterație",
        code: "# Cifrele unui număr\nn = 1234\nwhile n > 0:\n    cifra = n % 10\n    print(cifra)\n    n = n // 10\n# Afișează: 4, 3, 2, 1",
      },
      {
        title: "Gândire computațională",
        content: "Cele 4 piloane ale gândirii computaționale:\n\n1. Descompunerea — împărțirea problemei în subprobleme mai mici\n2. Recunoașterea pattern-urilor — identificarea tiparelor comune\n3. Abstractizarea — ignorarea detaliilor neesențiale\n4. Algoritmizarea — crearea unei secvențe de pași pentru rezolvare\n\nEtapele rezolvării: Analiză → Proiectare → Implementare → Testare",
      },
      {
        title: "Introducere în algoritmi",
        content: "Un algoritm este o secvență finită și clară de pași pentru rezolvarea unei probleme.\n\nComplexități frecvente (de la cea mai rapidă):\n• O(1) — constantă\n• O(log n) — logaritmică\n• O(n) — liniară\n• O(n log n) — liniaritmică\n• O(n²) — pătratică\n\nPseudocodul descrie algoritmul în limbaj natural, fără sintaxa unui limbaj specific.",
      },
    ],
  },
  {
    chapterId: "ch2",
    sections: [
      {
        title: "Operații cu cifrele unui număr",
        content: "Pentru a accesa cifrele unui număr se folosesc:\n• n % 10 — ultima cifră\n• n // 10 — numărul fără ultima cifră\n\nPentru a construi un număr:\n• adăugare la dreapta: nr = nr * 10 + cifra\n• adăugare la stânga: nr = cifra * 10^k + nr",
        code: "n = 1234\n\n# Ultima cifră\nprint(n % 10)   # 4\n\n# Fără ultima cifră\nprint(n // 10)  # 123\n\n# Număr de cifre\ncount = 0\ntemp = n\nwhile temp > 0:\n    count += 1\n    temp //= 10",
      },
      {
        title: "Parcurgerea divizorilor",
        content: "Un divizor al lui n este un număr d pentru care n % d == 0.\n\nPentru eficiență, parcurgem doar până la √n — dacă d este divizor, atunci și n/d este divizor.\n\nUn număr prim are exact 2 divizori: 1 și el însuși.",
        code: "n = 36\nfor d in range(1, n + 1):\n    if n % d == 0:\n        print(d, end=' ')\n# 1 2 3 4 6 9 12 18 36\n\n# Verificare prim\ndef este_prim(n):\n    if n < 2: return False\n    for d in range(2, int(n**0.5) + 1):\n        if n % d == 0:\n            return False\n    return True",
      },
      {
        title: "Algoritmul lui Euclid (CMMDC)",
        content: "CMMDC (cel mai mare divizor comun) se calculează cu algoritmul lui Euclid:\n\n• Cu scăderi: se scade mereu cel mai mic din cel mai mare\n• Cu împărțiri (mai eficient): se înlocuiește a cu b, și b cu a % b",
        code: "# Euclid cu împărțiri\ndef cmmdc(a, b):\n    while b != 0:\n        a, b = b, a % b\n    return a\n\nprint(cmmdc(48, 18))  # 6\n\n# CMMMC\ndef cmmmc(a, b):\n    return a * b // cmmdc(a, b)",
      },
      {
        title: "Descompunere în factori primi",
        content: "Orice număr natural ≥ 2 poate fi scris ca produs de factori primi.\n\nAlgoritmul: se împarte repetat la cel mai mic factor prim, începând de la 2.",
        code: "n = 360\nd = 2\nwhile n > 1:\n    p = 0\n    while n % d == 0:\n        p += 1\n        n //= d\n    if p > 0:\n        print(f'{d}^{p}')\n    d += 1\n# 2^3, 3^2, 5^1",
      },
      {
        title: "Conversii între baze",
        content: "Conversia din baza 10 în baza 2: se împarte repetat la 2 și se rețin resturile (de la coadă spre cap).\n\nConversia din baza 2 în baza 10: se înmulțește fiecare cifră cu 2^poziție și se adună.",
        code: "# Baza 10 → Baza 2\ndef to_bin(n):\n    result = ''\n    while n > 0:\n        result = str(n % 2) + result\n        n //= 2\n    return result or '0'\n\n# Python built-in\nprint(bin(13))    # 0b1101\nprint(int('1101', 2))  # 13",
      },
    ],
  },
  {
    chapterId: "ch3",
    sections: [
      {
        title: "Modelul conceptual de listă",
        content: "O listă este o colecție ordonată de elemente, accesibile prin index.\n\n• Acces secvențial — parcurgere element cu element\n• Acces direct — accesare prin index: lista[i]\n\nListele Python sunt dinamice (se pot modifica) și pot conține tipuri mixte.",
        code: "lista = [10, 20, 30, 40, 50]\n\n# Acces direct\nprint(lista[0])   # 10\nprint(lista[-1])  # 50\n\n# Slicing\nprint(lista[1:3])  # [20, 30]",
      },
      {
        title: "Stiva și Coada",
        content: "Stiva (Stack) — LIFO (Last In, First Out):\n• push → adaugă deasupra\n• pop → scoate de deasupra\n\nCoada (Queue) — FIFO (First In, First Out):\n• enqueue → adaugă la coadă\n• dequeue → scoate de la cap",
        code: "# Stivă cu listă\nstiva = []\nstiva.append(1)  # push\nstiva.append(2)\nstiva.pop()      # 2 (LIFO)\n\n# Coadă cu collections.deque\nfrom collections import deque\ncoada = deque()\ncoada.append(1)    # enqueue\ncoada.append(2)\ncoada.popleft()    # 1 (FIFO)",
      },
      {
        title: "Lista de frecvențe",
        content: "O listă de frecvențe numără de câte ori apare fiecare valoare.\n\nSe creează o listă cu indici de la 0 la max_val, inițializată cu 0, și se incrementează freq[val] pentru fiecare val.",
        code: "numere = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]\nmax_val = max(numere)\nfreq = [0] * (max_val + 1)\n\nfor x in numere:\n    freq[x] += 1\n\nfor i in range(len(freq)):\n    if freq[i] > 0:\n        print(f'{i} apare de {freq[i]} ori')",
      },
      {
        title: "Parcurgere liniară",
        content: "Parcurgerea liniară vizitează fiecare element o singură dată.\n\n• Fără memorare: se calculează ceva din mers (ex: sumă, maxim)\n• Cu memorare: se reține informație suplimentară (ex: elementul anterior, o listă de rezultate)",
        code: "# Maxim (fără memorare)\nlista = [3, 7, 2, 9, 1]\nmax_val = lista[0]\nfor x in lista:\n    if x > max_val:\n        max_val = x\n\n# Elemente unice (cu memorare)\nvazute = []\nfor x in lista:\n    if x not in vazute:\n        vazute.append(x)",
      },
      {
        title: "Clasa list — operatori și metode",
        content: "Operatori pentru liste:\n• [] — acces/modificare element\n• in — verificare apartenență\n• + — concatenare\n• * — multiplicare\n\nMetode importante:\n• append(x) — adaugă la final\n• insert(i, x) — inserează la poziția i\n• pop(i) — elimină și returnează elementul de la i\n• remove(x) — elimină prima apariție a lui x\n• sort() — sortează in-place\n• count(x) — numără aparițiile lui x\n• index(x) — returnează indexul primei apariții",
        code: "l = [3, 1, 4, 1, 5]\nl.append(9)       # [3,1,4,1,5,9]\nl.insert(0, 0)    # [0,3,1,4,1,5,9]\nl.remove(1)       # [0,3,4,1,5,9]\nl.sort()          # [0,1,3,4,5,9]\nprint(l.count(3)) # 1\nprint(l.index(4)) # 3",
      },
    ],
  },
  {
    chapterId: "ch4",
    sections: [
      {
        title: "Generarea sistematică a secvențelor",
        content: "Secvențele recurente sunt definite prin termeni anteriori.\n\nExemple clasice:\n• Fibonacci: F(n) = F(n-1) + F(n-2), cu F(0)=0, F(1)=1\n• Factorialul: n! = n × (n-1)!\n• Puteri: a^n = a × a^(n-1)",
        code: "# Fibonacci\ndef fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        print(a, end=' ')\n        a, b = b, a + b\n\nfibonacci(10)\n# 0 1 1 2 3 5 8 13 21 34",
      },
      {
        title: "Sortare prin selecția minimului",
        content: "La fiecare pas, se găsește elementul minim din porțiunea nesortată și se pune pe poziția corectă.\n\nComplexitate: O(n²) — nu depinde de ordinea inițială.",
        code: "def selection_sort(lst):\n    for i in range(len(lst)):\n        min_idx = i\n        for j in range(i+1, len(lst)):\n            if lst[j] < lst[min_idx]:\n                min_idx = j\n        lst[i], lst[min_idx] = lst[min_idx], lst[i]\n    return lst",
      },
      {
        title: "Sortare cu lista de frecvențe",
        content: "Counting Sort funcționează doar pentru valori întregi cu rang limitat. Se numără aparițiile, apoi se reconstruiește lista.\n\nComplexitate: O(n + k) unde k = valoarea maximă.",
        code: "def counting_sort(lst):\n    if not lst: return lst\n    max_val = max(lst)\n    freq = [0] * (max_val + 1)\n    for x in lst:\n        freq[x] += 1\n    result = []\n    for i in range(len(freq)):\n        result.extend([i] * freq[i])\n    return result",
      },
      {
        title: "Metoda bulelor (Bubble Sort)",
        content: "Se compară elemente vecine și se interschimbă dacă sunt în ordine greșită. Se repetă până când nu mai sunt interschimbări.\n\nComplexitate: O(n²) cel mai rău caz, O(n) cel mai bun caz (deja sortată).",
        code: "def bubble_sort(lst):\n    n = len(lst)\n    for i in range(n):\n        swapped = False\n        for j in range(n - 1 - i):\n            if lst[j] > lst[j+1]:\n                lst[j], lst[j+1] = lst[j+1], lst[j]\n                swapped = True\n        if not swapped:\n            break\n    return lst",
      },
      {
        title: "Compararea metodelor de sortare",
        content: "| Metodă | Cel mai bun | Mediu | Cel mai rău | Stabilă? |\n|--------|------------|-------|------------|----------|\n| Selecție | O(n²) | O(n²) | O(n²) | Nu |\n| Bule | O(n) | O(n²) | O(n²) | Da |\n| Frecvențe | O(n+k) | O(n+k) | O(n+k) | Da |\n| sort() Python | O(n) | O(n log n) | O(n log n) | Da |\n\nPython folosește Timsort (hibrid între merge sort și insertion sort).",
      },
    ],
  },
  {
    chapterId: "ch5",
    sections: [
      {
        title: "Conceptul de subprogram",
        content: "Un subprogram (funcție) este un bloc de cod reutilizabil, definit cu def.\n\nComponente:\n• Numele funcției\n• Parametrii (opționali)\n• Corpul funcției (indentat)\n• Returnarea valorii (opțională, cu return)",
        code: "def salut(nume):\n    return f'Salut, {nume}!'\n\n# Apel\nmesaj = salut('Ana')\nprint(mesaj)  # Salut, Ana!\n\n# Fără return (returnează None)\ndef afiseaza(x):\n    print(x)",
      },
      {
        title: "Variabile locale și globale",
        content: "• Variabilele locale — definite în funcție, accesibile doar în funcție\n• Variabilele globale — definite în afara funcțiilor\n• global — permite modificarea unei variabile globale din funcție\n\nRegulă: preferă variabile locale și transmite date prin parametri!",
        code: "x = 10  # globală\n\ndef func():\n    y = 5  # locală\n    print(x, y)\n\ndef modifica():\n    global x\n    x = 20\n\nfunc()      # 10 5\nmodifica()\nprint(x)    # 20",
      },
      {
        title: "Parametri și returnare",
        content: "Tipuri de parametri:\n• Poziționali: func(a, b)\n• Cu valoare implicită: func(a, b=10)\n• *args: număr variabil de argumente\n• **kwargs: argumente cu nume\n\nreturn oprește funcția și trimite valoarea înapoi.",
        code: "def putere(baza, exp=2):\n    return baza ** exp\n\nprint(putere(3))      # 9\nprint(putere(2, 10))  # 1024\n\n# Return multiplu\ndef min_max(lst):\n    return min(lst), max(lst)\n\na, b = min_max([3,1,4,1,5])\nprint(a, b)  # 1 5",
      },
      {
        title: "Funcții predefinite matematice",
        content: "Funcții built-in:\n• abs(x) — valoare absolută\n• round(x, n) — rotunjire la n zecimale\n• int(x), float(x) — conversii\n• pow(x, y) — x la puterea y\n\nModulul math:\n• math.sqrt(x) — rădăcina pătrată\n• math.floor(x), math.ceil(x)\n• math.pi, math.e",
        code: "import math\n\nprint(abs(-7))         # 7\nprint(round(3.14159, 2))  # 3.14\nprint(math.sqrt(16))   # 4.0\nprint(math.floor(3.7))  # 3\nprint(math.ceil(3.2))   # 4",
      },
      {
        title: "Funcții pentru colecții",
        content: "Funcții built-in pentru liste/secvențe:\n• len(x) — lungimea\n• min(x), max(x) — minim/maxim\n• sum(x) — suma elementelor\n• sorted(x) — returnează o listă sortată (nu modifică originalul)\n• enumerate(x) — perechi (index, element)\n• zip(a, b) — combină două liste",
        code: "l = [3, 1, 4, 1, 5, 9]\n\nprint(len(l))     # 6\nprint(min(l))     # 1\nprint(max(l))     # 9\nprint(sum(l))     # 23\nprint(sorted(l))  # [1,1,3,4,5,9]\n\nfor i, v in enumerate(l):\n    print(f'Index {i}: {v}')",
      },
      {
        title: "Proiectare modulară",
        content: "Proiectarea modulară înseamnă descompunerea programului în funcții/module independente.\n\nAvantaje:\n• Reutilizare — aceeași funcție în mai multe locuri\n• Testabilitate — fiecare funcție se testează separat\n• Claritate — codul este mai ușor de citit\n• Mentenanță — modificările afectează doar modulul relevant",
      },
    ],
  },
  {
    chapterId: "ch6",
    sections: [
      {
        title: "Fișiere text",
        content: "Fișierele se deschid cu open() și se închid cu close() sau folosind with.\n\nModuri de deschidere:\n• 'r' — citire (implicit)\n• 'w' — scriere (suprascrie)\n• 'a' — adăugare la final\n• 'r+' — citire și scriere",
        code: "# Scriere\nwith open('date.txt', 'w') as f:\n    f.write('Linia 1\\n')\n    f.write('Linia 2\\n')\n\n# Citire\nwith open('date.txt', 'r') as f:\n    continut = f.read()\n    print(continut)\n\n# Citire linie cu linie\nwith open('date.txt') as f:\n    for linie in f:\n        print(linie.strip())",
      },
      {
        title: "Citire și scriere din fișiere",
        content: "Metode de citire:\n• read() — tot conținutul ca string\n• readline() — o singură linie\n• readlines() — lista tuturor liniilor\n\nsfârșitul fișierului se detectează când read() returnează string gol.",
        code: "# Citirea numerelor dintr-un fișier\nwith open('numere.txt') as f:\n    numere = []\n    for linie in f:\n        numere.append(int(linie.strip()))\n\nprint(sum(numere))\nprint(max(numere))",
      },
      {
        title: "Introducere în Tkinter",
        content: "Tkinter este biblioteca standard Python pentru interfețe grafice.\n\nComponente de bază:\n• Tk() — fereastra principală\n• Label — text static\n• Button — buton clickabil\n• Entry — câmp de text\n• Frame — container de grupare",
        code: "import tkinter as tk\n\nroot = tk.Tk()\nroot.title('Prima aplicație')\n\nlabel = tk.Label(root, text='Salut!')\nlabel.pack()\n\ndef click():\n    label.config(text='Ai apăsat!')\n\nbtn = tk.Button(root, text='Apasă', command=click)\nbtn.pack()\n\nroot.mainloop()",
      },
      {
        title: "Casete text și MessageBox",
        content: "• Entry — câmp de text pe o singură linie\n• Text — câmp de text pe mai multe linii\n• messagebox — ferestre de dialog (info, warning, error, question)\n\nMetode Entry: get(), delete(), insert()",
        code: "import tkinter as tk\nfrom tkinter import messagebox\n\nroot = tk.Tk()\n\nentry = tk.Entry(root)\nentry.pack()\n\ndef verifica():\n    text = entry.get()\n    if text:\n        messagebox.showinfo('Info', f'Ai scris: {text}')\n    else:\n        messagebox.showwarning('Atenție', 'Câmpul este gol!')\n\nbtn = tk.Button(root, text='Verifică', command=verifica)\nbtn.pack()",
      },
      {
        title: "Introducere în OOP",
        content: "Programarea Orientată pe Obiecte (OOP) organizează codul în clase și obiecte.\n\n• Clasă — un șablon/plan\n• Obiect — o instanță a clasei\n• __init__ — constructorul (se apelează la creare)\n• self — referință la obiectul curent\n• Metodă — funcție definită în clasă",
        code: "class Elev:\n    def __init__(self, nume, nota):\n        self.nume = nume\n        self.nota = nota\n    \n    def promovat(self):\n        return self.nota >= 5\n    \n    def __str__(self):\n        return f'{self.nume}: {self.nota}'\n\ne = Elev('Ana', 9)\nprint(e)            # Ana: 9\nprint(e.promovat())  # True",
      },
    ],
  },
];
