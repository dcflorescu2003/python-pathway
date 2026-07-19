## Problemele confirmate

**1) Timerul nu se vede pe mobil (dispare în dreapta)**
În `src/pages/TakeTestPage.tsx` (linia 715), header-ul folosește `<div className="flex-1">` pentru titlu cu `truncate`, dar fără `min-w-0`. În flexbox, un copil `flex-1` cu text lung nu se trunchiază corect fără `min-w-0` și împinge cronometrul în afara viewport-ului pe 360px. Titluri lungi de test = timer invizibil în dreapta.

**2) Back accidental pe telefoane fără bară de butoane (gest swipe-from-edge)**
În timpul testului nu există nicio interceptare a navigării `popstate`. Butonul „Înapoi" din header navighează direct la `/` fără confirmare, iar gestul de swipe-back al sistemului iese instant din test. Pe Android, back-ul hardware/gest nu e prins deloc — Capacitor `App.backButton` nu e ascultat aici.

**3) Notificarea nu declanșează autosubmit**
Când tragi notification shade pe Android, WebView-ul NU emite `visibilitychange`, `blur`, sau `pagehide` — de asta există deja bridge-ul `pyro:native_focus_lost` din `MainActivity.onWindowFocusChanged`. Însă în `TakeTestPage`:
- `focusPollInterval` cheamă `document.hasFocus()`, care în WebView Android returnează adesea `true` chiar cu shade tras → apelează `cancelLeave()` și anulează detecția;
- listener-ul `pyro:native_focus_gained` de la Capacitor `resume` poate ajunge înainte ca `leaveGraceMs` (3s pe „normal") să expire dacă user-ul face swipe pe shade fără să-l țină deschis.

## Modificări (doar `src/pages/TakeTestPage.tsx`)

### Fix 1 — Timer vizibil
Header-ul (~linia 710-724): 
- adaug `min-w-0` pe wrapper-ul `<div className="flex-1">` ca `truncate` să funcționeze;
- adaug `shrink-0` pe blocul cu Clock/timp;
- pun titlul + counter pe același rând cu `truncate` și forțez ca badge-urile „Nr.X / Varianta A" să nu împingă timer-ul (deja sunt pe rând separat, ok).

### Fix 2 — Protecție împotriva ieșirii accidentale
- Butonul „ArrowLeft" din header și orice `navigate("/")` inițiat de user (nu de autosubmit) trec printr-un `AlertDialog` de confirmare („Ești sigur? Testul va fi marcat ca întrerupt.").
- Adaug `history.pushState` la montare + listener `popstate` care blochează back-gestul: reface state-ul și afișează același dialog de confirmare.
- Pe native: import `@capacitor/app` și ascult `App.addListener("backButton", …)` pentru a preveni back-ul hardware/gest cât timp testul e activ.
- Toate acestea sunt dezactivate după `submitted === true`.

### Fix 3 — Autosubmit fiabil la notification shade
- Elimin `document.hasFocus()` din `focusPollInterval` (nu e sursă de adevăr în WebView) și îl înlocuiesc cu un poll pe starea Capacitor `App.getState()` la fiecare 2s: dacă `!isActive` → `triggerLeave("app_inactive_poll")`.
- Nu mai cancelLeave imediat pe `pyro:native_focus_gained` / `App resume`: adaug o mică întârziere (200ms) și verific că focus-ul e stabil (a rămas activ >500ms) înainte să anulez timeout-ul; astfel un pull-and-release rapid pe shade tot declanșează autosubmit după `leaveGraceMs`.
- Păstrez ascultătorii existenți pentru `pyro:native_focus_lost`, `appStateChange`, `pause`.

## Ce nu se schimbă
- Regulile RLS, RPC-urile, `useTests.ts`, schema DB, celelalte pagini — nemodificate.
- `anti_cheat_mode` (strict/normal/relaxed) și pragurile de grație rămân aceleași; doar detecția devine mai fiabilă pe mobil.
- MainActivity.java rămâne cum e (deja emite corect focus lost/gained).
