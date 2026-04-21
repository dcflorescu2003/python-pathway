

## Plan: Re-activează auto-submit când elevul trage bara de notificări pe Android

### Schimbare

Revert-ul modificării anterioare: ștergem condiția `isNativePlatform()` și re-activăm `window.blur` / `window.focus` pe toate platformele.

### Fișier modificat: `src/pages/TakeTestPage.tsx`

**Liniile ~347-355** — Eliminăm blocul condițional și comentariul, înregistrăm blur/focus necondițional:

```typescript
document.addEventListener("visibilitychange", onVisibility);
window.addEventListener("blur", onBlur);
window.addEventListener("focus", onFocus);
```

**Liniile ~382-388** — Cleanup necondițional:

```typescript
document.removeEventListener("visibilitychange", onVisibility);
window.removeEventListener("blur", onBlur);
window.removeEventListener("focus", onFocus);
```

Variabila `isNative` și import-ul `Capacitor` pot rămâne (se folosesc și în altă parte) sau se elimină dacă nu mai sunt referite.

### Fără schimbări de bază de date

