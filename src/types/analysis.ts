export interface LegalAnalysis {
  tipo_de_causa: string;
  resumo: string;
  legislacao_aplicavel: Array<{ lei: string; artigos: string[] }>;
  jurisdicao_competente: string;
  direcionamentos: string[];
  portais_relevantes: Array<{ nome: string; url: string }>;
  complexidade: "simples" | "moderado" | "complexo";
  urgencia: boolean;
  prazo_estimado: string;
}

export interface AnalysisRecord {
  id: string;
  user_id: string;
  input_text: string;
  file_name: string | null;
  result: LegalAnalysis;
  created_at: string;
}
