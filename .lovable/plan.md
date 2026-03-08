
# Assistente Jurídico - Analisador de Textos Legais

## Visão Geral
Aplicação web onde o usuário insere um texto jurídico (digitando ou fazendo upload de PDF/DOCX) e recebe uma análise estruturada com tipo de causa, legislação aplicável, jurisdição, direcionamentos e mais. Histórico salvo com login.

## Páginas e Funcionalidades

### 1. Autenticação (Login/Cadastro)
- Tela de login e cadastro com email/senha
- Proteção de rotas — só usuários logados acessam a análise

### 2. Página Principal — Nova Análise
- Campo de texto grande para colar/digitar o texto jurídico
- Botão de upload de arquivo (PDF, DOCX) com parsing automático do conteúdo
- Botão "Analisar" que envia o texto para a IA
- Indicador de carregamento durante a análise

### 3. Resultado da Análise
- Exibição visual e organizada do JSON retornado:
  - **Tipo de Causa** (badge colorido)
  - **Resumo** (texto claro)
  - **Legislação Aplicável** (lista com lei + artigos específicos)
  - **Jurisdição Competente**
  - **Direcionamentos** (passos numerados)
  - **Portais Relevantes** (links clicáveis)
  - **Complexidade** (indicador visual: simples/moderado/complexo)
  - **Urgência** (badge vermelho se urgente)
  - **Prazo Estimado**
- Botão para copiar o JSON bruto
- Botão para nova análise

### 4. Histórico de Análises
- Lista de análises anteriores do usuário com data, tipo de causa e resumo
- Clicar em uma análise abre o resultado completo
- Opção de excluir análises

## Backend (Lovable Cloud)

### Banco de Dados
- Tabela `analyses`: id, user_id, input_text, file_name, result (JSON), created_at
- RLS para que cada usuário veja apenas suas próprias análises

### Edge Function — `analyze-legal-text`
- Recebe o texto jurídico
- Usa Lovable AI (Gemini) com tool calling para extrair o JSON estruturado com os campos especificados
- Prompt especializado em direito brasileiro, citando artigos específicos do Código Civil, CPC, CDC, CLT, CF/88 etc.
- Salva o resultado no banco e retorna ao frontend

### Edge Function — `parse-document`
- Recebe arquivo PDF/DOCX via upload
- Extrai o texto do documento
- Retorna o texto extraído para o frontend preencher o campo

## Design
- Visual limpo e profissional, tons de azul-marinho e branco
- Cards com bordas suaves para cada seção do resultado
- Responsivo para desktop e mobile
