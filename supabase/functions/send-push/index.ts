import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Get Google OAuth2 access token from service account
async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: serviceAccount.token_uri,
      iat: now,
      exp: now + 3600,
    })
  );

  const pemContent = serviceAccount.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");

  const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureInput = new TextEncoder().encode(`${header}.${payload}`);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    signatureInput
  );

  const base64Signature = btoa(
    String.fromCharCode(...new Uint8Array(signature))
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${header}.${payload}.${base64Signature}`;

  const tokenRes = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error("Failed to get access token: " + JSON.stringify(tokenData));
  }
  return tokenData.access_token;
}

Deno.serve(async (req) => {
  console.log("[SEND-PUSH] Function invoked, method:", req.method);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate caller has a valid apikey or authorization header
    const apiKey = req.headers.get("apikey");
    const authHeader = req.headers.get("Authorization");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    const hasValidApiKey = apiKey && (apiKey === anonKey || apiKey === serviceKey);
    const hasValidAuth = authHeader?.startsWith("Bearer ");
    
    if (!hasValidApiKey && !hasValidAuth) {
      console.log("[SEND-PUSH] REJECTED: No valid credentials");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }
    console.log("[SEND-PUSH] Auth OK - apikey:", !!hasValidApiKey, "bearer:", !!hasValidAuth);

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { student_ids, title, body: msgBody } = body;
    console.log("[SEND-PUSH] Body parsed:", JSON.stringify({ student_ids_count: student_ids?.length, title, body: msgBody }));

    if (!student_ids?.length || !title || !msgBody) {
      console.log("[SEND-PUSH] REJECTED: Missing fields");
      return new Response(
        JSON.stringify({ error: "Missing student_ids, title, or body" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Reuse adminClient from above for device tokens

    const { data: tokens, error: tokensError } = await adminClient
      .from("device_tokens")
      .select("token")
      .in("user_id", student_ids);

    console.log("[SEND-PUSH] Device tokens found:", tokens?.length ?? 0, "error:", tokensError?.message ?? "none");

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No device tokens found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get FCM access token
    const serviceAccount = JSON.parse(
      Deno.env.get("FIREBASE_SERVICE_ACCOUNT")!
    );
    const accessToken = await getAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id;
    console.log("[SEND-PUSH] FCM access token obtained, project:", projectId);

    // Send to each device
    let sent = 0;
    for (const { token: deviceToken } of tokens) {
      console.log("[SEND-PUSH] Sending to token:", deviceToken.substring(0, 20) + "...");
      const res = await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token: deviceToken,
              notification: { title, body: msgBody },
              android: {
                priority: "high",
                notification: { sound: "default" },
              },
              apns: {
                headers: {
                  "apns-priority": "10",
                },
                payload: {
                  aps: {
                    sound: "default",
                    badge: 1,
                    "content-available": 1,
                  },
                },
              },
            },
          }),
        }
      );
      const resBody = await res.text();
      console.log("[SEND-PUSH] FCM response status:", res.status, "body:", resBody);
      if (res.ok) {
        sent++;
      } else {
        console.error("[SEND-PUSH] FCM error for token:", deviceToken.substring(0, 20) + "...", resBody);
      }
    }

    console.log("[SEND-PUSH] Done. Sent:", sent, "of", tokens.length);
    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[SEND-PUSH] Unhandled error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
