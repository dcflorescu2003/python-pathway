// Teorie publică pentru clasele a X-a și a XI-a (doar web, secțiunea /invata).
// Conținut original PyRo — exemple și explicații scrise de noi.
// Păstrat separat de chapterTheory.ts ca să nu apară în aplicația mobilă.
import type { ChapterTheory } from "./chapterTheory";
import { extraTheories } from "./extraTheory";

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
  {
    chapterId: "xi3",
    sections: [
      {
        title: "Ce este un graf",
        content:
          "Un graf neorientat G = (V, E) este format dintr-o mulțime finită și nevidă V de vârfuri (noduri) și o mulțime E de muchii. O muchie este o pereche NEORDONATĂ de vârfuri distincte, notată [x, y]: [x, y] și [y, x] reprezintă aceeași muchie.\n\nÎn programa de liceu lucrăm cu grafuri simple: fără bucle (muchii de la un vârf la el însuși) și fără muchii multiple între aceleași două vârfuri. Notăm de obicei n = numărul de vârfuri și m = numărul de muchii, iar vârfurile cu 1, 2, …, n.\n\nDacă există muchia [x, y], spunem că x și y sunt adiacente, iar muchia este incidentă cu fiecare dintre ele.\n\nUn graf simplu cu n vârfuri are cel mult n(n − 1)/2 muchii. Graful care le are pe toate se numește graf complet și se notează Kn.\n\nExemple din viața reală: rețeaua de prietenii dintr-o clasă, străzile cu dublu sens dintre intersecții, conexiunile dintre calculatoarele unei rețele.",
      },
      {
        title: "Gradul unui vârf",
        content:
          "Gradul unui vârf x, notat d(x), este numărul muchiilor incidente cu x (adică numărul vecinilor săi, într-un graf simplu).\n\n• Un vârf cu gradul 0 se numește vârf izolat.\n• Un vârf cu gradul 1 se numește vârf terminal.\n\nProprietate fundamentală: suma gradelor tuturor vârfurilor este 2m. Motivul: fiecare muchie [x, y] se numără de două ori — o dată la gradul lui x și o dată la gradul lui y.\n\nConsecință: numărul vârfurilor cu grad impar este întotdeauna PAR. De exemplu, nu poate exista un grup de 5 elevi în care fiecare să aibă exact 3 prieteni în grup, pentru că suma gradelor ar fi 15, un număr impar.",
        code: "n = 5\nmuchii = [(1, 2), (1, 3), (2, 3), (3, 4)]\n\ngrad = [0] * (n + 1)          # folosim pozițiile 1..n\nfor x, y in muchii:\n    grad[x] += 1\n    grad[y] += 1\n\nfor v in range(1, n + 1):\n    print(f'd({v}) = {grad[v]}')\n\nprint('Suma gradelor:', sum(grad))      # 8\nprint('2 * m =', 2 * len(muchii))       # 8\nprint('Izolate:', [v for v in range(1, n + 1) if grad[v] == 0])  # [5]",
      },
      {
        title: "Reprezentarea prin matrice de adiacență",
        content:
          "Matricea de adiacență este o matrice pătratică a cu n linii și n coloane, în care a[i][j] = 1 dacă există muchia [i, j] și 0 în caz contrar.\n\nPentru un graf neorientat matricea este simetrică față de diagonala principală (a[i][j] = a[j][i]), iar diagonala principală conține doar 0, pentru că nu avem bucle. Gradul vârfului i este suma elementelor de pe linia i.\n\nAvantaj: verifici în timp constant dacă două vârfuri sunt adiacente. Dezavantaj: ocupă memorie proporțională cu n², chiar dacă graful are foarte puține muchii.\n\nÎn Python lăsăm linia și coloana 0 nefolosite, ca să lucrăm cu vârfurile 1..n la fel ca în manual.",
        code: "n = 4\nmuchii = [(1, 2), (1, 3), (2, 3), (3, 4)]\n\na = [[0] * (n + 1) for _ in range(n + 1)]\nfor x, y in muchii:\n    a[x][y] = 1\n    a[y][x] = 1      # graf neorientat: simetrie\n\nfor i in range(1, n + 1):\n    print(*a[i][1:])\n\nprint('Gradul lui 3:', sum(a[3]))          # 3\nprint('Sunt 2 și 4 adiacente?', a[2][4] == 1)  # False",
      },
      {
        title: "Reprezentarea prin liste de adiacență",
        content:
          "Pentru fiecare vârf păstrăm lista vecinilor săi. În Python, cea mai simplă variantă este o listă de liste: vecini[x] conține toate vârfurile adiacente cu x.\n\nMemoria folosită este proporțională cu n + m (fiecare muchie apare în exact două liste), deci reprezentarea este potrivită pentru grafuri mari cu puține muchii. Gradul vârfului x este chiar len(vecini[x]).\n\nO a treia variantă este lista muchiilor: păstrăm doar perechile (x, y). Este forma în care graful apare de obicei în fișierele de intrare, iar din ea construim una dintre celelalte două reprezentări.",
        code: "n = 6\nmuchii = [(1, 2), (1, 3), (2, 4), (3, 4), (5, 6)]\n\nvecini = [[] for _ in range(n + 1)]\nfor x, y in muchii:\n    vecini[x].append(y)\n    vecini[y].append(x)\n\nfor v in range(1, n + 1):\n    print(v, '->', vecini[v], ' grad =', len(vecini[v]))",
      },
      {
        title: "Lanțuri, cicluri și conexitate",
        content:
          "Un lanț este o succesiune de vârfuri x1, x2, …, xk în care oricare două vârfuri consecutive sunt adiacente. Lungimea lanțului este numărul de muchii, adică k − 1.\n\n• Lanț elementar: toate vârfurile sunt distincte.\n• Lanț simplu: toate muchiile sunt distincte (un vârf se poate repeta).\nOrice lanț elementar este și simplu, dar invers nu.\n\nUn ciclu este un lanț simplu în care primul și ultimul vârf coincid. Ciclul este elementar dacă, în afară de capete, vârfurile sunt distincte. Un ciclu elementar într-un graf simplu are cel puțin 3 vârfuri distincte.\n\nUn graf este conex dacă între oricare două vârfuri există cel puțin un lanț. O componentă conexă este un subgraf conex maximal — „o bucată” a grafului care nu mai poate fi extinsă. Graful din exemplul anterior are două componente conexe: {1, 2, 3, 4} și {5, 6}.",
      },
      {
        title: "Parcurgerea în lățime (BFS)",
        content:
          "Parcurgerea în lățime (Breadth-First Search) pornește dintr-un vârf de start și vizitează mai întâi toți vecinii lui, apoi vecinii vecinilor și așa mai departe — „în valuri”, ca cercurile de pe apă.\n\nFolosim o coadă: scoatem vârful din față și adăugăm la final vecinii nevizitați. În Python, collections.deque face ambele operații în timp constant (lista obișnuită cu pop(0) este lentă).\n\nProprietate importantă: într-un graf neorientat fără costuri pe muchii, BFS găsește distanța minimă (numărul minim de muchii) de la start la fiecare vârf.\n\nComplexitatea, cu liste de adiacență, este O(n + m).",
        code: "from collections import deque\n\nn = 7\nmuchii = [(1, 2), (1, 3), (2, 4), (3, 4), (4, 5), (6, 7)]\nvecini = [[] for _ in range(n + 1)]\nfor x, y in muchii:\n    vecini[x].append(y)\n    vecini[y].append(x)\n\ndef bfs(start):\n    dist = [-1] * (n + 1)      # -1 = nevizitat\n    dist[start] = 0\n    coada = deque([start])\n    ordine = []\n    while coada:\n        x = coada.popleft()\n        ordine.append(x)\n        for y in vecini[x]:\n            if dist[y] == -1:\n                dist[y] = dist[x] + 1\n                coada.append(y)\n    return ordine, dist\n\nordine, dist = bfs(1)\nprint('Ordinea vizitării:', ordine)   # [1, 2, 3, 4, 5]\nprint('Distanța de la 1 la 5:', dist[5])  # 3\nprint('Se ajunge din 1 în 6?', dist[6] != -1)  # False",
      },
      {
        title: "Parcurgerea în adâncime (DFS) și componentele conexe",
        content:
          "Parcurgerea în adâncime (Depth-First Search) merge cât mai departe pe un drum, iar când nu mai are vecini nevizitați se întoarce la vârful anterior. Se scrie natural recursiv; stiva apelurilor ține minte drumul de întoarcere.\n\nComplexitatea este tot O(n + m).\n\nAplicație clasică: numărarea componentelor conexe. Pornim un DFS din fiecare vârf încă nevizitat; fiecare pornire nouă descoperă o componentă nouă. Graful este conex dacă și numai dacă obținem exact o componentă.\n\nAtenție: pentru grafuri foarte mari, recursivitatea poate depăși limita implicită din Python (aproximativ 1000 de apeluri). În astfel de cazuri se folosește o stivă explicită sau BFS.",
        code: "n = 7\nmuchii = [(1, 2), (1, 3), (2, 4), (3, 4), (4, 5), (6, 7)]\nvecini = [[] for _ in range(n + 1)]\nfor x, y in muchii:\n    vecini[x].append(y)\n    vecini[y].append(x)\n\nvizitat = [False] * (n + 1)\n\ndef dfs(x, componenta):\n    vizitat[x] = True\n    componenta.append(x)\n    for y in vecini[x]:\n        if not vizitat[y]:\n            dfs(y, componenta)\n\ncomponente = []\nfor v in range(1, n + 1):\n    if not vizitat[v]:\n        comp = []\n        dfs(v, comp)\n        componente.append(comp)\n\nprint('Componente conexe:', componente)  # [[1, 2, 4, 3, 5], [6, 7]]\nprint('Graful este conex?', len(componente) == 1)  # False",
      },
      {
        title: "Grafuri orientate",
        content:
          "Într-un graf orientat, legăturile se numesc arce și sunt perechi ORDONATE (x, y): arcul pleacă din x (extremitatea inițială) și ajunge în y (extremitatea finală). Arcul (x, y) este diferit de (y, x). Exemplu: urmăritorii pe o rețea socială — dacă tu urmărești pe cineva, nu înseamnă că și el te urmărește.\n\n• Gradul exterior d⁺(x) = numărul arcelor care pleacă din x.\n• Gradul interior d⁻(x) = numărul arcelor care intră în x.\nSuma gradelor exterioare este egală cu suma gradelor interioare și ambele sunt egale cu m, numărul de arce.\n\nMatricea de adiacență nu mai este, în general, simetrică. Corespondentul lanțului este drumul (arcele se parcurg în sensul lor), iar al ciclului este circuitul.\n\nUn graf orientat este tare conex dacă pentru oricare două vârfuri x și y există drum atât de la x la y, cât și de la y la x.",
        code: "n = 4\narce = [(1, 2), (2, 3), (3, 1), (3, 4)]\n\ngrad_ext = [0] * (n + 1)\ngrad_int = [0] * (n + 1)\nfor x, y in arce:\n    grad_ext[x] += 1\n    grad_int[y] += 1\n\nfor v in range(1, n + 1):\n    print(f'{v}: d+ = {grad_ext[v]}, d- = {grad_int[v]}')\n\nprint(sum(grad_ext), sum(grad_int), len(arce))  # 4 4 4",
      },
      {
        title: "Capcane frecvente",
        content:
          "• La grafuri neorientate, când citești muchia (x, y), adaug-o în AMBELE liste de adiacență sau în ambele poziții ale matricei. Uitarea simetriei este cea mai frecventă greșeală.\n• Nu crea matricea cu [[0] * (n + 1)] * (n + 1): toate liniile ar fi aceeași listă, iar modificarea uneia le modifică pe toate.\n• În BFS marchează vârful ca vizitat în momentul în care îl adaugi în coadă, nu când îl scoți; altfel același vârf poate intra de mai multe ori în coadă.\n• Nu confunda lungimea unui lanț (număr de muchii) cu numărul de vârfuri de pe lanț.\n• Ordinea în care BFS și DFS vizitează vecinii depinde de ordinea din listele de adiacență; la examen, dacă se cere ordinea, se respectă de obicei ordinea crescătoare a vârfurilor.",
      },
    ],
  },
  {
    chapterId: "xi4",
    sections: [
      {
        title: "Ce este un arbore",
        content:
          "Un arbore este un graf neorientat conex și fără cicluri (aciclic).\n\nPentru un graf neorientat cu n vârfuri, următoarele afirmații sunt echivalente — oricare dintre ele poate fi folosită ca definiție:\n1. G este conex și aciclic.\n2. G este conex și are exact n − 1 muchii.\n3. G este aciclic și are exact n − 1 muchii.\n4. Între oricare două vârfuri ale lui G există un lanț elementar UNIC.\n\nConsecințe utile: dacă ștergi o muchie dintr-un arbore, acesta nu mai este conex; dacă adaugi o muchie nouă, se formează exact un ciclu.\n\nUn graf aciclic, nu neapărat conex, se numește pădure: fiecare componentă conexă a lui este un arbore.",
        code: "def este_arbore(n, muchii):\n    if len(muchii) != n - 1:\n        return False\n    vecini = [[] for _ in range(n + 1)]\n    for x, y in muchii:\n        vecini[x].append(y)\n        vecini[y].append(x)\n    vizitat = [False] * (n + 1)\n    stiva = [1]\n    vizitat[1] = True\n    while stiva:\n        x = stiva.pop()\n        for y in vecini[x]:\n            if not vizitat[y]:\n                vizitat[y] = True\n                stiva.append(y)\n    return all(vizitat[1:])    # n - 1 muchii + conex => arbore\n\nprint(este_arbore(5, [(1, 2), (1, 3), (3, 4), (3, 5)]))  # True\nprint(este_arbore(5, [(1, 2), (2, 3), (3, 1), (4, 5)]))  # False",
      },
      {
        title: "Arbori cu rădăcină: vocabular",
        content:
          "Dacă alegem un vârf al arborelui ca rădăcină, toate celelalte vârfuri se așază pe niveluri, „atârnând” de ea. Pentru fiecare vârf x diferit de rădăcină există un lanț unic de la rădăcină la x.\n\n• Tatăl (părintele) lui x este vârful de dinaintea lui x pe acest lanț. Rădăcina este singurul vârf fără tată.\n• Fiii lui x sunt vârfurile al căror tată este x. Vârfurile care au același tată se numesc frați.\n• Ascendenții lui x sunt vârfurile de pe lanțul de la rădăcină la x (fără x); descendenții sunt vârfurile din subarborele lui x.\n• O frunză este un vârf fără fii.\n• Adâncimea (nivelul) unui vârf este numărul de muchii de la rădăcină până la el; rădăcina are adâncimea 0.\n• Înălțimea arborelui este adâncimea maximă a unui vârf.\n\nAtenție: unele manuale numerotează nivelurile începând de la 1. Citește cu grijă convenția din enunț înainte de a răspunde.",
      },
      {
        title: "Reprezentarea prin vectorul de tați",
        content:
          "Cea mai folosită reprezentare la liceu: un vector tata în care tata[x] este tatăl vârfului x, iar pentru rădăcină tata[r] = 0.\n\nDin acest vector se obțin rapid:\n• rădăcina — singurul x cu tata[x] = 0;\n• fiii lui x — toate vârfurile i cu tata[i] = x;\n• frunzele — vârfurile care NU apar ca valoare în vector (nu sunt tatăl nimănui);\n• lanțul de la x la rădăcină — urcăm repetat x = tata[x] până ajungem la 0.\n\nUn arbore cu n vârfuri are exact n − 1 muchii, câte una între fiecare vârf (în afară de rădăcină) și tatăl său.",
        code: "#        1  2  3  4  5  6  7\ntata = [None, 0, 1, 1, 2, 2, 3, 6]   # poziția 0 nefolosită\nn = 7\n\nradacina = [x for x in range(1, n + 1) if tata[x] == 0][0]\nprint('Rădăcina:', radacina)                          # 1\nprint('Fiii lui 2:', [i for i in range(1, n + 1) if tata[i] == 2])  # [4, 5]\n\nparinti = set(tata[1:])\nprint('Frunze:', [x for x in range(1, n + 1) if x not in parinti])  # [4, 5, 7]\n\ndef lant_spre_radacina(x):\n    lant = []\n    while x != 0:\n        lant.append(x)\n        x = tata[x]\n    return lant\n\nprint('De la 7 la rădăcină:', lant_spre_radacina(7))  # [7, 6, 3, 1]\nprint('Adâncimea lui 7:', len(lant_spre_radacina(7)) - 1)  # 3",
      },
      {
        title: "Arbori binari",
        content:
          "Un arbore binar este un arbore cu rădăcină în care fiecare vârf are cel mult doi fii, iar fiii se deosebesc între ei: fiul stâng și fiul drept. Un vârf cu un singur fiu stâng este diferit de unul cu un singur fiu drept.\n\nCâteva proprietăți (cu nivelurile numerotate de la 0):\n• pe nivelul k există cel mult 2ᵏ vârfuri;\n• un arbore binar de înălțime h are cel mult 2ʰ⁺¹ − 1 vârfuri;\n• un arbore binar plin (toate nivelurile complet ocupate) de înălțime h are exact 2ʰ⁺¹ − 1 vârfuri și 2ʰ frunze.\n\nÎn Python, cel mai clar mod de a reprezenta un arbore binar este cu o clasă mică, Nod, care ține valoarea și legăturile către cei doi fii (None dacă fiul lipsește).",
        code: "class Nod:\n    def __init__(self, val, st=None, dr=None):\n        self.val = val\n        self.st = st\n        self.dr = dr\n\n#        8\n#       / \\\n#      3   10\n#     / \\    \\\n#    1   6    14\nrad = Nod(8, Nod(3, Nod(1), Nod(6)), Nod(10, None, Nod(14)))\n\ndef inaltime(nod):\n    if nod is None:\n        return -1          # arborele vid; o frunză va avea înălțimea 0\n    return 1 + max(inaltime(nod.st), inaltime(nod.dr))\n\ndef numar_noduri(nod):\n    if nod is None:\n        return 0\n    return 1 + numar_noduri(nod.st) + numar_noduri(nod.dr)\n\nprint('Înălțime:', inaltime(rad))         # 2\nprint('Noduri:', numar_noduri(rad))       # 6",
      },
      {
        title: "Parcurgerile RSD, SRD, SDR",
        content:
          "Un arbore binar se parcurge recursiv în trei moduri clasice; diferă doar momentul în care prelucrăm rădăcina subarborelui curent:\n\n• Preordine (RSD): Rădăcină, apoi subarborele Stâng, apoi cel Drept.\n• Inordine (SRD): subarborele Stâng, Rădăcină, subarborele Drept.\n• Postordine (SDR): subarborele Stâng, subarborele Drept, apoi Rădăcina.\n\nTruc de memorare: litera R arată poziția rădăcinii, iar S este mereu înaintea lui D.\n\nPostordinea este utilă când un vârf are nevoie de rezultatele fiilor (de exemplu calculul înălțimii sau evaluarea unei expresii aritmetice reprezentate ca arbore).",
        code: "class Nod:\n    def __init__(self, val, st=None, dr=None):\n        self.val, self.st, self.dr = val, st, dr\n\nrad = Nod(8, Nod(3, Nod(1), Nod(6)), Nod(10, None, Nod(14)))\n\ndef rsd(n, rez):\n    if n:\n        rez.append(n.val); rsd(n.st, rez); rsd(n.dr, rez)\n    return rez\n\ndef srd(n, rez):\n    if n:\n        srd(n.st, rez); rez.append(n.val); srd(n.dr, rez)\n    return rez\n\ndef sdr(n, rez):\n    if n:\n        sdr(n.st, rez); sdr(n.dr, rez); rez.append(n.val)\n    return rez\n\nprint('RSD:', rsd(rad, []))   # [8, 3, 1, 6, 10, 14]\nprint('SRD:', srd(rad, []))   # [1, 3, 6, 8, 10, 14]\nprint('SDR:', sdr(rad, []))   # [1, 6, 3, 14, 10, 8]",
      },
      {
        title: "Arbori binari de căutare",
        content:
          "Un arbore binar de căutare (ABC, în engleză BST) este un arbore binar în care, pentru fiecare vârf cu valoarea v:\n• toate valorile din subarborele stâng sunt mai mici decât v;\n• toate valorile din subarborele drept sunt mai mari decât v.\n(Aici presupunem valori distincte.)\n\nAtenție: nu este suficient ca fiecare vârf să fie mai mare decât fiul stâng și mai mic decât fiul drept — condiția privește ÎNTREGUL subarbore.\n\nConsecințe:\n• parcurgerea în inordine (SRD) afișează valorile în ordine crescătoare — arborele din exemplul anterior este un ABC, iar SRD a dat [1, 3, 6, 8, 10, 14];\n• căutarea unei valori coboară pe un singur drum, deci face cel mult h + 1 comparații, unde h este înălțimea. Dacă arborele este echilibrat, h este aproximativ log₂ n; dacă valorile sunt inserate deja sortate, arborele degenerează într-un „lanț” și h = n − 1.",
        code: "class Nod:\n    def __init__(self, val):\n        self.val, self.st, self.dr = val, None, None\n\ndef insereaza(rad, val):\n    if rad is None:\n        return Nod(val)\n    if val < rad.val:\n        rad.st = insereaza(rad.st, val)\n    elif val > rad.val:\n        rad.dr = insereaza(rad.dr, val)\n    return rad                    # valorile duplicate sunt ignorate\n\ndef cauta(rad, val):\n    while rad is not None and rad.val != val:\n        rad = rad.st if val < rad.val else rad.dr\n    return rad is not None\n\ndef srd(n, rez):\n    if n:\n        srd(n.st, rez); rez.append(n.val); srd(n.dr, rez)\n    return rez\n\nrad = None\nfor x in [50, 30, 70, 20, 40, 60, 80]:\n    rad = insereaza(rad, x)\n\nprint(srd(rad, []))       # [20, 30, 40, 50, 60, 70, 80]\nprint(cauta(rad, 60))     # True\nprint(cauta(rad, 65))     # False",
      },
      {
        title: "Capcane frecvente",
        content:
          "• Nu confunda arborele (graf neorientat, conex, aciclic) cu arborele cu rădăcină: același arbore poate avea rădăcini diferite, deci vectori de tați diferiți.\n• În vectorul de tați, frunzele sunt vârfurile care nu apar ca valori, nu vârfurile cu tata[x] = 0 (acela este rădăcina).\n• Verifică întotdeauna convenția pentru niveluri și înălțime (de la 0 sau de la 1).\n• La parcurgerile recursive nu uita cazul de bază (nod is None); fără el programul se oprește cu eroare când ajunge la un fiu lipsă.\n• Un arbore binar nu este neapărat un arbore binar de căutare: proprietatea de ordonare trebuie verificată pe subarbori întregi.",
      },
    ],
  },
  {
    chapterId: "xi5",
    sections: [
      {
        title: "De ce avem nevoie de clase",
        content:
          "Până acum am lucrat cu tipuri gata făcute: int, str, list, dict. Când datele devin mai complexe, apare tentația să le ținem în liste paralele sau în tupluri: nume[i], medie[i], clasa[i]. Codul devine greu de citit, iar o greșeală de indice amestecă datele elevilor între ei.\n\nO clasă este un tip de date definit de programator, care grupează la un loc:\n• atributele — datele care descriu starea (de exemplu numele și notele unui elev);\n• metodele — funcțiile care lucrează cu aceste date (de exemplu calculul mediei).\n\nUn obiect (o instanță) este o valoare concretă creată după „șablonul” clasei. Clasa Elev este una singură, dar putem crea oricâți elevi, fiecare cu propriile date.\n\nAcest mod de organizare a programelor se numește programare orientată pe obiecte (POO).",
      },
      {
        title: "Prima clasă: constructorul și self",
        content:
          "O clasă se definește cu cuvântul cheie class. Metoda specială __init__ este apelată automat când creăm un obiect și are rolul de a-i inițializa atributele. (Tehnic, obiectul a fost deja creat înainte de __init__; această metodă doar îi stabilește starea inițială, motiv pentru care se numește corect inițializator, deși la liceu e numită frecvent și constructor.)\n\nPrimul parametru al oricărei metode obișnuite este, prin convenție, self: o referință către obiectul pentru care a fost apelată metoda. Când scriem ana.medie(), Python apelează de fapt Elev.medie(ana), deci self este ana.\n\nAtributele create cu self.nume = ... aparțin fiecărui obiect în parte (atribute de instanță).",
        code: "class Elev:\n    def __init__(self, nume, note):\n        self.nume = nume\n        self.note = list(note)    # copie, ca să nu partajăm lista primită\n\n    def medie(self):\n        if not self.note:\n            return 0\n        return sum(self.note) / len(self.note)\n\n    def adauga_nota(self, nota):\n        if not 1 <= nota <= 10:\n            raise ValueError('Nota trebuie să fie între 1 și 10')\n        self.note.append(nota)\n\nana = Elev('Ana', [9, 10])\nmihai = Elev('Mihai', [7])\nana.adauga_nota(8)\n\nprint(ana.nume, round(ana.medie(), 2))   # Ana 9.0\nprint(mihai.nume, mihai.medie())         # Mihai 7.0\nprint(Elev.medie(ana) == ana.medie())    # True",
      },
      {
        title: "Afișarea unui obiect: __str__ și __repr__",
        content:
          "Dacă afișăm direct un obiect, Python arată ceva de forma <__main__.Elev object at 0x...>, adică tipul și o adresă — puțin util.\n\nMetodele speciale („dunder”, de la double underscore) ne permit să controlăm acest comportament:\n• __str__ întoarce textul prietenos folosit de print() și str();\n• __repr__ întoarce o reprezentare destinată programatorului, ideal una din care s-ar putea recrea obiectul. Este folosită, de exemplu, când afișăm o listă de obiecte.\n\nAmbele trebuie să întoarcă (return) un șir de caractere, nu să-l afișeze.",
        code: "class Punct:\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y\n\n    def __str__(self):\n        return f'({self.x}, {self.y})'\n\n    def __repr__(self):\n        return f'Punct({self.x}, {self.y})'\n\n    def distanta(self, alt):\n        return ((self.x - alt.x) ** 2 + (self.y - alt.y) ** 2) ** 0.5\n\nA = Punct(0, 0)\nB = Punct(3, 4)\nprint(A, B)              # (0, 0) (3, 4)\nprint([A, B])            # [Punct(0, 0), Punct(3, 4)]\nprint(A.distanta(B))     # 5.0",
      },
      {
        title: "Atribute de instanță și atribute de clasă",
        content:
          "Un atribut definit direct în corpul clasei (nu prin self) este un atribut de clasă: există o singură dată și este comun tuturor obiectelor. Un atribut creat prin self.ceva = ... este un atribut de instanță: fiecare obiect are propria valoare.\n\nAtributele de clasă sunt potrivite pentru constante sau pentru informații despre clasă în ansamblu, cum ar fi numărul de obiecte create.\n\nCapcană importantă: dacă atributul de clasă este o listă sau un dicționar și îl modifici prin append, modificarea se vede la TOATE obiectele. Datele specifice fiecărui obiect se inițializează întotdeauna în __init__.",
        code: "class Elev:\n    scoala = 'Liceul de Informatică'   # atribut de clasă (comun)\n    numar_elevi = 0\n\n    def __init__(self, nume):\n        self.nume = nume                # atribut de instanță\n        Elev.numar_elevi += 1\n\na = Elev('Ana')\nb = Elev('Dan')\nprint(a.scoala, '|', b.scoala)\nprint('Elevi creați:', Elev.numar_elevi)   # 2\n\n# Capcana listei comune\nclass Grupa:\n    membri = []                # GREȘIT: listă partajată\n    def adauga(self, x):\n        self.membri.append(x)\n\ng1, g2 = Grupa(), Grupa()\ng1.adauga('Ana')\nprint(g2.membri)               # ['Ana']  — surpriză!",
      },
      {
        title: "Încapsulare",
        content:
          "Încapsularea înseamnă că un obiect își protejează datele interne și permite modificarea lor doar prin metode care verifică validitatea.\n\nSpre deosebire de C++ sau Java, Python nu are cuvintele cheie private și public. Folosește convenții:\n• _sold (o liniuță): atribut de uz intern; programatorii înțeleg că nu trebuie folosit din afara clasei, dar Python nu îl blochează.\n• __sold (două liniuțe): Python redenumește automat atributul în _ContBancar__sold (name mangling), ceea ce îngreunează accesul accidental din afară și evită conflictele de nume la moștenire. Nici aceasta nu este o protecție absolută.\n\nDecoratorul @property permite citirea unei valori ca pe un atribut, fără a o lăsa modificată direct.",
        code: "class ContBancar:\n    def __init__(self, titular):\n        self.titular = titular\n        self.__sold = 0\n\n    @property\n    def sold(self):\n        return self.__sold\n\n    def depune(self, suma):\n        if suma <= 0:\n            raise ValueError('Suma trebuie să fie pozitivă')\n        self.__sold += suma\n\n    def retrage(self, suma):\n        if suma > self.__sold:\n            return False\n        self.__sold -= suma\n        return True\n\ncont = ContBancar('Ioana')\ncont.depune(100)\nprint(cont.retrage(30), cont.sold)   # True 70\nprint(cont.retrage(500), cont.sold)  # False 70\n# cont.sold = 1000   -> AttributeError: nu are setter",
      },
      {
        title: "Moștenire",
        content:
          "Moștenirea permite definirea unei clase noi pe baza uneia existente. Clasa derivată (copil) preia automat atributele și metodele clasei de bază (părinte) și poate adăuga altele sau le poate redefini.\n\nSintaxa: class Profesor(Persoana). Relația potrivită pentru moștenire este „este un/o”: un profesor ESTE o persoană.\n\nÎn __init__-ul clasei copil, super().__init__(...) apelează inițializatorul părintelui, ca să nu duplicăm codul.\n\nDacă o clasă copil definește o metodă cu același nume ca în părinte, versiunea copilului o înlocuiește (suprascriere). Astfel, obiecte de tipuri diferite pot răspunde diferit la același apel — idee numită polimorfism.",
        code: "class Persoana:\n    def __init__(self, nume):\n        self.nume = nume\n\n    def prezentare(self):\n        return f'Sunt {self.nume}.'\n\nclass Profesor(Persoana):\n    def __init__(self, nume, materie):\n        super().__init__(nume)\n        self.materie = materie\n\n    def prezentare(self):          # suprascriere\n        return f'Sunt {self.nume} și predau {self.materie}.'\n\noameni = [Persoana('Ana'), Profesor('Popescu', 'informatică')]\nfor o in oameni:\n    print(o.prezentare())\n\nprint(isinstance(oameni[1], Persoana))   # True",
      },
      {
        title: "Exemplu complet: clasa Fractie",
        content:
          "Reunim totul într-un tip numeric propriu. O fracție se păstrează mereu în formă ireductibilă, cu numitorul pozitiv: la creare împărțim numărătorul și numitorul la CMMDC-ul lor.\n\nDefinind metoda specială __add__, operatorul + funcționează direct între două fracții, iar __eq__ permite compararea cu ==.\n\n(Python are deja în biblioteca standard modulul fractions; aici construim versiunea noastră ca exercițiu de POO.)",
        code: "from math import gcd\n\nclass Fractie:\n    def __init__(self, a, b):\n        if b == 0:\n            raise ZeroDivisionError('Numitorul nu poate fi 0')\n        if b < 0:\n            a, b = -a, -b\n        d = gcd(a, b)\n        self.a = a // d\n        self.b = b // d\n\n    def __add__(self, alta):\n        return Fractie(self.a * alta.b + alta.a * self.b, self.b * alta.b)\n\n    def __mul__(self, alta):\n        return Fractie(self.a * alta.a, self.b * alta.b)\n\n    def __eq__(self, alta):\n        return self.a == alta.a and self.b == alta.b\n\n    def __str__(self):\n        return f'{self.a}/{self.b}'\n\nx = Fractie(1, 6)\ny = Fractie(1, 3)\nprint(x + y)                          # 1/2\nprint(Fractie(4, -8))                 # -1/2\nprint(x * y)                          # 1/18\nprint(Fractie(2, 4) == Fractie(1, 2)) # True",
      },
      {
        title: "Capcane frecvente",
        content:
          "• Uitarea lui self: o metodă definită ca def medie(): va produce eroare la apelul ana.medie(), pentru că Python transmite automat obiectul ca prim argument.\n• Scrierea nume = nume în loc de self.nume = nume în __init__ creează doar o variabilă locală, iar obiectul rămâne fără atribut.\n• Liste sau dicționare ca atribute de clasă, modificate pe loc — sunt partajate de toate obiectele.\n• __init__ nu trebuie să întoarcă o valoare (în afară de None).\n• __str__ trebuie să întoarcă un șir de caractere; dacă folosește print în loc de return, apare eroare.",
      },
    ],
  },
  ...extraTheories,
];
