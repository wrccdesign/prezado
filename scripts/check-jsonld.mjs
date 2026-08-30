// Valida o JSON-LD e as meta tags do HTML estático gerado pelo build
// (plugin "static-route-meta"), sem depender do JavaScript do cliente.
//
// Uso: bun run build && bun run check:seo
//
// Extensível: acrescente rotas em ROUTES_TO_CHECK.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ROUTE_META, SITE_URL } from "../src/seo/routeMeta.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "..", "dist");

/** Blocos que vêm do index.html base e devem existir em todas as rotas. */
const BASE_TYPES = ["Organization", "WebSite"];

const ROUTES_TO_CHECK = [
  "/planos",
  "/diagnostico",
  "/calculadoras/correcao-monetaria-juros-lei-14905",
  "/calculadoras/prazo-processual",
];

function htmlPathFor(route) {
  return route === "/"
    ? path.join(DIST, "index.html")
    : path.join(DIST, route.replace(/^\//, ""), "index.html");
}

function extractJsonLd(html) {
  const blocks = [];
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    blocks.push(m[1].trim());
  }
  return blocks;
}

function extractTag(html, re) {
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

function decodeEntities(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

function typesOf(node) {
  const t = node["@type"];
  return Array.isArray(t) ? t : [t];
}

function checkRoute(route) {
  const errors = [];
  const meta = ROUTE_META.find((m) => m.path === route);
  if (!meta) {
    return { route, errors: [`rota ausente em src/seo/routeMeta.ts`], types: [] };
  }

  const file = htmlPathFor(route);
  if (!fs.existsSync(file)) {
    return { route, errors: [`HTML estático não encontrado: ${path.relative(DIST, file)}`], types: [] };
  }
  const html = fs.readFileSync(file, "utf-8");

  // --- meta tags ---
  const title = extractTag(html, /<title>([\s\S]*?)<\/title>/i);
  if (decodeEntities(title ?? "") !== meta.title) {
    errors.push(`<title> divergente: "${title}" ≠ "${meta.title}"`);
  }
  const description = extractTag(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  if (decodeEntities(description ?? "") !== meta.description) {
    errors.push(`meta description divergente`);
  }
  const canonical = extractTag(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);
  const expectedCanonical = `${SITE_URL}${route}`;
  if (canonical !== expectedCanonical) {
    errors.push(`canonical divergente: "${canonical}" ≠ "${expectedCanonical}"`);
  }

  // --- JSON-LD ---
  const expected = [...BASE_TYPES, ...(meta.jsonLd ?? []).flatMap(typesOf)];
  const found = [];

  for (const raw of extractJsonLd(html)) {
    let node;
    try {
      node = JSON.parse(raw);
    } catch (e) {
      errors.push(`bloco JSON-LD não parseável: ${e.message}`);
      continue;
    }
    const nodes = Array.isArray(node) ? node : [node];
    for (const n of nodes) {
      const t = typesOf(n);
      found.push(...t);

      if (n["@context"] !== "https://schema.org") {
        errors.push(`${t.join("/")}: @context inválido (${n["@context"]})`);
      }

      if (t.includes("FAQPage")) {
        const qs = Array.isArray(n.mainEntity) ? n.mainEntity : [];
        if (qs.length === 0) errors.push("FAQPage sem perguntas");
        qs.forEach((q, i) => {
          if (!q.name) errors.push(`FAQPage: pergunta ${i + 1} sem name`);
          const text = q.acceptedAnswer?.text;
          if (!text || !String(text).trim()) {
            errors.push(`FAQPage: pergunta ${i + 1} sem acceptedAnswer.text`);
          }
        });
      }

      if (t.includes("BreadcrumbList")) {
        const items = Array.isArray(n.itemListElement) ? n.itemListElement : [];
        const last = items[items.length - 1];
        if (!last || last.item !== expectedCanonical) {
          errors.push(
            `BreadcrumbList não termina na própria rota (último item: ${last?.item ?? "—"})`,
          );
        }
      }
    }
  }

  for (const type of expected) {
    if (!found.includes(type)) errors.push(`bloco esperado ausente: ${type}`);
  }
  for (const type of found) {
    if (!expected.includes(type)) errors.push(`bloco inesperado: ${type}`);
  }

  return { route, errors, types: found };
}

function main() {
  if (!fs.existsSync(DIST)) {
    console.error("dist/ não existe. Rode `bun run build` antes de `bun run check:seo`.");
    process.exit(1);
  }

  let failed = 0;
  for (const route of ROUTES_TO_CHECK) {
    const { errors, types } = checkRoute(route);
    if (errors.length === 0) {
      console.log(`OK   ${route} — ${types.length} blocos: ${types.join(", ")}`);
    } else {
      failed++;
      console.log(`FALHA ${route} — ${types.length} blocos: ${types.join(", ") || "—"}`);
      for (const e of errors) console.log(`      • ${e}`);
    }
  }

  console.log(
    failed === 0
      ? `\n${ROUTES_TO_CHECK.length} rotas validadas com sucesso.`
      : `\n${failed} de ${ROUTES_TO_CHECK.length} rotas com problema.`,
  );
  process.exit(failed === 0 ? 0 : 1);
}

main();
