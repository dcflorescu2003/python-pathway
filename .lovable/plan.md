

## Plan: Fix CSV — auto-quoting și documentare

### Cauza
CSV standard cere ca orice celulă cu virgulă să fie între ghilimele (`"`). 3 celule din fișier nu respectă asta.

### Soluție (2 părți)

**1. Îmbunătățire parser (`csvParser.ts`)**
- Adaug o funcție de pre-procesare `autoRepairCSV(text)` care detectează rânduri cu mai multe câmpuri decât headerul și încearcă să le repare prin îmbinarea câmpurilor excedentare
- Algoritmul: dacă un rând are mai multe celule decât headerul, încearcă să recombine celulele adiacente (mai ales în câmpurile text lungi precum `question`, `explanation`, `statement`) care probabil au fost sparte de o virgulă neprotejată
- Adaug mesaj de eroare mai clar: „Câmpul conține virgulă neprotejată — încadrați-l cu ghilimele"

**2. Documentare mai clară în UI**
- În secțiunea de format din dialogul de import, adaug nota: **„Dacă un câmp conține virgulă, încadrați-l cu ghilimele: `"text cu, virgulă"`"**
- Actualizez template-ul descărcabil pentru a arăta exemple cu ghilimele pe câmpuri cu virgulă

### Fișiere modificate

| Fișier | Ce |
|--------|----|
| `csvParser.ts` | Funcție `autoRepairCSV`, mesaje de eroare mai clare |
| `CsvImporter.tsx` | Notă UI despre ghilimele |
| `CsvLessonImporter.tsx` | Aceeași notă UI |

