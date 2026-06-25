## Context

În baza de date capitolele sunt numerotate astfel:
- **Cap 3** — „Funcții și POO" (id intern `ch5`)
- **Cap 4** — „Fișiere și Interfețe" (id intern `ch6`)

`ChapterTheoryPage` caută teoria după `chapterId`, așa că modificările se fac pe intrările `ch5` și `ch6` din `src/data/chapterTheory.ts`.

Astăzi:
- `ch5` are doar teorie despre funcții/subprograme — **fără nimic despre POO**.
- `ch6` are o singură secțiune scurtă „Introducere în Tkinter" și una „Casete text și MessageBox" — **fără Canvas, fără explicații clare despre `mainloop`, atașare de funcții la butoane etc.**

## Ce voi face

### 1. Cap 3 — adaug secțiuni POO la `ch5`
La sfârșitul listei de secțiuni `ch5` (după „Proiectare modulară"), adaug:

1. **Clase și obiecte** — definiție clasă vs. instanță, sintaxă `class`, instanțiere. Exemplu: `class Carte` cu două obiecte.
2. **Atribute și `__init__`** — atribute de instanță vs. de clasă, rolul constructorului și al lui `self`. Exemplu cu `Elev(nume, nota)`.
3. **Metode** — funcții definite în clasă, `self`, metode care returnează vs. modifică starea. Exemplu: metoda `promovat()` și o metodă `adauga_nota()`.
4. **Metode speciale (`__str__`, `__eq__`)** — pe scurt, cu exemplu de afișare prietenoasă cu `print(obiect)`.
5. **Exemplu complet** — clasă `Punct` cu `__init__`, metodă `distanta(self, alt)` și `__str__`, plus apel.

### 2. Cap 4 — extind partea de Tkinter la `ch6`
Înlocuiesc cele două secțiuni Tkinter existente și adaug mai multe, plasate după secțiunile despre fișiere. Mut secțiunea „Introducere în OOP" din `ch6` (e duplicată acum în Cap 3 unde îi e locul). Secțiunile noi:

1. **Importul Tkinter și prima fereastră** — `import tkinter as tk`, `root = tk.Tk()`, `root.title()`, `root.geometry("400x300")`, rolul lui `root.mainloop()` (buclă de evenimente — programul rămâne deschis până închizi fereastra).
2. **Label — afișarea de text** — `tk.Label(root, text=..., font=..., fg=...)`, `.pack()` vs `.grid()`. Exemplu scurt.
3. **Button și atașarea funcțiilor** — `tk.Button(root, text=..., command=functie)`. Important: se transmite **numele funcției**, fără paranteze. Exemplu cu contor care crește la click și actualizează un Label cu `.config(text=...)`.
4. **Entry — citirea textului de la utilizator** — `tk.Entry(root)`, `.get()`, `.delete(0, tk.END)`, `.insert(0, "...")`. Exemplu: input nume → afișare salut.
5. **messagebox — ferestre de dialog** — `from tkinter import messagebox`, `showinfo`, `showwarning`, `showerror`, `askyesno` (cu return True/False). Exemplu de validare formular.
6. **Canvas — desenăm forme** — `tk.Canvas(root, width=..., height=..., bg=...)`. Metode: `create_line`, `create_rectangle`, `create_oval`, `create_text`. Sistemul de coordonate (0,0 = colț stânga-sus, y crește în jos). Exemplu: desenez o față zâmbitoare (cerc + ochi + gură) sau o casă simplă.

Fiecare secțiune are explicație scurtă (2–4 rânduri) + `code` cu exemplu rulabil.

## Fișiere modificate

- `src/data/chapterTheory.ts` — singurul fișier atins. Nu sunt necesare modificări la `ChapterTheoryPage.tsx` (rezolvarea după `chapterId` funcționează deja).

## Ce NU schimb

- Nu modific lecțiile/exercițiile din DB.
- Nu modific Cap 1, 2, 5, 6 (numerele 5 și 6 din DB = Liste / Sortare).
- Nu ating logica de matching a paginii de teorie.
