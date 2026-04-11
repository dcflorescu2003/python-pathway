

## Plan: Streak funcțional + notificări zilnice motivaționale

### Problema actuală
Streak-ul se calculează doar la completarea unei lecții. Dacă un utilizator nu face nimic o zi, streak-ul nu se resetează la 0 până nu completează o lecție nouă (moment în care se setează la 1). Deci pe UI apare un streak vechi, incorect.

### Modificări

**1. Reset streak la încărcare (`src/hooks/useProgress.ts`)**
- După merge-ul progresului (atât local cât și cloud), verifică dacă `lastActivityDate` este azi sau ieri
- Dacă nu e niciunul, setează `streak = 0` și sincronizează cu cloud-ul
- Aplică aceeași logică și pentru utilizatorii neautentificați (la `loadLocalProgress`)

**2. Edge function programată: `send-streak-reminder` (`supabase/functions/send-streak-reminder/index.ts`)**
- Funcție care rulează zilnic (via pg_cron, seara la ~19:00)
- Selectează utilizatorii cu `last_activity_date = ieri` (au streak activ dar nu au fost activi azi)
- Inserează o notificare motivațională în tabelul `notifications` pentru fiecare
- Mesaje variate: „Seria ta de {streak} zile e în pericol! 🔥", „Nu lăsa flacăra să se stingă!", etc.
- Trimite și push notification prin funcția `send-push` existentă pentru utilizatorii cu device tokens

**3. Configurare pg_cron**
- Activare extensii `pg_cron` și `pg_net`
- Creare job cron care apelează funcția zilnic la ora 19:00

### Detalii tehnice

```typescript
// useProgress.ts - la încărcarea progresului
function checkStreakExpiry(p: UserProgress): UserProgress {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  
  if (p.lastActivityDate !== today && p.lastActivityDate !== yesterdayStr) {
    return { ...p, streak: 0 };
  }
  return p;
}
```

```typescript
// send-streak-reminder edge function
// 1. Query profiles where last_activity_date = yesterday AND streak > 0
// 2. Pick random motivational message
// 3. Insert into notifications table
// 4. Optionally call send-push for native push
```

### Fișiere modificate/create
- `src/hooks/useProgress.ts` — adăugare verificare streak la load
- `supabase/functions/send-streak-reminder/index.ts` — funcție nouă
- Migrare DB: activare pg_cron + pg_net
- Insert SQL: creare job cron (non-migration, via insert tool)

