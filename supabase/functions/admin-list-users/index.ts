import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verify admin role
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const search: string = (body.search || "").toString().trim().toLowerCase();
    const filter: string = (body.filter || "all").toString();
    const limit = Math.min(Math.max(parseInt(body.limit) || 50, 1), 200);
    const offset = Math.max(parseInt(body.offset) || 0, 0);

    // Fetch profiles with optional name search
    let pq = admin
      .from("profiles")
      .select("user_id, display_name, first_name, last_name, nickname, is_premium, is_teacher, teacher_status", { count: "exact" });

    if (filter === "premium") pq = pq.eq("is_premium", true);
    if (filter === "free") pq = pq.eq("is_premium", false);
    if (filter === "teacher") pq = pq.eq("is_teacher", true);

    if (search) {
      const s = `%${search}%`;
      pq = pq.or(
        `display_name.ilike.${s},first_name.ilike.${s},last_name.ilike.${s},nickname.ilike.${s}`
      );
    }

    // If searching by email, we need to first find matching auth users
    let emailMatchedIds: string[] | null = null;
    if (search && search.includes("@") || (search && !/[a-zA-Z]/.test(search) === false)) {
      // Try email search via auth admin (paged fetch is heavy; use listUsers with filter)
      // Strategy: list users page-by-page until we collect enough matches (cap at 1000 scanned)
      const matched: string[] = [];
      let page = 1;
      const perPage = 200;
      while (page <= 5) {
        const { data: lu, error: luErr } = await admin.auth.admin.listUsers({ page, perPage });
        if (luErr || !lu?.users?.length) break;
        for (const u of lu.users) {
          if (u.email && u.email.toLowerCase().includes(search)) matched.push(u.id);
        }
        if (lu.users.length < perPage) break;
        page++;
      }
      emailMatchedIds = matched;
    }

    // Combine: if emailMatchedIds is non-null and search exists, union with name search
    let profiles: any[] = [];
    let total = 0;

    if (emailMatchedIds && emailMatchedIds.length > 0) {
      // Fetch profiles for matched ids OR name match
      const s = `%${search}%`;
      const { data, error, count } = await admin
        .from("profiles")
        .select("user_id, display_name, first_name, last_name, nickname, is_premium, is_teacher, teacher_status", { count: "exact" })
        .or(
          `user_id.in.(${emailMatchedIds.join(",")}),display_name.ilike.${s},first_name.ilike.${s},last_name.ilike.${s},nickname.ilike.${s}`
        )
        .order("user_id")
        .range(offset, offset + limit - 1);
      if (error) throw error;
      profiles = data || [];
      total = count || 0;
    } else {
      const { data, error, count } = await pq.order("user_id").range(offset, offset + limit - 1);
      if (error) throw error;
      profiles = data || [];
      total = count || 0;
    }

    const userIds = profiles.map((p) => p.user_id);

    // Fetch emails
    const emailMap: Record<string, string> = {};
    if (userIds.length > 0) {
      // Batch via auth.admin (no direct multi-id API; iterate)
      await Promise.all(
        userIds.map(async (id) => {
          const { data: u } = await admin.auth.admin.getUserById(id);
          if (u?.user?.email) emailMap[id] = u.user.email;
        })
      );
    }

    // Fetch active play_billing_subscriptions
    const playMap: Record<string, { platform: string; expiry_time: string }> = {};
    if (userIds.length > 0) {
      const { data: subs } = await admin
        .from("play_billing_subscriptions")
        .select("user_id, platform, expiry_time, is_active")
        .in("user_id", userIds)
        .eq("is_active", true)
        .gt("expiry_time", new Date().toISOString());
      for (const s of subs || []) {
        playMap[s.user_id] = { platform: s.platform, expiry_time: s.expiry_time };
      }
    }

    // Fetch active coupon redemptions
    const couponMap: Record<string, { premium_until: string; coupon_type: string }> = {};
    if (userIds.length > 0) {
      const { data: reds } = await admin
        .from("coupon_redemptions")
        .select("user_id, premium_until, coupon_type")
        .in("user_id", userIds)
        .gt("premium_until", new Date().toISOString());
      for (const r of reds || []) {
        if (!couponMap[r.user_id]) couponMap[r.user_id] = { premium_until: r.premium_until, coupon_type: r.coupon_type };
      }
    }

    let users = profiles.map((p) => {
      const email = emailMap[p.user_id] || null;
      const play = playMap[p.user_id];
      const coupon = couponMap[p.user_id];
      let premium_source: string = "none";
      if (play) premium_source = play.platform === "ios" ? "appstore" : "play";
      else if (coupon) premium_source = "coupon";
      else if (p.is_premium) premium_source = "stripe";

      return {
        user_id: p.user_id,
        email,
        display_name: p.display_name,
        first_name: p.first_name,
        last_name: p.last_name,
        nickname: p.nickname,
        is_premium: p.is_premium,
        is_teacher: p.is_teacher,
        teacher_status: p.teacher_status,
        premium_source,
        play_expiry: play?.expiry_time || null,
        coupon_until: coupon?.premium_until || null,
        coupon_type: coupon?.coupon_type || null,
      };
    });

    // Apply post-filters that depend on derived fields
    if (filter === "paid") {
      users = users.filter((u) => ["play", "appstore", "stripe"].includes(u.premium_source));
    } else if (filter === "coupon") {
      users = users.filter((u) => u.premium_source === "coupon");
    }

    return new Response(JSON.stringify({ users, total }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-list-users error", e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
