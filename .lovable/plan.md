## Problemă

În `TestBuilder.tsx`, preview-ul pentru itemii de tip `truefalse` afișează doar `ex.question` (sau, ca fallback, `ex.statement` doar dacă `question` lipsește). În realitate, întrebările Adevărat/Fals au DOUĂ câmpuri separate:
- `question` — enunțul/contextul
- `statement` — afirmația care trebuie evaluată

Deci afirmația nu apare niciodată în preview (nici la cele din bancă, nici la cele publice/custom).

## Soluție

În `src/components/teacher/TestBuilder.tsx`, în `renderExercisePreview` (≈linia 264), pentru `ex.type === "truefalse"`:

1. Linia 248: păstrează `ex.question` (fără fallback la statement, pentru a evita duplicarea când e truefalse).
2. În blocul `truefalse`, renderează `ex.statement` într-un bloc evidențiat (stil similar cu `code-block` din `TrueFalseExercise.tsx`) deasupra etichetei "Adevărat / Fals".
3. Dacă există `code_template`, el deja se afișează prin condiția existentă (linia 249) — rămâne neschimbat.

```tsx
{ex.type === "truefalse" && (
  <>
    {ex.statement && (
      <div className="bg-muted/50 border border-border rounded-md p-2 text-[11px] text-foreground">
        <RichContent inline className="text-[11px]">{ex.statement}</RichContent>
      </div>
    )}
    <p className="text-[11px] text-muted-foreground">Adevărat / Fals</p>
  </>
)}
```

Pentru linia 248, schimb fallback-ul ca să nu mai cadă pe `statement` (statement-ul e acum afișat separat la truefalse):

```tsx
<RichContent className="text-sm font-medium text-foreground">
  {ex.question || (ex.type !== "truefalse" ? ex.statement : "")}
</RichContent>
```

## Fișiere modificate

- `src/components/teacher/TestBuilder.tsx` — `renderExercisePreview` (≈liniile 248 și 264-266).

## Verificare

- Preview pe un item truefalse din bancă: trebuie să apară `question` + `statement` + "Adevărat / Fals".
- Preview pe un item custom truefalse creat în Test Builder: la fel.
- Celelalte tipuri (quiz, fill, order, match) rămân neschimbate.
