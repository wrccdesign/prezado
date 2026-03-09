

# Reformular Exportação PDF/DOCX com Formatação ABNT

## Alterações

### 1. `src/pages/Petition.tsx`
- Passar `petitionType` como prop para `PetitionResult`:
  ```tsx
  <PetitionResult text={generatedText} petitionType={petitionType} onNewPetition={handleNewPetition} />
  ```

### 2. `src/components/PetitionResult.tsx`
Reescrever completamente a lógica de exportação:

**Interface**: adicionar `petitionType: string` às props.

**PDF (jsPDF)**:
- Fonte Times (built-in no jsPDF) 12pt
- Margens ABNT: esquerda 30mm, topo 30mm, direita 20mm, inferior 20mm
- Cabeçalho: "JurisAI" + data de geração em cada página
- Rodapé: "Documento gerado por JurisAI — Revisar antes do protocolo"
- Nome do arquivo: `Peticao_[Tipo]_[YYYY-MM-DD].pdf`

**DOCX (docx)**:
- Fonte Times New Roman 12pt (24 half-points)
- Espaçamento entre linhas: 1.5 (line spacing 360 = 1.5x)
- Margens ABNT via section properties
- Nome do arquivo: `Peticao_[Tipo]_[YYYY-MM-DD].docx`

**Botões**: Mover os botões PDF e DOCX para abaixo do textarea, estilizados com cores azul escuro e azul claro. Manter Copiar e Nova Petição no topo.

**Toast**: "Documento baixado com sucesso!" em ambos os casos.

