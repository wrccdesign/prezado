import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { filtroPostgrest, normalizarFiltros, rotuloFeriado } from "./feriados-filtro.ts";

Deno.test("normalizarFiltros: mantém estado, código IBGE e tribunal válidos", () => {
  assertEquals(
    normalizarFiltros({ uf: "sp", codigo_ibge: "3550308", tribunal: "tjsp" }),
    { uf: "SP", codigoIbge: "3550308", tribunal: "TJSP" },
  );
});

Deno.test("normalizarFiltros: descarta marcas de 'todos' e valores fora do formato", () => {
  assertEquals(
    normalizarFiltros({ uf: "__nenhum__", codigo_ibge: "__todos__", tribunal: "" }),
    { uf: null, codigoIbge: null, tribunal: null },
  );
  assertEquals(
    normalizarFiltros({ uf: "SP", codigo_ibge: "1;drop table", tribunal: "TJ;--" }),
    { uf: "SP", codigoIbge: null, tribunal: null },
  );
  assertEquals(normalizarFiltros({ uf: "SPX" }).uf, null);
});

Deno.test("filtroPostgrest: sem escolha, só o nacional é consultado", () => {
  assertEquals(filtroPostgrest({ uf: null, codigoIbge: null, tribunal: null }), "tipo.eq.nacional");
});

Deno.test("filtroPostgrest: cada escolha acrescenta a sua linha do calendário", () => {
  assertEquals(
    filtroPostgrest({ uf: "SP", codigoIbge: null, tribunal: null }),
    "tipo.eq.nacional,and(tipo.eq.estadual,uf.eq.SP)",
  );
  const completo = filtroPostgrest({ uf: "GO", codigoIbge: "5208707", tribunal: "TJGO" });
  assertEquals(completo, [
    "tipo.eq.nacional",
    "and(tipo.eq.estadual,uf.eq.GO)",
    "and(tipo.eq.municipal,codigo_ibge.eq.5208707)",
    "and(tipo.eq.forense,tribunal.eq.TJGO)",
  ].join(","));
});

Deno.test("filtroPostgrest: texto malicioso não chega à consulta", () => {
  const filtros = normalizarFiltros({ uf: "SP", codigo_ibge: "3550308) or (1 eq 1" });
  assertEquals(filtros.codigoIbge, null);
  assertEquals(filtroPostgrest({ ...filtros, tribunal: null }), "tipo.eq.nacional,and(tipo.eq.estadual,uf.eq.SP)");
});

Deno.test("rotuloFeriado: cadastro genérico não repete o nome do feriado", () => {
  assertEquals(rotuloFeriado("municipal", "Feriado municipal"), "Feriado municipal");
  assertEquals(rotuloFeriado("municipal", ""), "Feriado municipal");
  assertEquals(rotuloFeriado("municipal", null), "Feriado municipal");
});

Deno.test("rotuloFeriado: nome real vem depois do tipo", () => {
  assertEquals(rotuloFeriado("municipal", "Aniversário da Cidade"), "Feriado municipal: Aniversário da Cidade");
  assertEquals(
    rotuloFeriado("estadual", "Nossa Senhora da Penha (Data Magna do ES)"),
    "Feriado estadual: Nossa Senhora da Penha (Data Magna do ES)",
  );
  assertEquals(rotuloFeriado("forense", "Recesso de 20/12 a 06/01"), "Suspensão forense: Recesso de 20/12 a 06/01");
});
