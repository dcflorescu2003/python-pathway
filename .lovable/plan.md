# Reparare cazuri de test la problemele cu liste

## Problema
La 34 de probleme (toate cu `=>` în `test_cases`), datele de intrare și ieșire au fost concatenate cu `=>` în câmpul `input`, iar `expectedOutput` a rămas gol.

Exemplu actual:
```
input: "6\n2=>48 24"
expectedOutput: ""
```

Trebuie să devină:
```
input: "6\n2"
expectedOutput: "48 24"
```

## Plan
Migrare SQL care, pentru fiecare problem cu `=>` în `test_cases`:

1. Iterează prin array-ul JSON `test_cases`.
2. Pentru fiecare caz care conține `=>` în `input`:
   - Split pe prima apariție a `=>`
   - Partea stângă (fără `\n` final extra) → `input`
   - Partea dreaptă (fără spațiu de început, păstrând `\n`-urile dacă există în output multilinie) → `expectedOutput`
3. Cazurile fără `=>` rămân neschimbate.
4. `hidden` se păstrează.

## Validare
- După migrare: `SELECT count(*) FROM problems WHERE test_cases::text LIKE '%=>%'` trebuie să fie `0`.
- Spot-check pe 2-3 probleme (ex. `gs11`, `gs20`, `gs24`) să confirm că `input` și `expectedOutput` arată corect.

## Scope
Doar tabela `problems`, doar câmpul `test_cases`. Nicio modificare în cod aplicație.
