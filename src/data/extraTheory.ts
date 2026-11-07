// Capitole suplimentare de teorie publică (doar web, secțiunea /invata).
// Conținut original PyRo: explicații și exemple scrise de noi.
import type { ChapterTheory } from "./chapterTheory";

export const extraTheories: ChapterTheory[] = [
  {
    chapterId: "x5",
    sections: [
      {
        title: "De ce contează eficiența",
        content:
          "Două programe pot da același rezultat corect, dar unul termină într-o fracțiune de secundă, iar celălalt după câteva minute. La concursuri și la Subiectul III de la Bacalaureat, se cere explicit un algoritm „eficient din punctul de vedere al timpului de executare și al memoriei utilizate”.\n\nMăsurăm eficiența prin complexitate: cum crește numărul de operații (timp) și cantitatea de memorie pe măsură ce crește dimensiunea datelor, notată de obicei n.\n\nNu numărăm secunde exacte, ci ordinul de mărime al creșterii — de aceea folosim notația O(...).",
      },
      {
        title: "Notația O: clasele uzuale",
        content:
          "Cele mai întâlnite clase, de la cea mai rapidă la cea mai lentă:\n• O(1) — timp constant: accesul la lista[i], o formulă matematică.\n• O(log n) — logaritmic: căutarea binară, ridicarea la putere rapidă.\n• O(n) — liniar: o singură parcurgere a datelor.\n• O(n log n) — sortările eficiente (Merge Sort, sorted() din Python).\n• O(n²) — două bucle imbricate pe aceleași date (Bubble Sort).\n• O(2ⁿ) — generarea tuturor submulțimilor.\n\nRegulă practică de estimare: un calculator obișnuit execută în jur de 10⁷–10⁸ operații simple pe secundă în C++; Python este de regulă de zeci de ori mai lent. Pentru n = 100 000, un algoritm O(n²) înseamnă 10¹⁰ operații — mult prea mult, pe când O(n) sau O(n log n) se încadrează lejer.\n\nConstantele și termenii mai mici se ignoră: 3n + 5 operații înseamnă tot O(n).",
        code: "import time\n\nn = 2000\ndate = list(range(n))\n\n# O(n²): comparăm fiecare pereche\nt = time.time()\nperechi = 0\nfor i in range(n):\n    for j in range(i + 1, n):\n        perechi += 1\nprint('O(n²):', perechi, 'pași', round(time.time() - t, 3), 's')\n\n# O(1): aceeași valoare printr-o formulă\nt = time.time()\nprint('O(1): ', n * (n - 1) // 2, 'pași', round(time.time() - t, 6), 's')",
      },
      {
        title: "Memorie O(1): prelucrare „din zbor”",
        content:
          "O greșeală frecventă este să salvăm toate valorile citite într-o listă, deși avem nevoie doar de un rezultat cumulat (suma, maximul, numărul de valori cu o proprietate).\n\nDacă fiecare valoare poate fi prelucrată imediat după citire și apoi „uitată”, memoria folosită rămâne constantă, indiferent câte numere sunt — memorie O(1).\n\nIdeea este ca, după fiecare valoare citită, să actualizăm câteva variabile care rezumă tot ce am văzut până atunci. Exemplu: determinăm maximul și de câte ori apare, într-o singură parcurgere, fără listă.",
        code: "# Simulăm citirea unui șir lung de numere, unul câte unul\ndef citeste_numere():\n    for x in [7, 3, 9, 2, 9, 5, 9, 1]:\n        yield x\n\nmaxim = None\naparitii = 0\nfor x in citeste_numere():\n    if maxim is None or x > maxim:\n        maxim = x          # maxim nou: resetăm contorul\n        aparitii = 1\n    elif x == maxim:\n        aparitii += 1\n\nprint(maxim, aparitii)     # 9 3",
      },
      {
        title: "Vectori de frecvență pentru valori mici",
        content:
          "Când valorile sunt numere naturale dintr-un interval mic (de exemplu cifre, note de la 1 la 10 sau numere cel mult 1000), putem număra aparițiile într-o listă indexată chiar după valoare.\n\nAstfel aflăm în O(1) de câte ori a apărut o valoare și putem afișa valorile în ordine crescătoare fără a sorta, într-un timp proporțional cu n plus mărimea intervalului.\n\nExemplu tip Bac: se citesc numere de cel mult două cifre; afișăm valorile care apar o singură dată, în ordine crescătoare.",
        code: "numere = [12, 5, 99, 12, 7, 5, 40]\n\nfrecv = [0] * 100          # valori posibile: 0..99\nfor x in numere:\n    frecv[x] += 1\n\nunice = [v for v in range(100) if frecv[v] == 1]\nprint(unice)               # [7, 40, 99]",
      },
      {
        title: "Sume parțiale (prefix sums)",
        content:
          "Problema: avem o listă a cu n numere și primim multe întrebări de forma „cât este suma elementelor de la poziția st la poziția dr?”. Calculând fiecare sumă cu o buclă, fiecare întrebare costă O(n).\n\nIdeea: construim o singură dată lista s, unde s[i] este suma primelor i elemente (s[0] = 0). Atunci suma de la st la dr (indici de la 0, inclusiv capetele) este:\n\ns[dr + 1] - s[st]\n\nConstrucția costă O(n), apoi fiecare întrebare se rezolvă în O(1), printr-o simplă scădere. Pentru q întrebări, timpul total scade de la O(n·q) la O(n + q).\n\nAtenție la convenția de indici: elementul s[0] = 0 evită cazul special st = 0.",
        code: "a = [4, -1, 3, 8, 2, -5, 6]\n\ns = [0] * (len(a) + 1)\nfor i in range(len(a)):\n    s[i + 1] = s[i] + a[i]\nprint(s)   # [0, 4, 3, 6, 14, 16, 11, 17]\n\ndef suma(st, dr):\n    return s[dr + 1] - s[st]\n\nprint(suma(0, 2))   # 4 - 1 + 3 = 6\nprint(suma(2, 4))   # 3 + 8 + 2 = 13\nprint(suma(3, 6))   # 8 + 2 - 5 + 6 = 11",
      },
      {
        title: "Secvența de sumă maximă (algoritmul lui Kadane)",
        content:
          "Problema: într-o listă de numere întregi (pozitive și negative), găsește suma maximă a unei secvențe de elemente consecutive (nevidă).\n\nVarianta naivă încearcă toate perechile (st, dr): O(n²) chiar și folosind sume parțiale.\n\nObservația lui Kadane: parcurgem lista o singură dată și păstrăm curent = cea mai bună sumă a unei secvențe care se termină exact la poziția curentă. Pentru elementul x avem două variante: continuăm secvența anterioară (curent + x) sau începem una nouă de la x. Alegem maximul dintre ele.\n\nRăspunsul este cel mai mare curent întâlnit. Timp O(n), memorie O(1).\n\nDacă toate numerele sunt negative, rezultatul este cel mai mare dintre ele — de aceea inițializăm cu primul element, nu cu 0.",
        code: "def suma_maxima(a):\n    curent = best = a[0]\n    st = st_best = dr_best = 0\n    for i in range(1, len(a)):\n        if curent + a[i] < a[i]:\n            curent = a[i]       # începem o secvență nouă\n            st = i\n        else:\n            curent += a[i]      # continuăm secvența\n        if curent > best:\n            best, st_best, dr_best = curent, st, i\n    return best, st_best, dr_best\n\nprint(suma_maxima([2, -8, 3, -2, 4, -10, 5]))   # (5, 2, 4) -> 3 - 2 + 4\nprint(suma_maxima([-7, -3, -9]))               # (-3, 1, 1)",
      },
      {
        title: "Ridicarea la putere rapidă",
        content:
          "Calculul lui aⁿ prin n înmulțiri succesive are complexitate O(n). Putem face mult mai bine folosind proprietățile puterilor:\n• dacă n este par: aⁿ = (a²)^(n/2)\n• dacă n este impar: aⁿ = a · aⁿ⁻¹\n\nLa fiecare pas exponentul se înjumătățește (cel mult după un pas intermediar), deci numărul de înmulțiri este O(log n). Pentru n = 10⁹ sunt necesare doar în jur de 60 de înmulțiri.\n\nDe obicei se cere rezultatul modulo un număr m (de exemplu 1 000 000 007), ca valorile să rămână mici; aplicăm % m după fiecare înmulțire, ceea ce este corect deoarece (x · y) mod m = ((x mod m) · (y mod m)) mod m.\n\nÎn Python, funcția predefinită pow(a, n, m) face exact acest lucru.",
        code: "def putere(a, n, m):\n    rezultat = 1\n    a %= m\n    while n > 0:\n        if n % 2 == 1:          # bitul curent al exponentului este 1\n            rezultat = rezultat * a % m\n        a = a * a % m\n        n //= 2\n    return rezultat\n\nMOD = 1_000_000_007\nprint(putere(2, 10, MOD))           # 1024\nprint(putere(3, 10**18, MOD))\nprint(pow(3, 10**18, MOD))          # aceeași valoare, funcția predefinită",
      },
      {
        title: "Capcane frecvente",
        content:
          "• O funcție predefinită nu este „gratuită”: x in lista, lista.count(x) și lista.index(x) parcurg lista, deci costă O(n). Folosite într-o buclă, duc la O(n²). Pentru căutări repetate, folosește set sau dict (O(1) în medie).\n• Concatenarea repetată de șiruri cu += într-o buclă poate deveni costisitoare; pentru multe bucăți, adună-le într-o listă și folosește ''.join(...).\n• La sume parțiale, confuzia între indicii de la 0 și cei de la 1 produce rezultate decalate cu o poziție.\n• La Kadane, inițializarea cu 0 dă un răspuns greșit dacă toate numerele sunt negative.\n• Un algoritm eficient trebuie mai întâi să fie corect: optimizează doar după ce ai o soluție care funcționează.",
      },
    ],
  },
  {
    chapterId: "xi6",
    sections: [
      {
        title: "Reamintire: ce este programarea dinamică",
        content:
          "Programarea dinamică rezolvă o problemă mare combinând soluțiile unor subprobleme mai mici, care se repetă. Fiecare subproblemă se rezolvă o singură dată, iar rezultatul se păstrează într-un tablou.\n\nPașii de lucru sunt mereu aceiași:\n1. Definim starea: ce înseamnă exact dp[i] sau dp[i][j].\n2. Scriem recurența: cum se obține o stare din stări deja calculate.\n3. Stabilim cazurile de bază.\n4. Alegem ordinea de calcul, astfel încât stările necesare să fie deja calculate.\n5. Dacă se cere, reconstituim soluția (nu doar valoarea optimă).\n\nMetoda se aplică atunci când soluția optimă se construiește din soluții optime ale subproblemelor (substructură optimă).",
      },
      {
        title: "Numărul de drumuri într-o matrice",
        content:
          "Un robot pleacă din colțul stânga-sus al unei grile cu n linii și m coloane și vrea să ajungă în colțul dreapta-jos. La fiecare pas se poate deplasa doar o celulă la dreapta sau o celulă în jos. Unele celule sunt blocate. Câte drumuri distincte există?\n\nStarea: dp[i][j] = numărul de drumuri de la start până la celula (i, j).\n\nRecurența: într-o celulă liberă ajungem fie de sus, fie din stânga, deci dp[i][j] = dp[i-1][j] + dp[i][j-1]. Într-o celulă blocată, dp[i][j] = 0.\n\nCaz de bază: dp[0][0] = 1 (dacă startul este liber).\n\nParcurgem matricea linie cu linie, de la stânga la dreapta, astfel încât vecinii de sus și din stânga sunt deja calculați. Complexitate O(n·m).\n\nFără obstacole, rezultatul este combinarea C(n+m-2, n-1): alegem care dintre cei n+m-2 pași sunt în jos.",
        code: "from math import comb\n\ndef numar_drumuri(grila):\n    n, m = len(grila), len(grila[0])\n    dp = [[0] * m for _ in range(n)]\n    for i in range(n):\n        for j in range(m):\n            if grila[i][j] == 1:        # celulă blocată\n                dp[i][j] = 0\n            elif i == 0 and j == 0:\n                dp[i][j] = 1\n            else:\n                sus = dp[i - 1][j] if i > 0 else 0\n                stanga = dp[i][j - 1] if j > 0 else 0\n                dp[i][j] = sus + stanga\n    return dp[n - 1][m - 1]\n\nlibera = [[0] * 4 for _ in range(3)]\nprint(numar_drumuri(libera), comb(3 + 4 - 2, 3 - 1))   # 10 10\n\ncu_obstacol = [[0, 0, 0, 0],\n               [0, 1, 0, 0],\n               [0, 0, 0, 0]]\nprint(numar_drumuri(cu_obstacol))                      # 4",
      },
      {
        title: "Drumul de sumă maximă și reconstituirea lui",
        content:
          "Acum fiecare celulă conține un număr (de exemplu, monede). Cu aceleași mutări (dreapta sau jos), vrem drumul care adună suma maximă.\n\nStarea: dp[i][j] = suma maximă a unui drum de la start până la (i, j).\n\nRecurența: dp[i][j] = a[i][j] + max(dp[i-1][j], dp[i][j-1]), cu atenție la prima linie și prima coloană, unde există un singur vecin anterior.\n\nPentru a afla și traseul, nu doar suma, pornim de la final și mergem înapoi: din (i, j) ne întoarcem în vecinul (sus sau stânga) care are valoarea dp mai mare — acela este cel din care am venit. Apoi inversăm lista obținută.\n\nAceeași idee, cu min în loc de max, rezolvă problema drumului de cost minim.",
        code: "def drum_maxim(a):\n    n, m = len(a), len(a[0])\n    dp = [[0] * m for _ in range(n)]\n    for i in range(n):\n        for j in range(m):\n            if i == 0 and j == 0:\n                dp[i][j] = a[0][0]\n            elif i == 0:\n                dp[i][j] = dp[i][j - 1] + a[i][j]\n            elif j == 0:\n                dp[i][j] = dp[i - 1][j] + a[i][j]\n            else:\n                dp[i][j] = a[i][j] + max(dp[i - 1][j], dp[i][j - 1])\n\n    # reconstituirea drumului, de la final spre start\n    i, j = n - 1, m - 1\n    drum = [(i, j)]\n    while (i, j) != (0, 0):\n        if i == 0:\n            j -= 1\n        elif j == 0:\n            i -= 1\n        elif dp[i - 1][j] >= dp[i][j - 1]:\n            i -= 1\n        else:\n            j -= 1\n        drum.append((i, j))\n    return dp[n - 1][m - 1], drum[::-1]\n\nmonede = [[3, 1, 5],\n          [2, 8, 1],\n          [4, 2, 6]]\nsuma, drum = drum_maxim(monede)\nprint(suma)   # 3 + 2 + 8 + 2 + 6 = 21\nprint(drum)   # [(0, 0), (1, 0), (1, 1), (2, 1), (2, 2)]",
      },
      {
        title: "Cel mai lung subșir strict crescător",
        content:
          "Un subșir se obține eliminând zero sau mai multe elemente, fără a schimba ordinea celor rămase (elementele nu trebuie să fie consecutive). Căutăm cel mai lung subșir în care fiecare element este strict mai mare decât precedentul.\n\nStarea: L[i] = lungimea celui mai lung subșir strict crescător care se TERMINĂ cu elementul a[i].\n\nRecurența: L[i] = 1 + max(L[j]) pentru toți j < i cu a[j] < a[i]; dacă nu există un astfel de j, L[i] = 1.\n\nRăspunsul este maximul din L (subșirul optim se poate termina oriunde). Pentru reconstituire, reținem în pred[i] indicele j din care am prelungit.\n\nComplexitatea acestei variante este O(n²). Există și o variantă în O(n log n), bazată pe căutare binară, utilă pentru n foarte mare.\n\nPot exista mai multe subșiruri optime; algoritmul afișează unul dintre ele.",
        code: "def subsir_crescator(a):\n    n = len(a)\n    L = [1] * n\n    pred = [-1] * n\n    for i in range(n):\n        for j in range(i):\n            if a[j] < a[i] and L[j] + 1 > L[i]:\n                L[i] = L[j] + 1\n                pred[i] = j\n\n    k = max(range(n), key=lambda i: L[i])   # unde se termină subșirul\n    subsir = []\n    while k != -1:\n        subsir.append(a[k])\n        k = pred[k]\n    return subsir[::-1]\n\na = [5, 2, 8, 6, 3, 6, 9, 7]\nrez = subsir_crescator(a)\nprint(len(rez), rez)   # 4 [2, 3, 6, 9]",
      },
      {
        title: "Problema rucsacului (varianta 0-1)",
        content:
          "Avem n obiecte; obiectul i are greutatea g[i] și valoarea v[i]. Rucsacul suportă cel mult greutatea G. Fiecare obiect se ia întreg sau deloc (de aici „0-1”). Ce valoare totală maximă putem transporta?\n\nMetoda Greedy (alegerea după raportul valoare/greutate) NU garantează optimul în această variantă — vezi contraexemplul din cod. Greedy este corect doar pentru rucsacul fracționar, unde obiectele pot fi tăiate.\n\nStarea: dp[c] = valoarea maximă care încape într-o capacitate c, folosind obiectele analizate până acum.\n\nPentru fiecare obiect, actualizăm dp[c] = max(dp[c], dp[c - g] + v), parcurgând capacitățile DESCRESCĂTOR, de la G până la g. Ordinea descrescătoare garantează că fiecare obiect este folosit cel mult o dată.\n\nComplexitate O(n·G) timp și O(G) memorie, cu G număr natural.",
        code: "def rucsac(obiecte, G):\n    dp = [0] * (G + 1)\n    for g, v in obiecte:\n        for c in range(G, g - 1, -1):   # descrescător!\n            dp[c] = max(dp[c], dp[c - g] + v)\n    return dp[G]\n\n# (greutate, valoare)\nobiecte = [(1, 6), (2, 10), (3, 12)]\nG = 5\nprint(rucsac(obiecte, G))   # 22: obiectele 2 și 3\n\n# Greedy după valoare/greutate alege obiectul 1 (raport 6), apoi 2 (raport 5),\n# apoi obiectul 3 nu mai încape: total 16 < 22",
      },
      {
        title: "Capcane frecvente",
        content:
          "• Definiția stării trebuie scrisă clar înainte de cod. Multe greșeli apar din confuzia între „cel mai lung subșir până la i” și „cel mai lung subșir care se termină în i”.\n• Matricea dp creată cu [[0] * m] * n are toate liniile identice (aceeași listă repetată); folosește [[0] * m for _ in range(n)].\n• La rucsacul 0-1 cu o singură listă, parcurgerea crescătoare a capacităților permite folosirea aceluiași obiect de mai multe ori — aceasta este, de fapt, altă problemă (rucsacul nelimitat).\n• Prima linie și prima coloană ale unei matrice au un singur vecin anterior; tratează-le separat sau bordează matricea.\n• Subșir nu înseamnă secvență: un subșir poate sări peste elemente, o secvență este formată din elemente consecutive.",
      },
    ],
  },
];
