

## Plan: Îmbunătățiri tab Elev — pas obligatoriu nume catalog, provocări active, istoric cu detalii

### Ce se schimbă

**1. Dialog îmbunătățit la înscrierea în clasă (`AuthPage.tsx`)**

Dialogul existent de nume (`showNameDialog`) devine obligatoriu întotdeauna — nu doar când `display_name` lipsește. Fluxul:
- Elevul introduce codul clasei → se deschide dialogul cu numele din catalog
- Sub câmpul de nume complet, apare o notă: „Acest nume va fi vizibil doar profesorului tău"
- Numele se salvează ca `display_name` pe profil
- Abia după confirmare se face insert-ul în `class_members`

**2. Refactorizare completă `StudentTab.tsx`**

Structura nouă a tab-ului Elev:

```text
┌─ Clasa ta ─ [Părăsește] ──────────┐
│ Nume catalog: Andrei Popescu [✏️]  │
├────────────────────────────────────┤
│ 🔥 Provocări active (2)           │
│  ┌ Lecție: Variabile  [Începe →] ┐│
│  └ Problemă: FizzBuzz [Începe →] ┘│
├────────────────────────────────────┤
│ 📜 Istoric                        │
│  ── Provocări (3) ──              │
│  ✅ Lecție: Bucle (completată)     │
│  ✅ Problemă: Suma (completată)    │
│  ── Teste (2) ──                  │
│  📝 Test Variabile: 85/100 [→]    │
│  ❌ Test Bucle: Expirat            │
└────────────────────────────────────┘
```

- **Nume catalog editabil**: sub numele clasei, afișează `display_name` cu buton de editare inline
- **Provocări active**: provocările pe care elevul NU le-a completat încă. Buton „Începe" care navighează la `/lesson/{id}` sau `/problem/{id}`
- **Determinarea completării**: pentru lecții — verificăm în `completed_lessons`; pentru probleme — verificăm tot în `completed_lessons` (sau alt mecanism existent)
- **Istoric provocări**: provocările completate, cu indicatorul ✅
- **Istoric teste**: testele cu submisie completată. Click pe un test completat deschide un dialog/expandable cu:
  - Scorul total
  - Feedbackul profesorului (din `test_answers.feedback`)
  - Lista itemilor cu punctajul obținut vs maxim

**3. Queries noi în `StudentTab.tsx`**

- Query `completed_lessons` pentru user → determină care provocări de tip lecție sunt completate
- Query `test_answers` cu join pe `test_items` pentru submisiile completate → afișare detalii greșeli și feedback
- Reutilizăm hook-ul `useChallenges` existent care aduce deja titlurile provocărilor

### Fișiere modificate

| Fișier | Ce se schimbă |
|--------|---------------|
| `src/pages/AuthPage.tsx` | Dialogul de nume devine obligatoriu la fiecare înscriere în clasă |
| `src/components/account/StudentTab.tsx` | Refactorizare completă: secțiuni active/istoric, navigare, detalii teste |

Nu sunt necesare migrări SQL — toate datele există deja în tabelele `completed_lessons`, `test_submissions`, `test_answers`.

