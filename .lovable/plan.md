## Problem

Răspunsul acceptat este `","` (virgulă între ghilimele). În `FillExercise.tsx`, funcția `splitAlternatives` tratează virgula ca separator între variante alternative, dar **ignoră ghilimele**. Astfel `","` este împărțit în două variante: `"` și `"` (gol). Niciuna nu coincide cu ce tastează elevul (`,` sau `","`), deci răspunsul corect apare ca greșit.

Aceeași problemă apare și pentru `;` sau `|` puse între ghilimele.

## Fix

În `src/components/exercises/FillExercise.tsx`, în `splitAlternatives`:
- Pe lângă urmărirea adâncimii parantezelor (`()[]{}`), urmărim și dacă suntem în interiorul unui șir cu ghilimele (`"` sau `'`).
- Nu împărțim pe `,` / `|` / `;` când suntem între ghilimele.

Suplimentar, în `isBlankCorrect` adăugăm o normalizare tolerantă: dacă o variantă acceptată este înconjurată de ghilimele (`"..."` sau `'...'`), acceptăm și forma fără ghilimele a răspunsului elevului. Astfel atât `,` cât și `","` sunt corecte pentru un blank cu răspuns `","`.

## Technical details

```ts
// splitAlternatives: adaugă state pentru ghilimele
let quote: '"' | "'" | null = null;
for (const ch of acceptedAnswers) {
  if (quote) {
    if (ch === quote) quote = null;
    buf += ch;
    continue;
  }
  if (ch === '"' || ch === "'") { quote = ch; buf += ch; continue; }
  if (ch === '(' || ...) depth++;
  ...
  if (depth === 0 && !quote && (ch === ',' || ch === '|' || ch === ';')) {
    parts.push(buf); buf = "";
  } else buf += ch;
}
```

```ts
// isBlankCorrect: acceptă variantele și fără ghilimelele înconjurătoare
const stripQuotes = (s: string) => {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
};
const alternatives = splitAlternatives(acceptedAnswers).flatMap(a => {
  const stripped = stripQuotes(a);
  return stripped === a ? [normalize(a)] : [normalize(a), normalize(stripped)];
});
return alternatives.includes(normalize(userAnswer));
```

Schimbarea afectează doar `FillExercise.tsx` (logică de prezentare/verificare răspuns). Nicio modificare de schemă sau backend.
