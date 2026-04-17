import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Caller must be master
    const { data: isMaster } = await anonClient.rpc("is_master", { _user_id: user.id });
    if (!isMaster) {
      return new Response(JSON.stringify({ error: "Forbidden — master only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, responsible_name, phone, status } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const updates: Record<string, string | null> = {};
    if (typeof responsible_name === "string") updates.responsible_name = responsible_name.trim() || null;
    if (typeof phone === "string") updates.phone = phone.trim() || null;
    if (typeof status === "string") updates.status = status.trim() || null;

    if (Object.keys(updates).length === 0) {
      return new Response(JSON.stringify({ error: "No fields to update" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert profile
    const { data: existing } = await adminClient
      .from("profiles")
      .select("id")
      .eq("user_id", user_id)
      .maybeSingle();

    if (existing) {
      const { error } = await adminClient.from("profiles").update(updates).eq("user_id", user_id);
      if (error) throw error;
    } else {
      const { error } = await adminClient.from("profiles").insert({ user_id, ...updates });
      if (error) throw error;
    }

    // Also keep collaborator name in sync if a collaborator row exists
    if (updates.responsible_name) {
      await adminClient
        .from("collaborators")
        .update({ name: updates.responsible_name })
        .eq("user_id", user_id);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
