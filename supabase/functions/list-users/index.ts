import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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

    // Verify caller is admin using their JWT
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await anonClient.rpc("is_admin_or_master", {
      p_user_id: user.id,
    });


    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to list auth users
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: { users }, error } = await adminClient.auth.admin.listUsers({ perPage: 1000 });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all roles, profiles and collaborators
    const { data: roles } = await adminClient.from("user_roles").select("*");
    const { data: profiles } = await adminClient.from("profiles").select("*");
    const { data: collaborators } = await adminClient.from("collaborators").select("user_id, name, email, is_active");

    const normalizeDigits = (value: string | null | undefined) => (value ?? "").replace(/\D/g, "");

    // Determine the master user (formal master OR fallback: oldest admin)
    const masterRow = roles?.find((r) => r.role === "master");
    let masterUserId: string | null = masterRow?.user_id ?? null;
    if (!masterUserId) {
      const adminRoles = (roles ?? [])
        .filter((r) => r.role === "admin")
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      masterUserId = adminRoles[0]?.user_id ?? null;
    }

    const usersWithRoles = users.map((u) => {
      const emailLocal = u.email?.split("@")[0] || "";
      const isPhonePlaceholder = u.email?.endsWith("@phone.agendilha.app");
      const placeholderDigits = isPhonePlaceholder ? normalizeDigits(emailLocal) : "";
      const meta = (u.user_metadata || {}) as Record<string, unknown>;

      const profile = profiles?.find((p) => {
        if (p.user_id === u.id) return true;
        if (!placeholderDigits) return false;
        const profileDigits = normalizeDigits(p.phone);
        return !!profileDigits && (profileDigits === placeholderDigits || profileDigits === `55${placeholderDigits}` || `55${profileDigits}` === placeholderDigits);
      });

      const collab = collaborators?.find((c) => {
        if (c.user_id === u.id) return true;
        if (u.email && c.email === u.email) return true;
        if (!placeholderDigits) return false;
        return normalizeDigits(c.email) === placeholderDigits;
      });

      const isAdminRole = roles?.some((r) => r.user_id === u.id && r.role === "admin") ?? false;
      const isMasterRole = roles?.some((r) => r.user_id === u.id && r.role === "master") ?? false;
      const isMaster = isMasterRole || u.id === masterUserId;

      let status: "master" | "admin" | "collaborator" | "user";
      if (isMaster) status = "master";
      else if (isAdminRole) status = "admin";
      else if (collab && collab.is_active !== false) status = "collaborator";
      else status = "user";

      const pickFirstText = (...values: unknown[]) =>
        values.find((value): value is string => typeof value === "string" && value.trim().length > 0) ?? null;

      const responsible_name = pickFirstText(
        profile?.responsible_name,
        collab?.name,
        meta.full_name,
        meta.name,
        profile?.company_name,
        isPhonePlaceholder ? null : emailLocal,
      );

      const phone = pickFirstText(
        profile?.phone,
        meta.phone,
        isPhonePlaceholder ? emailLocal : null,
      );

      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        is_admin: isAdminRole,
        is_master: isMaster,
        status,
        user_type: profile?.user_type || 'usuario',
        company_type: profile?.company_type || null,
        responsible_name,
        phone,
      };
    });

    return new Response(JSON.stringify(usersWithRoles), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
