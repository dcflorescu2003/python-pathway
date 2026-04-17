

## Plan

Reordonez tab-urile clasamentului și adaug un tab nou "Clasă" vizibil doar pentru elevii înscriși într-o clasă.

### Ordine nouă tab-uri
1. **Clasa ta** (doar dacă `isClassMember`) — 👥
2. **Liceu** — 🏫
3. **Oraș** — 🏙️
4. **Național** — 🌍

### Modificări în `src/pages/LeaderboardPage.tsx`

1. **Tip extins**: `type Tab = "class" | "school" | "city" | "national"`
2. **Detectare clasă**: query nouă care preia clasa activă a elevului din `class_members` + lista `user_id`-urilor colegilor din aceeași clasă
3. **Tab default**:
   - Dacă elevul e într-o clasă → `"class"`
   - Altfel → `"school"` (comportament actual)
4. **Filtrare query top15 + user-rank** pentru tabul `"class"`: `.in("user_id", classmateIds)`
5. **Render**: tab "Clasă" apare condiționat la început, doar când `isClassMember === true`. Pentru tabul Clasă nu mai e nevoie de selectorul de liceu.
6. **Header**: afișează numele clasei când tabul activ e "Clasă"

### Detalii tehnice
- Folosesc `useTeacher` / query directă pe `class_members` pentru a obține `class_id` activ al elevului și lista membrilor
- Limită top: păstrez 15
- Cache key React Query include `tab` și `classId` ca să nu se amestece datele
- Tabul "Clasă" nu necesită `userSchool`, deci ascund prompt-ul de selectare liceu când e activ

### Fișier modificat
| Fișier | Schimbare |
|--------|-----------|
| `src/pages/LeaderboardPage.tsx` | Tab nou "Clasă", reordonare, query pe membrii clasei, default tab dinamic |

