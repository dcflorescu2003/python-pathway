

## Plan: Restructura roluri profesor + sistem inimi îmbunătățit

Planul ChatGPT este bun ca viziune, dar implementarea completă dintr-o dată ar fi riscantă. Propun împărțirea în **3 faze**, începând cu cea mai importantă.

---

### Faza 1 — Roluri profesor (prioritate maximă)

**Stare actuală**: Orice utilizator poate activa `is_teacher = true` din profil și primește acces complet la panoul profesor, teste, bareme.

**Ce schimbăm**:

1. **Nouă coloană `teacher_status`** pe `profiles`: valori `null` (elev), `pending`, `verified`
   - Eliminăm dependența de `is_teacher` boolean — îl păstrăm ca fallback dar logica se bazează pe `teacher_status`
   - Trigger-ul `protect_profile_privileged_columns` va proteja și `teacher_status`

2. **Flux de activare profesor**:
   - Userul apasă „Sunt profesor" → `teacher_status = 'pending'`
   - Poate accesa panoul profesor cu funcționalitate limitată (creează clase demo, explorează)
   - **Nu poate**: vedea biblioteca reală de teste predefinite, folosi AI grading, vedea bareme complete
   - Admin-ul aprobă manual → `teacher_status = 'verified'`

3. **Panou admin — secțiune „Profesori"**:
   - Lista profesorilor pending cu buton Aprobă / Respinge
   - Lista profesorilor verificați

4. **Securizare server-side**:
   - RLS pe `test_items`: custom_data cu răspunsuri corecte accesibile doar teacher verified (prin funcție SECURITY DEFINER)
   - Funcția `get_test_items_for_student` deja filtrează — OK
   - `grade-submission`: verifică `teacher_status = 'verified'` + `is_premium` pentru AI

5. **UI updates**:
   - `AuthPage.tsx`: butonul „Activează profesor" → setează `pending`, afișează mesaj „Contul tău de profesor este în așteptare"
   - `TeacherPage.tsx`: banner vizibil pentru pending, funcții limitate
   - Teste predefinite ascunse pentru pending

---

### Faza 2 — Sistem inimi îmbunătățit

**Stare actuală**: 3 inimi, se pierd la greșeli, `resetLives()` le readuce la 3, fără regenerare automată.

**Ce schimbăm**:

1. **5 inimi maximum** (în loc de 3)
2. **Regenerare automată**: 1 inimă la 20 minute
   - Nouă coloană `lives_updated_at` pe `profiles`
   - La încărcarea progresului, calculăm câte inimi s-au regenerat de la ultima actualizare
   - Formula: `min(5, lives + floor((now - lives_updated_at) / 20min))`
3. **Premium**: inimi infinite (deja implementat cu `∞`)
4. **Fără inimi, elevul poate**: vedea clasament, statistici, lecții deja parcurse, recapitulare
   - Doar rezolvarea de lecții noi este blocată

5. **UI**: Afișare 5 inimi în header și pe ecranul lecției

---

### Faza 3 — Securizare avansată conținut (ulterior)

- Bibliotecă demo separată de biblioteca protejată
- Baremul complet vizibil doar după deadline-ul testului
- Generare dinamică ordine itemi (deja parțial cu variante A/B)

---

### Detalii tehnice

**Migrare DB (Faza 1)**:
```sql
ALTER TABLE profiles ADD COLUMN teacher_status text DEFAULT null;
-- Update existing teachers
UPDATE profiles SET teacher_status = 'verified' WHERE is_teacher = true;
-- Protect column in trigger
```

**Migrare DB (Faza 2)**:
```sql
ALTER TABLE profiles ALTER COLUMN lives SET DEFAULT 5;
ALTER TABLE profiles ADD COLUMN lives_updated_at timestamptz DEFAULT now();
UPDATE profiles SET lives = LEAST(lives, 5), lives_updated_at = now();
```

**Fișiere modificate (Faza 1)**:
- `src/pages/AuthPage.tsx` — flux activare profesor, UI pending/verified
- `src/pages/TeacherPage.tsx` — banner pending, restricții funcționale
- `src/pages/AdminPage.tsx` — secțiune aprobare profesori
- `src/components/admin/` — nou component `TeacherApproval.tsx`
- `src/hooks/useTeacher.ts` — verificare `teacher_status`
- Trigger DB actualizat pentru `teacher_status`

**Fișiere modificate (Faza 2)**:
- `src/hooks/useProgress.ts` — max 5, regenerare automată, blocare lecții la 0 inimi
- `src/pages/LessonPage.tsx` — 5 inimi afișate, verificare acces
- `src/pages/Index.tsx` — afișare 5 inimi

---

### Recomandare

Să implementăm **Faza 1 + Faza 2** acum. Faza 3 o lăsăm pentru mai târziu. Confirmă dacă ești de acord sau dacă vrei ajustări.

