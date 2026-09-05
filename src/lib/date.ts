/**
 * Formata uma data vinda do banco no tipo `date` puro (YYYY-MM-DD) para
 * DD/MM/YYYY por manipulação de string.
 *
 * Não usar `new Date("2024-11-29")`: a string é lida como meia-noite UTC e a
 * renderização em UTC-3 volta um dia. Este helper NÃO deve ser usado em
 * timestamps reais com hora (created_at etc.), onde a conversão de fuso é
 * desejada.
 */
export function formatDateBR(value?: string | null): string {
  if (!value) return "";
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(value);
  const [, ano, mes, dia] = match;
  return `${dia}/${mes}/${ano}`;
}
