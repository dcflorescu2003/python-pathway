## Problemă

Când utilizatorul deschide tab-ul **Cont** imediat după un update (sau cold start), ecranul rămâne negru. Dacă revine ulterior, totul funcționează normal.

## Cauza

În `src/pages/AuthPage.tsx`:

```ts
const { user, loading: authLoading } = useAuth(); // authLoading e ignorat!
const wasLoggedInOnMount = useState(() => !!user)[0];

useEffect(() => {
  if (user && !wasLoggedInOnMount) {
    navigate("/", { replace: true }); // ⚠ redirect spre Acasă
  }
}, [user, wasLoggedInOnMount, navigate]);

if (user && wasLoggedInOnMount) return <AccountView />;
// altfel cade în formularul de login
```

La un cold start după update, `useAuth` returnează inițial `user: null, loading: true` (sesiunea încă se restaurează). În acest moment:

1. `wasLoggedInOnMount` se „îngheață" pe `false`.
2. Componenta începe să randeze formularul de login (`motion.div` cu `initial opacity:0`).
3. Câteva sute de ms mai târziu, sesiunea se restaurează → `user` devine truthy → effect-ul redirectează la `/`.
4. Între timp `AnimatePresence` din `App.tsx` joacă tranziția de exit pe formular cu opacity 0 → ecran negru până când Acasă termină de încărcat.

În plus, intenția utilizatorului (să vadă Contul) se pierde — e trimis la Acasă în loc să vadă `AccountView`.

## Soluție

În `src/pages/AuthPage.tsx`:

1. **Așteaptă `authLoading`** înainte de a decide ce să randezi. Cât timp `authLoading === true`, returnează `<LoadingScreen />` (folosit deja în `Index.tsx`) în loc să cazi pe formularul de login.
2. **Înlocuiește euristica `wasLoggedInOnMount`** cu o regulă simplă bazată pe starea curentă rezolvată:
   - dacă `user` există → `<AccountView />`
   - altfel → formularul de login
3. **Mută redirect-ul după login** (de la formular spre Acasă) într-un `useEffect` separat care se declanșează doar la tranziția `null → user` provocată de submit-ul formularului (ținem un flag local `justSignedIn`), nu la simpla restaurare a sesiunii. Astfel intrarea pe `/auth` cu sesiune validă rămâne pe pagina Cont, iar login-ul nou tot redirectează spre Acasă, păstrând comportamentul actual.

Rezultat: indiferent dacă sesiunea e deja încărcată sau încă se restaurează după update, utilizatorul vede mai întâi loaderul și apoi direct ecranul „Contul meu", fără flash negru și fără redirect nedorit la Acasă.

## Fișiere afectate

- `src/pages/AuthPage.tsx` — singurul fișier modificat.
