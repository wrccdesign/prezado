import { GUIAS } from "./guiasData";
import { blocksHtml, escapeGuiaHtml as esc, parseBlocks } from "./guiasMarkdown";

export { GUIAS };
export const GUIAS_PATH = "/guias";
export const GUIAS_HEADING = "Guias de correção monetária e juros após a Lei 14.905/2024";
export const GUIAS_SITE_URL = "https://honorifico.com.br";
export const getGuia = (path: string) => GUIAS.find((g) => g.path === path);

export function guiaJsonLd(path: string): Record<string, unknown>[] {
  const g = getGuia(path);
  if (!g) return [];
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: `${GUIAS_SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Guias", item: `${GUIAS_SITE_URL}${GUIAS_PATH}` },
        { "@type": "ListItem", position: 3, name: g.h1, item: `${GUIAS_SITE_URL}${g.path}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: g.faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ];
}

/** HTML estático de pré-renderização (texto completo do guia). */
export function renderGuiaHtml(path: string): string | null {
  if (path === GUIAS_PATH) {
    return `<div data-static-content><h1>${esc(GUIAS_HEADING)}</h1><ul>${GUIAS.map((g) => `<li><a href="${g.path}">${esc(g.h1)}</a></li>`).join("")}</ul></div>`;
  }
  const g = getGuia(path);
  if (!g) return null;
  const parts = [`<h1>${esc(g.h1)}</h1>`, `<p>${esc(g.resposta)}</p>`];
  for (const s of g.sections) parts.push(`<h2>${esc(s.heading)}</h2>`, blocksHtml(parseBlocks(s.markdown)));
  parts.push("<h2>Perguntas frequentes</h2>");
  for (const f of g.faq) parts.push(`<h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p>`);
  parts.push(
    "<h2>Calcule grátis, sem cadastro</h2>",
    `<p>${g.cta.links.map((l) => `<a href="${l.to}">${esc(l.label)}</a>`).join(" ")}</p>`,
    `<p>${esc(g.cta.plano)} <a href="/planos">Ver planos</a></p>`,
    `<p>Guias relacionados: ${g.cta.related.map((l) => `<a href="${l.to}">${esc(l.label)}</a>`).join(", ")}</p>`,
    `<p><em>${esc(g.cta.aviso)}</em></p>`,
  );
  return `<div data-static-content>${parts.join("")}</div>`;
}
