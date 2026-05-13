Am verificat datele: importul chiar salvează toate cele 15 exerciții în baza de date pentru lecția CMMDC. Problema nu mai este importul, ci încărcarea listei în admin.

## Problema reală

În `useChapters`, aplicația încarcă toate exercițiile cu o singură interogare:

```text
exercises?select=*&order=sort_order.asc
```

Backend-ul returnează implicit maximum 1000 rânduri. Cum exercițiile sunt ordonate global doar după `sort_order`, lista se taie înainte să ajungă la toate exercițiile cu `sort_order` mai mare pentru unele lecții. De aceea preview-ul spune 15, baza de date are 15, dar adminul afișează 13.

## Plan de implementare

1. **Corectez încărcarea exercițiilor în `src/hooks/useChapters.ts`**
   - În loc de o singură cerere limitată implicit, voi încărca exercițiile paginat cu `.range()` până nu mai există rânduri.
   - Voi păstra sursa cloud ca autoritate, fără fallback local pe web.

2. **Sortare stabilă per lecție**
   - După ce toate exercițiile sunt încărcate, le voi grupa după `lesson_id`.
   - În fiecare lecție le voi sorta explicit după `sort_order`, apoi după `id`, ca afișarea să fie deterministă.

3. **Refetch corect după import**
   - Voi păstra invalidarea query-ului `chapters`, dar după fixul de paginare refetch-ul va primi toate exercițiile, nu doar primele 1000 globale.

4. **Verificare**
   - Voi verifica prin datele existente că lecția CMMDC are 15 exerciții în backend și că logica nouă nu mai poate pierde ultimele rânduri din cauza limitei implicite.

## Rezultat așteptat

După import, dacă preview-ul arată 15 importabile și backend-ul confirmă 15 salvate, lecția va afișa 15 exerciții în admin.