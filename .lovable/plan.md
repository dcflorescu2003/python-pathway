

## Plan: Nu auto-trimite testul când elevul verifică notificările Android

### Problemă
Pe Android (Capacitor WebView), tragerea barei de notificări declanșează `window.blur`, ceea ce pornește timer-ul de 1 secundă și auto-trimite testul. Elevul nu a părăsit cu adevărat aplicația.

### Soluție
Pe platforma nativă Capacitor, nu ne mai bazăm pe `window.blur` / `window.focus` pentru detecția părăsirii. Folosim doar:
- `document.visibilitychange` (tab hidden) — se activează când aplicația e complet acoperită
- `@capacitor/app` `appStateChange` — se activează când aplicația intră în background

Pe web (browser), păstrăm `window.blur` deoarece acolo este singurul mod de a detecta schimbarea de fereastră.

### Schimbări

**`src/pages/TakeTestPage.tsx`** — Condiționare platformă pentru blur listener

În blocul `useEffect` care configurează listenerii de auto-submit (~linia 310-380):

1. Import `Capacitor` din `@capacitor/core`
2. Înregistrează `window.blur` și `window.focus` **doar dacă NU suntem pe platformă nativă** (`!Capacitor.isNativePlatform()`)
3. Pe nativ, ne bazăm exclusiv pe `visibilitychange` + `appStateChange` care nu se activează la notification shade

Aceasta este o schimbare minimală — doar adăugăm o condiție `if (!Capacitor.isNativePlatform())` în jurul celor două linii care adaugă/șterg blur/focus listeners.

### Fișiere modificate
- `src/pages/TakeTestPage.tsx`

### Fără schimbări de bază de date

