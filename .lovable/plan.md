# Profil de competențe pentru elev (CG → CS → Microcompetențe)

Idee: fiecare item (exercițiu din lecție, problemă, item dintr-un test) poate fi etichetat cu una sau mai multe microcompetențe (M1–M100). Fiecare microcompetență aparține unei competențe specifice (CS), care aparține unei competențe generale (CG). Pe baza scorurilor obținute la itemii etichetați se generează automat un **profil personalizat** vizibil de elev și de profesor (cu posibilitate de notițe și ajustări manuale din partea profesorului).

---

## 1. Model de date (3 nivele ierarhice)

Trei tabele de catalog (read-only pentru utilizatori, editabile de admin):

- `competencies_general` — CG1..CG6 (cod, titlu, descriere)
- `competencies_specific` — CS 1.1..CS 6.5 (cod, titlu, descriere, `general_id`, `grade` — clasa IX/X/XI…)
- `microcompetencies` — M1..M100 (cod, titlu, descriere, `specific_id`, `category` A–H, `sort_order`)

Tabel de **mapare item → microcompetențe** (many-to-many, un item poate atinge mai multe M):

- `item_competencies` cu coloane: `id`, `item_type` (`exercise` | `eval_exercise` | `manual_exercise` | `problem` | `test_item` | `predefined_test_item`), `item_id` (text), `microcompetency_id`, `weight` (default 1.0 — un item poate contribui mai mult la o M decât la alta), `created_by` (admin/profesor).

Tabel de **rezultate agregate per elev** (recalculat la fiecare submit/lecție):

- `student_competency_scores`: `user_id`, `microcompetency_id`, `attempts`, `correct`, `score_sum`, `max_sum`, `mastery` (0..1, calculat: `score_sum/max_sum` cu un factor de încredere bazat pe `attempts`), `last_updated`.

Tabel de **notițe profesor** pe profilul unui elev (profesorul poate adăuga observații și ajusta manual nivelul perceput la o competență):

- `student_competency_notes`: `student_id`, `teacher_id`, `target_type` (`microcompetency` | `specific` | `general`), `target_id`, `manual_level` (nullable, 0..1 sau null = automat), `note` (text), `updated_at`.
RLS: profesorul scrie/citește doar pentru elevii din propriile clase; elevul citește doar notițele despre el.

---

## 2. UI — etichetarea itemilor (admin + profesor)

În editorul existent al fiecărui tip de item (ExerciseEditor, ProblemsEditor, EvalBankEditor, ManualEditor, TestBuilder custom items) se adaugă o secțiune nouă:

> **Microcompetențe vizate** — multi-select cu căutare, grupat pe categorii A–H.
> Fiecare microcompetență aleasă apare ca un chip cu pondere implicită 1.0, editabilă (0.25 / 0.5 / 1.0).

Componentă reutilizabilă: `CompetencyTagger` care primește `(itemType, itemId)` și gestionează inserțiile/ștergerile în `item_competencies`.

Pentru itemii deja existenți: pagină admin „Etichetare în masă” care afișează lista exercițiilor + microcompetențele propuse, pentru completare rapidă.

---

## 3. Algoritm de generare a profilului

La fiecare finalizare de lecție / problemă / test se rulează un trigger (sau funcție RPC apelată din client) care:

1. Pentru fiecare item rezolvat, ia microcompetențele asociate cu pondere `w`.
2. Pentru fiecare M actualizează: `attempts += 1`, `score_sum += score_obținut * w`, `max_sum += max_punctaj * w`, `correct += (score == max ? 1 : 0)`.
3. Recalculează `mastery = score_sum / max_sum`.
4. Agregare CS = media ponderată a M-urilor copil cu `attempts > 0`.
5. Agregare CG = media CS-urilor copil.
6. Etichete calitative pe baza `mastery` + `attempts`:
  - `attempts < 2` → „Insuficiente date”
  - `mastery ≥ 0.85` → „Stăpânește”
  - `0.6 ≤ mastery < 0.85` → „În dezvoltare”
  - `mastery < 0.6` → „De recuperat”

Algoritmul de **recomandare**: pentru fiecare M cu mastery < 0.6 sau insuficiente date, sistemul propune lecții/exerciții/probleme etichetate cu acea M (top 3, sortate după dificultate crescătoare).

---

## 4. Pagina „Profil de competențe”

Rută nouă: `/profile/competencies` (vizibilă elevului) și `/teacher/student/:id/competencies` (vizibilă profesorului pentru elevii din clasele lui).

Layout (3 nivele expandabile, accordion):

```text
CG1 Identifică...                              [bar 72%]
  └ CS 1.1 Identifică organizarea datelor      [bar 80%]
      └ M61 Recunoaște lista                   [Stăpânește • 12/14]
      └ M67 Listă de frecvențe                 [De recuperat • 2/8]
  └ CS 1.2 Algoritmi specializați              [bar 64%]
      └ ...
```

Pentru profesor, fiecare nod are buton „Adaugă observație” și „Setează nivel manual” (override). Ajustările manuale apar marcate vizual și nu sunt suprascrise de algoritm.

Secțiune jos: **Recomandări personalizate** — listă de exerciții/lecții/probleme propuse pentru a acoperi golurile.

Pentru profesor în `ClassDetail` se adaugă un buton „Vezi profil de competențe” lângă fiecare elev și un raport agregat la nivel de clasă (heatmap CS × elev).

---

## 5. Integrare în fluxul existent

- `LessonPage`, `ProblemSolvePage`, `TakeTestPage` la submit apelează o funcție `updateCompetencyScores(userId, items)` care procesează scorurile.
- Pentru testele profesorilor, edge-ul `grade-submission` primește deja itemii și scorurile — adăugăm acolo apelul de actualizare.
- Notificare opțională: când elevul atinge prima dată „Stăpânește” pe o CS, primește o notificare in-app.

---

## 6. Etape de implementare propuse

1. **Migrare DB**: cele 3 tabele de catalog + 3 tabele operaționale, RLS, seed cu CG/CS/M din document.
2. **Componenta `CompetencyTagger**` + integrare în toate editoarele (admin + TestBuilder).
3. **Funcție RPC `recalculate_competency_scores**` + cârlige în submit-urile de lecții/probleme/teste.
4. **Pagina „Profil de competențe”** pentru elev (read-only).
5. **Vizualizare profesor + notițe + override manual + heatmap pe clasă**.
6. **Recomandări personalizate** (lecții/exerciții propuse pe baza golurilor).
7. **Etichetare în masă** (UI admin) pentru itemii existenți.

---

## 7. Întrebări înainte de implementare

- Vrei ca **elevul să vadă** profilul integral sau doar o variantă simplificată (doar CS și CG, fără M-uri brute)?
- Etichetarea itemilor: **doar admin** sau și profesorii pot eticheta itemii custom din testele lor?
- Vrei și o **export PDF** al profilului de competențe (util pentru părinți / portofoliu școlar)?
- Începem cu seed complet pentru clasa a IX-a (toate CG/CS/M de mai sus) sau scalăm progresiv?
- Mențin scopul doar pentru clasa IX acum, sau pregătim schema cu câmp `grade` ca să adăugăm ulterior X/XI/XII?  
  
Momentan nu afisam nimic decatin faza de admin. O sa vreau ca elevul sa vada o varianta prelucrata, adica pe baza compententelor dobandite sa se genereze un sumar cu puncte forte, unde mai trebuie lucrat. Sau ce stii, ce mai ai de invatat.   
Vreau sa pregatim pentru toate clasele. Si o sa vreau si export pdf. Creeaza toate toolurile dar sa o sa testam inainte de a publica