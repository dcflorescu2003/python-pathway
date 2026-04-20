

## Adaugă secretul `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` și activează verificarea Play Billing

Service account-ul `pyro-play-billing` e activ în Play Console. Mai trebuie un singur pas tehnic înainte să poți testa: secretul cu cheia JSON trebuie pus în Lovable Cloud ca să poată edge function-ul `verify-play-purchase` să cheme Google Play Developer API.

### Ce voi face

1. **Declanșa dialogul de adăugare secret** pentru `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` în Lovable Cloud.
2. Aștepta să introduci valoarea (conținutul integral al fișierului `.json` descărcat din Google Cloud Console).

### Ce trebuie să faci tu

1. Deschide fișierul `.json` cu cheia service account-ului (cel descărcat când ai creat `pyro-play-billing` în Google Cloud).
2. Selectează **tot conținutul** — de la prima `{` până la ultima `}`, inclusiv `private_key`, `client_email`, etc.
3. Lipește în câmpul de valoare al secretului.
4. Salvează.

### De ce e necesar

`supabase/functions/verify-play-purchase/index.ts` deja:
- citește `Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON")`
- semnează un JWT RS256 cu `private_key`
- schimbă JWT-ul cu un access token OAuth2
- cheamă `androidpublisher.googleapis.com/.../subscriptionsv2/tokens/{purchaseToken}`
- validează `subscriptionState === SUBSCRIPTION_STATE_ACTIVE`
- scrie în `play_billing_subscriptions` și marchează `profiles.is_premium = true`

Fără secret, edge function-ul intră în ramura „unverified fallback" (acordă premium optimist 30/365 zile fără să întrebe Google) — nu vrem asta în producție.

### După ce salvezi secretul

1. Build AAB nou (sau folosește build-ul curent dacă produsele Play sunt deja propagate).
2. Upload pe pista **Internal testing** în Play Console.
3. Adaugă-ți contul Google ca **License tester**: Play Console → Setup → License testing.
4. Instalează din linkul de internal testing pe telefon.
5. Deschide PyRo → Cont → Premium → alege un plan.
6. Confirmă plata test (nu se face debitare reală pentru License testers).
7. Verifici în logs că apare `[VERIFY-PLAY-PURCHASE] Play API response { state: "SUBSCRIPTION_STATE_ACTIVE" }`.
8. Verifici în profil că badge-ul Premium apare și că rândul există în `play_billing_subscriptions`.

### Dacă apare eroare la primul test

- **`401 Unauthorized` de la Google Play** → permisiunile service account-ului nu sunt complete; revino în Users and permissions → editează `pyro-play-billing` → bifează „View financial data" + „Manage orders and subscriptions" + acces la app PyRo.
- **`Subscription not active`** → produsele tocmai create durează până la câteva ore să propage; sau folosești un cont care nu e License tester.
- **`Produs negăsit` în client** → `student_premium` / `teacher_premium` nu sunt marcate Active în Play Console.

