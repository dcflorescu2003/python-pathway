

## Plan: Înlocuire iconiță iOS cu logo PyRo

Folosesc `splash-logo.png` (logo-ul PyRo deja folosit în splash screen) ca sursă pentru iconița iOS.

### Pași
1. Verific dimensiunile și transparența `src/assets/splash-logo.png`.
2. Procesez imaginea cu ImageMagick:
   - Resize la exact 1024×1024
   - Flatten pe fundal `#0F1219` (fundalul dark al aplicației, consistent cu splash screen-ul)
   - Elimin canalul alpha (Apple respinge iconițe cu transparență)
   - Format PNG, sRGB
3. Suprascriu `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`.
4. Confirm cu `identify` că rezultatul e 1024×1024, fără alpha.

### După aplicare (pași pentru tine)
1. `git pull` în proiectul local
2. `npx cap sync ios`
3. În Xcode: **Product → Clean Build Folder**, apoi rebuild
4. Iconița nouă va apărea pe device/simulator

### Fișier modificat
| Fișier | Schimbare |
|---|---|
| `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` | Înlocuit cu logo PyRo 1024×1024 pe fundal `#0F1219` |

