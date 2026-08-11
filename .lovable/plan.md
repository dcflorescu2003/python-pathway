# Pagină de statistici în Admin

Un tab nou „Statistici" în interfața de admin, care arată cine sunt utilizatorii activi și ce fac în aplicație.

## Ce vei vedea

**1. Carduri de sumar (sus)**
- Utilizatori activi azi / 7 zile / 30 zile (din `last_activity_date`)
- Total conturi, din care Premium și profesori
- Lecții finalizate azi / 7 zile
- Probleme rezolvate și teste predate în ultimele 7 zile

**2. Grafic de activitate (ultimele 30 de zile)**
- Linie cu utilizatori activi pe zi
- Bare cu lecții finalizate pe zi

**3. Ce fac utilizatorii**
- Top 10 lecții finalizate (ultimele 30 zile)
- Top 10 probleme rezolvate
- Distribuția pe capitole (câte finalizări per capitol)
- Scor mediu pe lecție (indicator de dificultate)

**4. Top utilizatori activi**
- Tabel: nume/nickname, XP, streak, lecții finalizate, ultima activitate
- Sortabil după XP sau activitate recentă, cu selector de interval (7/30 zile)

Perioada (7 / 30 / 90 zile) se alege dintr-un dropdown care se aplică la grafice și topuri.

## Detalii tehnice

- Funcție de bază de date `admin_get_stats(p_days int)` cu `SECURITY DEFINER`, care verifică `has_role(auth.uid(), 'admin')` și returnează un singur `jsonb` cu toate secțiunile (sumar, serii zilnice, topuri, top utilizatori). Astfel evităm expunerea datelor agregate către non-admini și facem o singură cerere.
- Sursele de date: `profiles` (`last_activity_date`, `xp`, `streak`, `is_premium`, `is_teacher`, `created_at`), `completed_lessons` (+ join pe `lessons`/`chapters` pentru titluri), `test_submissions`, `student_competency_scores` pentru problemele rezolvate acolo unde e relevant.
- Componentă nouă `src/components/admin/StatsDashboard.tsx`, apelată printr-un tab nou „Statistici" în `src/pages/AdminPage.tsx` (icon `BarChart3`).
- Grafice cu `recharts` (deja folosit în `ClassAnalytics`), în stilul temei dark existente; date încărcate cu React Query (`staleTime` 5 min) și buton de reîmprospătare.
- Fără modificări la logica existentă de useri sau la RLS pe tabelele curente; totul este read-only.
