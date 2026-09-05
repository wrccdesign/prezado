import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { extractCitations, verifyCitations, type CitationItem } from "./citation-check.ts";

const tipos = (items: CitationItem[], tipo: string) => items.filter((i) => i.tipo === tipo);

Deno.test("1. número CNJ pontuado", () => {
  const items = extractCitations("conforme acórdão do TJRS, processo 5004331-62.2024.8.21.0090, resultado procedente");
  const p = tipos(items, "processo");
  assertEquals(p.length, 1);
  assertEquals(p[0].normalizado, "50043316220248210090");
});

Deno.test("2. número de 20 dígitos corridos", () => {
  const items = extractCitations("processo 07059428720258020058 do TJAL");
  const p = tipos(items, "processo");
  assertEquals(p.length, 1);
  assertEquals(p[0].normalizado, "07059428720258020058");
});

Deno.test("3. súmula do STJ", () => {
  const items = extractCitations("Nesse sentido, a Súmula 385 do STJ.");
  const s = tipos(items, "sumula");
  assertEquals(s.length, 1);
  assertEquals(s[0].texto, "Súmula 385 do STJ");
});

Deno.test("4. súmula vinculante do STF", () => {
  const items = extractCitations("aplica-se a Súmula Vinculante nº 10 do STF ao caso");
  const s = tipos(items, "sumula");
  assertEquals(s.length, 1);
});

Deno.test("5. artigo com sigla", () => {
  const items = extractCitations("nos termos do art. 477 da CLT, o pagamento é devido");
  const a = tipos(items, "artigo");
  assertEquals(a.length, 1);
  assertEquals(a[0].texto, "art. 477 da CLT");
});

Deno.test("6. artigo com Lei nº/ano", () => {
  const items = extractCitations("com base no art. 42 da Lei nº 8.078/1990");
  const a = tipos(items, "artigo");
  assertEquals(a.length, 1);
});

Deno.test("7. texto sem nenhuma citação", () => {
  assertEquals(extractCitations("O caso deve ser levado ao Juizado Especial Cível."), []);
});

Deno.test("8. deduplicação de citação repetida", () => {
  const items = extractCitations("art. 477 da CLT ... novamente o art. 477 da CLT");
  assertEquals(tipos(items, "artigo").length, 1);
});

Deno.test("9. verifyCitations classifica processos e não verificáveis", async () => {
  const fake = {
    from: () => ({
      select: () => ({
        in: (_col: string, values: string[]) =>
          Promise.resolve({
            data: values.includes("50043316220248210090")
              ? [{ numero_processo: "50043316220248210090" }]
              : [],
            error: null,
          }),
      }),
    }),
  };
  const items = extractCitations(
    "processo 5004331-62.2024.8.21.0090, processo 07059428720258020058, art. 477 da CLT, Súmula 385 do STJ",
  );
  const report = await verifyCitations(items, fake);
  assertEquals(report.verificados, 1);
  assertEquals(report.nao_encontrados, 1);
  assertEquals(report.nao_verificaveis, 2);
});
