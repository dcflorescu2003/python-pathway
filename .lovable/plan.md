## Problem

La lecția "Instrucțiunea if...else", exercițiul fill cu răspuns acceptat `> | >=` respinge `>` deși logica curentă din `src/components/exercises/FillExercise.tsx` ar trebui să-l accepte (split pe `[,|]`, normalize, includes). În testarea izolată funcționează — deci cauza e fie un caracter invizibil salvat din admin (NBSP / zero-width), fie un build vechi servit pe device.

## Changes

### 1. `src/components/exercises/FillExercise.tsx` — normalize mai robust

Extind `normalize()` să elimine:
- caractere zero-width (`\u200B-\u200D`, `\uFEFF`)
- non-breaking spaces (`\u00A0`) tratate ca spațiu normal
- whitespace interior colapsat (pentru cazuri tip `> =`)

Și extind separatorii la `[,|;/]` (în plus față de virgulă și pipe) ca să acopăr greșeli comune din editor.

```ts
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width
    .replace(/\u00A0/g, " ")               // NBSP -> space
    .replace(/\s+/g, " ")                  // collapse internal whitespace
    .toLowerCase()
    .trim();

// split pe , | ; sau /
const alternatives = acceptedAnswers.split(/[,|;/]/).map(normalize).filter(Boolean);
```

### 2. Aceeași logică în `src/pages/TakeTestPage.tsx`

În prezent, validarea fill din testele profesorilor folosește același pattern — aplic și acolo aceeași funcție `normalize` + splitter (probabil deja există, verific și aliniez).

### 3. Test unitar nou: `src/components/exercises/FillExercise.test.tsx`

Acoperă cazurile:
- `> | >=` cu input `>` → corect
- `>|>=` cu input `>=` → corect
- `> | >=` cu input `<` → greșit
- `int` cu input `INT ` (caps + trailing space) → corect
- variantă cu NBSP `>\u00A0|\u00A0>=` cu input `>` → corect

### 4. Bump versiune (1.99) pentru iOS și Android

Ca utilizatorii să primească build-ul nou cu logica robustă (în caz că pe device era cache vechi).

- `android/app/build.gradle`: `versionCode 99`, `versionName "1.99"`
- `ios/App/App.xcodeproj/project.pbxproj`: `MARKETING_VERSION = 1.99`, `CURRENT_PROJECT_VERSION = 99`

## Files modified

- `src/components/exercises/FillExercise.tsx`
- `src/pages/TakeTestPage.tsx` (aliniere normalizare blanks)
- `src/components/exercises/FillExercise.test.tsx` (nou)
- `android/app/build.gradle`
- `ios/App/App.xcodeproj/project.pbxproj`

## Out of scope

Nu modific datele din DB (nu fac UPDATE pe `blanks`). Logica nouă acoperă variantele oricum.

Confirmi și aplicăm?