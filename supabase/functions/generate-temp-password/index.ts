import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  generateTempPassword,
  normalizePhone,
  buildWhatsappUrl,
  isValidBrazilianMobile,
} from "../_shared/temp-password.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// In-memory rate-limit (1 reset / 60s per phone). Resets on cold start.
const lastRequestByPhone = new Map<string, number>();
const RATE_LIMIT_MS = 60_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const { phone } = await req.json();
    if (typeof phone !== "string" || !isValidBrazilianMobile(phone)) {
      return new Response(JSON.stringify({
        error: "WhatsApp inválido. Use um celular brasileiro no formato (DDD) 9XXXX-XXXX.",
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalized = normalizePhone(phone);
    const now = Date.now();
    const last = lastRequestByPhone.get(normalized) ?? 0;
    if (now - last < RATE_LIMIT_MS) {
      const wait = Math.ceil((RATE_LIMIT_MS - (now - last)) / 1000);
      return new Response(
        JSON.stringify({
          error: `Aguarde ${wait}s antes de solicitar outra senha temporária.`,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    lastRequestByPhone.set(normalized, now);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const fakeEmail = `${normalized}@phone.agendilha.app`;
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const user = list?.users?.find((u) => u.email === fakeEmail);

    if (!user) {
      // Generic response to avoid user enumeration
      return new Response(
        JSON.stringify({
          error:
            "Não encontramos uma conta com esse WhatsApp. Verifique o número ou cadastre-se.",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const tempPassword = generateTempPassword(10);

    const { error: updateError } = await admin.auth.admin.updateUserById(
      user.id,
      { password: tempPassword },
    );
    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Flag profile so user is forced to change password on next login
    await admin
      .from("profiles")
      .update({ must_change_password: true })
      .eq("user_id", user.id);

    const { data: profile } = await admin
      .from("profiles")
      .select("responsible_name, nick_name")
      .eq("user_id", user.id)
      .maybeSingle();
    const recipientName =
      profile?.responsible_name || profile?.nick_name || null;

    const whatsappUrl = buildWhatsappUrl(normalized, tempPassword, {
      recipientName,
    });

    return new Response(
      JSON.stringify({
        success: true,
        tempPassword,
        whatsappUrl,
        phone: normalized,
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