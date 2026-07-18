## Obiectiv

Când elevii dintr-o clasă deschid un test cu variante (A/B), varianta să fie atribuită **determinist**, în funcție de poziția lor alfabetică în lista clasei — primul elev primește A, al doilea B, al treilea A, etc. — în loc de aleatoriu, cum e acum.

## Situația actuală

În `src/pages/TakeTestPage.tsx` (linia ~133) varianta se atribuie random:

```ts
const variant = Math.random() < 0.5 ? "A" : "B";
```

Rezultatul: doi elevi vecini pot primi aceeași variantă, ceea ce anulează parțial rostul variantelor. Ordinea alfabetică folosită deja în platformă este cea din `src/lib/sortStudents.ts` (după `last_name`, fallback `display_name`, locale `ro`, `sensitivity: base`).

## Soluție

1. Adaug o funcție RPC `get_assigned_variant_for_student(p_assignment_id uuid)` — SECURITY DEFINER — care:
   - Găsește `class_id` din `test_assignments`.
   - Extrage toți `student_id` din `class_members` pentru acea clasă, împreună cu `last_name` și `display_name` din `profiles`.
   - Sortează după aceeași regulă ca `sortStudents.ts` (Romanian collation, case/diacritic-insensitive, fallback pe `display_name`, apoi tie-break pe `student_id` pentru stabilitate).
   - Returnează `'A'` dacă indexul elevului curent (`auth.uid()`) e par, `'B'` dacă e impar.
   - Fallback la `'A'` dacă elevul nu e găsit în clasă (edge case).

2. În `TakeTestPage.tsx` înlocuiesc linia random cu un apel la noul RPC (doar când **nu** există deja o submisie — dacă există `existingSub.variant`, se păstrează, ca acum, ca să nu se schimbe varianta la reluarea unui test întrerupt).

## De ce pe server și nu pe client

- Elevul nu are (și nu trebuie să aibă) permisiune să vadă lista completă a colegilor cu numele lor. RPC-ul SECURITY DEFINER face calculul fără să expună roster-ul.
- Ordinea alfabetică e calculată identic pentru toți elevii, indiferent de dispozitiv.

## Impact

- Nu se schimbă nimic pentru testele fără variante sau pentru submisiile deja începute.
- Nu se schimbă UI-ul profesorului.
- Dacă un elev nou se alătură clasei după ce alții au început testul, variantele deja atribuite rămân — doar noul elev primește varianta corespunzătoare poziției lui alfabetice curente.

## Fișiere modificate

- **Migrație SQL nouă**: creează `public.get_assigned_variant_for_student(uuid)` + `GRANT EXECUTE ... TO authenticated`.
- **`src/pages/TakeTestPage.tsx`**: înlocuiește `Math.random() < 0.5 ? "A" : "B"` cu `await supabase.rpc("get_assigned_variant_for_student", { p_assignment_id: assignmentId })`, cu fallback la `'A'` dacă RPC-ul eșuează.
