

# 🐍 PyLearn – Aplicație Duolingo pentru Python (Clasa a IX-a)
**Design: Dark mode programator | Salvare: Supabase cu conturi | Exerciții: Mix complet**

---

## 🎮 Sistem de Gamification (stil Duolingo)
- **XP** (experiență) câștigat per lecție completată
- **Streak** zilnic (câte zile consecutive a învățat)
- **Vieți** (3 vieți per sesiune, se pierd la răspuns greșit)
- **Bară de progres** per lecție și per capitol
- **Profil utilizator** cu statistici și nivel

---

## 📚 Structura Capitolelor și Lecțiilor

### **Capitolul 1: Recapitulare & Fundamente**
1. **Variabile și atribuire** – tipuri de date, operatorul `=`, conversii (`int`, `float`, `str`)
2. **Structura `if/elif/else`** – condiții, operatori logici, ramificări
3. **Structura `for`** – iterare prin `range()`, parcurgere liste
4. **Structura `while`** – bucle condiționale, controlul execuției
5. **Gândire computațională** – ce este, etapele rezolvării unei probleme (analiză, proiectare, implementare, testare)
6. **Introducere în algoritmi** – pseudocod, blocuri grafice, eficiență de bază, notația O

### **Capitolul 2: Prelucrări Numerice**
1. **Operații cu cifrele unui număr** – acces la cifre, adăugare cifre la stânga/dreapta
2. **Parcurgerea cifrelor și divizorilor** – algoritmi de bază
3. **Algoritmul lui Euclid** – cmmdc cu scăderi și cu împărțiri
4. **Descompunere în factori primi**
5. **Conversii între baze de numerație** – baza 10 ↔ baza 2

### **Capitolul 3: Liste – Organizare Conceptuală**
1. **Modelul conceptual de listă** – caracteristici, acces secvențial vs direct
2. **Stiva și coada** – LIFO, FIFO, exemple practice
3. **Lista de frecvențe** – construire și utilizare
4. **Parcurgere liniară** – cu și fără memorare
5. **Clasa `list` în Python** – operatori (`[]`, `in`, `+`, `*`)
6. **Metode ale clasei `list`** – `append()`, `insert()`, `pop()`, `remove()`, `sort()`, `copy()`, `count()`, `index()`

### **Capitolul 4: Generare și Sortare**
1. **Generarea sistematică a secvențelor** – șiruri recurente, Fibonacci
2. **Sortare prin selecția minimului** – algoritm pas cu pas
3. **Sortare cu lista de frecvențe** – când și cum se aplică
4. **Metoda bulelor (Bubble Sort)** – comparare și interschimbare
5. **Compararea metodelor de sortare** – eficiență, număr de operații

### **Capitolul 5: Subprograme**
1. **Conceptul de subprogram** – `def`, parametri, corp, apel
2. **Variabile locale și globale** – domeniu de vizibilitate
3. **Transmitere parametri și returnare** – `return`, argumente
4. **Funcții predefinite matematice** – `abs()`, `round()`, `sqrt()`, `int()`
5. **Funcții predefinite pentru colecții** – `len()`, `min()`, `max()`, `sum()`
6. **Proiectare modulară** – descompunerea problemelor în module

### **Capitolul 6: Fișiere și Interfețe**
1. **Fișiere text** – `open()`, `read()`, `write()`, `close()`
2. **Citire și scriere din/în fișiere** – moduri de deschidere, sfârșit de fișier
3. **Introducere în Tkinter** – ferestre, butoane, etichete
4. **Casete text și MessageBox** – `Entry`, `Text`, `messagebox`
5. **Introducere OOP** – clasă, obiect, instanțiere, metode

---

## 🧩 Tipuri de Exerciții (per lecție, 5-8 exerciții)
- **Quiz cu variante** – „Ce afișează acest cod?", „Care este output-ul?"
- **Completează codul** – cod cu `___` pe care elevul le completează
- **Aranjează liniile** – drag & drop pentru a ordona liniile de cod corect
- **Adevărat/Fals** – afirmații despre concepte

---

## 🔐 Backend (Supabase)
- **Autentificare** – înregistrare/login cu email
- **Profil utilizator** – XP, streak, nivel, vieți
- **Progres lecții** – care lecții sunt completate, scor per lecție
- **Tabel de clasament** (leaderboard) – top utilizatori după XP

---

## 🎨 Design Dark Mode Programator
- Fundal întunecat (#1a1a2e / #0d1117)
- Syntax highlighting colorat pentru blocurile de cod
- Font monospace pentru cod (Fira Code / JetBrains Mono)
- Accente verzi/cyan pentru progres și succes
- Animații subtile la răspuns corect/greșit

