/** Texto compatível com as fontes dos documentos, preservando acentos e linhas. */
export function cleanDocumentText(text: string): string {
  return text
    .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D\u20E3]/gu, "")
    .replace(/[—–]/g, ":")
    .replace(/\r\n?/g, "\n");
}

export function cleanPetitionText(text: string): string {
  return cleanDocumentText(text).replace(/^\s*(?:#{1,6}\s*)?(?:\d+[.)]\s*)?DO FECHO\s*$/gim, "");
}