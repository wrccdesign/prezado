import { assert, assertNotEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

/**
 * Trava jurídica: a Taxa Legal (SGS 29543, art. 406, §1º, CC) é apurada com o
 * IPCA-15 do mês anterior (Res. CMN 5.171/2024), enquanto a correção monetária
 * do art. 389 usa o IPCA cheio (SGS 433). São séries distintas — uma nunca pode
 * ser derivada da outra nem substituí-la.
 */
async function serie(codigo: number, ini: string, fim: string) {
  const url =
    `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados?formato=json&dataInicial=${ini}&dataFinal=${fim}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  return (await res.json()) as Array<{ data: string; valor: string }>;
}

Deno.test("IPCA (433) e Taxa Legal (29543) são séries distintas", async () => {
  const ipca = await serie(433, "01/09/2024", "31/12/2024");
  const legal = await serie(29543, "01/09/2024", "31/12/2024");

  assert(ipca.length > 0, "série IPCA vazia");
  assert(legal.length > 0, "série Taxa Legal vazia");

  const iguais = ipca.every((r, i) => legal[i] && legal[i].valor === r.valor);
  assertNotEquals(iguais, true, "IPCA e Taxa Legal não podem ter os mesmos valores");
});
