# Ascunderea răspunsurilor corecte în timpul testelor

## Problema confirmată

În pagina de testare, itemii care provin din exercițiile de lecție sunt încărcați cu `select("*")` direct din tabelul `exercises`. Răspunsul rețelei conține deci `correct_option_id`, `is_true`, `explanation`, plus `blanks.answer` (răspunsuri la completare) și `lines.order` (ordinea corectă la reordonare). Un elev poate deschide tab-ul Network și vedea cheia de răspuns înainte de a trimite testul.

Am verificat și celelalte două căi de încărcare:
- Itemii custom trec prin funcția pentru elevi, care deja curăță `answer` din blanks și `order` din lines — model corect de urmat.
- Problemele de cod se citesc fără coloana `solution` — corect.
- Funcția pentru banca de evaluare returnează totuși `correct_option_id`, `is_true` și `explanation` — aceeași scurgere, pe a doua cale.

Notarea se face integral pe server, deci eliminarea acestor câmpuri din răspunsul către elev nu afectează punctajele.

## Ce se schimbă

1. **Funcție nouă în bază de date** care returnează exercițiile de lecție pentru un elev aflat în test, cu răspunsurile eliminate: fără `correct_option_id`, fără `is_true`, fără `explanation`, cu `blanks` fără câmpul de răspuns și `lines` fără ordinea corectă. Accesul este permis doar elevului înscris în clasa cu testul atribuit, în fereastra de start sau cât timp are o încercare nefinalizată — exact aceleași condiții folosite deja pentru itemii de test.

2. **Curățarea funcției existente pentru banca de evaluare** — aceleași trei câmpuri eliminate din răspuns.

3. **Pagina de testare** nu mai citește direct din tabelul de exerciții; folosește funcția nouă (un singur apel pentru toate id-urile, ca să nu crească latența).

4. **Verificare** că afișarea itemilor (grilă, adevărat/fals, completare, reordonare, potrivire) rămâne corectă fără câmpurile eliminate, și că notarea și pagina de review de după eliberarea notelor (care merg pe alte funcții, cu drepturi de server) continuă să arate răspunsul corect.

## Detalii tehnice

- RPC nou: `public.get_exercises_for_student(p_ids text[])`, `STABLE SECURITY DEFINER`, `SET search_path = public`, `GRANT EXECUTE ... TO authenticated`. Semnătura returnează `id, lesson_id, type, question, options, blanks, lines, pairs, statement, code_template, sort_order, xp` — fără câmpurile de răspuns. `blanks` se construiește cu `jsonb_agg(b - 'answer')`, `lines` cu `jsonb_agg(l - 'order')`, ca în `get_test_items_for_student`.
- Gardul de acces reia condiția din `get_eval_exercise_for_student` / `get_test_items_for_student`: existența unui `test_items` cu `source_id` în `p_ids`, legat prin `test_assignments` + `class_members` de `auth.uid()`, cu fereastra activă sau cu o trimitere nefinalizată. Filtrarea se face per id, ca un elev să nu poată cere exerciții din alt test.
- `get_eval_exercise_for_student` se rescrie cu `NULL` pe `correct_option_id`, `is_true`, `explanation` și cu același tratament pentru `blanks` / `lines`.
- `src/pages/TakeTestPage.tsx`: se înlocuiește `supabase.from("exercises").select("*").in("id", exerciseIds)` cu apelul RPC batch; restul maparii (`exMap`, `enriched.exercise_data`) rămâne neschimbat.
- Politicile RLS existente pe `exercises` (`source_in_accessible_test`) se restrâng astfel încât elevii să nu mai poată citi direct rândurile de exerciții pe baza apartenenței la un test — accesul trece exclusiv prin RPC.
- După aplicare: marcarea constatării de securitate ca rezolvată.
