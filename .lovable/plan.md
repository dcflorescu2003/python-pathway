

## Plan: Adaugă fișierul `app-ads.txt` pentru verificarea AdMob

### Problema

AdMob nu poate verifica aplicația PyRo deoarece lipsește fișierul `app-ads.txt` de pe domeniul dezvoltatorului (`pyroskill.info`).

### Modificare

Creăm fișierul `public/app-ads.txt` cu conținutul indicat de AdMob:

```
google.com, pub-8441862030200888, DIRECT, f08c47fec0942fa0
```

Acest fișier va fi servit automat la `https://pyroskill.info/app-ads.txt` după publicare.

### Pași

1. Creăm `public/app-ads.txt` cu linia de mai sus.
2. Publicăm aplicația (click "Update" in publish dialog).
3. După publicare, revii în AdMob Console și apeși "Căutați actualizări" pentru ca AdMob să re-verifice fișierul.

### Fără schimbări de bază de date

