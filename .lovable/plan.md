# Profil de competențe — plan aprobat (CG → CS → Microcompetențe)

## Decizii confirmate

- **Vizibilitate elev:** doar CG + CS. Microcompetențele M1-M100 rămân interne pentru calcul.
- **Etichetare:** admin pe catalog global; profesori doar pe `test_items` cu `source_type='custom'` din testele lor.
- **Export PDF:** amânat (după lansarea in-app).
- **Seed:** programa clasei a IX-a complet (CG1-6, toate CS, M1-M100). Schemă pregătită cu `grade` pentru extindere ulterioară X/XI/XII.

---

## Etapa 1 — Migrare DB (urmează acum)

6 tabele noi:

1. `competencies_general` — CG1..CG6 (`code`, `title`, `description`).
2. `competencies_specific` — CS x.y (`code`, `title`, `description`, `general_id` FK, `grade` smallint default 9).
3. `microcompetencies` — M1..M100 (`code`, `title`, `description`, `specific_id` FK, `category` text A-H, `grade`, `sort_order`).
4. `item_competencies` — mapare item ↔ M (`item_type`, `item_id` text, `microcompetency_id` FK, `weight` numeric default 1.0, `created_by`, `created_at`). Unique pe `(item_type, item_id, microcompetency_id)`.
5. `student_competency_scores` — agregat per elev × M (`user_id`, `microcompetency_id`, `attempts`, `correct`, `score_sum`, `max_sum`, `mastery` generated, `last_updated`). Unique pe `(user_id, microcompetency_id)`.
6. `student_competency_notes` — observații + override profesor (`student_id`, `teacher_id`, `target_type` enum {`general`,`specific`,`microcompetency`}, `target_id`, `manual_level` numeric nullable, `note`, `updated_at`).

**RLS:**
- Cataloagele (1, 2, 3): SELECT pentru `authenticated`, ALL doar pentru admini.
- `item_competencies`: SELECT autenticat; INSERT/UPDATE/DELETE pentru admini pe orice item, pentru profesori doar dacă `item_type='test_item'` și itemul aparține unui test al lor.
- `student_competency_scores`: elevul își citește propriile rânduri; profesorul vede rândurile elevilor din clasele lui (via `class_members` + `teacher_classes`); scrierea doar prin RPC `recalculate_competency_scores` (SECURITY DEFINER).
- `student_competency_notes`: elevul citește notițele despre el; profesorul scrie/citește doar pentru elevii din propriile clase.

**RPC noi:**
- `recalculate_competency_scores(p_user_id uuid, p_items jsonb)` — primește lista `[{item_type, item_id, score, max_score}]` și actualizează agregatul.
- `get_student_competency_profile(p_user_id uuid)` — întoarce ierarhia CG → CS cu mastery agregat (folosit de pagina de profil).

---

## Etapa 2 — Seed catalog

Insert idempotent pentru CG1-6, CS 1.1-6.5 (toate cu `grade=9`), M1-M100 cu maparea corectă pe CS și categorie A-H din document.

---

## Etapa 3 — Componenta `CompetencyTagger`

Componentă reutilizabilă (Combobox cu căutare, grupat pe categorii A-H). Integrată în:
- `ExerciseEditor`, `EvalBankEditor`, `ProblemsEditor`, `ManualEditor` (admin)
- `TestBuilder` doar pentru itemii custom (profesor)

---

## Etapa 4 — Cârlige de calcul

La submit lecție/problemă/test apel `recalculate_competency_scores`. Pentru testele profesorilor — apel din edge `grade-submission` după corectare.

---

## Etapa 5 — Pagina elev `/profile/competencies`

Două nivele expandabile (CG → CS), bară de progres + etichetă calitativă pe fiecare nod. Microcompetențele NU sunt expuse elevului. Sub listă: secțiune „Recomandări” (lecții/probleme propuse pentru CS-urile slabe).

## Etapa 6 — Vedere profesor

Rută `/teacher/student/:id/competencies`: aceeași ierarhie + buton „Notiță” / „Setează nivel manual” pe fiecare nod (CG / CS / M). Aici profesorul vede și nivelul granular M.
În `ClassDetail` — buton „Profil competențe” lângă fiecare elev + heatmap CS × elev pentru întreaga clasă.

## Etapa 7 — Etichetare în masă (admin)

Pagină admin `/admin/competency-tagging` cu listă de itemi + filtru pe capitol/tip + multi-select rapid de M-uri pentru completarea retroactivă a catalogului existent.

---

## Iterații viitoare (după launch)

- Export PDF al profilului.
- Sugestii AI pentru etichetare automată.
- Seed CG/CS/M pentru clasele X/XI/XII.
- Notificare in-app la prima atingere a „Stăpânește” pe o CS.
