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
        content: "Pentru a manipula cifrele unui număr întreg folosim doi operatori esențiali:\n• n % 10 — ultima cifră (restul împărțirii la 10)\n• n // 10 — numărul fără ultima cifră (împărțire întreagă)\n\nConstrucția numerelor din cifre:\n• adăugare la dreapta: nr = nr * 10 + cifra\n• adăugare la stânga: nr = cifra * 10**k + nr (unde k = numărul de cifre actuale)\n\nParcurgerea cifrelor se face într-o buclă while n > 0, extragând cifra cu % 10 și eliminând-o cu //= 10.",
        code: "n = 1234\n\n# Ultima cifră și restul numărului\nprint(n % 10)   # 4\nprint(n // 10)  # 123\n\n# Numărarea cifrelor\ncount = 0\ntemp = n\nwhile temp > 0:\n    count += 1\n    temp //= 10\nprint(count)  # 4\n\n# Adăugare cifră la dreapta\nnr = 12\nnr = nr * 10 + 7  # 127",
      },
      {
        title: "Suma, produsul și oglinditul cifrelor",
        content: "Multe probleme cer prelucrarea fiecărei cifre. Pattern-ul standard:\n• inițializăm acumulatorul (s = 0 pentru sumă, p = 1 pentru produs, ogl = 0 pentru oglindit)\n• într-un while n > 0 extragem cifra cu n % 10\n• actualizăm acumulatorul, apoi n //= 10\n\nOglinditul construiește un număr nou adăugând fiecare cifră la dreapta: ogl = ogl * 10 + cifra.",
        code: "n = 4567\n\n# Suma cifrelor\ns = 0\ntemp = n\nwhile temp > 0:\n    s += temp % 10\n    temp //= 10\nprint(s)  # 22\n\n# Oglinditul\nogl = 0\ntemp = n\nwhile temp > 0:\n    ogl = ogl * 10 + temp % 10\n    temp //= 10\nprint(ogl)  # 7654\n\n# Produsul cifrelor\np = 1\ntemp = 234\nwhile temp > 0:\n    p *= temp % 10\n    temp //= 10\nprint(p)  # 24",
      },
      {
        title: "Numere speciale: palindrom și Armstrong",
        content: "• Palindrom — se citește la fel de la stânga la dreapta și invers. Verificare: n == oglindit(n). Exemple: 121, 1331.\n• Armstrong — suma cifrelor ridicate la puterea numărului de cifre este egală cu numărul însuși. Pentru 3 cifre: 153 = 1³ + 5³ + 3³.\n\nCriterii de divizibilitate utile:\n• cu 2 — ultima cifră pară\n• cu 3 — suma cifrelor divizibilă cu 3\n• cu 5 — ultima cifră 0 sau 5\n• cu 9 — suma cifrelor divizibilă cu 9",
        code: "# Palindrom\ndef este_palindrom(n):\n    temp, ogl = n, 0\n    while temp > 0:\n        ogl = ogl * 10 + temp % 10\n        temp //= 10\n    return n == ogl\n\nprint(este_palindrom(1331))  # True\n\n# Armstrong de 3 cifre\nn = 153\ns, temp = 0, n\nwhile temp > 0:\n    s += (temp % 10) ** 3\n    temp //= 10\nprint(s == n)  # True",
      },
      {
        title: "Parcurgerea divizorilor",
        content: "Un divizor al lui n este un număr d > 0 pentru care n % d == 0.\n\nParcurgere clasică: for d in range(1, n+1). Ineficient pentru n mare.\n\nOptimizare: parcurgem doar până la √n — pentru fiecare divizor d ≤ √n, perechea n/d este și ea divizor. Reduce complexitatea de la O(n) la O(√n).\n\nUn număr este prim dacă are exact 2 divizori (1 și el însuși). Verificare eficientă: nu există d în [2, √n] care să-l dividă.",
        code: "# Toți divizorii lui n\nn = 36\nfor d in range(1, n + 1):\n    if n % d == 0:\n        print(d, end=' ')\n# 1 2 3 4 6 9 12 18 36\n\n# Eficient — până la √n\nfrom math import isqrt\ndivs = []\nfor d in range(1, isqrt(n) + 1):\n    if n % d == 0:\n        divs.append(d)\n        if d != n // d:\n            divs.append(n // d)\nprint(sorted(divs))\n\n# Verificare prim\ndef este_prim(n):\n    if n < 2: return False\n    for d in range(2, isqrt(n) + 1):\n        if n % d == 0:\n            return False\n    return True",
      },
      {
        title: "Numere prime, perfecte, abundente, deficiente",
        content: "Clasificarea numerelor după suma divizorilor proprii (toți divizorii < n):\n• perfect — suma = n (ex: 6 = 1+2+3, 28 = 1+2+4+7+14)\n• abundent — suma > n (ex: 12, divizorii proprii 1+2+3+4+6 = 16)\n• deficient — suma < n (ex: 8, divizorii proprii 1+2+4 = 7)\n\nMajoritatea numerelor sunt deficiente. Numerele prime sunt cazul extrem (suma divizorilor proprii = 1).",
        code: "def suma_divizori_proprii(n):\n    s = 0\n    for d in range(1, n):\n        if n % d == 0:\n            s += d\n    return s\n\ndef clasifica(n):\n    s = suma_divizori_proprii(n)\n    if s == n: return 'perfect'\n    if s > n:  return 'abundent'\n    return 'deficient'\n\nprint(clasifica(6))   # perfect\nprint(clasifica(12))  # abundent\nprint(clasifica(8))   # deficient",
      },
      {
        title: "CMMDC și CMMMC — algoritmul lui Euclid",
        content: "CMMDC (cel mai mare divizor comun) — cel mai mare număr care îi divide pe ambii.\n\nAlgoritmul lui Euclid:\n• cu scăderi: cât timp a ≠ b, scădem cel mai mic din cel mai mare\n• cu împărțiri (mult mai rapid): a, b = b, a % b până când b devine 0; rezultatul este a\n\nCMMMC (cel mai mic multiplu comun) se calculează din CMMDC:\ncmmmc(a, b) = a * b // cmmdc(a, b)\n\nDouă numere sunt coprime dacă CMMDC = 1 (ex: 17 și 5).",
        code: "# Euclid cu împărțiri\ndef cmmdc(a, b):\n    while b != 0:\n        a, b = b, a % b\n    return a\n\nprint(cmmdc(48, 18))  # 6\nprint(cmmdc(17, 5))   # 1 (coprime)\n\n# CMMMC\ndef cmmmc(a, b):\n    return a * b // cmmdc(a, b)\n\nprint(cmmmc(4, 6))    # 12\n\n# Variantă cu scăderi (mai lentă)\ndef cmmdc_scaderi(a, b):\n    while a != b:\n        if a > b: a -= b\n        else:     b -= a\n    return a",
      },
      {
        title: "Descompunere în factori primi",
        content: "Teorema fundamentală a aritmeticii: orice număr natural ≥ 2 se scrie în mod unic ca produs de puteri de numere prime.\n\nAlgoritm:\n1. pornim cu d = 2 (cel mai mic număr prim)\n2. cât timp n % d == 0, împărțim n la d și creștem exponentul\n3. trecem la d + 1 și repetăm până n devine 1\n\nExemplu: 360 = 2³ × 3² × 5.",
        code: "n = 360\nd = 2\nwhile n > 1:\n    p = 0\n    while n % d == 0:\n        p += 1\n        n //= d\n    if p > 0:\n        print(f'{d}^{p}')\n    d += 1\n# 2^3\n# 3^2\n# 5^1\n\n# Optimizare: d * d > n → n rămas este prim\ndef factori(n):\n    d = 2\n    while d * d <= n:\n        while n % d == 0:\n            print(d)\n            n //= d\n        d += 1\n    if n > 1:\n        print(n)",
      },
      {
        title: "Sisteme de numerație: baza 2, 8, 16",
        content: "Reprezentarea unui număr în baza b folosește cifre de la 0 la b-1. Hexazecimal (baza 16) folosește 0-9 și literele A-F.\n\nBaza 10 → baza b: împărțim repetat la b și citim resturile de jos în sus.\nBaza b → baza 10: înmulțim fiecare cifră cu b^poziție și adunăm.\n\nFuncții Python predefinite:\n• bin(n) → string '0b...' (binar)\n• oct(n) → string '0o...' (octal)\n• hex(n) → string '0x...' (hexazecimal)\n• int(s, baza) → conversie inversă, dintr-un string în zecimal",
        code: "# Conversie manuală 10 → 2\ndef to_bin(n):\n    if n == 0: return '0'\n    result = ''\n    while n > 0:\n        result = str(n % 2) + result\n        n //= 2\n    return result\n\nprint(to_bin(13))  # '1101'\n\n# Funcții built-in\nprint(bin(13))       # '0b1101'\nprint(oct(64))       # '0o100'\nprint(hex(255))      # '0xff'\n\n# Conversie inversă (string → zecimal)\nprint(int('1101', 2))   # 13\nprint(int('ff', 16))    # 255\nprint(int('100', 8))    # 64",
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
      {
        title: "Clase și obiecte",
        content: "Programarea Orientată pe Obiecte (POO) grupează datele și funcțiile care lucrează cu ele într-o singură entitate: clasa.\n\n• Clasă — un șablon/plan după care se creează obiecte\n• Obiect (instanță) — o „bucată concretă\" creată după acel șablon\n\nDintr-o clasă putem crea oricâte obiecte, fiecare cu propriile valori.",
        code: "class Carte:\n    pass  # clasă goală, doar șablon\n\n# Cream două obiecte (instanțe)\nc1 = Carte()\nc2 = Carte()\n\nprint(type(c1))  # <class '__main__.Carte'>\nprint(c1 is c2)  # False — sunt obiecte distincte",
      },
      {
        title: "Atribute și __init__ (constructorul)",
        content: "Atributele sunt datele unui obiect (ex: numele și nota unui elev).\n\n• __init__ este constructorul — se apelează automat la crearea obiectului\n• self este referința la obiectul curent — primul parametru al oricărei metode\n• Atributele se setează cu self.nume_atribut = valoare\n\nAtenție: la apelare NU transmitem self — Python îl pune automat.",
        code: "class Elev:\n    def __init__(self, nume, nota):\n        self.nume = nume    # atribut de instanță\n        self.nota = nota\n\ne1 = Elev('Ana', 9)\ne2 = Elev('Mihai', 7)\n\nprint(e1.nume, e1.nota)  # Ana 9\nprint(e2.nume, e2.nota)  # Mihai 7\n\n# Putem modifica atributele direct\ne1.nota = 10\nprint(e1.nota)  # 10",
      },
      {
        title: "Metode",
        content: "Metodele sunt funcții definite în interiorul clasei. Au mereu self ca prim parametru, prin care accesează atributele obiectului.\n\nDouă tipuri uzuale:\n• metode care returnează ceva (ex: o verificare, un calcul)\n• metode care modifică starea obiectului (ex: schimbă un atribut)",
        code: "class Elev:\n    def __init__(self, nume, nota):\n        self.nume = nume\n        self.nota = nota\n\n    def promovat(self):\n        # returnează True/False\n        return self.nota >= 5\n\n    def adauga_bonus(self, bonus):\n        # modifică obiectul\n        self.nota = min(10, self.nota + bonus)\n\ne = Elev('Ana', 4)\nprint(e.promovat())   # False\ne.adauga_bonus(2)\nprint(e.nota)         # 6\nprint(e.promovat())   # True",
      },
      {
        title: "Metode speciale (__str__)",
        content: "Metodele care încep și se termină cu __ se numesc „dunder methods\" și sunt apelate automat de Python.\n\n• __str__(self) — definește ce afișează print(obiect)\n• __eq__(self, other) — definește când două obiecte sunt egale (==)\n\nFără __str__, print afișează ceva tehnic, gen <__main__.Elev object at 0x...>.",
        code: "class Elev:\n    def __init__(self, nume, nota):\n        self.nume = nume\n        self.nota = nota\n\n    def __str__(self):\n        return f'{self.nume}: {self.nota}'\n\n    def __eq__(self, alt):\n        return self.nume == alt.nume and self.nota == alt.nota\n\na = Elev('Ana', 9)\nb = Elev('Ana', 9)\nprint(a)        # Ana: 9\nprint(a == b)   # True",
      },
      {
        title: "Exemplu complet: clasa Punct",
        content: "Punem totul cap la cap: o clasă Punct cu coordonate (x, y), o metodă care calculează distanța față de alt punct și __str__ pentru afișare.",
        code: "from math import sqrt\n\nclass Punct:\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y\n\n    def distanta(self, alt):\n        return sqrt((self.x - alt.x) ** 2 + (self.y - alt.y) ** 2)\n\n    def __str__(self):\n        return f'({self.x}, {self.y})'\n\np1 = Punct(0, 0)\np2 = Punct(3, 4)\n\nprint(p1)                 # (0, 0)\nprint(p2)                 # (3, 4)\nprint(p1.distanta(p2))    # 5.0",
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
        content: "Metode de citire:\n• read() — tot conținutul ca string\n• readline() — o singură linie\n• readlines() — lista tuturor liniilor\n\nSfârșitul fișierului se detectează când read() returnează string gol.",
        code: "# Citirea numerelor dintr-un fișier\nwith open('numere.txt') as f:\n    numere = []\n    for linie in f:\n        numere.append(int(linie.strip()))\n\nprint(sum(numere))\nprint(max(numere))",
      },
      {
        title: "Tkinter — import și prima fereastră",
        content: "Tkinter este biblioteca standard Python pentru interfețe grafice (vine instalată cu Python, nu trebuie pip install).\n\nPașii pentru orice aplicație Tkinter:\n1. import tkinter as tk\n2. creezi fereastra principală: root = tk.Tk()\n3. adaugi componente (Label, Button, etc.)\n4. apelezi root.mainloop() — bucla de evenimente care ține fereastra deschisă și reacționează la click-uri și taste. Fără mainloop(), fereastra se închide imediat.",
        code: "import tkinter as tk\n\nroot = tk.Tk()\nroot.title('Prima mea fereastră')\nroot.geometry('400x300')   # lățime x înălțime\n\n# (aici adăugăm componente)\n\nroot.mainloop()  # programul rămâne aici până închizi fereastra",
      },
      {
        title: "Label — afișarea de text",
        content: "Un Label afișează text static (sau o imagine). Parametri uzuali: text, font, fg (culoare text), bg (fundal).\n\nDupă ce creezi un widget, trebuie să-l așezi în fereastră cu un manager de layout:\n• .pack() — pune unul sub altul (cel mai simplu)\n• .grid(row=, column=) — în grilă\n\nValoarea textului se schimbă cu .config(text=...).",
        code: "import tkinter as tk\n\nroot = tk.Tk()\nroot.title('Label')\n\ntitlu = tk.Label(root, text='Bun venit!', font=('Arial', 20, 'bold'), fg='blue')\ntitlu.pack(pady=10)\n\nsubtitlu = tk.Label(root, text='Aplicația mea în Tkinter')\nsubtitlu.pack()\n\nroot.mainloop()",
      },
      {
        title: "Button — atașarea funcțiilor",
        content: "Un buton execută o funcție când e apăsat. Parametrul command primește **numele funcției, FĂRĂ paranteze** (altfel funcția e apelată o singură dată, la pornire, nu la click).\n\n✗ command=click()  — greșit\n✓ command=click    — corect\n\nÎn interiorul funcției putem modifica alte widget-uri, de exemplu un Label, folosind .config(text=...).",
        code: "import tkinter as tk\n\nroot = tk.Tk()\ncontor = 0\n\neticheta = tk.Label(root, text='Click-uri: 0', font=('Arial', 16))\neticheta.pack(pady=10)\n\ndef pe_click():\n    global contor\n    contor += 1\n    eticheta.config(text=f'Click-uri: {contor}')\n\nbtn = tk.Button(root, text='Apasă-mă', command=pe_click)\nbtn.pack(pady=5)\n\nroot.mainloop()",
      },
      {
        title: "Entry — citirea textului de la utilizator",
        content: "Entry este un câmp de text pe o singură linie.\n\nMetode utile:\n• .get() — întoarce textul scris (ca string)\n• .insert(0, 'text') — pune un text implicit\n• .delete(0, tk.END) — golește câmpul",
        code: "import tkinter as tk\n\nroot = tk.Tk()\n\ntk.Label(root, text='Numele tău:').pack()\n\nintrare = tk.Entry(root, width=30)\nintrare.pack(pady=5)\n\nrezultat = tk.Label(root, text='')\nrezultat.pack(pady=5)\n\ndef saluta():\n    nume = intrare.get()\n    rezultat.config(text=f'Salut, {nume}!')\n    intrare.delete(0, tk.END)  # golește câmpul\n\ntk.Button(root, text='Salută', command=saluta).pack()\n\nroot.mainloop()",
      },
      {
        title: "messagebox — ferestre de dialog",
        content: "Modulul messagebox afișează ferestre pop-up pentru a comunica cu utilizatorul.\n\n• showinfo(titlu, mesaj) — informație\n• showwarning(titlu, mesaj) — avertisment\n• showerror(titlu, mesaj) — eroare\n• askyesno(titlu, întrebare) — întoarce True / False în funcție de butonul apăsat\n\nSe importă separat: from tkinter import messagebox.",
        code: "import tkinter as tk\nfrom tkinter import messagebox\n\nroot = tk.Tk()\n\nintrare = tk.Entry(root)\nintrare.pack(pady=5)\n\ndef verifica():\n    text = intrare.get()\n    if not text:\n        messagebox.showwarning('Atenție', 'Câmpul este gol!')\n        return\n    if messagebox.askyesno('Confirmare', f'Trimit \"{text}\"?'):\n        messagebox.showinfo('Gata', 'Trimis cu succes!')\n\ntk.Button(root, text='Trimite', command=verifica).pack()\n\nroot.mainloop()",
      },
      {
        title: "Canvas — desenăm forme",
        content: "Canvas este o zonă pe care putem desena linii, dreptunghiuri, cercuri, text.\n\nSistemul de coordonate:\n• (0, 0) este în colțul stânga-sus\n• x crește spre dreapta, y crește în JOS\n\nMetode principale:\n• create_line(x1, y1, x2, y2, fill=, width=)\n• create_rectangle(x1, y1, x2, y2, fill=, outline=)\n• create_oval(x1, y1, x2, y2, fill=)  — elipsă/cerc înscris în dreptunghi\n• create_text(x, y, text=, font=)",
        code: "import tkinter as tk\n\nroot = tk.Tk()\nroot.title('Față zâmbitoare')\n\ncanvas = tk.Canvas(root, width=300, height=300, bg='white')\ncanvas.pack()\n\n# Capul (cerc galben)\ncanvas.create_oval(50, 50, 250, 250, fill='yellow', outline='black', width=2)\n\n# Ochii\ncanvas.create_oval(100, 110, 130, 140, fill='black')\ncanvas.create_oval(170, 110, 200, 140, fill='black')\n\n# Gura (arc — un oval „tăiat\")\ncanvas.create_arc(100, 140, 200, 220, start=200, extent=140,\n                  style='arc', width=3)\n\ncanvas.create_text(150, 280, text='Salut! :)', font=('Arial', 14))\n\nroot.mainloop()",
      },
    ],
  },
];
