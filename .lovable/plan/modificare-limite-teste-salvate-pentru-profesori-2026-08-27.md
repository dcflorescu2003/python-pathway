# Modificare limite teste salvate pentru profesori

## Obiectiv
Reducem plafonul de teste salvate pentru toate cele 3 tier-uri de conturi de profesor și actualizăm toate textele afișate utilizatorilor care fac referire la vechile valori.

## Noile limite

| Tier | Limită veche | Limită nouă |
|------|-------------|-------------|
| Profesor neverificat | 50 | **20** |
| Profesor verificat | 100 | **40** |
| Profesor AI | 150 | **60** |

## Modificări necesare

### 1. Sursa adevărului — constante
- Fișier: `src/lib/teacherLimits.ts`
- Acțiune: schimbă valorile din `TEACHER_TEST_LIMITS` în `{ unverified: 20, verified: 40, ai: 60 }`.
- Restul logicii (`getTeacherTestLimit`, `TEACHER_TIER_LABEL`) rămâne neschimbată.

### 2. Texte hardcodate care trebuie actualizate

#### `src/components/teacher/TestLimitReachedDialog.tsx`
- Textele actuale menționează explicit „100 teste” / „150 teste”.
- Le înlocuim cu texte dinamice sau cu noile valori:
  - Pentru tier `unverified`: „Verifică-ți contul pentru 40 teste sau upgrade la Profesor AI pentru 60 teste.”
  - Pentru tier `verified`: „Treci la Profesor AI pentru 60 teste salvate, sau șterge teste vechi.”
  - Pentru tier `ai`: mesajul de limită maximă rămâne generic, fără cifre hardcodate.

#### `src/components/TeacherPremiumDialog.tsx`
- Linia 126: „Până la 150 teste salvate (față de 100 verificat / 50 neverificat)” devine „Până la 60 teste salvate (față de 40 verificat / 20 neverificat)”.

#### `src/data/tutorials/teachers.ts`
- Linia 82: „Limita de teste salvate depinde de plan: 50 (Free), 100 (Premium), 150 (AI Teacher).” devine „20 (Free), 40 (Premium), 60 (AI Teacher).”
- Liniile 188-190: actualizează enumerarea planurilor cu noile limite.
- Linia 192 (alt text imagine): actualizează „150 teste salvate” → „60 teste salvate”.

### 3. Locuri care NU necesită modificări
- `src/components/teacher/TestManager.tsx` și `src/components/teacher/TestBuilder.tsx` citesc deja `testLimit` dinamic din `getTeacherTestLimit`, deci counterele și logica de blocare se vor adapta automat.
- Toast-urile din `TestManager.tsx` folosesc variabila `testLimit`, nu valori hardcodate.

## Verificare
- Rulez `tsgo` / `bunx tsc --noEmit` pentru a mă asigura că nu există erori de tip.
- Verific în preview că dialogul de limită atinsă afișează noile cifre.
