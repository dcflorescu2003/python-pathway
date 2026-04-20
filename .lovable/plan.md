## Plan

Trei modificări:

### 1. Nickname editabil în pagina Profil (deja există ✓)

Verificat: `AccountProfileTab.tsx` are deja un editor de nickname (linii 108-156) cu salvare în `profiles.nickname`. **Nimic de făcut.**

### 2. Verificare afișare nickname în clasamente (deja corect ✓)

`LeaderboardPage.tsx` linia 159: `entry.nickname || entry.display_name || "Anonim"`. Nickname-ul are prioritate. **Nimic de făcut.**

### 3. Nume catalog editabil în StudentTab (deja există ✓)

`StudentTab.tsx` linii 220-287 — editor cu Nume + Prenume separat, salvare în `last_name`/`first_name`/`display_name`. **Scrie in dreptul lui Numele din catalog.**

### 4. Nume catalog editabil pentru profesor în tab-ul "Clase" (NOU)

Profesorul setează nume + prenume doar la wizard-ul inițial — nu îl poate edita după. Adaug un editor în `TeacherClassesTab.tsx` (la început, înainte de `ClassManager`):

- Card cu "Numele tău în catalog" + valoarea curentă (`display_name` din `profiles`)
- Buton creion → expandează 2 inputuri (Nume, Prenume) cu Salvează/Anulează
- La salvare: `UPDATE profiles SET last_name, first_name, display_name = "Nume Prenume" WHERE user_id = auth.uid()`
- Hint mic: "🔒 Vizibil doar elevilor din clasele tale"
- Se afișează doar când `selectedClassId` e null (în lista de clase, nu în detaliul unei clase)

### 5. Clarificare UX: "Numele din aceste două taburi apare doar în relația profesor-elev"

Adaug o notă explicativă mică sub editorul de nume catalog (atât la elev cât și la profesor):

- Elev: deja există "🔒 Vizibil doar profesorului tău" (linia 281) ✓
- Profesor (nou): "🔒 Vizibil doar elevilor din clasele tale"

Astfel, în public (clasamente, profile) apare **nickname-ul**, iar în relația profesor↔elev (catalog clasă, rezultate teste) apare **display_name** (Nume Prenume).

### Fișier modificat (1)

- `src/components/account/TeacherClassesTab.tsx` — adaug card editor nume catalog la început

### Comportament neschimbat

- DB: nu sunt schimbări de schemă; coloanele `last_name`, `first_name`, `nickname` există deja
- Locurile unde apare numele profesor↔elev (`ClassDetail`, `TestResults`, `ClassAnalytics`) folosesc deja `profile.display_name` care se actualizează automat