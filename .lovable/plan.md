

## Plan: Reordonare taburi clasament + selecție liceu inline

### Modificări în `LeaderboardPage.tsx`

1. **Ordinea taburilor**: Liceu → Oraș → Național (inversăm ordinea butoanelor din header)

2. **Tab implicit**: `useState<Tab>("school")` în loc de `"national"`

3. **Selecție liceu inline**: Când `!userSchool` și tab-ul este `"school"` sau `"city"`, în loc de mesajul text curent, afișez componenta `SchoolOnboarding` (sau o variantă simplificată cu search + selecție) direct în pagină, cu un mesaj „Alege liceul tău pentru a vedea clasamentul"

4. **După selecție**: Refresh local al `userSchool` și re-fetch queries

### Fișier modificat

| Fișier | Ce |
|--------|-----|
| `src/pages/LeaderboardPage.tsx` | Reordonare taburi, tab default „school", inline school picker când lipsește selecția |

