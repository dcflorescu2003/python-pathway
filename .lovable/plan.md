

## Plan: Reorganizare pagina Cont cu taburi și wizard profesor/elev

### Arhitectura nouă

Pagina de Cont (`AuthPage.tsx` → `AccountView`) devine un layout cu **taburi** care se adaptează dinamic la tipul de utilizator:

```text
┌──────────────────────────────────┐
│  ← Contul meu                    │
├──────────────────────────────────┤
│  Logo + Nickname (editabil)      │
│  email                           │
│  Premium / Free badge            │
├──────────────────────────────────┤
│  [Profil]  [Elev*]  [Clase**]  [Teste**] │
├──────────────────────────────────┤
│  Conținut tab activ              │
│                                  │
│                                  │
├──────────────────────────────────┤
│  Politică | Deconectare | Ștergere│
└──────────────────────────────────┘

* Tab "Elev" apare doar dacă e înscris într-o clasă
** Taburile "Clase" și "Teste" apar doar pentru profesori
```

### Tab-uri per rol

**Toți utilizatorii — Tab „Profil":**
- Statistici (lecții, XP, streak, probleme)
- Abonament (Premium / Free + buton upgrade)
- Cupon de activare
- Buton „Devino Profesor" (wizard) SAU „Dezactivează modul profesor"
- Alătură-te unei clase (dacă nu e profesor și nu e deja în clasă)

**Elev înscris într-o clasă — Tab „Elev":**
- Numele clasei + buton „Părăsește"
- Lista provocărilor primite de la profesor
- Testele atribuite cu statusul (activ / completat / expirat) și scorul obținut

**Profesor — Tab „Clase":**
- Conținutul actual din `TeacherPage` → secțiunea Clase (`ClassManager` + `ClassDetail`)
- Coduri referral (pentru verificați)
- Banner verificare / pending

**Profesor — Tab „Teste":**
- Conținutul actual din `TeacherPage` → secțiunea Teste (`TestManager` + `TestBuilder`)

**Footer (sub taburi, pentru toți):**
- Politica de confidențialitate
- Deconectare
- Ștergere cont
- Panou Admin (doar admini)

### Wizard „Devino Profesor"

Înlocuiește apelul direct la `request_teacher_status()` cu un wizard în 3 pași (modal/inline):

1. **Selectează liceul** — reutilizăm componenta de căutare din `SchoolOnboarding`
2. **Numele complet** — câmp obligatoriu (nume din catalog, vizibil doar admin-ului la verificare)
3. **Confirmare** — mesaj: „Pentru a beneficia de toate avantajele contului de profesor, trebuie să treci prin procesul de verificare. Poți începe oricând din pagina de cont." → buton „Devino Profesor"

La confirmare: apelăm `request_teacher_status()` + salvăm `school_id` și `display_name` pe profil.

### Nickname vs Nume complet

- Câmpul existent `display_name` devine **numele complet** (vizibil profesorului și la verificare)
- Adăugăm coloana `nickname` pe `profiles` — afișat public (în clasament, interfață)
- La înscrierea în clasă: se cere numele complet (cum e acum), dar în rest se folosește nickname-ul
- Dacă nickname nu e setat, se afișează display_name ca fallback

### Eliminarea paginii `/teacher`

Conținutul din `TeacherPage.tsx` se mută integral în taburile „Clase" și „Teste" din pagina Cont. Ruta `/teacher` poate fi eliminată sau redirecționată la `/auth`.

### Fișiere modificate

| Fișier | Ce se schimbă |
|--------|---------------|
| `src/pages/AuthPage.tsx` | Refactorizare completă `AccountView` — layout cu taburi, wizard profesor |
| `src/pages/TeacherPage.tsx` | Se elimină (conținut mutat în AuthPage) |
| `src/App.tsx` | Se elimină ruta `/teacher` |
| `src/components/layout/BottomNav.tsx` | Fără schimbări (tab-ul Cont rămâne) |
| Migrare SQL | Adăugare coloană `nickname` pe `profiles` |
| `src/hooks/useProgress.ts` | Eventual expunem nickname pentru afișare |
| `src/pages/LeaderboardPage.tsx` | Afișare nickname în loc de display_name |

### Îmbunătățiri propuse de mine

1. **Nickname obligatoriu la signup** — câmpul „Numele tău" din formularul de înregistrare devine nickname-ul, nu display_name. Așa, din prima zi utilizatorul are un alias public.
2. **Tab „Elev" cu rezultate** — afișăm testele completate cu scorul obținut + provocările rezolvate / nerezolvate, oferind elevului o imagine clară a performanței în clasă.
3. **Wizard profesor reversibil** — dacă dă „Renunță" în wizard, nu se întâmplă nimic; nu se creează statut „unverified" până la confirmarea finală.
4. **Tranziție animată între taburi** — păstrăm stilul existent cu `framer-motion` pentru a menține coerența vizuală.

