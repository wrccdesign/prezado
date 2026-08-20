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

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const formatDateBR = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
