// Teorie publică pentru clasele a X-a și a XI-a (doar web, secțiunea /invata).
// Conținut original PyRo — exemple și explicații scrise de noi.
// Păstrat separat de chapterTheory.ts ca să nu apară în aplicația mobilă.
import type { ChapterTheory } from "./chapterTheory";

export const advancedTheories: ChapterTheory[] = [
  {
    chapterId: "x1",
    sections: [
      {
        title: "Ce este un șir de caractere",
        content:
          "Un șir (tipul str) este o secvență ordonată de caractere: litere, cifre, spații, semne. Îl scriem între ghilimele simple sau duble — Python le tratează identic.\n\nCel mai important lucru de reținut: șirurile sunt IMUTABILE. Odată creat, un șir nu mai poate fi modificat pe loc. Orice „modificare” construiește, de fapt, un șir nou.\n\nDe aceea s[0] = 'X' produce eroare, dar s = 'X' + s[1:] funcționează: creăm un șir nou și îl legăm de același nume.",
        code: "mesaj = 'olimpiada'\nprint(len(mesaj))     # 9\nprint(mesaj[0])       # o\n\n# mesaj[0] = 'O'      # TypeError: str nu se poate modifica\nmesaj = 'O' + mesaj[1:]\nprint(mesaj)          # Olimpiada",
      },
      {
        title: "Indici pozitivi și negativi",
        content:
          "Fiecare caracter are două adrese: un indice pozitiv, numărat de la stânga începând cu 0, și unul negativ, numărat de la dreapta începând cu -1.\n\nPentru cuvântul 'cod':\n• c → indice 0 sau -3\n• o → indice 1 sau -2\n• d → indice 2 sau -1\n\nIndicii negativi sunt foarte comozi când ai nevoie de ultimele caractere și nu vrei să calculezi len(s) - 1.",
        code: "fisier = 'tema_info.py'\nprint(fisier[-1])     # y\nprint(fisier[-3:])    # .py  — extensia\n\n# Verificăm rapid extensia unui fișier\nif fisier[-3:] == '.py':\n    print('Este un program Python')",
      },
      {
        title: "Secționarea (slicing)",
        content:
          "Notația s[start:stop:pas] extrage o bucată din șir. Ca la range(), poziția stop NU este inclusă.\n\nDacă lipsește start, se pornește de la început; dacă lipsește stop, se merge până la final; pasul implicit este 1.\n\nTrucul clasic: s[::-1] parcurge șirul cu pasul -1 și îl întoarce pe dos — o singură linie în loc de o buclă întreagă.\n\nSlicing-ul nu dă niciodată eroare de indice: dacă depășești capătul, se oprește pur și simplu acolo.",
        code: "cnp_fictiv = '5080315123456'\nan = cnp_fictiv[1:3]       # '08'\nluna = cnp_fictiv[3:5]     # '03'\nzi = cnp_fictiv[5:7]       # '15'\nprint(zi, luna, an)\n\nprint('radar'[::-1])       # radar  → palindrom!\nprint('abcdefgh'[::2])     # aceg   → din 2 în 2\nprint('abc'[1:100])        # bc     → fără eroare",
      },
      {
        title: "Metode esențiale pentru text",
        content:
          "Clasa str vine cu zeci de metode gata făcute. Pe acestea le folosești aproape la orice problemă:\n\n• lower() / upper() — litere mici / mari\n• strip() — elimină spațiile de la capete (foarte util la citire)\n• split(sep) — taie șirul în bucăți și întoarce o listă\n• sep.join(lista) — operația inversă: lipește bucățile\n• find(x) — poziția primei apariții sau -1 dacă nu există\n• count(x) — de câte ori apare x\n• replace(a, b) — înlocuiește toate aparițiile lui a cu b\n• isdigit(), isalpha() — verifică tipul caracterelor\n\nAmintește-ți: fiind imutabil, niciuna nu schimbă șirul original — toate întorc un rezultat nou.",
        code: "linie = '   Popescu Ana ; 10 ; 9 ; 8   '\nbucati = [b.strip() for b in linie.strip().split(';')]\nnume = bucati[0]\nnote = [int(x) for x in bucati[1:]]\nprint(nume, sum(note) / len(note))   # Popescu Ana 9.0\n\nprint('-'.join(['2026', '11', '04']))  # 2026-11-04\nprint('banana'.count('a'))             # 3",
      },
      {
        title: "Coduri de caractere: ord() și chr()",
        content:
          "Calculatorul memorează fiecare caracter ca pe un număr (codul Unicode). ord(c) îți dă numărul, chr(n) face drumul invers.\n\nLiterele mici englezești au coduri consecutive ('a' = 97 … 'z' = 122), la fel majusculele ('A' = 65 … 'Z' = 90). Asta permite „aritmetica pe litere”: poziția literei c în alfabet este ord(c) - ord('a').\n\nPe această idee se bazează cifrul lui Cezar, una dintre cele mai vechi metode de criptare.",
        code: "def cezar(text, k):\n    rezultat = ''\n    for c in text:\n        if 'a' <= c <= 'z':\n            poz = (ord(c) - ord('a') + k) % 26\n            rezultat += chr(ord('a') + poz)\n        else:\n            rezultat += c          # spațiile rămân la fel\n    return rezultat\n\nsecret = cezar('ne vedem la ora zece', 3)\nprint(secret)              # qh yhghp od rud chfh\nprint(cezar(secret, -3))   # decriptare",
      },
      {
        title: "Formatarea cu f-strings",
        content:
          "Un f-string începe cu litera f înaintea ghilimelelor și îți permite să pui expresii direct între acolade.\n\nDupă două puncte poți controla formatul:\n• {x:.2f} — două zecimale\n• {x:>8} — aliniat la dreapta pe 8 poziții\n• {x:05d} — completat cu zerouri până la 5 cifre\n\nEste cea mai citibilă metodă de a construi mesaje și tabele în Python modern.",
        code: "elevi = [('Ana', 9.456), ('Mihai', 10), ('Ioana', 8.5)]\nfor i, (nume, medie) in enumerate(elevi, start=1):\n    print(f'{i:02d}. {nume:<8} {medie:>6.2f}')\n# 01. Ana        9.46\n# 02. Mihai     10.00\n# 03. Ioana      8.50",
      },
      {
        title: "Capcane frecvente",
        content:
          "• Concatenarea repetată într-o buclă (s += c) creează de fiecare dată un șir nou. Pentru texte foarte lungi, adună bucățile într-o listă și folosește ''.join(lista) la final.\n• input() întoarce mereu text: '5' + '3' dă '53', nu 8. Convertește cu int() când ai nevoie de numere.\n• Compararea șirurilor se face lexicografic, caracter cu caracter: '10' < '9' este True!\n• Atenție la diacritice: 'ș' nu se află între 'a' și 'z', deci verificările de tip 'a' <= c <= 'z' o vor ignora.",
      },
    ],
  },
  {
    chapterId: "x2",
    sections: [
      {
        title: "Matricea ca listă de liste",
        content:
          "Python nu are un tip special pentru tablouri bidimensionale; folosim o listă în care fiecare element este, la rândul lui, o listă (o linie).\n\nElementul de pe linia i și coloana j se accesează cu a[i][j]. Numărul de linii este len(a), iar numărul de coloane este len(a[0]).\n\nGândește-te la o matrice ca la o sală de cinema: rândul îți spune linia, scaunul îți spune coloana.",
        code: "sala = [\n    [1, 0, 0, 1],\n    [1, 1, 0, 0],\n    [0, 0, 0, 1],\n]\nprint(len(sala), 'rânduri,', len(sala[0]), 'locuri pe rând')\nprint(sala[1][0])     # 1 → locul 0 de pe rândul 1 e ocupat",
      },
      {
        title: "Crearea corectă a unei matrice",
        content:
          "Aceasta este capcana numărul 1 la matrice. Expresia [[0] * m] * n pare corectă, dar creează n referințe către ACEEAȘI linie. Modifici un element și se schimbă toată coloana!\n\nVarianta corectă folosește list comprehension, care construiește o linie nouă la fiecare pas:\n[[0] * m for _ in range(n)]\n\nRegula de reținut: înmulțirea unei liste cu un număr e sigură doar dacă elementele sunt numere, șiruri sau alte valori imutabile.",
        code: "gresit = [[0] * 3] * 2\ngresit[0][0] = 7\nprint(gresit)     # [[7, 0, 0], [7, 0, 0]]  ← surpriză!\n\ncorect = [[0] * 3 for _ in range(2)]\ncorect[0][0] = 7\nprint(corect)     # [[7, 0, 0], [0, 0, 0]]",
      },
      {
        title: "Citirea și afișarea",
        content:
          "De obicei, pe prima linie se dau dimensiunile, apoi fiecare linie a matricei pe câte un rând. Citim o linie cu input().split() și transformăm valorile în numere.\n\nPentru afișare, ' '.join(map(str, linie)) produce un rând curat, fără paranteze și virgule.",
        code: "n, m = map(int, input().split())\na = [list(map(int, input().split())) for _ in range(n)]\n\nfor linie in a:\n    print(' '.join(map(str, linie)))",
      },
      {
        title: "Parcurgeri pe linii și pe coloane",
        content:
          "Parcurgerea standard merge linie cu linie: bucla exterioară după i, cea interioară după j.\n\nPentru a lucra pe coloane, inversezi buclele: întâi j, apoi i. Așa poți calcula, de exemplu, media fiecărei materii dintr-un catalog în care liniile sunt elevi și coloanele sunt materii.\n\nFuncția zip(*a) oferă un mod elegant de a obține coloanele direct.",
        code: "catalog = [\n    [9, 7, 10],   # elevul 1: mate, info, fizică\n    [8, 10, 9],\n    [10, 9, 6],\n]\nmaterii = ['mate', 'info', 'fizică']\nfor j in range(len(materii)):\n    s = sum(catalog[i][j] for i in range(len(catalog)))\n    print(f'{materii[j]}: {s / len(catalog):.2f}')\n\n# Același lucru, cu zip:\nfor nume, col in zip(materii, zip(*catalog)):\n    print(nume, max(col))",
      },
      {
        title: "Matrice pătratice și diagonale",
        content:
          "Când n = m, matricea are două diagonale importante:\n• diagonala principală: elementele cu i == j\n• diagonala secundară: elementele cu i + j == n - 1\n\nCu aceste două relații poți descrie toate zonele clasice:\n• deasupra diagonalei principale: i < j\n• sub diagonala principală: i > j\n• deasupra diagonalei secundare: i + j < n - 1\n\nNu trebuie să memorezi zonele pe de rost: desenează o matrice 4×4, scrie lângă fiecare căsuță perechea (i, j) și verifică relația.",
        code: "n = 4\na = [[i * n + j + 1 for j in range(n)] for i in range(n)]\n# 1  2  3  4\n# 5  6  7  8\n# 9 10 11 12\n# 13 14 15 16\n\nprincipala = [a[i][i] for i in range(n)]\nsecundara = [a[i][n - 1 - i] for i in range(n)]\nprint(principala)   # [1, 6, 11, 16]\nprint(secundara)    # [4, 7, 10, 13]\n\nsus = sum(a[i][j] for i in range(n) for j in range(n) if i < j)\nprint(sus)          # 2+3+4+7+8+12 = 36",
      },
      {
        title: "Vecinii unei celule",
        content:
          "Multe probleme (jocuri pe tablă, hărți, labirinturi) cer să te uiți la vecinii unei celule. Folosim doi vectori de deplasare: dl pentru linie și dc pentru coloană.\n\nÎnainte de a accesa un vecin, verifică mereu că rămâi în interiorul matricei: 0 <= ni < n și 0 <= nj < m. Altfel, un indice -1 nu dă eroare în Python, ci te trimite tăcut la ultima linie — un bug greu de găsit.",
        code: "harta = [\n    '.#..',\n    '..*.',\n    '#...',\n]\nn, m = len(harta), len(harta[0])\ndl = [-1, 1, 0, 0]\ndc = [0, 0, -1, 1]\n\ni, j = 1, 2     # poziția comorii '*'\nfor k in range(4):\n    ni, nj = i + dl[k], j + dc[k]\n    if 0 <= ni < n and 0 <= nj < m:\n        print((ni, nj), harta[ni][nj])",
      },
      {
        title: "Capcane frecvente",
        content:
          "• Nu crea matrice cu [[0]*m]*n (vezi secțiunea 2).\n• a[i][j] ≠ a[j][i]: primul indice este întotdeauna linia.\n• Copierea cu b = a nu copiază nimic — ambele nume arată spre aceeași matrice. Folosește b = [linie[:] for linie in a].\n• Indicii negativi nu dau eroare, deci verifică singur limitele când cauți vecini.",
      },
    ],
  },
  {
    chapterId: "x3",
    sections: [
      {
        title: "De ce mai avem nevoie de alte structuri?",
        content:
          "Lista este universală, dar nu e mereu cea mai potrivită. Python ne oferă încă trei structuri, fiecare cu un rol clar:\n\n• tuple — o grupare fixă de valori care nu trebuie modificată (coordonate, dată calendaristică)\n• dict — o asociere cheie → valoare (nume → telefon, cuvânt → frecvență)\n• set — o colecție de elemente unice, fără ordine (participanți distincți)\n\nAlegerea structurii potrivite face codul mai scurt, mai clar și, adesea, mult mai rapid.",
      },
      {
        title: "Tupluri și despachetare",
        content:
          "Un tuplu se scrie cu paranteze rotunde și, ca șirurile, este imutabil. Tocmai de aceea poate fi folosit ca cheie într-un dicționar, lucru imposibil pentru o listă.\n\nCea mai utilă proprietate este despachetarea: poți atribui mai multe variabile deodată. Interschimbarea a două variabile devine a, b = b, a — fără variabilă auxiliară.\n\nO funcție care pare să „întoarcă mai multe valori” întoarce, de fapt, un tuplu.",
        code: "def min_max(lista):\n    return min(lista), max(lista)\n\nmic, mare = min_max([7, 3, 9, 1])\nprint(mic, mare)         # 1 9\n\na, b = 5, 8\na, b = b, a\nprint(a, b)              # 8 5\n\npunct = (3, -2)\nx, y = punct",
      },
      {
        title: "Dicționare: cheie → valoare",
        content:
          "Un dicționar asociază fiecărei chei o valoare. Cheile sunt unice și trebuie să fie imutabile (numere, șiruri, tupluri).\n\nOperații de bază:\n• d[cheie] = valoare — adaugă sau modifică\n• d[cheie] — citește (eroare KeyError dacă nu există)\n• d.get(cheie, implicit) — citește în siguranță\n• cheie in d — verifică existența\n• del d[cheie] — șterge\n\nParcurgerea cu for cheie, valoare in d.items() îți dă ambele valori la fiecare pas.",
        code: "orar = {'luni': 'info', 'marți': 'mate', 'miercuri': 'fizică'}\norar['joi'] = 'chimie'\nprint(orar.get('vineri', 'liber'))   # liber\n\nfor zi, materie in orar.items():\n    print(f'{zi:>9}: {materie}')",
      },
      {
        title: "Numărarea frecvențelor cu dicționare",
        content:
          "În clasa a IX-a ai numărat frecvențe cu un vector de tipul f[x] += 1. Metoda merge doar pentru valori mici, pozitive. Dicționarul rezolvă problema pentru orice fel de valori: cuvinte, numere uriașe, numere negative.\n\nModulul collections conține clasa Counter, care face exact acest lucru într-o singură linie și are și metoda most_common().",
        code: "text = 'mere pere mere prune mere pere'\nfrecv = {}\nfor cuv in text.split():\n    frecv[cuv] = frecv.get(cuv, 0) + 1\nprint(frecv)   # {'mere': 3, 'pere': 2, 'prune': 1}\n\nfrom collections import Counter\nprint(Counter(text.split()).most_common(1))   # [('mere', 3)]",
      },
      {
        title: "Mulțimi și operații cu mulțimi",
        content:
          "Un set păstrează fiecare element o singură dată. Transformarea set(lista) elimină instant duplicatele.\n\nOperațiile matematice cunoscute au operatori dedicați:\n• a | b — reuniunea\n• a & b — intersecția\n• a - b — diferența\n• a ^ b — elementele care apar în exact una dintre mulțimi\n\nAtenție: mulțimea vidă se scrie set(), nu {} — acoladele goale creează un dicționar.",
        code: "club_robotica = {'Ana', 'Radu', 'Ioana', 'Vlad'}\nclub_sah = {'Radu', 'Maria', 'Vlad'}\n\nprint(club_robotica & club_sah)   # la ambele cluburi\nprint(club_robotica - club_sah)   # doar la robotică\nprint(len(club_robotica | club_sah), 'elevi în total')",
      },
      {
        title: "Eficiența: de ce contează alegerea",
        content:
          "Să verifici dacă un element se află într-o listă (x in lista) înseamnă să o parcurgi — complexitate O(n). În set și dict, aceeași verificare durează în medie O(1), pentru că elementele sunt așezate după o funcție de dispersie (hash).\n\nPentru 100.000 de căutări într-o listă de 100.000 de elemente diferența este între câteva minute și o fracțiune de secundă.\n\nRegula practică: dacă faci des căutări de tipul „există?”, folosește un set; dacă trebuie să asociezi informații, folosește un dict.",
        code: "import time\nvalori = list(range(200_000))\ncautari = range(0, 200_000, 50)\n\nt = time.time()\nsum(1 for x in cautari if x in valori)\nprint('listă:', round(time.time() - t, 3), 's')\n\nmultime = set(valori)\nt = time.time()\nsum(1 for x in cautari if x in multime)\nprint('set:  ', round(time.time() - t, 3), 's')",
      },
    ],
  },
  {
    chapterId: "x4",
    sections: [
      {
        title: "Ideea recursivității",
        content:
          "O funcție recursivă este o funcție care se apelează pe ea însăși, pe o variantă mai mică a aceleiași probleme.\n\nOrice funcție recursivă corectă are două părți:\n1. Cazul de bază — situația atât de simplă încât răspunsul se știe direct, fără alt apel.\n2. Pasul recursiv — reducem problema la una mai mică și ne bazăm pe faptul că funcția știe deja să o rezolve.\n\nImaginează-ți o coadă la cantină: ca să afli pe ce loc ești, îl întrebi pe cel din fața ta pe ce loc este și adaugi 1. Primul din coadă (cazul de bază) știe că e pe locul 1.",
        code: "def loc_in_coada(persoane_in_fata):\n    if persoane_in_fata == 0:       # cazul de bază\n        return 1\n    return loc_in_coada(persoane_in_fata - 1) + 1\n\nprint(loc_in_coada(6))   # 7",
      },
      {
        title: "Stiva de apeluri",
        content:
          "Fiecare apel își primește propriul spațiu de memorie, cu propriile variabile, pus deasupra celorlalte într-o stivă. Apelurile se „deschid” unul peste altul până la cazul de bază, apoi se „închid” în ordine inversă, fiecare folosind rezultatul celui de deasupra.\n\nDe aceea, instrucțiunile scrise DUPĂ apelul recursiv se execută la întoarcere, în ordine inversă. Exemplul de mai jos afișează cifrele unui număr de la stânga la dreapta, deși le extragem de la dreapta.\n\nPython limitează adâncimea stivei (implicit ~1000 de apeluri). O recursivitate fără caz de bază dă eroarea RecursionError.",
        code: "def afiseaza_cifre(n):\n    if n < 10:\n        print(n, end=' ')\n        return\n    afiseaza_cifre(n // 10)     # întâi restul numărului\n    print(n % 10, end=' ')      # apoi ultima cifră, la întoarcere\n\nafiseaza_cifre(2026)   # 2 0 2 6",
      },
      {
        title: "Exemple clasice pe numere",
        content:
          "Mulți algoritmi din clasa a IX-a au o formulare recursivă foarte naturală:\n\n• suma cifrelor: s(n) = n % 10 + s(n // 10), cu s(0) = 0\n• puterea: a^n = a · a^(n-1), cu a^0 = 1\n• CMMDC (Euclid): cmmdc(a, b) = cmmdc(b, a % b), cu cmmdc(a, 0) = a\n\nCând scrii o astfel de formulă, întreabă-te mereu: argumentul scade sigur spre cazul de bază?",
        code: "def suma_cifre(n):\n    return 0 if n == 0 else n % 10 + suma_cifre(n // 10)\n\ndef cmmdc(a, b):\n    return a if b == 0 else cmmdc(b, a % b)\n\nprint(suma_cifre(4096))   # 19\nprint(cmmdc(84, 36))      # 12",
      },
      {
        title: "Recursivitate pe liste și șiruri",
        content:
          "Și o listă se poate gândi recursiv: este fie goală (cazul de bază), fie formată dintr-un prim element urmat de restul listei.\n\nAstfel, maximul unei liste este maximul dintre primul element și maximul restului. Un șir este palindrom dacă primul și ultimul caracter coincid și interiorul este, la rândul lui, palindrom.",
        code: "def palindrom(s):\n    if len(s) <= 1:\n        return True\n    return s[0] == s[-1] and palindrom(s[1:-1])\n\ndef maxim(lst):\n    if len(lst) == 1:\n        return lst[0]\n    rest = maxim(lst[1:])\n    return lst[0] if lst[0] > rest else rest\n\nprint(palindrom('capac'), palindrom('casa'))   # True False\nprint(maxim([4, 17, 2, 9]))                    # 17",
      },
      {
        title: "Capcana Fibonacci și memoizarea",
        content:
          "Formula fib(n) = fib(n-1) + fib(n-2) este corectă, dar varianta recursivă directă recalculează aceleași valori de foarte multe ori. Pentru n = 35 se fac aproape 30 de milioane de apeluri!\n\nSoluția se numește memoizare: păstrăm rezultatele deja calculate într-un dicționar și le refolosim. Python oferă decoratorul @lru_cache, care face asta automat.\n\nAceastă idee — să nu rezolvi de două ori aceeași subproblemă — stă la baza programării dinamice din clasa a XI-a.",
        code: "from functools import lru_cache\n\n@lru_cache(maxsize=None)\ndef fib(n):\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nprint(fib(90))   # 2880067194370816120 — instant",
      },
      {
        title: "Recursiv sau iterativ?",
        content:
          "Orice algoritm recursiv poate fi scris și cu bucle. Cum alegi?\n\n• Recursivitatea e potrivită când problema are o structură „în trepte” naturală: arbori, generări, Divide et Impera, backtracking.\n• Varianta iterativă e de preferat pentru prelucrări simple, liniare (suma cifrelor, factorial), pentru că nu consumă stiva și e puțin mai rapidă.\n\nLa examene, scrie mereu cazul de bază primul — așa nu-l uiți.",
      },
    ],
  },
  {
    chapterId: "xi1",
    sections: [
      {
        title: "Metoda Greedy: alegerea cea mai bună acum",
        content:
          "Un algoritm Greedy (lacom) construiește soluția pas cu pas și, la fiecare pas, face alegerea care pare cea mai bună în acel moment, fără să mai revină asupra ei.\n\nAvantajul: este simplu și foarte rapid (de obicei O(n log n), din cauza unei sortări).\nDezavantajul: nu garantează soluția optimă pentru orice problemă. Funcționează doar acolo unde se poate demonstra că alegerile locale bune duc la o soluție globală bună.",
      },
      {
        title: "Exemplu: cât mai multe activități",
        content:
          "Ai o singură sală și mai multe cereri de rezervare, fiecare cu oră de început și de sfârșit. Vrei să accepți cât mai multe, fără suprapuneri.\n\nIdeea greedy corectă: alege mereu activitatea care se TERMINĂ cel mai devreme. Astfel, lași cât mai mult timp liber pentru restul.\n\nSortarea după ora de sfârșit + o singură parcurgere = soluție optimă.",
        code: "cereri = [('cerc robotică', 9, 11), ('ședință', 10, 12),\n          ('meditații', 11, 13), ('club șah', 12, 14), ('film', 13, 16)]\ncereri.sort(key=lambda c: c[2])\n\nales, ultimul_final = [], 0\nfor nume, start, final in cereri:\n    if start >= ultimul_final:\n        ales.append(nume)\n        ultimul_final = final\nprint(ales)   # ['cerc robotică', 'meditații', 'film']",
      },
      {
        title: "Când Greedy greșește",
        content:
          "Să dăm rest cu cât mai puține monede, luând mereu cea mai mare monedă posibilă. Pentru monedele românești (50, 10, 5, 1 bani) metoda funcționează.\n\nDar pentru un sistem inventat, cu monede de 1, 3 și 4, pentru suma 6 greedy alege 4 + 1 + 1 (trei monede), deși 3 + 3 (două monede) e mai bine.\n\nLecția: înainte să folosești greedy, caută un contraexemplu. Dacă găsești unul, ai nevoie de altă tehnică — de exemplu, programare dinamică.",
        code: "def rest_greedy(suma, monede):\n    folosite = []\n    for m in sorted(monede, reverse=True):\n        while suma >= m:\n            suma -= m\n            folosite.append(m)\n    return folosite\n\nprint(rest_greedy(68, [50, 10, 5, 1]))   # [50, 10, 5, 1, 1, 1] — optim\nprint(rest_greedy(6, [1, 3, 4]))          # [4, 1, 1] — NU e optim",
      },
      {
        title: "Divide et Impera: împarte și stăpânește",
        content:
          "Divide et Impera rezolvă o problemă în trei etape:\n1. Divide — împarte problema în subprobleme mai mici, de același tip.\n2. Stăpânește — rezolvă subproblemele (recursiv), până devin banale.\n3. Combină — unește rezultatele parțiale în soluția finală.\n\nDiferența față de recursivitatea simplă: problema se împarte de obicei în două jumătăți, nu se scade doar cu 1. De aici vin complexitățile logaritmice.",
        code: "def maxim_di(a, st, dr):\n    if st == dr:                         # o singură valoare\n        return a[st]\n    mij = (st + dr) // 2\n    m1 = maxim_di(a, st, mij)            # jumătatea stângă\n    m2 = maxim_di(a, mij + 1, dr)        # jumătatea dreaptă\n    return max(m1, m2)                   # combinare\n\nv = [12, 5, 31, 8, 19, 2]\nprint(maxim_di(v, 0, len(v) - 1))   # 31",
      },
      {
        title: "Căutarea binară",
        content:
          "Într-o listă SORTATĂ, nu are rost să verifici elementele pe rând. Te uiți la mijloc: dacă valoarea căutată e mai mică, ignori jumătatea dreaptă, altfel pe cea stângă.\n\nLa fiecare pas spațiul de căutare se înjumătățește, deci pentru un milion de elemente ajung aproximativ 20 de comparații — complexitate O(log n).\n\nE ca jocul „ghicește numărul de la 1 la 100” în care afli doar „mai mare” sau „mai mic”.",
        code: "def cauta(a, x):\n    st, dr = 0, len(a) - 1\n    pasi = 0\n    while st <= dr:\n        pasi += 1\n        mij = (st + dr) // 2\n        if a[mij] == x:\n            return mij, pasi\n        if a[mij] < x:\n            st = mij + 1\n        else:\n            dr = mij - 1\n    return -1, pasi\n\nnumere = list(range(0, 2_000_000, 2))\nprint(cauta(numere, 1_234_566))   # găsit în ~20 de pași",
      },
      {
        title: "Sortarea prin interclasare (Merge Sort)",
        content:
          "Merge Sort este exemplul clasic de Divide et Impera:\n• împarte lista în două jumătăți;\n• sortează fiecare jumătate recursiv;\n• interclasează cele două jumătăți sortate, comparând mereu primele elemente rămase.\n\nComplexitatea este O(n log n) în orice caz — mult mai bună decât O(n²) al sortărilor prin selecție sau al metodei bulelor, învățate în clasa a IX-a.",
        code: "def interclaseaza(a, b):\n    rez, i, j = [], 0, 0\n    while i < len(a) and j < len(b):\n        if a[i] <= b[j]:\n            rez.append(a[i]); i += 1\n        else:\n            rez.append(b[j]); j += 1\n    return rez + a[i:] + b[j:]\n\ndef merge_sort(v):\n    if len(v) <= 1:\n        return v\n    mij = len(v) // 2\n    return interclaseaza(merge_sort(v[:mij]), merge_sort(v[mij:]))\n\nprint(merge_sort([38, 4, 27, 15, 2, 41, 9]))",
      },
    ],
  },
  {
    chapterId: "xi2",
    sections: [
      {
        title: "Backtracking: încearcă, verifică, revino",
        content:
          "Backtracking este metoda prin care generăm TOATE soluțiile unei probleme, construindu-le element cu element.\n\nLa fiecare pas punem o valoare pe poziția curentă și verificăm dacă soluția parțială mai are șanse (condiția de continuare). Dacă da, mergem mai departe; dacă nu, ștergem valoarea și încercăm următoarea. Când nu mai avem ce încerca, ne întoarcem un pas înapoi.\n\nSeamănă cu ieșirea dintr-un labirint: la fiecare intersecție alegi un drum, iar când dai de un zid te întorci la ultima intersecție.",
      },
      {
        title: "Schema generală",
        content:
          "Aproape toate problemele de backtracking urmează același șablon. Se schimbă doar:\n• mulțimea valorilor încercate pe fiecare poziție;\n• condiția de continuare (valid);\n• momentul în care soluția este completă.\n\nDupă ce înveți schema, permutările, aranjamentele, combinările sau problemele de plasare devin variații ale aceluiași cod.",
        code: "def bkt(k):\n    if solutie_completa(k):\n        prelucreaza()\n        return\n    for valoare in candidati(k):\n        sol.append(valoare)\n        if valid(k):\n            bkt(k + 1)\n        sol.pop()          # revenire (pasul „back”)",
      },
      {
        title: "Exemplu: echipe de proiect (combinări)",
        content:
          "Din 5 elevi trebuie formate toate echipele posibile de câte 3. Ordinea nu contează, deci ca să nu obținem aceeași echipă de mai multe ori impunem ca indicii să fie crescători: fiecare elev ales are indicele mai mare decât precedentul.\n\nNumărul de echipe este C(5, 3) = 10.",
        code: "elevi = ['Ana', 'Bogdan', 'Cora', 'Dan', 'Eva']\nk = 3\nsol = []\n\ndef echipe(start):\n    if len(sol) == k:\n        print([elevi[i] for i in sol])\n        return\n    for i in range(start, len(elevi)):\n        sol.append(i)\n        echipe(i + 1)\n        sol.pop()\n\nechipe(0)",
      },
      {
        title: "Exemplu: parole din cifre distincte (permutări)",
        content:
          "Vrem toate codurile care folosesc o singură dată fiecare dintre cifrele 1, 2, 3. Condiția de continuare: cifra aleasă nu a mai fost folosită.\n\nPentru a verifica rapid, ținem un vector folosit[]. Rezultatul are 3! = 6 coduri. Pentru 10 cifre am avea 3.628.800 — de aceea backtracking-ul se folosește doar pentru date mici sau cu condiții care taie mult din căutare.",
        code: "cifre = [1, 2, 3]\nfolosit = [False] * len(cifre)\nsol = []\n\ndef perm():\n    if len(sol) == len(cifre):\n        print(''.join(map(str, sol)))\n        return\n    for i, c in enumerate(cifre):\n        if not folosit[i]:\n            folosit[i] = True\n            sol.append(c)\n            perm()\n            sol.pop()\n            folosit[i] = False\n\nperm()",
      },
      {
        title: "Programarea dinamică: subprobleme refolosite",
        content:
          "Programarea dinamică se aplică problemelor de optim în care aceleași subprobleme apar de multe ori. În loc să le recalculăm, le rezolvăm o singură dată și păstrăm rezultatele într-un tablou.\n\nEtapele:\n1. Definește starea: ce înseamnă dp[i]?\n2. Găsește relația de recurență: cum se obține dp[i] din valori mai mici?\n3. Stabilește cazurile inițiale.\n4. Calculează în ordinea corectă (de jos în sus).\n\nExemplu: un robot urcă o scară cu n trepte, câte 1 sau 2 deodată. În câte moduri ajunge sus? Pe treapta i poate veni doar de pe i-1 sau de pe i-2, deci dp[i] = dp[i-1] + dp[i-2].",
        code: "def moduri_scara(n):\n    dp = [0] * (n + 1)\n    dp[0] = 1\n    for i in range(1, n + 1):\n        dp[i] = dp[i - 1] + (dp[i - 2] if i >= 2 else 0)\n    return dp[n]\n\nprint(moduri_scara(10))   # 89",
      },
      {
        title: "Rest cu număr minim de monede (rezolvat corect)",
        content:
          "Să revenim la exemplul în care greedy greșea: monede 1, 3, 4 și suma 6.\n\nStarea: dp[s] = numărul minim de monede pentru suma s.\nRecurența: dp[s] = 1 + min(dp[s - m]) pentru fiecare monedă m ≤ s.\nInițial: dp[0] = 0.\n\nAlgoritmul verifică toate variantele, dar fiecare sumă intermediară este calculată o singură dată. Complexitatea este O(suma × numărul de monede).",
        code: "def rest_minim(suma, monede):\n    INF = float('inf')\n    dp = [0] + [INF] * suma\n    for s in range(1, suma + 1):\n        for m in monede:\n            if m <= s and dp[s - m] + 1 < dp[s]:\n                dp[s] = dp[s - m] + 1\n    return dp[suma]\n\nprint(rest_minim(6, [1, 3, 4]))     # 2  (3 + 3)\nprint(rest_minim(68, [1, 5, 10, 50]))  # 6",
      },
      {
        title: "Cum alegi tehnica potrivită",
        content:
          "• Trebuie generate TOATE soluțiile sau datele sunt mici? → Backtracking.\n• Problema se împarte în bucăți independente, de același tip? → Divide et Impera.\n• Se cere un optim, iar o alegere locală evidentă e demonstrabil corectă? → Greedy.\n• Se cere un optim sau un număr de moduri, iar subproblemele se repetă? → Programare dinamică.\n\nUn sfat de examen: dacă nu ești sigur că greedy e corect, încearcă să-l spargi cu un contraexemplu mic, ca la monedele 1, 3, 4.",
      },
    ],
  },
];
