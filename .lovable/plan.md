## Objetivo
Adicionar botões "Exportar PDF" e "Exportar Word" nas telas de Análise Legal (`AnalysisResult`) e Diagnóstico Jurídico, com o mesmo padrão já usado em Petições (`PetitionsTab` usa `jsPDF` + `docx`).

## Escopo

### 1. `src/components/AnalysisResult.tsx`
- Adicionar dois botões na barra de ações (ao lado de "Copiar JSON"): **Exportar PDF** e **Exportar Word**.
- Gerar conteúdo formatado a partir do objeto `LegalAnalysis`:
  - Título: "Análise Jurídica — {tipo_de_causa}"
  - Seções: Resumo, Complexidade/Urgência/Prazo, Pontos Fracos, Riscos Processuais, Fundamentação Sugerida, Legislação Aplicável, Jurisdição, Recomendações, Aviso legal.
- PDF via `jsPDF` (com quebra de linha via `splitTextToSize`, títulos em negrito, controle de página).
- DOCX via `docx` (`Document` + `Paragraph`/`TextRun` com `bold`/`heading`).
- Nome do arquivo: `analise-{slug(tipo_de_causa)}-{yyyy-MM-dd}.pdf|docx`.

### 2. Diagnóstico Jurídico (`src/pages/Diagnostico.tsx` ou componente de resultado)
- Verificar onde o resultado do diagnóstico é renderizado; adicionar os mesmos dois botões de exportação, montando o texto a partir das seções exibidas (para cidadão e advogado).
- Mesmo padrão de nome de arquivo: `diagnostico-{yyyy-MM-dd}.pdf|docx`.

### 3. Helper compartilhado (opcional, para não duplicar)
- Criar `src/lib/exportDocument.ts` com duas funções:
  - `exportToPDF(title: string, sections: {heading: string; body: string}[], filename: string)`
  - `exportToDOCX(title: string, sections: {heading: string; body: string}[], filename: string)`
- Reutilizar em `AnalysisResult` e no resultado do Diagnóstico. `PetitionsTab` fica como está (formato texto puro já funciona).

## Fora do escopo
- Nenhuma mudança em lógica de IA, gates de plano ou billing.
- Sem alterações no backend / edge functions.
- `PetitionsTab` mantém sua implementação atual.

## Como testar no preview
1. Rodar uma Análise em `/` (Index) → clicar em **Exportar PDF** e **Exportar Word** → conferir arquivo baixado com todas as seções.
2. Rodar um Diagnóstico em `/diagnostico` → repetir para os dois formatos, nos perfis Cidadão e Advogado.
3. Abrir os arquivos gerados no leitor de PDF e no Word/Google Docs para confirmar formatação (títulos em negrito, quebras corretas, acentuação preservada).
