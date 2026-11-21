/**
 * Utilitários compartilhados de moeda e data para as calculadoras.
 * Padrão: o estado do campo guarda apenas os DÍGITOS (centavos) e o número
 * limpo é derivado na hora do envio.
 */

export const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

export const centsToNumber = (raw: string) => (raw ? parseInt(raw, 10) / 100 : 0);

export const numberToCents = (v: number) => String(Math.round(v * 100));

/** Exibição mascarada (1.234,56) a partir dos dígitos armazenados. */
export const formatCents = (raw: string) =>
  raw
    ? centsToNumber(raw).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "";

/**
 * Lê um valor monetário digitado livremente.
 * "1.500,50" (padrão BR) e "1500.50" (ponto decimal) valem 1500.5.
 * Com vírgula, o ponto é separador de milhar. Sem vírgula, ponto seguido de
 * exatamente 3 dígitos (ou mais de um ponto) é milhar: "10.000" = 10000,
 * "1.500.000" = 1500000. Ponto com 1 ou 2 dígitos depois é decimal.
 */
export const parseValorBR = (raw: string) => {
  const s = raw.trim();
  if (s.includes(",")) return parseFloat(s.replace(/\./g, "").replace(",", "."));
  const dots = s.match(/\./g);
  if (dots && dots.length > 1) return parseFloat(s.replace(/\./g, ""));
  if (dots && /^\d{1,3}\.\d{3}$/.test(s)) return parseFloat(s.replace(".", ""));
  return parseFloat(s);
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export { formatDateBR } from "./date";
