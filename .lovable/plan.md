

## Plan: Buton „Reia provocarea" pentru provocări deja completate

### Ce se schimbă

**`src/components/account/StudentTab.tsx`** — secțiunea „Provocări completate" din Istoric:

1. Adaug un buton **„Reia"** pe fiecare provocare completată, care navighează elevul la lecția/problema respectivă (folosind aceeași logică ca `handleStartChallenge`)
2. Butonul va fi stilizat ca `variant="outline" size="sm"` cu iconița `RotateCcw` pentru a sugera reluarea
3. Scorul curent rămâne afișat lângă textul „completată"

### Fișier modificat

| Fișier | Ce |
|--------|-----|
| `src/components/account/StudentTab.tsx` | Adaug buton „Reia" pe fiecare provocare completată din secțiunea Istoric |

### Detalii tehnice

- Import `RotateCcw` din lucide-react
- Pe click, folosesc `handleStartChallenge(ch)` existent — navighează la `/lesson/{id}` sau `/problem/{id}`
- Pagina de acasă (Index) nu se modifică

