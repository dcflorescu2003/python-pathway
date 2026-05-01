# Plan: Profil — buton App Store, eliminare WebLogin, unificare flux Apple

## 1. Adaugă buton "Gestionează în App Store" în profil (sub "Premium activ")

În `src/components/account/AccountProfileTab.tsx`, în secțiunea Premium activ (linia ~191-223), pe lângă butonul existent `Gestionează abonamentul` (vizibil doar pentru `source === "stripe"`), adăugăm o ramură pentru iOS native:

- Detectăm iOS native prin `useSubscription()` care expune deja `isIOSNative` și `openPortal` (acesta deja face `plugin.openManageSubscriptions()` cu fallback la `itms-apps://`).
- Afișăm butonul `Gestionează în App Store` (iconă `Settings`) când `isIOSNative === true`, indiferent de `source`. La click apelează `openPortal()`.
- Pentru Android native afișăm `Gestionează în Google Play` în același mod.
- Butonul Stripe rămâne ca acum pentru web.

## 2. Elimină cardul "Activează login pe web"

- Șterg complet importul și utilizarea `WebLoginSetupCard` din `AccountProfileTab.tsx` (liniile 17 și 168).
- Șterg fișierul `src/components/account/WebLoginSetupCard.tsx` (nu mai e folosit nicăieri).

## 3. Unifică pentru Apple: adaugă email real + setează parolă + confirmă într-un singur flux

Înlocuim conținutul lui `RealEmailSetupCard.tsx` cu un wizard în 3 pași, vizibil doar pentru utilizatori `isPrivateRelay` care **nu au deja** email real verificat **sau** parolă setată. Folosim `useAuthMethods` (care expune `hasPassword`) + `useRealEmailReminder` (`hasVerifiedRealEmail`).

Logică de afișare:
- Dacă `!isPrivateRelay` → cardul nu apare (ca acum).
- Dacă `hasVerifiedRealEmail && hasPassword` → afișăm starea verde "Cont complet configurat" cu emailul; nu mai cerem nimic.
- Altfel → wizard cu 3 pași într-un singur card:
  1. **Email**: input email + buton `Continuă` → apelează `request-email-change` (trimite OTP).
  2. **Cod**: input OTP 6 cifre + buton `Verifică` → apelează `verify-email-change` (schimbă emailul în Supabase). La succes trecem automat la pas 3.
  3. **Parolă**: input parolă (min 8) + confirmare + buton `Finalizează` → `supabase.auth.updateUser({ password })`. La succes: toast „Cont configurat!", `refreshAuth()` + `refreshReminder()`.
- Sărim peste pasul 3 dacă `hasPassword === true` deja.
- Sărim peste pașii 1-2 dacă `hasVerifiedRealEmail === true` deja (cazul cineva care a verificat emailul dar n-a setat parolă încă).

Titlu nou card: „Finalizează contul". Subtitlu: „Adaugă un email real și o parolă pentru a-ți recupera contul și a te loga de pe orice device."

## 4. Curățare

- Cardul vechi `WebLoginSetupCard.tsx` se șterge.
- Memoria `mem://features/account-management/hybrid-login` și `mem://features/account-management/real-email-enforcement` rămân valabile conceptual, dar UI-ul a fuzionat — voi actualiza aceste memorii ca să reflecte fluxul unificat (un singur card pentru Apple, fără card separat pentru web login).

## Detalii tehnice

Fișiere atinse:
- `src/components/account/AccountProfileTab.tsx` — adaugă buton iOS/Android sub Premium activ; elimină `<WebLoginSetupCard />` și importul.
- `src/components/account/RealEmailSetupCard.tsx` — rescris ca wizard 3 pași (email → OTP → parolă), folosește și `hasPassword` din `useAuthMethods`.
- `src/components/account/WebLoginSetupCard.tsx` — șters.
- `mem://features/account-management/hybrid-login` și `mem://features/account-management/real-email-enforcement` — actualizate.

Niciun edge function nou; refolosim `request-email-change`, `verify-email-change` și `supabase.auth.updateUser`.