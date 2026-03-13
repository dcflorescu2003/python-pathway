

# Secțiune de Probleme cu Executare Cod Python

## Concept
O nouă pagină "Probleme" accesibilă din navigarea de jos, unde utilizatorii văd o cerință, scriu cod Python într-un editor, îl rulează contra unor teste predefinite și primesc un punctaj.

## Executarea codului Python în browser
Vom folosi **Pyodide** — Python compilat în WebAssembly, rulează 100% în browser, fără server. Suportă `input()` simulat, `print()`, și toate funcțiile standard Python.

### Cum funcționează testele
- Fiecare problemă are test cases cu input/output așteptat
- Pyodide rulează codul utilizatorului cu fiecare input de test
- Se captează `stdout` și se compară cu output-ul așteptat
- Se afișează scor: "3/5 teste trecute"

## Structură tehnică

### Fișiere noi
- **`src/data/problems.ts`** — lista de probleme cu cerință, test cases (input/output), punctaj, dificultate
- **`src/pages/ProblemsPage.tsx`** — lista de probleme (card-uri cu titlu, dificultate, punctaj)
- **`src/pages/ProblemSolvePage.tsx`** — pagina de rezolvare: cerință + editor cod + buton Rulează + rezultate teste
- **`src/components/CodeEditor.tsx`** — textarea stilizată cu font monospace pentru scrierea codului
- **`src/hooks/usePyodide.ts`** — hook pentru încărcarea și rularea Pyodide

### Fișiere modificate
- **`src/App.tsx`** — rute noi `/problems` și `/problem/:problemId`, adaugă `/problems` la `MAIN_PAGES`
- **`src/components/layout/BottomNav.tsx`** — adaugă tab "Probleme" cu icon `Code`

### Structura unei probleme
```ts
interface Problem {
  id: string;
  title: string;
  description: string; // cerința (markdown/text)
  difficulty: "ușor" | "mediu" | "greu";
  xpReward: number;
  testCases: { input: string; expectedOutput: string; hidden?: boolean }[];
  hint?: string;
}
```

### Fluxul utilizatorului
1. Navighează la "Probleme" din bara de jos
2. Vede lista de probleme cu dificultate și punctaj
3. Alege o problemă → vede cerința și un editor de cod
4. Scrie codul Python, apasă "Rulează teste"
5. Pyodide execută codul cu fiecare test case
6. Vede rezultatele: ✅/❌ per test, punctaj total
7. La rezolvare completă primește XP

### Dependență nouă
- `pyodide` se încarcă de pe CDN (`cdn.jsdelivr.net/pyodide/`), ~10MB la prima încărcare, apoi cache-uit de browser. Nu e nevoie de `npm install`.

### Securitate
- Pyodide rulează sandboxed în browser, nu poate accesa sistemul de fișiere sau rețeaua
- Timeout de 10 secunde per test case pentru a preveni bucle infinite

