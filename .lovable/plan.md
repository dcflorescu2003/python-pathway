## Plan: Cleanup token-uri invalide + Afisare completa raspunsuri elevi

### 1. Edge Function `cleanup-tokens` -- stergere automata token-uri UNREGISTERED

Se creeaza o noua Edge Function `cleanup-tokens` care:

- Citeste toate token-urile din `device_tokens`
- Trimite un dry-run catre FCM pentru fiecare token (sau direct sterge cele marcate ca invalide)
- Alternativ (mai eficient): se modifica `send-push` sa stearga automat token-urile care returneaza `UNREGISTERED` / `NOT_FOUND` dupa trimitere
- Se adauga un cron job (pg_cron) optional pentru cleanup periodic

**Abordarea recomandata**: Modificam `send-push` sa stearga token-urile invalide inline (fara functie separata), deoarece deja stim care token-uri sunt invalide la momentul trimiterii. Aceasta e cea mai simpla si eficienta solutie.

**Modificari in `supabase/functions/send-push/index.ts**`:

- Dupa fiecare raspuns FCM cu eroare `UNREGISTERED` sau `NOT_FOUND`, se sterge token-ul din `device_tokens` folosind `adminClient`
- Se logheaza cate token-uri au fost curatate

### 2. Afisare completa raspunsuri elevi in TestResults

Componenta `TestResults.tsx` (sectiunea `AnswerDetail`) deja afiseaza raspunsurile elevilor pentru toate tipurile, dar are cateva probleme:

**a) Match -- bug afisare right text**

- Linia 689: `val as string` afiseaza ID-ul drept (ex: "p2"), nu textul asociat
- Fix: se rezolva `val` prin `pairs?.find(p => p.id === val)?.right || val`

**b) Eval exercises din teste predefinite**

- Cand un test importa itemi din banca de evaluare, `source_type` e convertit la `"exercise"` dar `source_id` refera `eval_exercises`, nu `exercises`
- TestResults.tsx cauta in tabelul `exercises` si nu gaseste nimic, deci nu are date pentru cerinta/optiuni
- Fix: In `fetchDetails`, se adauga fallback -- daca un exercise ID nu e gasit in `exercises`, se cauta si in `eval_exercises`

**c) Verificare ca `answer_data` e populat corect**

- Quiz: `{ selected: "a" }` -- deja afisat corect
- TrueFalse: `{ selected: true/false }` -- deja afisat corect
- Fill: `{ blanks: { id: "val" } }` -- deja afisat corect
- Order: `{ order: ["id1", "id2"] }` -- deja afisat corect
- Match: `{ matches: { leftId: rightId } }` -- bug la afisarea textului drept (fix-ul de la pct. a)
- Problem: `{ code: "..." }` -- deja afisat corect  
  
La order, daca elevul lasa asa nu se afiseaza nimic

### Fisiere modificate


| Fisier                                   | Modificare                                                   |
| ---------------------------------------- | ------------------------------------------------------------ |
| `supabase/functions/send-push/index.ts`  | Stergere automata token-uri UNREGISTERED dupa trimitere      |
| `src/components/teacher/TestResults.tsx` | Fix match right-text display + fallback eval_exercises fetch |


### Migrari DB

Niciuna necesara.