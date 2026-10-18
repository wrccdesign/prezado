import { describe, expect, it } from "vitest";
import { tipoAcaoFromDiagnostico, valorInformadoNosFatos, salarioMinimoVigente } from "@/lib/peticaoPrefill";
import { cleanDocumentText, cleanPetitionText } from "@/lib/documentText";
import { visibleUsageActions, canIncreaseLimits } from "@/lib/usagePresentation";
import { firstDisplayName, analysisDisplayTitle } from "@/lib/recentAnalysis";

describe("sugestão de Juizado Especial Cível", () => {
  it("sugere JEC para consumidor com R$ 480", () => {
    expect(tipoAcaoFromDiagnostico("Indenização", "consumidor", 480, 1621).varaJuizo).toBe("Juizado Especial Cível");
  });
  it("inclui exatamente 40 salários mínimos e exclui valor superior", () => {
    expect(tipoAcaoFromDiagnostico("Cobrança", "civil", 64840, 1621).varaJuizo).toBe("Juizado Especial Cível");
    expect(tipoAcaoFromDiagnostico("Cobrança", "civil", 64840.01, 1621).varaJuizo).toBe("Cível");
  });
  it("sem valor mantém consumidor e não muda família/trabalho", () => {
    expect(tipoAcaoFromDiagnostico("Indenização", "consumidor").varaJuizo).toBe("Consumidor");
    expect(tipoAcaoFromDiagnostico("Reclamação trabalhista", "trabalho", 480, 1621).varaJuizo).toBe("Trabalho");
    expect(tipoAcaoFromDiagnostico("Alimentos", "família", 480, 1621).varaJuizo).toBe("Família");
  });
  it("usa só montante explícito sem somar ou estimar", () => {
    expect(valorInformadoNosFatos("Diária perdida (R$ 480), e dano moral")).toBe(480);
    expect(valorInformadoNosFatos("R$ 1.480,50")).toBe(1480.5);
    expect(valorInformadoNosFatos("R$ 480 e R$ 900")).toBeUndefined();
    expect(valorInformadoNosFatos("22 horas de atraso")).toBeUndefined();
  });
  it("não mantém salário mínimo de 2026 em anos futuros", () => {
    expect(salarioMinimoVigente(new Date(2026, 9, 18))).toBe(1621);
    expect(salarioMinimoVigente(new Date(2027, 0, 1))).toBeUndefined();
  });
});

describe("regras de apresentação do uso", () => {
  const actions = [
    { action: "peticao_preview", label: "peticao_preview", limit: -1 },
    { action: "calculo", label: "calculo", limit: -1 },
    { action: "peticao", label: "peticao", limit: 0 },
    { action: "unknown", label: "unknown", limit: 10 },
  ];
  it("omite ações sem cota e desconhecidas, corrige rótulo conhecido", () => {
    expect(visibleUsageActions(actions)).toEqual([{ action: "peticao", label: "Petições", limit: 0 }]);
  });
  it("admin permanece ilimitado mesmo com resposta antiga free", () => {
    expect(visibleUsageActions(actions, true)[0].limit).toBe(-1);
    expect(canIncreaseLimits("free", true)).toBe(false);
    expect(canIncreaseLimits("admin")).toBe(false);
    expect(canIncreaseLimits("free")).toBe(true);
  });
});

describe("fidelidade dos documentos e recentes", () => {
  it("remove emojis preservando acentos, dinheiro e quebras", () => {
    expect(cleanDocumentText("⚠️ IMPORTANTE\nInteligência artificial, R$ 480.\nAnálise — Civil")).toBe(" IMPORTANTE\nInteligência artificial, R$ 480.\nAnálise, Civil");
  });
  it("travessão vira vírgula e meia-risca vira hífen, nunca dois-pontos", () => {
    expect(cleanDocumentText("art. 219 — contagem")).toBe("art. 219, contagem");
    expect(cleanDocumentText("Curitiba–Lisboa")).toBe("Curitiba-Lisboa");
    expect(cleanDocumentText("10–12")).toBe("10-12");
    expect(cleanDocumentText("vigência 2024–2026, art. 219 — contagem")).toBe("vigência 2024-2026, art. 219, contagem");
    expect(cleanDocumentText("Curitiba–Lisboa, 10–12, art. 219 — contagem")).not.toContain(":");
  });
  it("remove só título DO FECHO, preserva fecho", () => {
    expect(cleanPetitionText("DO FECHO\nNestes termos, pede deferimento.\nAssinatura")).toBe("\nNestes termos, pede deferimento.\nAssinatura");
  });
  it("identifica análise por causa ou resumo, inclusive legado vazio", () => {
    expect(analysisDisplayTitle({ tipo_de_causa: "Cancelamento de voo", resumo: "Resumo" })).toBe("Cancelamento de voo");
    expect(analysisDisplayTitle({ resumo: "Cobrança bancária indevida" })).toBe("Cobrança bancária indevida");
    expect(analysisDisplayTitle(null)).toBe("Análise de documentos");
    expect(firstDisplayName("wagner rosati")).toBe("Wagner");
  });
});