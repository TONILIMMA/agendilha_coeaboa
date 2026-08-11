import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { normalizePhone } from "../_shared/temp-password.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/**
 * Redefinição de senha self-service: o usuário prova a identidade com o PIN de 4
 * dígitos da conta. Nenhum administrador entra no meio do processo.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { phone, pin, newPassword } = await req.json();

    if (typeof phone !== "string" || typeof pin !== "string" || typeof newPassword !== "string") {
      return json({ error: "Dados incompletos. Informe WhatsApp, PIN e a nova senha." }, 400);
    }
    if (!/^\d{4}$/.test(pin)) {
      return json({ error: "O PIN deve ter exatamente 4 números." }, 400);
    }
    if (newPassword.length < 8) {
      return json({ error: "A nova senha precisa de no mínimo 8 caracteres." }, 400);
    }

    let digits = phone.replace(/\D/g, "");
    if (digits.startsWith("00")) digits = digits.slice(2);
    if (digits.length > 11 && digits.startsWith("55")) digits = digits.slice(2);
    if (digits.length !== 10 && digits.length !== 11) {
      return json({ error: "Número de WhatsApp inválido." }, 400);
    }
    const email = `55${digits}@phone.agendilha.app`;
    // Formato antigo: números que começavam com "55" viravam e-mail sem o país.
    const legacyEmail = digits.startsWith("55") ? `${digits}@phone.agendilha.app` : null;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Resolve o usuário pelo e-mail sintético do telefone (índice, sem varrer a lista).
    let { data: targetId, error: resolveError } = await admin.rpc("resolve_user_id_by_email", {
      p_email: email,
    });
    if (resolveError) throw resolveError;
    if (!targetId && legacyEmail) {
      const legacy = await admin.rpc("resolve_user_id_by_email", { p_email: legacyEmail });
      if (legacy.error) throw legacy.error;
      targetId = legacy.data;
    }
    const target = targetId ? { id: targetId as string } : null;

    // Resposta genérica: não revela se o número existe.
    const genericFail = json(
      { error: "Não deu pra confirmar. Confira o número e o PIN de 4 dígitos." },
      400,
    );
    if (!target) return genericFail;

    const { data: pinOk, error: pinError } = await admin.rpc("verify_user_pin_for_reset", {
      p_user_id: target.id,
      p_pin: pin,
    });

    if (pinError) {
      const msg = pinError.message || "";
      if (msg.includes("bloqueado")) return json({ error: msg }, 429);
      throw pinError;
    }
    if (!pinOk) return genericFail;

    const { error: updateError } = await admin.auth.admin.updateUserById(target.id, {
      password: newPassword,
    });
    if (updateError) {
      return json({ error: updateError.message || "Não deu pra salvar a nova senha." }, 400);
    }

    // Senha definida pelo próprio usuário: não precisa trocar no próximo login.
    await admin.from("profiles").update({ must_change_password: false }).eq("user_id", target.id);

    return json({ success: true });
  } catch (error) {
    console.error("[pin-reset-password]", error);
    return json({ error: "Deu ruim aqui do nosso lado. Tenta de novo em instantes." }, 500);
  }
});
