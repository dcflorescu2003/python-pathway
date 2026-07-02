## Obiectiv

Ajungem la 100% real în profilul de competențe prin tag-uirea explicită a fiecărei microcompetențe pe exerciții din capitolele corecte. Merg CS cu CS; pentru fiecare îți listez micro-urile, tu îmi dai capitolele, eu fac inserările în `item_competencies`.

## Capitole disponibile

```text
ch-1778012338147  Prelucrări numerice   (45 lecții)
ch1               Recapitulare & Fundamente (35)
ch3               Liste – Organizare    (32)
ch4               Generare și Sortare   (25)
ch5               Funcții și POO        (31)
ch6               Fișiere și Interfețe  (24)
```

Când îmi zici „la capitolele X, Y", tag-uiesc micro respectiv pe **toate exercițiile** din lecțiile acelor capitole care se potrivesc tematic (sau, dacă preferi, pe *toate* exercițiile din capitol — spune-mi care variantă). Confirmă și `weight`-ul implicit (propun `1.0`).

## Ordinea propusă (prioritate CS fără micro / cu acoperire slabă)

**Runda 1 — CS goale (adăugăm micro-uri noi + le tag-uim):**

1. **CS 1.2 — Identifică algoritmi specializați** (0 micro)
2. **CS 2.1 — Explică organizarea datelor** (0 micro)
3. **CS 2.2 — Explică etapele algoritmilor** (0 micro)
4. **CS 4.4 — Analizează elementele de limbaj** (0 micro)
5. **CS 4.5 — Analizează subprogramele** (0 micro)
6. **CS 5.1 — Argumentează alegerea modelelor de date** (0 micro)
7. **CS 5.3 — Evaluează algoritmi modulari** (0 micro)
8. **CS 5.5 — Evaluează programe cu subprograme** (0 micro)

Pentru fiecare din acestea, îți propun 1–3 micro-uri noi cu titlu; tu confirmi textul și îmi dai capitolele. Placeholder-ele M101–M108 pot fi înlocuite/redenumite.

**Runda 2 — CS cu un singur micro (fragile):**

9. CS 1.5 (M82), CS 2.5 (M87), CS 3.3 (M9), CS 4.2 (M80), CS 6.3 (M90), CS 6.5 (M83)

**Runda 3 — CS cu acoperire slabă pe micro-uri cheie** (ex. M6, M10, M14, M4, M11 — sub 12 taguri fiecare).

**Runda 4** — restul, pentru densitate uniformă.

## Cum lucrăm concret (o rundă = un mesaj)

Eu:

> **CS 1.2 — Identifică algoritmi specializați.** Propun 2 micro-uri:
>
> - M101: „Recunoaște un algoritm de prelucrare de cifre (sumă, oglindit, prim etc.)."
> - M102: „Recunoaște un algoritm clasic pe listă (sumă/min/max, căutare, sortare)."
> La ce capitole le tag-uim?

Tu:

> M101 → ch-1778012338147; M102 → ch3, ch4

Eu:

> Aplicat. Continuăm cu CS 2.1?

## Detalii tehnice

- Modific `microcompetencies` doar prin `supabase--migration` (INSERT + trigger recalc dacă e cazul).
- Tag-urile intră în `item_competencies (item_type, item_id, microcompetency_id, weight, created_by)` cu `item_type='exercise'` (lecții) și, dacă vrei și pentru probleme/test-items, îmi zici.
- După fiecare rundă, recalculez scorurile userului tău (`backfill_competency_scores`) ca să vezi impactul imediat.

## Întrebări de confirmat înainte de start

1. Tag-uim pe **toate exercițiile** din capitolele indicate, sau vrei să selectez doar exercițiile cu cuvinte-cheie potrivite (ex. „listă", „prim")?
2. `weight = 1.0` pentru toate, sau vrei ponderare (ex. 0.5 când e tangențial)?
3. Includem și `problems` / `predefined_test_items` sau doar `exercises` (lecțiile)?

Dacă răspunzi la cele 3 întrebări (sau spui „mergi cu default: toate exercițiile, weight 1, doar exercises"), pornesc cu **CS 1.2**.  
  
1. Nu alegem sa zicem maxim 20-30% din exercitii din 30% din lectiile din capitolele pe care le indic pentru fiecare CS. Nu trebuie sa studiez cerintele pentru a plasa microcompetentele  
2. 1  
3. includem si problemele  
