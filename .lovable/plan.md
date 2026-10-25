# Reclame cu recompensă pe web (AdinPlay)

## Ce vede utilizatorul
- Pe web, când rămâne fără inimi: „Vizionează o reclamă pentru a-ți reumple toate inimile, sau așteaptă 30 de minute”, plus opțiunea Premium.
- Limita rămâne cea de pe telefon: maximum 2 reclame pe zi; Premium și profesorii verificați nu văd reclame.
- Dacă reclama nu se încarcă (adblock, nu există reclamă), apare un mesaj clar, iar așteptarea de 30 de minute rămâne valabilă.

## Pași
1. **Tu (azi):** creezi cont pe adinplay.com, adaugi domeniul pyroskill.info, ceri formatul „Rewarded video”. După aprobare, îmi trimiți codul de publisher și codul de amplasare (sunt publice, nu secrete).
2. **Eu, până la aprobare:** pregătesc integrarea dezactivată, ca să nu se schimbe nimic pentru elevi:
   - încărcarea scriptului AdinPlay doar pe web, doar când e nevoie;
   - butonul de reclamă din dialogul de inimi și din lecție, cu acordarea inimilor prin același mecanism securizat ca pe telefon (inclusiv limita zilnică);
   - un comutator de activare din panoul Admin, ca reclamele să poată fi oprite instant fără update.
3. **După aprobare:** pun codurile și activăm. În același moment revine așteptarea de 30 de minute pe web (acum e instantă). Ordinea contează: nu repornim așteptarea înainte să meargă reclamele.
4. **Verificare:** test în browser (reclamă completă → 5 inimi; reclamă închisă devreme → nimic; a 3-a reclamă în aceeași zi → blocată), apoi monitorizare câteva zile.

## Ce nu se schimbă
- Aplicațiile din magazine (AdMob rămâne la fel), deci nu e nevoie de update în store.
- Codul AdSense se scoate din site, ca să nu se încarce degeaba.

## Detalii tehnice
- Înlocuire `useWebRewardedAds.ts`: din H5 Games Ads → AdinPlay (`aipPlayer`, callback-uri `AIP_COMPLETE` / `AIP_REMOVE`); recompensa se dă doar la vizionare completă.
- Recompensa trece prin funcția edge existentă `reward-life` (validare server, limită 2/zi), cu o sursă `web` pentru statistici.
- Setare `web_ads_enabled` + ID-uri stocate într-un tabel de configurare citit public, editabil doar de admin.
- Regenerarea la 30 min pe web se reactivează legată de același comutator.
- Ștergere script AdSense din `index.html`; `ads.txt` cu liniile primite de la AdinPlay.
