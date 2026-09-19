# Conformitate GDPR pe web

## Starea actuală (verificată)

- Există pagina publică `/privacy-policy` (cu email de contact gdpr@pyroskill.info) și `/terms-of-use` — bine.
- Există ștergerea contului cu ștergere în cascadă a datelor (dreptul la ștergere) — bine.
- Scriptul AdSense din `index.html` se încarcă automat la fiecare vizită, fără consimțământ — **problemă**: Google cere un mecanism de consimțământ (CMP) pentru utilizatorii din UE/SEE înainte de a încărca/personaliza reclame. Fără el riscăm și încălcarea GDPR, și sancțiuni AdSense.
- Restul datelor din `localStorage` (autentificare, progres) sunt strict necesare funcționării și nu cer consimțământ separat.

## Ce construim

### 1. Banner de consimțământ pentru cookie-uri/reclame (web only)
- Componentă nouă `CookieConsentBanner`, afișată doar pe web (nu în aplicația nativă), la prima vizită.
- Două butoane clare: „Accept" și „Doar esențiale" + link către `/privacy-policy`.
- Alegerea se salvează în `localStorage` (cheie `cookie_consent`) și bannerul nu mai apare.
- Stil identic cu tema aplicației (dark, accente verde/cyan), poziționat jos, fără să blocheze navigarea.

### 2. Încărcarea AdSense doar după consimțământ
- Scoatem scriptul AdSense din `index.html` (încărcare statică).
- Îl încărcăm dinamic doar dacă utilizatorul a acceptat. Dacă alege „Doar esențiale", scriptul nu se încarcă deloc.
- Reclamele rewarded pentru inimi (când se activează H5 Games Ads) vor cere implicit consimțământul deja dat.

### 3. Mici completări la pagina de confidențialitate
- Mențiune despre reclamele Google AdSense și cookie-urile terțe, cu link către politica Google.
- Notă despre cum își poate schimba utilizatorul consimțământul (buton „Setări cookie-uri" în footer-ul web care re-deschide bannerul).

## Ce NU se schimbă
- Aplicațiile native (iOS/Android) — nu sunt afectate.
- Autentificarea, progresul, stocarea locală funcțională.
- Nu adăugăm analytics sau alte trackere noi.

## Fișiere
- `index.html` — eliminarea scriptului AdSense static.
- `src/components/web/CookieConsentBanner.tsx` — nou.
- `src/components/web/WebFooter.tsx` — buton „Setări cookie-uri".
- `src/App.tsx` (sau layout-ul web) — montarea bannerului.
- `src/pages/PrivacyPolicyPage.tsx` — completări AdSense/cookie-uri.

## Verificare
- Typecheck + testare în browser: bannerul apare la prima vizită, dispare după alegere, reapare din footer; scriptul AdSense apare în rețea doar după accept.
