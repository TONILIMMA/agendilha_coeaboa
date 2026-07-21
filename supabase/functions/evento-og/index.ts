// Edge function: renderiza HTML com meta tags Open Graph para o crawler
// do WhatsApp/Facebook/Twitter e redireciona usuários reais para a SPA.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const APP_ORIGIN = "https://agendilha-divulgacao.lovable.app";
const FALLBACK_IMAGE = `${APP_ORIGIN}/logo.png`;
const MAX_DESC = 150;
const MAX_TITLE = 90;
const MAX_IMG_URL = 2000;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Remove HTML tags, entidades básicas, quebras e controla espaços.
function sanitizeText(input: unknown, max: number): string {
  if (typeof input !== "string") return "";
  let s = input
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (s.length > max) {
    s = s.slice(0, max - 1).replace(/\s+\S*$/, "").trim() + "…";
  }
  return s;
}

// Aceita apenas URLs https absolutas, tamanho razoável e extensão/host reconhecidos.
// Rejeita data:, blob:, http:, javascript: e afins — WhatsApp/Facebook não seguem.
function sanitizeImageUrl(input: unknown): string {
  if (typeof input !== "string") return FALLBACK_IMAGE;
  const raw = input.trim();
  if (!raw || raw.length > MAX_IMG_URL) return FALLBACK_IMAGE;
  if (!/^https:\/\//i.test(raw)) return FALLBACK_IMAGE;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return FALLBACK_IMAGE;
  }
  const pathname = parsed.pathname.toLowerCase();
  const hasImageExt = /\.(png|jpe?g|webp|gif|avif)$/i.test(pathname);
  const isSupabaseStorage =
    parsed.hostname.endsWith(".supabase.co") && pathname.includes("/storage/v1/");
  if (!hasImageExt && !isSupabaseStorage) return FALLBACK_IMAGE;
  return parsed.toString();
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  // Aceita ?slug=... ou último segmento da URL
  const slug =
    url.searchParams.get("slug") ||
    url.pathname.split("/").filter(Boolean).pop() ||
    "";

  // Slug seguro: só letras/números/hífen, até 120 chars.
  const safeSlug = /^[a-z0-9-]{1,120}$/i.test(slug) ? slug.toLowerCase() : "";
  const targetUrl = safeSlug ? `${APP_ORIGIN}/evento/${safeSlug}` : APP_ORIGIN;

  if (!safeSlug) {
    return Response.redirect(APP_ORIGIN, 302);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: ev } = await supabase
    .from("public_submissions")
    .select(
      "event_title, description, image_url, category, location, address_neighborhood, slug, date, start_time"
    )
    .eq("slug", safeSlug)
    .maybeSingle();

  const cleanEventTitle = sanitizeText(ev?.event_title, MAX_TITLE);
  const title = cleanEventTitle
    ? `${cleanEventTitle} — AgendIlha`
    : "AgendIlha — Agenda Cultural da Ilha do Governador";

  const descSource =
    sanitizeText(ev?.description, MAX_DESC) ||
    sanitizeText(
      [ev?.location, ev?.address_neighborhood].filter(Boolean).join(" — "),
      MAX_DESC,
    ) ||
    "Confira este evento no AgendIlha.";
  const description = descSource.slice(0, MAX_DESC);

  const image = sanitizeImageUrl(ev?.image_url);
  const ogTitle = cleanEventTitle || "AgendIlha";

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
<meta property="og:title" content="${escapeHtml(ogTitle)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:secure_url" content="${escapeHtml(image)}" />
<meta property="og:url" content="${escapeHtml(targetUrl)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
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