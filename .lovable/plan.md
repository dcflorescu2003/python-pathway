## Plan: Integrare AdMob pentru refill inimi prin reclamă rewarded

### Ce facem

Integrăm Google AdMob (rewarded video ads) în aplicația Capacitor, ca elevii fără Premium să poată câștiga 1 inimă vizionând o reclamă scurtă (~30s).

### Arhitectură

**Plugin folosit:** `@capacitor-community/admob` — oficial, suportă rewarded ads pe Android + iOS, integrare nativă curată.

**Flux UX:**

1. Elev fără Premium încearcă să intre într-o lecție cu 0 inimi → dialog existent „Fără inimi"
2. Adăugăm buton nou: **„Vizionează o reclamă pentru + 5 inimi ❤️"**
3. Click → se afișează rewarded ad (full screen)
4. La eveniment `Rewarded` (utilizatorul a vizionat complet) → +5 inimă în DB, sau 5daca are deja inimi
5. Limită: max **2 reclame/zi** per user (anti-abuz), tracked în `profiles` (coloană nouă)
6. Premium nu vede butonul (au inimi infinite)

### Pași de implementare

**1. Instalare plugin**

- `@capacitor-community/admob`
- `npx cap sync` (utilizatorul rulează local după pull)

**2. Configurare Android**

- `android/app/src/main/AndroidManifest.xml`: adaug `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="ca-app-pub-XXXX~YYYY"/>`
- `AdMob App ID` — îți cer să-l furnizezi (din contul AdMob)

**3. Configurare iOS**

- `ios/App/App/Info.plist`: adaug `GADApplicationIdentifier` + `SKAdNetworkItems`
- Config NSUserTrackingUsageDescription pentru iOS 14+ (consimțământ tracking)

**4. Cod frontend (web fallback inclus)**

- Hook nou: `src/hooks/useAdMob.ts` — inițializare, request consent, show rewarded
- Pe web (preview Lovable): butonul e ascuns sau afișează „Disponibil doar în aplicația mobilă"
- Pe native: real ads (test IDs în development, production IDs în release)

**5. UI în dialogul „Fără inimi"**

- Identific dialogul actual (probabil în `useProgress.ts` sau component dedicat — verific la implementare)
- Adaug buton rewarded ad sub mesaj, doar dacă: `!isPremium && !isNative ? hidden : visible`
- Loading state cât se încarcă reclama; toast la succes/eșec

**6. Backend (DB + Edge)**

- Migration: adaug în `profiles` coloanele `ads_watched_today` (int) + `ads_last_reset` (date)
- Edge function nouă: `reward-life` — verifică limită 5/zi, resetează zilnic, incrementează inimi
- RLS: doar user-ul propriu poate apela; edge function folosește service_role pentru update

**7. Test IDs vs Production IDs**

- În development: folosim Google test ad unit IDs (oficial, sigure)
- În production: utilizatorul îmi dă unit ID-urile reale după ce-și creează app-ul în AdMob

### Ce am nevoie de la tine ulterior (după aprobare plan)

1. **AdMob App ID** (Android + iOS) — din panoul AdMob → App settings
2. **Rewarded Ad Unit ID** (Android + iOS) — din panoul AdMob → Ad units

Dacă nu le ai încă, începem cu test IDs și înlocuim înainte de release în Play Store.

### Fișiere afectate

- `package.json` — dependență nouă
- `android/app/src/main/AndroidManifest.xml` — App ID
- `ios/App/App/Info.plist` — App ID + SKAdNetwork + tracking permission
- `src/hooks/useAdMob.ts` — nou
- Componenta dialog „Fără inimi" — buton nou
- `supabase/functions/reward-life/index.ts` — nou
- Migration SQL — coloane noi în `profiles`

### Note

- Nu mențin reclame interstițiale/banner — doar **rewarded** (alegere user, nu intruziv)
- Compatibil cu politica Google Play (rewarded e încurajat)
- Pe iOS necesită App Tracking Transparency prompt — handled de plugin