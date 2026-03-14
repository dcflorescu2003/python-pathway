

# Buton "Instalează" pe rând separat

## Ce facem
- Mutăm butonul de install din header într-un buton full-width pe propriul rând, între header și selectorul de liceu
- Textul va fi "📲 Instalează PyRo" 
- La click: pe Android/Chrome folosim `beforeinstallprompt` API (prompt nativ automat); pe iOS deschidem dialogul cu instrucțiuni (Safari nu permite install programatic)
- Butonul dispare complet când app-ul e deja instalat

## Limitare tehnică importantă
- **Android/Chrome**: Da, se poate triggera automat "Add to Home Screen" prin `beforeinstallprompt` API — funcționează direct
- **iOS/Safari**: Apple **nu permite** install programatic. Singura opțiune e să arătăm instrucțiunile (Share → Add to Home Screen). Vom deschide dialogul cu pașii

## Modificări

### `src/pages/Index.tsx`
1. Eliminăm iconița Download din header
2. Adăugăm un `Button` full-width între header și school selector:
   - Text: "📲 Instalează PyRo"
   - Click → pe Android cu `canPrompt`: apelează `promptInstall()` direct (prompt nativ)
   - Click → pe iOS sau fără prompt: deschide `InstallDialog` cu instrucțiuni
   - Vizibil doar când `!isInstalled`
   - Stilizat ca buton primary cu border, rounded-xl

### `src/components/InstallDialog.tsx`
- Fără modificări (rămâne ca fallback pentru iOS)

