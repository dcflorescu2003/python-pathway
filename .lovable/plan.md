## Modificări în `src/components/teacher/TestBuilder.tsx`

### 1) Banca testare → Teste: cere alegerea unui capitol în loc de "Toate capitolele"
- Schimb valoarea inițială a `selectedBankTestChapterId` din `"all"` în `""` (nimic selectat).
- În `<SelectTrigger>` placeholder-ul devine `"Alege capitol"` (ca la Exerciții/Probleme).
- Elimin `<SelectItem value="all">Toate capitolele</SelectItem>` din dropdown; păstrez opțiunile per capitol și `"__none__"` = "Fără capitol".
- În blocul care randează testele:
  - dacă `selectedBankTestChapterId === ""` → afișez mesaj `"Alege un capitol pentru a vedea testele predefinite."` și nu randez lista.
  - scot ramura `=== "all"` din filtrare.

### 2) Custom → "Răspuns deschis": lipsește câmpul pentru întrebare
- Adaug un bloc nou `{customType === "open_answer" && (...)}` chiar înaintea butoanelor Anulează/Adaugă, care conține un `<Textarea>` legat de `customQuestion` / `setCustomQuestion` cu placeholder `"Întrebarea (răspuns deschis, evaluată de AI)..."` și `className="text-xs min-h-[80px]"`.
- Logica existentă din `addCustomQuestion` (linia 557-565) folosește deja `customQuestion`, deci nu e nevoie de modificări suplimentare.

Fără schimbări în alte fișiere, fără migrări, fără logică de business.
