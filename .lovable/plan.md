

# 1. Ștergere logică Fixare + 2. Clasament pe oraș

## Partea 1: Eliminare lecții de Fixare generate programatic

### Ce se schimbă

Din `src/hooks/useChapters.ts`:
- Ștergem funcțiile `transformExercise` și `addFixareLessons` (~100 linii)
- Eliminăm apelul `addFixareLessons(rawChapters)` din `fetchChapters()` — returnăm direct `rawChapters`
- De acum, toate lecțiile (inclusiv cele de fixare) vor fi gestionate exclusiv din panoul admin și stocate în DB

### Fișier afectat
- `src/hooks/useChapters.ts` — eliminare ~100 linii de cod (funcțiile de generare + apelul lor)

---

## Partea 2: Clasament pe oraș (tab nou)

### Cum funcționează
- Lista de școli (`src/data/schools.ts`) conține deja proprietatea `city` pentru fiecare liceu
- Când utilizatorul are un liceu selectat, putem determina orașul din lista locală
- Filtrăm clasamentul pentru toți utilizatorii care au `school_id` setat pe un liceu din același oraș

### Modificări în `src/pages/LeaderboardPage.tsx`
- Adăugăm tab-ul `"city"` lângă „Național" și „Liceu"
- Type `Tab = "national" | "school" | "city"`
- Import `schools` din `@/data/schools` pentru a mapa `school_id → city`
- La filtrare pe tab `"city"`:
  1. Găsim orașul utilizatorului: `schools.find(s => s.id === userSchool)?.city`
  2. Găsim toate `school_id`-urile din același oraș: `schools.filter(s => s.city === userCity).map(s => s.id)`
  3. Filtrăm entries unde `school_id` e în lista de mai sus
- Header cu 3 butoane: 🌍 Național | 🏫 Liceu | 🏙️ Oraș
- Mesaj informativ dacă nu are liceu selectat (similar cu cel existent)

### Fișiere modificate
1. `src/hooks/useChapters.ts` — eliminare Fixare
2. `src/pages/LeaderboardPage.tsx` — tab nou „Oraș"

