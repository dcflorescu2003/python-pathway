

## Plan: Actualizare scor și streak la reluarea provocărilor

### Problema identificată

**Pentru probleme (`ProblemSolvePage.tsx`)**: La linia 76, condiția `if (passed === total && !solved)` face ca `completeLesson` să fie apelat **doar la prima rezolvare**. La redo, se apelează doar `recordActivity()` — care actualizează streak-ul dar **nu actualizează scorul**.

### Modificări

**`src/pages/ProblemSolvePage.tsx`** — Schimb logica de la linia 76-84:
- Când toate testele trec și problema e deja rezolvată, apelez `completeLesson` cu scorul 100 (în loc de doar `recordActivity`), astfel încât scorul se actualizează în DB
- `completeLesson` deja gestionează intern streak-ul și dă doar 3 XP la redo, deci nu se pierde nimic

Cod nou:
```typescript
if (passed === total) {
  completeLesson(`problem-${problem.id}`, problem.xpReward, 100);
  if (solved) {
    toast.success("Toate testele au trecut! ✅");
  } else {
    toast.success(`Felicitări! Ai câștigat ${problem.xpReward} XP! 🎉`);
  }
} else {
  toast.error(`${passed}/${total} teste trecute`);
}
```

### Fișier modificat

| Fișier | Ce |
|--------|-----|
| `src/pages/ProblemSolvePage.tsx` | `completeLesson` apelat și la redo pentru a actualiza scorul și streak-ul |

