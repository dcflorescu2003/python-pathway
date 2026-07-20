
## Scop
Popularea primului tutorial pentru elevi (`/tutoriale/elevi/creeaza-cont`) cu cele 4 screenshoturi încărcate, în locul placeholderelor.

## Mapare imagini → secțiuni

Imaginile arată fluxul: Splash „Bine ai venit" → Rol (Elev/Profesor) → Auth → Alege liceul. Deci restructurez ușor secțiunile din tutorial ca să acopere logic tot onboarding-ul.

| # | Secțiune | Imagine |
|---|---|---|
| 1 | **Deschide aplicația** (splash intro cu „Să începem") | `image-198.png` |
| 2 | **Alege rolul** (Elev / Profesor) | `image-199.png` |
| 3 | **Înregistrare / Autentificare** (email, Google, Apple) | `image-197.png` |
| 4 | **Alege școala** (search cu liste 1500+) | `image-200.png` |
| 5 | **Setează un nickname** (fără imagine, rămâne text) | — |

Textele existente se păstrează, doar se extind cu 2 secțiuni noi (splash + rol) și se adaugă imaginile reale.

## Pași tehnici

1. **Încărcare imagini ca asset-uri Lovable** (nu binar în repo) — pentru fiecare imagine:
   ```
   lovable-assets create --file /mnt/user-uploads/image-XXX.png \
     --filename tutorial-creeaza-cont-<slug>.png \
     > src/assets/tutorial-creeaza-cont-<slug>.png.asset.json
   ```
   4 pointere JSON în `src/assets/`.

2. **Editare `src/data/tutorials/students.ts`** pentru articolul `creeaza-cont`:
   - Import pointere: `import splashAsset from "@/assets/tutorial-creeaza-cont-splash.png.asset.json"` etc.
   - Restructurare `sections` în 5 blocuri conform tabelului de mai sus.
   - Fiecare `section.image` primește `src: xxxAsset.url`, `alt` descriptiv; se elimină `placeholder`.

3. **Fără schimbări** în `TutorialArticleView.tsx` — deja randează `section.image.src` când există.

## Verificare
- `/tutoriale/elevi/creeaza-cont` afișează cele 4 screenshoturi reale, cu caption-uri.
- Restul tutorialelor rămân neatinse (placeholders până le trimiți).

## Next
După aprobare, îmi trimiți pe rând imaginile pentru celelalte 6 tutoriale elevi + cele pentru profesori și le adaug la fel.
