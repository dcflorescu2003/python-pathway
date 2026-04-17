

## Plan

În tabul "Clasă" din Clasament, afișez **toți** membrii clasei (nu doar top 15) sortați descrescător după XP.

### Modificări în `src/pages/LeaderboardPage.tsx`

1. La query-ul `top15`, când `tab === "class"`, scot `.limit(15)` — păstrez limita doar pentru celelalte taburi (școală/oraș/național).
2. Când `tab === "class"`, nu mai e nevoie de logica `showUserBelow` / "•••" — userul apare oricum în listă (e membru). Sar peste blocul `showUserBelow` pentru tabul Clasă.

### Fișier modificat
| Fișier | Schimbare |
|--------|-----------|
| `src/pages/LeaderboardPage.tsx` | Limită condițională în query + skip "user below" pe tab Clasă |

