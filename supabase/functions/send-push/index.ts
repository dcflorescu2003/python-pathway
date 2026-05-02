import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ============== FCM (Android) ==============
async function getFcmAccessToken(serviceAccount: any): Promise<string> {
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

// ============== APNs (iOS) ==============
function base64UrlEncode(input: string | Uint8Array): string {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

let cachedApnsJwt: { token: string; expiresAt: number } | null = null;

async function getApnsJwt(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedApnsJwt && cachedApnsJwt.expiresAt > now + 60) {
    return cachedApnsJwt.token;
  }

  const authKey = Deno.env.get("APNS_AUTH_KEY") ?? "";
  const keyId = Deno.env.get("APNS_KEY_ID") ?? "";
  const teamId = Deno.env.get("APNS_TEAM_ID") ?? "";

  if (!authKey || !keyId || !teamId) {
    throw new Error("Missing APNS_AUTH_KEY, APNS_KEY_ID, or APNS_TEAM_ID");
  }

  const pemContent = authKey
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");

  const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const header = base64UrlEncode(JSON.stringify({ alg: "ES256", kid: keyId, typ: "JWT" }));
  const payload = base64UrlEncode(JSON.stringify({ iss: teamId, iat: now }));
  const signingInput = `${header}.${payload}`;

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const sigB64 = base64UrlEncode(new Uint8Array(signature));
  const jwt = `${signingInput}.${sigB64}`;

  // APNs JWTs valid up to 60 min, refresh at 50 min
  cachedApnsJwt = { token: jwt, expiresAt: now + 50 * 60 };
  return jwt;
}

async function sendApnsPushTo(
  host: string,
  deviceToken: string,
  title: string,
  body: string,
  badge: number,
): Promise<{ ok: boolean; status: number; bodyText: string; reason: string }> {
  const jwt = await getApnsJwt();
  const bundleId = Deno.env.get("APNS_BUNDLE_ID") ?? "";

  const res = await fetch(`https://${host}/3/device/${deviceToken}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${jwt}`,
      "apns-topic": bundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      aps: {
        alert: { title, body },
        sound: "default",
        badge,
        "interruption-level": "time-sensitive",
      },
    }),
  });

  const bodyText = await res.text();
  let reason = "";
  try { reason = (JSON.parse(bodyText) as any)?.reason ?? ""; } catch { /* noop */ }
  return { ok: res.ok, status: res.status, bodyText, reason };
}

async function sendApnsPush(
  deviceToken: string,
  title: string,
  body: string,
  badge: number,
  preferredEnv: "sandbox" | "production",
): Promise<{ ok: boolean; status: number; bodyText: string; usedEnv: "sandbox" | "production" }> {
  const primaryHost = preferredEnv === "sandbox" ? "api.sandbox.push.apple.com" : "api.push.apple.com";
  const fallbackHost = preferredEnv === "sandbox" ? "api.push.apple.com" : "api.sandbox.push.apple.com";

  const r = await sendApnsPushTo(primaryHost, deviceToken, title, body, badge);
  console.log(`[SEND-PUSH] APNs ${preferredEnv} status=${r.status} reason="${r.reason}"`);
  if (!r.ok && (r.reason === "BadDeviceToken" || r.status === 400)) {
    const r2 = await sendApnsPushTo(fallbackHost, deviceToken, title, body, badge);
    const otherEnv: "sandbox" | "production" = preferredEnv === "sandbox" ? "production" : "sandbox";
    console.log(`[SEND-PUSH] APNs ${otherEnv} fallback status=${r2.status} reason="${r2.reason}"`);
    return { ok: r2.ok, status: r2.status, bodyText: r2.bodyText, usedEnv: otherEnv };
  }
  return { ok: r.ok, status: r.status, bodyText: r.bodyText, usedEnv: preferredEnv };
}

