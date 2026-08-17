import { Helmet } from "react-helmet-async";

interface SeoHeadProps {
  title: string;
  description: string;
  /** Caminho da rota, ex: "/explorar". Usado em canonical e og:url. */
  path: string;
  image?: string;
  type?: "website" | "article" | "profile";
  /** JSON-LD já pronto (objeto), injetado como script structured data. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const SITE_URL = "https://agendilha.coeaboa.online";

/**
 * Metadados por rota: título, descrição, canonical self-referente,
 * Open Graph/Twitter e structured data.
 */
export function SeoHead({ title, description, path, image, type = "website", jsonLd }: SeoHeadProps) {
  const origin = typeof window !== "undefined" ? window.location.origin : SITE_URL;
  const url = `${origin}${path}`;
  const desc = description.replace(/\s+/g, " ").trim().slice(0, 158);
  const absImage = image
    ? image.startsWith("http")
      ? image
      : `${origin}${image.startsWith("/") ? "" : "/"}${image}`
    : undefined;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="AgendIlha" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      {absImage ? <meta property="og:image" content={absImage} /> : null}
      {absImage ? <meta name="twitter:image" content={absImage} /> : null}
      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Helmet>
  );
}