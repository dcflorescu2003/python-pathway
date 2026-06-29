## Verificare actuală

- `class_members` are doar `UNIQUE (class_id, student_id)` — un elev **poate** intra în mai multe clase.
- RPC `join_class_with_code` face `INSERT ... ON CONFLICT DO NOTHING`, deci nu blochează intrarea într-o a doua clasă.
- În DB nu există momentan elevi cu apartenență multiplă (verificat: 0 duplicate).

## Modificări

### 1. Migrație DB
- Adaug `UNIQUE (student_id)` pe `class_members` (sigur, nu există încălcări).
- Actualizez `join_class_with_code` să verifice explicit: dacă elevul e deja în altă clasă → `RAISE EXCEPTION 'Already enrolled in a class'` cu mesaj clar (ca să-l afișăm în UI). Dacă e deja în aceeași clasă, return normal (idempotent).

### 2. Frontend
- `src/pages/AuthPage.tsx` (`joinClassDirect`) și `src/components/teacher/ClassManager.tsx`: traduc eroarea în mesaj RO de tip „Ești deja înscris într-o altă clasă. Părăsește clasa curentă din Cont → Elev înainte să te alături alteia."
- Nicio schimbare la flow-ul de „Părăsire clasă" — funcționează deja.

### 3. Verificare
- Rulez quick query după migrație ca să confirm constraint-ul.

Niciun impact pentru profesori sau pentru funcționalitatea de teste — apartenența rămâne legată de `class_members.student_id`.