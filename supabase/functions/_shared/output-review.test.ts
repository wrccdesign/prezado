import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  corrigirValoresPorExtenso,
  gramaticaSegura,
  parseValorBRL,
  valorPorExtenso,
  verificarFidelidadeFatos,
} from "./output-review.ts";

// --- valorPorExtenso ---

Deno.test("valorPorExtenso: 480 -> quatrocentos e oitenta reais", () => {
  assertEquals(valorPorExtenso(480), "quatrocentos e oitenta reais");
});

Deno.test("valorPorExtenso: 5.000 -> cinco mil reais (nunca 'um mil')", () => {
  assertEquals(valorPorExtenso(5000), "cinco mil reais");
});

Deno.test("valorPorExtenso: 5.480 sem vírgula (padrão dos tribunais)", () => {
  assertEquals(valorPorExtenso(5480), "cinco mil quatrocentos e oitenta reais");
});

Deno.test("valorPorExtenso: 1.250,37 com centavos", () => {
  assertEquals(valorPorExtenso(1250.37), "mil duzentos e cinquenta reais e trinta e sete centavos");
});

Deno.test("valorPorExtenso: 1.000.000 -> um milhão de reais", () => {
  assertEquals(valorPorExtenso(1_000_000), "um milhão de reais");
});

Deno.test("valorPorExtenso: resto menor que 100 ou centena redonda usa 'e'", () => {
  assertEquals(valorPorExtenso(1100), "mil e cem reais");
  assertEquals(valorPorExtenso(2050), "dois mil e cinquenta reais");
  assertEquals(valorPorExtenso(1_001_000), "um milhão e mil reais");
  assertEquals(valorPorExtenso(2_500_000), "dois milhões e quinhentos mil reais");
});

Deno.test("valorPorExtenso: 0,50 -> cinquenta centavos", () => {
  assertEquals(valorPorExtenso(0.5), "cinquenta centavos");
});

Deno.test("valorPorExtenso: 1,00 -> um real", () => {
  assertEquals(valorPorExtenso(1), "um real");
});

Deno.test("parseValorBRL aceita formatos brasileiros", () => {
  assertEquals(parseValorBRL("1.250,37"), 1250.37);
  assertEquals(parseValorBRL("5.000"), 5000);
  assertEquals(parseValorBRL("480"), 480);
  assertEquals(parseValorBRL("abc"), null);
});

// --- corrigirValoresPorExtenso ---

Deno.test("corrige extenso errado e mantém o número", () => {
  const entrada = "valor de R$ 480,00 (quatrocentos e eitenta reais) a pagar";
  const { texto, correcoes } = corrigirValoresPorExtenso(entrada);
  assertStringIncludes(texto, "R$ 480,00 (quatrocentos e oitenta reais)");
  assertEquals(correcoes, ["Valor por extenso ajustado: R$ 480,00"]);
});

Deno.test("não altera extenso já correto", () => {
  const entrada = "R$ 5.000,00 (cinco mil reais)";
  const { texto, correcoes } = corrigirValoresPorExtenso(entrada);
  assertEquals(texto, entrada);
  assertEquals(correcoes, []);
});

Deno.test("aceita a forma com vírgula como equivalente", () => {
  const entrada = "R$ 5.480,00 (cinco mil, quatrocentos e oitenta reais)";
  const { texto, correcoes } = corrigirValoresPorExtenso(entrada);
  assertEquals(texto, entrada);
  assertEquals(correcoes, []);
});

// --- verificarFidelidadeFatos ---

Deno.test("sinaliza data que não está nos fatos", () => {
  const fatos = "Fui demitida em 10/03/2026 pela empresa.";
  const saida = "A reclamante foi dispensada em 15/04/2026, conforme os fatos.";
  const pontos = verificarFidelidadeFatos(saida, { fatos });
  assertEquals(pontos.some((p) => p.includes("15/04/2026")), true);
  assertEquals(pontos.some((p) => p.includes("10/03/2026")), false);
});

Deno.test("não sinaliza valor da causa igual à soma dos pedidos", () => {
  const pedidos = "a) R$ 1.000,00 de dano moral; b) R$ 500,00 de dano material";
  const saida = "Dá-se à causa o valor de R$ 1.500,00 (mil e quinhentos reais).";
  const pontos = verificarFidelidadeFatos(saida, { fatos: "Cobrança indevida.", pedidos });
  assertEquals(pontos.some((p) => p.includes("1.500")), false);
});

