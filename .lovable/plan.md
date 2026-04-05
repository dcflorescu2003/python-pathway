

# Mini-editor Markdown pentru cartonașe

## Context
Câmpul „Explicație / Conținut" al cartonașelor este un simplu `<Textarea>`. Conținutul se renderează deja cu `ReactMarkdown`, deci orice Markdown introdus funcționează — dar utilizatorul trebuie să știe sintaxa. Vrem o bară de instrumente simplă deasupra textarea-ului care inserează Markdown automat.

## Soluția
Creăm o componentă `MarkdownToolbar` + `MarkdownEditor` care înfășoară textarea-ul existent și adaugă butoane pentru:
- **Bold** — inserează `**text**`
- **Rând liber** — inserează `\n\n`
- **Text colorat** — inserează `<span style="color:red">text</span>` (Markdown acceptă HTML inline, ReactMarkdown îl renderează)

Bara apare **doar** când tipul exercițiului este `card`.

## Fișiere modificate

### 1. `src/components/admin/MarkdownEditor.tsx` (nou)
- Componentă cu o bară de butoane (Bold, Rând liber, Culoare) și un `<Textarea>` dedesubt
- Fiecare buton inserează textul Markdown la poziția cursorului din textarea (folosind `selectionStart` / `selectionEnd`)
- Pentru culoare: un mic dropdown cu 4-5 culori predefinite (roșu, verde, albastru, portocaliu, mov)
- Preview live opțional sub textarea cu `ReactMarkdown`

### 2. `src/components/admin/ExerciseEditor.tsx`
- Import `MarkdownEditor`
- Înlocuire `<Textarea>` de la linia 378 cu `<MarkdownEditor>` doar când `data.type === "card"`
- Pentru celelalte tipuri, textarea rămâne neschimbat

