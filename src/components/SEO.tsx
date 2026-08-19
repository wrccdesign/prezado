import { Helmet } from "react-helmet-async";

const SITE_URL = "https://honorifico.com.br";
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
  const url = `${SITE_URL}${path}`;
  const imageUrl = `${SITE_URL}${image || DEFAULT_IMAGE}`;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Honorífico" />
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={imageAlt || title} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={imageAlt || title} />

      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
}