Deno.test("sinaliza valor que não está nos fatos nem nos pedidos", () => {
  const saida = "A autora pagou R$ 2.300,00 em taxas indevidas.";
  const pontos = verificarFidelidadeFatos(saida, { fatos: "Paguei taxas que não devia." });
  assertEquals(pontos.some((p) => p.includes("2.300")), true);
});

Deno.test("sinaliza gênero trocado: fatos femininos, texto com 'o Autor'", () => {
  const fatos = "Fui realocada para outro setor e depois fui demitida sem justa causa.";
  const saida = "O Autor foi dispensado imotivadamente do emprego.";
  const pontos = verificarFidelidadeFatos(saida, { fatos });
  assertEquals(pontos.some((p) => p.includes("o Autor")), true);
});

Deno.test("não sinaliza gênero quando o texto usa 'a Autora'", () => {
  const fatos = "Fui realocada e depois demitida.";
  const saida = "A Autora foi dispensada imotivadamente.";
  const pontos = verificarFidelidadeFatos(saida, { fatos });
  assertEquals(pontos.some((p) => p.includes("Autor")), false);
});

Deno.test("gênero: 'fui para Lisboa' não é marca de gênero", () => {
  const saida = "O Autor pleiteia a reparação.";
  const pontos = verificarFidelidadeFatos(saida, { fatos: "Fui para Lisboa em janeiro." });
  assertEquals(pontos.some((p) => p.includes("Autor")), false);
});

Deno.test("gênero: 'fui ao banco e fui cobrado' indica masculino", () => {
  const saida = "A Autora pleiteia a devolução dos valores.";
  const pontos = verificarFidelidadeFatos(saida, { fatos: "Fui ao banco e fui cobrado indevidamente." });
  assertEquals(pontos.some((p) => p.includes("a Autora")), true);
});

Deno.test("gênero: marca em terceira pessoa não decide", () => {
  const saida = "A Autora pleiteia a reparação.";
  const pontos = verificarFidelidadeFatos(saida, { fatos: "Fui realocada e meu marido foi demitido." });
  // A marca de primeira pessoa é feminina; "foi demitido" (terceira pessoa) não conta.
  assertEquals(pontos.some((p) => p.includes("a Autora")), false);
});

// --- gramaticaSegura (trava) ---

Deno.test("trava descarta correção que mexe em número", () => {
  const antes = "O valor devido é R$ 480,00 conforme o art. 219 do CPC.";
  const depois = "O valor devido é R$ 580,00 conforme o art. 219 do CPC.";
  assertEquals(gramaticaSegura(antes, depois), false);
});

Deno.test("trava descarta correção que mexe em data e sigla de tribunal", () => {
  const antes = "Decisão do TJSP de 10/09/2026 no processo 1234567-89.2026.8.26.0100.";
  const depois = "Decisão do TJRJ de 11/09/2026 no processo 1234567-89.2026.8.26.0100.";
  assertEquals(gramaticaSegura(antes, depois), false);
});

Deno.test("trava descarta reescrita longa (mais de 3% dos caracteres)", () => {
  const antes = "A autora trabalhou na empresa por cinco anos sem registro.";
  const depois = "A autora prestou serviços à empresa demandada durante cinco anos consecutivos, sempre sem qualquer anotação em sua carteira de trabalho.";
  assertEquals(gramaticaSegura(antes, depois), false);
});

Deno.test("trava aceita correção pequena de ortografia", () => {
  const antes = "A autora trabalho na empresa por cinco anos.";
  const depois = "A autora trabalhou na empresa por cinco anos.";
  assertEquals(gramaticaSegura(antes, depois), true);
});

Deno.test("trava rejeita 3 palavras trocadas em 20, mesmo com mesmo tamanho", () => {
  const antes = "A autora trabalhou na empresa por cinco anos sem registro formal em carteira assinada.";
  // Mesmo número de caracteres aproximado, 3 palavras trocadas (20% das palavras).
  const depois = "A autora prestou serviços na empresa por cinco anos sem vínculo formal em carteira anotada.";
  assertEquals(gramaticaSegura(antes, depois), false);
});
