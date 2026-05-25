## Problem

În `src/components/admin/csvParser.ts`, transformarea `convertSinglePipes` (introdusă recent pentru coloanele `option_*` și `explanation`) se aplică și pe coloana `competencies`. Astfel, o celulă de tipul `M91|M92|M93|M94` devine `M91,M92,M93,M94` înainte de parsing. Apoi `rowToExercise` împarte doar pe `;`, deci tot șirul este interpretat ca un singur cod inexistent → toast: „Coduri necunoscute: M91,M92,M93,M94, …”.

Codurile M91–M94 există în DB, deci nu e o problemă de date — e o regresie de parsing.

## Fix

În `src/components/admin/csvParser.ts`:

1. Adaugă `"competencies"` în `PIPE_SEPARATOR_COLUMNS` ca să nu mai fie afectată de `convertSinglePipes`.
2. Fă split-ul tolerant la mai multe separatoare. Înlocuiește:
   ```ts
   ex.competencies = row.competencies.split(";")...
   ```
   cu un split pe `[;,|]` urmat de `.trim().toUpperCase()` și filtru de gol. Asta acoperă atât fișierele vechi cu `|`, cât și cele noi cu `;` sau `,`.

## Verificare

- Adaugă un test scurt în `csvParser.test.ts` care confirmă că `M91|M92|M93` și `M91;M92;M93` produc același array `["M91","M92","M93"]`.
- Re-importăm fișierul utilizatorului — codurile trebuie recunoscute, fără toast „Coduri necunoscute”.

## Files

- `src/components/admin/csvParser.ts` (modificare ~5 linii)
- `src/components/admin/csvParser.test.ts` (un nou test)
