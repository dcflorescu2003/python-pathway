

## Plan: Separarea ordinii pe variante + mesaj shuffle

### Modificări în `src/components/teacher/TestBuilder.tsx`

### 1. Shuffle mode — eliminare preview Nr.1/Nr.2
Secțiunea "Side-by-side variant preview" (liniile 928-983) se afișează doar dacă `variantMode === "manual"`. Dacă `variantMode === "shuffle"`, afișăm în loc un mesaj informativ: *"Elevii vor primi același test cu întrebările în ordine aleatorie."*

### 2. Variante manuale — ordine separată per variantă
Problema curentă: `reorderVariantItems` (linia 477) mută itemul în array-ul principal `items`, ceea ce afectează ambele variante dacă itemul are `variant === "both"`.

Soluția: Introducem un state separat pentru ordinea per variantă:
- `variantOrder`: `{ A: string[], B: string[] }` — arrays de chei unice (index sau id) care definesc ordinea de afișare în fiecare variantă
- La prima construire și la adăugare/ștergere de itemi, se sincronizează automat
- Drag-and-drop în Nr.1 mută doar în `variantOrder.A`, fără a afecta `variantOrder.B`
- Itemii cu `variant === "both"` apar în ambele liste dar cu ordine independentă

Concret:
- Adăugăm `variantOrderA` și `variantOrderB` ca state arrays de indici
- Recalculăm aceste arrays când `items` se schimbă (useEffect)
- `variant1Items` și `variant2Items` se derivă din aceste arrays în loc de filtrare directă
- Drag în preview Nr.1 reordonează doar `variantOrderA`; drag în Nr.2 doar `variantOrderB`
- La salvare, `sort_order` din `items` rămâne pentru lista principală; ordinea variantelor se salvează separat (sau se encodează în items)

### Fișier modificat
- `src/components/teacher/TestBuilder.tsx`

