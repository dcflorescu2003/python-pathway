

# Culoare uniformă verde pentru toate perechile asociate

## Problema
Array-ul `PAIR_COLORS` atribuie culori diferite fiecărei perechi (verde doar prima, apoi alte culori). Vrei ca toate perechile selectate să fie verzi.

## Soluția
Modificare în `src/components/exercises/MatchExercise.tsx`:
- Înlocuire `PAIR_COLORS` cu o singură paletă verde (primary) folosită pentru toate perechile asociate
- `getLeftStyle` și `getRightStyle` vor aplica aceeași clasă verde (`border-primary bg-primary/10 text-primary`) pentru orice pereche din `matched`, indiferent de index

## Fișier modificat
`src/components/exercises/MatchExercise.tsx` — simplificare styling perechi

