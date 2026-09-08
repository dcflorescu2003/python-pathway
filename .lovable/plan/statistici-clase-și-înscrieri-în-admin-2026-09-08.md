# Statistici clase și înscrieri în Admin

În pagina de statistici din Admin se adaugă două indicatori noi: câte clase există în platformă și câți elevi s-au înscris în cel puțin o clasă.

## Ce vei vedea

**Carduri noi în tabloul de bord Statistici:**
- **Clase create** – numărul total de clase din `teacher_classes`.
- **Elevi înscriși** – numărul total de înscrieri din `class_members` (un elev poate conta o singură dată chiar dacă ar fi în mai multe clase; se folosește `count(DISTINCT student_id)`).

Ambele valori apar lângă celelalte carduri de sumar, indiferent de perioada selectată (1/7/30/90 zile), pentru că reprezintă starea curentă a platformei.

## Detalii tehnice

- Se extinde funcția `admin_get_stats(p_days integer)` din baza de date cu două câmpuri noi în blocul `summary`:
  - `total_classes` – `SELECT count(*) FROM public.teacher_classes`
  - `total_enrolled_students` – `SELECT count(DISTINCT student_id) FROM public.class_members`
- Funcția rămâne `SECURITY DEFINER`, verifică `has_role(auth.uid(), 'admin')` și nu expune date personale suplimentare.
- Se actualizează interfața `src/components/admin/StatsDashboard.tsx`:
  - Se adaugă cele două câmpuri în interfața `StatsData.summary`.
  - Se adaugă două componente `StatCard` cu iconițe `GraduationCap` / `Users` în secțiunea de sumar.
- Nu se modifică logica de clase, înscrieri sau RLS; totul este read-only.
