import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  name: string;
  phone: string; // digits only, with or without country code
  password: string;
}

function phoneToEmail(phone: string): { email: string; fullPhone: string } {
  const digits = phone.replace(/\D/g, "");
  const full = digits.startsWith("55") ? digits : `55${digits}`;
  return { email: `${full}@phone.agendilha.app`, fullPhone: `+${full}` };
}

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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is the current Master (or admin while no master exists)
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

    const { data: isMaster } = await anonClient.rpc("is_master", { _user_id: user.id });
    const { data: isAdmin } = await anonClient.rpc("has_role", { _user_id: user.id, _role: "admin" });

    // Allow if caller is the current Master, OR if no formal master exists yet AND caller is admin (initial bootstrap)
    const adminCheck = createClient(supabaseUrl, serviceRoleKey);
    const { count: masterCount } = await adminCheck
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "master");

    const allowed = isMaster || (masterCount === 0 && isAdmin);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Forbidden — only the Admin Master (or any admin during initial bootstrap) can create a master." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as Payload;
    if (!body?.name || !body?.phone || !body?.password) {
      return new Response(JSON.stringify({ error: "Missing name, phone or password" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { email, fullPhone } = phoneToEmail(body.phone);

    // Check if user already exists
    const { data: existing } = await admin.auth.admin.listUsers({ perPage: 1000 });
    let targetUser = existing?.users.find((u) => u.email === email) ?? null;

    if (!targetUser) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: body.password,
        email_confirm: true,
        user_metadata: { name: body.name },
      });
      if (createErr || !created.user) {
        return new Response(JSON.stringify({ error: createErr?.message ?? "Failed to create user" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      targetUser = created.user;
    } else {
      // Reset password to the requested one so the master gets fresh access
      await admin.auth.admin.updateUserById(targetUser.id, { password: body.password });
    }

    // Upsert profile
    await admin.from("profiles").upsert(
      {
        user_id: targetUser.id,
        responsible_name: body.name,
        phone: fullPhone,
      },
      { onConflict: "user_id" },
    );

    // Grant master + admin roles (idempotent)
    for (const role of ["master", "admin"] as const) {
      const { data: existsRole } = await admin
        .from("user_roles")
        .select("id")
        .eq("user_id", targetUser.id)
        .eq("role", role)
        .maybeSingle();
      if (!existsRole) {
        await admin.from("user_roles").insert({ user_id: targetUser.id, role });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: targetUser.id,
        email,
        phone: fullPhone,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
