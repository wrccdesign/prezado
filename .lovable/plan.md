

# Formatação Jurídica Estruturada nos Documentos PDF e DOCX

## Abordagem

O texto gerado pela IA já contém seções como "DOS FATOS", "DO DIREITO", "DOS PEDIDOS", cabeçalho com endereçamento ao juízo, e fecho com local/data. A estratégia é **parsear o texto da petição por padrões** para identificar essas seções e aplicar formatação diferenciada na exportação.

## Parsing do Texto

Criar uma função `parsePetitionSections(text)` que analisa linha a linha e classifica cada bloco:

- **Cabeçalho do juízo**: Linhas iniciais (EXCELENTÍSSIMO...) — centralizado, negrito
- **Títulos de seção**: Linhas que contêm padrões como "DOS FATOS", "DO DIREITO", "DOS PEDIDOS", "DA TUTELA", "DO VALOR" (regex para caixa alta com "DO/DA/DOS/DAS") — caixa alta, negrito, centralizado
- **Nomes das partes**: Linhas contendo "AUTOR", "REQUERENTE", "RÉU", "REQUERIDO" no início — negrito no nome
- **Corpo normal**: Demais linhas — recuo de 1,25cm na primeira linha, justificado, espaçamento 1,5
- **Fecho**: Linhas finais com local/data, assinatura — alinhamento à direita, linha de assinatura

## Alterações

### `src/components/PetitionResult.tsx`

1. **Nova função `parsePetitionLines(text)`**: Retorna array de objetos `{ text, type }` onde type pode ser `header`, `section-title`, `party`, `body`, `closing`, `signature`, `warning`.

2. **`handleDownloadPDF` reformulado**:
   - Iterar sobre as linhas parseadas
   - `header` → Times Bold 13pt, centralizado
   - `section-title` → Times Bold 12pt, caixa alta, centralizado
   - `party` → Negrito nos nomes, recuo padrão
   - `body` → Times Normal 12pt, recuo 1,25cm na primeira linha (margin + 12.5mm), justificado via `splitTextToSize`
   - `closing` → Alinhado à direita
   - Rodapé de página: aviso JurisAI + linha para assinatura + nome/OAB

3. **`handleDownloadDocx` reformulado**:
   - Usar `AlignmentType.CENTER` para cabeçalho e títulos de seção
   - `AlignmentType.JUSTIFIED` para corpo
   - `AlignmentType.RIGHT` para fecho
   - `indent: { firstLine: 709 }` (1,25cm em twips) para parágrafos de corpo
   - `bold: true` para títulos e nomes de partes
   - Footer com linha de assinatura, nome advogado/OAB, e aviso JurisAI

4. **Props**: Manter a interface atual (text, petitionType, onNewPetition) — os dados de comarca/advogado serão extraídos do texto parseado.

### Sem alterações em outros arquivos
A lógica é inteiramente no componente de exportação; o texto do textarea continua editável em texto plano.

