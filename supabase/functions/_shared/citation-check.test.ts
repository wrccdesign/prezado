import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { extractCitations, parseSumula, verifyCitations, type CitationItem } from "./citation-check.ts";

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
  // processo ausente + súmula ausente do acervo curado
  assertEquals(report.nao_encontrados, 2);
  // apenas o artigo de lei
  assertEquals(report.nao_verificaveis, 1);
});

Deno.test("parseSumula identifica tribunal, tipo e número", () => {
  const a = parseSumula("Súmula Vinculante 13 do STF");
  assertEquals(a, { tribunal: "STF", tipo: "vinculante", numero: 13 });
  const b = parseSumula("Súmula 297 do STJ");
  assertEquals(b, { tribunal: "STJ", tipo: "comum", numero: 297 });
  assertEquals(parseSumula("art. 5º da CF"), null);
});

Deno.test("verifyCitations confere súmulas contra o acervo", async () => {
  const fake = {
    from: (table: string) => ({
      select: () => ({
        in: () =>
          Promise.resolve({
            data: table === "sumulas"
              ? [{ tribunal: "STJ", tipo: "comum", numero: 297 }]
              : [],
          }),
      }),
    }),
  };
  const items = extractCitations("Aplica-se a Súmula 297 do STJ e a Súmula 999 do STJ.");
  const report = await verifyCitations(items, fake);
  assertEquals(report.verificados, 1);
  assertEquals(report.nao_encontrados, 1);
});

const artigos = (t: string) => tipos(extractCitations(t), "artigo").map((i) => i.texto);

Deno.test("10. artigos em série antes de Lei nº X/ANO", () => {
  assertEquals(
    artigos("nos termos do art. 186 e do art. 927 da Lei nº 10.406/2002"),
    ["art. 186 da Lei 10.406/2002", "art. 927 da Lei 10.406/2002"],
  );
});

Deno.test("11. nome de código por extenso", () => {
  assertEquals(artigos("art. 300 do Código de Processo Civil"), ["art. 300 do CPC"]);
  assertEquals(artigos("art. 5º da Constituição Federal"), ["art. 5 da CF"]);
  assertEquals(
    artigos("art. 42 do Código de Defesa do Consumidor"),
    ["art. 42 do CDC"],
  );
  assertEquals(
    artigos("art. 477 da Consolidação das Leis do Trabalho"),
    ["art. 477 da CLT"],
  );
});

Deno.test("12. plural com nome por extenso e com sigla", () => {
  assertEquals(
    artigos("arts. 186 e 927 do Código Civil"),
    ["art. 186 do CC", "art. 927 do CC"],
  );
  assertEquals(
    artigos("arts. 186, 187 e 927 do CC"),
    ["art. 186 do CC", "art. 187 do CC", "art. 927 do CC"],
  );
});

Deno.test("13. parágrafo e inciso não viram artigo", () => {
  assertEquals(artigos("art. 43, § 3º, do CDC"), ["art. 43 do CDC"]);
  assertEquals(
    artigos("art. 6º, inciso VIII, da Lei nº 8.078/1990"),
    ["art. 6 da Lei 8.078/1990"],
  );
});

Deno.test("14. dedupe entre forma extensa e sigla", () => {
  assertEquals(
    artigos("o art. 927 do Código Civil, e ainda o art. 927 do CC"),
    ["art. 927 do CC"],
  );
});

Deno.test("15. artigo com inciso romano solto antes do diploma", () => {
  const items = extractCitations("Conforme o art. 5º, II, da CF, ninguém será obrigado.");
  assertEquals(items.map((i) => i.texto), ["art. 5 da CF"]);
});

Deno.test("16. artigo com milhar separado por ponto", () => {
  const items = extractCitations("Nos termos do art. 1.723 do Código Civil.");
  assertEquals(items.map((i) => i.texto), ["art. 1.723 do CC"]);
});
