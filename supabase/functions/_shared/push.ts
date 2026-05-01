// Shared helper for sending FCM push notifications.
// Returns number of pushes attempted.
export async function sendFCMPushes(
  adminClient: any,
  userMessages: Record<string, { title: string; body: string; data?: Record<string, string> }>
): Promise<number> {
  const userIds = Object.keys(userMessages);
  if (userIds.length === 0) return 0;

  const { data: tokens } = await adminClient
    .from("device_tokens")
    .select("token, user_id")
    .in("user_id", userIds);

  if (!tokens || tokens.length === 0) return 0;

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
    return 0;
  }

  if (!accessToken || !projectId) return 0;

  let count = 0;
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
              data: msg.data || {},
              android: { priority: "high", notification: { sound: "default" } },
            },
          }),
        });
        count++;
      } catch (e) {
        console.error("FCM send error:", e);
      }
    }
  }
  return count;
}
