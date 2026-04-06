

# Trei modificări: probleme premium selectabile, ordine lecții fixă, provocări cu nume

## 1. Probleme premium selectabile din Admin

**Problema**: Tabela `problems` nu are coloană `is_premium` — toate problemele sunt accesibile tuturor.

### Migrare SQL
```sql
ALTER TABLE public.problems ADD COLUMN is_premium boolean NOT NULL DEFAULT false;
```

### Fișiere modificate
- **`src/hooks/useProblems.ts`** — adaugă `isPremium: boolean` în interfața `Problem`, mapat din `p.is_premium`
- **`src/components/admin/ProblemsEditor.tsx`** — checkbox „Premium" în formularul de editare/creare problemă
- **`src/pages/ProblemsPage.tsx`** — import `useSubscription`; problemele cu `isPremium && !subscribed` afișează lacăt (🔒) și deschid `PremiumDialog` la click în loc de navigare
- **`src/pages/ProblemSolvePage.tsx`** — verificare la montare: dacă `problem.isPremium && !subscribed`, redirect la `/problems` cu toast de avertizare

## 2. Ordine lecții consistentă

**Problema**: Lecțiile noi primesc `sort_order = 0`, ceea ce face ordinea imprevizibilă.

### Fișiere modificate
- **`src/components/admin/ContentEditor.tsx`** — la crearea unei lecții noi, calculez `sort_order = max(sort_order din lecțiile capitolului) + 1` înainte de insert

## 3. Provocări cu nume și secțiune pliabilă

**Problema**: Linia 327 din `Index.tsx` afișează `c.item_id` (ID tehnic) în loc de titlul lecției/problemei. Secțiunea e mereu deschisă.

### Fișiere modificate
- **`src/hooks/useChallenges.ts`** — după fetch challenges, colectez item_id-urile separate pe tip (`lesson` / `problem`), fac query pe tabelele `lessons` și `problems` pentru titluri, și adaug `item_title` în `ActiveChallenge`
- **`src/pages/Index.tsx`** — secțiunea provocări devine pliabilă cu state `showChallenges` (default false); buton „Vezi provocări (N)" care la click desfășoară lista; afișare `c.item_title` în loc de `c.item_id`

## Verificare non-premium

Am confirmat că **în codul actual** nu există nicio verificare premium pe probleme:
- `ProblemsPage.tsx` — afișează toate problemele fără filtrare
- `ProblemSolvePage.tsx` — permite rezolvarea oricărei probleme
- Tabela `problems` nu are coloană `is_premium`

Planul adaugă această verificare atât în UI (lacăt + dialog premium pe `ProblemsPage`) cât și ca gardă pe `ProblemSolvePage` (redirect dacă nu e premium).

## Rezumat fișiere
1. Migrare SQL — coloană `is_premium` pe `problems`
2. `src/hooks/useProblems.ts`
3. `src/components/admin/ProblemsEditor.tsx`
4. `src/pages/ProblemsPage.tsx`
5. `src/pages/ProblemSolvePage.tsx`
6. `src/components/admin/ContentEditor.tsx`
7. `src/hooks/useChallenges.ts`
8. `src/pages/Index.tsx`

