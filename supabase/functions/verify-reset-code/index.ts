import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return new Response(JSON.stringify({ error: "Telefone e código obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalized = normalizePhone(phone);
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: record } = await admin
      .from("password_reset_codes")
      .select("*")
      .eq("phone", normalized)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!record) {
      return new Response(JSON.stringify({ error: "Código expirado ou inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (record.attempts >= 3) {
      await admin.from("password_reset_codes").update({ used: true }).eq("id", record.id);
      return new Response(
        JSON.stringify({ error: "Muitas tentativas. Solicite um novo código." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const codeHash = await hashCode(String(code));
    if (codeHash !== record.code_hash) {
      await admin
        .from("password_reset_codes")
        .update({ attempts: record.attempts + 1 })
        .eq("id", record.id);
      return new Response(
        JSON.stringify({
          error: "Código incorreto",
          remaining: 2 - record.attempts,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate short-lived reset token (15 min)
    const token = crypto.randomUUID() + "-" + crypto.randomUUID();
    const tokenHash = await hashCode(token);

    // Store token hash in code_hash field, mark as verified by setting attempts=99
    await admin
      .from("password_reset_codes")
      .update({ code_hash: tokenHash, attempts: 99 })
      .eq("id", record.id);

    return new Response(JSON.stringify({ success: true, token, codeId: record.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
