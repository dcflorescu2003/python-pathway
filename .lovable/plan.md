# Mesaj de instalare aplicație mobilă când rămâi fără inimi pe web

## Situația actuală (verificat)
- `src/components/RefillLivesDialog.tsx` afișează pe web doar textul: "Vizionarea reclamelor pentru inimi este disponibilă doar în aplicația mobilă."
- `src/pages/LessonPage.tsx` (web) spune: "Inimile se reîncarcă automat în 30 de minute ... Sau treci pe Premium pentru inimi nelimitate."
- Nu există îndrumare explicită către magazinele Google Play / App Store.

## Ce fac
1. În `RefillLivesDialog.tsx`, pe web (`!isNative`), înlocuiesc mesajul existent cu:
   - Text: "Poți reîncărca inimile gratuit în aplicația mobilă urmărind o reclamă. Instalează PyRo din Google Play sau App Store."
   - Butoanele deja existente `AppDownloadCTA` cu `showWebButton={false}` (doar Google Play + App Store).
2. În `LessonPage.tsx`, pe web, în ecranul care blochează lecția fără inimi, adaug același mesaj + butoane de instalare, păstrând butonul „Activează Premium".
3. Nu promit Premium gratuit la instalare — doar reîncărcarea inimilor prin reclame în aplicația mobilă.
4. Verific în preview că butoanele deschid linkurile corecte și că mesajul nu apare pe aplicația nativă.

## Note
- Nu se modifică logică de backend, vieți, XP sau Premium.
- Se folosesc componentele și token-ele de design existente (`AppDownloadCTA`, `Button`, culori semantice).
