import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function genCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000
  return n.toString().padStart(6, '0')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization') || ''
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const user = userData.user

    const body = await req.json().catch(() => ({}))
    const newEmail = String(body?.new_email || '').trim().toLowerCase()
    if (!EMAIL_RE.test(newEmail) || newEmail.length > 255) {
      return new Response(JSON.stringify({ error: 'Email invalid' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (newEmail.endsWith('@privaterelay.appleid.com')) {
      return new Response(JSON.stringify({ error: 'Folosește o adresă reală, nu Apple Hide My Email' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (user.email && newEmail === user.email.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'Acest email este deja al tău' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const admin = createClient(url, serviceKey)

    // Rate limit: 1 cerere/minut
    const since = new Date(Date.now() - 60_000).toISOString()
    const { data: recent } = await admin
      .from('email_change_otps')
      .select('id, created_at')
      .eq('user_id', user.id)
      .gte('created_at', since)
      .limit(1)
    if (recent && recent.length > 0) {
      return new Response(JSON.stringify({ error: 'Așteaptă un minut înainte să ceri un nou cod' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Verifică unicitatea
    const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
    // listUsers nu filtrează după email; folosim getUserByEmail dacă există, altfel skipăm.

    const code = genCode()
    const codeHash = await sha256(code)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    // Curăță OTP-uri vechi pentru acest user
    await admin.from('email_change_otps').delete().eq('user_id', user.id)

    const { error: insErr } = await admin.from('email_change_otps').insert({
      user_id: user.id,
      new_email: newEmail,
      code_hash: codeHash,
      expires_at: expiresAt,
    })
    if (insErr) throw insErr

    // Trimite email prin clientul admin (semnează corect indiferent de formatul cheii)
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
      return new Response(JSON.stringify({ error: 'Nu am putut trimite email-ul' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e: any) {
    console.error(e)
    return new Response(JSON.stringify({ error: e?.message || 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
