

## Plan: Auto-submit test la părăsirea aplicației (toleranță 1s)

### Comportament
Când elevul părăsește aplicația în timpul unui test, pornește un timer de 1 secundă. Dacă revine în acea secundă, nimic nu se întâmplă. Dacă nu revine, testul se trimite automat.

### Implementare în `src/pages/TakeTestPage.tsx`

**Detectare** (3 surse complementare):
- `document.visibilitychange` → `document.hidden` (web + mobile)
- `window.blur` / `window.focus` (desktop alt-tab)
- `App.addListener('appStateChange')` din `@capacitor/app` (mobile background)

**Logică toleranță**:
- La eveniment de „ieșire” (hidden / blur / `!isActive`) → pornesc `setTimeout(autoSubmit, 1000)` și salvez ID-ul în `timeoutRef`.
- La eveniment de „revenire” (visible / focus / `isActive`) → `clearTimeout(timeoutRef)`.
- `hasSubmittedRef` previne dublu-submit.
- Auto-submit apelează aceeași `handleSubmit()` existentă cu răspunsurile curente.
- Toast: „Test trimis automat — ai părăsit aplicația mai mult de 1 secundă”.

**Avertisment vizibil** deasupra testului:
> ⚠️ Atenție: dacă părăsești aplicația sau schimbi fereastra mai mult de 1 secundă, testul va fi trimis automat.

**Activare**: doar după ce testul a început (`submission` există) și înainte de submit manual.

**Cleanup**: toate listener-ele + `clearTimeout` în `useEffect` cleanup.

### Fișiere modificate

| Fișier | Schimbare |
|---|---|
| `src/pages/TakeTestPage.tsx` | useEffect cu visibility/blur/appStateChange + setTimeout 1s + ref anti-dublu-submit + avertisment vizibil |

