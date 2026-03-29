

# Sistem de Profesor: Clase, Provocări și Monitorizare

## Concept general

Orice utilizator autentificat poate activa modul „Profesor" din pagina Cont. Profesorul creează clase cu cod de acces, atribuie provocări (lecții sau probleme existente), iar elevii primesc +10% XP bonus la completarea provocărilor.

## Structura bazei de date (4 tabele noi)

```sql
-- 1. Flag profesor pe profilul existent
ALTER TABLE profiles ADD COLUMN is_teacher boolean NOT NULL DEFAULT false;

-- 2. Clasele profesorului
CREATE TABLE teacher_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  join_code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Elevi înscriși în clase
CREATE TABLE class_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES teacher_classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);

-- 4. Provocări atribuite de profesor
CREATE TABLE challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES teacher_classes(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('lesson', 'problem')),
  item_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

RLS: profesorul CRUD pe clasele/provocările proprii; elevii SELECT pe clasele în care sunt membri + provocările aferente; toți pot citi `teacher_classes` pentru join by code.

## Pagini și componente noi

### 1. Activare profesor (pagina Cont — `AuthPage.tsx`)
- Buton „Devino Profesor" → setează `is_teacher = true` pe profil
- Odată activat, apare butonul „Panou Profesor" (similar cu „Panou Admin")

### 2. Pagina Profesor (`/teacher`) — `TeacherPage.tsx`
- **Tab Clase**: lista claselor + buton creare clasă nouă (nume → generare cod 6 caractere)
- **Tab Clasă individuală** (click pe clasă):
  - Cod de acces vizibil + buton copiere
  - Lista elevilor înscriși (nume, XP, streak)
  - Provocări atribuite (sortate de la cea mai recentă), cu status per elev (completat/necompletat)
  - Buton „Atribuie provocare" → deschide dialog cu lista lecțiilor și problemelor din DB, checkbox multiplu, salvare

### 3. Înscrierea elevilor în clase
- Pe pagina Cont, secțiune „Clase" cu input „Introdu codul clasei" + buton „Alătură-te"
- Query: `teacher_classes.join_code = input` → insert în `class_members`

### 4. Vizualizarea provocărilor de către elevi (Propunere)
Pe pagina principală (Index), deasupra listei de capitole, afișăm un **card „Provocări active"** (dacă elevul e membru în cel puțin o clasă):
- Card cu icon 🎯 și titlu „Provocări de la profesor"
- Lista provocărilor necompletate, grupate pe clasă/profesor
- Fiecare provocare e un buton care navighează direct la lecția/problema respectivă
- Badge „+10% XP" pe fiecare provocare
- Când elevul completează o lecție/problemă care e și provocare, XP-ul primit e multiplicat cu 1.1

### 5. Bonus XP la completare (`useProgress.ts`)
- La completarea unei lecții/probleme, verificăm dacă `item_id` există în `challenges` pentru o clasă din care elevul face parte
- Dacă da: `xpReward * 1.1` (rotunjit)

## Fișiere noi
1. `src/pages/TeacherPage.tsx` — pagina principală profesor
2. `src/components/teacher/ClassManager.tsx` — CRUD clase
3. `src/components/teacher/ChallengeAssigner.tsx` — dialog atribuire provocări
4. `src/components/teacher/ClassDetail.tsx` — detalii clasă (elevi + provocări)
5. `src/hooks/useTeacher.ts` — hook-uri pentru queries profesor
6. `src/hooks/useChallenges.ts` — hook pentru provocări active ale elevului

## Fișiere modificate
1. `src/pages/AuthPage.tsx` — buton activare profesor + buton panou + secțiune „Clase" elev
2. `src/App.tsx` — rută `/teacher`
3. `src/hooks/useProgress.ts` — bonus XP 10% pentru provocări
4. `src/pages/Index.tsx` — card „Provocări active" deasupra capitolelor
5. Migrare DB — 1 ALTER + 3 CREATE TABLE + RLS policies

