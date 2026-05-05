## Problema

La apăsarea pe „Trimite cod" în cardul „Finalizează contul", apare toast-ul „Edge Function returned a non-2xx status code".

În logurile `request-email-change`:
```
ERROR Email send failed 401 {"code":"UNAUTHORIZED_INVALID_JWT_FORMAT","message":"Invalid JWT"}
```

`request-email-change` apelează `send-transactional-email` printr-un `fetch` direct cu `Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}`. Gateway-ul Supabase respinge tokenul (fie pentru că variabila e goală în runtime, fie pentru că proiectul a trecut la cheile noi `sb_secret_...` care nu mai sunt JWT-uri valide pentru `verify_jwt = true`).

## Fix

În `supabase/functions/request-email-change/index.ts`, înlocuiesc apelul `fetch` cu invocarea prin clientul admin Supabase (care semnează corect cererea, indiferent de formatul cheii):

```ts
const { error: emailErr } = await admin.functions.invoke('send-transactional-email', {
  body: {
    templateName: 'email-change-verification',
    recipientEmail: newEmail,
    idempotencyKey: `email-change-${user.id}-${Date.now()}`,
    templateData: { code },
  },
})
if (emailErr) {
  console.error('Email send failed', emailErr)
  return new Response(JSON.stringify({ error: 'Nu am putut trimite email-ul' }), {
    status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
```

Atât. Restul fluxului (OTP, rate-limit, validare) rămâne neschimbat.

## Verificare

După deploy, testez „Trimite cod" cu emailul real din TestFlight; trebuie să primesc OTP pe email și răspuns 200 din funcție.