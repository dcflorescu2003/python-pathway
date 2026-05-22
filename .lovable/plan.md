# Probleme cu fișiere și cod Tkinter — Capitolul 4

## Scop

Două capabilități noi la `/problems` pentru a susține capitolul 4:

1. **Verificare hibridă** — un test poate avea stdin, fișiere de intrare, fișiere de ieșire așteptate și stdout, în orice combinație.
2. **Verificare statică pentru Tkinter** — codul elevului NU se rulează, ci se inspectează (parsare Python + pattern matching) ca să confirmăm că folosește anumite construcții.

Schema actuală `test_cases` e `JSONB` în Supabase — nu e nevoie de migrație, doar extindem forma obiectului.

---

## 1) Probleme cu fișiere (hibrid stdin/stdout + files)

### Forma nouă a unui test case

```ts
type TestCase = {
  input?: string;              // stdin (ca acum)
  expectedOutput?: string;     // stdout așteptat (ca acum)
  inputFiles?: Record<string, string>;     // { "date.in": "5\n1 2 3" }
  expectedFiles?: Record<string, string>;  // { "date.out": "15" }
  hidden?: boolean;
};
```

Toate câmpurile sunt opționale. Dacă lipsesc `expectedOutput` și `expectedFiles`, testul nu are ce verifica → eroare în admin. Compatibilitate înapoi: testele vechi (doar `input` + `expectedOutput`) merg neschimbat.

### Schimbări în `src/hooks/usePyodide.ts`

Pentru fiecare test:

1. **Înainte de rulare**: scriem `inputFiles` în MEMFS cu `pyodide.FS.writeFile(name, content)`. Curățăm fișiere reziduale de la testul anterior (păstrăm o listă a fișierelor scrise).
2. **Rulăm codul** elevului ca acum (cu stdin mock + capture stdout).
3. **După rulare**: citim fiecare `expectedFiles[name]` cu `pyodide.FS.readFile(name, { encoding: "utf8" })`. Dacă fișierul nu există → fail cu „Fișierul X nu a fost creat".
4. **Comparație**: `passed = stdoutMatch && allFilesMatch`. Normalizăm `\r\n` → `\n` și trim final.
5. **Cleanup**: ștergem toate fișierele scrise/citite înainte de testul următor (`FS.unlink`).

`TestResult` primește câmpuri noi:

```ts
{
  ...,
  fileResults?: { name: string; expected: string; actual: string; passed: boolean; missing?: boolean }[];
}
```

### Schimbări în UI rezultate

`**src/pages/ProblemSolvePage.tsx**` și `**src/components/exercises/ProblemExercise.tsx**`:

- Pentru teste **vizibile** (non-hidden) cu fișiere: arată un mic bloc "📄 date.in" (intrare) și "📄 date.out" (așteptat vs primit) sub cel de stdin existent.
- Pentru teste **hidden**: la fel ca acum — doar „Test N (ascuns)" cu pass/fail, fără conținut.

### Schimbări în admin (`src/components/admin/ProblemsEditor.tsx`)

Sub fiecare test case adăugăm două secțiuni colapsabile „Fișiere intrare" și „Fișiere ieșire așteptate". Fiecare e o listă de perechi `{nume_fișier, conținut}` cu butoane add/remove. Backward compat: dacă listele sunt goale, nu se salvează.

### CSV importer (`problemsCsvParser.ts`)

Adăugăm două coloane opționale `input_files` și `expected_files` cu sintaxă:

```
date.in|5\n1 2 3,,alt.in|text
```

(fișiere separate prin `,`, nume/conținut prin `|`, `\n` literal devine newline). Dacă lipsesc — comportament identic cu azi.

---

## 2) Probleme Tkinter — verificare statică

### Tip nou de problemă

Adăugăm `kind: "execute" | "static"` (default `"execute"`) pe `Problem`. Pentru `static`, în loc de `testCases` folosim `staticChecks`:

```ts
type StaticCheck = {
  description: string;         // "Folosește un Button cu textul 'Click'"
  type: "import" | "call" | "regex" | "ast_node";
  pattern: string;             // ex: "tkinter.Button", "Button\\(.*text\\s*=\\s*['\"]Click['\"]", "Tk()"
  hidden?: boolean;
};
```

### Execuție în `usePyodide.ts`

Nu rulăm codul. Pentru fiecare check:

- **import**: parsăm cu `ast.parse(code)` în Pyodide (Python stdlib, deja inclus), căutăm `Import`/`ImportFrom` cu numele dat.
- **call**: căutăm `Call` node cu numele funcției/atributului (ex. `Button`, `mainloop`, `pack`).
- **regex**: rulează `re.search(pattern, code)`.
- **ast_node**: căutare generică de nod AST după tip.

Toate sigure — `ast.parse` nu execută cod, deci elevii nu pot strica nimic.

### UI

Componenta de afișare a rezultatelor pentru `static` problems arată:

- Lista cerințelor cu ✓/✗ în loc de teste numerotate.
- Hidden checks (cele de pe care vrem să nu se „bare" la cerință) → afișate ca „Cerință N (ascunsă)".

Butonul „Rulează teste" se schimbă în „Verifică cod" pentru `static`.

### Admin

În `ProblemsEditor.tsx`, un switch în partea de sus: **Tip: Execuție / Verificare statică**. Dacă „Verificare statică" → ascundem testCases și arătăm un editor de `staticChecks`.

---

## 3) Sumar fișiere atinse

- `src/hooks/usePyodide.ts` — MEMFS read/write, cleanup, mod static (AST).
- `src/hooks/useProblems.ts` — extindere tip `Problem`/`TestCase` cu noile câmpuri.
- `src/pages/ProblemSolvePage.tsx` — UI rezultate cu fișiere și mod static.
- `src/components/exercises/ProblemExercise.tsx` — la fel pentru probleme în lecții.
- `src/components/admin/ProblemsEditor.tsx` — editor fișiere I/O + switch static/exec + editor staticChecks.
- `src/components/admin/problemsCsvParser.ts` — coloane noi opționale `input_files`, `expected_files`, `static_checks`.

**Fără migrații SQL** — totul intră în `test_cases` JSONB existent (sau câmp nou `static_checks` ca tot JSONB; pot decide la implementare).

---

## Limite cunoscute (de comunicat în lecții)

- **Pyodide MEMFS** e izolat per session — fișierele scrise de elev nu persistă între execuții, doar între testele aceleiași rulări.
- **Tkinter NU rulează în browser**. Pentru cap. 4 elevii văd outputul vizual doar local; în PyRo verificăm că structura codului e corectă. Lecțiile teoretice și flashcards-urile rămân la fel.
- Timeout-ul de 10s se aplică și la rularea cu fișiere.  
Genereaza si cate o problema cu fisiere si tk inter la capitolul 4, care practic sa testeze tot ce am discutat noi  
