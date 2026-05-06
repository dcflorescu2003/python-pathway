# Plan: ID-uri și căutare pentru probleme

## 1. Admin → tab „Probleme" (`src/components/admin/ProblemsEditor.tsx`)
- Afișez ID-ul fiecărei probleme (font mono, mic) lângă titlu pe rândul din listă.
- Bară de search globală deasupra listei de capitole care filtrează după **ID** sau **titlu** (diacritic-insensitive prin `matchesSearch` din `src/lib/searchUtils.ts`).
- Când search-ul e activ:
  - Capitolele care conțin rezultate se auto-expand.
  - Capitolele fără match sunt ascunse.
  - Drag & drop e dezactivat (reorder are nevoie de lista completă).

## 2. Pagina publică Probleme (`src/pages/ProblemsPage.tsx`)
Bară de search sub header:
- **În lista de capitole**: caută în toate problemele după ID sau titlu; rezultatele apar într-o listă plană cu numele capitolului ca subtitlu.
- **În interiorul unui capitol**: filtrează doar problemele acelui capitol.
- ID-ul afișat sub titlu ca text mono mic (`text-[10px] text-muted-foreground`).

## 3. Detalii tehnice
- Reutilizez `matchesSearch` din `src/lib/searchUtils.ts` (gestionează deja diacriticele românești).
- Search input: `<Input>` cu icon `Search` din lucide. Filtrare client-side, fără debounce.
- Fără migrations / edge functions — totul e UI; `Problem.id` e deja disponibil.

## Fișiere modificate
- `src/components/admin/ProblemsEditor.tsx`
- `src/pages/ProblemsPage.tsx`
