## Limite de teste salvate per tip de profesor

### Reguli noi (înlocuiesc limita actuală 10/lună)
| Tip profesor | Limită teste salvate (total activ) |
|---|---|
| Neverificat (`unverified` / `pending`) | **50** |
| Verificat (`verified`, fără AI) | **100** |
| Profesor AI (`isTeacherPremium`) | **150** |

Cumulativ pe teste existente — ștergerea unui test eliberează loc imediat.

### Modificări tehnice

**1. `src/lib/teacherLimits.ts`** (fișier nou)
- Constante: `TEACHER_TEST_LIMITS = { unverified: 50, verified: 100, ai: 150 }`.
- Helper `getTestLimit({ teacherStatus, isTeacherPremium })` → întoarce `{ limit, tier: 'unverified' | 'verified' | 'ai' }`.

**2. `src/components/teacher/TestBuilder.tsx`**
- Înlocuiește `MAX_TESTS_PER_MONTH = 10` și logica `testsThisMonth` cu `totalTests = allTests.length` și `limit` din helper.
- `canCreateMoreTests = isEditing || totalTests < limit`.
- La submit, dacă se atinge limita → afișează `TestLimitReachedDialog` (nu doar toast).
- Badge-ul existent „Teste luna aceasta" devine „Teste salvate: X / Y" (vizibil pentru toți profesorii, nu doar AI Premium), colorat:
  - verde la <80%, galben la 80–95%, roșu la ≥95%.

**3. `src/components/teacher/TestManager.tsx`**
- În header lângă „Testele mele (N)" adaugă badge `X / Y teste salvate`.
- Înainte de butonul „Creează test nou", verifică limita:
  - Dacă atinsă → click-ul deschide `TestLimitReachedDialog` în loc să cheme `onCreateTest`.
  - Buton vizual „dezactivat" (clasă muted) dar rămâne clickabil ca să se vadă dialogul.
- Toast proactiv (o singură dată per sesiune, gardat cu `useRef`):
  - la 80% — „Mai ai N teste până la limită."
  - la 95% — „Aproape ai atins limita ({tier_label})."

**4. `src/components/teacher/TestLimitReachedDialog.tsx`** (component nou)
- Dialog modal cu:
  - Titlu: „Ai atins limita de {limit} teste salvate".
  - Descriere adaptată tier-ului:
    - unverified → „Verifică-ți contul de profesor pentru a debloca 100 teste, sau șterge teste vechi."
    - verified → „Treci la Profesor AI pentru 150 teste salvate, sau șterge teste vechi."
    - ai → „Ai atins maximul. Șterge teste vechi pentru a face loc."
  - Buton primar: `Șterge teste vechi` → închide dialogul (utilizatorul e deja pe `TestManager`).
  - Buton secundar (doar non-AI): `Upgrade Profesor AI` → deschide `TeacherPremiumDialog`.

**5. `src/components/TeacherPremiumDialog.tsx`**
- În lista de beneficii adaugă rândul: „**150 teste salvate** (față de 100/50)".

**6. `src/components/account/TeacherTestsTab.tsx`**
- Pasează `teacherStatus` la `TestManager` (pentru calcul limită) — `TestManager` va folosi `useSubscription` direct pentru `isTeacherPremium`.

### Decizii / clarificări
- **Limita actuală AI = 10 teste/lună** (`MAX_TESTS_PER_MONTH`) este eliminată complet și înlocuită cu plafonul total 150. AI Premium rămâne cu `MAX_AI_ITEMS_PER_TEST = 3` neschimbat (asta e altă limită, per test).
- `pending` profesori sunt tratați ca `unverified` (50 teste).
- Counter-ul apare în 1 loc principal (TestManager header) + badge în TestBuilder. TeacherPremiumDialog menționează doar ca beneficiu.
- Avertizările proactive la 80% și 95% sunt toast-uri o singură dată per montare.
