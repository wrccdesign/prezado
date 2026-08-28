import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { getRouteMeta, SITE_URL } from "@/seo/routeMeta";

const DEFAULT_IMAGE = "/og/home.jpg";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  /** Path (relative to the site root) of a 1200x630 social share image. */
  image?: string;
  imageAlt?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function SEO({ title, description, path, image, imageAlt, jsonLd }: SEOProps) {
  // Rotas públicas mapeadas usam sempre a mesma meta do HTML estático
  // gerado no build (src/seo/routeMeta.ts), para não divergirem.
  const routeMeta = getRouteMeta(path);
  const finalTitle = routeMeta?.title ?? title;
  const finalDescription = routeMeta?.description ?? description;
  const url = `${SITE_URL}${path}`;
  const imageUrl = `${SITE_URL}${routeMeta?.ogImage || image || DEFAULT_IMAGE}`;
  // O HTML estático já traz o JSON-LD da rota; ao hidratar, o Helmet assume
  // a emissão para que a navegação client-side continue correta.
  useEffect(() => {
    document.querySelectorAll("script[data-static-ld]").forEach((el) => el.remove());
  }, []);

  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <link rel="canonical" href={url} />

      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Honorífico" />
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={imageAlt || finalTitle} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={imageAlt || finalTitle} />


      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
}
