

## Plan: Reparare logică streak — creștere +1 la prima activitate zilnică

### Bug-ul identificat

Cauza principală: în `createDefaultProgress()`, `lastActivityDate` este setat la **data de azi**. Când utilizatorul deschide aplicația pe un device/browser unde nu are date locale salvate (sau localStorage a fost șters):

1. Cloud: `streak=6`, `last_activity_date=2026-04-13` (ieri)
2. Local (default): `streak=0`, `lastActivityDate=2026-04-14` (azi — din `createDefaultProgress`)
3. `mergeProgress()`: ia `lastActivityDate = max(azi, ieri) = azi`, `streak = max(0, 6) = 6`
4. Rezultat: sistemul crede că activitatea de azi a fost deja înregistrată → streak rămâne 6
5. Când `completeLesson` rulează: `prev.lastActivityDate === today` → true → streak nu se incrementează

Practic, progresul local "gol" cu data de azi otrăvește merge-ul și blochează incrementarea streak-ului.

### Soluția

**Fișier: `src/hooks/useProgress.ts`**

1. **`createDefaultProgress()`** — schimb `lastActivityDate` din `getTodayDate()` în `""` (string gol). Un progress default nu ar trebui să pretindă că a existat activitate azi.

2. **`checkStreakExpiry()`** — adaug o verificare: dacă `lastActivityDate` este gol, returnează streak 0 fără eroare.

3. **`mergeProgress()`** — logica de `lastActivityDate` trebuie să ignore valorile goale: dacă una din cele două este goală, o ia pe cealaltă.

4. **`completeLesson()` și `recordActivity()`** — logica de streak devine mai clară:
   - Dacă `lastActivityDate === today` → streak rămâne (deja activitate azi)
   - Dacă `lastActivityDate === yesterday` → streak + 1
   - Altfel (mai vechi de ieri SAU gol) → streak = 1

5. **Cleanup la `loadCloud`**: când nu există date locale reale (xp=0, 0 lecții), nu mai facem merge cu default-ul — folosim direct datele din cloud. Apoi verificăm dacă trebuie incrementat streak-ul dacă `last_activity_date` din cloud e ieri.

### Rezumat schimbări
- Un singur fișier: `src/hooks/useProgress.ts`
- ~30 linii modificate
- Fără migrări SQL necesare — logica streak-ului este exclusiv client-side

