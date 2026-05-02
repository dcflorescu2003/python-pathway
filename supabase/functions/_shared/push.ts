// Shared helper for sending FCM + APNs push notifications.
// - Deduplicates tokens (per-token + at most 1 push per user/platform).
// - Cleans up invalid tokens after send.
// Returns number of pushes successfully sent.
export async function sendFCMPushes(
  adminClient: any,
  userMessages: Record<string, { title: string; body: string; data?: Record<string, string> }>
): Promise<number> {
  const userIds = Object.keys(userMessages);
  if (userIds.length === 0) return 0;

  const { data: tokens } = await adminClient
    .from("device_tokens")
    .select("token, user_id, platform, created_at, apns_environment")
    .in("user_id", userIds);

  // Pre-compute unread badge counts per user (for iOS)
  const badgeByUser: Record<string, number> = {};
  try {
    const { data: unread } = await adminClient
      .from("notifications")
      .select("user_id")
      .in("user_id", userIds)
      .eq("read", false);
    if (unread) {
      for (const r of unread) {
        badgeByUser[r.user_id] = (badgeByUser[r.user_id] ?? 0) + 1;
      }
    }
  } catch (e) {
    console.error("Badge count fetch error:", e);
  }

  if (!tokens || tokens.length === 0) return 0;

  // Step 1: dedupe by token value globally (just in case constraint isn't there)
  const seenTokens = new Set<string>();
  const uniqueTokens: Array<{ token: string; user_id: string; platform: string; created_at: string }> = [];
  for (const t of tokens) {
    if (seenTokens.has(t.token)) continue;
    seenTokens.add(t.token);
    uniqueTokens.push(t);
  }

  // Step 2: keep only the most recent token per (user_id, platform)
  const bestPerUserPlatform: Record<string, { token: string; user_id: string; platform: string; created_at: string }> = {};
  for (const t of uniqueTokens) {
    const platform = (t.platform || "android").toLowerCase() === "ios" ? "ios" : "android";
    const key = `${t.user_id}|${platform}`;
    const existing = bestPerUserPlatform[key];
    if (!existing || new Date(t.created_at).getTime() > new Date(existing.created_at).getTime()) {
      bestPerUserPlatform[key] = { ...t, platform };
    }
  }

  const finalTokens = Object.values(bestPerUserPlatform);
  if (finalTokens.length === 0) return 0;

  // Build FCM access token only if needed (Android tokens present)
  const hasAndroid = finalTokens.some((t) => t.platform !== "ios");
  let accessToken: string | null = null;
  let projectId: string | null = null;

  if (hasAndroid) {
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
      const cryptoKey = await crypto.subtle.importKey(
        "pkcs8",
        binaryKey,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
      );

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
  }

  // APNs JWT (built lazily for iOS tokens)
  let apnsJwt: string | null = null;
  const hasIos = finalTokens.some((t) => t.platform === "ios");
  if (hasIos) {
    try {
      const authKey = Deno.env.get("APNS_AUTH_KEY") ?? "";
      const keyId = Deno.env.get("APNS_KEY_ID") ?? "";
      const teamId = Deno.env.get("APNS_TEAM_ID") ?? "";
      if (authKey && keyId && teamId) {
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
        const now = Math.floor(Date.now() / 1000);
        const b64u = (s: string | Uint8Array) => {
          const bytes = typeof s === "string" ? new TextEncoder().encode(s) : s;
          let bin = "";
          for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
          return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        };
        const header = b64u(JSON.stringify({ alg: "ES256", kid: keyId, typ: "JWT" }));
        const payload = b64u(JSON.stringify({ iss: teamId, iat: now }));
        const sig = await crypto.subtle.sign(
          { name: "ECDSA", hash: "SHA-256" },
          cryptoKey,
          new TextEncoder().encode(`${header}.${payload}`)
        );
        apnsJwt = `${header}.${payload}.${b64u(new Uint8Array(sig))}`;
      }
    } catch (e) {
      console.error("Failed to build APNs JWT:", e);
    }
  }

  const apnsBundleId = Deno.env.get("APNS_BUNDLE_ID") ?? "";
  const tokensToDelete: string[] = [];
  let count = 0;

  for (const t of finalTokens) {
    const msg = userMessages[t.user_id];
    if (!msg) continue;

    if (t.platform === "ios") {
      if (!apnsJwt || !apnsBundleId) continue;
      const sendApns = async (host: string) => {
        const res = await fetch(`https://${host}/3/device/${t.token}`, {
          method: "POST",
          headers: {
            authorization: `bearer ${apnsJwt}`,
            "apns-topic": apnsBundleId,
            "apns-push-type": "alert",
            "apns-priority": "10",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            aps: { alert: { title: msg.title, body: msg.body }, sound: "default", badge: 1 },
          }),
        });
        const bodyText = await res.text();
        let reason = "";
        try { reason = (JSON.parse(bodyText) as any)?.reason ?? ""; } catch { /* noop */ }
        return { ok: res.ok, status: res.status, bodyText, reason };
      };
      try {
        let r = await sendApns("api.push.apple.com");
        // Fallback to sandbox for TestFlight/Xcode builds whose tokens prod rejects.
        if (!r.ok && (r.reason === "BadDeviceToken" || r.status === 400)) {
          r = await sendApns("api.sandbox.push.apple.com");
        }
        if (r.ok) count++;
        else if (
          r.status === 410 ||
          r.bodyText.includes("Unregistered") ||
          r.bodyText.includes("BadDeviceToken")
        ) {
          tokensToDelete.push(t.token);
        }
      } catch (e) {
        console.error("APNs send error:", e);
      }
    } else {
      if (!accessToken || !projectId) continue;
      try {
        const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            message: {
              token: t.token,
              notification: { title: msg.title, body: msg.body },
              data: msg.data || {},
              android: { priority: "high", notification: { sound: "default" } },
            },
          }),
        });
        const resBody = await res.text();
        if (res.ok) count++;
        else if (resBody.includes("UNREGISTERED") || resBody.includes("NOT_FOUND")) {
          tokensToDelete.push(t.token);
        }
      } catch (e) {
        console.error("FCM send error:", e);
      }
    }
  }

  if (tokensToDelete.length > 0) {
    try {
      await adminClient.from("device_tokens").delete().in("token", tokensToDelete);
    } catch (e) {
      console.error("Cleanup tokens error:", e);
    }
  }

  return count;
}
