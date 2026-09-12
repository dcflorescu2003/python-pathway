# Corectarea prețului Elev Premium în Google Play

## Modificare
- În cartonașul „Elev Premium”, pe Android, prețul lunar afișat devine **17,99 RON/lună**.
- Textul informativ de sub cartonaș va afișa aceeași valoare de **17,99 RON/lună** pe Android.
- Pe web rămâne prețul actual de **14,99 RON/lună**.
- Pe iPhone/iPad rămâne prețul preluat automat din App Store.

## Detalii tehnice
- Se actualizează doar `PremiumDialog`, separând explicit afișarea pentru Google Play, App Store și web.
- Nu se modifică produsul, plata, abonamentele existente sau prețul configurat în magazine; se corectează numai valoarea afișată utilizatorului.
- Se verifică afișarea pentru toate cele trei platforme și validitatea TypeScript.
