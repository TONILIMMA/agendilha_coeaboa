import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  generateTempPassword,
  buildWhatsappUrl,
  isValidBrazilianMobile,
  normalizePhone,
} from "../_shared/temp-password.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

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
    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await anonClient.rpc("is_admin_or_master", {
      p_user_id: caller.id,
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, customNote } = await req.json();
    if (typeof user_id !== "string" || !user_id) {
      return new Response(JSON.stringify({ error: "user_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (customNote != null && typeof customNote !== "string") {
      return new Response(JSON.stringify({ error: "customNote inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const safeNote = (customNote ?? "").slice(0, 500);

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Block non-master from resetting a master user
    const { data: targetIsMaster } = await admin.rpc("is_master", {
      _user_id: user_id,
    });
    if (targetIsMaster) {
      const { data: callerIsMaster } = await admin.rpc("is_master", {
        _user_id: caller.id,
      });
      if (!callerIsMaster) {
        return new Response(
          JSON.stringify({ error: "Apenas um Master pode resetar outro Master." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Lookup target user's phone (from profile, or fallback to placeholder email digits)
    const { data: profile } = await admin
      .from("profiles")
      .select("phone, responsible_name, nick_name")
      .eq("user_id", user_id)
      .maybeSingle();

    const { data: targetUserData } = await admin.auth.admin.getUserById(user_id);
    if (!targetUserData?.user) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let phone = profile?.phone || "";
    if (!phone) {
      const emailLocal = targetUserData.user.email?.split("@")[0] ?? "";
      if (/^\d+$/.test(emailLocal)) phone = emailLocal;
    }
    const phoneIsValid = !!phone && isValidBrazilianMobile(phone);
    const recipientName =
      profile?.responsible_name || profile?.nick_name || null;

    const tempPassword = generateTempPassword(10);

    const { error: updateError } = await admin.auth.admin.updateUserById(
      user_id,
      { password: tempPassword },
    );
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin
      .from("profiles")
      .update({ must_change_password: true })
      .eq("user_id", user_id);

    // Audit log
    await admin.from("audit_logs").insert({
      actor_id: caller.id,
      action: "password_reset",
      resource_type: "user",
      resource_id: user_id,
      reason: "Admin gerou senha temporária",
    });

    const whatsappUrl = phoneIsValid
      ? buildWhatsappUrl(phone, tempPassword, {
          recipientName,
          customNote: safeNote || null,
        })
      : null;

    return new Response(
      JSON.stringify({
        success: true,
        tempPassword,
        whatsappUrl,
        phone: phoneIsValid ? normalizePhone(phone) : phone || null,
        phoneIsValid,
        recipientName,
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