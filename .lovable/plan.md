

## Plan: Reparăm livrarea fișierului `app-ads.txt` pentru AdMob

### Problema identificată

Am verificat `https://pyroskill.info/app-ads.txt` și `https://www.pyroskill.info/app-ads.txt`. Fișierul **există și are conținutul corect**, DAR este servit ambalat în HTML:

```html
<html><body>google.com, pub-8441862030200888, DIRECT, f08c47fec0942fa0
</body></html>
```

Specificația IAB cere ca fișierul să fie servit ca **text simplu** (Content-Type: `text/plain`), fără tag-uri HTML. Crawler-ul AdMob respinge fișierul când întâlnește HTML, de aceea verificarea eșuează cu „Nu am găsit identificatorul publisher-ului".

### Cauza tehnică

Hostingul Lovable pare să injecteze `<html><body>` în jurul conținutului fișierului `.txt` din `public/`. Singurul mod sigur de a livra `app-ads.txt` ca text curat este pe **un domeniu/subdomeniu sub controlul tău cu hosting standard** sau prin adăugarea unei rute care forțează `text/plain`.

### Reguli AdMob pe care trebuie să le respectăm

1. ✅ Conținut corect: `google.com, pub-8441862030200888, DIRECT, f08c47fec0942fa0`
2. ❌ Content-Type `text/plain` — momentan e `text/html`
3. ❌ Fără wrapper HTML — momentan are `<html><body>`
4. ⚠️ Domeniul `pyroskill.info` trebuie să fie EXACT cel declarat în **Google Play Console → Detalii magazin → Site web** pentru aplicația `ro.pythonpathway.app`

### Soluții (în ordinea recomandată)

**Soluția A — Verifică Play Console (verificare rapidă, fără cod)**
- Deschide Google Play Console → aplicația PyRo → **Magazin Play → Setări magazin → Detalii despre magazin**
- Confirmă că la „Site web" este setat exact `https://pyroskill.info` (nu altceva, nu gol, nu `pyro-learn.lovable.app`)
- Dacă nu este, schimbă-l și salvează — propagarea către AdMob durează 24-48h

**Soluția B — Servește `app-ads.txt` printr-o Edge Function Supabase (cea mai sigură tehnic)**

Adăugăm o funcție Edge `app-ads` care întoarce conținutul cu `Content-Type: text/plain` corect, apoi configurăm un redirect / proxy de la `/app-ads.txt`. Totuși, AdMob nu urmărește redirect-uri către alte domenii, deci această soluție necesită ca Edge Function-ul să fie expus pe `pyroskill.info/app-ads.txt`, ceea ce nu e direct posibil pe hostingul Lovable.

**Soluția C — Folosește GitHub Pages / Netlify pentru un subdomeniu dedicat**

Creezi un subdomeniu (ex: `ads.pyroskill.info`) hostat separat care servește un singur fișier `app-ads.txt` curat, apoi schimbi link-ul „Site web" din Play Console la `https://ads.pyroskill.info`.

### Recomandare

Începem cu **Soluția A** — este foarte probabil ca problema reală să fie că Play Console nu are setat `pyroskill.info` ca site al dezvoltatorului, iar AdMob caută `app-ads.txt` pe alt domeniu (sau pe niciunul). Verifică asta întâi, apoi raportezi rezultatul.

Dacă Play Console e configurat corect și eroarea persistă după 48h, trecem la Soluția C cu un subdomeniu separat.

### Fără modificări de cod în acest pas

Nu modificăm nimic în cod până nu confirmăm setarea din Play Console. `public/app-ads.txt` rămâne așa cum este — conținutul e corect, doar livrarea e problematică.

