

# Add "Install PyRo" Button in Header

## What we'll build
A download/install button in the homepage header that opens a dialog/sheet with install instructions for both Android and iOS, plus PWA native install prompt support.

## Approach

### 1. Create `useInstallPrompt` hook
- Captures the `beforeinstallprompt` event for Android/Chrome (allows triggering native install prompt)
- Detects if app is already installed (standalone mode)
- Detects platform (iOS vs Android/other)

### 2. Create `InstallDialog` component
A dialog/sheet with:
- Title: **"Instalează PyRo 🚀"**
- Subtitle: **"Învață Python mai rapid"**
- Two sections:
  - **Android**: Button that triggers `beforeinstallprompt` if available, otherwise instructions to use browser menu → "Add to Home Screen"
  - **iOS**: Step-by-step instructions: Safari → Share → "Add to Home Screen"
- Visual icons for each step

### 3. Add button in header (`Index.tsx`)
- A `Download` icon button next to the Crown icon
- Hidden if app is already running in standalone/installed mode
- Opens the `InstallDialog`

### Files to create/edit
- **Create** `src/hooks/useInstallPrompt.ts` — hook for PWA install prompt + platform detection
- **Create** `src/components/InstallDialog.tsx` — dialog with install instructions
- **Edit** `src/pages/Index.tsx` — add install button in header

