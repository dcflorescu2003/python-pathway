import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
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
    const code = String(body?.code || '').trim()
    if (!/^\d{6}$/.test(code)) {
      return new Response(JSON.stringify({ error: 'Cod invalid' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const admin = createClient(url, serviceKey)

    const { data: otp } = await admin
      .from('email_change_otps')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!otp) {
      return new Response(JSON.stringify({ error: 'Nu există un cod activ. Cere unul nou.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (new Date(otp.expires_at).getTime() < Date.now()) {
      await admin.from('email_change_otps').delete().eq('id', otp.id)
      return new Response(JSON.stringify({ error: 'Codul a expirat. Cere unul nou.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (otp.attempts >= 5) {
      await admin.from('email_change_otps').delete().eq('id', otp.id)
      return new Response(JSON.stringify({ error: 'Prea multe încercări. Cere un cod nou.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const submittedHash = await sha256(code)
    if (submittedHash !== otp.code_hash) {
      await admin.from('email_change_otps').update({ attempts: otp.attempts + 1 }).eq('id', otp.id)
      return new Response(JSON.stringify({ error: 'Cod greșit' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Update auth user email (confirmat)
    const { error: updErr } = await admin.auth.admin.updateUserById(user.id, {
      email: otp.new_email,
      email_confirm: true,
    })
    if (updErr) {
      console.error('updateUserById', updErr)
      const msg = String(updErr.message || '')
      const code = (updErr as any).code || ''
      if (
        code === 'email_exists' ||
        msg.toLowerCase().includes('already') ||
        msg.includes('users_email_partial_key') ||
        msg.includes('duplicate key')
      ) {
        return new Response(JSON.stringify({ error: 'Acest email este deja folosit de alt cont. Loghează-te direct cu el sau folosește altă adresă.' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      return new Response(JSON.stringify({ error: msg || 'Nu am putut schimba email-ul' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Marchează în tabel
    await admin.from('user_email_reminders').upsert({
      user_id: user.id,
      real_email: otp.new_email,
      verified_at: new Date().toISOString(),
      dismissed_forever: true,
    }, { onConflict: 'user_id' })

    await admin.from('email_change_otps').delete().eq('id', otp.id)

    return new Response(JSON.stringify({ ok: true, email: otp.new_email }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e: any) {
    console.error(e)
    return new Response(JSON.stringify({ error: e?.message || 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
