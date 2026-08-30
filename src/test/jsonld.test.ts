import { describe, it, expect } from "vitest";

import { ROUTE_META, SITE_URL } from "@/seo/routeMeta";

const EXPECTED: Record<string, string[]> = {
  "/planos": ["Product", "BreadcrumbList", "FAQPage"],
  "/diagnostico": ["BreadcrumbList", "SoftwareApplication"],
  "/calculadoras/correcao-monetaria-juros-lei-14905": [
    "BreadcrumbList",
    "SoftwareApplication",
    "FAQPage",
  ],
  "/calculadoras/prazo-processual": ["BreadcrumbList", "SoftwareApplication", "FAQPage"],
};

type LdNode = Record<string, unknown>;

function metaFor(path: string) {
  const meta = ROUTE_META.find((m) => m.path === path);
  if (!meta) throw new Error(`rota ausente em routeMeta: ${path}`);
  return meta;
}

describe("JSON-LD por rota (routeMeta)", () => {
  for (const [path, expectedTypes] of Object.entries(EXPECTED)) {
    describe(path, () => {
      const meta = metaFor(path);
      const nodes = (meta.jsonLd ?? []) as LdNode[];

      it("declara exatamente os @type esperados", () => {
        expect(nodes.map((n) => n["@type"])).toEqual(expectedTypes);
      });

      it("usa @context https://schema.org em todos os blocos", () => {
        for (const n of nodes) expect(n["@context"]).toBe("https://schema.org");
      });

      it("é serializável em JSON", () => {
        for (const n of nodes) expect(() => JSON.parse(JSON.stringify(n))).not.toThrow();
      });

      it("tem title e description dentro dos limites de SEO", () => {
        expect(meta.title.length).toBeGreaterThan(0);
        expect(meta.title.length).toBeLessThanOrEqual(70);
        expect(meta.description.length).toBeGreaterThan(0);
        expect(meta.description.length).toBeLessThanOrEqual(165);
      });

      const breadcrumb = nodes.find((n) => n["@type"] === "BreadcrumbList");
      if (breadcrumb) {
        it("BreadcrumbList termina na própria rota", () => {
          const items = breadcrumb.itemListElement as { item: string }[];
          expect(items.at(-1)?.item).toBe(`${SITE_URL}${path}`);
        });
      }

      const faq = nodes.find((n) => n["@type"] === "FAQPage");
      if (faq) {
        it("FAQPage tem perguntas com resposta não vazia", () => {
          const items = faq.mainEntity as {
            name: string;
            acceptedAnswer: { text: string };
          }[];
          expect(items.length).toBeGreaterThan(0);
          for (const q of items) {
            expect(q.name.trim().length).toBeGreaterThan(0);
            expect(q.acceptedAnswer.text.trim().length).toBeGreaterThan(0);
          }
        });
      }
    });
  }
});
