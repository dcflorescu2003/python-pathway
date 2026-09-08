# Repararea verificării domeniului pyroskill.info în Play Console (linkuri directe)

## Ce înseamnă erorile

Play Console → Linkuri directe raportează „Verificările domeniului nu au reușit" pentru pyroskill.info:
- aplicația Android are în `AndroidManifest.xml` un intent-filter pentru linkuri web (`https://pyroskill.info/*`), dar Google nu a găsit fișierul de verificare `https://pyroskill.info/.well-known/assetlinks.json`.
- Consecința: linkurile către site NU deschid automat aplicația pe Android (se deschid în browser sau apare dialogul de alegere).
- Nu afectează publicarea, actualizările sau funcționarea aplicației. Nu blochează nimic critic.
- Sugestia „Conectează contul Google Ads" este opțională — o ignorăm.

## Ce trebuie făcut

1. **Obținem amprenta SHA-256** a certificatului de semnare:
   - Play Console → Configure → Play App Signing → „App signing key certificate" → SHA-256.
   - (Opțional și upload key, dar de obicei e suficient app signing.)
2. **Creăm fișierul `public/.well-known/assetlinks.json`** în proiect cu conținutul:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "ro.pythonpathway.app",
    "sha256_cert_fingerprints": ["<AMPRENTA_SHA_256>"]
  }
}]
```
3. **Verificăm că intent-filter-ul existent** din `android/app/src/main/AndroidManifest.xml` are `android:autoVerify="true"` și că host-ul e `pyroskill.info` (fără alte domenii neverificate).
4. **Publicăm site-ul** — fișierul devine disponibil la `https://pyroskill.info/.well-known/assetlinks.json`.
5. **Retrigger verificare** în Play Console (re-verificare domeniu) → erorile „Nereușit" dispar.

## Note tehnice

- Fișierul trebuie servit cu `Content-Type: application/json`, fără redirect; îl verificăm cu curl după publicare.
- Acest fișier e accesat de Google, nu de codul aplicației web — nu e nevoie de schimbări în React/Supabase.

## Ce trebuie de la tine

- Amprenta SHA-256 din Play Console (Play App Signing → App signing key certificate). O copiezi în chat și o punem în fișier.
