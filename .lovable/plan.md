
## Plan: confirmare la ștergerea contului + corectare dezactivare profesor + blocare reafișare animație nivel

### Ce am identificat
1. **Dezactivarea modului profesor pare optimistă în UI**: în `AuthPage.tsx` se apelează funcția din backend, dar rezultatul nu este validat explicit; interfața ascunde imediat panoul profesor doar din state local. Dacă apelul eșuează, după refresh revine starea reală din baza de date.
2. **Animația de nivel se poate declanșa fals la intrarea în Home**: în `Index.tsx` cheia `pyro-last-seen-level` este suprascrisă prea devreme, înainte ca progresul real să fie complet încărcat. Practic, nivelul temporar de la încărcare poate fi salvat ca bază, iar apoi nivelul real este interpretat ca “level up” la fiecare intrare.
3. **`DeleteAccountPage` are deja pași de avertizare, dar nu are o confirmare modală finală de tipul “Sunt de acord”**, similară cu dezactivarea modului profesor.

### Ce voi modifica

#### 1. `src/pages/DeleteAccountPage.tsx`
- Adaug un `AlertDialog` final înainte de apelul efectiv de ștergere.
- Butonul „Șterge contul definitiv” nu va mai porni direct procesul, ci va deschide dialogul final.
- Dialogul va repeta clar consecințele ireversibile.
- Dacă utilizatorul este profesor, mesajul final va include și pierderea claselor, testelor și a verificării de profesor.
- Butonul roșu „Sunt de acord” va executa ștergerea; „Renunță” doar închide dialogul.

#### 2. `src/pages/AuthPage.tsx`
- Corectez fluxul de dezactivare a modului profesor:
  - verific explicit dacă apelul către backend a returnat eroare;
  - nu mai schimb UI-ul doar din state local dacă backend-ul nu confirmă operația;
  - după succes, refac citirea datelor contului din baza de date și sincronizez interfața cu starea reală;
  - închid dialogul doar după confirmarea succesului.
- Astfel, după refresh, panoul profesor nu ar mai trebui să reapară dacă operația chiar s-a executat.

#### 3. `src/pages/Index.tsx`
- Refac logica de declanșare pentru `LevelUpDialog`:
  - nu mai scriu cheia din `localStorage` în faza de încărcare intermediară;
  - initializez „last seen level” doar după ce progresul și pragurile de nivel sunt stabilizate;
  - afișez dialogul doar la **creștere reală de nivel**;
  - păstrez și protecția de dată ca să nu existe reafișări multiple în aceeași zi din cauza remount-urilor sau sincronizărilor.
- Voi folosi chei separate per utilizator, ca să nu existe efecte ciudate dacă se schimbă contul pe același device.

#### 4. `src/hooks/useProgress.ts`
- Adaug un flag de tip `hydrated/initialized/loading` pentru a ști când progresul real a fost încărcat și poate fi folosit în siguranță pentru animații și popup-uri.
- `Index.tsx` va folosi acest flag ca să nu mai trateze valorile temporare de la bootstrap ca stare finală.

#### 5. Backend pentru ștergerea contului
- Voi audita și completa fluxul din `supabase/functions/delete-account/index.ts` astfel încât, dacă utilizatorul este profesor, să fie curățate și datele de profesor înainte de eliminarea profilului și a autentificării.
- Scopul este să nu rămână date orfane și să avem un comportament coerent cu avertismentele din UI.

### Verificare după implementare
Voi testa explicit:
1. **Dezactivare profesor**
   - deschid dialogul;
   - confirm;
   - verific că dispare panoul profesor;
   - dau refresh pe `/auth`;
   - confirm că utilizatorul rămâne elev și nu mai revine secțiunea de profesor.

2. **Ștergere cont**
   - parcurg pașii existenți;
   - verific că apare noul dialog final;
   - confirm că butonul final execută ștergerea doar după acceptare;
   - verific redirect-ul și logout-ul corect.

3. **Animația de nivel**
   - intru în Home;
   - refresh;
   - ies și revin în Home;
   - confirm că dialogul nu reapare fără schimbare reală de nivel;
   - verific și scenariul de level-up real, ca să apară o singură dată când trebuie.

### Fișiere vizate
- `src/pages/DeleteAccountPage.tsx`
- `src/pages/AuthPage.tsx`
- `src/pages/Index.tsx`
- `src/hooks/useProgress.ts`
- `supabase/functions/delete-account/index.ts`
- posibil o migrare SQL doar dacă e nevoie să extrag partea de cleanup într-o funcție reutilizabilă din backend
