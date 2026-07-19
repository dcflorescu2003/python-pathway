## Problemă

Cartonasul motivational (`MotivationalTipCard`) apare imediat la deschiderea aplicației pe Home și e poziționat în partea de sus (uneori pare „în colț" pe anumite viewport-uri, în loc de mijlocul ecranului).

## Modificări

### 1. Trigger: după terminarea unei lecții, nu la deschiderea aplicației

- În `src/pages/LessonPage.tsx` (și, dacă are același flow de finalizare, `ManualLessonPage.tsx`): la momentul în care lecția e marcată completă și user-ul urmează să fie trimis înapoi la lista de lecții, setăm un flag scurt în `sessionStorage`:
  - `sessionStorage.setItem("pyro-tip-trigger", "1")`
- În `src/hooks/useMotivationalTip.ts`:
  - Blocăm calcularea tip-ului dacă flag-ul nu este prezent.
  - Când tip-ul este afișat (`markShown`), consumăm flag-ul (`sessionStorage.removeItem("pyro-tip-trigger")`) ca să nu reapară la următoarea intrare pe Home.
  - Apelăm `markShown` din `src/pages/Index.tsx` atunci când `tipType` devine non-null (momentan nu se apelează, deci cooldown-ul de 2/3 zile nu se persistă — bug secundar reparat aici).

Rezultat: cartonasul apare o singură dată, la revenirea pe Home după prima lecție terminată din sesiune, exact înainte ca lista de lecții să reapară. La deschiderea aplicației (fără să fi terminat o lecție) nu mai apare.

### 2. Poziționare: centrat pe ecran

În `src/components/tips/MotivationalTipCard.tsx`:
- Înlocuim `top-[calc(var(--sat)+72px)]` cu poziționare centrată vertical și orizontal:
  - `fixed inset-0 flex items-center justify-center z-50 pointer-events-none`
  - Cardul intern păstrează `w-[92%] max-w-md` și primește animația spring existentă (fade + scale în loc de slide de sus).
- Ajustăm `initial/animate/exit` la `scale: 0.85 → 1 → 0.85` cu `opacity` pentru un efect elegant pe centru.

## Notă tehnică

- Cooldown-urile existente (3 zile lecții / 2 zile probleme) rămân valabile — flag-ul de trigger este condiție suplimentară, nu înlocuitor.
- Nu se modifică logica de eligibilitate (scor < 70% sau < 20 probleme rezolvate).
- Auto-dismiss după 2s rămâne neschimbat.