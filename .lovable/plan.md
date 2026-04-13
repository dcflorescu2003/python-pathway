

## Plan: Adaugă selecție rol la onboarding + restructurare panou profesor în cont

### Ce se schimbă

**1. Onboarding: pas nou de selecție rol (Profesor / Elev)**
- În `SchoolOnboarding.tsx`, adăugăm un pas intermediar (după Welcome, înainte de School Picker): **"Sunt Profesor" / "Sunt Elev"**
- **Elev**: mesaj motivant — „Te poți alătura unei clase, poți concura cu colegii de liceu și poți primi provocări de la profesori." → continuă la School Picker
- **Profesor**: mesaj — „Poți crea clase, da provocări și crea teste. Pentru a folosi baza de teste a aplicației, trebuie să-ți confirmi contul de profesor." → apelează `request_teacher_status()` RPC → setează `unverified` → continuă la School Picker (sau skip)
- Pasul de selecție nu apare dacă userul are deja `teacher_status` setat (re-login)

**2. AuthPage.tsx (pagina de cont) — restructurare secțiune profesor**
- **`unverified`**: 
  - Buton „Panou Profesor"
  - Buton „Dezactivează modul profesor" (apelează `revoke_teacher_status` sau resetează local)
  - Buton „Începe verificarea contului de profesor" → deschide formularul
- **`pending`** (după trimiterea cererii):
  - Buton „Panou Profesor"  
  - Buton „Dezactivează modul profesor"
  - Text „În curs de verificare" (în loc de „Începe verificarea")
  - Secțiune mesaje de la admin cu posibilitate de reply + atașare documente (VerificationChat existent)
- **`verified`**:
  - Buton „Panou Profesor"
  - Buton „Dezactivează modul profesor"
  - (Fără secțiune de verificare)

**3. Dezactivare mod profesor**
- DB migration: creăm un nou RPC `deactivate_teacher_mode()` care resetează `teacher_status = NULL`, `is_teacher = false`
- Butonul necesită confirmare (dialog)
- După dezactivare, userul redevine elev și vede din nou opțiunile de elev

**4. Index.tsx — onboarding flow update**
- Onboarding-ul verifică dacă `school_id` lipsește (ca acum), dar pasul de rol se adaugă în `SchoolOnboarding`
- Pasul de rol vine primul, apoi school picker

### Modificări fișiere

| Fișier | Ce se schimbă |
|--------|--------------|
| `src/components/onboarding/SchoolOnboarding.tsx` | Pas nou: selecție rol (Profesor/Elev) cu mesaje explicative, 3 pași total |
| `src/pages/AuthPage.tsx` | Restructurare secțiune profesor: buton dezactivare, logică pending fără buton verificare, text „În curs de verificare" |
| DB migration | Nou RPC `deactivate_teacher_mode()` — resetează `teacher_status` și `is_teacher` |

### Note
- Butonul „Devino Profesor" din AuthPage dispare (selecția se face la onboarding)
- Dacă un user deja existent nu a trecut prin noul onboarding, păstrăm butonul „Devino Profesor" ca fallback în AuthPage (pentru userii care au deja `school_id` setat dar nu au ales rol)
- `SchoolOnboarding` primește callback pentru rol ales, pentru a putea apela RPC-ul

