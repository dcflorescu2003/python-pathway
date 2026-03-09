

# Fix: Adaugă scriptul `build:dev` lipsă

## Problema

Sandbox-ul Lovable folosește intern scriptul `build:dev` pentru a construi preview-ul. Acest script a fost eliminat într-o modificare anterioară, ceea ce face ca preview-ul să nu se mai poată încărca. Pe GitHub/Android Studio funcționează pentru că acolo se folosește `npm run build` (scriptul standard).

## Soluția

Adaugă scriptul `build:dev` înapoi în `package.json`:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "build:dev": "vite build --mode development",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Aceasta este singura modificare necesară — un singur rând adăugat.

