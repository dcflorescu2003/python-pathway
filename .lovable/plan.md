

## Diagnoză

Memoria `re-trigger-protection` confirmă că Level Up are deja protecție prin `localStorage` ca să nu se re-declanșeze. Dar userul spune că totuși apare animația în alte momente decât la schimbarea efectivă a nivelului.
<lov-tool-use id="toolu_vrtx_01UQjC2qKh9D82dzg1WhPmJ7" name="code--search_files" integration-id="code" data="{\"query\": \"LevelUpDialog\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_018MsTCEEZtRYAffrDzHqeGN" name="code--search_files" integration-id="code" data="{\"query\": \"level-up|levelUp|setShowLevelUp|justLeveledUp\", \"include_patterns\": \"src/**/*.ts,src/**/*.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_017nNMd7zdJKXykm8Qbjmkf5" name="code--search_files" integration-id="code" data="{\"query\": \"LevelUpDialog\", \"include_patterns\": \"src/**/*.tsx,src/**/*.ts\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01GWfdvy1cgN1ELoViywuwwF" name="code--search_files" integration-id="code" data="{\"query\": \"level-up|levelUp|justLeveledUp|showLevelUp\", \"include_patterns\": \"src/**/*.tsx,src/**/*.ts\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01CvgGv2Gvwf5dXX1rN7k288" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/Index.tsx\", \"lines\": \"150-200\"}">
</lov-tool-use>
Am înțeles. Logica curentă folosește o cheie „pe zi" (`pyro-levelup-shown-date`), deci dialogul poate reapărea într-o zi nouă chiar dacă nivelul nu s-a mai schimbat. Userul vrea: doar **o singură dată per nivel atins**.

<lov-plan>

## Plan: LevelUp doar la schimbarea reală a nivelului (o singură dată per nivel)

### Problemă
În `src/pages/Index.tsx` (liniile 156-188), dialogul `LevelUpDialog` se afișează dacă `level > lastSeenLevel`, **dar** este gardat suplimentar de o cheie „shown-date" pe zi (`pyro-levelup-shown-date-{userId}`). Asta cauzează re-trigger în condiții în care `lastSeenLevel` nu se actualizează corect (ex: localStorage curățat, alt device, race condition la load) — dialogul reapare în zile noi fără ca userul să fi urcat nivel.

### Soluție
Elimin complet logica „pe zi" și mă bazez exclusiv pe nivelul maxim văzut vreodată, salvat per user:

- Cheie nouă: `pyro-max-level-celebrated-{userId}` (număr — cel mai mare nivel pentru care s-a afișat deja dialogul)
- La fiecare schimbare:
  - Dacă `level > maxCelebrated` ȘI `maxCelebrated > 0` (nu prima inițializare) → afișez dialog **o singură dată** și actualizez `maxCelebrated = level`
  - Dacă e prima inițializare (`maxCelebrated === 0`) → doar seed, fără popup
- Elimin `pyro-levelup-shown-date-{userId}` complet (fără date-gating)
- Păstrez `levelInitialized` ref pentru a evita declanșări la primul mount

### Avantaj
- Dialogul apare exact o dată per nivel atins (nivelul 5 → o singură dată în viața contului, niciodată din nou)
- Nu mai depinde de date/timezone
- Coerent cu memoria `re-trigger-protection`

### Fișier modificat (1)
- `src/pages/Index.tsx` — înlocuiesc blocul `useEffect` de la liniile 156-188

### Memory update
Actualizez `mem://features/app-experience/re-trigger-protection` cu noua regulă: LevelUp se afișează o singură dată per nivel atins (nu per zi).

### Nu modific
- `LevelUpDialog.tsx` (componenta în sine — animația rămâne aceeași când chiar se declanșează)
- Logica de progres / XP / niveluri

