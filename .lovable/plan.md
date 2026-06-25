## Actualizare dependențe vulnerabile

Toate cele 5 pachete au versiuni mai noi care rezolvă advisory-urile (majoritatea sunt în dependențe tranzitive precum `xmldom`, `minimatch`, `ws`, `lodash`, `picomatch`).

### Pachete de actualizat în `package.json`

| Pachet | De la | La (latest stable) | Impact |
|---|---|---|---|
| `@capacitor/cli` | 8.3.0 | 8.5.0+ | devDep, doar build Android/iOS |
| `@supabase/supabase-js` | 2.99.1 | 2.105.0+ | runtime — minor bump, fără breaking |
| `react-router-dom` | 6.30.1 | 6.31.0+ | rămâne pe v6 (nu trecem la v7 ca să evităm breaking changes) |
| `recharts` | 2.15.4 | 2.15.5+ | rămâne pe v2 |
| `vite-plugin-pwa` | 1.2.0 | 1.2.x latest | devDep, build PWA |

### Pași

1. `bun add @supabase/supabase-js@^2.105.0 react-router-dom@^6.31.0 recharts@^2.15.5`
2. `bun add -d @capacitor/cli@^8.5.0 vite-plugin-pwa@latest`
3. Verificare: build rulează, app pornește fără erori în consolă, rute funcționează, grafice (recharts) și client Supabase OK.
4. Rerun `code--dependency_scan` ca să confirm că advisory-urile high au dispărut.

### Ce NU schimb

- Nu fac upgrade major (react-router 7, recharts 3) — risc de breaking changes neasociat cu această sarcină.
- Nu modific `@capacitor/*` runtime packages (doar CLI-ul e flagged).
- Dacă vreun pachet refuză rezolvarea tranzitivă (xmldom/minimatch rămân vechi prin Capacitor CLI), accept findingul rămas ca limitare upstream și voi raporta.