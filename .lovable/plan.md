## Implementare Opțiunea B — APNs direct din edge function

### Secrete de adăugat (4)
- `APNS_AUTH_KEY` = conținutul `.p8` (BEGIN/END PRIVATE KEY inclus)
- `APNS_KEY_ID` = `7WU73F592A`
- `APNS_TEAM_ID` = `6FAUMS27V7`
- `APNS_BUNDLE_ID` = `ro.pythonpathway.app`

### Modificări `supabase/functions/send-push/index.ts`

1. Selectăm și `platform` din `device_tokens`, nu doar `token`.
2. Pentru fiecare token:
   - Dacă `platform === 'ios'` → trimitem direct la APNs:
     - Generăm JWT ES256 semnat cu cheia `.p8` (header: `alg: ES256`, `kid: APNS_KEY_ID`; payload: `iss: APNS_TEAM_ID`, `iat: now`). Cache-ul JWT-ului ~50 min în memoria function-ului.
     - POST la `https://api.push.apple.com/3/device/{token}` cu headere:
       - `authorization: bearer <JWT>`
       - `apns-topic: ro.pythonpathway.app`
       - `apns-push-type: alert`
       - `apns-priority: 10`
     - Body: `{ aps: { alert: { title, body }, sound: "default", badge: 1 } }`
     - Dacă răspunsul e 410 (`Unregistered`) sau 400 `BadDeviceToken` → adăugăm tokenul la lista de șters.
   - Dacă `platform === 'android'` (sau lipsește) → flow-ul existent FCM.
3. Numărător `sent` incrementat în ambele căi.
4. Cleanup token-uri invalide rămâne identic (șterge după `token`).

### Detalii tehnice JWT ES256 în Deno

- `crypto.subtle.importKey("pkcs8", pemBytes, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"])`
- Semnăm `header.payload`, convertim semnătura DER→raw (64 bytes IEEE P1363) — folosim direct rezultatul `subtle.sign` care în WebCrypto returnează deja format raw pentru ECDSA, deci no-op.
- Base64url encode header + payload + signature.

### Test final
După deploy, trimitem o notificare test către `cosmin.florescu.tr@gmail.com` (apel direct la `send-push` cu `student_ids = [<user_id>]`, title="Test iOS APNs", body="Funcționează direct prin Apple"). Verificăm log-urile edge function și status-ul HTTP de la Apple (200 = livrat la APNs).

### Ce NU se schimbă
- Nu se rebuild iOS app — tokenii APNs hex deja stocați devin valizi.
- `usePushNotifications.tsx` rămâne identic.
- Schema DB rămâne identică.
