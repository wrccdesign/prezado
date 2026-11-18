/**
 * Filtros do calendário de feriados (tabela public.feriados).
 *
 * A tabela passou a ter dezenas de milhares de linhas municipais. Ler a janela
 * inteira devolve no máximo 1000 linhas por padrão e o cálculo do prazo sairia
 * com feriados faltando sem avisar. Por isso o filtro é montado aqui, aplicado
 * no banco, e só depois conferido no código.
 */

export const UFS_VALIDAS: readonly string[] = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT",
  "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

export interface FiltrosFeriados {
  uf: string | null;
  codigoIbge: string | null;
  tribunal: string | null;
}

const CODIGO_IBGE = /^\d{7}$/;
const TRIBUNAL = /^[A-Z0-9]{2,10}$/;

/**
 * Descarta valores que não são um estado, um código IBGE ou um tribunal de
 * verdade. O que sobra é o que pode entrar na consulta ao banco.
 */
export function normalizarFiltros(body: {
  uf?: string | null;
  codigo_ibge?: string | null;
  tribunal?: string | null;
}): FiltrosFeriados {
  const uf = (body.uf ?? "").trim().toUpperCase();
  const codigoIbge = (body.codigo_ibge ?? "").trim();
  const tribunal = (body.tribunal ?? "").trim().toUpperCase();

  return {
    uf: UFS_VALIDAS.includes(uf) ? uf : null,
    codigoIbge: CODIGO_IBGE.test(codigoIbge) ? codigoIbge : null,
    tribunal: TRIBUNAL.test(tribunal) ? tribunal : null,
  };
}

/**
 * Filtro PostgREST: traz o nacional e, quando o usuário escolheu, o estadual,
 * o municipal e a suspensão forense daquele lugar. Sem essa restrição a
 * consulta estoura o limite de linhas e feriados somem do cálculo.
 */
export function filtroPostgrest(filtros: FiltrosFeriados): string {
  const partes = ["tipo.eq.nacional"];
  if (filtros.uf) partes.push(`and(tipo.eq.estadual,uf.eq.${filtros.uf})`);
  if (filtros.codigoIbge) partes.push(`and(tipo.eq.municipal,codigo_ibge.eq.${filtros.codigoIbge})`);
  if (filtros.tribunal) partes.push(`and(tipo.eq.forense,tribunal.eq.${filtros.tribunal})`);
  return partes.join(",");
}

const ROTULOS: Record<string, string> = {
  nacional: "Feriado nacional",
  estadual: "Feriado estadual",
  municipal: "Feriado municipal",
  forense: "Suspensão forense",
};

/**
 * Rótulo da linha excluída. Quando o cadastro só diz "Feriado municipal",
 * repetir o nome depois dos dois-pontos não acrescenta nada.
 */
export function rotuloFeriado(tipo: string, descricao: string | null | undefined): string {
  const rotulo = ROTULOS[tipo] ?? "Feriado";
  const texto = (descricao ?? "").trim();
  if (!texto || texto.toLowerCase() === rotulo.toLowerCase()) return rotulo;
  return `${rotulo}: ${texto}`;
}
