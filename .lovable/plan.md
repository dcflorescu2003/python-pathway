

## Plan: Folosește componentele reale de exerciții în teste

### Problema
Pagina de teste (`TakeTestPage.tsx`) are un `ExerciseRenderer` simplificat inline care:
- La **"completează codul" (fill)**: afișează doar câmpuri de input fără codul din `codeTemplate`
- La **"aranjează" (order)**: permite doar click pentru mutat în sus, fără drag-and-drop

În lecții se folosesc componentele din `src/components/exercises/` care funcționează corect.

### Soluția
Înlocuim `ExerciseRenderer`-ul inline cu componentele reale (`FillExercise`, `OrderExercise`, `MatchExercise`, `QuizExercise`, `TrueFalseExercise`), adaptate pentru contextul de test.

### Modificări în `src/pages/TakeTestPage.tsx`

1. **Import** componentele reale de exerciții
2. **Refactor `ExerciseRenderer`**: pentru tipurile `fill`, `order`, `quiz`, `truefalse`, `match` — folosim componentele din `src/components/exercises/` cu un wrapper care:
   - Transformă `exercise_data` din DB (cu `code_template`) în formatul așteptat de componente (cu `codeTemplate`)
   - Captează răspunsul prin `onAnswer` callback-ul testului (salvează datele în `answers` state) în loc de a verifica corect/greșit instant
   - Setează `feedback` la `null` permanent (nu arătăm corect/greșit în test)
3. **Mapare câmpuri DB → componente**: `code_template` → `codeTemplate`, `correct_answer` → `correctAnswer` etc., pentru compatibilitate cu interfețele componentelor

### Rezultat
- Exercițiile din teste vor arăta și funcționa identic cu cele din lecții (drag-and-drop, cod afișat, etc.)
- Răspunsurile se colectează pentru trimitere la final

