

# Instalar jsPDF e docx

## Alterações

### `package.json`
Adicionar duas dependências:
- `jspdf` (geração de PDF)
- `docx` (geração de .docx)

### `src/components/PetitionResult.tsx`
Substituir o download .txt atual por dois botões: **Baixar PDF** e **Baixar DOCX**, usando as novas bibliotecas para gerar os arquivos a partir do texto da petição editada.

- **PDF**: criar documento com `jsPDF`, adicionar texto com quebra de linha automática
- **DOCX**: criar documento com `docx` (Document, Paragraph, TextRun), gerar blob via `Packer.toBlob()`

Manter o botão Copiar existente.

