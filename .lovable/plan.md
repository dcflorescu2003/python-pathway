

## Plan: Fix CSV parser pentru câmpuri multiline și compatibilitate Excel

### Probleme identificate

Fișierul CSV are **două probleme principale**:

1. **Câmpuri multiline** — Exercițiul de tip `card` (rândul 7-14) conține text cu newline-uri în interior (markdown cu bullet points). Parserul actual face `text.split(/\r?\n/)` la nivel de fișier, ceea ce sparge un câmp multiline în mai multe rânduri invalide. Fiecare linie din interiorul câmpului card apare ca un rând separat cu tip invalid.

2. **`#NAME?` din Excel** — Textul original conținea probabil markdown cu `#` (headere), iar Excel le-a interpretat ca formule invalide, înlocuindu-le cu `#NAME?`. Aceasta e o problemă din Excel, nu din parser — dar parserul ar trebui să le accepte ca text valid.

### Soluție

**Modificare `csvParser.ts`** — funcția `parseCSVRows`:

- Înlocuiesc logica de split simplu pe `\n` cu un **parser care respectă quoted fields multiline**
- Algoritmul: parcurg caracter cu caracter, țin un flag `inQuotes`. Când sunt în ghilimele, newline-urile nu separă rândurile — le adaug la câmpul curent
- După ce am liniile logice corecte, le parsez cu `parseCSVLine` existent

Același fix se aplică și în `parseLessonCSV` unde se face split pe `[META]` / `[EXERCISES]`.

### Detalii tehnice

```text
Flux actual:
  text.split(\n) → linii fizice → parseCSVLine per linie
  ❌ Câmp multiline = rânduri sparte

Flux nou:
  splitCSVLogicalLines(text) → linii logice (respectă ghilimele)
  → parseCSVLine per linie logică
  ✅ Câmpurile cu newline rămân întregi
```

### Fișiere modificate

| Fișier | Ce |
|--------|----|
| `src/components/admin/csvParser.ts` | Funcție nouă `splitLogicalLines()`, update `parseCSVRows` și `parseLessonCSV` |

### Recomandare pentru utilizator

Problema cu `#NAME?` vine din Excel. Recomand editarea CSV-urilor într-un **editor text** (Notepad++, VS Code) sau **Google Sheets** (care nu interpretează `#` ca formulă). Parserul va accepta `#NAME?` ca text, dar conținutul original se pierde odată ce Excel l-a alterat.

