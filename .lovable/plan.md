

## Plan: Query separat pentru poziția utilizatorului în clasament

### Problema
Cu 200+ utilizatori, userul curent poate să nu fie în primele 200 de rezultate, deci nu i se poate calcula poziția. Fetch-ul a 200 de rânduri e ineficient și insuficient la scală.

### Soluție

**Modificare `LeaderboardPage.tsx`:**

1. **Query principal** — rămâne `.limit(15)` (nu mai avem nevoie de 200, luăm doar top 15 pentru afișare).

2. **Query separat pentru userul curent** — un al doilea `useQuery` care:
   - Fetch-ează profilul userului curent (XP, streak, avatar, school_id, nickname)
   - Numără câți utilizatori au XP strict mai mare decât userul → `rank = count + 1`
   - Pentru tab-urile „Oraș" și „Liceu", filtrez count-ul după `school_id` corespunzător

3. **Logica de afișare** — dacă userul nu apare în top 15 (compară `user_id`), afișez separatorul `• • •` și rândul userului cu rangul calculat.

### Implementare query rang

```typescript
// Query 1: Top 15
const { data: top15 } = useQuery({
  queryKey: ["leaderboard-top", tab, userSchool],
  queryFn: async () => {
    let query = supabase
      .from("profiles")
      .select("user_id, display_name, nickname, xp, streak, avatar_url, school_id")
      .order("xp", { ascending: false })
      .limit(15);
    // Filtrare pe school/city dacă e cazul
    if (tab === "school" && userSchool) query = query.eq("school_id", userSchool);
    if (tab === "city" && citySchoolIds.length > 0) query = query.in("school_id", citySchoolIds);
    const { data } = await query;
    return data;
  }
});

// Query 2: Profilul + rangul userului curent
const { data: userRankData } = useQuery({
  queryKey: ["leaderboard-user-rank", tab, userSchool, user?.id],
  enabled: !!user,
  queryFn: async () => {
    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, display_name, nickname, xp, streak, avatar_url, school_id")
      .eq("user_id", user.id)
      .single();
    if (!profile) return null;

    // Count users with more XP (applying same filters)
    let countQuery = supabase
      .from("profiles")
      .select("user_id", { count: "exact", head: true })
      .gt("xp", profile.xp);
    if (tab === "school" && userSchool) countQuery = countQuery.eq("school_id", userSchool);
    if (tab === "city" && citySchoolIds.length > 0) countQuery = countQuery.in("school_id", citySchoolIds);
    const { count } = await countQuery;

    return { ...profile, rank: (count || 0) + 1 };
  }
});
```

### Fișier modificat

| Fișier | Ce |
|--------|-----|
| `LeaderboardPage.tsx` | Split în 2 queries: top 15 filtrat + rang user separat |

