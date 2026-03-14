

# Sistem de Nivele cu Denumiri și Avatar Șarpe

## Ce construim
Un sistem vizual de progresie în cardul de profil de pe homepage:
- **Denumiri unice per nivel** (Ou → Baby Python → ... → Master of Python)
- **Emoji/avatar de șarpe** care crește la fiecare 3 niveluri (ou mic → șarpe mare)
- **Bară de progres interactivă** — la tap/click deschide un dialog/sheet cu tot drumul de la Lvl 1 până la Master of Python

## Denumiri și avataruri propuse

| Nivel | Denumire | Avatar |
|-------|----------|--------|
| 1 | Oul Misterios | 🥒 (ou) |
| 2-3 | Baby Python Lvl 1-2 | 🐣 |
| 4-6 | Little Snake | 🐍 (mic) |
| 7-9 | Code Crawler | 🐍 |
| 10-12 | Script Serpent | 🐍 |
| 13-15 | Loop Viper | 🐍 |
| 16-18 | Data Cobra | 🐍 |
| 19-21 | Algorithm Anaconda | 🐍 |
| 22-24 | Recursion King | 🐍 |
| 25+ | Master of Python | 👑🐍 |

Avatarurile cresc vizual la fiecare 3 niveluri (dimensiunea emoji-ului/containerului crește).

## Plan tehnic

### 1. Creare `src/data/levels.ts`
- Array cu definițiile nivelurilor: `{ minLevel, name, emoji, scale }`
- Funcție `getLevelInfo(level)` → returnează denumirea și emoji-ul corespunzător
- Scala crește la fiecare 3 niveluri (de la 32px la 64px+)

### 2. Creare `src/components/LevelRoadmap.tsx`
- Dialog/Sheet care se deschide la tap pe bara de progres
- Afișează tot drumul: toate nivelurile cu denumiri, emoji-uri, și care e nivelul curent
- Design vertical timeline/roadmap
- Nivelul curent evidențiat, cele viitoare ușor estompate

### 3. Editare `src/pages/Index.tsx` — cardul de profil
- Înlocuiește emoji-ul static 🐍 cu avatar-ul dinamic bazat pe nivel
- Înlocuiește textul "Pythonist" cu denumirea nivelului curent
- Face bara de progres clickabilă → deschide LevelRoadmap
- Containerul avatar-ului crește vizual cu nivelul

### 4. Editare `src/data/courses.ts`
- Fără modificări la logica XP (100 XP per nivel rămâne)

## Fișiere
- **Creare** `src/data/levels.ts`
- **Creare** `src/components/LevelRoadmap.tsx`
- **Editare** `src/pages/Index.tsx`

