# Protejarea soluției la editarea problemelor din Bancă + afișarea soluției propuse

## Ce am verificat

- Editorul din Bancă încarcă exercițiile prin funcția securizată `get_eval_exercises_for_teacher`, care returnează inclusiv coloana `solution`, iar la salvare trimite soluția din formular. În baza de date, toate cele 59 de probleme din Bancă au în acest moment soluție și cazuri de test completate — deci nu există pierderi existente de date acolo.
- Riscul real de ștergere e la salvare: dacă din orice motiv formularul pornește cu soluția goală (încărcare parțială, item deschis dintr-o listă cachetată) sau dacă tipul exercițiului e schimbat din „Problemă" în alt tip, salvarea scrie `solution = null` peste soluția existentă, fără avertisment.
- În lista de exerciții din Bancă soluția nu e vizibilă deloc; ea apare doar dacă intri în modul de editare al problemei.

## Ce voi face

1. **Soluția nu se mai poate pierde accidental**
   - La deschiderea unei probleme în editare, soluția și cazurile de test se recitesc direct din baza de date (nu din lista cachetată), ca formularul să pornească mereu cu datele reale.
   - La salvare, dacă tipul rămâne „Problemă" și câmpul soluție e gol, salvarea e blocată cu mesaj clar (comportament deja existent) — în plus, nu se mai trimite niciodată o valoare goală peste o soluție existentă.
   - Dacă tipul unui exercițiu se schimbă din „Problemă" în alt tip (ceea ce ar șterge soluția și testele), apare o confirmare explicită înainte de salvare.
   - Protecție la nivel de bază de date: un declanșator pe tabela exercițiilor din Bancă păstrează soluția și cazurile de test existente dacă o actualizare ar încerca să le golească pentru un item rămas de tip „Problemă".

2. **Soluția propusă, vizibilă și în afara modului de editare**
   - În lista de exerciții din Bancă, fiecare problemă primește o secțiune pliabilă „Soluție propusă" care arată codul (monospațiat) și numărul de cazuri de test, fără să intri în editare.
   - În formularul de editare, secțiunea „Soluție" primește o etichetă mai clară („Soluție propusă (rulabilă)") și rămâne lângă butonul „Rulează soluția", ca să poți verifica imediat codul afișat.

## Detalii tehnice

- `src/components/admin/EvalBankEditor.tsx`:
  - la `onStartEdit` pentru exercițiu: apel `supabase.rpc("get_eval_exercises_for_teacher", { p_ids: [id] })` și inițializarea formularului din rândul proaspăt (fallback pe rândul din listă dacă apelul eșuează, cu toast de avertizare);
  - în `handleSave`: dacă `exercise?.type === "problem"` și `type !== "problem"` → `AlertDialog` de confirmare; nu se trimit `solution`/`test_cases` goale când itemul rămâne `problem`;
  - în `ExercisesList`: bloc pliabil read-only cu `solution` + rezumat `test_cases` pentru itemii de tip `problem`.
- Migrație: funcție trigger `BEFORE UPDATE ON public.eval_exercises` care, când `NEW.type = 'problem'`, face `NEW.solution = COALESCE(NULLIF(btrim(NEW.solution), ''), OLD.solution)` și păstrează `OLD.test_cases` dacă `NEW.test_cases` e null/gol. Fără modificări de schemă sau de politici de acces.
