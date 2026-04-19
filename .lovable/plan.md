

## Plan: Rafinări UI pe pagina capitolului (`ChapterPage.tsx`)

### 1. Afișare scor sub cerc
Acum: `★ {score}/{lesson.exercises.length}` (unde `score` este deja procent — bug vizual: arată „85/10").

Schimbare:
- Dacă `score === 100` → afișez `🏆 100%` (sau ⭐ — aleg 🏆 trofeu, mai festiv)
- Altfel → afișez `★ {score}%`

### 2. Diferențiere vizuală lecții completate vs curentă vs viitoare

**Stare actuală:** toate lecțiile (completate + curentă) folosesc aceeași culoare vie HSL. Doar `isCurrent` are `animate-pulse-glow`.

**Schimbări:**
- **Completate** (`isCompleted`): opacity redusă (~`opacity-50`) + saturație scăzută în culoarea HSL (de la `70%` la `35%`) → aspect „fade/finalizat"
- **Curentă** (`isCurrent`): rămâne vie + `animate-pulse-glow` + scale `1.1` (cerc mai mare: `h-20 w-20` în loc de `h-[72px] w-[72px]`) + glow mai intens prin `shadow-[0_0_24px_color]`
- **Blocate**: rămân ca acum (galben fade)

### 3. Mesaj de felicitare la capitol terminat

După `chapter.lessons.map(...)`, adaug:
- Verific: `const allDone = chapter.lessons.every(l => progress.completedLessons[l.id]?.completed)`
- Dacă `allDone`:
  - Card cu trofeu 🏆, titlu „Capitol terminat!", mesaj motivațional
  - Buton „Mergi la capitolul următor" → găsesc `nextChapter = chapters.find(c => c.number === chapter.number + 1)` și navighez la `/chapter/${nextChapter.id}`
  - Dacă nu există capitol următor → mesaj „Ai terminat toată programa!" + buton „Înapoi la harta"

### Fișier modificat
- `src/pages/ChapterPage.tsx` (singur)

### Nu modific
- Logica de progres / unlocking
- `LevelRoadmap` sau alte componente
- Culorile capitolelor (păstrez gradient HSL bazat pe `chapter.color`)

