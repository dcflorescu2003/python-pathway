## Problem
Pe iOS, dialogul "Adaugă un email real" apare chiar și pentru utilizatorii care au deja email + parolă setate. Cauza: `useRealEmailReminder` declanșează reminderul doar pe baza `isPrivateRelay` (email-ul se termină în `@privaterelay.appleid.com`), fără să verifice dacă utilizatorul are deja o parolă reală setată — caz în care contul e deja recuperabil prin email/parolă și reminderul nu mai are sens.

## Fix
În `src/hooks/useRealEmailReminder.ts`, când evaluăm dacă să arătăm reminderul:
- Dacă `hasPassword` este `true` (din `useAuthMethods`, bazat pe `profiles.has_real_password`), nu mai arătăm reminderul, indiferent de `isPrivateRelay`.

Practic: condiția devine `if (!isPrivateRelay || hasPassword) → setShouldShow(false)`.

## De ce e safe
- `RealEmailSetupCard` din pagina Account va continua să apară pentru cazul edge `hasVerifiedRealEmail && !hasPassword` (logica lui rămâne neschimbată).
- Apple Class Gating și Real Email Enforcement nu depind de acest popup — au propriile lor verificări.
- Memoria proiectului (`Real Email Enforcement`) rămâne validă: reminderul rulează doar pentru Hide-My-Email fără parolă reală.

## Files changed
- `src/hooks/useRealEmailReminder.ts` — adăugat `hasPassword` din `useAuthMethods` și exclus din `shouldShow`.
