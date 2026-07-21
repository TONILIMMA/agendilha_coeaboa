const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// SECURITY: This endpoint used to reset the account password based only on a
// phone number and return the new plaintext password in the HTTP response.
// That let anyone who knew a user's WhatsApp number take over the account.
// Until a real out-of-band WhatsApp delivery (WhatsApp Business API) is wired
// up, the endpoint is disabled. The account owner must sign in and change
// their password from inside the app, or an admin must trigger a reset.
Deno.serve((req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  return new Response(
    JSON.stringify({
      error:
        "A recuperação automática por WhatsApp está temporariamente desativada. Entre em contato com o suporte para redefinir sua senha.",
      code: "temp_password_disabled",
    }),
    {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
