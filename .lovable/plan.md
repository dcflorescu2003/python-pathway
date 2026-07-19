## Context

Ce există deja în `TakeTestPage.tsx` + `useTests.ts`:
- Draft local (localStorage) + draft server (`save_submission_draft`) la 30s și pe `visibilitychange`.
- Autosubmit pe `blur`/`visibilitychange`/`pause`/`native_focus_lost` + poll `App.getState()`.
- `anti_cheat_mode` (strict/normal/relaxed) cu grace 1s/3s/5s + `leave_count`.
- `require_fullscreen` cu gate + blocare shortcut-uri + `contextmenu` blocat.
- `beforeunload` cu beacon + prompt nativ „Leave site?".
- `popstate` + Capacitor `backButton` + dialog de confirmare la ieșire.
- Alocare determinist a numerelor și variantelor (A/B) prin RPC.
- Profesorul poate „Permite continuarea" pentru submisii întrerupte.

Propun 3 pachete de măsuri, poți alege ce se implementează. Nimic nu se aplică fără aprobarea ta.

---

## Pachet A — Robustețe conexiune (offline / rețea instabilă)

Scop: elevul să nu piardă răspunsurile dacă pică internetul și să poată reintra continuând cu timpul rămas.

1. **Banner „Offline" în timpul testului**
   - Ascult `navigator.onLine` + `online`/`offline` events; când e offline, apare un banner sticky discret sus („Fără conexiune — răspunsurile se salvează local și vor fi trimise la reconectare").
   - Ascunde temporar butonul „Trimite" ca să nu obțină un submit parțial din greșeală, ori îl marchează „Se așteaptă conexiunea".

2. **Coadă de sync pentru draft**
   - Draft-ul serverul e trimis fire-and-forget; dacă apelul eșuează (fetch throw / status ≥ 500), reținem timestamp-ul ultimului draft nesincronizat și îl reîncercăm cu backoff (5s, 15s, 30s, 60s) până reușește sau se resetează pe următoarea salvare programată.
   - La reconectare (`online` event) forțăm un flush imediat.

3. **Submit rezilient la rețea proastă**
   - `handleSubmit` intră deja în `submitInFlightRef`; adăugăm retry (3 încercări, backoff 2s/5s/10s) pe erori de rețea/5xx înainte să afișăm eroarea. Pe eroare finală, păstrăm `submitInFlightRef=false` și lăsăm butonul reactivat.
   - Beacon-ul pe `beforeunload` rămâne ca ultima linie de apărare.

4. **Continuare cu timp rămas la reintrare**
   - Deja există `status='in_progress'` + `started_at`. Verificăm că la reintrare `timeLeft` se recalculează din `started_at + time_limit_minutes - now()` (nu din localStorage) și nu din valoarea salvată. Adaug un log clar în consolă + toast „Continuare test — timp rămas: MM:SS".
   - Dacă `time_limit` a expirat cât timp elevul era offline, la reintrare se declanșează autosubmit pe motiv „time_expired_offline" folosind draftul din DB.

---

## Pachet B — Reducerea ieșirilor accidentale (mobil + web)

Scop: nicio ieșire nesolicitată să nu piardă progresul sau să marcheze testul întrerupt fără intenție.

5. **Screen wake lock**
   - `navigator.wakeLock.request('screen')` cât timp testul e activ, cu re-acquire pe `visibilitychange → visible`. Previne blocarea automată a ecranului care pe unele device-uri e interpretată ca „leave".

6. **Grace crescută pentru „interruption" scurte**
   - Peste `leaveGraceMs`, adaug o fereastră de „auto-recover": dacă elevul revine în ≤10s (normal) / ≤5s (strict) și nu s-a atins limita `leave_count`, testul se REIA în loc să facă autosubmit. `leave_count` crește cu 1 și profesorul vede totul în roster.
   - Doar peste un prag configurabil per test (`max_interruptions`, default 3 pe „normal") se face autosubmit.

7. **Dialog dedicat „Test întrerupt — reia"**
   - Când user-ul revine după un leave detectat dar sub prag, apare un dialog în-app „Continuă testul" cu focus trap, care re-solicită fullscreen (dacă e cazul) înainte să reia.

8. **Blocare navigație internă**
   - Extind interceptorul `popstate` pentru orice `<Link>` intern (guard React Router via `useBlocker` / `unstable_usePrompt`). Astfel un tap accidental pe logo/bottom-nav trece prin același `AlertDialog`.

9. **iOS Safari „X" pe tab**
   - `beforeunload` are prompt limitat pe iOS. Adaug pe iOS PWA un dialog custom vizibil când `pagehide` cu `persisted=true` — la revenire, avertisment „Ai închis tabul; testul a fost pus pe pauză". Combinat cu draft server, permite reluarea.

---

## Pachet C — Anti-fraudă (fără să frustrăm elevii cinstiți)

Scop: crește costul fraudei și oferă profesorului evidențe pentru revizuire, fără să blocăm învățarea legitimă.

10. **Log complet de evenimente per submisie**
    - Tabel nou `test_submission_events (submission_id, event_type, reason, occurred_at, meta jsonb)`. Loghez: `leave`, `return`, `paste`, `copy`, `right_click`, `fullscreen_exit`, `network_offline`, `network_online`, `answer_change`, `focus_lost`.
    - Profesorul vede un timeline în `TestResults` cu ⚠️ pentru evenimente suspecte.

11. **Blocare copy/paste pe câmpurile de răspuns**
    - `onPaste` blocat pe input/textarea/code editor + toast „Lipirea nu e permisă în teste". `onCopy` blocat pe enunț (nu poate copia întrebarea în alt device).
    - Opțional per test: `disable_paste`, `disable_copy` (default true în modul strict).

12. **Detecție „paste explozie"**
    - Dacă un răspuns text/code crește cu >50 caractere într-un keystroke fără eveniment `paste` (posibil autofill/autotype), loghez event `bulk_input`. Nu blochează, doar semnalează în timeline.

13. **Randomizare ordine întrebări per elev**
    - Deja există variante A/B. Adaug flag `shuffle_items` per test: ordinea itemelor derivată deterministic din `(submission_id)` — profesorul vede același test, elevul vede o permutare stabilă.

14. **Randomizare ordine opțiuni la quiz**
    - Similar, pentru `quiz` opțiunile se permută stabil per submisie. Reduce copiat între vecini.

15. **Server-side check la submit**
    - `grade-submission` verifică:
      - fiecare `test_item_id` aparține testului asignat;
      - dimensiunea `answer_data` per item ≤ 20KB (protecție DoS/log spam);
      - respinge submisiile duplicate (`status='submitted'` deja).
    - Există deja parțial; consolidez și adaug log.

16. **Fingerprint device / IP schimbat**
    - La `save_submission_draft` capturez `user_agent` + IP (din header edge) și loghez schimbare între draft-uri. Elevul care începe pe telefon și continuă pe PC apare cu badge „Multiple devices" pentru profesor.

17. **Restricție „un cont, o singură sesiune activă"**
    - `test_submissions` deja unic pe `(assignment_id, student_id)`. Adaug detecție: dacă același `submission_id` primește draft-uri din 2 tab-uri simultan (2 valori diferite la 30s), se marchează `multi_tab_detected`.

---

## Ce recomand să implementăm întâi (prioritate)

Dacă vrei să mergem tranșat, propun ordinea:

1. **Pachet A #1, #2, #4** — cel mai frecvent scenariu real (rețea la școală).
2. **Pachet B #5, #8** — wake lock + guard React Router (rezolvă majoritatea „am dat click pe logo").
3. **Pachet C #10, #11, #13** — log + blocare paste + shuffle. Vizibil și eficient, cost mic.

Restul (retry submit, multi-device, multi-tab, custom iOS dialog) rămân opționale, în funcție de câți profesori raportează probleme.

---

## Detalii tehnice (pentru referință)

- Toate flag-urile noi (`shuffle_items`, `max_interruptions`, `disable_paste`, `disable_copy`) sunt coloane pe `tests` cu default sigur.
- `test_submission_events` are RLS: elev poate INSERT doar pentru propria submisie; profesor poate SELECT doar pentru testele lui.
- Wake Lock, `navigator.onLine`, `useBlocker` — toate zero dependențe noi.
- Zero modificări la fluxul de grading existent.

Confirmă ce pachet(e) implementăm și pornesc.
