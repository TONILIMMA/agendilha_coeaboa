import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const userId = "44c5515f-e338-405a-b4bb-e76e2549cf53";
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: "Ilha@2026",
  });
  await supabase.from("profiles").update({ must_change_password: true }).eq("user_id", userId);
  return new Response(JSON.stringify({ ok: !error, error: error?.message ?? null }), {
    headers: { "Content-Type": "application/json" },
  });
});
