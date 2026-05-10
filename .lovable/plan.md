## Problema

Pe testul tău cu item AI bifat, AI-ul nu a corectat — a rămas doar feedback-ul structural „Punctaj structural: 4/10. Evaluarea completă necesită AI review.”

Cauza: edge function-ul `grade-submission` verifică „Profesor AI” **doar prin Stripe**. Tu ai Premium profesor printr-un cupon (`PROF-…`, `coupon_type='teacher'`, valabil până în 2029), nu prin Stripe — deci `teacherHasAI` rămâne `false` și itemul bifat nu se trimite la AI, indiferent că este selectat în `ai_grading_item_ids`.

În aplicație (`useSubscription` / `check-subscription`) accesul Profesor AI vine din 3 surse: Stripe, cupon teacher, sau Play/iOS billing. În `grade-submission` se verifică doar Stripe — de aici discrepanța.

## Plan (doar `supabase/functions/grade-submission/index.ts`)

Aliniem detecția `teacherHasAI` cu logica din `check-subscription`:

1. După ce determinăm `teacher_id`, verificăm în paralel:
   - **Cupon teacher**: `coupon_redemptions` cu `user_id = teacher_id`, `coupon_type = 'teacher'`, `premium_until > now()` → `teacherHasAI = true`.
   - **Play / iOS billing**: `play_billing_subscriptions` activ cu `product_id` în `TEACHER_PRODUCT_IDS` și `expiry_time > now()` → `teacherHasAI = true`.
   - **Stripe** (logica existentă) rămâne ca fallback.
2. Dacă oricare dintre cele trei e activă, oprim verificarea (short‑circuit) și continuăm fluxul existent. Nimic altceva în funcție nu se schimbă — `ai_grading_item_ids`, `getAIKey`, `batchAIReview`, scoring rămân la fel.
3. Profilul trebuie să fie `teacher_status = 'verified'` (păstrăm gating-ul actual).

Nicio modificare în UI, în baza de date sau în alte funcții.

## Verificare după deploy

- Re-trimit (re-grade) submission-ul existent (sau elevul retrimite testul) și verificăm:
  - `test_answers.ai_reviewed = true` pentru itemul `eval-e-1778420025177-2-q1pp`.
  - `feedback` actualizat cu textul AI, scor potențial > 4.
- Logs în `grade-submission` confirmă ramura coupon-teacher.
