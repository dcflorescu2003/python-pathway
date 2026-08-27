# Plan: Evidențiere mai clară a selecției de capitol în zona de teste

## Context
În `src/components/teacher/TestBuilder.tsx`, secțiunea **Banca testare → Teste** afișează un dropdown `Alege capitol` și un mesaj subtil italic:
> „Alege un capitol pentru a vedea testele predefinite.”

Mesajul este greu de observat, iar butoanele de acțiune (Previzualizează / Creează test) rămân vizibile chiar și fără un capitol selectat. Utilizatorii pot trece peste pasul obligatoriu.

## Obiectiv
Facem selecția capitolului vizual evidentă în zona de teste, înainte ca profesorul să poată continua cu previzualizarea sau crearea testului.

## Modificări propuse

### 1. Card de atenție vizibil când nu e selectat capitol
În `TestBuilder.tsx`, înlocuim mesajul italic subtil cu un card colorat care:
- Folosește fundal `bg-warning/10` și border `border-warning/30` (token semantic).
- Include icon `AlertCircle` sau `BookOpen`.
- Text clar: „Selectează un capitol pentru a vedea testele predefinite.”
- Afișează numărul de capitole disponibile: „X capitole disponibile”.

### 2. Stare dezactivată pentru acțiuni dependente
- Butonul **Previzualizează test** și **Creează test** rămân vizibile, dar sunt `disabled` cu tooltip/mesaj explicativ când nu există itemi selectați.
- Alternative: afișăm un mesaj inline „Alege un capitol mai întâi” în locul listei goale de itemi.

### 3. Aplicare consistentă pe toate tab-urile cu selecție de capitol
Același pattern vizual se aplică și pentru:
- **Banca testare → Exerciții**
- **Banca testare → Probleme**
- **Publice → Exerciții**
- **Publice → Probleme**

Fiecare va avea un card de atenție când `selected*ChapterId` este gol.

## Implementare tehnică
- Fișier modificat: `src/components/teacher/TestBuilder.tsx`.
- Nu se adaugă dependențe noi.
- Se folosesc doar token-uri existente din design system (warning, accent, muted, foreground).

## Verificare
- Build TypeScript fără erori (`tsgo`).
- Preview pe ecranul de creare test: cardul de atenție apare când nu e ales capitol; dispare și apare lista de itemi după selecție.
