/**
 * Ponte entre as calculadoras e o gerador de petições.
 * O payload é guardado em sessionStorage porque a rota /peticao é protegida:
 * o visitante anônimo passa por /auth e o `state` da navegação se perderia.
 */
const KEY = "honorifico:peticao-prefill";

export interface PeticaoPrefill {
  /** Total apurado pela calculadora. */
  valor: number;
  dataInicial?: string;
  dataFinal?: string;
  indice?: string;
  /** Tipo de ação sugerido, precisa existir na lista do gerador. */
  tipoAcao?: string;
  varaJuizo?: string;
  /** Síntese dos dados do cálculo, entra no campo de fatos. */
  fatos?: string;
  /** Pedido já formatado, entra no campo de pedidos. */
  pedidos?: string;
  /** Nome da calculadora de origem, exibido no aviso do formulário. */
  origem?: string;
}

export function savePeticaoPrefill(payload: PeticaoPrefill) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage indisponível (modo privado): a ponte apenas não pré-preenche.
  }
}

/** Lê e consome o payload — só pré-preenche uma vez. */
export function consumePeticaoPrefill(): PeticaoPrefill | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as PeticaoPrefill;
    return typeof parsed?.valor === "number" ? parsed : null;
  } catch {
    return null;
  }
}

function mesLabel(iso?: string) {
  if (!iso) return null;
  const [y, m] = iso.split("-");
  return y && m ? `${m}/${y}` : null;
}

export function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function prefillLinha(p: PeticaoPrefill): string {
  if (p.pedidos) return p.pedidos;
  const valor = formatBRL(p.valor);
  const inicio = mesLabel(p.dataInicial);
  const fim = mesLabel(p.dataFinal);
  const periodo = inicio && fim ? `, período de ${inicio} a ${fim}` : "";
  const indice = p.indice ? `, índice ${p.indice.toUpperCase()}` : "";
  return `Valor atualizado: ${valor}${periodo}${indice}, conforme memória de cálculo em anexo.`;
}
