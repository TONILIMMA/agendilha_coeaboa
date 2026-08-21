// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://agendilha.coeaboa.online";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/agenda", changefreq: "daily", priority: "0.9" },
  { path: "/explorar", changefreq: "daily", priority: "0.9" },
  { path: "/artistas", changefreq: "weekly", priority: "0.7" },
  { path: "/cadastro", changefreq: "monthly", priority: "0.6" },
  { path: "/cadastro/publico", changefreq: "monthly", priority: "0.5" },
  { path: "/cadastro/divulgador", changefreq: "monthly", priority: "0.5" },
  { path: "/cadastro/artista", changefreq: "monthly", priority: "0.5" },
  { path: "/impulsionamento-em-breve", changefreq: "monthly", priority: "0.4" },
  { path: "/termos", changefreq: "yearly", priority: "0.3" },
  { path: "/privacidade", changefreq: "yearly", priority: "0.3" },
];

/** Eventos publicados (mesma fonte/filtros da página pública de eventos). */
async function fetchEventEntries(): Promise<SitemapEntry[]> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(
      `${url}/rest/v1/public_submissions?select=slug&status=eq.published&slug=not.is.null&limit=1000`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{ slug: string | null }>;
    return rows
      .filter((r) => !!r.slug)
      .map((r) => ({ path: `/evento/${r.slug}`, changefreq: "weekly" as const, priority: "0.8" }));
  } catch {
    return [];
  }
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

const entries = [...staticEntries, ...(await fetchEventEntries())];
writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
