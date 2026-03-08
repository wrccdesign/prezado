

# Gerador de Petições Jurídicas

## O que será construído
Uma nova página onde o usuário preenche um formulário com os dados do caso e o sistema gera automaticamente uma petição jurídica completa usando IA, formatada e pronta para download.

## Fluxo do Usuário
1. Usuário acessa "Nova Petição" pelo menu
2. Preenche formulário: tipo de petição, partes (autor/réu), fatos, pedidos, comarca, vara
3. Clica em "Gerar Petição"
4. IA gera o texto completo da petição com formatação jurídica
5. Usuário pode editar, copiar ou baixar como PDF

## Implementação

### Backend
- **Nova tabela `petitions`**: id, user_id, petition_type, form_data (JSONB), generated_text, created_at — com RLS por usuário
- **Edge Function `generate-petition`**: Recebe dados do formulário, usa Gemini com prompt especializado em petições brasileiras (inicial, contestação, recurso, habeas corpus, mandado de segurança, etc.), retorna texto formatado

### Frontend
- **`src/pages/Petition.tsx`**: Formulário com campos para tipo de petição (select), qualificação das partes, fatos, fundamentos, pedidos, comarca/vara
- **`src/components/PetitionResult.tsx`**: Exibe a petição gerada com editor de texto para ajustes e botões de copiar/download
- **Rota `/peticao`** protegida + link no header
- **Histórico de petições** acessível na página de histórico existente ou em aba separada

### Tipos de Petição Suportados
- Petição Inicial (Cível, Trabalhista, Criminal)
- Contestação
- Recurso de Apelação
- Habeas Corpus
- Mandado de Segurança
- Agravo de Instrumento

