const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SECURITY: The previous implementation returned the raw 6-digit reset code
// in the HTTP response so the client could deep-link it into WhatsApp. That
// meant anyone hitting this endpoint with a victim's phone number could read
// the code back and reset the password — no ownership proof required.
//
// Until we can send the code out-of-band through the WhatsApp Business API
// (or another channel we control), the endpoint is disabled to prevent
// account takeover.
Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  return new Response(
    JSON.stringify({
      error:
        "A recuperação de senha por WhatsApp está temporariamente desativada. Entre em contato com o suporte.",
      code: "password_reset_disabled",
    }),
    {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
