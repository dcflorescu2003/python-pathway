## Fix: pasul 3 (parolă) nu apare după verificarea emailului

### Problema
În `RealEmailSetupCard.tsx`:
```ts
if (loading || !isPrivateRelay) return null;
```
După schimbarea emailului, `isPrivateRelay` devine `false` (noul email nu mai e `@privaterelay.appleid.com`), așa că tot cardul dispare înainte să se afișeze pasul „Setează parolă".

### Soluție
Schimb condiția să păstreze cardul vizibil și pentru utilizatorii care:
- au email real verificat (`hasVerifiedRealEmail`) DAR
- încă n-au parolă (`!hasPassword`)

```ts
if (loading) return null;
if (!isPrivateRelay && !(hasVerifiedRealEmail && !hasPassword)) return null;
```

`useEffect`-ul existent setează deja `step = "password"` în acest caz, deci după fix utilizatorul va vedea direct formularul de parolă.

### Pentru contul tău actual
După ce aplic fixul, intră pe **Contul meu** și vei vedea cardul cu pasul „Setează parolă" — completezi parola și gata, te poți loga pe web cu email + parolă.

### Fișier modificat
- `src/components/account/RealEmailSetupCard.tsx` (1 linie)

Niciun deploy backend / build mobil necesar.
