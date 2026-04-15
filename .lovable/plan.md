

## Plan: Afișare utilizator curent sub top 15 cu separator

### Problema
Dacă utilizatorul nu apare în primii 15 din clasament (național/oraș/liceu), nu are nicio indicație despre locul său.

### Soluție

**Modificare `LeaderboardPage.tsx`:**

1. **Calculez poziția reală a utilizatorului** în lista filtrată completă (nu doar top 15). Dacă userul nu e în top 15, rețin entry-ul și indexul real.

2. **După lista celor 15**, afișez:
   - Un separator vizual `• • •` (3 puncte centrate, stilizate cu `text-muted-foreground`)
   - Rândul utilizatorului cu poziția reală (ex: locul 23), evidențiat cu `border-primary bg-primary/10`

3. **Query limit**: Cresc limita de la 50 la 200+ pentru a avea șanse mai mari de a include userul. Alternativ, fac un al doilea query separat pentru poziția exactă a userului.

### Abordare query
- Păstrez query-ul principal `.limit(200)` (suficient pentru school/city)
- Pentru național, dacă userul nu e în primele 200, fac un query suplimentar care numără câți au XP mai mare decât userul curent

### Logică UI
```
Top 15 entries
─────────────
  • • •
─────────────
#47  Tu  🐍  350 XP  🔥 5d
```

### Fișier modificat

| Fișier | Ce |
|--------|-----|
| `LeaderboardPage.tsx` | Cresc limit, calculez poziția userului, afișez separator + rând dacă nu e în top 15 |

