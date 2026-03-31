

# Cartonașe teoretice intercalate cu exercițiile

## Concept
Adăugăm un nou tip de item în lecții: **„card"** (cartonaș teoretic). Acestea apar în fluxul lecției exact ca un exercițiu, dar nu au răspuns — elevul doar citește și apasă „Continuă". Sunt stocate în același tabel `exercises` cu `type = 'card'`, ceea ce permite reordonarea drag-and-drop alături de exerciții.

## Modificări

### 1. Migrare DB — fără modificări de schemă
Tabelul `exercises` are deja coloanele necesare:
- `type` → adăugăm valoarea `'card'`
- `question` → folosit ca **titlu** al cartonașului
- `explanation` → folosit ca **textul explicativ**
- `code_template` → folosit pentru **codul Python opțional**
- Celelalte coloane (options, blanks, etc.) rămân `null`

Nu e nevoie de migrare — doar cod.

### 2. `src/hooks/useChapters.ts`
- Adăugăm `'card'` la tipul `ExerciseType`: `"quiz" | "fill" | "order" | "truefalse" | "match" | "card"`

### 3. `src/components/exercises/CardExercise.tsx` (nou)
- Componentă nouă care afișează cartonașul
- Design diferențiat: border colorat/gradient subtil, icon 📖, font mai mare pentru titlu
- Afișează: titlu (`question`), explicație (`explanation`), cod opțional (`codeTemplate`) într-un bloc `<pre>`
- Buton „Am înțeles — Continuă" care apelează `onAnswer(true)` (întotdeauna corect)

### 4. `src/pages/LessonPage.tsx`
- Adăugăm `CardExercise` în switch-ul de renderizare
- La cartonașe, nu se pierde viață și nu se contorizează ca „răspuns corect/greșit" — se trece automat
- Ajustăm progress bar-ul: cartonașele contează în progres dar nu în scor

### 5. `src/components/admin/ExerciseEditor.tsx`
- Adăugăm `'card'` în dropdown-ul de tip exercițiu
- Când tipul e `card`: afișăm doar 3 câmpuri: **Titlu** (question), **Explicație** (explanation), **Cod Python** (code_template, opțional)
- Ascundem câmpurile specifice celorlalte tipuri (options, blanks, etc.)

### 6. `src/components/admin/ContentEditor.tsx`
- La listarea exercițiilor, cartonașele apar cu icon 📖 și label „Cartonaș" în loc de tipul standard

## Design cartonaș (în lecție)
- Background: `bg-primary/5` cu border `border-primary/20`
- Icon 📖 + titlu bold mare
- Text explicativ cu `whitespace-pre-line`
- Bloc de cod cu fundal întunecat, monospace (dacă există)
- Buton full-width „Am înțeles" stil primary

## Fișiere
1. `src/hooks/useChapters.ts` — tip nou
2. `src/components/exercises/CardExercise.tsx` — componentă nouă
3. `src/pages/LessonPage.tsx` — renderizare + logică skip
4. `src/components/admin/ExerciseEditor.tsx` — formular admin
5. `src/components/admin/ContentEditor.tsx` — label în listă

