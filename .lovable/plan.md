

# Plan de modificări

## 1. Deblocarea capitolelor fără lecții de practică

Lecțiile de practică (cele cu titlu care începe cu "Practică:") nu vor mai fi obligatorii pentru deblocarea capitolului următor. Logica de blocare din `Index.tsx` va exclude lecțiile de practică din calculul procentului necesar (50%).

**Fișiere**: `src/pages/Index.tsx`

## 2. Ascunderea Editorului din navigare

Eliminăm tab-ul "Editor" din bara de jos (`BottomNav.tsx`). Pagina `/admin` rămâne funcțională și accesibilă doar prin URL direct. Se elimină și `/admin` din lista `MAIN_PAGES` din `App.tsx` pentru ca pagina de admin să nu mai aibă bottom nav.

**Fișiere**: `src/components/layout/BottomNav.tsx`, `src/App.tsx`

## 3. Selectare liceu pe prima pagină + clasament pe liceu/național

- Adăugăm un selector de liceu pe pagina principală (`Index.tsx`), stocat în `localStorage`
- Utilizatorul poate alege dintr-o listă predefinită sau apăsa "Adaugă liceul tău" (care afișează un formular cu un mesaj de confirmare — fără email real deocamdată, doar un `toast` care spune că cererea a fost trimisă)
- Creăm un fișier nou `src/data/schools.ts` cu o listă goală inițială pe care o poți popula
- Pe pagina de clasament adăugăm tab-uri "Liceu" / "Național"
- Mock data va fi etichetată cu licee random pentru demo

**Fișiere**: `src/data/schools.ts` (nou), `src/pages/Index.tsx`, `src/pages/LeaderboardPage.tsx`, `src/hooks/useProgress.ts`

## 4. Font mai mare și mai deschis la explicații

- `ChapterTheoryPage.tsx`: textul de conținut de la `text-base text-muted-foreground` → `text-base text-foreground/80 leading-relaxed` (mai deschis la culoare)
- Toate exercițiile: explicațiile din feedback-ul de jos (`LessonPage.tsx`) de la `text-xs text-muted-foreground` → `text-sm text-foreground/70`

**Fișiere**: `src/pages/ChapterTheoryPage.tsx`, `src/pages/LessonPage.tsx`

## 5. Butoane "Continuă" și "Verifică" mai mari

- Toate butoanele "Verifică" din exerciții: adăugăm `h-14 text-lg font-bold`
- Butonul "Continuă" din feedback-ul din `LessonPage.tsx`: la fel `h-14 text-lg font-bold`

**Fișiere**: `src/components/exercises/QuizExercise.tsx`, `src/components/exercises/FillExercise.tsx`, `src/components/exercises/OrderExercise.tsx`, `src/components/exercises/TrueFalseExercise.tsx`, `src/pages/LessonPage.tsx`

## 6. Versiune plătită (Google Play billing) — doar UI

Deoarece plățile vor fi gestionate prin Google Play billing (in-app purchase), implementarea efectivă necesită cod nativ Kotlin/Java în proiectul Android. Ce putem face acum:

- Adăugăm un state `isPremium` în `useProgress` (stocat în localStorage)
- Creăm o pagină/dialog "Premium" cu beneficiile (inimi nelimitate)
- Adăugăm un buton "💎 Premium" pe pagina principală
- Când `isPremium` este true, viețile nu se pierd
- Activarea efectivă va fi făcută din Android Studio cu Google Play Billing Library

**Fișiere**: `src/hooks/useProgress.ts`, `src/pages/Index.tsx`, `src/pages/LessonPage.tsx`, `src/components/PremiumDialog.tsx` (nou)

---

**Total**: ~12 fișiere modificate/create. Nicio dependență nouă necesară.

