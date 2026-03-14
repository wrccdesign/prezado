

# Página pública de comparativo de mercado — Prezado.ai

## Objetivo
Criar uma página pública `/comparativo` acessível sem login, com o comparativo do Prezado.ai vs concorrentes (JusBrasil, Themis, Advbox, ChatGPT genérico), servindo como material de marketing compartilhável.

## Estrutura da página

### 1. Hero Section
- Título: "Por que o Prezado.ai?"
- Subtítulo com proposta de valor
- CTA para cadastro

### 2. Tabela comparativa
Colunas: Prezado.ai | JusBrasil | Themis/Advbox | ChatGPT genérico
Linhas: Diagnóstico jurídico, Geração de petições, Chat com legislação, Jurisprudência real, Calculadoras trabalhistas, Painel do advogado, Linguagem acessível ao cidadão, Fontes oficiais verificadas, Exportação PDF/DOCX ABNT, Preço acessível
- Checkmarks verdes para Prezado.ai, indicadores parciais/ausentes para concorrentes

### 3. Seção de diferenciais (cards)
- Plataforma integrada (tudo em um)
- Público híbrido (advogado + cidadão)
- IA com fontes oficiais (anti-alucinação)
- 100% brasileiro

### 4. CTA final
- Botão de cadastro + botão de compartilhar página

### 5. Footer (reutilizar AppFooter existente)

## Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/pages/Comparativo.tsx` |
| Editar | `src/App.tsx` — adicionar rota pública `/comparativo` |

## Detalhes técnicos
- Rota pública (sem `ProtectedRoute`), como `/jurisprudencia`
- Reutilizar padrões visuais da `LandingPage.tsx` (cores navy/gold, scroll reveal, responsivo)
- Incluir `AppFooter`
- Botão de compartilhar usa `navigator.share` com fallback para copiar URL
- Sem dependências novas

