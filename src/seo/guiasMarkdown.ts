// Parser mínimo do Markdown dos guias (negrito, itálico, link, listas, tabela).
// TypeScript puro, usado no React e na pré-renderização do build.

export type Inline =
  | { t: "text"; v: string }
  | { t: "strong"; v: string }
  | { t: "em"; v: string }
  | { t: "link"; v: string; href: string };

export type Block =
  | { t: "p"; inl: Inline[] }
  | { t: "ul"; items: Inline[][] }
  | { t: "ol"; items: Inline[][] }
  | { t: "table"; head: Inline[][]; rows: Inline[][][] };

export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ t: "text", v: s.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ t: "strong", v: m[1] });
    else if (m[2] !== undefined) out.push({ t: "em", v: m[2] });
    else out.push({ t: "link", v: m[3], href: m[4] });
    last = re.lastIndex;
  }
  if (last < s.length) out.push({ t: "text", v: s.slice(last) });
  return out;
}

const cells = (line: string) => line.trim().replace(/^\||\|$/g, "").split("|").map((c) => parseInline(c.trim()));

export function parseBlocks(md: string): Block[] {
  return md
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b): Block => {
      const lines = b.split("\n");
      if (lines.every((l) => l.startsWith("- "))) return { t: "ul", items: lines.map((l) => parseInline(l.slice(2))) };
      if (lines.every((l) => /^\d+\. /.test(l))) return { t: "ol", items: lines.map((l) => parseInline(l.replace(/^\d+\. /, ""))) };
      if (lines.every((l) => l.startsWith("|"))) {
        const body = lines.filter((l) => !/^\|[\s|:-]+\|$/.test(l));
        return { t: "table", head: cells(body[0]), rows: body.slice(1).map(cells) };
      }
      return { t: "p", inl: parseInline(lines.join(" ")) };
    });
}

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function inlineHtml(inl: Inline[]): string {
  return inl
    .map((i) =>
      i.t === "text" ? esc(i.v) : i.t === "strong" ? `<strong>${esc(i.v)}</strong>` : i.t === "em" ? `<em>${esc(i.v)}</em>` : `<a href="${esc(i.href)}">${esc(i.v)}</a>`,
    )
    .join("");
}

export function blocksHtml(blocks: Block[]): string {
  return blocks
    .map((b) => {
      if (b.t === "p") return `<p>${inlineHtml(b.inl)}</p>`;
      if (b.t !== "table") return `<${b.t}>${b.items.map((i) => `<li>${inlineHtml(i)}</li>`).join("")}</${b.t}>`;
      return `<table><thead><tr>${b.head.map((c) => `<th>${inlineHtml(c)}</th>`).join("")}</tr></thead><tbody>${b.rows
        .map((r) => `<tr>${r.map((c) => `<td>${inlineHtml(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody></table>`;
    })
    .join("");
}

export { esc as escapeGuiaHtml };