// ============== Handler ==============
Deno.serve(async (req) => {
  console.log("[SEND-PUSH] Function invoked, method:", req.method);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    console.log("[SEND-PUSH] Auth OK");

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { student_ids, title, body: msgBody } = body;
    console.log("[SEND-PUSH] Body parsed:", JSON.stringify({ student_ids_count: student_ids?.length, title, body: msgBody }));

    if (!student_ids?.length || !title || !msgBody) {
      return new Response(
        JSON.stringify({ error: "Missing student_ids, title, or body" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Sync to in-app bell: insert one notification row per recipient.
    // This guarantees the bell shows the message even if the push is dropped
    // by the OS (Focus mode, Low Power, no permission, etc.).
    try {
      const rows = student_ids.map((uid: string) => ({
        user_id: uid,
        title,
        body: msgBody,
      }));
      const { error: notifErr } = await adminClient
        .from("notifications")
        .insert(rows);
      if (notifErr) {
        console.error("[SEND-PUSH] Failed to insert in-app notifications:", notifErr.message);
      } else {
        console.log("[SEND-PUSH] Inserted", rows.length, "in-app notifications");
      }
    } catch (e) {
      console.error("[SEND-PUSH] In-app notification insert exception:", e);
    }

    const { data: tokens, error: tokensError } = await adminClient
      .from("device_tokens")
      .select("token, platform, user_id, apns_environment")
      .in("user_id", student_ids);

    console.log("[SEND-PUSH] Device tokens found:", tokens?.length ?? 0, "error:", tokensError?.message ?? "none");

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No device tokens found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pre-compute unread badge counts per user (for iOS)
    const badgeByUser: Record<string, number> = {};
    try {
      const { data: unread } = await adminClient
        .from("notifications")
        .select("user_id")
        .in("user_id", student_ids)
        .eq("read", false);
      if (unread) {
        for (const r of unread as Array<{ user_id: string }>) {
          badgeByUser[r.user_id] = (badgeByUser[r.user_id] ?? 0) + 1;
        }
      }
    } catch (e) {
      console.error("[SEND-PUSH] Badge count fetch error:", e);
    }

    // Lazy-load FCM creds only if we have Android tokens
    let fcmAccessToken: string | null = null;
    let fcmProjectId: string | null = null;
    const hasAndroid = tokens.some((t: any) => t.platform !== "ios");
    if (hasAndroid) {
      const rawServiceAccount = Deno.env.get("FIREBASE_SERVICE_ACCOUNT") ?? "";
      const serviceAccount = JSON.parse(rawServiceAccount);
      fcmAccessToken = await getFcmAccessToken(serviceAccount);
      fcmProjectId = serviceAccount.project_id;
      console.log("[SEND-PUSH] FCM access token obtained, project:", fcmProjectId);
    }

    let sent = 0;
    const tokensToDelete: string[] = [];

    for (const row of tokens as Array<{ token: string; platform: string; user_id: string; apns_environment: string | null }>) {
      const deviceToken = row.token;
      const platform = row.platform;
      const tokenPreview = deviceToken.substring(0, 20) + "...";

      if (platform === "ios") {
        // === iOS via APNs direct ===
        try {
          const preferredEnv: "sandbox" | "production" =
            row.apns_environment === "sandbox" ? "sandbox" : "production";
          const badge = badgeByUser[row.user_id] ?? 1;
          console.log("[SEND-PUSH] iOS token, sending via APNs:", tokenPreview, "env:", preferredEnv, "badge:", badge);
          const result = await sendApnsPush(deviceToken, title, msgBody, badge, preferredEnv);
          console.log("[SEND-PUSH] APNs response status:", result.status, "usedEnv:", result.usedEnv);
          if (result.ok) {
            sent++;
            // Persist environment correction if it changed
            if (result.usedEnv !== preferredEnv) {
              try {
                await adminClient
                  .from("device_tokens")
                  .update({ apns_environment: result.usedEnv })
                  .eq("token", deviceToken);
                console.log("[SEND-PUSH] Persisted apns_environment:", result.usedEnv);
              } catch (e) {
                console.error("[SEND-PUSH] Failed to persist apns_environment:", e);
              }
            }
          } else {
            // 410 Unregistered or 400 BadDeviceToken => cleanup
            if (
              result.status === 410 ||
              result.bodyText.includes("Unregistered") ||
              result.bodyText.includes("BadDeviceToken")
            ) {
              tokensToDelete.push(deviceToken);
            }
          }
        } catch (err) {
          console.error("[SEND-PUSH] APNs send error:", err);
        }
      } else {
        // === Android via FCM ===
        if (!fcmAccessToken || !fcmProjectId) continue;
        console.log("[SEND-PUSH] Android token, sending via FCM:", tokenPreview);
        const res = await fetch(
          `https://fcm.googleapis.com/v1/projects/${fcmProjectId}/messages:send`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${fcmAccessToken}`,
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
              },
            }),
          }
        );
        const resBody = await res.text();
        console.log("[SEND-PUSH] FCM response status:", res.status, "body:", resBody);
        if (res.ok) {
          sent++;
        } else if (resBody.includes("UNREGISTERED") || resBody.includes("NOT_FOUND")) {
          tokensToDelete.push(deviceToken);
        }
      }
    }

    if (tokensToDelete.length > 0) {
      const { error: delErr } = await adminClient
        .from("device_tokens")
        .delete()
        .in("token", tokensToDelete);
      console.log("[SEND-PUSH] Cleaned up", tokensToDelete.length, "invalid tokens. Error:", delErr?.message ?? "none");
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
