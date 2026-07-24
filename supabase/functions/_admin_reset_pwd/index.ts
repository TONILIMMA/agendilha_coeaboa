import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async () => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data, error } = await admin.auth.admin.updateUserById(
    "44c5515f-e338-405a-b4bb-e76e2549cf53",
    { password: "909265" },
  );
  return new Response(JSON.stringify({ ok: !error, error: error?.message, id: data?.user?.id }), {
    headers: { "Content-Type": "application/json" },
  });
});