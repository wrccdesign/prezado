import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { ROUTE_META, SITE_URL, type RouteMeta } from "./src/seo/routeMeta";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function applyMeta(template: string, meta: RouteMeta) {
  const url = `${SITE_URL}${meta.path}`;
  const image = `${SITE_URL}${meta.ogImage}`;
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);

  const replacements: Array<[RegExp, string]> = [
    [/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`],
    [
      /<meta\s+name="description"[^>]*>/i,
      `<meta name="description" content="${description}" />`,
    ],
    [
      /<meta\s+property="og:title"[^>]*>/i,
      `<meta property="og:title" content="${title}" />`,
    ],
    [
      /<meta\s+property="og:description"[^>]*>/i,
      `<meta property="og:description" content="${description}" />`,
    ],
    [/<meta\s+property="og:url"[^>]*>/i, `<meta property="og:url" content="${url}" />`],
    [/<meta\s+property="og:image"(?!:)[^>]*>/i, `<meta property="og:image" content="${image}" />`],
    [
      /<meta\s+property="og:image:alt"[^>]*>/i,
      `<meta property="og:image:alt" content="${title}" />`,
    ],
    [
      /<meta\s+name="twitter:title"[^>]*>/i,
      `<meta name="twitter:title" content="${title}" />`,
    ],
    [
      /<meta\s+name="twitter:description"[^>]*>/i,
      `<meta name="twitter:description" content="${description}" />`,
    ],
    [
      /<meta\s+name="twitter:image"(?!:)[^>]*>/i,
      `<meta name="twitter:image" content="${image}" />`,
    ],
    [
      /<meta\s+name="twitter:image:alt"[^>]*>/i,
      `<meta name="twitter:image:alt" content="${title}" />`,
    ],
  ];

  let html = template;
  const pending: string[] = [];
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(html)) {
      html = html.replace(pattern, replacement);
    } else {
      pending.push(replacement);
    }
  }

  const canonical = `<link rel="canonical" href="${url}" />`;
  if (/<link\s+rel="canonical"[^>]*>/i.test(html)) {
    html = html.replace(/<link\s+rel="canonical"[^>]*>/i, canonical);
  } else {
    pending.push(canonical);
  }

  if (pending.length) {
    html = html.replace(/<\/head>/i, `    ${pending.join("\n    ")}\n  </head>`);
  }

  return html;
}

/** Gera dist/<rota>/index.html com meta tags próprias por rota. */
function staticRouteMeta(): Plugin {
  return {
    name: "static-route-meta",
    apply: "build",
    closeBundle() {
      try {
        const distDir = path.resolve(__dirname, "dist");
        const templatePath = path.join(distDir, "index.html");
        const template = fs.readFileSync(templatePath, "utf-8");

        for (const meta of ROUTE_META) {
          const html = applyMeta(template, meta);
          if (meta.path === "/") {
            fs.writeFileSync(templatePath, html);
            continue;
          }
          const outDir = path.join(distDir, meta.path.replace(/^\//, ""));
          fs.mkdirSync(outDir, { recursive: true });
          fs.writeFileSync(path.join(outDir, "index.html"), html);
        }
        console.log(`static-route-meta: ${ROUTE_META.length} rotas geradas`);
      } catch (error) {
        console.warn(
          `static-route-meta: pré-renderização de meta tags ignorada — ${(error as Error).message}`,
        );
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    staticRouteMeta(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
