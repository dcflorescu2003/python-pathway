# Adăugare iOS Production Rewarded Ad Unit ID

## Context
Mesajul GDPR și IDFA sunt publicate. Tocmai am creat în AdMob unitatea Rewarded pentru iOS cu ID-ul `ca-app-pub-8441862030200888/2233406545`. Codul are deja toată logica de rewarded ads — lipsește doar ID-ul de producție.

## Modificare

### `src/hooks/useAdMob.ts`
Înlocuiește:
```ts
const PROD_REWARDED_IOS = "";
```
cu:
```ts
const PROD_REWARDED_IOS = "ca-app-pub-8441862030200888/2233406545";
```

Atât. Restul logicii din `getAdUnitId()` deja preferă production-ul când există, altfel cade pe test ID.

## Bump versiune (pentru build-ul iOS care va include modificarea)

### `ios/App/App.xcodeproj/project.pbxproj`
- Incrementează `CURRENT_PROJECT_VERSION` (build number) cu 1, pentru ambele config (Debug + Release).
- `MARKETING_VERSION` rămâne neschimbată (e doar o modificare internă de config, nu feature nou).

Android nu se atinge — nu e afectat.

## Ce NU se schimbă
- Nu se modifică Info.plist (deja are toate cheile).
- Nu se modifică AdMob App ID (`GADApplicationIdentifier` rămâne `ca-app-pub-8441862030200888~3251970590`).
- Nu se modifică logica de afișare reclame, limita de 2/zi sau acordarea de vieți.

## Validare post-implementare
1. `npx cap sync ios` (după git pull pe Mac)
2. Build iOS în Xcode → instalează pe device real
3. La prima deschidere: pre-prompt IDFA → prompt nativ ATT
4. În lecție fără vieți: tap pe „Privește o reclamă" → reclamă rewarded reală (nu mai e test ad) → +5 vieți
