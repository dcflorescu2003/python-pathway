## Obiectiv
Apple cere ca, pentru orice abonament auto-renewable, aplicația și metadatele App Store Connect să conțină un link funcțional la **Terms of Use (EULA)**, alături de informațiile complete despre abonament (titlu, durată, preț). În prezent avem doar Privacy Policy — lipsește EULA.

## Plan în pași

### 1. Pagina Terms of Use (EULA) în app
- Creăm `src/pages/TermsOfUsePage.tsx` cu textul standard Apple EULA (recomandat de Apple) tradus / adaptat în română, plus secțiuni specifice PyRo:
  - Titlul abonamentului: „PyRo Elev Premium" / „PyRo Profesor AI"
  - Durata: lunară, auto-reînnoire
  - Prețul: 14,99 RON/lună (Elev), 29 RON/lună (Profesor) — pe iOS afișăm și mențiunea „prețul afișat în App Store este definitiv"
  - Politica de reînnoire automată (anulare cu min. 24h înainte de finalul perioadei)
  - Cum se gestionează / anulează din Setări iOS → Apple ID → Subscriptions
  - Linkuri către Privacy Policy și Apple Standard EULA
- Înregistrăm ruta `/terms-of-use` în `src/App.tsx` (lazy, ca PrivacyPolicyPage).

### 2. Linkuri în fluxul de achiziție (cerința Apple)
În `src/components/PremiumDialog.tsx` și `src/components/TeacherPremiumDialog.tsx`, sub butonul de preț, adăugăm un bloc obligatoriu cu:
- Titlul abonamentului
- Durata („1 lună, se reînnoiește automat")
- Prețul (din `iosPrices` pe iOS, fallback hardcodat altundeva)
- Mențiunea: „Abonamentul se reînnoiește automat dacă nu este anulat cu cel puțin 24 de ore înainte de finalul perioadei. Îl poți gestiona din setările contului tău App Store."
- Două linkuri funcționale, vizibile clar:
  - **Termeni de utilizare (EULA)** → `/terms-of-use`
  - **Politica de confidențialitate** → `/privacy-policy`

### 3. Linkuri din pagina Cont și Auth
- În `AuthPage.tsx` (deja are buton Privacy) adăugăm și un buton „Termeni de utilizare".
- În `AccountProfileTab.tsx` (sau echivalent) adăugăm linkul către Terms.

### 4. Metadate App Store Connect (acțiune manuală a userului)
Userul trebuie:
- În App Store Connect → App Information → să adauge linkul EULA în câmpul „License Agreement" SAU să adauge URL-ul în descriere (`https://pyroskill.info/terms-of-use`).
- Să confirme că Privacy Policy URL este setat (`https://pyroskill.info/privacy-policy`).
- În răspunsul la Apple Review, să menționeze unde se găsesc EULA & Privacy în app (în dialogurile de Premium și în Auth/Account) și să atașeze un screen recording.

### 5. Răspuns către App Review
Pregătim un text scurt pe care userul îl poate copia în răspunsul către Apple, indicând:
- Locul exact al linkurilor în app (PremiumDialog, TeacherPremiumDialog, Auth, Account, Terms page)
- URL public al EULA
- Build-ul nou care trebuie urcat după modificări

## Fișiere afectate
- nou: `src/pages/TermsOfUsePage.tsx`
- editat: `src/App.tsx` (rută)
- editat: `src/components/PremiumDialog.tsx` (bloc info abonament + linkuri)
- editat: `src/components/TeacherPremiumDialog.tsx` (același bloc)
- editat: `src/pages/AuthPage.tsx` (buton Terms)
- editat: `src/components/account/AccountProfileTab.tsx` (link Terms)

## Note tehnice
- Nu e nevoie de `SubscriptionStoreView` (ar fi SwiftUI nativ); Apple îl sugerează ca opțiune, dar permite și varianta clasică — bloc text + linkuri funcționale — pe care o aplicăm.
- După deploy, userul trebuie să facă build nou iOS (`npx cap sync ios` + bump versiune în Xcode) și să-l urce.

Aprobă planul ca să-l implementez pas cu pas.