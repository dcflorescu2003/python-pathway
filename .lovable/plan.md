## Problemă

Când profesorul folosește butonul „Duplică" pe un test predefinit din admin, itemii apar toți pe „Ambele" (Nr. 1 + Nr. 2), chiar dacă în admin fiecare item a fost atribuit explicit variantei A (Nr. 1) sau B (Nr. 2).

## Cauză

În `src/components/teacher/TestBuilder.tsx`, funcția `applyPredefinedTemplate` (liniile 441–484):

- Setează `setVariantMode(template.variant_mode)` și apoi `setItems(newItems)` cu `variant: pi.variant`.
- La nivel de date, totul pare corect: în DB tabelele `predefined_tests` au `variant_mode='manual'` pentru testele cu 2 numere, iar `predefined_test_items.variant` are valori `A`/`B` pe rândurile corespunzătoare.

Totuși mapeasem `variant: pi.variant` direct, fără un fallback explicit; și UI-ul (Selectul per item, plus previzualizarea „Nr. 1 / Nr. 2") este afișat **doar** când `variantMode === "manual"`. Există două puncte fragile:

1. Dacă `template.variant_mode` vine `null`/`undefined` (sau dacă admin-ul a salvat testul ca `"shuffle"` din greșeală deși itemii au variante distincte), `variantMode` rămâne `"shuffle"` și UI-ul ascunde Selectul de variantă; itemii apar toți într-o singură listă, ceea ce arată ca „toate sunt la ambele".
2. Pentru itemii unde `pi.variant` ar fi cumva `null`/lipsă, mapping-ul îi lasă `undefined`, iar Selectul afișează implicit „Ambele".

## Fix propus

În `src/components/teacher/TestBuilder.tsx`, în `applyPredefinedTemplate`:

1. **Forțează `variantMode = "manual"`** dacă măcar un item importat are `variant === "A"` sau `"B"`. Altfel, păstrează valoarea din template (sau cade pe `"shuffle"`).
2. **Fallback explicit pentru variantă**: `variant: (pi.variant === "A" || pi.variant === "B" || pi.variant === "both") ? pi.variant : "both"`.
3. Adaugă un mic toast informativ când se importă într-un mod cu variante: „Itemii au fost importați pe Nr. 1 / Nr. 2 conform definiției din admin."

Niciun alt fișier nu trebuie atins. Datele din DB sunt deja corecte — fix-ul e doar pentru a garanta că teacher-side reflectă fidel ce a definit admin-ul.

## Verificare

- Deschid TestBuilder ca profesor → click „Duplică" pe un test predefinit cu variante (ex. „Recapitulare test final 2 numere (usor)").
- Confirm că `variantMode` devine „Manual (2 numere)", că Selectul per item arată „Nr. 1" / „Nr. 2" conform admin-ului, și că previzualizarea de jos împarte itemii corect între cele două coloane.
