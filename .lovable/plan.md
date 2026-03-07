

# De ce se deschide Chrome în loc de aplicație

## Cauza problemei

În `capacitor.config.ts` ai configurat `server.url` care pointează către URL-ul live al proiectului Lovable:

```
server: {
  url: 'https://4ea1d2d1-61a3-4961-91bb-927d97f397be.lovableproject.com?forceHideBadge=true',
  cleartext: true,
}
```

Această setare este doar pentru **development/hot-reload** — face ca aplicația Android să încarce conținutul de pe serverul Lovable în loc să folosească fișierele locale din `dist/`. Din cauza asta, Android-ul poate deschide URL-ul în Chrome în loc de WebView-ul intern al aplicației.

## Soluția

Pentru a genera un **APK/AAB real** care funcționează ca aplicație nativă (offline, fără Chrome), trebuie să:

1. **Elimini sau comentezi `server`** din `capacitor.config.ts` — astfel Capacitor va folosi fișierele HTML/JS/CSS din folderul `dist/` (bundle-ul local)
2. **Construiești proiectul** cu `npm run build` pentru a genera folderul `dist/`
3. **Sincronizezi** cu `npx cap sync` pentru a copia `dist/` în proiectul Android
4. **Rulezi din Android Studio** — acum aplicația va rula totul local, în WebView-ul Capacitor, fără a deschide Chrome

### Modificare `capacitor.config.ts`:

Se elimină blocul `server` complet. Configurația finală:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4ea1d2d161a3496191bb927d97f397be',
  appName: 'PyLearn',
  webDir: 'dist',
};

export default config;
```

### Pași de urmat după modificare:

```text
1. git pull           ← preia modificarea
2. npm install        ← instalează dependențe
3. npm run build      ← construiește dist/
4. npx cap sync       ← copiază dist/ în android/
5. Android Studio → Run ← acum rulează local, ca aplicație reală
```

**Notă**: Dacă vrei hot-reload în timpul dezvoltării, poți adăuga temporar `server.url` înapoi cu IP-ul calculatorului tău (`http://192.168.x.x:8080`), dar pentru build-ul final de publicare trebuie eliminat.

