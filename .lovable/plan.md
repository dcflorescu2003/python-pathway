# Control al sugestiilor de cod (autocomplete)

## Obiectiv
- În **teste** (TakeTestPage): sugestiile de completare automată nu apar deloc.
- În **probleme** (ProblemSolvePage, ProblemExercise): un buton mic în bara editorului („Sugestii: pornit/oprit") cu care elevul oprește/pornește hinturile. Starea se păstrează în localStorage (implicit pornit).

## Modificări

### 1. `src/components/CodeEditor.tsx`
- `basicSetup` include implicit `autocompletion()`. Îl înlocuim cu configurația explicită fără autocompletion și adăugăm completarea ca extensie separată, controlată printr-un **Compartment** nou (`autocompleteCompartment`), la fel ca `editable`.
- Prop nou: `autocomplete?: boolean` (default `true`). La schimbarea valorii, se face `reconfigure` pe compartment (oprit = `[]`, pornit = `autocompletion()`).
- Buton opțional în bara de sus a editorului (lângă „main.py"): prop nou `onToggleAutocomplete?: (on: boolean) => void` + `autocompleteOn` — afișat doar când prop-ul e furnizat. Iconiță `Sparkles`/`Lightbulb`, text „Sugestii", stare vizuală activ/inactiv, min 40px touch target.

### 2. `src/pages/TakeTestPage.tsx` (2 utilizări, liniile ~1211 și ~1602)
- Se transmite `autocomplete={false}` — fără buton, fără hinturi deloc în teste.

### 3. `src/pages/ProblemSolvePage.tsx` și `src/components/exercises/ProblemExercise.tsx`
- Stare locală `autocompleteOn`, inițializată din localStorage (`pyro_code_autocomplete`, default "on"), salvată la fiecare comutare.
- Se transmit `autocomplete={autocompleteOn}` și `onToggleAutocomplete={...}` către CodeEditor → butonul apare în bara editorului.

## Detalii tehnice
- Import nou: `autocompletion` din `@codemirror/autocomplete` (deja în dependențe prin `codemirror`).
- `basicSetup` are opțiunea `autocompletion: false` — o folosim și adăugăm manual extensia prin compartment.
- Fără modificări de backend, RLS sau versiune.
- Verificare: typecheck (`tsgo`), apoi test manual în preview pe o problemă (hinturile apar, butonul le oprește) și pe un test (nu apar deloc).
