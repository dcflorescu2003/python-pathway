

## Plan: Popup-uri o singură dată pe zi

### Problema
De fiecare dată când navighezi la pagina Home (prin bottom nav), popup-ul Premium și animația Level Up se re-declanșează, pentru că starea se resetează la fiecare montare a componentei Index.

### Soluția
Folosim `sessionStorage` (o dată per sesiune de app) sau `localStorage` cu timestamp (o dată pe zi) pentru a preveni re-afișarea popup-urilor.

### Modificări în `src/pages/Index.tsx`

1. **Premium popup** (liniile 144-151): În loc să se afișeze la fiecare montare, verifică în `localStorage` dacă a fost deja afișat astăzi (`pyro-premium-popup-date`). Dacă data salvată === data de azi, nu mai afișa. Când se afișează, salvează data curentă.

2. **Level Up dialog** (liniile 153-166): `initialLoadRef` se resetează la fiecare montare. Mutăm flag-ul "nivel deja văzut" în `sessionStorage` (`pyro-last-seen-level`). La montare, citim ultimul nivel văzut din sessionStorage; declanșăm dialogul doar dacă nivelul curent > nivelul salvat. Când dialogul se afișează, actualizăm sessionStorage.

3. **Coupon Expired dialog** — acesta pare gestionat de `useSubscription`, deci îl las neschimbat (se afișează doar la expirare reală).

### Rezultat
- Premium popup: maxim o dată pe zi per utilizator free
- Level Up: o dată per sesiune, doar la avansare reală (nu la re-navigare pe Home)

