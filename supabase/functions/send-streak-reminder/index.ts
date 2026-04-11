import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const messages = [
  { title: "Seria ta e în pericol! 🔥", body: "Ai {streak} zile consecutive — nu te opri acum!" },
  { title: "Nu lăsa flacăra să se stingă! 🕯️", body: "Intră azi și continuă seria de {streak} zile!" },
  { title: "Ești pe drumul cel bun! 💪", body: "Seria ta de {streak} zile te așteaptă — rezolvă un exercițiu rapid!" },
  { title: "O lecție pe zi, succes mereu! 📚", body: "Ai deja {streak} zile! Continuă și azi!" },
  { title: "Streak-ul tău contează! ⭐", body: "{streak} zile fără pauză — ești incredibil! Nu te opri!" },
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

    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Find users with active streak who haven't been active today
    const { data: users, error } = await adminClient
      .from("profiles")
      .select("user_id, streak, display_name")
      .eq("last_activity_date", yesterdayStr)
      .gt("streak", 0);

    if (error) throw error;
    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ notified: 0, message: "No users to remind" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let notified = 0;

    for (const user of users) {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      const title = msg.title;
      const body = msg.body.replace("{streak}", String(user.streak));

      // Insert in-app notification
      await adminClient.from("notifications").insert({
        user_id: user.user_id,
        title,
        body,
      });

      notified++;
    }

    // Send push notifications to users with device tokens
    const userIds = users.map((u) => u.user_id);
    const { data: tokens } = await adminClient
      .from("device_tokens")
      .select("token, user_id")
      .in("user_id", userIds);

    if (tokens && tokens.length > 0) {
      // Group tokens by user to send personalized messages
      const tokensByUser: Record<string, string[]> = {};
      for (const t of tokens) {
        if (!tokensByUser[t.user_id]) tokensByUser[t.user_id] = [];
        tokensByUser[t.user_id].push(t.token);
      }

      // Get FCM access token
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
        for (const user of users) {
          const userTokens = tokensByUser[user.user_id];
          if (!userTokens) continue;

          const msg = messages[Math.floor(Math.random() * messages.length)];
          const title = msg.title;
          const body = msg.body.replace("{streak}", String(user.streak));

          for (const deviceToken of userTokens) {
            try {
              await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
                method: "POST",
                headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  message: {
                    token: deviceToken,
                    notification: { title, body },
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

    return new Response(JSON.stringify({ notified }), {
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
