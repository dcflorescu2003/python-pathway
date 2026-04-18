

## Diagnostic

Logica există în `src/pages/AuthPage.tsx` (liniile 174-185), dar nu funcționează din cauza unei race condition:

1. La montare: `isTeacher=false`, `isClassMember=false`, `tabInitialized=false` → effect rulează, **niciun branch nu se execută** (ambele condiții false), `tabInitialized` rămâne `false`.
2. Datele se încarcă async în `loadAccountFlags`. Setările `setTeacherStatus` / `setIsClassMember` declanșează re-render → effect rulează din nou → setează tab-ul corect.

**Problema reală**: pentru elevii fără clasă, `isClassMember` rămâne `false` permanent, dar și pentru elevii cu clasă, există o fereastră în care `loadAccountFlags` nu a terminat încă, iar dacă vreun re-render intermediar setează `tabInitialized=true` dintr-o cursă cu `Tabs`-ul Radix care păstrează starea internă, tab-ul nu se mai actualizează vizual.

În plus, `Tabs` din Radix poate ignora schimbarea `value` la prima sincronizare dacă `value` referențiază un `TabsTrigger` care nu era randat la momentul montării (ex: `"classes"` apare doar când `isTeacher=true`).

## Soluție

Înlocuiesc logica fragilă cu:

1. **Flag de loading**: țin minte că datele profil/membership au fost încărcate (`flagsLoaded`).
2. **Inițializare după încărcare completă**: setez `activeTab` o singură dată **după** ce flagurile sunt cunoscute, nu înainte.
3. **Forțare remount Tabs** prin `key` care depinde de `flagsLoaded`, ca Radix să reia starea internă cu `value`-ul corect din prima.

### Modificări în `src/pages/AuthPage.tsx`

```tsx
const [flagsLoaded, setFlagsLoaded] = useState(false);

// în loadAccountFlags, la final:
setFlagsLoaded(true);

// effect inițializare tab:
useEffect(() => {
  if (!flagsLoaded || tabInitialized) return;
  if (isTeacher) setActiveTab("classes");
  else if (isClassMember) setActiveTab("student");
  else setActiveTab("profile");
  setTabInitialized(true);
}, [flagsLoaded, isTeacher, isClassMember, tabInitialized]);

// Tabs cu key care forțează montarea după ce avem datele
<Tabs key={flagsLoaded ? "ready" : "loading"} value={activeTab} onValueChange={setActiveTab} ...>
```

### Fișier modificat
| Fișier | Schimbare |
|--------|-----------|
| `src/pages/AuthPage.tsx` | Flag `flagsLoaded` + inițializare tab după încărcare + `key` pe `Tabs` pentru remount |

