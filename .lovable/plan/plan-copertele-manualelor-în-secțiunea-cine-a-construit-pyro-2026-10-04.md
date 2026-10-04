# Plan: copertele manualelor în secțiunea „Cine a construit PyRo"

## Summary

Adăugăm cele două coperti de manual (clasa a IX-a, Editura Litera) în secțiunea „Autorul" din pagina Despre, ca să se vadă din prima și să susțină examinarea AdSense.

## Ce se modifică

O singură pagină: `src/pages/web/AboutPage.tsx`, plus cele două imagini încărcate.

### 1. Secțiunea „Cine a construit PyRo" devine două coloane

- Stânga: textul existent (autor, școală, editură, butonul „Manualele la Editura Litera").
- Dreapta: cele două coperti, una lângă alta, în format portrait, cu umbră subtilă și colțuri rotunjite, în tonul existent (fără carduri noi, fără componente noi).
- Fiecare copertă este link către `https://edulit.ro/collections/informatica` (filă nouă, `rel="noopener noreferrer"`).
- Sub coperte, un rând scurt de legendă: „Manual pentru clasa a IX-a — profil matematică-informatică" și „Manual pentru clasa a IX-a — profil științe ale naturii" (textele scrise pe coperte).
- Pe telefon: coloanele se așază una sub alta, copertele rămân una lângă alta, puțin mai mici.

### 2. Imaginile

- Cele două fișiere încărcate sunt salate ca imagini externe ale aplicației (CDN), nu în depozitul de cod, cu nume clare: `manual-clasa-9-c1-mat-inf.webp` și `manual-clasa-9-c1-stiinte-naturii.webp`.
- În pagină sunt folosite prin pointerul `.asset.json`, ca și cum se întâmplă deja cu imaginile din tutoriale.
- Copertele păstrează proporțiile reale (1211×1535), deci nu se deformeză.

## Tehnic

- `lovable-assets create` pentru ambele imagini din `/mnt/user-uploads/`, pointerii scriși în `src/assets/`.
- În `AboutPage.tsx`: importuri `@/assets/<nume>.webp.asset.json`, `img` cu `width`/`height` explicite, `loading="lazy"`, `decoding="async"` și text alternativ în română.
- Nimic pe backend, nicio migrație, nicio schimbare în aplicația autentificată.
- Nu e necesar bump de versiune: e o pagină web, nu cod din aplicația mobilă.
- Verificare: `typecheck`, apoi încărcarea paginii `/about` în browser cu captură de ecran a secțiunii (desktop și telefon), ca să confirm că imaginile se văd și nu taie textul.
- La final: publicare pe [https://pyroskill.info](https://pyroskill.info) (și www).

## Opțional (nu fac dacă nu confirmi)

- Același rând cu coperte și pe pagina principală, lângă secțiunea despre autor.  
poti face si pe pagina principala