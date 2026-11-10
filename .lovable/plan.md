# 5 îmbunătățiri: provocări, teste partajate, clasă, login

1. **Fără „Best 0%” la probleme** – în lista de provocări a elevului, scorul „Best” rămâne doar la lecții; problemele arată simplu „Rezolvată” / „Nerezolvată”.
2. **Previzualizare cerință pentru profesor** – în provocările profesorului (și la alegerea lor), fiecare problemă are un buton „Vezi cerința” care deschide o fereastră cu titlul, enunțul și exemplele de intrare/ieșire (fără soluție).
3. **„Previzualizează testul” pentru colegi** – la testele primite prin partajare apare, lângă „Duplică în testele mele”, butonul de previzualizare identic cu cel al autorului (doar vizualizare, fără modificări).
4. **Confirmare la părăsirea clasei** – butonul „Părăsește” deschide întâi o fereastră: „Sigur vrei să părăsești clasa X? Vei pierde accesul la provocări și teste; poți reveni doar cu codul clasei.” cu „Anulează” / „Părăsește clasa”.
5. **„Ține-mă minte” la login cu email și parolă** – bifă bifată implicit. Dacă e debifată, la închiderea completă a aplicației/browserului utilizatorul e deconectat la următoarea pornire. Login Google/Apple rămâne neschimbat (mereu persistent).

## Detalii tehnice
- 1: `StudentTab.tsx` linia cu `Best:` condiționată de `item_type === "lesson"`.
- 2: dialog nou reutilizabil care citește problema din catalogul existent (`get_problems_catalog`, fără soluție), folosit în lista de provocări a profesorului și în `ChallengeAssigner`.
- 3: în `TestManager.tsx` secțiunea teste partajate, refolosim componenta de preview existentă; accesul la itemi e deja permis prin `can_teacher_view_test` – verific la implementare că preview-ul citește itemii prin RLS-ul ce include share-urile.
- 4: `AlertDialog` în `StudentTab.tsx` înaintea apelului de părăsire.
- 5: flag `pyro-remember-me` în localStorage + marcaj în sessionStorage; la pornire, dacă flag-ul e false și marcajul de sesiune lipsește, `signOut` local. Pe nativ, „închiderea aplicației” = repornire la rece. Fără modificări la clientul auto-generat.
- Necesită bump versiune (1.244) pentru magazine din cauza punctelor 1, 4, 5.
