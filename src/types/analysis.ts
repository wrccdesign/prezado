export interface LegalAnalysis {
  tipo_de_causa: string;
  resumo: string;
  pontos_fracos?: string[];
  fundamentacao_sugerida?: Array<{ lei: string; artigos: string[] }>;
  legislacao_aplicavel: Array<{ lei: string; artigos: string[] }>;
  riscos_processuais?: string[];
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

export interface PetitionFormData {
  autor?: string;
  reu?: string;
  fatos: string;
  pedidos: string;
  fundamentacao?: string;
  tipo_acao?: string;
  vara_juizo?: string;
}

export interface PetitionRecord {
  id: string;
  user_id: string;
  petition_type: string;
  form_data: PetitionFormData;
  generated_text: string;
  created_at: string;
}
