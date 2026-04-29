import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mesaje pentru utilizatorii cu streak în pericol (ultima activitate = ieri)
const dangerMessages = [
  { title: "Bună dimineața! ☀️", body: "Streak-ul tău de {streak} zile te așteaptă — o lecție rapidă cu cafeaua?" },
  { title: "Trezește-te cu Python! 🐍", body: "Ai {streak} zile la rând. Nu lăsa flacăra să se stingă azi!" },
  { title: "Seria ta e în pericol! 🔥", body: "{streak} zile consecutive — păstrează ritmul cu un exercițiu rapid!" },
  { title: "O lecție pe zi, succes mereu! 📚", body: "Ai deja {streak} zile! Continuă seria și azi!" },
  { title: "Streak-ul tău contează! ⭐", body: "{streak} zile fără pauză — ești incredibil! Hai să continuăm!" },
];

// Mesaje pentru cei care au sărit deja 2-7 zile (revenire)
const comebackMessages = [
  { title: "Ne-a fost dor de tine! 💚", body: "Hai înapoi la PyRo — recuperăm seria împreună!" },
  { title: "Python te așteaptă 🐍", body: "Au trecut câteva zile. Reia ritmul cu o lecție scurtă azi!" },
  { title: "Bună dimineața! ☀️", body: "Hai să revenim la cod — un exercițiu rapid și ești înapoi pe drum!" },
  { title: "Nu uita de Python! 💻", body: "Te așteaptă lecții noi. Hai să dai start zilei cu o provocare!" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    // Toți userii care au un streak > 0 și au fost activi între acum 7 zile și ieri
    const { data: users, error } = await adminClient
      .from("profiles")
      .select("user_id, streak, display_name, last_activity_date")
      .gte("last_activity_date", sevenDaysAgoStr)
      .lte("last_activity_date", yesterdayStr)
      .gt("streak", 0);

    if (error) throw error;
    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ notified: 0, message: "No users to remind" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verifică care utilizatori au primit deja o notificare azi (idempotență)
    const userIds = users.map((u) => u.user_id);
    const { data: existingNotifs } = await adminClient
      .from("notifications")
      .select("user_id")
      .in("user_id", userIds)
      .gte("created_at", todayStr + "T00:00:00.000Z")
      .or("title.ilike.%streak%,title.ilike.%dimineața%,title.ilike.%Python%,title.ilike.%dor de tine%");

    const alreadyNotified = new Set((existingNotifs ?? []).map((n: any) => n.user_id));
    const toNotify = users.filter((u) => !alreadyNotified.has(u.user_id));

    if (toNotify.length === 0) {
      return new Response(JSON.stringify({ notified: 0, message: "All users already notified today" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pregătim mesajul per utilizator (în pericol vs revenire)
    const userMessages: Record<string, { title: string; body: string }> = {};
    const inAppRows: Array<{ user_id: string; title: string; body: string }> = [];

    for (const user of toNotify) {
      const isDanger = user.last_activity_date === yesterdayStr;
      const pool = isDanger ? dangerMessages : comebackMessages;
      const tpl = pool[Math.floor(Math.random() * pool.length)];
      const title = tpl.title;
      const body = tpl.body.replace("{streak}", String(user.streak));
      userMessages[user.user_id] = { title, body };
      inAppRows.push({ user_id: user.user_id, title, body });
    }

    // Insert in-app notifications batch
    if (inAppRows.length > 0) {
      await adminClient.from("notifications").insert(inAppRows);
    }

    // Push notifications (FCM)
    const { data: tokens } = await adminClient
      .from("device_tokens")
      .select("token, user_id")
      .in("user_id", Object.keys(userMessages));

    if (tokens && tokens.length > 0) {
      const tokensByUser: Record<string, string[]> = {};
      for (const t of tokens) {
        if (!tokensByUser[t.user_id]) tokensByUser[t.user_id] = [];
        tokensByUser[t.user_id].push(t.token);
      }

      let accessToken: string | null = null;
      let projectId: string | null = null;
      try {
        const serviceAccount = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT")!);
        projectId = serviceAccount.project_id;

        const now = Math.floor(Date.now() / 1000);
        const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
        const payload = btoa(JSON.stringify({
          iss: serviceAccount.client_email,
          scope: "https://www.googleapis.com/auth/firebase.messaging",
          aud: serviceAccount.token_uri,
          iat: now,
          exp: now + 3600,
        }));

        const pemContent = serviceAccount.private_key
          .replace("-----BEGIN PRIVATE KEY-----", "")
          .replace("-----END PRIVATE KEY-----", "")
          .replace(/\n/g, "");
        const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));
        const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);

        const signatureInput = new TextEncoder().encode(`${header}.${payload}`);
        const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, signatureInput);
        const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
          .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

        const jwt = `${header}.${payload}.${base64Signature}`;
        const tokenRes = await fetch(serviceAccount.token_uri, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
        });
        const tokenData = await tokenRes.json();
        accessToken = tokenData.access_token || null;
      } catch (e) {
        console.error("Failed to get FCM token:", e);
      }

      if (accessToken && projectId) {
        for (const [userId, msg] of Object.entries(userMessages)) {
          const userTokens = tokensByUser[userId];
          if (!userTokens) continue;

          for (const deviceToken of userTokens) {
            try {
              await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
                method: "POST",
                headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  message: {
                    token: deviceToken,
                    notification: { title: msg.title, body: msg.body },
                    android: { priority: "high", notification: { sound: "default" } },
                  },
                }),
              });
            } catch (e) {
              console.error("FCM send error:", e);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ notified: inAppRows.length, total_candidates: users.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-streak-reminder error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
