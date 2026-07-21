// Edge function: renderiza HTML com meta tags Open Graph para o crawler
// do WhatsApp/Facebook/Twitter e redireciona usuários reais para a SPA.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const APP_ORIGIN = "https://agendilha-divulgacao.lovable.app";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  // Aceita ?slug=... ou último segmento da URL
  const slug =
    url.searchParams.get("slug") ||
    url.pathname.split("/").filter(Boolean).pop() ||
    "";

  const targetUrl = slug ? `${APP_ORIGIN}/evento/${slug}` : APP_ORIGIN;

  if (!slug) {
    return Response.redirect(APP_ORIGIN, 302);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: ev } = await supabase
    .from("public_submissions")
    .select(
      "event_title, description, image_url, category, location, address_neighborhood, slug, date, start_time"
    )
    .eq("slug", slug)
    .maybeSingle();

  const title = ev?.event_title
    ? `${ev.event_title} — AgendIlha`
    : "AgendIlha — Agenda Cultural da Ilha do Governador";

  const rawDesc =
    ev?.description ||
    [ev?.location, ev?.address_neighborhood].filter(Boolean).join(" — ") ||
    "Confira este evento no AgendIlha.";
  const description = rawDesc.replace(/\s+/g, " ").trim().slice(0, 150);

  const image = ev?.image_url || `${APP_ORIGIN}/placeholder.svg`;

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${escapeHtml(targetUrl)}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="AgendIlha" />
<meta property="og:title" content="${escapeHtml(ev?.event_title || "AgendIlha")}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:url" content="${escapeHtml(targetUrl)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(ev?.event_title || "AgendIlha")}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
<meta http-equiv="refresh" content="0; url=${escapeHtml(targetUrl)}" />
<script>window.location.replace(${JSON.stringify(targetUrl)});</script>
</head>
<body>
<p>Redirecionando para <a href="${escapeHtml(targetUrl)}">${escapeHtml(targetUrl)}</a>…</p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
});